package com.olivia.backend.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import com.olivia.backend.dto.AuthDTOs.*;
import com.olivia.backend.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AuthService {

    @org.springframework.beans.factory.annotation.Autowired
    private FileService fileService;

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    public String register(RegisterRequest request) throws Exception {
        String normalizedEmail = request.getEmail().toLowerCase();
        log.info("[Auth] Starting registration for: {}", normalizedEmail);
        
        try {
            // 1. Create user in Firebase Auth
            UserRecord.CreateRequest createRequest = new UserRecord.CreateRequest()
                    .setEmail(normalizedEmail)
                    .setPassword(request.getPassword())
                    .setDisplayName(request.getFullName());

            log.info("[Auth] Creating UserRecord in Firebase...");
            UserRecord userRecord = FirebaseAuth.getInstance().createUser(createRequest);
            log.info("[Auth] UserRecord created with UID: {}", userRecord.getUid());

            // 2. Set custom claims for RBAC
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", request.getRole().name());
            log.info("[Auth] Setting custom claims (role: {})...", request.getRole());
            FirebaseAuth.getInstance().setCustomUserClaims(userRecord.getUid(), claims);

            // 3. Save extra info in Firestore
            log.info("[Firestore] Saving user profile to 'users' collection...");
            Firestore db = FirestoreClient.getFirestore();
            User user = new User();
            user.setId(userRecord.getUid());
            user.setEmail(normalizedEmail);
            user.setPassword(request.getPassword()); // Storing password in Firestore profile as requested
            user.setFullName(request.getFullName());
            user.setRole(request.getRole());
            user.setActive(true);

            // Using .get(30, TimeUnit.SECONDS) to prevent infinite hang if Firestore is unreachable
            db.collection("users").document(user.getId()).set(user).get(30, TimeUnit.SECONDS);
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
        } catch (Exception e) {
            log.error("[Auth] Registration failed: {}", e.getMessage(), e);
            throw e;
        }
    }

    public AuthResponse login(String idToken) throws Exception {
        log.info("[Auth] Verifying login token...");
        try {
            // 1. Verify the token provided by the frontend
            com.google.firebase.auth.FirebaseToken decodedToken = 
                com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(idToken);
            String normalizedEmail = decodedToken.getEmail().toLowerCase();
            log.info("[Auth] Token verified for: {}", normalizedEmail);

            // 2. Fetch user from Firestore
            com.google.cloud.firestore.Firestore db = com.google.firebase.cloud.FirestoreClient.getFirestore();
            log.info("[Firestore] Searching for user profile: {}", normalizedEmail);
            com.google.cloud.firestore.QuerySnapshot query = 
                db.collection("users").whereEqualTo("email", normalizedEmail).get().get(30, TimeUnit.SECONDS);
            
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(decodedToken.getUid());
            String photoUrl = userRecord.getPhotoUrl();
            String localAvatarPath = null;

            if (photoUrl != null) {
                String fileName = fileService.saveAvatarFromUrl(photoUrl, decodedToken.getUid());
                if (fileName != null) {
                    localAvatarPath = "/uploads/avatars/" + fileName;
                }
            }

            if (query.isEmpty()) {
                log.info("[Auth] Initial social login detected for: {}", normalizedEmail);
                return new AuthResponse(decodedToken.getUid(), idToken, normalizedEmail, 
                    userRecord.getDisplayName(), null, true, localAvatarPath, true);
            }

            User user = query.getDocuments().get(0).toObject(User.class);
            
            if (!user.isActive()) {
                log.warn("[Auth] Login denied. Account suspended for: {}", normalizedEmail);
                throw new Exception("Your account is suspended. Contact the Director.");
            }

            log.info("[Auth] Login successful for: {}", user.getFullName());

            return new AuthResponse(user.getId(), idToken, normalizedEmail, user.getFullName(), user.getRole(), user.isActive(), user.getAvatarUrl(), false);
        } catch (Exception e) {
            log.error("[Auth] Login verification failed: {}", e.getMessage());
            throw e;
        }
    }

    public AuthResponse completeSocialRegistration(SocialCompleteRequest request) throws Exception {
        log.info("[Auth] Finalizing social registration for role: {}", request.getRole());
        try {
            com.google.firebase.auth.FirebaseToken decodedToken = 
                com.google.firebase.auth.FirebaseAuth.getInstance().verifyIdToken(request.getIdToken());
            
            String uid = decodedToken.getUid();
            String email = decodedToken.getEmail().toLowerCase();

            // 1. Set custom claims for RBAC
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", request.getRole().name());
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);

            UserRecord userRecord = FirebaseAuth.getInstance().getUser(uid);
            String photoUrl = userRecord.getPhotoUrl();
            String localAvatarPath = null;

            if (photoUrl != null) {
                String fileName = fileService.saveAvatarFromUrl(photoUrl, uid);
                if (fileName != null) {
                    localAvatarPath = "/uploads/avatars/" + fileName;
                }
            }

            // 2. Save user profile in Firestore
            Firestore db = FirestoreClient.getFirestore();
            User user = new User();
            user.setId(uid);
            user.setEmail(email);
            user.setFullName(request.getFullName());
            user.setRole(request.getRole());
            user.setActive(true);
            user.setAvatarUrl(localAvatarPath);

            db.collection("users").document(uid).set(user).get(30, TimeUnit.SECONDS);
            log.info("[Firestore] Social profile complete for: {}", email);

            return new AuthResponse(uid, request.getIdToken(), email, user.getFullName(), user.getRole(), true, user.getAvatarUrl(), false);
        } catch (Exception e) {
            log.error("[Auth] Social completion failed: {}", e.getMessage());
            throw e;
        }
    }
    public String extractUserIdFromToken() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                return auth.getName(); // The principal in our JwtFilter is the UID
            }
        } catch (Exception e) {
            log.error("[Auth] Failed to extract UID from security context: {}", e.getMessage());
        }
        return null;
    }

    public void deleteUser(String uid) throws Exception {
        log.info("[Auth] Deleting user from Firebase Auth and Firestore: {}", uid);
        FirebaseAuth.getInstance().deleteUser(uid);
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(uid).delete().get(30, TimeUnit.SECONDS);
    }

    public void sendForgotPasswordEmail(String email) throws Exception {
        log.info("[Auth] Generating password reset link for: {}", email);
        try {
            String resetLink = FirebaseAuth.getInstance().generatePasswordResetLink(email);
            
            Map<String, Object> emailVars = new HashMap<>();
            emailVars.put("resetLink", resetLink);
            
            emailService.sendHtmlEmail(email, "Account Recovery Request", "emails/forgot-password", emailVars);
            log.info("[Auth] Password reset email dispatched to: {}", email);
        } catch (Exception e) {
            log.error("[Auth] Failed to generate reset link: {}", e.getMessage());
            throw new Exception("Could not process password recovery. Ensure the email is registered.");
        }
    }
}
