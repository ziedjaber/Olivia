import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
   <aside class="h-screen w-64 fixed left-0 top-0 bg-surface flex flex-col gap-2 p-6 z-30 pt-4 border-r border-outline-variant/10">
  <div class="mb-24 px-2 pt-0">
    <img 
      src="/logo.png" 
      alt="Olivia Management" 
      class="h-auto w-20 block -ml-1 filter drop-shadow-sm"
      style="margin-bottom: 3px;"> <p class="text-[9px] font-black text-outline uppercase tracking-[0.3em] opacity-40 pl-1 leading-tight">
      Technologie de la Moisson du Patrimoine
    </p>
  </div>

      <nav class="flex flex-col gap-1 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <!-- Common Links -->
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="material-symbols-outlined">dashboard</span>
          <span class="font-semibold text-sm">Tableau de bord</span>
        </a>

        <!-- Role Specific Links -->
        <ng-container [ngSwitch]="user()?.role">
          <!-- DIRECTOR -->
          <ng-container *ngSwitchCase="'DIRECTEUR'">
            <a class="nav-item" routerLink="/harvest-planning" routerLinkActive="active">
              <span class="material-symbols-outlined">assignment_turned_in</span>
              <span class="font-medium text-sm">Planification de la récolte</span>
            </a>
            <a class="nav-item" routerLink="/users" routerLinkActive="active">
              <span class="material-symbols-outlined">manage_accounts</span>
              <span class="font-medium text-sm">Gestion des utilisateurs</span>
            </a>
            <a class="nav-item" routerLink="/vergers" routerLinkActive="active">
              <span class="material-symbols-outlined">yard</span>
              <span class="font-medium text-sm">Base de données des vergers</span>
            </a>
            <a class="nav-item" routerLink="/director-logistics" routerLinkActive="active">
              <span class="material-symbols-outlined">forklift</span>
              <span class="font-medium text-sm">Resources Logistique</span>
            </a>
            <a class="nav-item" routerLink="/emergency-intel" routerLinkActive="active">
              <span class="material-symbols-outlined text-error">notification_important</span>
              <span class="font-medium text-sm text-error/90">Hub d'urgence</span>
            </a>
          </ng-container>

          <!-- LOGISTICS -->
          <ng-container *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'">
            <div class="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-50 mb-1">Asset Control</div>
            <a class="nav-item" routerLink="/logistics/analytics" routerLinkActive="active">
              <span class="material-symbols-outlined">insights</span>
              <span class="font-medium text-sm">Intelligence Logistique</span>
            </a>
            <a class="nav-item" routerLink="/logistics/inventory" routerLinkActive="active">
              <span class="material-symbols-outlined">inventory_2</span>
              <span class="font-medium text-sm">Registre des actifs</span>
            </a>
            <a class="nav-item" routerLink="/logistics/provisioning" routerLinkActive="active">
              <span class="material-symbols-outlined">local_shipping</span>
              <span class="font-medium text-sm">Flux de provisionnement</span>
            </a>
          </ng-container>

          <!-- TEAM LEAD -->
          <ng-container *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <span class="material-symbols-outlined">groups</span>
              <span class="font-medium text-sm">Travail proposé & Recrutement</span>
            </a>
            <a class="nav-item" routerLink="/worker-directory" routerLinkActive="active">
              <span class="material-symbols-outlined">person_search</span>
              <span class="font-medium text-sm">Annuaire des ouvriers</span>
            </a>
            <a class="nav-item" routerLink="/material-orders" routerLinkActive="active">
              <span class="material-symbols-outlined">shopping_cart</span>
              <span class="font-medium text-sm">Demandes de matériel</span>
            </a>
            <a class="nav-item" routerLink="/assigned-vergers" routerLinkActive="active">
              <span class="material-symbols-outlined">landscape</span>
              <span class="font-medium text-sm">Vergers assignés</span>
            </a>
            <a class="nav-item" routerLink="/emergency-history" routerLinkActive="active">
              <span class="material-symbols-outlined text-error">emergency_share</span>
              <span class="font-medium text-sm text-error/90">Hub d'urgence</span>
            </a>
          </ng-container>

          <!-- GROWER -->
          <ng-container *ngSwitchCase="'OLEICULTEUR'">
            <a class="nav-item" routerLink="/vergers" routerLinkActive="active">
              <span class="material-symbols-outlined">nature</span>
              <span class="font-medium text-sm">Mes vergers</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">attach_money</span>
              <span class="font-medium text-sm">Gains</span>
            </a>
          </ng-container>

          <!-- WORKER -->
          <ng-container *ngSwitchCase="'OUVRIER_RECOLTE'">
            <a class="nav-item" routerLink="/work-offers" routerLinkActive="active">
              <span class="material-symbols-outlined">work</span>
              <span class="font-medium text-sm">Offres de travail</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">assignment</span>
              <span class="font-medium text-sm">Tâches quotidiennes</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">payments</span>
              <span class="font-medium text-sm">Mes paiements</span>
            </a>
          </ng-container>
        </ng-container>

        <div class="mt-auto pt-6 border-t border-outline-variant/5">
           <a class="nav-item" routerLink="/profile" routerLinkActive="active">
            <span class="material-symbols-outlined">account_circle</span>
            <span class="font-medium text-sm">Gestion de profil</span>
          </a>
          <button (click)="onLogout()" class="w-full text-error/80 px-4 py-3 rounded-lg hover:bg-error/10 flex items-center gap-3 transition-all duration-300">
            <span class="material-symbols-outlined">logout</span>
            <span class="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </nav>
    </aside>
  `,
  styles: [`
    .nav-item {
      @apply text-on-surface-variant px-4 py-3 rounded-lg hover:bg-surface-container-low flex items-center gap-3 hover:translate-x-1 transition-all duration-300;
    }
    .active {
      @apply bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-md;
    }
  `]
})
export class SidebarComponent {
  authService = inject(AuthService);
  router = inject(Router);
  user = this.authService.currentUser;

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
