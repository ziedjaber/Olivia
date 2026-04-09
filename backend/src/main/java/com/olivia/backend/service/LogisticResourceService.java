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

    private static final String COLLECTION_NAME = "logistic_resources";

    public List<LogisticResource> getAllResources() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            List<LogisticResource> resources = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                resources.add(document.toObject(LogisticResource.class));
            }
            return resources;
        } catch (Exception e) {
            log.error("Error fetching all logistic resources: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<LogisticResource> getResourceById(String id) {
        if (id == null) return Optional.empty();
        try {
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection(COLLECTION_NAME).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                return Optional.ofNullable(doc.toObject(LogisticResource.class));
            }
        } catch (Exception e) {
            log.error("Error fetching logistic resource by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public LogisticResource createResource(LogisticResource resource) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (resource.getId() == null || resource.getId().isEmpty()) {
                resource.setId(UUID.randomUUID().toString());
            }
            // Generating a minimal internal SKU if not provided
            if (resource.getSku() == null || resource.getSku().isEmpty()) {
                resource.setSku("#RES-" + (100 + new Random().nextInt(900)));
            }

            Map<String, Object> data = new HashMap<>();
            data.put("id", resource.getId());
            data.put("sku", resource.getSku());
            data.put("name", resource.getName());
            data.put("type", resource.getType());
            data.put("description", resource.getDescription());
            data.put("pricePerHour", resource.getPricePerHour());
            data.put("images", resource.getImages() != null ? resource.getImages() : new ArrayList<>());
            data.put("stockLevel", resource.getStockLevel());
            data.put("location", resource.getLocation());
            data.put("status", resource.getStatus());

            String resourceId = resource.getId();
            db.collection(COLLECTION_NAME).document(resourceId).set(data).get(30, TimeUnit.SECONDS);
            log.info("Successfully saved logistic resource {} to Firestore", resourceId);
            return resource;
        } catch (Exception e) {
            log.error("Error creating logistic resource: {}", e.getMessage());
            throw new RuntimeException("Failed to save LogisticResource to Firestore", e);
        }
    }

    public LogisticResource updateResource(String id, LogisticResource resource) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            Firestore db = FirestoreClient.getFirestore();
            resource.setId(id);

            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("sku", resource.getSku());
            data.put("name", resource.getName());
            data.put("type", resource.getType());
            data.put("description", resource.getDescription());
            data.put("pricePerHour", resource.getPricePerHour());
            data.put("images", resource.getImages() != null ? resource.getImages() : new ArrayList<>());
            data.put("stockLevel", resource.getStockLevel());
            data.put("location", resource.getLocation());
            data.put("status", resource.getStatus());

            db.collection(COLLECTION_NAME).document(id).set(data).get(30, TimeUnit.SECONDS);
            return resource;
        } catch (Exception e) {
            log.error("Error updating logistic resource {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update LogisticResource in Firestore", e);
        }
    }

    public void deleteResource(String id) {
        if (id == null) return;
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error deleting logistic resource {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete LogisticResource from Firestore", e);
        }
    }
}
