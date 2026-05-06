package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.MillingCenter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MillingCenterService {

    @org.springframework.beans.factory.annotation.Autowired
    private com.google.cloud.firestore.Firestore db;

    private static final String COLLECTION = "milling_centers";

    public List<MillingCenter> getAllCenters() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> {
                        MillingCenter m = d.toObject(MillingCenter.class);
                        if (m.getId() == null) m.setId(d.getId());
                        return m;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching milling centers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<MillingCenter> getCenterById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                MillingCenter m = doc.toObject(MillingCenter.class);
                if (m != null && m.getId() == null) m.setId(doc.getId());
                return Optional.ofNullable(m);
            }
        } catch (Exception e) {
            log.error("Error fetching center {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public MillingCenter saveCenter(MillingCenter center) {
        try {
            if (center.getId() == null || center.getId().isEmpty()) {
                center.setId(UUID.randomUUID().toString());
            }
            if (center.getStatus() == null) {
                center.setStatus("ACTIVE");
            }

            db.collection(COLLECTION).document(center.getId()).set(center).get(30, TimeUnit.SECONDS);
            log.info("Milling Center {} saved", center.getId());
            return center;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save milling center: " + e.getMessage(), e);
        }
    }

    public void deleteCenter(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Milling Center {} deleted", id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete milling center: " + e.getMessage(), e);
        }
    }
}
