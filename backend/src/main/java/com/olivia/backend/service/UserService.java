package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.User;
import com.olivia.backend.model.Role;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

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

    public void updateProfile(User user) throws Exception {
        if (user.getEmail() != null) {
            user.setEmail(user.getEmail().toLowerCase());
        }
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(user.getId()).set(user).get();
    }

    public void updateRole(String id, Role role) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(id).update("role", role).get();
    }

    public void toggleStatus(String id, boolean active) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        db.collection("users").document(id).update("active", active).get();
    }
}