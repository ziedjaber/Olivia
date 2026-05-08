package com.olivia.backend.service;

import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.User;
import com.olivia.backend.model.Role;
import com.olivia.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private final AuthService authService;
    private final AuditService auditService;
    
    @Autowired
    private NotificationService notificationService;

    public UserService(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getProfile(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    public void updateProfile(User user) {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().toLowerCase());
        }
        userRepository.save(user);
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid != null ? currentUid : user.getId(), "UPDATE", "USERS", "Updated profile: " + user.getFullName(), user.getId());
    }

    public void updateRole(String id, Role role) {
        userRepository.updateField(id, "role", role);
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", "Changed user role to " + role, id);

        // NOTIFICATION: Directeur
        notificationService.notifyRole(Role.DIRECTEUR, "Changement de Rôle", "L'utilisateur " + id + " a maintenant le rôle: " + role, "INFO");
    }

    public void toggleStatus(String id, boolean active) {
        userRepository.updateField(id, "active", active);
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", (active ? "Activated" : "Suspended") + " user account", id);

        // NOTIFICATION: Directeur
        notificationService.notifyRole(Role.DIRECTEUR, "Statut Compte Modifié", "Le compte " + id + " a été " + (active ? "activé" : "suspendu"), "WARNING");
    }

    public void deleteUser(String id) {
        authService.deleteUser(id);
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "DELETE", "USERS", "Permanently deleted user account", id);

        // NOTIFICATION: Directeur
        notificationService.notifyRole(Role.DIRECTEUR, "Compte Supprimé", "Le compte utilisateur " + id + " a été définitivement supprimé.", "ERROR");
    }

    public void updateUserByAdmin(User user) {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().toLowerCase());
        }
        userRepository.save(user);
        
                // Update custom claims if role changed
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        try {
            com.google.firebase.auth.FirebaseAuth.getInstance().setCustomUserClaims(user.getId(), claims);
        } catch (com.google.firebase.auth.FirebaseAuthException e) {
            log.warn("[UserService] Failed to set custom claims for user {}: {}", user.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to update user claims: " + e.getMessage());
        }
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", "Admin update of user: " + user.getFullName(), user.getId());
    }
}
