package com.olivia.backend.controller;

import com.google.cloud.firestore.Firestore;
import com.olivia.backend.dto.ChatMessageDTO;
import com.olivia.backend.dto.TypingDTO;
import com.olivia.backend.model.Conversation;
import com.olivia.backend.model.Message;
import com.olivia.backend.model.User;
import com.olivia.backend.service.ChatService;
import com.olivia.backend.service.ConversationService;
import com.olivia.backend.service.FileService;
import com.olivia.backend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@CrossOrigin(origins = "http://localhost:4200")
public class ChatController {

    @Autowired
    private ChatService chatService;
    @Autowired
    private ConversationService conversationService;
    @Autowired
    private UserService userService;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private FileService fileService;

    // ← injection du Bean Firestore depuis FirebaseConfig
    @Autowired
    private Firestore db;

//     @MessageMapping("/chat.send")
// public void sendMessage(@Payload ChatMessageDTO dto, Principal principal) throws Exception {
//     if (principal == null) {
//         System.err.println("[Chat] Principal null - impossible d'envoyer");
//         return;
//     }

//     String senderId = principal.getName();
//     System.out.println("[Chat] Message reçu de : " + senderId + " vers " + dto.getReceiverId());

//     Message saved = chatService.save(dto, senderId);

//     // Envoi au receiver
//     System.out.println("[Chat] Envoi à receiver: " + dto.getReceiverId());
//     messagingTemplate.convertAndSendToUser(
//         dto.getReceiverId(), "/queue/messages", saved);

//     // Envoi à l'expéditeur (pour qu'il voie son propre message en temps réel)
//     System.out.println("[Chat] Envoi à sender (echo): " + senderId);
//     messagingTemplate.convertAndSendToUser(
//         senderId, "/queue/messages", saved);
// }

@MessageMapping("/chat.send")
public void sendMessage(@Payload ChatMessageDTO dto, Principal principal) {
    if (principal == null) {
        System.err.println("[Chat] ERREUR : Principal null");
        return;
    }

    String senderId = principal.getName();
    System.out.println("[Chat] Message de " + senderId + " vers " + dto.getReceiverId() + " | content: " + dto.getContent());

    try {
        Message saved = chatService.save(dto, senderId);

        System.out.println("[Chat] Message sauvegardé avec ID: " + saved.getId());

        // Echo au sender
        System.out.println("[Chat] Tentative d'envoi WebSocket à senderId: " + senderId);
        messagingTemplate.convertAndSendToUser(senderId, "/queue/messages", saved);
        
        // Au receiver
        System.out.println("[Chat] Tentative d'envoi WebSocket à receiverId: " + dto.getReceiverId());
        messagingTemplate.convertAndSendToUser(dto.getReceiverId(), "/queue/messages", saved);

        System.out.println("[Chat] WebSocket OK : " + saved.getContent());
    } catch (Exception e) {
        System.err.println("[Chat] Erreur lors du save/envoi : " + e.getMessage());
        e.printStackTrace();
    }
}
    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingDTO dto, Principal principal) {
        if (principal == null)
            return;
        messagingTemplate.convertAndSendToUser(
                dto.getReceiverId(), "/queue/typing", dto);
    }

    @GetMapping("/api/chat/conversations")
    @ResponseBody
    public ResponseEntity<List<Conversation>> getConversations(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        return ResponseEntity.ok(
                conversationService.getConversationsByUser(principal.getName()));
    }

    @GetMapping("/api/chat/conversations/{id}/messages")
    @ResponseBody
    public ResponseEntity<List<Message>> getMessages(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getMessagesByConversation(id));
    }

    @PutMapping("/api/chat/conversations/{id}/read")
    @ResponseBody
    public ResponseEntity<Void> markAsRead(
            @PathVariable String id, Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        chatService.markAsRead(id, principal.getName());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/chat/conversations/start")
    @ResponseBody
    public ResponseEntity<Conversation> startConversation(
            @RequestParam String targetUserId,
            Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        Conversation conv = conversationService.getOrCreate(
                principal.getName(), targetUserId);
        return ResponseEntity.ok(conv);
    }

    @PostMapping("/api/chat/upload")
    @ResponseBody
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        System.out.println("[Chat] Appel endpoint upload reçu. Fichier: " + file.getOriginalFilename() + " Taille: " + file.getSize());
        try {
            String fileName = fileService.saveChatMessageImage(file);
            Map<String, String> res = new HashMap<>();
            res.put("url", "/uploads/chat/" + fileName);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/api/chat/conversations/migrate")
    @ResponseBody
    public ResponseEntity<String> migrateConversations() {
        try {
            List<Conversation> all = db.collection("conversations")
                    .get().get().toObjects(Conversation.class);

            int count = 0;
            for (Conversation conv : all) {
                boolean needsMigration = conv.getParticipantNames() == null
                        || conv.getParticipantNames().isEmpty();

                if (needsMigration && conv.getParticipantIds() != null) {
                    Map<String, String> names = new HashMap<>();
                    Map<String, String> roles = new HashMap<>();
                    Map<String, Integer> unread = new HashMap<>();

                    for (String uid : conv.getParticipantIds()) {
                        User u = userService.getUserById(uid);
                        names.put(uid, u != null ? u.getFullName() : "Utilisateur");
                        roles.put(uid, u != null && u.getRole() != null
                                ? u.getRole().name()
                                : "");
                        unread.put(uid, 0);
                    }

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("participantNames", names);
                    updates.put("participantRoles", roles);
                    updates.put("unreadCount", unread);
                    updates.put("lastTimestamp", LocalDateTime.now().toString());

                    db.collection("conversations")
                            .document(conv.getId())
                            .update(updates).get();
                    count++;
                }
            }
            return ResponseEntity.ok("Migration OK — " + count + " conversations");

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur : " + e.getMessage());
        }
    }
}