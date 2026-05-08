package com.olivia.backend.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.olivia.backend.dto.AuthDTOs.AuthResponse;
import com.olivia.backend.dto.AuthDTOs.RegisterRequest;
import com.olivia.backend.dto.AuthDTOs.SocialCompleteRequest;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.exceptions.UnauthorizedActionException;
import com.olivia.backend.model.Role;
import com.olivia.backend.model.User;
import com.olivia.backend.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import com.olivia.backend.service.FileService;
import com.olivia.backend.service.EmailService;

@Slf4j
@Service
public class AuthService {

    @Autowired
    private FileService fileService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserRepository userRepository;

    public String register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase();
        log.info("[Auth] Starting registration for: {}", normalizedEmail);
        
        try {
            // Check if user already exists
            if (userRepository.findByEmail(normalizedEmail).isPresent()) {
                throw new BusinessLogicException("A user with this email already exists: " + normalizedEmail);
            }

            // 1. Create user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(normalizedEmail)
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFullName());

            log.info("[Auth] Creating UserRecord in Firebase...");
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(createRequest);
            log.info("[Auth] UserRecord created with UID: {}", userRecord.getUid());

            // 2. Set custom claims for RBAC
            Role registrationRole = (request.getRole() != null) ? request.getRole() : Role.OUVRIER_RECOLTE;
            // Force OUVRIER_RECOLTE for public registration as per requirements
            registrationRole = Role.OUVRIER_RECOLTE;
            
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", registrationRole.name());
            log.info("[Auth] Setting custom claims (role: {})...", registrationRole);
            try {
            FirebaseAuth.getInstance().setCustomUserClaims(userRecord.getUid(), claims);
        } catch (FirebaseAuthException e) {
            log.warn("[Auth] Failed to set custom claims for UID {}: {}", userRecord.getUid(), e.getMessage());
            throw new BusinessLogicException("Failed to set custom claims: " + e.getMessage());
        }

            // 3. Save extra info in Firestore
            log.info("[Firestore] Saving user profile to 'users' collection...");
            User user = new User();
            user.setId(userRecord.getUid());
            user.setEmail(normalizedEmail);
            user.setPassword(request.getPassword()); 
            user.setFullName(request.getFullName());
            user.setRole(registrationRole);
            user.setActive(true);

            userRepository.save(user);
            log.info("[Firestore] User profile saved successfully.");

            // 4. Send Welcome Email
            try {
                Map<String, Object> emailVars = new HashMap<>();
                emailVars.put("userName", user.getFullName());
                emailVars.put("userRole", user.getRole().toString());
                emailVars.put("tempPassword", request.getPassword());
                emailService.sendHtmlEmail(user.getEmail(), "Welcome to Olivia Cooperative", "emails/welcome", emailVars);
            } catch (Exception emailEx) {
                log.warn("[Auth] Welcome email failed but registration succeeded: {}", emailEx.getMessage());
            }

            return "User registered successfully";
        } catch (BusinessLogicException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Auth] Registration failed: {}", e.getMessage(), e);
            throw new BusinessLogicException("Registration failed: " + e.getMessage());
        }
    }

    public AuthResponse login(String idToken) {
        log.info("[Auth] Verifying login token...");
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String normalizedEmail = decodedToken.getEmail().toLowerCase();
            log.info("[Auth] Token verified for: {}", normalizedEmail);

            UserRecord userRecord = FirebaseAuth.getInstance().getUser(decodedToken.getUid());
            String photoUrl = userRecord.getPhotoUrl();
            String localAvatarPath = null;

            if (photoUrl != null) {
                String fileName = fileService.saveAvatarFromUrl(photoUrl, decodedToken.getUid());
                if (fileName != null) {
                    localAvatarPath = "/uploads/avatars/" + fileName;
                }
            }

            User user = userRepository.findByEmail(normalizedEmail).orElse(null);

            if (user != null) {
                if (!user.isActive()) {
                    log.warn("[Auth] Login denied. Account suspended for: {}", normalizedEmail);
                    throw new UnauthorizedActionException("Your account is suspended. Contact the Director.");
                }
                log.info("[Auth] Login successful for: {}", user.getFullName());
                return new AuthResponse(
                        user.getId(),
                        idToken,
                        normalizedEmail,
                        user.getFullName(),
                        user.getRole(),
                        user.isActive(),
                        user.getAvatarUrl(),
                        false
                );
            }

            Role fallbackRole = extractRoleFromClaims(decodedToken);
            boolean needsProfile = fallbackRole == null;
            String fallbackName = userRecord.getDisplayName() != null ? userRecord.getDisplayName() : normalizedEmail;
            log.warn("[Auth] Login fallback mode for {} (needsProfile={}, role={})", normalizedEmail, needsProfile, fallbackRole);
            return new AuthResponse(
                    decodedToken.getUid(),
                    idToken,
                    normalizedEmail,
                    fallbackName,
                    fallbackRole,
                    true,
                    localAvatarPath,
                    needsProfile
            );
        } catch (UnauthorizedActionException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Auth] Login verification failed: {}", e.getMessage());
            throw new UnauthorizedActionException("Login failed: " + e.getMessage());
        }
    }

    private Role extractRoleFromClaims(FirebaseToken decodedToken) {
        try {
            Object roleObj = decodedToken.getClaims().get("role");
            if (roleObj == null) {
                return null;
            }
            String roleRaw = roleObj.toString().trim().toUpperCase();
            return Role.valueOf(roleRaw);
        } catch (Exception e) {
            log.warn("[Auth] Could not map role claim for UID {}: {}", decodedToken.getUid(), e.getMessage());
            return null;
        }
    }

    public AuthResponse completeSocialRegistration(SocialCompleteRequest request) {
        log.info("[Auth] Finalizing social registration for role: {}", request.getRole());
        try {
            FirebaseToken decodedToken = FirebaseAuth.getInstance().verifyIdToken(request.getIdToken());
            
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail().toLowerCase();

            Role finalRole = (request.getRole() != null) ? request.getRole() : Role.OUVRIER_RECOLTE;
            // Force OUVRIER_RECOLTE for social completion as well
            finalRole = Role.OUVRIER_RECOLTE;

            Map<String, Object> claims = new HashMap<>();
            claims.put("role", finalRole.name());
            try {
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
        } catch (FirebaseAuthException e) {
            log.warn("[Auth] Failed to set custom claims for UID {}: {}", uid, e.getMessage());
            throw new BusinessLogicException("Failed to set custom claims: " + e.getMessage());
        }

            UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
            String photoUrl = userRecord.getPhotoUrl();
            String localAvatarPath = null;

            if (photoUrl != null) {
                String fileName = fileService.saveAvatarFromUrl(photoUrl, uid);
                if (fileName != null) {
                    localAvatarPath = "/uploads/avatars/" + fileName;
                }
            }

            User user = new User();
            user.setId(uid);
            user.setEmail(email);
            user.setFullName(request.getFullName());
            user.setRole(finalRole);
            user.setActive(true);
            user.setAvatarUrl(localAvatarPath);

            userRepository.save(user);
            log.info("[Firestore] Social profile complete for: {}", email);

            return new AuthResponse(uid, request.getIdToken(), email, user.getFullName(), user.getRole(), true, user.getAvatarUrl(), false);
        } catch (Exception e) {
            log.error("[Auth] Social completion failed: {}", e.getMessage());
            throw new BusinessLogicException("Social registration completion failed: " + e.getMessage());
        }
    }

    public String extractUserIdFromToken() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName(); 
            }
        } catch (Exception e) {
            log.error("[Auth] Failed to extract UID from security context: {}", e.getMessage());
        }
        return null;
    }

    public void deleteUser(String uid) {
        log.info("[Auth] Deleting user from Firebase Auth and Firestore: {}", uid);
        try {
            FirebaseAuth.getInstance().deleteUser(uid);
            userRepository.deleteById(uid);
        } catch (Exception e) {
            log.error("[Auth] Deletion failed for UID {}: {}", uid, e.getMessage());
            throw new BusinessLogicException("Failed to delete user: " + e.getMessage());
        }
    }

    public void sendForgotPasswordEmail(String email) {
        log.info("[Auth] Generating password reset link for: {}", email);
        try {
            String resetLink = FirebaseAuth.getInstance().generatePasswordResetLink(email);
            
            Map<String, Object> emailVars = new HashMap<>();
            emailVars.put("resetLink", resetLink);
            
            emailService.sendHtmlEmail(email, "Account Recovery Request", "emails/forgot-password", emailVars);
            log.info("[Auth] Password reset email dispatched to: {}", email);
        } catch (Exception e) {
            log.error("[Auth] Failed to generate reset link: {}", e.getMessage());
            throw new BusinessLogicException("Could not process password recovery. Ensure the email is registered.");
        }
    }
}

