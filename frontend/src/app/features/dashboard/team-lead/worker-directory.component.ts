import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ParticipationService } from '../../../core/services/participation.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';
import { DialogService } from '../../../core/services/dialog.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-worker-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-surface min-h-screen">

      <!-- HEADER -->
      <header class="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 animate-in">
        <div class="space-y-2">
          <div class="flex items-center gap-3 mb-2">
            <span class="w-12 h-1.5 bg-primary rounded-full"></span>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Gestion des Ressources Humaines</p>
          </div>
          <h1 class="text-5xl font-black text-on-surface tracking-tighter leading-none" style="font-family: Manrope, sans-serif;">
            Vivier des <span class="text-primary italic">Moissonneurs</span>
          </h1>
          <p class="text-on-surface-variant font-medium text-sm max-w-md">Interface unifiée pour recruter et déployer le personnel de récolte sur vos missions actives.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex flex-col items-center">
            <div class="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary border border-outline-variant/10 shadow-sm">
              <span class="material-symbols-outlined text-2xl">groups</span>
            </div>
            <span class="text-[8px] font-bold text-outline uppercase mt-1 opacity-50">{{ filteredWorkers.length }} Profils</span>
          </div>
        </div>
      </header>

      <!-- MISSION & SEARCH CONTROLS -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

        <!-- Mission Selector Panel -->
        <div class="glass-panel p-8 border-white/40 shadow-xl relative overflow-hidden">
          <div class="absolute -top-16 -right-16 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div class="relative z-10">
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">hub</span>
              </div>
              <div>
                <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] opacity-50">Protocole de</p>
                <p class="text-sm font-black text-on-surface uppercase tracking-widest">Déploiement Mission</p>
              </div>
            </div>
            <select [(ngModel)]="selectedMissionId" (change)="onMissionChange()"
                    class="w-full bg-white border border-outline-variant/20 rounded-2xl px-6 py-4 outline-none focus:border-primary/40 text-sm font-bold text-on-surface transition-all shadow-inner appearance-none">
              <option value="">-- Sélectionner une mission --</option>
              <option *ngFor="let m of activeMissions" [value]="m.id">{{ m.description }}</option>
            </select>

            <div *ngIf="selectedMission" class="mt-6 grid grid-cols-2 gap-4 animate-in">
              <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                <p class="text-[8px] font-black text-outline uppercase tracking-widest opacity-50 mb-1">Verger</p>
                <p class="text-sm font-black text-on-surface truncate">{{ selectedMission.vergerName }}</p>
              </div>
              <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                <p class="text-[8px] font-black text-outline uppercase tracking-widest opacity-50 mb-1">Besoin</p>
                <p class="text-sm font-black text-on-surface">{{ selectedMission.numberOfWorkers || '--' }} ouvriers</p>
              </div>
            </div>

            <div *ngIf="selectedMission" class="mt-4">
              <button *ngIf="!selectedMission.workersReady" (click)="markWorkersReady()"
                      class="w-full px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 bg-primary text-on-primary border-2 border-primary shadow-primary/30 hover:-translate-y-0.5">
                <span class="material-symbols-outlined text-[18px]">verified</span>
                Valider l'équipe complète
              </button>
              <div *ngIf="selectedMission.workersReady"
                   class="w-full px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/20">
                <span class="material-symbols-outlined text-[18px]">task_alt</span>
                Équipe Validée & Prête
              </div>
            </div>
          </div>
        </div>

        <!-- Search Panel -->
        <div class="glass-panel p-8 border-white/40 shadow-xl flex flex-col justify-between">
          <div>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">person_search</span>
              </div>
              <div>
                <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] opacity-50">Filtrage</p>
                <p class="text-sm font-black text-on-surface uppercase tracking-widest">Recherche Opérationnelle</p>
              </div>
            </div>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40">search</span>
              <input type="text" [(ngModel)]="searchQuery" (input)="filterWorkers()"
                     placeholder="Rechercher par nom, email..."
                     class="w-full bg-white border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface outline-none focus:border-primary/40 shadow-sm transition-all">
            </div>
          </div>
          <!-- Bulk Salary Input -->
          <div class="mt-6 pt-6 border-t border-outline-variant/10 space-y-4">
            <div>
              <p class="text-[9px] font-black text-outline uppercase tracking-widest opacity-40 mb-1">Résultats</p>
              <p class="text-3xl font-black text-on-surface tracking-tighter">{{ filteredWorkers.length }} <span class="text-sm font-bold text-outline opacity-40 tracking-normal">ouvriers trouvés</span></p>
            </div>
            <div class="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <span class="material-symbols-outlined text-primary text-lg">payments</span>
              <div class="flex-grow">
                <p class="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Tarif par défaut (sélection groupée)</p>
                <div class="flex items-center gap-2">
                  <input type="number" [(ngModel)]="defaultSalary" placeholder="0.00"
                         class="w-24 bg-white border border-outline-variant/20 rounded-xl px-3 py-2 outline-none text-sm font-bold text-on-surface focus:border-primary/40 transition-all">
                  <span class="text-[9px] font-black text-outline uppercase opacity-40">TND / JOUR</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- FLOATING BULK ACTION BAR -->
      <div *ngIf="selectedWorkerIds.size > 0"
           class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-up">
        <div class="glass-panel px-8 py-5 border-white/60 shadow-2xl bg-on-surface/90 backdrop-blur-3xl flex items-center gap-6 rounded-[2rem]">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-black text-sm">
              {{ selectedWorkerIds.size }}
            </div>
            <p class="text-[11px] font-black text-white uppercase tracking-widest">
              ouvrier{{ selectedWorkerIds.size > 1 ? 's' : '' }} sélectionné{{ selectedWorkerIds.size > 1 ? 's' : '' }}
            </p>
          </div>
          <div class="h-6 w-px bg-white/20"></div>
          <button (click)="clearSelection()"
                  class="text-[10px] font-black text-white/50 uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-sm">close</span>
            Désélectionner
          </button>
          <div class="h-6 w-px bg-white/20"></div>
          <button (click)="sendBulkOffers()"
                  [disabled]="!selectedMissionId || isSendingBulk"
                  class="px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-on-primary border-2 border-primary hover:-translate-y-0.5 transition-all active:scale-95 flex items-center gap-3 shadow-xl shadow-primary/30 disabled:opacity-30 disabled:cursor-not-allowed">
            <span *ngIf="isSendingBulk" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span class="material-symbols-outlined text-[16px]" *ngIf="!isSendingBulk">forward_to_inbox</span>
            {{ isSendingBulk ? 'Envoi en cours...' : 'Envoyer ' + selectedWorkerIds.size + ' invitation' + (selectedWorkerIds.size > 1 ? 's' : '') }}
          </button>
        </div>
      </div>

      <!-- MAIN TABLE -->
      <section class="animate-up">
        <div class="glass-panel overflow-hidden border-white/40 shadow-2xl bg-white/40 backdrop-blur-3xl">
          <table class="w-full text-left border-collapse font-headline">
            <thead>
              <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/10">
                <!-- Select All Checkbox -->
                <th class="p-6 w-12">
                  <div class="flex items-center justify-center">
                    <button (click)="toggleSelectAll()"
                            class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all"
                            [ngClass]="isAllSelected() ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 hover:border-primary/50'">
                      <span class="material-symbols-outlined text-[14px]" *ngIf="isAllSelected()">check</span>
                      <span class="material-symbols-outlined text-[14px] opacity-40" *ngIf="!isAllSelected() && selectedWorkerIds.size > 0">remove</span>
                    </button>
                  </div>
                </th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Identité & Contact</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-center">Disponibilité</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Proposition (TND/J)</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/10">
              <tr *ngFor="let worker of filteredWorkers"
                  class="hover:bg-primary/5 transition-colors group"
                  [ngClass]="selectedWorkerIds.has(worker.id) ? 'bg-primary/5 ring-1 ring-inset ring-primary/10' : ''">
                <!-- Checkbox -->
                <td class="p-6">
                  <div class="flex items-center justify-center">
                    <button (click)="toggleWorkerSelection(worker)"
                            [disabled]="isWorkerBusy(worker.id)"
                            class="w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all disabled:opacity-20"
                            [ngClass]="selectedWorkerIds.has(worker.id) ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 hover:border-primary/50'">
                      <span class="material-symbols-outlined text-[14px]" *ngIf="selectedWorkerIds.has(worker.id)">check</span>
                    </button>
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all"
                         [ngClass]="selectedWorkerIds.has(worker.id) ? 'bg-primary text-white' : 'text-primary bg-primary/10 border border-primary/20 group-hover:rotate-6'">
                      {{ worker.fullName.charAt(0) }}
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-on-surface">{{ worker.fullName }}</h4>
                      <p class="text-[10px] font-bold text-outline uppercase tracking-widest italic">{{ worker.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-6 text-center">
                  <span class="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]"
                        [ngClass]="isWorkerInvited(worker.id) ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : (isWorkerBusy(worker.id) ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20')">
                    {{ isWorkerInvited(worker.id) ? 'Déjà invité' : (isWorkerBusy(worker.id) ? 'En Mission' : 'Disponible') }}
                  </span>
                </td>
                <td class="p-6">
                  <div class="flex items-center gap-2">
                    <input type="number" [(ngModel)]="salaryInputs[worker.id]" [disabled]="isWorkerBusy(worker.id)"
                           placeholder="{{ defaultSalary || '0.00' }}"
                           class="w-28 bg-white border border-outline-variant/20 rounded-2xl px-4 py-3 outline-none focus:border-primary/40 text-sm font-bold text-on-surface transition-all shadow-inner disabled:opacity-30">
                    <span class="text-[9px] font-black text-outline uppercase opacity-40">TND</span>
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="sendOffer(worker)"
                            [disabled]="!selectedMissionId || isWorkerBusy(worker.id)"
                            class="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center gap-2 border-2 bg-primary text-on-primary border-primary shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-10 disabled:cursor-not-allowed disabled:hover:translate-y-0">
                      <span class="material-symbols-outlined text-[16px]">forward_to_inbox</span>
                      {{ isWorkerInvited(worker.id) ? 'Renvoyer' : 'Inviter' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredWorkers.length === 0">
                <td colspan="5" class="p-20 text-center opacity-40 italic font-medium">
                  <span class="material-symbols-outlined text-6xl mb-4 text-outline/50">person_off</span>
                  <p class="text-sm font-black uppercase tracking-[0.3em]">Aucun ouvrier ne correspond à votre recherche.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .glass-panel { @apply bg-white/70 backdrop-blur-3xl border rounded-[2.5rem]; }
    .animate-in { animation: fadeIn 0.4s ease-out; }
    .animate-up { animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    select { background-image: none !important; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
  `]
})
export class WorkerDirectoryComponent implements OnInit {
  private userService = inject(UserService);
  private collecteService = inject(CollecteService);
  private participationService = inject(ParticipationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  allWorkers: User[] = [];
  filteredWorkers: User[] = [];
  busyWorkerIds: Set<string> = new Set();
  invitedWorkerIds: Set<string> = new Set();
  searchQuery: string = '';

  activeMissions: Collecte[] = [];
  selectedMissionId: string = '';
  selectedMission: Collecte | null = null;
  salaryInputs: { [uid: string]: number } = {};

  // Multi-select
  selectedWorkerIds: Set<string> = new Set();
  defaultSalary: number = 0;
  isSendingBulk: boolean = false;

  ngOnInit() { this.loadData(); }

  loadData() {
    const user = this.authService.currentUser();
    const currentUid = user?.id;
    if (!currentUid) { this.router.navigate(['/auth/login']); return; }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allWorkers = users.filter(u => u.role === 'OUVRIER_RECOLTE');
        this.filterWorkers();
        this.cdr.detectChanges();
      }
    });

    this.participationService.getActiveParticipations().subscribe({
      next: (active) => {
        console.log(`[WorkerDirectory] Found ${active.length} active participations across system.`);
        this.busyWorkerIds = new Set(active.map(p => p.ouvrierUid));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching busy workers:", err);
        this.toastService.show("Erreur lors du chargement de la disponibilité des ouvriers.", "error");
      }
    });

    this.collecteService.getCollectes().subscribe({
      next: (data) => {
        this.activeMissions = data.filter(c => {
          const isNotTerminated = c.statut !== 'termine' && c.statut !== 'TERMINATED';
          const matchesUid = c.chefUid === currentUid;
          const matchesName = c.chefName?.toLowerCase() === user.fullName?.toLowerCase();
          return isNotTerminated && (matchesUid || matchesName);
        });
        if (this.activeMissions.length > 0 && !this.selectedMissionId) {
          this.selectedMissionId = this.activeMissions[0].id || '';
          this.onMissionChange();
        }
        this.cdr.detectChanges();
      },
      error: () => this.toastService.show('Échec du chargement des missions.', 'error')
    });
  }

  onMissionChange() {
    this.selectedMission = this.activeMissions.find(m => m.id === this.selectedMissionId) || null;
    this.clearSelection();
    this.invitedWorkerIds.clear();
    
    if (this.selectedMissionId) {
      this.participationService.getParticipationsByCollecte(this.selectedMissionId).subscribe({
        next: (participations) => {
          participations.forEach(p => {
            if (p.status !== 'REJECTED') {
              this.invitedWorkerIds.add(p.ouvrierUid);
              this.selectedWorkerIds.delete(p.ouvrierUid); // Safety: uncheck if already selected
            }
          });
          this.cdr.detectChanges();
        }
      });
    }
    
    this.cdr.detectChanges();
  }

  filterWorkers() {
    if (!this.searchQuery.trim()) {
      this.filteredWorkers = [...this.allWorkers];
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredWorkers = this.allWorkers.filter(w =>
        w.fullName.toLowerCase().includes(q) || w.email.toLowerCase().includes(q)
      );
    }
    // Remove deselected workers that are no longer in filtered list
    const filteredIds = new Set(this.filteredWorkers.map(w => w.id));
    this.selectedWorkerIds.forEach(id => { if (!filteredIds.has(id)) this.selectedWorkerIds.delete(id); });
  }

  isWorkerBusy(uid: string): boolean { return this.busyWorkerIds.has(uid) || this.invitedWorkerIds.has(uid); }
  isWorkerInvited(uid: string): boolean { return this.invitedWorkerIds.has(uid); }

  // --- SELECTION LOGIC ---
  toggleWorkerSelection(worker: User) {
    if (this.isWorkerBusy(worker.id)) return;
    if (this.selectedWorkerIds.has(worker.id)) {
      this.selectedWorkerIds.delete(worker.id);
    } else {
      this.selectedWorkerIds.add(worker.id);
    }
    this.cdr.detectChanges();
  }

  toggleSelectAll() {
    const availableWorkers = this.filteredWorkers.filter(w => !this.isWorkerBusy(w.id));
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      availableWorkers.forEach(w => this.selectedWorkerIds.add(w.id));
    }
    this.cdr.detectChanges();
  }

  isAllSelected(): boolean {
    const available = this.filteredWorkers.filter(w => !this.isWorkerBusy(w.id));
    return available.length > 0 && available.every(w => this.selectedWorkerIds.has(w.id));
  }

  clearSelection() {
    this.selectedWorkerIds.clear();
    this.cdr.detectChanges();
  }

  // --- SINGLE INVITE ---
  sendOffer(worker: User) {
    if (!this.selectedMissionId) {
      this.toastService.show("Veuillez d'abord sélectionner une mission active.", "error");
      return;
    }
    if (this.isWorkerBusy(worker.id)) {
      this.toastService.show("Cet ouvrier n'est plus disponible.", "error");
      return;
    }
    const salary = this.salaryInputs[worker.id] || this.defaultSalary;
    if (!salary || salary <= 0) {
      this.toastService.show("Veuillez entrer un taux de rémunération journalière valide.", "error");
      return;
    }
    this.collecteService.inviteOuvrier(this.selectedMissionId, worker.id, salary).subscribe({
      next: () => {
        this.toastService.show(`Offre envoyée à ${worker.fullName}`, "success");
        this.salaryInputs[worker.id] = 0;
        this.cdr.detectChanges();
      },
      error: (err) => this.toastService.show(err.error || "Échec de l'envoi.", "error")
    });
  }

  // --- BULK INVITE ---
  async sendBulkOffers() {
    if (!this.selectedMissionId) {
      this.toastService.show("Sélectionnez d'abord une mission.", "error");
      return;
    }
    if (this.selectedWorkerIds.size === 0) return;

    const confirmed = await this.dialogService.confirm(
      'Envoi groupé d\'invitations',
      `Envoyer une invitation à ${this.selectedWorkerIds.size} ouvrier(s) sélectionné(s) ?`,
      'info'
    );
    if (!confirmed) return;

    this.isSendingBulk = true;
    this.cdr.detectChanges();

    const workers = this.filteredWorkers.filter(w => this.selectedWorkerIds.has(w.id));

    // Refresh busy list right before starting to avoid stale data 409s
    this.participationService.getActiveParticipations().subscribe({
      next: (active) => {
        this.busyWorkerIds = new Set(active.map(p => p.ouvrierUid));
        this.startBulkProcess(workers);
      },
      error: () => {
        this.isSendingBulk = false;
        this.toastService.show("Erreur de synchronisation avant l'envoi.", "error");
        this.cdr.detectChanges();
      }
    });
  }

  private startBulkProcess(workers: User[]) {
    let successCount = 0;
    let errorCount = 0;

    const sendNext = (index: number) => {
      if (index >= workers.length) {
        this.isSendingBulk = false;
        this.clearSelection();
        this.toastService.show(
          `${successCount} invitation(s) envoyée(s)${errorCount > 0 ? `, ${errorCount} échec(s)` : ''}.`,
          errorCount > 0 ? 'error' : 'success'
        );
        this.cdr.detectChanges();
        return;
      }
      const worker = workers[index];
      
      // Safety check: if worker became busy since selection, skip it.
      if (this.isWorkerBusy(worker.id)) {
        console.warn(`Skipping busy worker: ${worker.fullName}`);
        sendNext(index + 1);
        return;
      }

      const salary = this.salaryInputs[worker.id] || this.defaultSalary || 0;
      if (salary <= 0) { errorCount++; sendNext(index + 1); return; }

      this.collecteService.inviteOuvrier(this.selectedMissionId, worker.id, salary).subscribe({
        next: () => { successCount++; sendNext(index + 1); },
        error: (err) => { 
          errorCount++; 
          const msg = err.error || `Échec pour ${worker.fullName}`;
          this.toastService.show(msg, 'error');
          console.error(`Invite failed for ${worker.id}:`, err);
          sendNext(index + 1); 
        }
      });
    };

    sendNext(0);
  }

  async markWorkersReady() {
    if (!this.selectedMission || !this.selectedMission.id) return;
    const isConfirmed = await this.dialogService.confirm('Protocole ouvriers prêts', 'Marquer les ouvriers comme prêts pour cette mission ? Le directeur sera notifié.', 'info');
    if (isConfirmed) {
      this.selectedMission.workersReady = true;
      this.collecteService.updateCollecte(this.selectedMission.id, this.selectedMission).subscribe({
        next: () => { this.dialogService.alert('Succès', 'Ouvriers marqués comme prêts !', 'success'); this.loadData(); },
        error: (err) => { this.dialogService.alert('Erreur', 'Erreur lors du marquage.', 'danger'); console.error(err); }
      });
    }
  }
}
