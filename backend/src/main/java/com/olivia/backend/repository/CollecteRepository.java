package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Collecte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class CollecteRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "collectes";

    public List<Collecte> findAll() {
        try {
            var docs = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Collecte> list = new ArrayList<>();
            for (var d : docs) {
                try {
                    Collecte c = mapDocumentToCollecte(d);
                    if (c != null) list.add(c);
                } catch (Exception e) {
                    log.error("[ERROR] Failed to map collecte {}: {}", d.getId(), e.getMessage());
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Error fetching all collectes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Collecte> findByChefUid(String chefUid) {
        try {
            var docs = db.collection(COLLECTION)
                    .whereEqualTo("chefUid", chefUid)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Collecte> list = new ArrayList<>();
            for (var d : docs) {
                Collecte c = mapDocumentToCollecte(d);
                if (c != null) list.add(c);
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Error fetching collectes by chefUid: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Collecte> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                return Optional.ofNullable(mapDocumentToCollecte(doc));
            }
        } catch (Exception e) {
            log.error("[ERROR] Error fetching collecte {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Collecte c) {
        try {
            db.collection(COLLECTION).document(c.getId()).set(c).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Error saving collecte {}: {}", c.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to save collecte", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Error deleting collecte {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete collecte", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Error updating field {} for collecte {}: {}", field, id, e.getMessage());
            throw new BusinessLogicException("Failed to update field", e);
        }
    }

    private Collecte mapDocumentToCollecte(com.google.cloud.firestore.DocumentSnapshot d) {
        try {
            Collecte c = d.toObject(Collecte.class);
            if (c != null && c.getId() == null) c.setId(d.getId());
            return c;
        } catch (Exception e) {
            log.warn("[WARN] Manual mapping required for collecte {}: {}", d.getId(), e.getMessage());
            Collecte c = new Collecte();
            c.setId(d.getId());
            c.setVergerId(d.getString("vergerId"));
            c.setVergerName(d.getString("vergerName"));
            c.setChefUid(d.getString("chefUid"));
            c.setChefName(d.getString("chefName"));
            c.setLogisticsUid(d.getString("logisticsUid"));
            c.setLogisticsName(d.getString("logisticsName"));
            c.setDescription(d.getString("description"));
            c.setStatut(d.getString("statut"));
            c.setType(d.getString("type"));
            
            Long nw = d.getLong("numberOfWorkers");
            if (nw != null) c.setNumberOfWorkers(nw.intValue());
            
            c.setLogisticsReady(Boolean.TRUE.equals(d.getBoolean("logisticsReady")));
            c.setWorkersReady(Boolean.TRUE.equals(d.getBoolean("workersReady")));
            c.setLastVerificationDate(d.getString("lastVerificationDate"));

            c.setStartDate(safeGetDate(d, "startDate"));
            c.setEndDate(safeGetDate(d, "endDate"));
            
            // Note: complex nested lists like dailyReports might still need careful mapping
            // if d.get("dailyReports") is used. But for now we focus on the core fields.
            
            return c;
        }
    }

    private String safeGetDate(com.google.cloud.firestore.DocumentSnapshot d, String field) {
        Object val = d.get(field);
        if (val == null) return null;
        if (val instanceof com.google.cloud.Timestamp) {
            return ((com.google.cloud.Timestamp) val).toDate().toInstant().toString();
        }
        return val.toString();
    }
}
