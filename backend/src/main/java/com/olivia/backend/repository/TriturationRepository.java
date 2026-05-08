package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Trituration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class TriturationRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "triturations";

    public List<Trituration> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Trituration t = d.toObject(Trituration.class);
                        if (t != null && t.getId() == null) t.setId(d.getId());
                        return t;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find all triturations: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<Trituration> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Trituration t = doc.toObject(Trituration.class);
                if (t != null && t.getId() == null) t.setId(doc.getId());
                return Optional.ofNullable(t);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find trituration by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Trituration trituration) {
        try {
            db.collection(COLLECTION).document(trituration.getId()).set(trituration).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save trituration: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save trituration", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete trituration: {}", e.getMessage());
            throw new BusinessLogicException("Failed to delete trituration", e);
        }
    }
}
