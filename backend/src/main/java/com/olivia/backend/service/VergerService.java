package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.olivia.backend.model.Verger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class VergerService {

    private static final String COLLECTION_NAME = "vergers";

    @Autowired
    private Firestore db;

    @Autowired
    private NotificationService notificationService;

    public List<Verger> getAllVergers() {
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            List<Verger> vergers = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Verger v = document.toObject(Verger.class);
                    if (v != null) {
                        v.setId(document.getId());
                        vergers.add(v);
                    }
                } catch (Exception docEx) {
                    log.error(
                            "Erreur de lecture sur un document verger (ID: {}). Données corrompues ignorées. Erreur: {}",
                            document.getId(), docEx.getMessage());
                }
            }
            return vergers;
        } catch (Exception e) {
            log.error("Error fetching all vergers: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Verger> getVergersByProprietaire(String ownerId) {
        if (ownerId == null)
            return new ArrayList<>();
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME)
                    .whereEqualTo("proprietaireId", ownerId)
                    .get().get(30, TimeUnit.SECONDS);
            List<Verger> vergers = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Verger v = document.toObject(Verger.class);
                    if (v != null) {
                        v.setId(document.getId());
                        vergers.add(v);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur document {} : {}", document.getId(), docEx.getMessage());
                }
            }
            return vergers;
        } catch (Exception e) {
            log.error("Error fetching vergers for owner {}: {}", ownerId, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Verger> getVergersByResponsable(String chefUid) {
        if (chefUid == null)
            return new ArrayList<>();
        try {
            QuerySnapshot query = db.collection(COLLECTION_NAME)
                    .whereEqualTo("responsableUid", chefUid)
                    .get().get(30, TimeUnit.SECONDS);
            List<Verger> vergers = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Verger v = document.toObject(Verger.class);
                    if (v != null) {
                        v.setId(document.getId());
                        vergers.add(v);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur document {} : {}", document.getId(), docEx.getMessage());
                }
            }
            return vergers;
        } catch (Exception e) {
            log.error("Error fetching vergers for responsable {}: {}", chefUid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Verger> getVergerById(String id) {
        if (id == null)
            return Optional.empty();
        try {
            var doc = db.collection(COLLECTION_NAME).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Verger v = doc.toObject(Verger.class);
                if (v != null) v.setId(doc.getId());
                return Optional.ofNullable(v);
            }
        } catch (Exception e) {
            log.error("Error fetching verger by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Verger createVerger(Verger verger) {
        try {
            if (verger.getId() == null || verger.getId().isEmpty()) {
                verger.setId(UUID.randomUUID().toString());
            }
            if (verger.getStatut() == null || verger.getStatut().isEmpty()) {
                verger.setStatut("EN_ATTENTE");
            }

            // Using a Map for safety to ensure Firestore Admin SDK handles it properly
            Map<String, Object> data = new HashMap<>();
            data.put("id", verger.getId());
            data.put("nom", verger.getNom());
            data.put("typeOlive", verger.getTypeOlive());
            data.put("niveauMaturite", verger.getNiveauMaturite());
            data.put("localisation", verger.getLocalisation());
            data.put("proprietaireId", verger.getProprietaireId());
            data.put("responsableUid", verger.getResponsableUid());
            data.put("responsableName", verger.getResponsableName());
            data.put("descriptionMaturite", verger.getDescriptionMaturite());
            data.put("imageMaturiteUrl", verger.getImageMaturiteUrl());
            data.put("dateDerniereMaturite", verger.getDateDerniereMaturite());
            data.put("nombreArbres", verger.getNombreArbres());
            data.put("statut", verger.getStatut());

            data.put("trees", verger.getTrees());

            // New Maturity Prediction Fields
            data.put("varieteOlive", verger.getVarieteOlive());
            data.put("datePlantation",
                    verger.getDatePlantation() != null ? verger.getDatePlantation().toString() : null);
            data.put("dateReferenceCalculGDD",
                    verger.getDateReferenceCalculGDD() != null ? verger.getDateReferenceCalculGDD().toString() : null);
            data.put("gddCumules", verger.getGddCumules());
            data.put("gddSeuilMaturite", verger.getGddSeuilMaturite());
            data.put("pourcentageMaturite", verger.getPourcentageMaturite());
            data.put("dateMaturitePrevue",
                    verger.getDateMaturitePrevue() != null ? verger.getDateMaturitePrevue().toString() : null);
            data.put("derniereMeteoJson", verger.getDerniereMeteoJson());

            db.collection(COLLECTION_NAME).document(verger.getId()).set(data).get(30, TimeUnit.SECONDS);
            
            // Notifications
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Nouveau Verger", "Un nouveau verger '" + verger.getNom() + "' a été ajouté au système.", "INFO");
            if (verger.getResponsableUid() != null) {
                notificationService.sendToUser(verger.getResponsableUid(), "Assignation de Verger", "Vous avez été assigné comme responsable du verger: " + verger.getNom(), "INFO");
            }

            log.info("Successfully saved verger {} to Firestore", verger.getId());
            return verger;
        } catch (Exception e) {
            log.error("Error creating verger: {}", e.getMessage());
            throw new RuntimeException("Failed to save Verger to Firestore", e);
        }
    }

    public Verger updateVerger(String id, Verger vergerDetails) {

        if (id == null)
            throw new IllegalArgumentException("ID cannot be null");
        try {
            vergerDetails.setId(id);

            Map<String, Object> data = new HashMap<>();
            data.put("id", id);
            data.put("nom", vergerDetails.getNom());
            data.put("typeOlive", vergerDetails.getTypeOlive());
            data.put("niveauMaturite", vergerDetails.getNiveauMaturite());
            data.put("localisation", vergerDetails.getLocalisation());
            data.put("proprietaireId", vergerDetails.getProprietaireId());
            data.put("responsableUid", vergerDetails.getResponsableUid());
            data.put("responsableName", vergerDetails.getResponsableName());
            data.put("descriptionMaturite", vergerDetails.getDescriptionMaturite());
            data.put("imageMaturiteUrl", vergerDetails.getImageMaturiteUrl());
            data.put("dateDerniereMaturite", vergerDetails.getDateDerniereMaturite());
            data.put("nombreArbres", vergerDetails.getNombreArbres());
            data.put("statut", vergerDetails.getStatut());
            data.put("trees", vergerDetails.getTrees());

            // New Maturity Prediction Fields
            data.put("varieteOlive", vergerDetails.getVarieteOlive());
            data.put("datePlantation",
                    vergerDetails.getDatePlantation() != null ? vergerDetails.getDatePlantation().toString() : null);
            data.put("dateReferenceCalculGDD",
                    vergerDetails.getDateReferenceCalculGDD() != null
                            ? vergerDetails.getDateReferenceCalculGDD().toString()
                            : null);
            data.put("gddCumules", vergerDetails.getGddCumules());
            data.put("gddSeuilMaturite", vergerDetails.getGddSeuilMaturite());
            data.put("pourcentageMaturite", vergerDetails.getPourcentageMaturite());
            data.put("dateMaturitePrevue",
                    vergerDetails.getDateMaturitePrevue() != null ? vergerDetails.getDateMaturitePrevue().toString()
                            : null);
            data.put("derniereMeteoJson", vergerDetails.getDerniereMeteoJson());

            db.collection(COLLECTION_NAME).document(id).set(data).get(30, TimeUnit.SECONDS);

            // NOTIFICATION 6: Mise à jour Verger
            notificationService.notifyRole(com.olivia.backend.model.Role.DIRECTEUR, "Verger Mis à Jour", "Le verger '" + vergerDetails.getNom() + "' a été modifié.", "INFO");

            return vergerDetails;
        } catch (Exception e) {
            log.error("Error updating verger {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to update Verger in Firestore", e);
        }
    }

    public void deleteVerger(String id) {

        if (id == null)
            return;

        try {
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error deleting verger {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete Verger from Firestore", e);
        }
    }

    public Verger generateTrees(String id, boolean force) {
        Verger verger = getVergerById(id).orElseThrow(() -> new RuntimeException("Verger not found"));
        if (!force && verger.getTrees() != null && !verger.getTrees().isEmpty()) {
            return verger; // already populated and not forced
        }
        
        if (verger.getLocalisation() == null || !verger.getLocalisation().contains(",")) return verger;
        try {
            String[] parts = verger.getLocalisation().split(",");
            double lat = Double.parseDouble(parts[0].trim());
            double lng = Double.parseDouble(parts[1].trim());

            int count = verger.getNombreArbres();
            if (count <= 0) return verger;
            // Cap at 200 trees for performance
            if (count > 200) count = 200;

            List<Verger.OliveTree> trees = new ArrayList<>();
            // Determine grid dimensions for a rectangle
            int cols = (int) Math.ceil(Math.sqrt(count * 1.5)); // Slightly wider than tall
            int rows = (int) Math.ceil((double) count / cols);
            
            // Tighter spacing for a cleaner 'rectangular' formation
            double spacingInDegrees = 0.00012; 

            int treeCount = 0;
            for (int r = 0; r < rows && treeCount < count; r++) {
                for (int c = 0; c < cols && treeCount < count; c++) {
                    // Center the grid on the verger's localization
                    double offLat = (r - (rows - 1) / 2.0) * spacingInDegrees;
                    double offLng = (c - (cols - 1) / 2.0) * spacingInDegrees / Math.cos(Math.toRadians(lat));

                    String tId = UUID.randomUUID().toString().substring(0, 8);
                    trees.add(new Verger.OliveTree(tId, lat + offLat, lng + offLng, "A_FAIRE"));
                    treeCount++;
                }
            }

            verger.setTrees(trees);
            updateVerger(verger.getId(), verger);
            return verger;
        } catch (Exception e) {
            log.error("Failed to generate trees for verger {}: {}", id, e.getMessage());
            throw new RuntimeException("Error generating trees", e);
        }
    }

    public Verger generateTrees(String id) {
        return generateTrees(id, false);
    }

    public Verger updateTreeStatus(String vergerId, String treeId, String status) {
        Verger verger = getVergerById(vergerId).orElseThrow(() -> new RuntimeException("Verger not found"));
        if (verger.getTrees() == null) return verger;

        boolean updated = false;
        for (Verger.OliveTree tree : verger.getTrees()) {
            if (tree.getId() != null && tree.getId().equals(treeId)) {
                tree.setStatus(status);
                updated = true;
                break;
            }
        }

        if (updated) {
            updateVerger(vergerId, verger);
        }
        return verger;
    }

}
