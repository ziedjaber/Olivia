package com.olivia.backend.service;

import com.google.firebase.messaging.*;
import com.olivia.backend.model.Notification;
import com.olivia.backend.repository.NotificationRepository;
import com.olivia.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public String sendNotification(String title, String body) throws Exception {
        Message message = Message.builder()
                .setNotification(com.google.firebase.messaging.Notification.builder()
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
            Notification notif = new Notification();
            String id = UUID.randomUUID().toString();
            notif.setId(id);
            notif.setRecipientUid(recipientUid);
            notif.setTitle(title);
            notif.setBody(body);
            notif.setType(type != null ? type : "INFO");
            notif.setRead(false);
            notif.setCreatedAt(java.time.Instant.now().toString());

            notificationRepository.save(notif);
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientUid, notif);
        } catch (Exception e) {
            System.err.println("Failed to send in-app notification to " + recipientUid + ": " + e.getMessage());
        }
    }

    public void notifyRole(com.olivia.backend.model.Role role, String title, String body, String type) {
        try {
            var users = userRepository.findAll().stream()
                    .filter(u -> role.equals(u.getRole()))
                    .toList();
            for (var user : users) {
                sendToUser(user.getId(), title, body, type);
            }
        } catch (Exception e) {
            System.err.println("Failed to notify users with role " + role + ": " + e.getMessage());
        }
    }

    public List<Notification> getUserNotifications(String uid) throws Exception {
        return notificationRepository.findByRecipientUid(uid, 50);
    }

    public void markAsRead(String notificationId, String uid) throws Exception {
        var optNotif = notificationRepository.findById(notificationId);
        if (optNotif.isPresent() && uid.equals(optNotif.get().getRecipientUid())) {
            notificationRepository.updateField(notificationId, "read", true);
            Map<String, Object> signal = new HashMap<>();
            signal.put("type", "READ_UPDATE");
            signal.put("notificationId", notificationId);
            messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
        } else {
            throw new Exception("Notification not found or access denied.");
        }
    }

    public void markAllAsRead(String uid) throws Exception {
        var docs = notificationRepository.findUnreadByRecipientUid(uid);
        
        if (docs.isEmpty()) return;

        com.google.cloud.firestore.WriteBatch batch = notificationRepository.batch();
        for (var doc : docs) {
            batch.update(notificationRepository.getReference(doc.getId()), "read", true);
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "READ_ALL_UPDATE");
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }

    public void markSelectedAsRead(List<String> ids, String uid) throws Exception {
        com.google.cloud.firestore.WriteBatch batch = notificationRepository.batch();
        for (String id : ids) {
            var opt = notificationRepository.findById(id);
            if (opt.isPresent() && uid.equals(opt.get().getRecipientUid())) {
                batch.update(notificationRepository.getReference(id), "read", true);
            }
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "READ_UPDATE");
        signal.put("bulk", true);
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }

    public void deleteSelected(List<String> ids, String uid) throws Exception {
        com.google.cloud.firestore.WriteBatch batch = notificationRepository.batch();
        for (String id : ids) {
            var opt = notificationRepository.findById(id);
            if (opt.isPresent() && uid.equals(opt.get().getRecipientUid())) {
                batch.delete(notificationRepository.getReference(id));
            }
        }
        batch.commit().get();

        Map<String, Object> signal = new HashMap<>();
        signal.put("type", "DELETE_UPDATE");
        messagingTemplate.convertAndSend("/topic/notifications/" + uid, signal);
    }
}

