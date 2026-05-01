package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Trituration;
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
public class TriturationService {

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    private UserService userService;

    private static final String COLLECTION = "triturations";

    public List<Trituration> getAllTriturations() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Trituration.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching triturations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Trituration> getTriturationById(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) return Optional.ofNullable(doc.toObject(Trituration.class));
        } catch (Exception e) {
            log.error("Error fetching trituration {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Trituration saveTrituration(Trituration trituration) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (trituration.getId() == null || trituration.getId().isEmpty()) {
                trituration.setId(UUID.randomUUID().toString());
            }
            if (trituration.getStatus() == null) {
                trituration.setStatus("PLANNED");
            }

            // Sync millName if millId is provided but name is missing
            // (This will be handled better by the frontend, but good for safety)
            
            db.collection(COLLECTION).document(trituration.getId()).set(trituration).get(30, TimeUnit.SECONDS);
            log.info("Trituration {} successfully persisted", trituration.getId());

            // 4. Send Email if Completed
            if ("COMPLETED".equals(trituration.getStatus())) {
                try {
                    // Fetch Director's email (Assuming there's at least one)
                    userService.getAllUsers().stream()
                            .filter(u -> "DIRECTEUR".equals(u.getRole().name()))
                            .findFirst()
                            .ifPresent(director -> {
                                java.util.Map<String, Object> vars = new java.util.HashMap<>();
                                vars.put("userName", director.getFullName());
                                vars.put("oilVolume", trituration.getOilProducedLiters());
                                vars.put("qualityGrade", trituration.getQuality());
                                vars.put("orchardName", trituration.getMillName()); // Using mill name as origin for now
                                emailService.sendHtmlEmail(director.getEmail(), "Oil Production Ready: " + trituration.getId(), "emails/production-ready", vars);
                            });
                } catch (Exception emailEx) {
                    log.warn("Failed to dispatch production email: {}", emailEx.getMessage());
                }
            }

            return trituration;
        } catch (Exception e) {
            log.error("Failed to persist trituration {}: {}", trituration.getId(), e.getMessage());
            throw new RuntimeException("Persistence failure: " + e.getMessage(), e);
        }
    }

    public void deleteTrituration(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Trituration {} deleted", id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete trituration: " + e.getMessage(), e);
        }
    }
}
