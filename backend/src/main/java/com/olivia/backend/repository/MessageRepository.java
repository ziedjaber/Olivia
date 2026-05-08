package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.model.Message;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class MessageRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "messages";

    public void save(Message message) {
        try {
            db.collection(COLLECTION).document(message.getId()).set(message).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save message: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save message", e);
        }
    }

    public List<Message> findByConversationId(String conversationId) {
        try {
            return db.collection(COLLECTION)
                    .whereEqualTo("conversationId", conversationId)
                    .orderBy("timestamp", Query.Direction.ASCENDING)
                    .get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Message m = d.toObject(Message.class);
                        m.setId(d.getId());
                        return m;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find messages for conversation: {}", e.getMessage());
            return List.of();
        }
    }

    public void markAsRead(String conversationId, String userId) {
        try {
            db.collection(COLLECTION)
                    .whereEqualTo("conversationId", conversationId)
                    .whereEqualTo("receiverId", userId)
                    .whereEqualTo("read", false)
                    .get().get(30, TimeUnit.SECONDS)
                    .getDocuments()
                    .forEach(doc -> doc.getReference().update("read", true));
        } catch (Exception e) {
            log.error("[ERROR] Failed to mark messages as read: {}", e.getMessage());
        }
    }
}
