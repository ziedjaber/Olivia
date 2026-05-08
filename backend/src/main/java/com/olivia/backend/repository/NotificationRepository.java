package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Repository
public class NotificationRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "notifications";

    public List<Notification> findByRecipientUid(String uid, int limit) {
        try {
            var docs = db.collection(COLLECTION)
                    .whereEqualTo("recipientUid", uid)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .limit(limit)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            
            List<Notification> list = new ArrayList<>();
            for (var d : docs) {
                Notification n = d.toObject(Notification.class);
                if (n != null) {
                    n.setId(d.getId());
                    list.add(n);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch notifications for {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public List<Notification> findUnreadByRecipientUid(String uid) {
        try {
            var docs = db.collection(COLLECTION)
                    .whereEqualTo("recipientUid", uid)
                    .whereEqualTo("read", false)
                    .get().get(30, TimeUnit.SECONDS).getDocuments();
            
            List<Notification> list = new ArrayList<>();
            for (var d : docs) {
                Notification n = d.toObject(Notification.class);
                if (n != null) {
                    n.setId(d.getId());
                    list.add(n);
                }
            }
            return list;
        } catch (Exception e) {
            log.error("[ERROR] Failed to fetch unread notifications for {}: {}", uid, e.getMessage());
            return new ArrayList<>();
        }
    }

    public Optional<Notification> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Notification n = doc.toObject(Notification.class);
                if (n != null) n.setId(doc.getId());
                return Optional.ofNullable(n);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find notification by id {}: {}", id, e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Notification n) {
        try {
            db.collection(COLLECTION).document(n.getId()).set(n).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save notification {}: {}", n.getId(), e.getMessage());
            throw new BusinessLogicException("Failed to save notification", e);
        }
    }

    public void deleteById(String id) {
        try {
            db.collection(COLLECTION).document(id).delete().get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to delete notification {}: {}", id, e.getMessage());
            throw new BusinessLogicException("Failed to delete notification", e);
        }
    }

    public void updateField(String id, String field, Object value) {
        try {
            db.collection(COLLECTION).document(id).update(field, value).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update notification field: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update notification field", e);
        }
    }
    
    public com.google.cloud.firestore.WriteBatch batch() {
        return db.batch();
    }
    
    public com.google.cloud.firestore.DocumentReference getReference(String id) {
        return db.collection(COLLECTION).document(id);
    }
}
