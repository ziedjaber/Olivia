import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside [class.sidebar-collapsed]="isCollapsed()" 
           class="h-screen w-64 fixed left-0 top-0 bg-white flex flex-col z-30 border-r border-gray-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-500">
      
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Floating gradient orbs -->
        <div class="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-[#3e5219]/5 to-transparent rounded-full blur-3xl animate-pulse-slow"></div>
        <div class="absolute bottom-20 right-0 w-80 h-80 bg-gradient-to-tl from-[#3e5219]/3 to-transparent rounded-full blur-3xl animate-pulse-slower"></div>
        
        <!-- Animated lines -->
        <div class="absolute inset-0 opacity-30">
          <svg class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3e5219" stroke-width="0.5" opacity="0.1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <!-- Content wrapper with relative positioning -->
      <div class="relative z-10 flex flex-col h-full">
        
        <!-- Brand Area with Enhanced Animation -->
        <div class="h-28 flex items-center px-6 shrink-0 border-b border-gray-50 bg-gradient-to-br from-white via-white to-gray-50/50 relative overflow-hidden">
          <!-- Animated gradient background -->
          <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-[#3e5219]/2 to-transparent animate-shimmer"></div>
          
          <div class="flex items-center gap-4 w-full relative z-20">
            <div class="relative group">
              <!-- Outer glow -->
              <div class="absolute inset-0 bg-gradient-to-r from-[#3e5219] to-[#2d3d14] rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500 group-hover:blur-2xl"></div>
              
              <!-- Main icon -->
              <div class="relative w-12 h-12 bg-gradient-to-br from-[#3e5219] to-[#2d3d14] flex items-center justify-center rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden">
                <!-- Icon shine effect -->
                <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 animate-shine rounded-2xl"></div>
                <span class="material-symbols-outlined text-white text-2xl relative z-10 group-hover:scale-110 transition-transform duration-300">spa</span>
              </div>
            </div>
            
            <div *ngIf="!isCollapsed()" class="flex flex-col gap-0.5 brand-text animate-fade-in">
              <h1 class="text-lg font-black text-gray-900 tracking-wider leading-none font-headline uppercase group-hover:text-[#3e5219] transition-colors duration-300">OLIVIA</h1>
              <span class="text-[7px] font-black text-[#3e5219] uppercase tracking-[0.6em] opacity-70 group-hover:opacity-100 transition-opacity duration-300">Heritage</span>
            </div>
          </div>
        </div>

        <!-- Navigation with scroll animation -->
        <nav class="flex flex-col flex-grow overflow-y-auto custom-scrollbar pt-24 pb-5 px-3 gap-0.5 scroll-smooth">
          
          <p class="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1 animate-fade-in">Menu Principal</p>
          
          <a class="nav-link" routerLink="/dashboard" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact: true}">
            <span class="nav-icon-wrapper">
              <span class="material-symbols-outlined nav-icon">grid_view</span>
            </span>
            <span class="nav-text">Dashboard</span>
          </a>

          <!-- ROLE-BASED LINKS -->
          <ng-container [ngSwitch]="user()?.role">
            
            <!-- DIRECTOR -->
            <ng-container *ngSwitchCase="'DIRECTEUR'">
              <div class="mt-4 mb-2 animate-fade-in-delayed-1" style="animation-delay: 0.1s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Gestion</p>
                <a class="nav-link" routerLink="/harvest-planning" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">event_note</span>
                  </span>
                  <span class="nav-text">Planning Récolte</span>
                </a>
                <a class="nav-link" routerLink="/vergers" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">forest</span>
                  </span>
                  <span class="nav-text">Vergers</span>
                </a>
                <a class="nav-link" routerLink="/users" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">group</span>
                  </span>
                  <span class="nav-text">Utilisateurs</span>
                </a>
              </div>

              <div class="mt-4 mb-2 animate-fade-in-delayed-2" style="animation-delay: 0.2s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Opérations</p>
                <a class="nav-link alert-link" routerLink="/emergency-intel" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper !text-red-500 pulse-icon">
                    <span class="material-symbols-outlined nav-icon">notification_important</span>
                  </span>
                  <span class="nav-text">Alertes & Urgences</span>
                </a>
                <a class="nav-link" routerLink="/milling-centers" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">factory</span>
                  </span>
                  <span class="nav-text">Unités de Trituration</span>
                </a>
                <a class="nav-link" routerLink="/trituration-planning" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">oil_barrel</span>
                  </span>
                  <span class="nav-text">Trituration & Production</span>
                </a>
              </div>

              <div class="mt-4 mb-2 animate-fade-in-delayed-3" style="animation-delay: 0.3s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Audit</p>
                <a class="nav-link" routerLink="/audit-logs" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">assignment</span>
                  </span>
                  <span class="nav-text">Journal d'Audit</span>
                </a>
              </div>
            </ng-container>

            <!-- LOGISTICS MANAGER -->
            <ng-container *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'">
              <p class="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-4 section-header animate-fade-in-delayed-1" style="animation-delay: 0.1s">Logistique</p>
              <a class="nav-link animate-fade-in-delayed-1" style="animation-delay: 0.15s" routerLink="/logistics/analytics" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">analytics</span>
                </span>
                <span class="nav-text">Statistiques Auto</span>
              </a>
              <a class="nav-link animate-fade-in-delayed-2" style="animation-delay: 0.2s" routerLink="/logistics/inventory" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">inventory</span>
                </span>
                <span class="nav-text">Stock de Matériels</span>
              </a>
              <a class="nav-link animate-fade-in-delayed-2" style="animation-delay: 0.25s" routerLink="/logistics/provisioning" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">shopping_cart</span>
                </span>
                <span class="nav-text">Demandes d'Appro</span>
              </a>
              <a class="nav-link animate-fade-in-delayed-3" style="animation-delay: 0.3s" routerLink="/logistics/missions" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">assignment_turned_in</span>
                </span>
                <span class="nav-text">Affectation de Matériel</span>
              </a>
            </ng-container>

            <!-- TEAM LEAD (CHEF EQUIPE) -->
            <ng-container *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'">
              <div class="mt-4 mb-2 animate-fade-in-delayed-1" style="animation-delay: 0.1s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Missions</p>
                <a class="nav-link ops-highlight pulse-item" routerLink="/daily-harvest" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper !text-[#3e5219] pulse-icon">
                    <span class="material-symbols-outlined nav-icon">track_changes</span>
                  </span>
                  <span class="nav-text font-black text-[#3e5219]">Missions en cours</span>
                </a>
              </div>
              
              <div class="mt-4 mb-2 animate-fade-in-delayed-2" style="animation-delay: 0.2s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Équipe</p>
                <a class="nav-link" routerLink="/assigned-vergers" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">my_location</span>
                  </span>
                  <span class="nav-text">Mes Vergers</span>
                </a>
                <a class="nav-link" routerLink="/worker-directory" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">person_search</span>
                  </span>
                  <span class="nav-text">Annuaire Ouvriers</span>
                </a>
              </div>

              <div class="mt-4 mb-2 animate-fade-in-delayed-3" style="animation-delay: 0.3s">
                <p class="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 section-header">Ressources</p>
                <a class="nav-link" routerLink="/material-orders" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper">
                    <span class="material-symbols-outlined nav-icon">add_shopping_cart</span>
                  </span>
                  <span class="nav-text">Commander Matériel</span>
                </a>
                <a class="nav-link" routerLink="/emergency-history" routerLinkActive="active-link">
                  <span class="nav-icon-wrapper !text-orange-500 pulse-icon-slow">
                    <span class="material-symbols-outlined nav-icon">history</span>
                  </span>
                  <span class="nav-text">Historique Alertes</span>
                </a>
              </div>
            </ng-container>

            <!-- WORKER (OUVRIER) -->
            <ng-container *ngSwitchCase="'OUVRIER'">
              <p class="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-4 section-header animate-fade-in-delayed-1" style="animation-delay: 0.1s">Mon Espace</p>
              <a class="nav-link animate-fade-in-delayed-1" style="animation-delay: 0.15s" routerLink="/work-offers" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">work_outline</span>
                </span>
                <span class="nav-text">Offres de Travail</span>
              </a>
              <a class="nav-link animate-fade-in-delayed-2" style="animation-delay: 0.2s" routerLink="/earnings" routerLinkActive="active-link">
                <span class="nav-icon-wrapper">
                  <span class="material-symbols-outlined nav-icon">payments</span>
                </span>
                <span class="nav-text">Mes Revenus</span>
              </a>
              <a class="nav-link alert-link animate-fade-in-delayed-3" style="animation-delay: 0.25s" routerLink="/emergency-report" routerLinkActive="active-link">
                <span class="nav-icon-wrapper !text-red-500 pulse-icon">
                  <span class="material-symbols-outlined nav-icon">campaign</span>
                </span>
                <span class="nav-text">Signaler Incident</span>
              </a>
            </ng-container>

          </ng-container>

          <!-- Profile Section -->
          <div class="mt-auto pt-4">
            <p class="px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-t border-gray-100 section-header animate-fade-in">Profil</p>
            <a class="nav-link animate-fade-in" routerLink="/profile" routerLinkActive="active-link">
              <span class="nav-icon-wrapper">
                <span class="material-symbols-outlined nav-icon">person</span>
              </span>
              <span class="nav-text">Mon Profil</span>
            </a>
            <button (click)="onLogout()" class="nav-link logout-btn animate-fade-in" style="animation-delay: 0.1s">
              <span class="nav-icon-wrapper !text-red-500">
                <span class="material-symbols-outlined nav-icon">logout</span>
              </span>
              <span class="nav-text">Se Déconnecter</span>
            </button>
          </div>
        </nav>
      </div>

      <!-- User Card - Premium Design with Animation -->
      <div class="relative px-4 py-4 bg-gradient-to-br from-gray-50 to-gray-25 border-t border-gray-100 flex items-center gap-3.5 rounded-tl-2xl overflow-hidden group z-20">
        <!-- Animated background on hover -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#3e5219]/0 via-[#3e5219]/5 to-[#3e5219]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
        
        <div class="relative group/avatar">
          <div class="absolute inset-0 bg-gradient-to-r from-[#3e5219] to-[#2d3d14] rounded-full blur-md opacity-0 group-hover/avatar:opacity-40 transition-all duration-300"></div>
          <div class="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#3e5219] to-[#2d3d14] flex items-center justify-center text-white font-black text-xs shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group-hover/avatar:scale-110">
            <!-- Avatar shine -->
            <div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-0 group-hover/avatar:opacity-20 animate-shine"></div>
            <span class="relative z-10">{{ user()?.fullName?.charAt(0) || 'U' }}</span>
          </div>
        </div>
        
        <div *ngIf="!isCollapsed()" class="flex flex-col min-w-0 relative z-10 animate-fade-in">
          <span class="text-[12px] font-black text-gray-900 truncate leading-tight group-hover:text-[#3e5219] transition-colors duration-300">{{ user()?.fullName }}</span>
          <span class="text-[10px] font-bold text-[#3e5219] uppercase tracking-widest truncate">{{ user()?.role?.replace('_', ' ') }}</span>
        </div>
      </div>

      <!-- TOGGLE COMMAND TAB - PREMIUM DESIGN -->
      <div class="absolute -right-4 top-40 z-50">
        <button (click)="toggleSidebar()" 
                class="group/toggle relative flex items-center justify-center w-10 h-20 bg-white/90 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-[8px_0_24px_rgba(0,0,0,0.06)] hover:shadow-[12px_0_32px_rgba(62,82,25,0.15)] transition-all duration-500 hover:-translate-x-1 hover:scale-y-105">
          
          <!-- Tactical Glow Effect -->
          <div class="absolute inset-0 bg-gradient-to-br from-[#3e5219]/0 to-[#3e5219]/10 rounded-2xl opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-500"></div>
          
          <!-- The Icon with Animation -->
          <span class="material-symbols-outlined text-[#3e5219] text-xl transition-all duration-700 ease-in-out"
                [class.rotate-180]="isCollapsed()">
            keyboard_double_arrow_left
          </span>

          <!-- Active Pulsing Indicator -->
          <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-[#3e5219] rounded-full blur-sm opacity-0 group-hover/toggle:opacity-40 transition-all duration-500"></div>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host { 
      display: block; 
      @apply transition-all duration-500;
    }

    .sidebar-collapsed {
      @apply !w-20;
    }

    .sidebar-collapsed .nav-text,
    .sidebar-collapsed .section-header,
    .sidebar-collapsed .brand-text {
      @apply hidden;
    }

    .sidebar-collapsed .nav-link {
      @apply justify-center px-0;
    }

    .sidebar-collapsed .nav-icon-wrapper {
      @apply w-10 h-10;
    }

    /* Animations */
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slide-in-left {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes pulse-glow {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(186, 26, 26, 0.7);
      }
      50% {
        box-shadow: 0 0 0 8px rgba(186, 26, 26, 0);
      }
    }

    @keyframes pulse-icon-animation {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    @keyframes shimmer {
      0%, 100% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(100%);
      }
    }

    @keyframes shine {
      0% {
        transform: translateX(-100%) skewX(-20deg);
      }
      100% {
        transform: translateX(100%) skewX(-20deg);
      }
    }

    @keyframes float-up {
      0% {
        opacity: 0;
        transform: translateY(20px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes float-rotate {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    @keyframes pulse-slow {
      0%, 100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }

    @keyframes pulse-slower {
      0%, 100% {
        opacity: 0.3;
      }
      50% {
        opacity: 0.8;
      }
    }

    .animate-pulse-slow {
      animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .animate-pulse-slower {
      animation: pulse-slower 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .animate-fade-in {
      animation: fade-in 0.5s ease-out forwards;
    }

    .animate-fade-in-delayed-1 {
      animation: fade-in 0.5s ease-out forwards;
    }

    .animate-fade-in-delayed-2 {
      animation: fade-in 0.5s ease-out forwards;
    }

    .animate-fade-in-delayed-3 {
      animation: fade-in 0.5s ease-out forwards;
    }

    .animate-shimmer {
      animation: shimmer 3s infinite;
    }

    .animate-shine {
      animation: shine 2s infinite;
    }

    .pulse-icon {
      animation: pulse-icon-animation 2s ease-in-out infinite;
    }

    .pulse-icon-slow {
      animation: pulse-icon-animation 3s ease-in-out infinite;
    }

    .pulse-item {
      animation: pulse-glow 2s infinite;
    }

    .section-header {
      position: relative;
      display: inline-block;
    }

    .section-header::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 20px;
      width: 0;
      height: 2px;
      background: linear-gradient(to right, #3e5219, transparent);
      animation: expand-width 0.6s ease-out forwards;
    }

    @keyframes expand-width {
      to {
        width: 30px;
      }
    }

    /* Navigation Link Base Styles */
    .nav-link {
      @apply relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-gray-600 hover:text-gray-900 no-underline cursor-pointer border border-transparent;
      background: transparent;
      overflow: hidden;
    }

    .nav-link::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, transparent 0%, rgba(62, 82, 25, 0.05) 50%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .nav-link:hover::before {
      animation: shine 1.5s ease;
    }

    .nav-link:hover {
      @apply bg-gradient-to-r from-gray-50/50 to-gray-50;
    }

    .nav-icon-wrapper {
      @apply w-5 h-5 flex items-center justify-center text-gray-500 transition-all duration-300 flex-shrink-0;
    }

    .nav-icon {
      @apply text-[20px] transition-all duration-300;
    }

    .nav-text {
      @apply text-[13px] font-bold tracking-tight text-gray-600 transition-all duration-300;
    }

    /* Active State - Elegant Design with Animation */
    .active-link {
      @apply text-[#3e5219] bg-gradient-to-r from-[#3e5219]/10 to-[#3e5219]/5 border border-[#3e5219]/20 shadow-[0_4px_16px_rgba(62,82,25,0.08)];
      animation: slide-in-left 0.4s ease-out;
    }

    .active-link .nav-icon-wrapper {
      @apply text-[#3e5219] bg-white shadow-sm rounded-lg;
      animation: float-up 0.4s ease-out;
    }

    .active-link .nav-text {
      @apply text-[#3e5219];
    }

    /* Operations Highlight */
    .ops-highlight {
      @apply border border-[#3e5219]/30 bg-gradient-to-r from-[#3e5219]/10 to-[#3e5219]/5 shadow-sm hover:shadow-md;
      position: relative;
    }

    .ops-highlight::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 3px;
      background: linear-gradient(to bottom, #3e5219, transparent);
      border-radius: 0 2px 2px 0;
      animation: slide-in-left 0.5s ease-out;
    }

    .ops-highlight .nav-icon-wrapper {
      @apply text-[#3e5219] bg-white shadow-sm rounded-lg;
    }

    .alert-link .nav-icon-wrapper {
      animation: pulse-icon-animation 1.5s ease-in-out infinite;
    }

    /* Logout Button */
    .logout-btn {
      @apply hover:bg-red-50/50 hover:text-red-600;
    }

    .logout-btn:hover .nav-icon-wrapper {
      @apply text-red-500;
    }

    .logout-btn:hover .nav-text {
      @apply text-red-600;
    }

    /* Custom Scrollbar with Animation */
    .custom-scrollbar::-webkit-scrollbar { 
      width: 6px; 
    }

    .custom-scrollbar::-webkit-scrollbar-track { 
      background: transparent; 
    }

    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(0, 0, 0, 0.08); 
      border-radius: 10px; 
      transition: background 0.3s ease;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover { 
      background: rgba(0, 0, 0, 0.15); 
      box-shadow: 0 0 8px rgba(62, 82, 25, 0.1);
    }

    /* Smooth transitions for all interactive elements */
    a, button {
      @apply transition-all duration-300;
    }

    /* Additional refinements */
    .nav-link:active {
      @apply scale-[0.98];
    }

    /* Group hover effects */
    .group:hover .group-hover\:text-\[\#3e5219\] {
      @apply text-[#3e5219];
    }

    /* Smooth scroll behavior */
    html {
      scroll-behavior: smooth;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  user = this.authService.currentUser;

  isCollapsed = signal(false);

  toggleSidebar() {
    this.isCollapsed.set(!this.isCollapsed());
    // Dispatch event for layout adjustment
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: this.isCollapsed() }));
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}