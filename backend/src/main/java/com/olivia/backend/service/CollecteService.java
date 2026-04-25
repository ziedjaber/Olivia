package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.ParticipationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service layer for Collecte CRUD operations and lifecycle transitions.
 * All data is persisted in Firestore.
 */
@Slf4j
@Service
public class CollecteService {

    private static final String COL_COLLECTES       = "collectes";
    private static final String COL_PARTICIPATIONS  = "participations";

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    public List<Collecte> getAllCollectes() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COL_COLLECTES).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Collecte.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching collectes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Collecte> getCollectesByChef(String chefIdOrEmail) {
        try {
            log.info("[CollecteService] Fetching missions for chef identity: {}", chefIdOrEmail);
            Firestore db = FirestoreClient.getFirestore();
            
            // Query 1: Exactly as chefUid
            List<Collecte> byId = db.collection(COL_COLLECTES)
                    .whereEqualTo("chefUid", chefIdOrEmail)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Collecte.class))
                    .collect(Collectors.toList());

            // If it's an email, we search exactly for it. 
            // If it's a UID, we just return what we found.
            // But to be robust, we'll return the union of results if multiple identities are involved.
            log.info("[CollecteService] Found {} missions for current identity search.", byId.size());
            return byId;
        } catch (Exception e) {
            log.error("Error fetching collectes by chef: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Collecte> getCollecteById(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection(COL_COLLECTES).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) return Optional.ofNullable(doc.toObject(Collecte.class));
        } catch (Exception e) {
            log.error("Error fetching collecte {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Collecte createCollecte(Collecte collecte) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (collecte.getId() == null || collecte.getId().isEmpty()) {
                collecte.setId(UUID.randomUUID().toString());
            }
            collecte.setStatut("PLANNED");

            Map<String, Object> data = toMap(collecte);
            db.collection(COL_COLLECTES).document(collecte.getId()).set(data).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} created", collecte.getId());
            return collecte;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create collecte: " + e.getMessage(), e);
        }
    }

    public Collecte updateCollecte(String id, Collecte collecte) {
        try {
            collecte.setId(id);
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COL_COLLECTES).document(id).set(toMap(collecte)).get(30, TimeUnit.SECONDS);
            return collecte;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update collecte: " + e.getMessage(), e);
        }
    }

    public void updateStatus(String id, String newStatus) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COL_COLLECTES).document(id).update("statut", newStatus).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} status updated to {}", id, newStatus);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update collecte status: " + e.getMessage(), e);
        }
    }

    public void deleteCollecte(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COL_COLLECTES).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Collecte {} deleted", id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete collecte: " + e.getMessage(), e);
        }
    }

    // ─── LIFECYCLE ────────────────────────────────────────────────────────────

    /**
     * Start a collecte: move it to "en_cours" and transition all ACCEPTED participants to ASSIGNED.
     */
    public void startCollecte(String collecteId) {
        try {
            Firestore db = FirestoreClient.getFirestore();

            // 1. Update collecte status
            db.collection(COL_COLLECTES).document(collecteId)
                    .update("statut", "en_cours").get(30, TimeUnit.SECONDS);

            // 2. Transition all ACCEPTED → ASSIGNED
            List<QueryDocumentSnapshot> docs = db.collection(COL_PARTICIPATIONS)
                    .whereEqualTo("collecteId", collecteId)
                    .whereEqualTo("status", ParticipationStatus.ACCEPTED.name())
                    .get().get(30, TimeUnit.SECONDS).getDocuments();

            for (QueryDocumentSnapshot doc : docs) {
                db.collection(COL_PARTICIPATIONS).document(doc.getId())
                        .update("status", ParticipationStatus.ASSIGNED.name())
                        .get(30, TimeUnit.SECONDS);
            }
            log.info("Collecte {} started. {} workers ASSIGNED.", collecteId, docs.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to start collecte: " + e.getMessage(), e);
        }
    }

    /**
     * End a collecte: move it to "termine" and transition all ASSIGNED participants to COMPLETED.
     * Workers are now available again.
     */
    public void endCollecte(String collecteId) {
        try {
            Firestore db = FirestoreClient.getFirestore();

            // 1. Update collecte status
            db.collection(COL_COLLECTES).document(collecteId)
                    .update("statut", "termine").get(30, TimeUnit.SECONDS);

            // 2. Transition all ASSIGNED → COMPLETED
            List<QueryDocumentSnapshot> docs = db.collection(COL_PARTICIPATIONS)
                    .whereEqualTo("collecteId", collecteId)
                    .whereEqualTo("status", ParticipationStatus.ASSIGNED.name())
                    .get().get(30, TimeUnit.SECONDS).getDocuments();

            for (QueryDocumentSnapshot doc : docs) {
                db.collection(COL_PARTICIPATIONS).document(doc.getId())
                        .update("status", ParticipationStatus.COMPLETED.name())
                        .get(30, TimeUnit.SECONDS);
            }
            log.info("Collecte {} ended. {} workers COMPLETED.", collecteId, docs.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to end collecte: " + e.getMessage(), e);
        }
    }

    // ─── DAILY TRACKING ──────────────────────────────────────────────────────

    public Collecte verifyDay(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Collecte c = getCollecteById(id).orElseThrow(() -> new RuntimeException("Collecte not found"));
            String today = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
            c.setLastVerificationDate(today);
            db.collection(COL_COLLECTES).document(id).update("lastVerificationDate", today).get(30, TimeUnit.SECONDS);
            return c;
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify day: " + e.getMessage(), e);
        }
    }

    public Collecte addDailyProgress(String id, Collecte.DailyProgress progress) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Collecte c = getCollecteById(id).orElseThrow(() -> new RuntimeException("Collecte not found"));
            
            if (c.getDailyReports() == null) {
                c.setDailyReports(new ArrayList<>());
            }
            if (progress.getId() == null || progress.getId().isEmpty()) {
                progress.setId(UUID.randomUUID().toString());
            }
            if (progress.getDate() == null || progress.getDate().isEmpty()) {
                progress.setDate(new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date()));
            }
            
            // Upsert logic: find if date already exists
            int existingIndex = -1;
            for (int i = 0; i < c.getDailyReports().size(); i++) {
                if (c.getDailyReports().get(i).getDate().equals(progress.getDate())) {
                    existingIndex = i;
                    break;
                }
            }

            if (existingIndex >= 0) {
                // Keep the old ID if we find a match
                progress.setId(c.getDailyReports().get(existingIndex).getId());
                c.getDailyReports().set(existingIndex, progress);
            } else {
                c.getDailyReports().add(progress);
            }

            db.collection(COL_COLLECTES).document(id).update("dailyReports", c.getDailyReports()).get(30, TimeUnit.SECONDS);
            return c;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save daily progress: " + e.getMessage(), e);
        }
    }

    // ─── HELPER ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(Collecte c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",          c.getId());
        m.put("vergerId",    c.getVergerId());
        m.put("vergerName",  c.getVergerName());
        m.put("chefUid",     c.getChefUid());
        m.put("chefName",    c.getChefName());
        m.put("logisticsUid", c.getLogisticsUid());
        m.put("logisticsName", c.getLogisticsName());
        m.put("description",     c.getDescription());
        m.put("startDate",       c.getStartDate());
        m.put("endDate",         c.getEndDate());
        m.put("type",            c.getType());
        m.put("statut",          c.getStatut());
        m.put("numberOfWorkers", c.getNumberOfWorkers());
        m.put("requiredResources", c.getRequiredResources());
        m.put("logisticsReady", c.getLogisticsReady());
        m.put("workersReady", c.getWorkersReady());
        m.put("lastVerificationDate", c.getLastVerificationDate());
        m.put("dailyReports", c.getDailyReports() != null ? c.getDailyReports() : new ArrayList<>());
        return m;
    }
}
