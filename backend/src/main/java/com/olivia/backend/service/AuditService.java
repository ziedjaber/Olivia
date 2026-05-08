package com.olivia.backend.service;

import com.olivia.backend.model.AuditLog;
import com.olivia.backend.repository.AuditRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class AuditService {

    @Autowired
    private AuditRepository auditRepository;

    /**
     * Version simplifiée pour les services qui n'ont pas tous les détails de l'acteur.
     */
    public void log(String userId, String action, String entityType, String details, String entityId) {
        log(userId, "Utilisateur System", "N/A", action, entityType, entityId, details);
    }

    /**
     * Enregistre une action dans les logs d'audit via le repository.
     */
    public void log(String userId, String userName, String userRole, String action, String entityType, String entityId, String details) {
        try {
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

            auditRepository.save(auditLog);
            log.info("[AUDIT] Action logged: {} on {} {} by {}", action, entityType, entityId, userName);
        } catch (Exception e) {
            log.error("[AUDIT] Failed to save audit log: {}", e.getMessage());
        }
    }

    /**
     * Récupère tous les logs d'audit.
     */
    public List<AuditLog> getAll() {
        List<AuditLog> list = auditRepository.findAll();
        // Tri manuel Java (plus récent en premier)
        list.sort((a, b) -> {
            if (a.getTimestamp() == null || b.getTimestamp() == null) return 0;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });
        return list;
    }
}

