import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="h-screen w-64 fixed left-0 top-0 bg-surface flex flex-col gap-2 p-6 z-30 pt-12 border-r border-outline-variant/10">
      <div class="mb-10 px-2">
        <img src="/logo.png" alt="Olivia Management" class="h-16 w-auto mb-2 filter drop-shadow-sm">
        <p class="text-[9px] font-black text-outline uppercase tracking-[0.3em] opacity-40 pl-1">Heritage Harvest Tech</p>
      </div>

      <nav class="flex flex-col gap-1 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <!-- Common Links -->
        <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
          <span class="material-symbols-outlined">dashboard</span>
          <span class="font-semibold text-sm">Dashboard</span>
        </a>

        <!-- Role Specific Links -->
        <ng-container [ngSwitch]="user()?.role">
          <!-- DIRECTOR -->
          <ng-container *ngSwitchCase="'DIRECTEUR'">
            <a class="nav-item" routerLink="/harvest-planning" routerLinkActive="active">
              <span class="material-symbols-outlined">assignment_turned_in</span>
              <span class="font-medium text-sm">Harvest Planning</span>
            </a>
            <a class="nav-item" routerLink="/users" routerLinkActive="active">
              <span class="material-symbols-outlined">manage_accounts</span>
              <span class="font-medium text-sm">User Management</span>
            </a>
            <a class="nav-item" routerLink="/vergers" routerLinkActive="active">
              <span class="material-symbols-outlined">yard</span>
              <span class="font-medium text-sm">Orchard Database</span>
            </a>
            <a class="nav-item" routerLink="/director-logistics" routerLinkActive="active">
              <span class="material-symbols-outlined">forklift</span>
              <span class="font-medium text-sm">Resource Logistics</span>
            </a>
            <a class="nav-item" routerLink="/dashboard" fragment="my-reservations" routerLinkActive="active">
              <span class="material-symbols-outlined">shopping_bag</span>
              <span class="font-medium text-sm">My Reservations</span>
            </a>
          </ng-container>

          <!-- LOGISTICS -->
          <ng-container *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'">
            <div class="px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-outline opacity-50 mb-1">Asset Control</div>
            <a class="nav-item" routerLink="/logistics/analytics" routerLinkActive="active">
              <span class="material-symbols-outlined">insights</span>
              <span class="font-medium text-sm">Logistics Intel</span>
            </a>
            <a class="nav-item" routerLink="/logistics/inventory" routerLinkActive="active">
              <span class="material-symbols-outlined">inventory_2</span>
              <span class="font-medium text-sm">Asset Registry</span>
            </a>
            <a class="nav-item" routerLink="/logistics/provisioning" routerLinkActive="active">
              <span class="material-symbols-outlined">local_shipping</span>
              <span class="font-medium text-sm">Provisioning Flow</span>
            </a>
          </ng-container>

          <!-- TEAM LEAD -->
          <ng-container *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <span class="material-symbols-outlined">groups</span>
              <span class="font-medium text-sm">Proposed Work & Recruitment</span>
            </a>
            <a class="nav-item" routerLink="/worker-directory" routerLinkActive="active">
              <span class="material-symbols-outlined">person_search</span>
              <span class="font-medium text-sm">Harvester Directory</span>
            </a>
            <a class="nav-item" routerLink="/material-orders" routerLinkActive="active">
              <span class="material-symbols-outlined">shopping_cart</span>
              <span class="font-medium text-sm">Material Orders</span>
            </a>
          </ng-container>

          <!-- GROWER -->
          <ng-container *ngSwitchCase="'OLEICULTEUR'">
            <a class="nav-item" routerLink="/vergers" routerLinkActive="active">
              <span class="material-symbols-outlined">nature</span>
              <span class="font-medium text-sm">My Orchards</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">attach_money</span>
              <span class="font-medium text-sm">Earnings</span>
            </a>
          </ng-container>

          <!-- WORKER -->
          <ng-container *ngSwitchCase="'OUVRIER_RECOLTE'">
            <a class="nav-item" routerLink="/work-offers" routerLinkActive="active">
              <span class="material-symbols-outlined">work</span>
              <span class="font-medium text-sm">Look for Offers</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">assignment</span>
              <span class="font-medium text-sm">Daily Tasks</span>
            </a>
            <a class="nav-item" href="javascript:void(0)">
              <span class="material-symbols-outlined">payments</span>
              <span class="font-medium text-sm">My Payments</span>
            </a>
          </ng-container>
        </ng-container>

        <div class="mt-auto pt-6 border-t border-outline-variant/5">
           <a class="nav-item" routerLink="/profile" routerLinkActive="active">
            <span class="material-symbols-outlined">account_circle</span>
            <span class="font-medium text-sm">Profile Management</span>
          </a>
          <button (click)="onLogout()" class="w-full text-error/80 px-4 py-3 rounded-lg hover:bg-error/10 flex items-center gap-3 transition-all duration-300">
            <span class="material-symbols-outlined">logout</span>
            <span class="font-medium text-sm">Logout</span>
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
