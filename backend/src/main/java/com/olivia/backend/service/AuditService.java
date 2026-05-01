package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
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

    /**
     * Version simplifiée pour les services qui n'ont pas tous les détails de l'acteur.
     */
    public void log(String userId, String action, String entityType, String details, String entityId) {
        try {
            // On pourrait injecter UserService ici, mais pour éviter les dépendances circulaires,
            // on va juste logger avec l'UID si on n'a pas le reste, ou laisser le service appelant fournir les infos.
            // Pour l'instant, on redirige vers la méthode complète avec des valeurs par défaut.
            log(userId, "Utilisateur System", "N/A", action, entityType, entityId, details);
        } catch (Exception e) {
            log.error("[AUDIT] Failed to save simplified audit log: {}", e.getMessage());
        }
    }

    /**
     * Enregistre une action dans les logs d'audit Firestore.
     */
    public void log(String userId, String userName, String userRole, String action, String entityType, String entityId, String details) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            AuditLog auditLog = new AuditLog();
            auditLog.setId(UUID.randomUUID().toString());
            auditLog.setTimestamp(Instant.now().toString());
            
            auditLog.setUserId(userId);
            auditLog.setUserName(userName);
            auditLog.setUserRole(userRole);
            
            auditLog.setAction(action);
            auditLog.setEntityType(entityType);
            auditLog.setEntityId(entityId);
            
            auditLog.setDetails(details);

            db.collection(COLLECTION_NAME).document(auditLog.getId()).set(auditLog).get(5, TimeUnit.SECONDS);
            log.info("[AUDIT] Action logged: {} on {} {} by {}", action, entityType, entityId, userName);
        } catch (Exception e) {
            log.error("[AUDIT] Failed to save audit log: {}", e.getMessage());
            // On ne bloque pas le flux principal pour une erreur d'audit
        }
    }

    /**
     * Récupère tous les logs d'audit, triés par date décroissante.
     */
    public List<AuditLog> getAll() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            // Récupération simple sans orderBy pour éviter les problèmes d'index Firestore non créés
            QuerySnapshot query = db.collection(COLLECTION_NAME).get().get(30, TimeUnit.SECONDS);
            
            List<AuditLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot document : query.getDocuments()) {
                try {
                    AuditLog logEntry = document.toObject(AuditLog.class);
                    if (logEntry != null) {
                        logEntry.setId(document.getId());
                        list.add(logEntry);
                    }
                } catch (Exception docEx) {
                    log.error("[AUDIT] Error deserializing log {}: {}", document.getId(), docEx.getMessage());
                }
            }
            
            // Tri manuel Java (plus récent en premier)
            list.sort((a, b) -> {
                if (a.getTimestamp() == null || b.getTimestamp() == null) return 0;
                return b.getTimestamp().compareTo(a.getTimestamp());
            });
            
            return list;
        } catch (Exception e) {
            log.error("[AUDIT] Error fetching audit logs: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
