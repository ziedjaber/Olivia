package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.User;
import com.olivia.backend.model.Role;
import org.springframework.stereotype.Service;
import java.util.List;

import java.util.Map;
import java.util.HashMap;

import java.util.stream.Collectors;

@Service
public class UserService {
    private final AuthService authService;
    private final AuditService auditService;

    public UserService(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }


    public List<User> getAllUsers() throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        return db.collection("users").get().get().getDocuments().stream()
                .map(doc -> {
                    User u = doc.toObject(User.class);
                    u.setId(doc.getId());
                    return u;
                })
                .collect(Collectors.toList());
    }

    public User getProfile(String email) throws Exception {
        String normalizedEmail = email.toLowerCase();
        Firestore db = FirestoreClient.getFirestore();
        var docs = db.collection("users").whereEqualTo("email", normalizedEmail).get().get().getDocuments();
        if (docs.isEmpty()) {
            throw new Exception("User not found: " + normalizedEmail);
        }
        var doc = docs.get(0);
        User user = doc.toObject(User.class);
        user.setId(doc.getId());
        return user;
    }

    public User getUserById(String id) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        var doc = db.collection("users").document(id).get().get();
        if (!doc.exists()) {
            throw new Exception("User not found with ID: " + id);
        }
        User user = doc.toObject(User.class);
        user.setId(doc.getId());
        return user;
    }

    public void updateProfile(User user) throws Exception {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().toLowerCase());
        }
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(user.getId()).set(user).get();
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid != null ? currentUid : user.getId(), "UPDATE", "USERS", "Updated profile: " + user.getFullName(), user.getId());

    }

    public void updateRole(String id, Role role) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(id).update("role", role).get();
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", "Changed user role to " + role, id);
    }

    public void toggleStatus(String id, boolean active) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(id).update("active", active).get();
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", (active ? "Activated" : "Suspended") + " user account", id);
    }

    public void deleteUser(String id) throws Exception {
        authService.deleteUser(id);
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "DELETE", "USERS", "Permanently deleted user account", id);
    }

    public void updateUserByAdmin(User user) throws Exception {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().toLowerCase());
        }
        Firestore db = FirestoreClient.getFirestore();
        // Update Firestore
        db.collection("users").document(user.getId()).set(user).get();
        
        // Update custom claims if role changed
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", user.getRole().name());
        com.google.firebase.auth.FirebaseAuth.getInstance().setCustomUserClaims(user.getId(), claims);
        
        String currentUid = authService.extractUserIdFromToken();
        auditService.log(currentUid, "UPDATE", "USERS", "Admin update of user: " + user.getFullName(), user.getId());

    }
}