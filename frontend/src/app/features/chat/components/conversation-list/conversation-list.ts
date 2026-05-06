import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat';
import { WebsocketService } from '../../services/websocket';
import { Conversation } from '../../models/conversation.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UnreadBadgeDirective } from '../../directives/unread-badge';

interface AppUser {
  id: string;
  fullName: string;
  role: string;
  email: string;
  avatarUrl?: string;
}

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, UnreadBadgeDirective],
  templateUrl: './conversation-list.html',
  styleUrls: ['./conversation-list.css']
})
export class ConversationListComponent implements OnInit, OnDestroy {

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  allUsers: AppUser[] = [];
  filteredUsers: AppUser[] = [];
  searchQuery = '';
  currentUserId = '';
  view: 'conversations' | 'users' = 'conversations';
  private subs = new Subscription();

  constructor(
    private chatService: ChatService,
    private wsService: WebsocketService,
    private authService: AuthService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser()?.id ?? '';
    this.loadConversations();
    this.loadUsers();
    this.listenToNewMessages();
  }

  private loadConversations(): void {
    this.subs.add(
      this.chatService.getConversations().subscribe({
        next: convs => { 
          this.conversations = convs;
          this.sortConversations();
          this.onSearch();
        },
        error: err => console.error('[Chat] Erreur conversations:', err)
      })
    );
  }

  private loadUsers(): void {
    this.subs.add(
      this.http.get<AppUser[]>('http://localhost:8080/api/users').subscribe({
        next: users => {
          // exclure l'utilisateur courant
          this.allUsers = users.filter(u => u.id !== this.currentUserId);
          this.filteredUsers = [...this.allUsers];
        },
        error: err => console.error('[Chat] Erreur users:', err)
      })
    );
  }

  private listenToNewMessages(): void {
    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        const conv = this.conversations.find(c => c.id === msg.conversationId);
        if (conv) {
          conv.lastMessage = msg.content;
          conv.lastTimestamp = msg.timestamp;  // ✅ string = string
          if (msg.senderId !== this.currentUserId) {
            conv.unreadCount[this.currentUserId] =
              (conv.unreadCount[this.currentUserId] || 0) + 1;
          }
          this.sortConversations();
          this.onSearch();
          this.cdr.detectChanges();
        } else {
          this.loadConversations();
        }
      })
    );
  }

  private sortConversations(): void {
    this.conversations.sort((a, b) => {
      const timeA = new Date(a.lastTimestamp || 0).getTime();
      const timeB = new Date(b.lastTimestamp || 0).getTime();
      return timeB - timeA; // Descending: newest first
    });
  }

  onSearch(): void {
    const q = (this.searchQuery || '').toLowerCase();
    
    // Filtre sur les utilisateurs
    this.filteredUsers = this.allUsers.filter(u =>
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
    
    // Filtre sur les conversations
    this.filteredConversations = this.conversations.filter(c => {
      const otherName = this.getOtherName(c).toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      return otherName.includes(q) || lastMsg.includes(q);
    });

    // Unified Search Logic: If searching and no conversations found, switch to users view
    if (q !== '' && this.filteredConversations.length === 0 && this.view === 'conversations') {
       // but only if we have users matching
       if (this.filteredUsers.length > 0) {
         this.view = 'users';
       }
    } else if (q === '' && this.view === 'users') {
       this.view = 'conversations';
    }

    this.cdr.detectChanges();
  }

  selectConversation(conv: Conversation): void {
    // enrichir participantNames depuis allUsers si manquant
    const enriched = this.enrichConversation(conv);
    this.chatService.setActiveConversation(enriched);
    enriched.unreadCount[this.currentUserId] = 0;
    this.chatService.markAsRead(enriched.id!).subscribe();
  }

  startConversationWith(user: AppUser): void {
    this.chatService.startConversation(user.id).subscribe({
      next: conv => {
        const enriched = this.enrichConversation(conv);
        if (!this.conversations.find(c => c.id === enriched.id)) {
          this.conversations.unshift(enriched);
        }
        this.chatService.setActiveConversation(enriched);
        this.view = 'conversations';
        this.searchQuery = '';
        this.onSearch();
      },
      error: err => console.error('[Chat] Erreur:', err)
    });
  }

  private enrichConversation(conv: Conversation): Conversation {
    // si participantNames est déjà rempli — on ne fait rien
    const hasNames = conv.participantNames &&
      Object.values(conv.participantNames).some(n => n && n !== '');

    if (hasNames) return conv;

    // remplir depuis allUsers
    const names: { [key: string]: string } = {};
    const roles: { [key: string]: string } = {};
    const unread: { [key: string]: number } = {};

    conv.participantIds?.forEach(uid => {
      const user = this.allUsers.find(u => u.id === uid);
      if (user) {
        names[uid] = user.fullName;
        roles[uid] = user.role;
      } else if (uid === this.currentUserId) {
        const me = this.authService.currentUser();
        names[uid] = me?.fullName ?? 'Moi';
        roles[uid] = me?.role ?? '';
      } else {
        names[uid] = 'Utilisateur';
        roles[uid] = '';
      }
      unread[uid] = conv.unreadCount?.[uid] ?? 0;
    });

    return {
      ...conv,
      participantNames: names,
      participantRoles: roles,
      unreadCount: unread
    };
  }

  getOtherName(conv: Conversation): string {
    if (!conv?.participantNames) return 'Inconnu';
    return Object.entries(conv.participantNames)
      .filter(([id]) => id !== this.currentUserId)
      .map(([, name]) => name)[0] || 'Inconnu';
  }

  getOtherRole(conv: Conversation): string {
    if (!conv?.participantRoles) return '';
    return Object.entries(conv.participantRoles)
      .filter(([id]) => id !== this.currentUserId)
      .map(([, role]) => role)[0] || '';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getUnread(conv: Conversation): number {
    if (!conv?.unreadCount) return 0;
    return conv.unreadCount[this.currentUserId] || 0;
  }

  getRoleColor(role: string): string {
    const r = role?.toLowerCase() || '';
    if (r.includes('directeur')) return 'av-purple';
    if (r.includes('chef')) return 'av-teal';
    if (r.includes('oleiculteur') || r.includes('oléiculteur')) return 'av-amber';
    return 'av-gray';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
