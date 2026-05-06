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
    private Firestore db;

    @org.springframework.beans.factory.annotation.Autowired
    private EmailService emailService;

    @org.springframework.beans.factory.annotation.Autowired
    private UserService userService;

    private static final String COLLECTION = "triturations";

    public List<Trituration> getAllTriturations() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Trituration> list = new ArrayList<>();
            for (var d : docs) {
                try {
                    Trituration t = mapDocumentToTrituration(d);
                    if (t != null) list.add(t);
                } catch (Exception e) {
                    log.error("[ERROR] Failed to map document {}: {}", d.getId(), e.getMessage());
                }
            }
            log.info("[DEBUG] Successfully mapped {} triturations from Firestore", list.size());
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Error fetching triturations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private Trituration mapDocumentToTrituration(com.google.cloud.firestore.DocumentSnapshot d) {
        try {
            // Attempt standard mapping first
            Trituration t = d.toObject(Trituration.class);
            if (t != null && t.getId() == null) t.setId(d.getId());
            return t;
        } catch (Exception e) {
            log.warn("[WARN] Manual mapping required for trituration {}: {}", d.getId(), e.getMessage());
            Trituration t = new Trituration();
            t.setId(d.getId());
            t.setCollecteId(d.getString("collecteId"));
            t.setVergerId(d.getString("vergerId"));
            t.setVergerName(d.getString("vergerName"));
            t.setOliveType(d.getString("oliveType"));
            t.setInputWeightKg(d.getDouble("inputWeightKg"));
            t.setMillId(d.getString("millId"));
            t.setMillName(d.getString("millName"));
            t.setStatus(d.getString("status"));
            
            // Handle Timestamp to String conversion for plannedDate
            t.setPlannedDate(safeGetDate(d, "plannedDate"));
            
            t.setOilProducedLiters(d.getDouble("oilProducedLiters"));
            t.setAcidity(d.getDouble("acidity"));
            t.setQuality(d.getString("quality"));
            t.setWorkerNotes(d.getString("workerNotes"));
            
            return t;
        }
    }

    private String safeGetDate(com.google.cloud.firestore.DocumentSnapshot d, String field) {
        Object val = d.get(field);
        if (val == null) return null;
        if (val instanceof com.google.cloud.Timestamp) {
            return ((com.google.cloud.Timestamp) val).toDate().toInstant().toString().split("T")[0]; // YYYY-MM-DD
        }
        return val.toString();
    }

    public Optional<Trituration> getTriturationById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) return Optional.ofNullable(doc.toObject(Trituration.class));
        } catch (Exception e) {
            log.error("Error fetching trituration {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Trituration saveTrituration(Trituration trituration) {
        try {
            log.info("[DEBUG] Persisting trituration: {}", trituration);
            if (trituration.getId() == null || trituration.getId().isEmpty()) {
                trituration.setId(UUID.randomUUID().toString());
            }
            if (trituration.getStatus() == null) {
                trituration.setStatus("PLANNED");
            }

            // Sync millName if millId is provided but name is missing
            // (This will be handled better by the frontend, but good for safety)
            
            db.collection(COLLECTION).document(trituration.getId()).set(trituration).get(30, TimeUnit.SECONDS);
            log.info("[DEBUG] Trituration {} successfully persisted in Firestore", trituration.getId());

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
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Trituration {} deleted", id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete trituration: " + e.getMessage(), e);
        }
    }
}
