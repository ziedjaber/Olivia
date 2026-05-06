package com.olivia.backend.service;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.ParticipationStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Service layer for the worker invitation and participation workflow.
 *
 * Business rules enforced here:
 *  - A worker can only be invited if they are NOT currently ACCEPTED or ASSIGNED in another collecte.
 *  - Only one active record per (worker, collecte) pair.
 */
@Slf4j
@Service
public class ParticipationService {

    @org.springframework.beans.factory.annotation.Autowired
    private Firestore db;

    private static final String COL = "participations";

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    // ─── QUERIES ──────────────────────────────────────────────────────────────

    /** All participations for a given collecte. */
    public List<Participation> getByCollecte(String collecteId) {
        try {
            return db.collection(COL)
                    .whereEqualTo("collecteId", collecteId)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> {
                        Participation p = d.toObject(Participation.class);
                        if (p != null) p.setId(d.getId());
                        return p;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error querying participations for collecte {}: {}", collecteId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /** All participations for a specific worker (their invitation inbox). */
    public List<Participation> getByOuvrier(String ouvrierUid) {
        try {
            return db.collection(COL)
                    .whereEqualTo("ouvrierUid", ouvrierUid)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> {
                        Participation p = d.toObject(Participation.class);
                        if (p != null) p.setId(d.getId());
                        return p;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error querying participations for ouvrier {}: {}", ouvrierUid, e.getMessage());
            return new ArrayList<>();
        }
    }

    // ─── AVAILABILITY CHECK ───────────────────────────────────────────────────

    /**
     * Returns true if the worker has NO active participation (status ACCEPTED or ASSIGNED).
     * This enforces the business rule: a worker cannot be double-booked.
     */
    public boolean isWorkerAvailable(String ouvrierUid) {
        try {
            // Fetch all ACCEPTED/ASSIGNED participations for this worker
            List<Participation> actives = db.collection(COL)
                    .whereEqualTo("ouvrierUid", ouvrierUid)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Participation.class))
                    .filter(p -> ParticipationStatus.ACCEPTED.name().equals(p.getStatus()) 
                              || ParticipationStatus.ASSIGNED.name().equals(p.getStatus()))
                    .collect(Collectors.toList());

            if (actives.isEmpty()) return true;

            // For each potentially busy record, check if the mission is actually still active
            for (Participation p : actives) {
                var missionDoc = db.collection("collectes").document(p.getCollecteId()).get().get(10, TimeUnit.SECONDS);
                if (missionDoc.exists()) {
                    String status = missionDoc.getString("statut");
                    // If mission is not terminated, then worker is truly busy
                    if (status != null && !status.equalsIgnoreCase("TERMINATED") && !status.equalsIgnoreCase("termine")) {
                        log.warn("[Availability] Worker {} is BUSY in mission {} ({})", ouvrierUid, p.getCollecteId(), status);
                        return false; 
                    }
                }
            }
            return true; 
        } catch (Exception e) {
            log.error("Error checking availability for {}: {}", ouvrierUid, e.getMessage());
            return false; // Fail safe
        }
    }

    /** Returns all participations that are considered 'active' (booked). */
    public List<Participation> getAllActiveParticipations() {
        try {
            List<Participation> candidates = db.collection(COL).get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream().map(d -> d.toObject(Participation.class))
                    .filter(p -> ParticipationStatus.ACCEPTED.name().equals(p.getStatus()) 
                              || ParticipationStatus.ASSIGNED.name().equals(p.getStatus()))
                    .collect(Collectors.toList());
            
            // Filter out those whose mission is finished
            List<Participation> actuallyActive = new ArrayList<>();
            for (Participation p : candidates) {
                var missionDoc = db.collection("collectes").document(p.getCollecteId()).get().get(5, TimeUnit.SECONDS);
                if (missionDoc.exists()) {
                    String status = missionDoc.getString("statut");
                    if (status != null && !status.equalsIgnoreCase("TERMINATED") && !status.equalsIgnoreCase("termine")) {
                        actuallyActive.add(p);
                    }
                }
            }
            return actuallyActive;
        } catch (Exception e) {
            log.error("Error fetching all active participations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ─── INVITATION ───────────────────────────────────────────────────────────

    /**
     * Invite a worker to a collecte.
     * Validates availability, creates a Participation record, and pushes a notification.
     */
    public Participation invite(
            String collecteId,
            String ouvrierUid,
            String ouvrierName,
            String ouvrierEmail,
            String collecteDescription,
            String collecteType,
            String collecteDate,
            String collecteEndDate,
            String collecteLocation,
            String invitedByUid,
            String invitedByName,
            Double dailySalary
    ) {
        // 1. Check availability
        if (!isWorkerAvailable(ouvrierUid)) {
            throw new IllegalStateException(
                "L'ouvrier " + ouvrierName + " est déjà engagé dans une mission active."
            );
        }

        // 2. Check for duplicate invite - idempotent handling
        List<Participation> existing = getByCollecte(collecteId);
        Optional<Participation> existingInvite = existing.stream()
                .filter(p -> p.getOuvrierUid().equals(ouvrierUid)
                        && !ParticipationStatus.REJECTED.name().equals(p.getStatus()))
                .findFirst();

        if (existingInvite.isPresent()) {
            Participation ep = existingInvite.get();
            String status = ep.getStatus();
            // Hard block: worker already accepted or is assigned
            if (ParticipationStatus.ACCEPTED.name().equals(status) 
                    || ParticipationStatus.ASSIGNED.name().equals(status)) {
                throw new IllegalStateException("L'ouvrier " + ouvrierName + " a déjà accepté cette mission.");
            }
            // Soft case: worker was already INVITED — re-send notification and return existing record
            log.info("Worker {} already has INVITED status for collecte {}. Re-sending notification.", ouvrierUid, collecteId);
            notificationService.sendToUser(ouvrierUid,
                "Rappel : invitation de récolte",
                "Rappel de " + invitedByName + " : vous avez une invitation en attente.",
                "INVITATION"
            );
            return ep;
        }

        // 3. Create participation record
        Participation p = new Participation();
        p.setId(UUID.randomUUID().toString());
        p.setCollecteId(collecteId);
        p.setOuvrierUid(ouvrierUid);
        p.setOuvrierName(ouvrierName);
        p.setOuvrierEmail(ouvrierEmail);
        p.setCollecteDescription(collecteDescription);
        p.setCollecteType(collecteType);
        p.setCollecteDate(collecteDate);
        p.setCollecteEndDate(collecteEndDate);
        p.setCollecteLocation(collecteLocation);
        p.setStatus(ParticipationStatus.INVITED.name());
        p.setDateInvitation(java.time.Instant.now().toString());
        p.setInvitedByUid(invitedByUid);
        p.setInvitedByName(invitedByName);
        p.setDailySalary(dailySalary);

        try {
            db.collection(COL).document(p.getId()).set(toMap(p)).get(30, TimeUnit.SECONDS);
            log.info("Worker {} invited to collecte {}", ouvrierUid, collecteId);

            // 4. Send notification
            notificationService.sendToUser(ouvrierUid,
                "Nouvelle invitation de récolte",
                "Vous avez été invité(e) par " + invitedByName + " à participer à une récolte au verger: " + collecteLocation,
                "INVITATION"
            );

            // 5. Send Email
            try {
                if (ouvrierEmail != null && !ouvrierEmail.isEmpty()) {
                    Map<String, Object> vars = new HashMap<>();
                    vars.put("ouvrierName", ouvrierName);
                    vars.put("vergerName", collecteLocation);
                    vars.put("chefName", invitedByName);
                    vars.put("dailySalary", dailySalary);
                    emailService.sendHtmlEmail(ouvrierEmail, "Nouvelle mission de récolte : " + collecteLocation, "emails/mission-invite", vars);
                    log.info("Invitation email sent to {}", ouvrierEmail);
                }
            } catch (Exception e) {
                log.warn("Failed to send invitation email to {}: {}", ouvrierEmail, e.getMessage());
            }

            return p;
        } catch (Exception e) {
            throw new RuntimeException("Failed to save invitation: " + e.getMessage(), e);
        }
    }

    // ─── WORKER RESPONSE ──────────────────────────────────────────────────────

    /** Worker accepts an invitation. */
    public Participation accept(String participationId, String ouvrierUid) {
        return updateStatus(participationId, ouvrierUid,
                ParticipationStatus.INVITED, ParticipationStatus.ACCEPTED,
                "You accepted a harvest invitation.");
    }

    /** Worker rejects an invitation. */
    public Participation reject(String participationId, String ouvrierUid) {
        return updateStatus(participationId, ouvrierUid,
                ParticipationStatus.INVITED, ParticipationStatus.REJECTED,
                "You rejected a harvest invitation.");
    }

    // ─── TEAM LEAD ACTIONS ────────────────────────────────────────────────────

    /** Chef d'equipe removes a worker from the collecte. */
    public void remove(String participationId) {
        try {
            var doc = db.collection(COL).document(participationId).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Participation p = doc.toObject(Participation.class);
                db.collection(COL).document(participationId).delete().get(30, TimeUnit.SECONDS);
                
                // NOTIFICATION 3: Suppression d'invitation
                if (p != null) {
                    notificationService.sendToUser(p.getOuvrierUid(), "Mission Annulée", "Votre participation à la mission " + p.getCollecteDescription() + " a été retirée.", "WARNING");
                }
            }
            log.info("Participation {} removed.", participationId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove participation: " + e.getMessage(), e);
        }
    }

    /** Chef d'equipe updates the worker's daily salary. */
    public Participation updateSalary(String participationId, Double newSalary) {
        try {
            var doc = db.collection(COL).document(participationId).get().get(30, TimeUnit.SECONDS);
            if (!doc.exists()) throw new RuntimeException("Participation not found: " + participationId);

            Participation p = doc.toObject(Participation.class);
            if (p == null) throw new RuntimeException("Failed to deserialize participation");

            p.setDailySalary(newSalary);
            db.collection(COL).document(participationId).set(toMap(p)).get(30, TimeUnit.SECONDS);
            log.info("Salary updated for participation {}.", participationId);

            // NOTIFICATION 2: Mise à jour du salaire
            notificationService.sendToUser(p.getOuvrierUid(), "Salaire Mis à Jour", "Votre salaire journalier a été modifié à " + newSalary + " DT.", "INFO");

            return p;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update salary: " + e.getMessage(), e);
        }
    }

    /** Chef d'equipe pays the worker's daily salary. */
    public Participation pay(String participationId) {
        try {
            var doc = db.collection(COL).document(participationId).get().get(30, TimeUnit.SECONDS);
            if (!doc.exists()) throw new RuntimeException("Participation not found: " + participationId);

            Participation p = doc.toObject(Participation.class);
            if (p == null) throw new RuntimeException("Failed to deserialize participation");

            p.setSalaryPaid(true);
            db.collection(COL).document(participationId).set(toMap(p)).get(30, TimeUnit.SECONDS);
            log.info("Salary paid for participation {}.", participationId);

            // NOTIFICATION 1: Paiement effectué
            notificationService.sendToUser(p.getOuvrierUid(), "Paiement Reçu", "Votre salaire pour la mission " + p.getCollecteDescription() + " a été marqué comme payé.", "SUCCESS");

            return p;
        } catch (Exception e) {
            throw new RuntimeException("Failed to pay worker salary: " + e.getMessage(), e);
        }
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private Participation updateStatus(
            String participationId,
            String requesterUid,
            ParticipationStatus expectedCurrent,
            ParticipationStatus newStatus,
            String notifMessage
    ) {
        try {
            var doc = db.collection(COL).document(participationId).get().get(30, TimeUnit.SECONDS);
            if (!doc.exists()) throw new RuntimeException("Participation not found: " + participationId);

            Participation p = doc.toObject(Participation.class);
            if (p == null) throw new RuntimeException("Failed to deserialize participation");

            // Security: requester must own this record
            if (!p.getOuvrierUid().equals(requesterUid)) {
                throw new SecurityException("You do not own this participation record.");
            }
            // Status guard: must be in expected state
            if (!expectedCurrent.name().equals(p.getStatus())) {
                throw new IllegalStateException("Cannot transition from " + p.getStatus());
            }

            p.setStatus(newStatus.name());
            p.setDateReponse(java.time.Instant.now().toString());
            db.collection(COL).document(participationId).set(toMap(p)).get(30, TimeUnit.SECONDS);

            // Notify the chef who sent the invitation
            notificationService.sendToUser(p.getInvitedByUid(),
                newStatus == ParticipationStatus.ACCEPTED ? "Invitation acceptée" : "Invitation refusée",
                p.getOuvrierName() + " a " + (newStatus == ParticipationStatus.ACCEPTED ? "accepté" : "refusé") + " l'invitation.",
                newStatus.name()
            );

            // CHECK: Team Complete Notification
            if (newStatus == ParticipationStatus.ACCEPTED) {
                try {
                    String collecteId = p.getCollecteId();
                    var missionDoc = db.collection("collectes").document(collecteId).get().get(10, TimeUnit.SECONDS);
                    if (missionDoc.exists()) {
                        Long required = missionDoc.getLong("numberOfWorkers");
                        if (required != null && required > 0) {
                            long currentAccepted = db.collection(COL)
                                    .whereEqualTo("collecteId", collecteId)
                                    .whereEqualTo("status", ParticipationStatus.ACCEPTED.name())
                                    .get().get(10, TimeUnit.SECONDS).size();
                            
                            if (currentAccepted >= required) {
                                notificationService.sendToUser(p.getInvitedByUid(), "Équipe Complète", "Votre équipe pour la mission " + p.getCollecteDescription() + " est maintenant complète (" + currentAccepted + "/" + required + ").", "SUCCESS");
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to check team completion: {}", e.getMessage());
                }
            }

            return p;
        } catch (SecurityException | IllegalStateException se) {
            throw se;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update participation: " + e.getMessage(), e);
        }
    }

    private Map<String, Object> toMap(Participation p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",                 p.getId());
        m.put("collecteId",         p.getCollecteId());
        m.put("ouvrierUid",         p.getOuvrierUid());
        m.put("ouvrierName",        p.getOuvrierName());
        m.put("ouvrierEmail",        p.getOuvrierEmail());
        m.put("collecteDescription", p.getCollecteDescription());
        m.put("collecteType",        p.getCollecteType());
        m.put("collecteDate",        p.getCollecteDate());
        m.put("collecteEndDate",     p.getCollecteEndDate());
        m.put("collecteLocation",    p.getCollecteLocation());
        m.put("status",              p.getStatus());
        m.put("dateInvitation",      p.getDateInvitation());
        m.put("dateReponse",         p.getDateReponse());
        m.put("invitedByUid",        p.getInvitedByUid());
        m.put("invitedByName",       p.getInvitedByName());
        m.put("dailySalary",         p.getDailySalary());
        m.put("salaryPaid",          p.getSalaryPaid() != null ? p.getSalaryPaid() : false);
        return m;
    }
}
