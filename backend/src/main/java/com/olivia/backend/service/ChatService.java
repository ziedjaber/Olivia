package com.olivia.backend.service;

import com.olivia.backend.model.Message;
import com.olivia.backend.dto.ChatMessageDTO;
import com.olivia.backend.model.User;
import com.olivia.backend.repository.MessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ChatService {

    @Autowired 
    private MessageRepository messageRepository;
    
    @Autowired 
    private ConversationService conversationService;
    
    @Autowired 
    private UserService userService;

    public Message save(ChatMessageDTO dto, String senderId) throws Exception {
        User sender = userService.getUserById(senderId);
        
        Message message = new Message();
        message.setId(UUID.randomUUID().toString());
        message.setConversationId(dto.getConversationId());
        message.setSenderId(senderId);
        message.setSenderName(sender != null ? sender.getFullName() : "Utilisateur");
        message.setSenderRole(sender != null && sender.getRole() != null ? sender.getRole().name() : "");
        message.setReceiverId(dto.getReceiverId());
        message.setContent(dto.getContent());
        message.setImageUrl(dto.getImageUrl());
        message.setTimestamp(LocalDateTime.now().toString());
        message.setRead(false);

        messageRepository.save(message);

        conversationService.updateLastMessage(
            dto.getConversationId(),
            dto.getContent()
        );

        return message;
    }

    public List<Message> getMessagesByConversation(String conversationId) {
        return messageRepository.findByConversationId(conversationId);
    }

    public void markAsRead(String conversationId, String userId) {
        messageRepository.markAsRead(conversationId, userId);
    }
}