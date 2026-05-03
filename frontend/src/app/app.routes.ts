import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ProfileComponent } from './features/user/profile/profile.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/layout/main-layout/main-layout.component';
import { UserManagementComponent } from './features/user/management/user-management.component';
import { VergerManagementComponent } from './features/verger/management/verger-management.component';
import { ChatPageComponent } from './features/chat/components/chat-page/chat-page';
import { UserDirectoryComponent } from './features/user/directory/directory.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/select-role', loadComponent: () => import('./features/auth/registration-role/registration-role.component').then(m => m.RegistrationRoleComponent) },
  { 
    path: '', 
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'vergers', component: VergerManagementComponent },
      { path: 'directory', component: UserDirectoryComponent },
      
      // LOGISTICS MODULAR ROUTES
      { 
        path: 'logistics',
        children: [
          { path: 'analytics', loadComponent: () => import('./features/dashboard/logistique/analytics/logistics-analytics.component').then(m => m.LogisticsAnalyticsComponent) },
          { path: 'inventory', loadComponent: () => import('./features/dashboard/logistique/inventory/inventory-management.component').then(m => m.InventoryManagementComponent) },
          { path: 'provisioning', loadComponent: () => import('./features/dashboard/logistique/provisioning/provisioning-demands.component').then(m => m.ProvisioningDemandsComponent) },
          { path: 'missions', loadComponent: () => import('./features/dashboard/logistique/mission-assignments.component').then(m => m.MissionAssignmentsComponent) }
        ]
      },

      { path: 'harvest-planning', loadComponent: () => import('./features/dashboard/directeur/harvest-planning.component').then(m => m.HarvestPlanningComponent) },
      { path: 'director-logistics', loadComponent: () => import('./features/dashboard/directeur/director-logistics.component').then(m => m.DirectorLogisticsComponent) },
      { path: 'trituration-planning', loadComponent: () => import('./features/dashboard/directeur/trituration-planning.component').then(m => m.TriturationPlanningComponent) },
      { path: 'milling-centers', loadComponent: () => import('./features/dashboard/directeur/milling-center-management.component').then(m => m.MillingCenterManagementComponent) },
      { path: 'material-orders', loadComponent: () => import('./features/dashboard/team-lead/material-orders.component').then(m => m.MaterialOrdersComponent) },
      { path: 'worker-directory', loadComponent: () => import('./features/dashboard/team-lead/worker-directory.component').then(m => m.WorkerDirectoryComponent) },
      { path: 'assigned-vergers', loadComponent: () => import('./features/dashboard/team-lead/affected-vergers.component').then(m => m.AffectedVergersComponent) },
      { path: 'daily-harvest', loadComponent: () => import('./features/dashboard/team-lead/daily-harvest.component').then(m => m.DailyHarvestComponent) },
      { path: 'work-offers', loadComponent: () => import('./features/dashboard/worker/work-offers.component').then(m => m.WorkOffersComponent) },
      { path: 'earnings', loadComponent: () => import('./features/dashboard/worker/worker-earnings.component').then(m => m.WorkerEarningsComponent) },

      // EMERGENCY SYSTEM ROUTES
      { path: 'emergency-report', loadComponent: () => import('./features/alerte/alerte-report.component').then(m => m.AlerteReportComponent) },
      { path: 'emergency-intel', loadComponent: () => import('./features/alerte/alerte-management.component').then(m => m.AlerteManagementComponent) },
      { path: 'emergency-history', loadComponent: () => import('./features/dashboard/team-lead/alerte-history.component').then(m => m.AlerteHistoryComponent) },
      { path: 'historique', loadComponent: () => import('./features/historique/historique.component').then(m => m.HistoriqueComponent) }
    ]
  },
];
