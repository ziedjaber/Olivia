import { Component, OnInit, OnDestroy, signal, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { ToastComponent } from '../../ui/toast/toast.component';
import { ChatPageComponent } from '../../../../features/chat/components/chat-page/chat-page';
import { WebsocketService } from '../../../../features/chat/services/websocket';
import { ChatService } from '../../../../features/chat/services/chat';
import { ToastService } from '../../../../core/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Subscription, take } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, NavbarComponent, ToastComponent, ChatPageComponent],
  template: `
    <div class="min-h-screen bg-background text-on-background antialiased flex relative">
      <app-sidebar></app-sidebar>
      <div class="flex-grow min-h-screen transition-all duration-500 relative z-0"
           [class.pl-64]="!isSidebarCollapsed()"
           [class.pl-20]="isSidebarCollapsed()">
        <app-navbar [isSidebarCollapsed]="isSidebarCollapsed()"></app-navbar>
        <main class="pt-16 p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
      <app-chat-page></app-chat-page>
      <app-toast></app-toast>
    </div>
  `
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  // --- Services (Injection moderne via inject()) ---
  private wsService = inject(WebsocketService);
  private chatService = inject(ChatService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // --- État de l'UI (Signal de ta version HEAD) ---
  isSidebarCollapsed = signal(false);

  // --- Gestion des abonnements ---
  private subs = new Subscription();

  // Écouteur pour la Sidebar (Ta fonctionnalité HEAD)
  @HostListener('window:sidebarToggle', ['$event'])
  onSidebarToggle(event: any) {
    this.isSidebarCollapsed.set(event.detail);
  }

  ngOnInit() {
    // Watch for user identity before connecting
    this.subs.add(
      this.authService.currentUser$.subscribe(user => {
        if (user) {
          console.log('[MainLayout] User identity confirmed, connecting WebSocket...');
          this.wsService.connect();
        } else {
          this.wsService.disconnect();
        }
      })
    );
    
    // 2. Écoute des nouveaux messages
    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        const currentUserId = this.authService.currentUser()?.id;
        
        // Ne pas notifier si c'est notre propre message
        if (msg.senderId === currentUserId) return;

        // Vérifier l'état du chat de manière asynchrone mais efficace
        this.handleNewMessageNotification(msg);
      })
    );
  }

  /**
   * Logique de notification fusionnée et nettoyée
   */
  private handleNewMessageNotification(msg: any) {
    // On utilise take(1) pour ne pas créer de fuite mémoire
    this.chatService.isChatOpen$.pipe(take(1)).subscribe(isChatOpen => {
      this.chatService.activeConversation$.pipe(take(1)).subscribe(activeConv => {
        
        const isReadingThisConv = isChatOpen && activeConv?.id === msg.conversationId;

        if (!isReadingThisConv) {
          // Notification visuelle
          this.toastService.show(`Nouveau message de ${msg.senderName}`, 'info');
          
          // Mise à jour du compteur de messages non lus
          this.chatService.unreadCounts$.pipe(take(1)).subscribe(counts => {
            const currentCount = counts[msg.conversationId] || 0;
            this.chatService.updateUnreadCount(msg.conversationId, currentCount + 1);
          });
        }
      });
    });
  }

  ngOnDestroy() {
    // Nettoyage impératif pour éviter les fuites de mémoire et les sockets fantômes
    this.subs.unsubscribe();
    this.wsService.disconnect();
  }
}
