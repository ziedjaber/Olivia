export interface Message {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface ChatMessageDTO {
  conversationId: string;
  receiverId: string;
  content: string;
}

export interface TypingDTO {
  conversationId: string;
  receiverId: string;
  senderName: string;
  isTyping: boolean;
}