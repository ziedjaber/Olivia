package com.olivia.backend.service;

import com.olivia.backend.model.Participation;
import com.olivia.backend.model.ParticipationStatus;
import com.olivia.backend.repository.ParticipationRepository;
import com.olivia.backend.repository.CollecteRepository;
import com.olivia.backend.repository.VergerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ParticipationService {

    @Autowired
    private ParticipationRepository participationRepository;

    @Autowired
    private CollecteRepository collecteRepository;

    @Autowired
    private VergerRepository vergerRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    // ─── QUERIES ──────────────────────────────────────────────────────────────

    public List<Participation> getByCollecte(String collecteId) {
        return participationRepository.findByCollecteId(collecteId);
    }

    public List<Participation> getByOuvrier(String ouvrierUid) {
        return participationRepository.findByOuvrierUid(ouvrierUid);
    }

    // ─── AVAILABILITY CHECK ───────────────────────────────────────────────────

    public boolean isWorkerAvailable(String ouvrierUid) {
        List<Participation> actives = participationRepository.findByOuvrierUid(ouvrierUid).stream()
                .filter(p -> ParticipationStatus.ACCEPTED.name().equals(p.getStatus()) 
                          || ParticipationStatus.ASSIGNED.name().equals(p.getStatus()))
                .collect(Collectors.toList());

        if (actives.isEmpty()) return true;

        for (Participation p : actives) {
            var mission = collecteRepository.findById(p.getCollecteId());
            if (mission.isPresent()) {
                String status = mission.get().getStatut();
                if (status != null && !status.equalsIgnoreCase("TERMINATED") && !status.equalsIgnoreCase("termine")) {
                    log.warn("[Availability] Worker {} is BUSY in mission {} ({})", ouvrierUid, p.getCollecteId(), status);
                    return false; 
                }
            }
        }
        return true; 
    }

    public List<Participation> getAllActiveParticipations() {
        List<Participation> candidates = participationRepository.findAll().stream()
                .filter(p -> ParticipationStatus.ACCEPTED.name().equals(p.getStatus()) 
                          || ParticipationStatus.ASSIGNED.name().equals(p.getStatus()))
                .collect(Collectors.toList());
        
        List<Participation> actuallyActive = new ArrayList<>();
        for (Participation p : candidates) {
            collecteRepository.findById(p.getCollecteId()).ifPresent(mission -> {
                String status = mission.getStatut();
                if (status != null && !status.equalsIgnoreCase("TERMINATED") && !status.equalsIgnoreCase("termine")) {
                    actuallyActive.add(p);
                }
            });
        }
        return actuallyActive;
    }

    // ─── INVITATION ───────────────────────────────────────────────────────────

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
        if (!isWorkerAvailable(ouvrierUid)) {
            throw new IllegalStateException("L'ouvrier " + ouvrierName + " est déjà engagé dans une mission active.");
        }

        List<Participation> existing = getByCollecte(collecteId);
        Optional<Participation> existingInvite = existing.stream()
                .filter(p -> p.getOuvrierUid().equals(ouvrierUid)
                        && !ParticipationStatus.REJECTED.name().equals(p.getStatus()))
                .findFirst();

        if (existingInvite.isPresent()) {
            Participation ep = existingInvite.get();
            String status = ep.getStatus();
            if (ParticipationStatus.ACCEPTED.name().equals(status) 
                    || ParticipationStatus.ASSIGNED.name().equals(status)) {
                throw new IllegalStateException("L'ouvrier " + ouvrierName + " a déjà accepté cette mission.");
            }
            notificationService.sendToUser(ouvrierUid, "Rappel : invitation de récolte", "Rappel de " + invitedByName + " : vous avez une invitation en attente.", "INVITATION");
            return ep;
        }

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

        participationRepository.save(p);
        log.info("Worker {} invited to collecte {}", ouvrierUid, collecteId);

        notificationService.sendToUser(ouvrierUid, "Nouvelle invitation de récolte", "Vous avez été invité(e) par " + invitedByName + " à participer à une récolte au verger: " + collecteLocation, "INVITATION");

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
    }

    // ─── WORKER RESPONSE ──────────────────────────────────────────────────────

    public Participation accept(String participationId, String ouvrierUid) {
        return updateStatus(participationId, ouvrierUid, ParticipationStatus.INVITED, ParticipationStatus.ACCEPTED);
    }

    public Participation reject(String participationId, String ouvrierUid) {
        return updateStatus(participationId, ouvrierUid, ParticipationStatus.INVITED, ParticipationStatus.REJECTED);
    }

    // ─── TEAM LEAD ACTIONS ────────────────────────────────────────────────────

    public void remove(String participationId) {
        participationRepository.findById(participationId).ifPresent(p -> {
            participationRepository.deleteById(participationId);
            notificationService.sendToUser(p.getOuvrierUid(), "Mission Annulée", "Votre participation à la mission " + p.getCollecteDescription() + " a été retirée.", "WARNING");
        });
        log.info("Participation {} removed.", participationId);
    }

    public Participation updateSalary(String participationId, Double newSalary) {
        Participation p = participationRepository.findById(participationId).orElseThrow(() -> new RuntimeException("Participation not found: " + participationId));
        p.setDailySalary(newSalary);
        participationRepository.save(p);
        log.info("Salary updated for participation {}.", participationId);
        notificationService.sendToUser(p.getOuvrierUid(), "Salaire Mis à Jour", "Votre salaire journalier a été modifié à " + newSalary + " DT.", "INFO");
        return p;
    }

    public Participation pay(String participationId) {
        Participation p = participationRepository.findById(participationId).orElseThrow(() -> new RuntimeException("Participation not found: " + participationId));
        p.setSalaryPaid(true);
        participationRepository.save(p);
        log.info("Salary paid for participation {}.", participationId);
        notificationService.sendToUser(p.getOuvrierUid(), "Paiement Reçu", "Votre salaire pour la mission " + p.getCollecteDescription() + " a été marqué comme payé.", "SUCCESS");
        return p;
    }

    // ─── PRIVATE HELPERS ──────────────────────────────────────────────────────

    private Participation updateStatus(String participationId, String requesterUid, ParticipationStatus expectedCurrent, ParticipationStatus newStatus) {
        Participation p = participationRepository.findById(participationId).orElseThrow(() -> new RuntimeException("Participation not found: " + participationId));

        if (!p.getOuvrierUid().equals(requesterUid)) {
            throw new SecurityException("You do not own this participation record.");
        }
        if (!expectedCurrent.name().equals(p.getStatus())) {
            throw new IllegalStateException("Cannot transition from " + p.getStatus());
        }

        p.setStatus(newStatus.name());
        p.setDateReponse(java.time.Instant.now().toString());
        participationRepository.save(p);

        notificationService.sendToUser(p.getInvitedByUid(),
            newStatus == ParticipationStatus.ACCEPTED ? "Invitation acceptée" : "Invitation refusée",
            p.getOuvrierName() + " a " + (newStatus == ParticipationStatus.ACCEPTED ? "accepté" : "refusé") + " l'invitation.",
            newStatus.name()
        );

        if (newStatus == ParticipationStatus.ACCEPTED) {
            checkTeamCompletion(p);
        }

        return p;
    }

    private void checkTeamCompletion(Participation p) {
        try {
            collecteRepository.findById(p.getCollecteId()).ifPresent(mission -> {
                Integer required = mission.getNumberOfWorkers();
                if (required != null && required > 0) {
                    long currentAccepted = participationRepository.findByCollecteId(p.getCollecteId()).stream()
                            .filter(part -> ParticipationStatus.ACCEPTED.name().equals(part.getStatus()))
                            .count();
                    
                    if (currentAccepted >= required) {
                        notificationService.sendToUser(p.getInvitedByUid(), "Équipe Complète", "Votre équipe pour la mission " + p.getCollecteDescription() + " est maintenant complète (" + currentAccepted + "/" + required + ").", "SUCCESS");
                    }
                }
            });
        } catch (Exception e) {
            log.error("Failed to check team completion: {}", e.getMessage());
        }
    }
}

