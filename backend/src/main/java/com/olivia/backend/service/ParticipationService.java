package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Participation;
import com.olivia.backend.model.ParticipationStatus;
import lombok.extern.slf4j.Slf4j;
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

    private static final String COL = "participations";
    private static final String COL_NOTIF = "notifications";

    // ─── QUERIES ──────────────────────────────────────────────────────────────

    /** All participations for a given collecte. */
    public List<Participation> getByCollecte(String collecteId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COL)
                    .whereEqualTo("collecteId", collecteId)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Participation.class))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error querying participations for collecte {}: {}", collecteId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /** All participations for a specific worker (their invitation inbox). */
    public List<Participation> getByOuvrier(String ouvrierUid) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            return db.collection(COL)
                    .whereEqualTo("ouvrierUid", ouvrierUid)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream()
                    .map(d -> d.toObject(Participation.class))
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
            Firestore db = FirestoreClient.getFirestore();
            // Check ACCEPTED
            long accepted = db.collection(COL)
                    .whereEqualTo("ouvrierUid", ouvrierUid)
                    .whereEqualTo("status", ParticipationStatus.ACCEPTED.name())
                    .get().get(30, TimeUnit.SECONDS).size();
            // Check ASSIGNED
            long assigned = db.collection(COL)
                    .whereEqualTo("ouvrierUid", ouvrierUid)
                    .whereEqualTo("status", ParticipationStatus.ASSIGNED.name())
                    .get().get(30, TimeUnit.SECONDS).size();
            return (accepted + assigned) == 0;
        } catch (Exception e) {
            log.error("Error checking availability for {}: {}", ouvrierUid, e.getMessage());
            return false; // Fail safe: assume unavailable on error
        }
    }

    /** Returns all participations that are considered 'active' (booked). */
    public List<Participation> getAllActiveParticipations() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            List<Participation> accepted = db.collection(COL)
                    .whereEqualTo("status", ParticipationStatus.ACCEPTED.name())
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream().map(d -> d.toObject(Participation.class)).collect(Collectors.toList());
            
            List<Participation> assigned = db.collection(COL)
                    .whereEqualTo("status", ParticipationStatus.ASSIGNED.name())
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments().stream().map(d -> d.toObject(Participation.class)).collect(Collectors.toList());
            
            accepted.addAll(assigned);
            return accepted;
        } catch (Exception e) {
            log.error("Error fetching all active participations: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    // ─── INVITATION ───────────────────────────────────────────────────────────

    /**
     * Invite a worker to a collecte.
     * Validates availability, creates a Participation record, and pushes a notification.
     *
     * @throws IllegalStateException if worker is not available
     */
    public Participation invite(
            String collecteId,
            String ouvrierUid,
            String ouvrierName,
            String ouvrierEmail,
            String collecteDescription,
            String collecteType,
            Date   collecteDate,
            Date   collecteEndDate,
            String collecteLocation,
            String invitedByUid,
            String invitedByName,
            Double dailySalary
    ) {
        // 1. Check availability
        if (!isWorkerAvailable(ouvrierUid)) {
            throw new IllegalStateException(
                "Worker " + ouvrierName + " is already engaged in an active collecte."
            );
        }

        // 2. Check for duplicate invite
        List<Participation> existing = getByCollecte(collecteId);
        boolean alreadyInvited = existing.stream()
                .anyMatch(p -> p.getOuvrierUid().equals(ouvrierUid)
                        && !ParticipationStatus.REJECTED.name().equals(p.getStatus()));
        if (alreadyInvited) {
            throw new IllegalStateException("Worker has already been invited to this collecte.");
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
        p.setDateInvitation(new Date());
        p.setInvitedByUid(invitedByUid);
        p.setInvitedByName(invitedByName);
        p.setDailySalary(dailySalary);

        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COL).document(p.getId()).set(toMap(p)).get(30, TimeUnit.SECONDS);
            log.info("Worker {} invited to collecte {}", ouvrierUid, collecteId);

            // 4. Send notification
            sendNotification(ouvrierUid,
                "Nouvelle invitation de récolte",
                "Vous avez été invité(e) par " + invitedByName + " à participer à une collecte.",
                "INVITATION",
                p.getId()
            );
            return p;
        } catch (IllegalStateException ise) {
            throw ise;
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
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COL).document(participationId).delete().get(30, TimeUnit.SECONDS);
            log.info("Participation {} removed.", participationId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to remove participation: " + e.getMessage(), e);
        }
    }

    /** Chef d'equipe pays the worker's daily salary. */
    public Participation pay(String participationId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection(COL).document(participationId).get().get(30, TimeUnit.SECONDS);
            if (!doc.exists()) throw new RuntimeException("Participation not found: " + participationId);

            Participation p = doc.toObject(Participation.class);
            if (p == null) throw new RuntimeException("Failed to deserialize participation");

            p.setSalaryPaid(true);
            db.collection(COL).document(participationId).set(toMap(p)).get(30, TimeUnit.SECONDS);
            log.info("Salary paid for participation {}.", participationId);
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
            Firestore db = FirestoreClient.getFirestore();
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
            p.setDateReponse(new Date());
            db.collection(COL).document(participationId).set(toMap(p)).get(30, TimeUnit.SECONDS);

            // Notify the chef who sent the invitation
            sendNotification(p.getInvitedByUid(),
                newStatus == ParticipationStatus.ACCEPTED ? "Invitation acceptée" : "Invitation refusée",
                p.getOuvrierName() + " a " + (newStatus == ParticipationStatus.ACCEPTED ? "accepté" : "refusé") + " l'invitation.",
                newStatus.name(),
                participationId
            );
            return p;
        } catch (SecurityException | IllegalStateException se) {
            throw se;
        } catch (Exception e) {
            throw new RuntimeException("Failed to update participation: " + e.getMessage(), e);
        }
    }

    private void sendNotification(String recipientUid, String title, String body, String type, String referenceId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            Map<String, Object> notif = new HashMap<>();
            notif.put("id",          UUID.randomUUID().toString());
            notif.put("recipientUid", recipientUid);
            notif.put("title",        title);
            notif.put("body",         body);
            notif.put("type",         type);
            notif.put("referenceId",  referenceId);
            notif.put("read",         false);
            notif.put("createdAt",    new Date());
            String notifId = (String) notif.get("id");
            db.collection(COL_NOTIF).document(notifId).set(notif);
            log.debug("Notification sent to {}: {}", recipientUid, title);
        } catch (Exception e) {
            log.warn("Failed to send notification: {}", e.getMessage());
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
        return m;
    }
}
