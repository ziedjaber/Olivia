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
    DirecteurDashboardComponent,      // OK ici (c'est le parent qui importe l'enfant)
    ChefEquipeDashboardComponent,
    OleiculteurDashboardComponent,
    OuvrierDashboardComponent
    // LogistiqueDashboardComponent → tu peux l'ajouter si besoin plus tard
  ],
  template: `
    <ng-container [ngSwitch]="user()?.role">
      <app-directeur-dashboard *ngSwitchCase="'DIRECTEUR'"></app-directeur-dashboard>
      
      <!-- Redirection responsable logistique -->
      <div *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'" class="p-12 text-center vibrant-mesh min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
         <span class="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">insights</span>
         
         <h2 class="text-2xl font-black tracking-tighter">
           Initialisation du centre logistique...
         </h2>

         <p class="text-outline text-sm mt-2">
           Accès aux modules opérationnels spécialisés.
         </p>

         <a routerLink="/logistics/analytics" 
            class="mt-8 bg-on-surface text-surface px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
            Accéder au centre de contrôle
         </a>
      </div>

      <app-team-lead-dashboard *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'"></app-team-lead-dashboard>
      <app-oleiculteur-dashboard *ngSwitchCase="'OLEICULTEUR'"></app-oleiculteur-dashboard>
      <app-ouvrier-dashboard *ngSwitchCase="'OUVRIER_RECOLTE'"></app-ouvrier-dashboard>

      <div *ngSwitchDefault class="p-12 text-center">
        <h2 class="text-2xl font-bold">
          Chargement du tableau de bord...
        </h2>
      </div>
    </ng-container>
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