package com.olivia.backend.repository;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.exceptions.BusinessLogicException;
import com.olivia.backend.exceptions.ResourceNotFoundException;
import com.olivia.backend.model.Conversation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
public class ConversationRepository {

    @Autowired
    private Firestore db;

    private static final String COLLECTION = "conversations";

    public Optional<Conversation> findById(String id) {
        try {
            var doc = db.collection(COLLECTION).document(id).get().get(30, TimeUnit.SECONDS);
            if (doc.exists()) {
                Conversation c = doc.toObject(Conversation.class);
                c.setId(doc.getId());
                return Optional.of(c);
            }
        } catch (Exception e) {
            log.error("[ERROR] Failed to find conversation by id: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void save(Conversation conversation) {
        try {
            db.collection(COLLECTION).document(conversation.getId()).set(conversation).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to save conversation: {}", e.getMessage());
            throw new BusinessLogicException("Failed to save conversation", e);
        }
    }

    public List<Conversation> findByParticipantId(String userId) {
        try {
            return db.collection(COLLECTION)
                    .whereArrayContains("participantIds", userId)
                    .get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Conversation c = d.toObject(Conversation.class);
                        c.setId(d.getId());
                        return c;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find conversations for user: {}", e.getMessage());
            return List.of();
        }
    }

    public List<Conversation> findAll() {
        try {
            return db.collection(COLLECTION).get().get(30, TimeUnit.SECONDS).getDocuments().stream()
                    .map(d -> {
                        Conversation c = d.toObject(Conversation.class);
                        c.setId(d.getId());
                        return c;
                    }).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("[ERROR] Failed to find all conversations: {}", e.getMessage());
            return List.of();
        }
    }

    public void updateFields(String id, Map<String, Object> fields) {
        try {
            db.collection(COLLECTION).document(id).update(fields).get(30, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.error("[ERROR] Failed to update conversation fields: {}", e.getMessage());
            throw new BusinessLogicException("Failed to update conversation fields", e);
        }
    }
}
