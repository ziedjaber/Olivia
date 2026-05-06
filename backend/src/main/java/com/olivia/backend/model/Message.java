package com.olivia.backend.model;

import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {
    private String id;
    private String conversationId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String receiverId;
    private String content;
    private String imageUrl;
    private String timestamp;
    private boolean read;
   
}