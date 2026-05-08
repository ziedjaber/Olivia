package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.AuditLog;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class AuditRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "audit_logs";

    public void save(AuditLog logEntry) {
        try {
            db.collection(COLLECTION).document(logEntry.getId()).set(logEntry).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save audit log: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save audit log", e);
        }
    }

    public List<AuditLog> findAll() {
        try {
            var query = db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS);
            List<AuditLog> list = new ArrayList<>();
            for (QueryDocumentSnapshot doc : query.getDocuments()) {
                AuditLog entry = doc.toObject(AuditLog.class);
                if (entry != null) {
                    entry.setId(doc.getId());
                    list.add(entry);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch audit logs: {}", e.getMessage());
            return new ArrayList<>();
        }
    }
}
