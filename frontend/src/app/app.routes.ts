import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/user/profile/profile.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout/main-layout.component';
import { UserManagementComponent } from './features/user/management/user-management.component';
import { VergerManagementComponent } from './features/verger/management/verger-management.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'vergers', component: VergerManagementComponent },
      
      // LOGISTICS MODULAR ROUTES
      { 
        path: 'logistics',
        children: [
          { path: 'analytics', loadComponent: () => import('./features/dashboard/logistique/analytics/logistics-analytics.component').then(m => m.LogisticsAnalyticsComponent) },
          { path: 'inventory', loadComponent: () => import('./features/dashboard/logistique/inventory/inventory-management.component').then(m => m.InventoryManagementComponent) },
          { path: 'provisioning', loadComponent: () => import('./features/dashboard/logistique/provisioning/provisioning-demands.component').then(m => m.ProvisioningDemandsComponent) }
        ]
      },

      { path: 'harvest-planning', loadComponent: () => import('./features/dashboard/directeur/harvest-planning.component').then(m => m.HarvestPlanningComponent) },
      { path: 'director-logistics', loadComponent: () => import('./features/dashboard/directeur/director-logistics.component').then(m => m.DirectorLogisticsComponent) },
      { path: 'material-orders', loadComponent: () => import('./features/dashboard/team-lead/material-orders.component').then(m => m.MaterialOrdersComponent) },
      { path: 'worker-directory', loadComponent: () => import('./features/dashboard/team-lead/worker-directory.component').then(m => m.WorkerDirectoryComponent) },
      { path: 'work-offers', loadComponent: () => import('./features/dashboard/worker/work-offers.component').then(m => m.WorkOffersComponent) }
    ]
  },
];
