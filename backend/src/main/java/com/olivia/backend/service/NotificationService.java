package com.olivia.backend.service;

import com.google.firebase.messaging.*;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class NotificationService {

    private final com.google.cloud.firestore.Firestore db;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private static final String COL_NOTIF = "notifications";

    public NotificationService(com.google.cloud.firestore.Firestore db, org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate) {
        this.db = db;
        this.messagingTemplate = messagingTemplate;
    }

    public String sendNotification(String title, String body) throws Exception {
        Message message = Message.builder()
                .setNotification(Notification.builder()
                        .setTitle(title)
                        .setBody(body)
                        .build())
                .setTopic("alerts")
                .build();
        FirebaseMessaging.getInstance().send(message);
        return "Notification envoyée";
    }

    public void sendToUser(String recipientUid, String title, String body, String type) {
        try {
            Map<String, Object> notif = new HashMap<>();
            String id = UUID.randomUUID().toString();
            notif.put("id", id);
            notif.put("recipientUid", recipientUid);
            notif.put("title", title);
            notif.put("body", body);
            notif.put("type", type != null ? type : "INFO");
            notif.put("read", false);
            notif.put("createdAt", java.time.Instant.now().toString());
            db.collection(COL_NOTIF).document(id).set(notif).get();
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientUid, notif);
        } catch (Exception e) {
            System.err.println("Failed to send in-app notification to " + recipientUid + ": " + e.getMessage());
        }
    }

    public void notifyRole(com.olivia.backend.model.Role role, String title, String body, String type) {
        try {
            var docs = db.collection("users")
                    .whereEqualTo("role", role.name())
                    .get().get().getDocuments();
            for (var doc : docs) {
                sendToUser(doc.getId(), title, body, type);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify users with role " + role + ": " + e.getMessage());
        }
    }

    public List<Map<String, Object>> getUserNotifications(String uid) throws Exception {
        var docs = db.collection(COL_NOTIF)
                .whereEqualTo("recipientUid", uid)
                .limit(50)
                .get().get().getDocuments();
        
        List<Map<String, Object>> list = new ArrayList<>();
        for (var doc : docs) {
            Map<String, Object> data = doc.getData();
            data.put("id", doc.getId());
            list.add(data);
        }

        list.sort((a, b) -> {
            String ca = (String) a.getOrDefault("createdAt", "");
            String cb = (String) b.getOrDefault("createdAt", "");
            return cb.compareTo(ca);
        });

        return list;
    }

    public void markAsRead(String notificationId, String uid) throws Exception {
        var docRef = db.collection(COL_NOTIF).document(notificationId);
        var doc = docRef.get().get();
        if (doc.exists() && uid.equals(doc.getString("recipientUid"))) {
            docRef.update("read", true).get();
            Map<String, Object> signal = new HashMap<>();
            signal.put("type", "READ_UPDATE");
            signal.put("notificationId", notificationId);
            messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
        } else {
            throw new Exception("Notification not found or access denied.");
        }
    }

    public void markAllAsRead(String uid) throws Exception {
        var docs = db.collection(COL_NOTIF)
                .whereEqualTo("recipientUid", uid)
                .whereEqualTo("read", false)
                .get().get().getDocuments();
        
        if (docs.isEmpty()) return;

        com.google.cloud.firestore.WriteBatch batch = db.batch();
        for (var doc : docs) {
            batch.update(doc.getReference(), "read", true);
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "READ_ALL_UPDATE");
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }

    public void markSelectedAsRead(List<String> ids, String uid) throws Exception {
        com.google.cloud.firestore.WriteBatch batch = db.batch();
        for (String id : ids) {
            var docRef = db.collection(COL_NOTIF).document(id);
            var doc = docRef.get().get();
            if (doc.exists() && uid.equals(doc.getString("recipientUid"))) {
                batch.update(docRef, "read", true);
            }
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "READ_UPDATE");
        signal.put("bulk", true);
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }

    public void deleteSelected(List<String> ids, String uid) throws Exception {
        com.google.cloud.firestore.WriteBatch batch = db.batch();
        for (String id : ids) {
            var docRef = db.collection(COL_NOTIF).document(id);
            var doc = docRef.get().get();
            if (doc.exists() && uid.equals(doc.getString("recipientUid"))) {
                batch.delete(docRef);
            }
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "DELETE_UPDATE");
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }
}
