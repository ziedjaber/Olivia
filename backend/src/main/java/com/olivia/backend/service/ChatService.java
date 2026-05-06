package com.olivia.backend.service;

import com.olivia.backend.model.Message;
import com.olivia.backend.model.Conversation;
import com.olivia.backend.dto.ChatMessageDTO;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.google.firebase.cloud.FirestoreClient;
import com.google.cloud.firestore.Firestore;
import com.olivia.backend.model.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class ChatService {

    @Autowired private Firestore db;
    @Autowired private ConversationService conversationService;
    @Autowired private UserService userService;

    public Message save(ChatMessageDTO dto, String senderId) throws Exception {
        User sender = userService.getUserById(senderId);
            if (sender == null) {
                System.err.println("[ChatService] User non trouvé pour ID: " + senderId);
            }
        Message message = new Message();
        message.setId(UUID.randomUUID().toString());
        message.setConversationId(dto.getConversationId());
        message.setSenderId(senderId);
        message.setSenderName(sender != null ? sender.getFullName() : "Utilisateur");
        message.setSenderRole(sender != null && sender.getRole() != null
            ? sender.getRole().name() : "");
        message.setReceiverId(dto.getReceiverId());
        message.setContent(dto.getContent());
        message.setImageUrl(dto.getImageUrl());
        message.setTimestamp(LocalDateTime.now().toString()); // stocké en String
        message.setRead(false);

        try {
            db.collection("messages")
              .document(message.getId())
              .set(message).get();

            conversationService.updateLastMessage(
                dto.getConversationId(),
                dto.getContent()
            );
        } catch (Exception e) {
            e.printStackTrace();
        }

        return message;
    }

    public List<Message> getMessagesByConversation(String conversationId) {
        try {
            List<Message> msgs = db.collection("messages")
                     .whereEqualTo("conversationId", conversationId)
                     .get().get()
                     .toObjects(Message.class);
            msgs.sort((a, b) -> a.getTimestamp().compareTo(b.getTimestamp()));
            return msgs;
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public void markAsRead(String conversationId, String userId) {
        try {
            db.collection("messages")
              .whereEqualTo("conversationId", conversationId)
              .whereEqualTo("receiverId", userId)
              .whereEqualTo("read", false)
              .get().get()
              .getDocuments()
              .forEach(doc -> doc.getReference().update("read", true));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}