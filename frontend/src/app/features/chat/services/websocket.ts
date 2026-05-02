// import { Injectable } from '@angular/core';
// import { Client, IMessage } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { Subject } from 'rxjs';
// import { ChatMessageDTO, Message, TypingDTO } from '../models/message.model';

// @Injectable({ providedIn: 'root' })
// export class WebsocketService {

//   private client!: Client;
//   private messageSubject = new Subject<Message>();
//   private typingSubject = new Subject<TypingDTO>();

//   public messages$ = this.messageSubject.asObservable();
//   public typing$ = this.typingSubject.asObservable();

//   connect(token: string): void {
//     this.client = new Client({
//       webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
//       connectHeaders: { Authorization: `Bearer ${token}` },
//       reconnectDelay: 5000,
//       onConnect: () => {
//         this.subscribeToMessages();
//         this.subscribeToTyping();
//       },
//       onStompError: (frame) => {
//         console.error('WebSocket error:', frame);
//       }
//     });
//     this.client.activate();
//   }

//   private subscribeToMessages(): void {
//     this.client.subscribe('/user/queue/messages', (msg: IMessage) => {
//       const message: Message = JSON.parse(msg.body);
//       this.messageSubject.next(message);
//     });
//   }

//   private subscribeToTyping(): void {
//     this.client.subscribe('/user/queue/typing', (msg: IMessage) => {
//       const typing: TypingDTO = JSON.parse(msg.body);
//       this.typingSubject.next(typing);
//     });
//   }

//   sendMessage(payload: ChatMessageDTO): void {
//     this.client.publish({
//       destination: '/app/chat.send',
//       body: JSON.stringify(payload)
//     });
//   }

//   sendTyping(payload: TypingDTO): void {
//     this.client.publish({
//       destination: '/app/chat.typing',
//       body: JSON.stringify(payload)
//     });
//   }

//   disconnect(): void {
//     if (this.client?.active) {
//       this.client.deactivate();
//     }
//   }
// }


//test du front seulement 

// import { Injectable } from '@angular/core';
// import { Subject } from 'rxjs';
// import { Message, TypingDTO, ChatMessageDTO } from '../models/message.model';
// import { ChatService } from './chat';
// import { AuthService } from '../../../core/services/auth.service';

// @Injectable({ providedIn: 'root' })
// export class WebsocketService {

//   private useMockData = true; // ← même flag que ChatService

//   private messageSubject = new Subject<Message>();
//   private typingSubject = new Subject<TypingDTO>();

//   public messages$ = this.messageSubject.asObservable();
//   public typing$ = this.typingSubject.asObservable();

//   constructor(
//     private chatService: ChatService,
//     private authService: AuthService
//   ) {}

//   connect(token: string): void {
//     if (this.useMockData) {
//       console.log('[WebSocket Mock] Connecté en mode test.');
//       return;
//     }

//     // code WebSocket réel — activé quand useMockData = false
//     // import { Client } from '@stomp/stompjs';
//     // import SockJS from 'sockjs-client';
//     // this.client = new Client({ ... });
//     // this.client.activate();
//   }

//   sendMessage(payload: ChatMessageDTO): void {
//     if (this.useMockData) {
//       const currentUser = this.authService.currentUser();
//       const newMessage: Message = {
//         id: 'mock-' + Date.now(),
//         conversationId: payload.conversationId,
//         senderId: currentUser?.id ?? 'user1',
//         senderName: currentUser?.fullName ?? 'Moi',
//         senderRole: currentUser?.role ?? '',
//         receiverId: payload.receiverId,
//         content: payload.content,
//         timestamp: new Date(),
//         read: false
//       };

//       // persiste dans le mock
//       this.chatService.addMockMessage(newMessage);

//       // simule la réception immédiate (comme si le serveur renvoyait le message)
//       setTimeout(() => {
//         this.messageSubject.next(newMessage);
//       }, 100);

//       return;
//     }

//     // code WebSocket réel
//     // this.client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
//   }

//   sendTyping(payload: TypingDTO): void {
//     if (this.useMockData) return;
//     // this.client.publish({ destination: '/app/chat.typing', body: JSON.stringify(payload) });
//   }

//   disconnect(): void {
//     if (this.useMockData) return;
//     // if (this.client?.active) this.client.deactivate();
//   }
// }


/////////////////////////////
// import { Injectable } from '@angular/core';
// import { Client, IMessage } from '@stomp/stompjs';
// import SockJS from 'sockjs-client';
// import { Subject } from 'rxjs';
// import { Message, TypingDTO, ChatMessageDTO } from '../models/message.model';
// import { AuthService } from '../../../core/services/auth.service';

// @Injectable({ providedIn: 'root' })
// export class WebsocketService {

//   private client!: Client;
//   private messageSubject = new Subject<Message>();
//   private typingSubject  = new Subject<TypingDTO>();

//   public messages$ = this.messageSubject.asObservable();
//   public typing$   = this.typingSubject.asObservable();

//   private connected = false;

//   constructor(private authService: AuthService) {}

//   connect(token: string): void {
//     if (this.connected) return;

//     this.client = new Client({
//       webSocketFactory: () =>
//         new SockJS('http://localhost:8080/ws') as WebSocket,

//       connectHeaders: {
//         Authorization: `Bearer ${token}`
//       },

//       reconnectDelay: 5000,

//       onConnect: () => {
//         this.connected = true;
//         console.log('[WebSocket] Connecté au broker STOMP');
//         this.subscribeToMessages();
//         this.subscribeToTyping();
//       },

//       onStompError: (frame) => {
//         console.error('[WebSocket] Erreur STOMP :', frame);
//       },

//       onDisconnect: () => {
//         this.connected = false;
//         console.log('[WebSocket] Déconnecté');
//       }
//     });

//     this.client.activate();
//   }

//   private subscribeToMessages(): void {
//     this.client.subscribe(
//       '/user/queue/messages',
//       (msg: IMessage) => {
//         const message: Message = JSON.parse(msg.body);
//         this.messageSubject.next(message);
//       }
//     );
//   }

//   private subscribeToTyping(): void {
//     this.client.subscribe(
//       '/user/queue/typing',
//       (msg: IMessage) => {
//         const typing: TypingDTO = JSON.parse(msg.body);
//         this.typingSubject.next(typing);
//       }
//     );
//   }

//   sendMessage(payload: ChatMessageDTO): void {
//     if (!this.connected) {
//       console.warn('[WebSocket] Non connecté — message non envoyé');
//       return;
//     }
//     this.client.publish({
//       destination: '/app/chat.send',
//       body: JSON.stringify(payload)
//     });
//   }

//   sendTyping(payload: TypingDTO): void {
//     if (!this.connected) return;
//     this.client.publish({
//       destination: '/app/chat.typing',
//       body: JSON.stringify(payload)
//     });
//   }

//   disconnect(): void {
//     if (this.client?.active) {
//       this.client.deactivate();
//       this.connected = false;
//     }
//   }

//   isConnected(): boolean {
//     return this.connected;
//   }
// }


import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Subject } from 'rxjs';
import { Message, TypingDTO, ChatMessageDTO } from '../models/message.model';
import { AuthService } from '../../../core/services/auth.service';
import { getAuth } from 'firebase/auth';

@Injectable({ providedIn: 'root' })
export class WebsocketService {

  private client!: Client;
  private messageSubject = new Subject<Message>();
  private typingSubject = new Subject<TypingDTO>();
  private notificationSubject = new Subject<any>();

  public messages$ = this.messageSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();
  public notifications$ = this.notificationSubject.asObservable();

  private connected = false;

  constructor(private authService: AuthService) { }

  // async connect(): Promise<void> {
  //   if (this.connected) return;

  //   // récupère un token frais depuis Firebase
  //   let token: string | null = null;
  //   try {
  //     const firebaseUser = getAuth().currentUser;
  //     if (firebaseUser) {
  //       token = await firebaseUser.getIdToken(true); // true = force refresh
  //     }
  //   } catch {
  //     token = this.authService.getToken(); // fallback localStorage
  //   }

  //   if (!token) {
  //     console.error('[WebSocket] Aucun token disponible');
  //     return;
  //   }

  //   this.client = new Client({
  //     brokerURL: 'ws://localhost:8080/ws',

  //     connectHeaders: {
  //       Authorization: `Bearer ${token}`
  //     },

  //     reconnectDelay: 5000,

  //     onConnect: () => {
  //       this.connected = true;
  //       console.log('[WebSocket] Connecté');
  //       this.subscribeToMessages();
  //       this.subscribeToTyping();
  //     },

  //     onStompError: (frame) => {
  //       console.error('[WebSocket] Erreur STOMP :', frame.headers['message']);
  //     },

  //     onDisconnect: () => {
  //       this.connected = false;
  //       console.log('[WebSocket] Déconnecté');
  //     },

  //     onWebSocketError: (error) => {
  //       console.error('[WebSocket] Erreur connexion :', error);
  //     }
  //   });

  //   this.client.activate();
  // }

  async connect(): Promise<void> {
    if (this.connected || (this.client && this.client.active)) return;

    console.log('[WebSocket] Tentative de connexion...');
    const token = await this.getFreshTokenWithRetry();
    
    if (!token) {
      console.error('[WebSocket] Impossible d\'obtenir un token après plusieurs tentatives');
      return;
    }

    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      beforeConnect: async () => {
        const freshToken = await this.getFreshToken();
        if (freshToken && this.client) {
          this.client.connectHeaders = { Authorization: `Bearer ${freshToken}` };
        }
      },

      onConnect: () => {
        this.connected = true;
        console.log('[WebSocket] Connecté au serveur');
        this.subscribeToMessages();
        this.subscribeToTyping();
        this.subscribeToNotifications();
      },

      onStompError: (frame) => {
        console.error('[WebSocket] Erreur STOMP :', frame.headers['message']);
        if (frame.headers['message']?.includes('JWT')) {
            this.disconnect(); // Force reconnect with new token
        }
      },

      onDisconnect: () => {
        this.connected = false;
        console.log('[WebSocket] Déconnecté');
      },

      onWebSocketError: (error) => {
        console.error('[WebSocket] Erreur transport :', error);
      }
    });

    this.client.activate();
  }

  private async getFreshTokenWithRetry(retries = 3): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
      const token = await this.getFreshToken();
      if (token) return token;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return null;
  }

private async getFreshToken(): Promise<string | null> {
  try {
    const firebaseUser = getAuth().currentUser;
    if (firebaseUser) {
      const token = await firebaseUser.getIdToken(false);
      localStorage.setItem('token', token);
      return token;
    }
  } catch (e) {
    console.warn('[WebSocket] Impossible de rafraîchir le token Firebase');
  }
  return this.authService.getToken();
}

  private subscribeToMessages(): void {
    console.log('[Websocket] Subscribing to /user/queue/messages');
    this.client.subscribe(
      '/user/queue/messages',
      (msg: IMessage) => {
        console.log('[Websocket] Received message from queue:', msg.body);
        const message: Message = JSON.parse(msg.body);
        this.messageSubject.next(message);
      }
    );
  }

  private subscribeToTyping(): void {
    this.client.subscribe(
      '/user/queue/typing',
      (msg: IMessage) => {
        const typing: TypingDTO = JSON.parse(msg.body);
        this.typingSubject.next(typing);
      }
    );
  }

  private subscribeToNotifications(): void {
    const user = this.authService.currentUser();
    if (!user || !user.id) return;

    this.client.subscribe(
      `/topic/notifications/${user.id}`,
      (msg: IMessage) => {
        const notif = JSON.parse(msg.body);
        this.notificationSubject.next(notif);
      }
    );
  }

  sendMessage(payload: ChatMessageDTO): void {
    if (!this.connected) {
      console.warn('[WebSocket] Non connecté');
      return;
    }
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(payload)
    });
  }

  sendTyping(payload: TypingDTO): void {
    if (!this.connected) return;
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(payload)
    });
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}