package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.SetOptions;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Alerte;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AlerteService {

    public String create(Alerte alerte) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        System.out.println("[DIAGNOSTIC] AlerteService.create START");
        System.out.println("[DIAGNOSTIC] Saving Alerte - ID: " + alerte.getId() + ", UID: " + alerte.getSenderUid() + ", Desc: " + alerte.getDescription());

        if (alerte.getId() == null) {
            alerte.setId(UUID.randomUUID().toString());
        }
        
        // Use user-preferred status naming
        if (alerte.getStatut() == null) {
            alerte.setStatut("NON_TRAITEE");
        }
        
        if (alerte.getDate() == null) {
            alerte.setDate(new java.util.Date());
        }

        // Using set with merge to ensure no properties are lost if the doc exists
        db.collection("alertes").document(alerte.getId()).set(alerte).get();

        System.out.println("[DIAGNOSTIC] Firestore COMMIT SUCCESS for Alerte: " + alerte.getId());
        return "Alerte créée avec succès";
    }

    public List<Alerte> getAll() throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        List<Alerte> list = new ArrayList<>();

        // DIAGNOSTIC MOCK
        Alerte mock = new Alerte();
        mock.setId("diag-mock-001");
        mock.setType("MACHINE");
        mock.setDescription("SYSTEM DIAGNOSTIC: This is a mock alert to verify API connectivity.");
        mock.setImportance("MEDIUM");
        mock.setStatut("NON_TRAITEE");
        mock.setDate(new java.util.Date());
        mock.setSenderName("System Diagnostic");
        list.add(mock);

        db.collection("alertes").get().get().forEach(doc -> {
            try {
                Alerte a = doc.toObject(Alerte.class);
                if (a != null) {
                    list.add(a);
                }
            } catch (Exception e) {
                System.err.println("[DIAGNOSTIC] Failed to map alerte doc " + doc.getId() + ": " + e.getMessage());
            }
        });
        
        // Sort newest first
        list.sort((a, b) -> {
            if (a.getDate() == null || b.getDate() == null) return 0;
            return b.getDate().compareTo(a.getDate());
        });

        return list;
    }

    public List<Alerte> getBySender(String uid) throws Exception {
        System.out.println("[DIAGNOSTIC] getBySender CALLED for UID: " + uid);
        Firestore db = FirestoreClient.getFirestore();
        List<Alerte> list = new ArrayList<>();
        db.collection("alertes").whereEqualTo("senderUid", uid).get().get().forEach(doc -> {
            try {
                System.out.println("[DIAGNOSTIC] Found alerte doc: " + doc.getId());
                Alerte a = doc.toObject(Alerte.class);
                if (a != null) {
                    list.add(a);
                }
            } catch (Exception e) {
                System.err.println("[DIAGNOSTIC] Failed to map alerte doc " + doc.getId() + " for user " + uid + ": " + e.getMessage());
            }
        });
        System.out.println("[DIAGNOSTIC] Total alertes found for " + uid + ": " + list.size());
        list.sort((a, b) -> {
            if (a.getDate() == null || b.getDate() == null) return 0;
            return b.getDate().compareTo(a.getDate());
        });
        return list;
    }

    public String delete(String id) throws Exception {
        FirestoreClient.getFirestore().collection("alertes").document(id).delete();
        return "Alerte supprimée";
    }

    public String update(String id, Alerte alerte) throws Exception {
        alerte.setId(id);
        FirestoreClient.getFirestore().collection("alertes").document(id).set(alerte, SetOptions.merge());
        return "Alerte mise à jour";
    }

    public String solve(String id) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        
        Map<String, Object> updates = new HashMap<>();
        updates.put("statut", "TRAITEE");
        
        db.collection("alertes").document(id).update(updates);
        
        return "Alerte résolue";
    }
}