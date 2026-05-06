export interface Conversation {
  id?: string;
  participantIds: string[];
  participantNames: { [userId: string]: string };
  participantRoles: { [userId: string]: string };
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: { [userId: string]: number };
}
