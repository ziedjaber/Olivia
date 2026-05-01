package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.ParticipationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired
    private Firestore db;

    @Autowired
    private NotificationService notificationService;

    private static final String COL_COLLECTES       = "collectes";
    private static final String COL_PARTICIPATIONS  = "participations";

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    public List<Collecte> getAllCollectes() {
        try {
            List<QueryDocumentSnapshot> docs = db.collection(COL_COLLECTES).get().get(30, TimeUnit.SECONDS).getDocuments();
            List<Collecte> list = new ArrayList<>();
            for (QueryDocumentSnapshot d : docs) {
                try {
                    Collecte c = mapDocumentToCollecte(d);
                    if (c != null) list.add(c);
                } catch (Exception e) {
                    log.error("Error mapping document {}: {}", d.getId(), e.getMessage());
                }
            }
            return list;
        } catch (Exception e) {
            log.error("Error fetching collectes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Collecte> getCollectesByChef(String chefIdOrEmail) {
        try {
            log.info("[CollecteService] Fetching missions for chef identity: {}", chefIdOrEmail);
            
            List<QueryDocumentSnapshot> docs = db.collection(COL_COLLECTES)
                    .whereEqualTo("chefUid", chefIdOrEmail)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments();

            List<Collecte> list = new ArrayList<>();
            for (QueryDocumentSnapshot d : docs) {
                try {
                    Collecte c = mapDocumentToCollecte(d);
                    if (c != null) list.add(c);
                } catch (Exception e) {
                    log.error("Error mapping document {}: {}", d.getId(), e.getMessage());
                }
            }
            log.info("[CollecteService] Found {} missions for current identity search.", list.size());
            return list;
        } catch (Exception e) {
            log.error("Error fetching collectes by chef: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Collecte> getCollecteById(String id) {
        try {
            var doc = db.collection(COL_COLLECTES).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Collecte c = mapDocumentToCollecte(doc);
                if (c != null) return Optional.of(c);
            }
        } catch (Exception e) {
            log.error("Error fetching collecte {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Collecte createCollecte(Collecte collecte) {
        try {
            if (collecte.getId() == null || collecte.getId().isEmpty()) {
                collecte.setId(UUID.randomUUID().toString());
            }
            collecte.setStatut("PLANNED");

            Map<String, Object> data = toMap(collecte);
            db.collection(COL_COLLECTES).document(collecte.getId()).set(data).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} created", collecte.getId());

            // Notifications
            if (collecte.getChefUid() != null) {
                notificationService.sendToUser(collecte.getChefUid(), "Nouvelle Mission", "Vous avez été assigné comme chef d'équipe pour la récolte: " + collecte.getDescription(), "MISSION");
            }
            if (collecte.getLogisticsUid() != null) {
                notificationService.sendToUser(collecte.getLogisticsUid(), "Nouvelle Mission (Logistique)", "Vous devez préparer la logistique pour la récolte: " + collecte.getDescription(), "LOGISTICS");
            }

            // NOTIFICATION: Oléiculteur (Propriétaire du verger)
            if (collecte.getVergerId() != null) {
                try {
                    var vergerDoc = db.collection("vergers").document(collecte.getVergerId()).get().get(10, TimeUnit.SECONDS);
                    if (vergerDoc.exists()) {
                        String ownerUid = vergerDoc.getString("proprietaireId");
                        if (ownerUid != null) {
                            notificationService.sendToUser(ownerUid, "Récolte Planifiée", "Une mission de récolte a été planifiée pour votre verger: " + vergerDoc.getString("nom"), "INFO");
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to notify Oleiculteur: {}", e.getMessage());
                }
            }

            return collecte;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create collecte: " + e.getMessage(), e);
        }
    }

    public Collecte updateCollecte(String id, Collecte collecte) {
        try {
            collecte.setId(id);
            db.collection(COL_COLLECTES).document(id).set(toMap(collecte)).get(30, TimeUnit.SECONDS);

            // NOTIFICATION: Mission mise à jour
            if (collecte.getChefUid() != null) {
                notificationService.sendToUser(collecte.getChefUid(), "Mission Modifiée", "Les détails de votre mission " + collecte.getDescription() + " ont été mis à jour.", "INFO");
            }
            if (collecte.getLogisticsUid() != null) {
                notificationService.sendToUser(collecte.getLogisticsUid(), "Logistique Mission Mise à Jour", "Le planning pour la mission " + collecte.getDescription() + " a changé.", "INFO");
            }

            return collecte;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update collecte: " + e.getMessage(), e);
        }
    }

    public void updateStatus(String id, String newStatus) {
        try {
            db.collection(COL_COLLECTES).document(id).update("statut", newStatus).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} status updated to {}", id, newStatus);
        } catch (Exception e) {
            throw new RuntimeException("Failed to update collecte status: " + e.getMessage(), e);
        }
    }

    public void deleteCollecte(String id) {
        try {
            db.collection(COL_COLLECTES).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Collecte {} deleted", id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete collecte: " + e.getMessage(), e);
        }
    }

    public void markLogisticsReady(String id, boolean ready) {
        try {
            db.collection(COL_COLLECTES).document(id).update("logisticsReady", ready).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} logistics ready: {}", id, ready);

            if (ready) {
                var collecte = getCollecteById(id).orElse(null);
                if (collecte != null && collecte.getChefUid() != null) {
                    notificationService.sendToUser(collecte.getChefUid(), "Logistique Prête", "La logistique pour la mission " + collecte.getDescription() + " est maintenant prête.", "SUCCESS");
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update logistics readiness: " + e.getMessage(), e);
        }
    }

    public void markWorkersReady(String id, boolean ready) {
        try {
            db.collection(COL_COLLECTES).document(id).update("workersReady", ready).get(30, TimeUnit.SECONDS);
            log.info("Collecte {} workers ready: {}", id, ready);

            if (ready) {
                var collecte = getCollecteById(id).orElse(null);
                if (collecte != null && collecte.getLogisticsUid() != null) {
                    notificationService.sendToUser(collecte.getLogisticsUid(), "Équipe Prête", "L'équipe d'ouvriers pour la mission " + collecte.getDescription() + " est maintenant prête.", "SUCCESS");
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update workers readiness: " + e.getMessage(), e);
        }
    }

    // ─── LIFECYCLE ────────────────────────────────────────────────────────────

    /**
     * Start a collecte: move it to "en_cours" and transition all ACCEPTED participants to ASSIGNED.
     */
    public void startCollecte(String collecteId) {
        try {

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

                // NOTIFICATION 4: Démarrage de mission
                notificationService.sendToUser(doc.getString("ouvrierUid"), "Mission Démarrée", "La mission " + collecteId + " a démarré. Vous pouvez commencer le travail.", "INFO");
            }

            // NOTIFICATION: Oléiculteur (Début de récolte)
            try {
                var collDoc = db.collection(COL_COLLECTES).document(collecteId).get().get(5, TimeUnit.SECONDS);
                String vergerId = collDoc.getString("vergerId");
                if (vergerId != null) {
                    var vergerDoc = db.collection("vergers").document(vergerId).get().get(5, TimeUnit.SECONDS);
                    String ownerUid = vergerDoc.getString("proprietaireId");
                    if (ownerUid != null) {
                        notificationService.sendToUser(ownerUid, "Début de Récolte", "L'équipe de récolte a commencé le travail dans votre verger: " + vergerDoc.getString("nom"), "SUCCESS");
                    }
                }
            } catch (Exception e) { log.warn("Notify owner start failed"); }

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

                // NOTIFICATION 5: Fin de mission
                notificationService.sendToUser(doc.getString("ouvrierUid"), "Mission Terminée", "La mission " + collecteId + " est maintenant terminée. Merci pour votre travail.", "SUCCESS");
            }

            // NOTIFICATION: Directeur (Mission terminée)
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Mission Terminée", "La récolte " + collecteId + " a été clôturée avec succès.", "SUCCESS");

            // NOTIFICATION: Oléiculteur (Fin de récolte)
            try {
                var collDoc = db.collection(COL_COLLECTES).document(collecteId).get().get(5, TimeUnit.SECONDS);
                String vergerId = collDoc.getString("vergerId");
                if (vergerId != null) {
                    var vergerDoc = db.collection("vergers").document(vergerId).get().get(5, TimeUnit.SECONDS);
                    String ownerUid = vergerDoc.getString("proprietaireId");
                    if (ownerUid != null) {
                        notificationService.sendToUser(ownerUid, "Récolte Terminée", "La récolte de votre verger '" + vergerDoc.getString("nom") + "' est terminée.", "SUCCESS");
                    }
                }
            } catch (Exception e) { log.warn("Notify owner end failed"); }

            log.info("Collecte {} ended. {} workers COMPLETED.", collecteId, docs.size());
        } catch (Exception e) {
            throw new RuntimeException("Failed to end collecte: " + e.getMessage(), e);
        }
    }

    // ─── DAILY TRACKING ──────────────────────────────────────────────────────

    public Collecte verifyDay(String id) {
        try {
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

    private Collecte mapDocumentToCollecte(com.google.cloud.firestore.DocumentSnapshot d) {
        try {
            // Attempt standard mapping
            Collecte c = d.toObject(Collecte.class);
            c.setId(d.getId());
            return c;
        } catch (Exception e) {
            // If it fails (e.g. Timestamp to String error), map manually
            log.warn("Manual mapping required for document {}: {}", d.getId(), e.getMessage());
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

            // Safely handle dates which might be Timestamps
            c.setStartDate(safeGetDate(d, "startDate"));
            c.setEndDate(safeGetDate(d, "endDate"));

            // Note: complex nested lists like requiredResources or dailyReports 
            // might still need manual mapping if they contain non-primitive types
            // but the primary issue seems to be the top-level dates.
            
            return c;
        }
    }

    private String safeGetDate(com.google.cloud.firestore.DocumentSnapshot d, String field) {
        Object val = d.get(field);
        if (val == null) return null;
        if (val instanceof com.google.cloud.Timestamp) {
            // Convert to ISO-like string or just toDate().toString()
            return ((com.google.cloud.Timestamp) val).toDate().toInstant().toString();
        }
        return val.toString();
    }

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

        m.put("logisticsReady", c.isLogisticsReady());
        m.put("workersReady", c.isWorkersReady());
        m.put("lastVerificationDate", c.getLastVerificationDate());
        m.put("dailyReports", c.getDailyReports() != null ? c.getDailyReports() : new ArrayList<>());

        return m;
    }
}
