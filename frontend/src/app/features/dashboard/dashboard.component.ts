import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DirecteurDashboardComponent } from './directeur/directeur-dashboard.component';
import { LogistiqueDashboardComponent } from './logistique/logistique-dashboard.component';
import { ChefEquipeDashboardComponent } from './team-lead/team-lead-dashboard.component';
import { OleiculteurDashboardComponent } from './grower/grower-dashboard.component';
import { OuvrierDashboardComponent } from './worker/worker-dashboard.component';
import { Router } from '@angular/router';
import { effect } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DirecteurDashboardComponent,
    ChefEquipeDashboardComponent,
    OleiculteurDashboardComponent,
    OuvrierDashboardComponent
  ],
  template: `
    <div class="dashboard-container min-h-screen bg-[#fcfbf9]">
      <ng-container [ngSwitch]="user()?.role">
        
        <!-- Directeur -->
        <ng-container *ngSwitchCase="'DIRECTEUR'">
          @defer (on timer(0ms)) {
            <app-directeur-dashboard></app-directeur-dashboard>
          } @placeholder {
            <div class="p-12 animate-pulse space-y-8">
              <div class="h-20 bg-stone-100 rounded-3xl w-1/3"></div>
              <div class="grid grid-cols-4 gap-6">
                <div class="h-40 bg-stone-100 rounded-3xl" *ngFor="let i of [1,2,3,4]"></div>
              </div>
            </div>
          }
        </ng-container>

        <!-- Responsable Logistique -->
        <div *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'" class="p-12 text-center vibrant-mesh min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
           <span class="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">insights</span>
           <h2 class="text-2xl font-black tracking-tighter">Initialisation logistique...</h2>
           <a routerLink="/logistics/analytics" class="mt-8 bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
              Accéder au centre de contrôle
           </a>
        </div>

        <!-- Chef Equipe -->
        <ng-container *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'">
          @defer (on timer(0ms)) {
            <app-team-lead-dashboard></app-team-lead-dashboard>
          } @placeholder {
            <div class="p-12 animate-pulse h-screen bg-stone-50"></div>
          }
        </ng-container>

        <!-- Oleiculteur -->
        <ng-container *ngSwitchCase="'OLEICULTEUR'">
          @defer (on timer(0ms)) {
            <app-oleiculteur-dashboard></app-oleiculteur-dashboard>
          } @placeholder {
            <div class="p-12 animate-pulse h-screen bg-stone-50"></div>
          }
        </ng-container>

        <!-- Ouvrier -->
        <ng-container *ngSwitchCase="'OUVRIER_RECOLTE'">
          @defer (on timer(0ms)) {
            <app-ouvrier-dashboard></app-ouvrier-dashboard>
          } @placeholder {
            <div class="p-12 animate-pulse h-screen bg-stone-50"></div>
          }
        </ng-container>

        <div *ngSwitchDefault class="p-12 text-center flex flex-col items-center justify-center min-h-[80vh]">
          <div class="w-16 h-16 border-4 border-[#3e5219]/20 border-t-[#3e5219] rounded-full animate-spin mb-4"></div>
          <h2 class="text-xl font-bold text-stone-400">Chargement...</h2>
        </div>
      </ng-container>
    </div>
  `
})
export class DashboardComponent {
  authService = inject(AuthService);
  router = inject(Router);
  user = this.authService.currentUser;

  constructor() {
    effect(() => {
      const u = this.user();
      if (u?.role === 'RESPONSABLE_LOGISTIQUE') {
        this.router.navigate(['/logistics/analytics']);
      }
    });
  }
}
