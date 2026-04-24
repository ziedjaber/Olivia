package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Alerte;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AlerteService {

    private static final String COLLECTION_NAME = "alertes";

    public String create(Alerte alerte) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();
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
            log.info("Alerte created with ID: {}", alerte.getId());
            return alerte.getId();
        } catch (Exception e) {
            log.error("Error creating alerte: {}", e.getMessage());
            throw e;
        }
    }

    public List<Alerte> getAll() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            List<Alerte> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    Alerte alerte = document.toObject(Alerte.class);
                    if (alerte != null) {
                        alerte.setId(document.getId());
                        list.add(alerte);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur de désérialisation d'une alerte (ID: {}). Ignorée.", document.getId());
                }
            }
            list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "").compareTo(a.getDate() != null ? a.getDate() : ""));
            return list;
        } catch (Exception e) {
            log.error("Error fetching all alertes: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Alerte> getBySender(String uid) {
        try {
            Firestore db = FirestoreClient.getFirestore();
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
                    log.error("Erreur de désérialisation d'une alerte (ID: {}). Ignorée.", document.getId());
                }
            }
            list.sort((a, b) -> (b.getDate() != null ? b.getDate() : "").compareTo(a.getDate() != null ? a.getDate() : ""));
            return list;
        } catch (Exception e) {
            log.error("Error fetching alertes for sender {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public String update(String id, Alerte alerte) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();
            alerte.setId(id);
            db.collection(COLLECTION_NAME).document(id).set(alerte).get(30, TimeUnit.SECONDS);
            log.info("Alerte updated with ID: {}", id);
            return id;
        } catch (Exception e) {
            log.error("Error updating alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }

    public String delete(String id) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).document(id).delete().get(30, TimeUnit.SECONDS);
            log.info("Alerte deleted with ID: {}", id);
            return id;
        } catch (Exception e) {
            log.error("Error deleting alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }

    public String solve(String id) throws Exception {
        try {
            Firestore db = FirestoreClient.getFirestore();
            db.collection(COLLECTION_NAME).document(id).update("statut", "TRAITEE").get(30, TimeUnit.SECONDS);
            log.info("Alerte solved with ID: {}", id);
            return id;
        } catch (Exception e) {
            log.error("Error solving alerte {}: {}", id, e.getMessage());
            throw e;
        }
    }
}