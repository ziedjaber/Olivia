package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.AuditLog;
import com.olivia.backend.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AuditLogService {

    @Lazy
    @Autowired
    private UserService userService;

    public void log(String userId, String action, String module, String details, String entityId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            AuditLog logEntry = new AuditLog();
            logEntry.setId(UUID.randomUUID().toString());
            logEntry.setTimestamp(new Date());
            logEntry.setUserId(userId);
            logEntry.setActionType(action);
            logEntry.setModule(module);
            logEntry.setDescription(details);
            logEntry.setEntityId(entityId);

            // Try to resolve username
            try {
                User user = userService.getUserById(userId);
                if (user != null) {
                    logEntry.setUserName(user.getFullName());
                }
            } catch (Exception e) {
                log.warn("Could not resolve username for audit log: {}", userId);
                logEntry.setUserName("Unknown User");
            }

            db.collection("audit_logs").document(logEntry.getId()).set(logEntry);
            log.info("[Audit] Action logged: {} in {} by {}", action, module, logEntry.getUserName());
        } catch (Exception e) {
            log.error("Failed to write audit log: {}", e.getMessage());
        }
    }

    public List<AuditLog> getAllLogs() throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        return db.collection("audit_logs")
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().get(30, TimeUnit.SECONDS)
                .getDocuments().stream()
                .map(doc -> doc.toObject(AuditLog.class))
                .collect(Collectors.toList());
    }

    public List<AuditLog> getLogsByModule(String module) throws Exception {
        Firestore db = FirestoreClient.getFirestore();
        return db.collection("audit_logs")
                .whereEqualTo("module", module)
                .orderBy("timestamp", Query.Direction.DESCENDING)
                .get().get(30, TimeUnit.SECONDS)
                .getDocuments().stream()
                .map(doc -> doc.toObject(AuditLog.class))
                .collect(Collectors.toList());
    }
}
