package com.olivia.backend.service;

import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.model.Collecte;
import com.olivia.backend.model.ParticipationStatus;
import com.olivia.backend.repository.CollecteRepository;
import com.olivia.backend.repository.VergerRepository;
import com.olivia.backend.repository.ParticipationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class CollecteService {

    @Autowired
    private CollecteRepository collecteRepository;

    @Autowired
    private VergerRepository vergerRepository;

    @Autowired
    private ParticipationRepository participationRepository;

    @Autowired
    private NotificationService notificationService;

    // ─── CRUD ─────────────────────────────────────────────────────────────────

    public List<Collecte> getAllCollectes() {
        return collecteRepository.findAll();
    }

    public List<Collecte> getCollectesByChef(String chefIdOrEmail) {
        log.info("[CollecteService] Fetching missions for chef identity: {}", chefIdOrEmail);
        return collecteRepository.findByChefUid(chefIdOrEmail);
    }

    public Optional<Collecte> getCollecteById(String id) {
        return collecteRepository.findById(id);
    }

    public Collecte createCollecte(Collecte collecte) {
        try {
            if (collecte.getId() == null || collecte.getId().isEmpty()) {
                collecte.setId(UUID.randomUUID().toString());
            }
            collecte.setStatut("PLANNED");

            collecteRepository.save(collecte);
            log.info("Collecte {} created", collecte.getId());

            // Notifications
            if (collecte.getChefUid() != null) {
                notificationService.sendToUser(collecte.getChefUid(), "Nouvelle Mission", "Vous avez été assigné comme chef d'équipe pour la récolte: " + collecte.getDescription() + " dans le verger: " + collecte.getVergerName(), "MISSION");
            }
            if (collecte.getLogisticsUid() != null) {
                notificationService.sendToUser(collecte.getLogisticsUid(), "Nouvelle Mission (Logistique)", "Vous devez préparer la logistique pour la récolte: " + collecte.getDescription() + " dans le verger: " + collecte.getVergerName(), "LOGISTICS");
            }

            // NOTIFICATION: Oléiculteur (Propriétaire du verger)
            if (collecte.getVergerId() != null) {
                vergerRepository.findById(collecte.getVergerId()).ifPresent(verger -> {
                    String ownerUid = verger.getProprietaireId();
                    if (ownerUid != null) {
                        notificationService.sendToUser(ownerUid, "Récolte Planifiée", "Une mission de récolte a été planifiée pour votre verger: " + verger.getNom(), "INFO");
                    }
                });
            }

            return collecte;
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to create collecte: " + e.getMessage(), e);
        }
    }

    public Collecte updateCollecte(String id, Collecte collecte) {
        collecte.setId(id);
        collecteRepository.save(collecte);

        // NOTIFICATION: Mission mise à jour
        if (collecte.getChefUid() != null) {
            notificationService.sendToUser(collecte.getChefUid(), "Mission Modifiée", "Les détails de votre mission " + collecte.getDescription() + " ont été mis à jour.", "INFO");
        }
        if (collecte.getLogisticsUid() != null) {
            notificationService.sendToUser(collecte.getLogisticsUid(), "Logistique Mission Mise à Jour", "Le planning pour la mission " + collecte.getDescription() + " a changé.", "INFO");
        }

        return collecte;
    }

    public void updateStatus(String id, String newStatus) {
        collecteRepository.updateField(id, "statut", newStatus);
    }

    public void deleteCollecte(String id) {
        collecteRepository.deleteById(id);
    }

    public void markLogisticsReady(String id, boolean ready) {
        collecteRepository.updateField(id, "logisticsReady", ready);
        if (ready) {
            collecteRepository.findById(id).ifPresent(collecte -> {
                if (collecte.getChefUid() != null) {
                    notificationService.sendToUser(collecte.getChefUid(), "Logistique Prête", "La logistique pour la mission " + collecte.getDescription() + " est maintenant prête.", "SUCCESS");
                }
            });
        }
    }

    public void markWorkersReady(String id, boolean ready) {
        collecteRepository.updateField(id, "workersReady", ready);
        if (ready) {
            collecteRepository.findById(id).ifPresent(collecte -> {
                if (collecte.getLogisticsUid() != null) {
                    notificationService.sendToUser(collecte.getLogisticsUid(), "Équipe Prête", "L'équipe d'ouvriers pour la mission " + collecte.getDescription() + " est maintenant prête.", "SUCCESS");
                }
            });
        }
    }

    // ─── LIFECYCLE ────────────────────────────────────────────────────────────

    public void startCollecte(String collecteId) {
        try {
            // 1. Update collecte status
            collecteRepository.updateField(collecteId, "statut", "en_cours");

            // 2. Transition all ACCEPTED → ASSIGNED
            var participations = participationRepository.findByCollecteId(collecteId).stream()
                    .filter(p -> ParticipationStatus.ACCEPTED.name().equals(p.getStatus()))
                    .toList();

            for (var p : participations) {
                participationRepository.updateField(p.getId(), "status", ParticipationStatus.ASSIGNED.name());
                notificationService.sendToUser(p.getOuvrierUid(), "Mission Démarrée", "La mission " + collecteId + " a démarré. Vous pouvez commencer le travail.", "INFO");
            }

            // NOTIFICATION: Oléiculteur (Début de récolte)
            collecteRepository.findById(collecteId).ifPresent(coll -> {
                if (coll.getVergerId() != null) {
                    vergerRepository.findById(coll.getVergerId()).ifPresent(verger -> {
                        String ownerUid = verger.getProprietaireId();
                        if (ownerUid != null) {
                            notificationService.sendToUser(ownerUid, "Début de Récolte", "L'équipe de récolte a commencé le travail dans votre verger: " + verger.getNom(), "SUCCESS");
                        }
                    });
                }
            });

            log.info("Collecte {} started. {} workers ASSIGNED.", collecteId, participations.size());
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to start collecte: " + e.getMessage(), e);
        }
    }

    public void endCollecte(String collecteId) {
        try {
            // 1. Update collecte status
            collecteRepository.updateField(collecteId, "statut", "termine");

            // 2. Transition all ASSIGNED → COMPLETED
            var participations = participationRepository.findByCollecteId(collecteId).stream()
                    .filter(p -> ParticipationStatus.ASSIGNED.name().equals(p.getStatus()))
                    .toList();

            for (var p : participations) {
                participationRepository.updateField(p.getId(), "status", ParticipationStatus.COMPLETED.name());
                notificationService.sendToUser(p.getOuvrierUid(), "Mission Terminée", "La mission " + collecteId + " est maintenant terminée. Merci pour votre travail.", "SUCCESS");
            }

            // NOTIFICATION: Directeur (Mission terminée)
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Mission Terminée", "La récolte " + collecteId + " a été clôturée avec succès.", "SUCCESS");

            // NOTIFICATION: Oléiculteur (Fin de récolte)
            collecteRepository.findById(collecteId).ifPresent(coll -> {
                if (coll.getVergerId() != null) {
                    vergerRepository.findById(coll.getVergerId()).ifPresent(verger -> {
                        String ownerUid = verger.getProprietaireId();
                        if (ownerUid != null) {
                            notificationService.sendToUser(ownerUid, "Récolte Terminée", "La récolte de votre verger '" + verger.getNom() + "' est terminée.", "SUCCESS");
                        }
                    });
                }
            });

            log.info("Collecte {} ended. {} workers COMPLETED.", collecteId, participations.size());
        } catch (Exception e) {
            throw new BusinessLogicException("Failed to end collecte: " + e.getMessage(), e);
        }
    }

    // ─── DAILY TRACKING ──────────────────────────────────────────────────────

    public Collecte verifyDay(String id) {
        Collecte c = collecteRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Collecte", "id", id));
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date());
        c.setLastVerificationDate(today);
        collecteRepository.updateField(id, "lastVerificationDate", today);
        return c;
    }

    public Collecte addDailyProgress(String id, Collecte.DailyProgress progress) {
        Collecte c = collecteRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Collecte", "id", id));
        
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
            progress.setId(c.getDailyReports().get(existingIndex).getId());
            c.getDailyReports().set(existingIndex, progress);
        } else {
            c.getDailyReports().add(progress);
        }

        collecteRepository.updateField(id, "dailyReports", c.getDailyReports());
        return c;
    }
}

