import { Component, inject, Input, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ChatService } from '../../../../features/chat/services/chat';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 right-0 z-40 bg-background/70 backdrop-blur-xl shadow-sm h-20 flex justify-between items-center px-8 border-b border-outline-variant/10 transition-all duration-500"
            [class.w-[calc(100%-16rem)]]="!isSidebarCollapsed"
            [class.w-[calc(100%-5rem)]]="isSidebarCollapsed">
      <div class="flex items-center gap-8">
      </div>
      <div class="flex items-center gap-4">
        <button class="p-3 transition-colors duration-200 hover:bg-surface-container-low rounded-full relative" (click)="toggleChat()">
          <span class="material-symbols-outlined text-primary">chat</span>
          <span *ngIf="(totalUnreadCount$ | async) as unread" class="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {{ unread > 9 ? '9+' : unread }}
          </span>
        </button>
        <div class="relative">
          <button class="p-3 transition-colors duration-200 hover:bg-surface-container-low rounded-full relative" (click)="toggleNotifications($event)">
            <span class="material-symbols-outlined text-primary">notifications</span>
            <span *ngIf="notificationService.unreadCount() > 0" class="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
              {{ notificationService.unreadCount() > 9 ? '9+' : notificationService.unreadCount() }}
            </span>
          </button>
          
          <!-- Notifications Dropdown -->
          <div *ngIf="showNotifications" class="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-outline-variant/20 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div class="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
              <h3 class="text-xs font-black uppercase tracking-widest text-on-surface">Notifications</h3>
              <button *ngIf="notificationService.unreadCount() > 0" (click)="notificationService.markAllAsRead()" class="text-[9px] font-bold text-primary hover:underline">
                Tout lire
              </button>
            </div>
            <div class="max-h-96 overflow-y-auto custom-scrollbar">
              <div *ngIf="notificationService.notifications().length === 0" class="p-8 text-center text-outline opacity-50">
                <span class="material-symbols-outlined text-4xl mb-2">notifications_paused</span>
                <p class="text-[10px] uppercase font-bold tracking-widest">Aucune alerte</p>
              </div>
              <div *ngFor="let notif of notificationService.notifications()" 
                   class="p-4 border-b border-outline-variant/5 hover:bg-surface-container-lowest transition-colors cursor-pointer group"
                   [ngClass]="{'bg-primary/5': !notif.read}"
                   (click)="notificationService.markAsRead(notif.id)">
                <div class="flex gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                       [ngClass]="notif.read ? 'bg-surface-container text-outline' : 'bg-primary text-white'">
                    <span class="material-symbols-outlined text-[16px]">{{ notif.type === 'INVITATION' ? 'agriculture' : 'info' }}</span>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold" [ngClass]="notif.read ? 'text-on-surface-variant' : 'text-on-surface'">{{ notif.title }}</h4>
                    <p class="text-[10px] text-outline mt-1 leading-tight line-clamp-2">{{ notif.body }}</p>
                    <p class="text-[8px] font-bold text-outline/50 uppercase tracking-widest mt-2">{{ notif.createdAt | date:'short' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="p-3 transition-colors duration-200 hover:bg-surface-container-low rounded-full" routerLink="/profile">
          <span class="material-symbols-outlined text-primary">settings</span>
        </button>
        <div class="flex items-center gap-4 mr-3 group cursor-pointer" routerLink="/profile">
          <div class="text-right hidden sm:block">
            <p class="text-xs font-bold text-on-surface">{{ user()?.fullName }}</p>
            <p class="text-[10px] text-outline font-medium uppercase tracking-tighter">{{ user()?.role }}</p>
          </div>
          <div class="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all bg-surface-container flex items-center justify-center">
            <img *ngIf="user()?.avatarUrl" 
                 [src]="authService.getAvatarUrl(user()?.avatarUrl)" 
                 alt="User Profile Image" 
                 class="w-full h-full object-cover">
            <span *ngIf="!user()?.avatarUrl" class="material-symbols-outlined text-primary/40 text-[20px]">person</span>
          </div>
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  @Input() isSidebarCollapsed = false;
  authService = inject(AuthService);
  chatService = inject(ChatService);
  notificationService = inject(NotificationService);
  private eRef = inject(ElementRef);

  user = this.authService.currentUser;
  totalUnreadCount$ = this.chatService.totalUnreadCount$;
  showNotifications = false;

  toggleChat() {
    this.chatService.toggleChat();
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (this.showNotifications && !this.eRef.nativeElement.contains(event.target)) {
      this.showNotifications = false;
    }
  }
}
