package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class UserRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "users";

    public List<User> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        User u = d.toObject(User.class);
                        u.setId(d.getId());
                        return u;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all users: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<User> findByEmail(String email) {
        try {
            var docs = db.collection(COLLECTION).whereEqualTo("email", email.toLowerCase().trim())
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            if (!docs.isEmpty()) {
                var d = docs.get(0);
                User u = d.toObject(User.class);
                u.setId(d.getId());
                return Optional.of(u);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find user by email: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<User> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                User u = doc.toObject(User.class);
                u.setId(doc.getId());
                return Optional.ofNullable(u);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find user by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(User user) {
        try {
            db.collection(COLLECTION).document(user.getId()).set(user).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save user {}: {}", user.getId(), e.getMessage());
            throw new RuntimeException("Failed to save user", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update user field: {}", e.getMessage());
            throw new RuntimeException("Failed to update user field", e);
        }
    }
}
