import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Message } from '../models/message.model';
import { Conversation } from '../models/conversation.model';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private apiUrl = 'http://localhost:8080/api/chat';

  private activeConversation = new BehaviorSubject<Conversation | null>(null);
  public activeConversation$ = this.activeConversation.asObservable();

  private unreadCounts = new BehaviorSubject<{ [convId: string]: number }>({});
  public unreadCounts$ = this.unreadCounts.asObservable();

  public totalUnreadCount$ = this.unreadCounts$.pipe(
    map(counts => Object.values(counts).reduce((sum, current) => sum + current, 0))
  );

  private isChatOpen = new BehaviorSubject<boolean>(false);
  public isChatOpen$ = this.isChatOpen.asObservable();

  constructor(private http: HttpClient) { }

  toggleChat(): void {
    this.isChatOpen.next(!this.isChatOpen.value);
  }

  setChatOpen(isOpen: boolean): void {
    this.isChatOpen.next(isOpen);
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.apiUrl}/conversations`);
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.http.get<Message[]>(
      `${this.apiUrl}/conversations/${conversationId}/messages`
    );
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/conversations/${conversationId}/read`, {}
    );
  }

  startConversation(targetUserId: string): Observable<Conversation> {
    return this.http.post<Conversation>(
      `${this.apiUrl}/conversations/start`,
      null,
      { params: { targetUserId } }
    ).pipe(
      tap(conv => {
        this.setActiveConversation(conv);
        this.setChatOpen(true);
      })
    );
  }

  setActiveConversation(conv: Conversation | null): void {
    this.activeConversation.next(conv);
  }

  updateUnreadCount(convId: string, count: number): void {
    const current = this.unreadCounts.value;
    this.unreadCounts.next({ ...current, [convId]: count });
  }
}
