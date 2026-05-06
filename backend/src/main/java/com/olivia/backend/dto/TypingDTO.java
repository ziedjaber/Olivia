package com.olivia.backend.dto;

public class TypingDTO {
    private String conversationId;
    private String receiverId;
    private String senderName;
    private boolean isTyping;

    public TypingDTO() {}

    public String getConversationId() { return conversationId; }
    public void setConversationId(String conversationId) { this.conversationId = conversationId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }

    public boolean isTyping() { return isTyping; }
    public void setTyping(boolean typing) { isTyping = typing; }
}