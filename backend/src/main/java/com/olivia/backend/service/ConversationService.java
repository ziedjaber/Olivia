package com.olivia.backend.service;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import com.olivia.backend.model.Conversation;
import com.olivia.backend.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ConversationService {

    @Autowired private Firestore db;  // ← injection Bean
    @Autowired private UserService userService;
   
    public Conversation getOrCreate(String userId1, String userId2) {
        try {

            List<Conversation> existing = db.collection("conversations")
                .whereArrayContains("participantIds", userId1)
                .get().get()
                .toObjects(Conversation.class);

            return existing.stream()
                .filter(c -> c.getParticipantIds() != null
                          && c.getParticipantIds().contains(userId2))
                .findFirst()
                .orElseGet(() -> createConversation(userId1, userId2));

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }


    private Conversation createConversation(String id1, String id2) {
        try {
            User user1 = userService.getUserById(id1);
            User user2 = userService.getUserById(id2);

            Conversation conv = new Conversation();
            conv.setId(UUID.randomUUID().toString());
            conv.setParticipantIds(List.of(id1, id2));
            conv.setLastMessage("");
            conv.setLastTimestamp(LocalDateTime.now().toString());

            Map<String, String> names = new HashMap<>();
            names.put(id1, user1 != null ? user1.getFullName() : "Utilisateur");
            names.put(id2, user2 != null ? user2.getFullName() : "Utilisateur");
            conv.setParticipantNames(names);

            Map<String, String> roles = new HashMap<>();
            // Role est un enum — on appelle .name() pour avoir la String
            roles.put(id1, user1 != null && user1.getRole() != null
                ? user1.getRole().name() : "");
            roles.put(id2, user2 != null && user2.getRole() != null
                ? user2.getRole().name() : "");
            conv.setParticipantRoles(roles);

            Map<String, Integer> unread = new HashMap<>();
            unread.put(id1, 0);
            unread.put(id2, 0);
            conv.setUnreadCount(unread);

            db.collection("conversations")
              .document(conv.getId())
              .set(conv).get();

            return conv;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Conversation> getConversationsByUser(String userId) {
    try {

        List<Conversation> convs = db.collection("conversations")
                .whereArrayContains("participantIds", userId)
                .get().get()
                .toObjects(Conversation.class);

        // Force l'initialisation des Maps si elles sont null
        for (Conversation conv : convs) {
            if (conv.getParticipantNames() == null || conv.getParticipantNames().isEmpty()) {
                conv.setParticipantNames(new HashMap<>());
            }
            if (conv.getParticipantRoles() == null || conv.getParticipantRoles().isEmpty()) {
                conv.setParticipantRoles(new HashMap<>());
            }
            if (conv.getUnreadCount() == null || conv.getUnreadCount().isEmpty()) {
                conv.setUnreadCount(new HashMap<>());
            }
        }

        return convs;

    } catch (Exception e) {
        e.printStackTrace();
        return List.of();
    }
}
    public void updateLastMessage(String conversationId, String content) {
        try {
            Map<String, Object> updates = new HashMap<>();
            updates.put("lastMessage", content);
            updates.put("lastTimestamp", LocalDateTime.now().toString());
            db.collection("conversations")
              .document(conversationId)
              .update(updates).get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void fixMissingParticipantNames() {
        try {
            List<Conversation> conversations = db.collection("conversations")
                    .get().get()
                    .toObjects(Conversation.class);

            for (Conversation conv : conversations) {
                if (conv.getParticipantNames() == null || conv.getParticipantNames().isEmpty()) {
                    List<String> participantIds = conv.getParticipantIds();
                    
                    if (participantIds != null && !participantIds.isEmpty()) {
                        Map<String, String> updatedNames = new HashMap<>();
                        Map<String, String> updatedRoles = new HashMap<>();
                        
                        for (String userId : participantIds) {
                            User user = userService.getUserById(userId);
                            updatedNames.put(userId, user != null && user.getFullName() != null 
                                    ? user.getFullName() : "Inconnu");
                            updatedRoles.put(userId, user != null && user.getRole() != null 
                                    ? user.getRole().name() : "");
                        }
                        
                        Map<String, Object> updates = new HashMap<>();
                        updates.put("participantNames", updatedNames);
                        updates.put("participantRoles", updatedRoles);
                        
                        db.collection("conversations")
                          .document(conv.getId())
                          .update(updates).get();
                        
                        System.out.println("Conversation " + conv.getId() + " mise à jour avec succès.");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}