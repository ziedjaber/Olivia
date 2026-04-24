import { Component, OnInit, OnDestroy } from '@angular/core';
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
      <div class="flex-grow min-h-screen pl-64 transition-all duration-300 relative z-0">
        <app-navbar></app-navbar>
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
  private subs = new Subscription();

  constructor(
    private wsService: WebsocketService,
    private chatService: ChatService,
    private toastService: ToastService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.wsService.connect();
    
    this.subs.add(
      this.wsService.messages$.subscribe(msg => {
        const currentUserId = this.authService.currentUser()?.id;
        if (msg.senderId === currentUserId) return;

        let isChatOpen = false;
        this.chatService.isChatOpen$.pipe(take(1)).subscribe(open => isChatOpen = open);
        
        let activeConvId: string | null = null;
        this.chatService.activeConversation$.pipe(take(1)).subscribe(conv => activeConvId = conv?.id || null);

        if (!isChatOpen || activeConvId !== msg.conversationId) {
          this.toastService.show(`Nouveau message de ${msg.senderName}`, 'info');
          
          let currentCounts: { [convId: string]: number } = {};
          this.chatService.unreadCounts$.pipe(take(1)).subscribe(counts => currentCounts = counts);
          
          const currentCount = currentCounts[msg.conversationId] || 0;
          this.chatService.updateUnreadCount(msg.conversationId, currentCount + 1);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.wsService.disconnect();
  }
}
