package com.olivia.backend.service;

import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.model.Alerte;
import com.olivia.backend.repository.AlerteRepository;
import com.olivia.backend.repository.VergerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
public class AlerteService {

    @Autowired
    private AlerteRepository alerteRepository;

    @Autowired
    private VergerRepository vergerRepository;

    @Autowired
    private NotificationService notificationService;

    public String create(Alerte alerte) {
        if (alerte.getId() == null || alerte.getId().isEmpty()) {
            alerte.setId(UUID.randomUUID().toString());
        }

        if (alerte.getDate() == null) {
            alerte.setDate(java.time.Instant.now().toString());
        }

        if (alerte.getStatut() == null || alerte.getStatut().isEmpty()) {
            alerte.setStatut("NON_TRAITEE");
        }

        alerteRepository.save(alerte);

        // Notifications par rôle
        if ("WEATHER".equalsIgnoreCase(alerte.getType()) || "RISQUE_GEL".equalsIgnoreCase(alerte.getType()) || "PLUIE_FORTE".equalsIgnoreCase(alerte.getType())) {
            notificationService.notifyRole(com.olivia.backend.model.Role.CHEF_EQUIPE_RECOLTE, "Alerte Météo", alerte.getDescription(), "WARNING");
        } else if ("STOCK".equalsIgnoreCase(alerte.getType()) || "MACHINE".equalsIgnoreCase(alerte.getType())) {
            notificationService.notifyRole(com.olivia.backend.model.Role.RESPONSABLE_LOGISTIQUE, "Alerte Logistique", alerte.getDescription(), "ERROR");
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Alerte Système", alerte.getDescription(), "ERROR");
        } else if ("MATURITE_IMMINENTE".equalsIgnoreCase(alerte.getType())) {
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Maturité Critique", alerte.getDescription(), "URGENT");
            
            // NOTIFICATION: Oléiculteur spécifique
            if (alerte.getVergerId() != null) {
                vergerRepository.findById(alerte.getVergerId()).ifPresent(verger -> {
                    String ownerUid = verger.getProprietaireId();
                    if (ownerUid != null) {
                        notificationService.sendToUser(ownerUid, "Maturité Critique", "Votre verger '" + verger.getNom() + "' a atteint un niveau de maturité critique. Prévoyez la récolte.", "URGENT");
                    }
                });
            }
        }

        log.info("Alerte created with ID: {}", alerte.getId());
        return alerte.getId();
    }

    public List<Alerte> getAll() {
        List<Alerte> list = alerteRepository.findAll();

        // Mock diagnostic
        Alerte mock = new Alerte();
        mock.setId("diag-mock-001");
        mock.setType("MACHINE");
        mock.setDescription("SYSTEM DIAGNOSTIC: Verify API connectivity.");
        mock.setImportance("MEDIUM");
        mock.setStatut("NON_TRAITEE");
        mock.setDate(java.time.Instant.now().toString());
        mock.setSenderName("System Diagnostic");
        list.add(mock);

        list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "")
                .compareTo(a.getDate() != null ? a.getDate() : ""));

        return list;
    }

    public List<Alerte> getBySender(String uid) {
        List<Alerte> list = alerteRepository.findBySenderUid(uid);
        list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "")
                .compareTo(a.getDate() != null ? a.getDate() : ""));
        return list;
    }

    public String update(String id, Alerte alerte) {
        if (!alerteRepository.findById(id).isPresent()) {
            throw new ResourceNotFoundException("Alerte", "id", id);
        }
        alerte.setId(id);
        alerteRepository.update(alerte);
        return id;
    }

    public String delete(String id) {
        if (!alerteRepository.findById(id).isPresent()) {
            throw new ResourceNotFoundException("Alerte", "id", id);
        }
        alerteRepository.deleteById(id);
        return id;
    }

    public String solve(String id) {
        if (!alerteRepository.findById(id).isPresent()) {
            throw new ResourceNotFoundException("Alerte", "id", id);
        }
        alerteRepository.updateField(id, "statut", "TRAITEE");
        return id;
    }

    public void deleteAll() {
        alerteRepository.deleteAll();
    }
}