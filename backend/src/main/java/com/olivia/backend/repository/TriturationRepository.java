package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.olivia.backend.model.Trituration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class TriturationRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "triturations";

    public List<Trituration> findAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Trituration> list = new ArrayList<>();
            for (var d : docs) {
                try {
                    Trituration t = mapDocumentToTrituration(d);
                    if (t != null) list.add(t);
                } catch (Exception e) {
                    log.error("[ERROR] Failed to map trituration {}: {}", d.getId(), e.getMessage());
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Error fetching all triturations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Trituration> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                return Optional.ofNullable(mapDocumentToTrituration(doc));
            }
        } catch (Exception e) {
            log.error("[ERROR] Error fetching trituration {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Trituration t) {
        try {
            db.collection(COLLECTION).document(t.getId()).set(t).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Error saving trituration {}: {}", t.getId(), e.getMessage());
            throw new RuntimeException("Failed to save trituration", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Error deleting trituration {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete trituration", e);
        }
    }

    private Trituration mapDocumentToTrituration(com.google.cloud.firestore.DocumentSnapshot d) {
        try {
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
            return ((com.google.cloud.Timestamp) val).toDate().toInstant().toString().split("T")[0];
        }
        return val.toString();
    }
}
