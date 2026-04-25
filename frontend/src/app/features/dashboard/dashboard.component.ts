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
    <ng-container [ngSwitch]="user()?.role">
      <app-directeur-dashboard *ngSwitchCase="'DIRECTEUR'"></app-directeur-dashboard>
      
      <!-- Redirect Logistics Manager to the new Analytics Hub -->
      <div *ngSwitchCase="'RESPONSABLE_LOGISTIQUE'" class="p-12 text-center vibrant-mesh min-h-[60vh] flex flex-col items-center justify-center animate-fade-in">
         <span class="material-symbols-outlined text-6xl text-primary animate-pulse mb-4">insights</span>
         <h2 class="text-2xl font-black tracking-tighter">Initializing Logistics Intel...</h2>
         <p class="text-outline text-sm mt-2">Accessing specialized operational modules.</p>
         <script>
            // Note: In a real Angular app we'd use a guard or navigate in ngOnInit.
            // But since this is a switcher component, we'll provide a direct link button for now 
            // and I'll add the programmatic navigation in the TS file.
         </script>
         <a routerLink="/logistics/analytics" class="mt-8 bg-on-surface text-surface px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Enter Command Center</a>
      </div>

      <app-team-lead-dashboard *ngSwitchCase="'CHEF_EQUIPE_RECOLTE'"></app-team-lead-dashboard>
      <app-oleiculteur-dashboard *ngSwitchCase="'OLEICULTEUR'"></app-oleiculteur-dashboard>
      <app-ouvrier-dashboard *ngSwitchCase="'OUVRIER_RECOLTE'"></app-ouvrier-dashboard>
      <div *ngSwitchDefault class="p-12 text-center">
        <h2 class="text-2xl font-bold">Accessing Dashboard...</h2>
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
