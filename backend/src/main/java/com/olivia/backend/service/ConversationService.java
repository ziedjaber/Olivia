package com.olivia.backend.service;

import com.olivia.backend.model.Conversation;
import com.olivia.backend.model.User;
import com.olivia.backend.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ConversationService {

    @Autowired 
    private ConversationRepository conversationRepository;
    
    @Autowired 
    private UserService userService;
   
    public Conversation getOrCreate(String userId1, String userId2) {
        List<Conversation> existing = conversationRepository.findByParticipantId(userId1);

        return existing.stream()
            .filter(c -> c.getParticipantIds() != null
                      && c.getParticipantIds().contains(userId2))
            .findFirst()
            .orElseGet(() -> createConversation(userId1, userId2));
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
            roles.put(id1, user1 != null && user1.getRole() != null ? user1.getRole().name() : "");
            roles.put(id2, user2 != null && user2.getRole() != null ? user2.getRole().name() : "");
            conv.setParticipantRoles(roles);

            Map<String, Integer> unread = new HashMap<>();
            unread.put(id1, 0);
            unread.put(id2, 0);
            conv.setUnreadCount(unread);

            conversationRepository.save(conv);

            return conv;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<Conversation> getConversationsByUser(String userId) {
        List<Conversation> convs = conversationRepository.findByParticipantId(userId);

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
    }

    public void updateLastMessage(String conversationId, String content) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("lastMessage", content);
        updates.put("lastTimestamp", LocalDateTime.now().toString());
        conversationRepository.updateFields(conversationId, updates);
    }

    public void fixMissingParticipantNames() {
        try {
            List<Conversation> conversations = conversationRepository.findAll();

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
                        
                        conversationRepository.updateFields(conv.getId(), updates);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to fix missing participant names: " + e.getMessage());
        }
    }
}