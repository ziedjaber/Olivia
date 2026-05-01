import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface RoleOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-registration-role',
  standalone: true,
  imports: [CommonModule],
  template: `
    <main class="min-h-screen bg-background flex items-center justify-center p-6 font-body">
      <div class="max-w-4xl w-full space-y-12">
        <!-- Header -->
        <header class="text-center space-y-4">
          <div class="flex justify-center mb-6">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-4xl">verified_user</span>
            </div>
          </div>
          <h1 class="font-headline text-4xl font-black text-on-surface tracking-tight">Finalisez votre identification</h1>
          <p class="text-on-surface-variant text-lg max-w-xl mx-auto">
            Bienvenue, <span class="text-primary font-bold">{{ currentUser()?.fullName }}</span>.
            Pour vous accorder l'acces au domaine, veuillez selectionner votre role operationnel officiel.
          </p>
        </header>

        <!-- Role Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            *ngFor="let role of roles"
            (click)="selectedRole = role.id"
            [class.ring-2]="selectedRole === role.id"
            [class.ring-primary]="selectedRole === role.id"
            [class.bg-surface-container-high]="selectedRole === role.id"
            class="group p-6 bg-surface border border-outline-variant/30 rounded-[2rem] text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
          >
            <div class="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-12" [style.backgroundColor]="role.color + '20'" [style.color]="role.color">
              <span class="material-symbols-outlined text-2xl font-variation-settings-fill">{{ role.icon }}</span>
            </div>
            <h3 class="font-headline text-xl font-bold text-on-surface mb-2">{{ role.name }}</h3>
            <p class="text-sm text-on-surface-variant leading-relaxed">{{ role.description }}</p>
          </button>
        </div>

        <!-- Action -->
        <div class="flex flex-col items-center space-y-6 pt-8">
          <button 
            (click)="onComplete()"
            [disabled]="!selectedRole || loading"
            class="px-12 py-4 bg-primary text-on-primary font-black rounded-2xl shadow-2xl shadow-primary/30 hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center gap-3 disabled:opacity-30 disabled:grayscale"
          >
            <span *ngIf="loading" class="material-symbols-outlined animate-spin">refresh</span>
            <span>{{ loading ? 'Synchronisation en cours...' : 'Initialiser mon acces' }}</span>
          </button>
          
          <p class="text-[10px] font-bold text-outline uppercase tracking-widest opacity-50">
            PROTOCOLE SECURISE DU DOMAINE ACTIVE
          </p>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host { display: block; }
    .font-variation-settings-fill { font-variation-settings: 'FILL' 1; }
  `]
})
export class RegistrationRoleComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  loading = false;
  selectedRole: string | null = null;
  currentUser = this.authService.currentUser;

  roles: RoleOption[] = [
    {
      id: 'DIRECTEUR',
      name: 'Directeur du domaine',
      description: 'Controle strategique complet du domaine, des analyses de rendement et de la gestion du personnel.',
      icon: 'admin_panel_settings',
      color: '#1a4d2e'
    },
    {
      id: 'RESPONSABLE_LOGISTIQUE',
      name: 'Responsable logistique',
      description: 'Optimise la chaine approvisionnement, le provisionnement et le transport de la recolte.',
      icon: 'inventory_2',
      color: '#4a6d1d'
    },
    {
      id: 'CHEF_EQUIPE_RECOLTE',
      name: 'Chef equipe recolte',
      description: 'Supervise les operations terrain, la securite des secteurs et les signalements de recolte.',
      icon: 'groups',
      color: '#ff6b35'
    },
    {
      id: 'OLEICULTEUR',
      name: 'Oleiculteur independant',
      description: 'Gere les vergers assignes, documente la croissance et la production recoltee.',
      icon: 'psychology_alt',
      color: '#2a9d8f'
    },
    {
      id: 'OUVRIER_RECOLTE',
      name: 'Ouvrier recolte',
      description: 'Execute les taches terrain, documente les cueillettes quotidiennes et les presences.',
      icon: 'work',
      color: '#607d8b'
    }
  ];

  ngOnInit() {
    // If user already has a role, redirect to dashboard
    if (this.currentUser()?.role) {
      this.router.navigate(['/dashboard']);
    }
  }

  onComplete() {
    if (!this.selectedRole) return;
    
    this.loading = true;
    const user = this.currentUser();
    
    if (!user) {
       this.toastService.show('Session expiree. Veuillez vous reconnecter.', 'error');
       this.router.navigate(['/auth/login']);
       return;
    }

    this.authService.completeSocialRegistration(this.selectedRole, user.fullName).subscribe({
      next: (res) => {
        this.toastService.show('Identite etablie. Bienvenue sur le domaine.', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show('Echec de finalisation. Veuillez contacter le support.', 'error');
      }
    });
  }
}
