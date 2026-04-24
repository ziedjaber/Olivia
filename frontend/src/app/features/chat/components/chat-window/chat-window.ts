// import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Subscription } from 'rxjs';
// import { ChatService } from '../../services/chat';
// import { WebsocketService } from '../../services/websocket';
// import { Message } from '../../models/message.model';
// import { Conversation } from '../../models/conversation.model';
// import { AuthService } from '../../../../core/services/auth.service';
// import { MessageBubbleComponent } from '../message-bubble/message-bubble';
// import { MessageInputComponent } from '../message-input/message-input';

// @Component({
//   selector: 'app-chat-window',
//   standalone: true,
//   imports: [CommonModule, MessageBubbleComponent, MessageInputComponent],
//   templateUrl: './chat-window.html',
//   styleUrls: ['./chat-window.css']
// })
// export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

//   @ViewChild('messagesEnd') messagesEnd!: ElementRef;

//   messages: Message[] = [];
//   activeConversation: Conversation | null = null;
//   currentUserId = '';
//   isTyping = false;
//   typingName = '';
//   private subs = new Subscription();
//   private shouldScroll = false;

//   constructor(
//     private chatService: ChatService,
//     private wsService: WebsocketService,
//     private authService: AuthService
//   ) {}

//   ngOnInit(): void {
//     this.currentUserId = this.authService.currentUser()?.id ?? '';

//     this.subs.add(
//       this.chatService.activeConversation$.subscribe(conv => {
//         this.activeConversation = conv;
//         if (conv) this.loadMessages(conv.id!);
//       })
//     );

//     this.subs.add(
//       this.wsService.messages$.subscribe(msg => {
//         if (msg.conversationId === this.activeConversation?.id) {
//           this.messages.push(msg);
//           this.shouldScroll = true;
//         }
//       })
//     );

//     this.subs.add(
//       this.wsService.typing$.subscribe(dto => {
//         if (dto.conversationId === this.activeConversation?.id) {
//           this.isTyping = dto.isTyping;
//           this.typingName = dto.senderName;
//           if (dto.isTyping) {
//             setTimeout(() => { this.isTyping = false; }, 3000);
//           }
//         }
//       })
//     );
//   }

//   private loadMessages(conversationId: string): void {
//     this.messages = [];
//     this.chatService.getMessages(conversationId).subscribe(msgs => {
//       this.messages = msgs;
//       this.shouldScroll = true;
//     });
//   }

//   isOwnMessage(msg: Message): boolean {
//     return msg.senderId === this.currentUserId;
//   }

//   getOtherParticipantName(): string {
//     if (!this.activeConversation) return '';
//     return Object.entries(this.activeConversation.participantNames)
//       .filter(([id]) => id !== this.currentUserId)
//       .map(([, name]) => name)[0] || '';
//   }

//   getOtherParticipantId(): string {
//     if (!this.activeConversation) return '';
//     return this.activeConversation.participantIds
//       .find(id => id !== this.currentUserId) || '';
//   }

//   ngAfterViewChecked(): void {
//     if (this.shouldScroll) {
//       this.scrollToBottom();
//       this.shouldScroll = false;
//     }
//   }

//   private scrollToBottom(): void {
//     try {
//       this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
//     } catch {}
//   }

//   ngOnDestroy(): void {
//     this.subs.unsubscribe();
//   }
// }
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat';
import { WebsocketService } from '../../services/websocket';
import { Message } from '../../models/message.model';
import { Conversation } from '../../models/conversation.model';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageBubbleComponent } from '../message-bubble/message-bubble';
import { MessageInputComponent } from '../message-input/message-input';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, MessageInputComponent],
  templateUrl: './chat-window.html',
  styleUrls: ['./chat-window.css']
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages: Message[] = [];
  activeConversation: Conversation | null = null;
  currentUserId = '';
  isTyping = false;
  typingName = '';
  isOnline = true;

  private subs = new Subscription();
  private shouldScroll = false;

  constructor(
    private chatService: ChatService,
    private wsService: WebsocketService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser()?.id ?? '';

    this.subs.add(
      this.chatService.activeConversation$.subscribe(conv => {
        console.log('📋 Active Conversation reçue :', conv);
        this.activeConversation = conv;
        if (conv?.id) {
          this.loadMessages(conv.id);
        } else {
          this.messages = [];
        }
      })
    );

    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        if (msg.conversationId === this.activeConversation?.id) {
          if (!this.messages.some(m => m.id === msg.id)) {
            this.messages.push(msg);
            this.shouldScroll = true;
          }
        }
      })
    );

    this.subs.add(
      this.wsService.typing$.subscribe(dto => {
        if (dto.conversationId === this.activeConversation?.id) {
          this.isTyping = dto.isTyping;
          this.typingName = dto.senderName || 'Quelqu\'un';
          if (dto.isTyping) {
            setTimeout(() => this.isTyping = false, 3000);
          }
        }
      })
    );
  }

  private loadMessages(conversationId: string): void {
    this.messages = [];
    this.chatService.getMessages(conversationId).subscribe({
      next: (msgs) => {
        this.messages = msgs || [];
        this.shouldScroll = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Erreur chargement messages:', err)
    });
  }

  // ==================== MÉTHODES HEADER ====================
  getOtherParticipantName(): string {
  if (!this.activeConversation?.participantNames) {
    return 'Utilisateur inconnu';
  }

  const names = this.activeConversation.participantNames;
  const otherEntry = Object.entries(names)
    .find(([id]) => id !== this.currentUserId);

  return otherEntry ? otherEntry[1] : 'Utilisateur inconnu';
}

  getOtherParticipantRole(): string {
    if (!this.activeConversation?.participantRoles) return '';

    const other = Object.entries(this.activeConversation.participantRoles)
      .find(([id]) => id !== this.currentUserId);

    return other ? other[1] : '';
  }

  getOtherParticipantAvatar(): string {
    const name = this.getOtherParticipantName();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128&bold=true`;
  }

  onAvatarError(event: Event): void {
    (event.target as HTMLImageElement).src = 
      'https://ui-avatars.com/api/?name=User&background=64748b&color=fff';
  }

  getOtherParticipantId(): string {
    if (!this.activeConversation?.participantIds) return '';
    return this.activeConversation.participantIds.find(id => id !== this.currentUserId) || '';
  }

  isOwnMessage(msg: Message): boolean {
    return msg.senderId === this.currentUserId;
  }

  closeChat(): void {
    this.chatService.setActiveConversation(null);
    this.messages = [];
    this.isTyping = false;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }, 30);
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}