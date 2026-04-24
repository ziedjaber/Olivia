import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';

interface Verger {
  id: string;
  nom: string;
  niveauMaturite: number;
  statut: string;
  descriptionMaturite?: string;
  imageMaturiteUrl?: string;
  dateDerniereMaturite?: string;
  responsableName?: string;
}

@Component({
  selector: 'app-harvest-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Premium Header -->
      <header class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in">
        <div>
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-2 opacity-70">
            <span class="w-10 h-[1px] bg-primary"></span>
            Contrôle du Domaine
          </div>
          <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            Récolte <span class="text-primary italic">Pipeline de Mission</span>
          </h1>
          <p class="text-on-surface-variant text-sm font-medium mt-1 italic">Supervision stratégique et déploiement des campagnes de récolte.</p>
        </div>
        
        <div class="flex gap-4">
           <button (click)="loadData()" class="p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-outline-variant/10 hover:bg-white hover:scale-105 transition-all shadow-sm">
             <span class="material-symbols-outlined text-outline">refresh</span>
           </button>
           <button (click)="openCreateModal()" 
                  class="bg-primary text-on-primary px-8 py-3.5 font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
            <span class="material-symbols-outlined">add_task</span>
            Initialiser la Mission
          </button>
        </div>
      </header>

      <!-- SEARCH BAR -->
      <div class="mb-8 animate-up">
        <div class="relative group">
          <span class="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary transition-colors">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" type="text" 
                 placeholder="Filtrer les missions par titre, nom du verger ou responsable assigné..."
                 class="w-full bg-white/60 backdrop-blur-xl border border-outline-variant/10 rounded-3xl pl-14 pr-6 py-5 focus:border-primary/40 focus:bg-white outline-none transition-all text-sm font-bold text-on-surface shadow-sm focus:shadow-xl">
        </div>
      </div>

      <!-- Mission Table -->
      <div class="glass-panel overflow-hidden border-white shadow-2xl animate-up">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/50 border-b border-outline-variant/10">
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Campagne / Lieu</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Direction</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-center">Préparation du Verger</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Suivi de Mission</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/5">
              <tr *ngFor="let c of pagedCollectes" class="hover:bg-primary/[0.02] transition-colors group">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary border border-outline-variant/10 group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined">agriculture</span>
                    </div>
                    <div>
                      <p class="font-black text-on-surface text-lg tracking-tight">{{ c.description }}</p>
                      <div class="flex items-center gap-1.5 text-[10px] text-outline font-black uppercase tracking-widest opacity-60">
                         <span class="material-symbols-outlined text-[14px]">yard</span>
                         {{ c.vergerName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-3">
                     <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary/60 border border-outline-variant/10">
                        <span class="material-symbols-outlined text-sm">person</span>
                     </div>
                     <div>
                        <p class="text-sm font-black text-on-surface tracking-tight">{{ c.chefName }}</p>
                        <p class="text-[9px] text-outline font-black uppercase tracking-widest">{{ c.numberOfWorkers }} Membres de l'équipe</p>
                     </div>
                  </div>
                </td>
                <td class="px-8 py-6 text-center">
                   <!-- UNIQUE MATURITY PROGRESS PER MISSION'S ORCHARD -->
                   <div class="w-40 mx-auto" *ngIf="getVergerForMission(c.vergerId) as v">
                      <div class="flex justify-between items-center mb-1.5">
                        <span class="text-[9px] font-black text-outline uppercase">Statut de Maturité</span>
                        <span class="text-xs font-black text-on-surface">{{ v.niveauMaturite }}%</span>
                      </div>
                      <div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="v.niveauMaturite"></div>
                      </div>
                   </div>
                   <div *ngIf="!getVergerForMission(c.vergerId)" class="text-[10px] font-black text-error/40 uppercase tracking-widest italic">
                      Perte de Synchro avec le Verger
                   </div>
                </td>
                <td class="px-8 py-6">
                   <div class="flex items-center gap-3">
                      <span class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border"
                            [ngClass]="{
                              'bg-primary/5 text-primary border-primary/20': c.statut === 'PLANNED',
                              'bg-primary text-on-primary border-transparent shadow-primary/20': c.statut === 'en_cours',
                              'bg-emerald-50 text-emerald-700 border-emerald-100': c.statut === 'termine'
                            }">
                         {{ c.statut === 'PLANNED' ? 'ÉTAPE LOGISTIQUE' : (c.statut?.replace('_', ' ') || 'INCONNU') }}
                      </span>
                   </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex justify-end gap-3">
                    <button (click)="onEditMission(c)" class="w-10 h-10 rounded-xl bg-white border border-outline-variant/20 text-outline hover:text-primary transition-all flex items-center justify-center shadow-sm" title="Modifier la Mission">
                      <span class="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                    <button (click)="onDeleteMission(c)" class="w-10 h-10 rounded-xl bg-white border border-error/10 text-error/40 hover:text-error transition-all flex items-center justify-center shadow-sm" title="Purger la Mission">
                      <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                    <!-- UNIQUE INTEL BUTTON PER MISSION'S ORCHARD -->
                    <button (click)="openIntelligence(c.vergerId)" 
                            class="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform" 
                            title="Voir l'Intelligence de Maturité (Mises à jour Chef Équipe)">
                      <span class="material-symbols-outlined text-[18px]">assignment_returned</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div *ngIf="totalPages > 1" class="px-8 py-6 bg-surface-container-low/50 border-t border-outline-variant/10 flex items-center justify-between">
           <span class="text-[10px] font-black text-outline uppercase tracking-widest opacity-60">Liste des Unités de Mission {{ (currentPage-1)*itemsPerPage + 1 }} - {{ Math.min(currentPage*itemsPerPage, filteredCollectes.length) }}</span>
           <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="px-4 py-2 rounded-xl bg-white border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-outline hover:text-primary disabled:opacity-30 transition-all">Précédent</button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="px-4 py-2 rounded-xl bg-white border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-outline hover:text-primary disabled:opacity-30 transition-all">Suivant</button>
           </div>
        </div>
      </div>
    </div>

    <!-- TELEMETRY HUB MODAL -->
    <div *ngIf="showTelemetryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
        <div class="bg-surface w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-up">
            <div class="p-10 border-b border-outline-variant/10 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2">Rapports du Chef d'Équipe</span>
                    <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.nom }}</h3>
                    <div class="flex items-center gap-2 mt-2">
                       <span class="text-[10px] font-black text-outline uppercase tracking-widest italic text-on-surface">Responsable de Transmission : {{ selectedVergerForTelemetry?.responsableName || 'Équipe de Terrain' }}</span>
                    </div>
                </div>
                <button (click)="showTelemetryModal = false" class="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div class="space-y-8">
                    <div>
                       <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-4">Analyse de Maturité</label>
                       <div class="flex items-end gap-2 mb-2">
                           <span class="text-5xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.niveauMaturite }}%</span>
                       </div>
                       <div class="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                           <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="selectedVergerForTelemetry?.niveauMaturite"></div>
                       </div>
                    </div>
                    <div class="p-6 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-inner">
                        <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-2">Notes de Terrain</label>
                        <p class="text-sm font-medium text-on-surface-variant leading-relaxed italic">
                            "{{ selectedVergerForTelemetry?.descriptionMaturite || 'Aucune note de terrain fournie.' }}"
                        </p>
                    </div>
                </div>
                <div class="space-y-4">
                    <label class="text-[10px] font-black text-outline uppercase tracking-widest block">Preuve Optique</label>
                    <div class="aspect-square rounded-[2rem] overflow-hidden bg-surface-container border border-outline-variant/10 shadow-inner">
                        <img *ngIf="selectedVergerForTelemetry?.imageMaturiteUrl" [src]="selectedVergerForTelemetry?.imageMaturiteUrl" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>

            <div class="p-10 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-end">
                <button (click)="showTelemetryModal = false" class="bg-primary text-on-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Fermer l'intelligence</button>
            </div>
        </div>
    </div>

    <!-- CREATE/MODIFY MISSION MODAL -->
    <div *ngIf="showCreateModal" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div class="bg-surface w-full max-w-2xl max-h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-up">
        
        <button (click)="closeCreateModal()" class="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white z-20">
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>

        <div class="p-12 border-b border-outline-variant/10 relative">
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">
            <span class="w-6 h-0.5 bg-primary"></span>
            Architecture de la Mission
          </div>
          <h3 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            {{ isEditing ? 'Modification' : 'Déploiement' }} <span class="text-primary italic">Protocole</span>
          </h3>
        </div>
        
        <div class="p-12 overflow-y-auto flex-grow space-y-12">
           <div class="space-y-6">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Nomenclature de la Campagne</label>
                <input [(ngModel)]="newCollecte.description" 
                       class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all shadow-inner" 
                       placeholder="ex. Système de Récolte 2024">
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Domaine Cible</label>
                  <select [(ngModel)]="newCollecte.vergerId" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer">
                    <option [value]="null">Sélectionnez le Domaine Évalué</option>
                    <option *ngFor="let v of allVergers" [value]="v.id">{{ v.nom }} ({{ v.niveauMaturite }}%)</option>
                  </select>
                </div>
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Responsable Assigné</label>
                  <select [(ngModel)]="newCollecte.chefUid" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer">
                    <option [value]="null">Assigner un Responsable de Campagne</option>
                    <option *ngFor="let c of chefs" [value]="c.id">{{ c.fullName }}</option>
                  </select>
                </div>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-outline-variant/10">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Début</label>
                <input type="date" [(ngModel)]="newCollecte.startDate" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Fin</label>
                <input type="date" [(ngModel)]="newCollecte.endDate" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Taille de l'Équipe</label>
                <input type="number" [(ngModel)]="newCollecte.numberOfWorkers" 
                       class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-black text-on-surface outline-none transition-all">
              </div>
           </div>
        </div>

        <div class="p-12 border-t border-outline-variant/10 flex justify-end gap-6 bg-surface-container-low/30 backdrop-blur-md">
           <button (click)="closeCreateModal()" class="px-8 py-3 font-black text-[10px] text-outline hover:text-on-surface transition-all tracking-widest uppercase">Annuler le Processus</button>
           <button (click)="submitCollecte()" 
                   class="px-12 py-4 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-2xl hover:scale-105 transition-all tracking-widest uppercase">
                {{ isEditing ? 'Confirmer la Mise à Jour' : 'Déployer la Campagne' }}
           </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: grayscale(1); }
  `]
})
export class HarvestPlanningComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  collectes: Collecte[] = [];
  chefs: User[] = [];
  allVergers: Verger[] = []; 
  vergerMap: Map<string, Verger> = new Map();
  Math = Math;

  // --- Search & Pagination ---
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;

  // --- Telemetry ---
  showTelemetryModal = false;
  selectedVergerForTelemetry: Verger | null = null;

  showCreateModal = false;
  isEditing = false;
  newCollecte: Partial<Collecte> = { type: 'planifiee', numberOfWorkers: 5 };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.collecteService.getCollectes().subscribe(data => {
      this.collectes = data || [];
      this.cdr.detectChanges();
    });
    this.userService.getAllUsers().subscribe(users => {
       this.chefs = users.filter(u => u.role === 'CHEF_EQUIPE_RECOLTE');
       this.cdr.detectChanges();
    });
    this.http.get<Verger[]>('http://localhost:8080/api/vergers').subscribe(v => {
       this.allVergers = v;
       this.vergerMap.clear();
       v.forEach(v => this.vergerMap.set(v.id, v));
       this.cdr.detectChanges();
    });
  }

  getVergerForMission(vergerId: string): Verger | undefined {
    return this.vergerMap.get(vergerId);
  }

  openIntelligence(vergerId: string) {
    const verger = this.vergerMap.get(vergerId);
    if (!verger) {
       alert("Synchronisation de l'intelligence du verger... veuillez patienter.");
       return;
    }
    this.selectedVergerForTelemetry = verger;
    this.showTelemetryModal = true;
    this.cdr.detectChanges();
  }

  openCreateModal() {
    this.isEditing = false;
    this.newCollecte = { type: 'planifiee', numberOfWorkers: 5 };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  onEditMission(c: Collecte) {
    this.newCollecte = { ...c };
    this.isEditing = true;
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newCollecte = { type: 'planifiee', numberOfWorkers: 5 };
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  submitCollecte() {
    if (!this.newCollecte.description || !this.newCollecte.vergerId || !this.newCollecte.chefUid) {
      alert("Veuillez vous assurer que le titre de la mission, le verger et le chef sont correctement spécifiés.");
      return;
    }
    
    const chefObj = this.chefs.find(c => c.id === this.newCollecte.chefUid);
    const vergerObj = this.vergerMap.get(this.newCollecte.vergerId as string);

    const payload: Collecte = {
      ...this.newCollecte,
      chefName: chefObj?.fullName,
      vergerName: vergerObj?.nom || 'N/A',
      statut: this.isEditing ? this.newCollecte.statut : 'PLANNED'
    } as Collecte;

    const request = this.isEditing && this.newCollecte.id 
      ? this.collecteService.updateCollecte(this.newCollecte.id, payload)
      : this.collecteService.createCollecte(payload);

    request.subscribe({
       next: () => {
         this.closeCreateModal();
         this.loadData();
       },
       error: (err) => alert("L'opération de la mission a échoué : " + (err.error || err.message))
    });
  }

  onDeleteMission(c: Collecte) {
    if (!c.id) return;
    if (confirm(`Autoriser la suppression permanente de la mission : "${c.description}"?`)) {
      this.collecteService.deleteCollecte(c.id).subscribe({
        next: () => this.loadData(),
        error: (err) => alert("La purge a échoué : " + (err.error || err.message))
      });
    }
  }

  // --- Search & Pagination Helpers ---
  get filteredCollectes() {
    if (!this.searchTerm) return this.collectes;
    const s = this.searchTerm.toLowerCase();
    return this.collectes.filter(c => 
      (c.description && c.description.toLowerCase().includes(s)) ||
      (c.vergerName && c.vergerName.toLowerCase().includes(s)) ||
      (c.chefName && c.chefName.toLowerCase().includes(s))
    );
  }

  get pagedCollectes() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCollectes.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredCollectes.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
}
