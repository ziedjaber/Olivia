package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.SetOptions;
import com.olivia.backend.model.Alerte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AlerteService {

    private static final String COLLECTION_NAME = "alertes";

    @Autowired
    private Firestore db;

    @Autowired
    private NotificationService notificationService;

    public String create(Alerte alerte) throws Exception {
        try {
            if (alerte.getId() == null || alerte.getId().isEmpty()) {
                alerte.setId(UUID.randomUUID().toString());
            }

            if (alerte.getDate() == null) {
                alerte.setDate(java.time.Instant.now().toString());
            }

            if (alerte.getStatut() == null || alerte.getStatut().isEmpty()) {
                alerte.setStatut("NON_TRAITEE");
            }

            db.collection(COLLECTION_NAME).document(alerte.getId()).set(alerte).get(30, TimeUnit.SECONDS);

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
                    try {
                        var vergerDoc = db.collection("vergers").document(alerte.getVergerId()).get().get(10, TimeUnit.SECONDS);
                        if (vergerDoc.exists()) {
                            String ownerUid = vergerDoc.getString("proprietaireId");
                            if (ownerUid != null) {
                                notificationService.sendToUser(ownerUid, "Maturité Critique", "Votre verger '" + vergerDoc.getString("nom") + "' a atteint un niveau de maturité critique. Prévoyez la récolte.", "URGENT");
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Failed to notify owner of critical maturity: {}", e.getMessage());
                    }
                }
            }

            log.info("Alerte created with ID: {}", alerte.getId());
            return alerte.getId();
        } catch (Exception e) {
            log.error("Error creating alerte: {}", e.getMessage());
            throw e;
        }
    }

    public List<Alerte> getAll() {
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            List<Alerte> list = new ArrayList<>();

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

            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Alerte alerte = document.toObject(Alerte.class);
                    if (alerte != null) {
                        alerte.setId(document.getId());
                        list.add(alerte);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur de désérialisation d'une alerte (ID: {}).", document.getId());
                }
            }

            list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "")
                    .compareTo(a.getDate() != null ? a.getDate() : ""));

            return list;
        } catch (Exception e) {
            log.error("Error fetching all alertes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Alerte> getBySender(String uid) {
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME)
                    .whereEqualTo("senderUid", uid)
                    .get().get(30, TimeUnit.SECONDS);

            List<Alerte> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Alerte alerte = document.toObject(Alerte.class);
                    if (alerte != null) {
                        alerte.setId(document.getId());
                        list.add(alerte);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur de désérialisation pour l'user {}", uid);
                }
            }
            list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "")
                    .compareTo(a.getDate() != null ? a.getDate() : ""));
            return list;
        } catch (Exception e) {
            log.error("Error fetching alertes for sender {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public String update(String id, Alerte alerte) throws Exception {
        try {
            alerte.setId(id);
            db.collection(COLLECTION_NAME).document(id).set(alerte, SetOptions.merge()).get(30, TimeUnit.SECONDS);
            return id;
        } catch (Exception e) {
            log.error("Error updating alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }

    public String delete(String id) throws Exception {
        try {
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
            return id;
        } catch (Exception e) {
            log.error("Error deleting alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }

    public String solve(String id) throws Exception {
        try {
            db.collection(COLLECTION_NAME).document(id).update("statut", "TRAITEE").get(30, TimeUnit.SECONDS);
            return id;
        } catch (Exception e) {
            log.error("Error solving alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }
}