package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Verger;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class VergerService {

    private static final String COLLECTION_NAME = "vergers";

    public List<Verger> getAllVergers() {
        try {
            Firestore db = FirestoreClient.getFirestore();
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
            Firestore db = FirestoreClient.getFirestore();
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
            Firestore db = FirestoreClient.getFirestore();
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
            Firestore db = FirestoreClient.getFirestore();
            var doc = db.collection(COLLECTION_NAME).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                return Optional.ofNullable(doc.toObject(Verger.class));
            }
        } catch (Exception e) {
            log.error("Error fetching verger by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public Verger createVerger(Verger verger) {
        try {
            Firestore db = FirestoreClient.getFirestore();
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
            Firestore db = FirestoreClient.getFirestore();
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
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("Error deleting verger {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete Verger from Firestore", e);
        }
    }
}
