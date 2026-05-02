package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.model.LogisticResource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class LogisticResourceRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "logistic_resources";

    public List<LogisticResource> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        LogisticResource r = d.toObject(LogisticResource.class);
                        r.setId(d.getId());
                        return r;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch all logistic resources: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<LogisticResource> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                LogisticResource r = doc.toObject(LogisticResource.class);
                r.setId(doc.getId());
                return Optional.ofNullable(r);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find logistic resource by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(LogisticResource resource) {
        try {
            db.collection(COLLECTION).document(resource.getId()).set(resource).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save logistic resource: {}", e.getMessage());
            throw new RuntimeException("Failed to save logistic resource", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete logistic resource: {}", e.getMessage());
        }
    }
}
