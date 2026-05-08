package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.MillingCenter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class MillingCenterRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "milling_centers";

    public List<MillingCenter> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        MillingCenter m = d.toObject(MillingCenter.class);
                        m.setId(d.getId());
                        return m;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find all milling centers: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<MillingCenter> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                MillingCenter m = doc.toObject(MillingCenter.class);
                m.setId(doc.getId());
                return Optional.of(m);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find milling center by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(MillingCenter center) {
        try {
            db.collection(COLLECTION).document(center.getId()).set(center).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save milling center: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save milling center", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete milling center: {}", e.getMessage());
            throw new BusinessLogicException("Failed to delete milling center", e);
        }
    }
}
