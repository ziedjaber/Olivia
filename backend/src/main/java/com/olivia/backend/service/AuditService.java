package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AuditService {

    private static final String COLLECTION_NAME = "audit_logs";

    public void log(String acteurUid, String acteurNom, String acteurRole, String action, String entite, String entiteId, String details) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            AuditLog auditLog = new AuditLog();
            auditLog.setId(UUID.randomUUID().toString());
            auditLog.setTimestamp(Instant.now().toString());
            auditLog.setActeurUid(acteurUid);
            auditLog.setActeurNom(acteurNom);
            auditLog.setActeurRole(acteurRole);
            auditLog.setAction(action);
            auditLog.setEntite(entite);
            auditLog.setEntiteId(entiteId);
            auditLog.setDetails(details);

            db.collection(COLLECTION_NAME).document(auditLog.getId()).set(auditLog).get(5, TimeUnit.SECONDS);
            log.info("Audit log created: {} on {} by {}", action, entite, acteurNom);
        } catch (Exception e) {
            log.error("Failed to save audit log: {}", e.getMessage());
            // Never break main flow
        }
    }

    public List<AuditLog> getAll() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            // Retrait temporaire du orderBy pour éviter les erreurs d'index Firestore
            QuerySnapshot query = db.collection(COLLECTION_NAME)
                    .get().get(30, TimeUnit.SECONDS);
            
            List<AuditLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    AuditLog logEntry = document.toObject(AuditLog.class);
                    if (logEntry != null) {
                        logEntry.setId(document.getId());
                        list.add(logEntry);
                    }
                } catch (Exception docEx) {
                    log.error("Erreur de désérialisation log {}: {}", document.getId(), docEx.getMessage());
                }
            }
            // Tri manuel dans Java (plus récent en premier) pour éviter l'index Firestore
            list.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
            return list;
        } catch (Exception e) {
            log.error("Error fetching audit logs: {}", e.getMessage());
            return new ArrayList<>(); // On renvoie une liste vide au lieu de faire planter le front
        }
    }
}
