import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-background/70 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-8 border-b border-outline-variant/10">
      <div class="flex items-center gap-8">
        <span class="text-xl font-bold tracking-tight text-primary font-headline italic">The Curated Harvest</span>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 transition-colors duration-200 hover:bg-surface-container-low rounded-full">
          <span class="material-symbols-outlined text-primary">notifications</span>
        </button>
        <button class="p-2 transition-colors duration-200 hover:bg-surface-container-low rounded-full" routerLink="/profile">
          <span class="material-symbols-outlined text-primary">settings</span>
        </button>
        <div class="flex items-center gap-3 ml-2 group cursor-pointer" routerLink="/profile">
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
  authService = inject(AuthService);
  user = this.authService.currentUser;
}
