package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.LogisticResource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class LogisticResourceService {

    @org.springframework.beans.factory.annotation.Autowired
    private Firestore db;

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    private UserService userService;

    private static final String COLLECTION_NAME = "logistic_resources";

    public List<LogisticResource> getAllResources() {
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            List<LogisticResource> resources = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                LogisticResource r = document.toObject(LogisticResource.class);
                if (r.getId() == null) r.setId(document.getId());
                resources.add(r);
            }
            return resources;
        } catch (Exception e) {
            log.error("Error fetching all logistic resources: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<LogisticResource> getResourceById(String id) {
        if (id == null)
            return Optional.empty();
        try {
            var doc = db.collection(COLLECTION_NAME).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                LogisticResource r = doc.toObject(LogisticResource.class);
                if (r != null && r.getId() == null) r.setId(doc.getId());
                return Optional.ofNullable(r);
            }
        } catch (Exception e) {
            log.error("Error fetching logistic resource by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public LogisticResource createResource(LogisticResource resource) {
        try {
            if (resource.getId() == null || resource.getId().isEmpty()) {
                resource.setId(UUID.randomUUID().toString());
            }
            // Generating a minimal internal SKU if not provided
            if (resource.getSku() == null || resource.getSku().isEmpty()) {
                resource.setSku("#RES-" + (100 + new Random().nextInt(900)));
            }

            db.collection(COLLECTION_NAME).document(resource.getId()).set(resource).get(30, TimeUnit.SECONDS);
            log.info("Successfully saved logistic resource {} to Firestore", resource.getId());
            return resource;
        } catch (Exception e) {
            log.error("Error creating logistic resource: {}", e.getMessage());
            throw new RuntimeException("Failed to save LogisticResource to Firestore", e);
        }
    }

    public LogisticResource updateResource(String id, LogisticResource resource) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            resource.setId(id);
            db.collection(COLLECTION_NAME).document(id).set(resource).get(30, TimeUnit.SECONDS);

            // 3. Low Stock Alert
            if (resource.getStockLevel() < 10) {
                try {
                    userService.getAllUsers().stream()
                            .filter(u -> "RESPONSABLE_LOGISTIQUE".equals(u.getRole().name()))
                            .findFirst()
                            .ifPresent(manager -> {
                                java.util.Map<String, Object> vars = new java.util.HashMap<>();
                                vars.put("resourceName", resource.getName());
                                vars.put("currentStock", resource.getStockLevel());
                                vars.put("minThreshold", 10);
                                emailService.sendHtmlEmail(manager.getEmail(), "CRITICAL STOCK ALERT: " + resource.getName(), "emails/low-stock", vars);
                            });
                } catch (Exception emailEx) {
                    log.warn("Failed to dispatch low stock email: {}", emailEx.getMessage());
                }
            }


            return resource;
        } catch (Exception e) {
            log.error("Error updating logistic resource {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update LogisticResource in Firestore", e);
        }
    }

    public void deleteResource(String id) {
        if (id == null) return;
        try {
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error deleting logistic resource {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete LogisticResource from Firestore", e);
        }
    }
}
