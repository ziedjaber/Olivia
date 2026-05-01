import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, Alerte } from '../../../core/services/alerte.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { Router } from '@angular/router';
import { Subscription, interval, startWith, switchMap, catchError, of } from 'rxjs';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-alerte-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-surface min-h-screen">
      <!-- HEADER -->
      <header class="mb-12 flex flex-col md:flex-row justify-between items-end gap-6 animate-in">
        <div class="space-y-2">
          <div class="flex items-center gap-3 mb-2">
            <span class="w-12 h-1.5 bg-primary rounded-full"></span>

            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Centre d Intelligence Opérationnelle</p>
          </div>
          <h1 class="text-5xl font-black text-on-surface tracking-tighter leading-none" style="font-family: Manrope, sans-serif;">
            Centre <span class="text-primary italic">d'urgence</span>
          </h1>
          <p class="text-on-surface-variant font-medium text-sm max-w-md"> Interface unifiée pour signaler et suivre les incidents sur le terrain dans vos secteurs assignés.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="showReportForm = !showReportForm" 
                  class="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center gap-3 border-2"
                  [ngClass]="showReportForm ? 'bg-white text-outline border-outline-variant/20' : 'bg-primary text-on-primary border-primary shadow-primary/30 hover:-translate-y-1'">
            <span class="material-symbols-outlined text-[18px]">{{ showReportForm ? 'close' : 'add_alert' }}</span>

            {{ showReportForm ? 'Fermer le formulaire' : 'Signaler un incident' }}

          </button>
          <div class="flex flex-col items-center">
            <button (click)="loadAlerts()" class="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline hover:text-primary transition-all border border-outline-variant/10 shadow-sm relative group">
              <span class="material-symbols-outlined" [class.animate-spin]="isRefreshing">refresh</span>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface" *ngIf="autoRefreshActive"></div>
            </button>

            <span class="text-[8px] font-bold text-outline uppercase mt-1 opacity-50">Actualisation auto</span>

          </div>
        </div>
      </header>

      <!-- INTEGRATED REPORT FORM -->
      <section *ngIf="showReportForm" class="mb-12 animate-in slide-down">
        <div class="glass-panel p-10 border-error/20 bg-error/[0.02] shadow-2xl relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-error/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <form (ngSubmit)="onTransmit()" class="space-y-8 relative z-10 font-headline">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div class="space-y-3">

                <label class="text-[10px] font-black text-outline uppercase tracking-widest text-error/60">Catégorie</label>
                <select [(ngModel)]="report.type" name="type" required
                        class="w-full bg-white border border-outline-variant/20 rounded-2xl px-6 py-4 outline-none focus:border-error/40 text-sm font-bold text-on-surface transition-all shadow-inner">
                  <option value="MACHINE">Panne Machine</option>
                  <option value="ACCIDENT">Accident Médical</option>
                  <option value="INFRASTRUCTURE">Dommage d'Infrastructure</option>
                  <option value="WEATHER">Intempéries</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>

              <div class="space-y-3">

                <label class="text-[10px] font-black text-outline uppercase tracking-widest text-error/60">Gravité</label>
                <div class="flex gap-2">
                  <button *ngFor="let imp of ['LOW', 'MEDIUM', 'URGENT']" type="button" (click)="report.importance = imp"
                          [ngClass]="report.importance === imp ? 'bg-error text-white scale-105' : 'bg-white text-outline'"
                          class="flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-outline-variant/10">
                    {{ imp }}
                  </button>
                </div>
              </div>

              <div class="space-y-3">

                <label class="text-[10px] font-black text-outline uppercase tracking-widest text-error/60">Secteur concerné</label>
                <select [(ngModel)]="report.vergerId" name="verger" (change)="onVergerChange()" required
                        class="w-full bg-white border border-outline-variant/20 rounded-2xl px-6 py-4 outline-none focus:border-error/40 text-sm font-bold text-on-surface transition-all shadow-inner">
                  <option value="">Choisir un secteur...</option>
                  <option *ngFor="let v of assignedVergers" [value]="v.id">{{ v.nom }}</option>
                </select>
              </div>

              <div class="space-y-3">
                <label class="text-[10px] font-black text-outline uppercase tracking-widest text-error/60"> Preuves visuelles</label>
                <div class="flex items-center gap-3">
                  <button type="button" (click)="fileInput.click()" class="h-14 px-6 bg-white border border-dashed border-outline-variant/30 rounded-2xl flex items-center justify-center gap-3 text-outline hover:text-error hover:border-error/40 transition-all flex-grow">
                    <span class="material-symbols-outlined text-lg">add_a_photo</span>
                    <span class="text-[10px] font-black uppercase tracking-widest">{{ report.imageUrls?.length }} Capturé(s)</span>
                  </button>
                  <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden" multiple>
                  <div *ngIf="report.imageUrls && report.imageUrls.length > 0" class="flex -space-x-3">
                    <div *ngFor="let img of report.imageUrls.slice(0,3)" class="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-sm bg-surface">
                      <img [src]="img" class="w-full h-full object-cover">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-3">

              <label class="text-[10px] font-black text-outline uppercase tracking-widest text-error/60">Description de l'incident et contexte</label>
              <textarea [(ngModel)]="report.description" name="desc" rows="3" required
                        class="w-full bg-white border border-outline-variant/20 rounded-3xl px-8 py-6 outline-none focus:border-error/40 text-sm font-bold text-on-surface transition-all shadow-inner"
                        placeholder="Résumé tactique détaillé de l'incident..."></textarea>
            </div>

            <div class="flex justify-end pt-4">
              <button type="submit" [disabled]="loading"
                      class="px-12 py-5 bg-error text-white font-black rounded-2xl shadow-2xl hover:shadow-error/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center gap-4">
                <span *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{{ loading ? 'TRANSMISSION...' : 'TRANSMETTRE L\`ALERTE D\'URGENCE' }}</span>
                <span class="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- STATS OVERVIEW -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="glass-panel p-6 border-white/40 shadow-xl flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
          <div class="w-16 h-16 rounded-3xl bg-error/10 text-error flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl">priority_high</span>
          </div>
          <div>

            <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">Enjeux actifs</p>

            <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ activeCount }}</h3>
          </div>
        </div>
        <div class="glass-panel p-6 border-white/40 shadow-xl flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
          <div class="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span class="material-symbols-outlined text-3xl">check_circle</span>
          </div>
          <div>

            <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">Résolus</p>

            <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ resolvedCount }}</h3>
          </div>
        </div>
        <div class="glass-panel p-6 border-white/40 shadow-xl flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
          <div class="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
             <span class="material-symbols-outlined text-3xl">analytics</span>
          </div>
          <div>

            <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-1">Flux total</p>

            <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ alerts.length }}</h3>
          </div>
        </div>
      </div>

      <!-- SEARCH & FILTERS -->
      <div class="mb-6 flex flex-col md:flex-row gap-4 animate-in">
        <div class="flex-grow relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40">search</span>
          <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="onFilterChange()"
                 placeholder="Rechercher par description ou ID..."
                 class="w-full bg-white border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface outline-none focus:border-primary/40 shadow-sm transition-all">
        </div>
        <div class="flex gap-2">
          <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()"
                  class="bg-white border border-outline-variant/10 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface outline-none focus:border-primary/40 shadow-sm appearance-none">

            <option value="ALL">Tous les statuts</option>
            <option value="NON_TRAITEE">Actifs uniquement</option>
            <option value="TRAITEE">Résolus uniquement</option>
          </select>
          <select [(ngModel)]="typeFilter" (ngModelChange)="onFilterChange()"
                  class="bg-white border border-outline-variant/10 rounded-2xl px-6 py-4 text-sm font-bold text-on-surface outline-none focus:border-primary/40 shadow-sm appearance-none">
            <option value="ALL">Toutes les catégories</option>
            <option value="MACHINE">Machine</option>
            <option value="ACCIDENT">Accident</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="WEATHER">Intempéries</option>
            <option value="OTHER">Autre</option>
          </select>
        </div>
      </div>

      <!-- MAIN TABLE -->
      <section class="animate-up">
        <div class="glass-panel overflow-hidden border-white/40 shadow-2xl bg-white/40 backdrop-blur-3xl">
          <table class="w-full text-left border-collapse font-headline">
            <thead>
              <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/10">
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Catégorie</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Résumé</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Gravité</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Marque temporelle</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-center">Statut</th>
                <th class="p-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/10">
              <tr *ngFor="let a of pagedAlerts" class="hover:bg-primary/5 transition-colors group">
                <td class="p-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-primary bg-primary/10 border border-primary/20 group-hover:rotate-12 transition-all">
                      <span class="material-symbols-outlined text-xl">{{ getTypeIcon(a.type) }}</span>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-on-surface uppercase">{{ a.type.replace('_', ' ') || 'Incident' }}</h4>
                      <p class="text-[10px] font-bold text-outline uppercase tracking-widest italic">{{ a.id?.substring(0,8) }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-6 max-w-xs">
                  <p class="text-sm font-medium text-on-surface opacity-80 line-clamp-2 leading-relaxed italic cursor-help" (click)="viewDetails(a)">
                    "{{ a.description }}"
                  </p>
                </td>
                <td class="p-6">
                  <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                        [ngClass]="getImportanceClass(a)">
                    {{ a.importance }}
                  </span>
                </td>
                <td class="p-6">
                  <p class="text-xs font-black text-on-surface">{{ a.date | date:'MMM d, yyyy' }}</p>
                  <p class="text-[10px] font-bold text-outline">{{ a.date | date:'HH:mm' }}</p>
                </td>
                <td class="p-6 text-center">
                  <div class="flex flex-col items-center gap-1">
                    <span class="px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em]"
                          [ngClass]="a.statut === 'NON_TRAITEE' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'">
                      {{ a.statut === 'NON_TRAITEE' ? 'ACTIF' : 'RÉSOLU' }}
                    </span>
                    <p *ngIf="a.statut === 'TRAITEE'" class="text-[8px] font-bold text-emerald-600 uppercase">Validé Directeur</p>
                  </div>
                </td>
                <td class="p-6">
                  <div class="flex items-center justify-end gap-2">
                    <button (click)="viewDetails(a)" class="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:text-primary hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20" title="Voir les preuves">
                      <span class="material-symbols-outlined text-lg">visibilité</span>
                    </button>
                    <button *ngIf="a.statut === 'NON_TRAITEE'" (click)="confirmDelete(a)" class="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:text-error hover:bg-error/10 transition-all border border-transparent hover:border-error/20" title="Retirer l'alerte">
                      <span class="material-symbols-outlined text-lg"> Retirer l'alerte</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredAlerts.length === 0">
                <td colspan="6" class="p-20 text-center opacity-40 italic font-medium">
                   <span class="material-symbols-outlined text-6xl mb-4 text-outline/50">crisis_alert</span>
                   <p class="text-sm font-black uppercase tracking-[0.3em]">Aucun incident ne correspond à vos critères.</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- PAGINATION FOOTER -->
          <div class="p-6 bg-surface-container-lowest/30 border-t border-outline-variant/10 flex justify-between items-center" *ngIf="filteredAlerts.length > 0">
            <p class="text-[10px] font-black text-outline uppercase tracking-widest">
              Affichage de {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredAlerts.length) }} sur {{ filteredAlerts.length }} entrées
            </p>
            <div class="flex items-center gap-2">
              <button [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)"
                      class="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30 transition-all shadow-sm">
                <span class="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <div class="flex items-center gap-1">
                <button *ngFor="let p of pages" (click)="setPage(p)"
                        [class]="p === currentPage ? 'bg-primary text-on-primary' : 'bg-white text-outline'"
                        class="w-10 h-10 rounded-xl border border-outline-variant/10 flex items-center justify-center text-[10px] font-black transition-all shadow-sm">
                  {{ p }}
                </button>
              </div>
              <button [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)"
                      class="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30 transition-all shadow-sm">
                <span class="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- DETAIL MODAL -->
      <div *ngIf="selectedDetail" 
           class="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-xl animate-in fade-in transition-all duration-500">
        <div class="glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden border-white bg-white shadow-2xl animate-up flex flex-col md:flex-row divide-x divide-outline-variant/10">
           <!-- LEFT GALLERY -->
           <div class="md:w-1/2 min-h-[400px] relative bg-surface-container-low overflow-hidden group flex flex-col">
              <div class="flex-grow relative overflow-hidden">
                 <img *ngIf="currentPreviewImage" [src]="currentPreviewImage" class="w-full h-full object-cover animate-in fade-in zoom-in duration-500">
                 <div *ngIf="!currentPreviewImage" class="w-full h-full flex flex-col items-center justify-center opacity-30">
                    <span class="material-symbols-outlined text-6xl mb-4">photo_library</span>
                    <p class="text-[10px] font-black uppercase tracking-widest">Aucune preuve visuelle fournie</p>
                 </div>
                 <div class="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                    Centre de preuves
                 </div>
              </div>
              <div *ngIf="selectedDetail.imageUrls && selectedDetail.imageUrls.length > 1" class="h-20 bg-black/5 backdrop-blur-sm flex items-center gap-3 px-4 border-t border-outline-variant/5">
                 <div *ngFor="let url of selectedDetail.imageUrls" (click)="currentPreviewImage = url" class="h-14 aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all" [ngClass]="currentPreviewImage === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100'">
                    <img [src]="url" class="w-full h-full object-cover">
                 </div>
              </div>
           </div>

           <!-- RIGHT DATA -->
           <div class="md:w-1/2 p-10 flex flex-col">
              <header class="mb-8">
                 <div class="flex justify-between items-center mb-6">
                    <span class="px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest" [ngClass]="getImportanceClass(selectedDetail)">GRAVITÉ {{ selectedDetail.importance }}</span>
                    <button (click)="selectedDetail = null" class="w-12 h-12 rounded-full hover:bg-surface transition-colors flex items-center justify-center text-outline shadow-sm bg-surface-container-low border border-outline-variant/10">
                       <span class="material-symbols-outlined text-xl">close</span>
                    </button>
                 </div>

                 <h2 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">INCIDENT {{ (selectedDetail.type || '').replace('_', ' ') }}</h2>
                 <p class="text-xs text-outline font-bold mt-2 uppercase tracking-widest flex items-center gap-2 text-primary">
                    <span class="material-symbols-outlined text-[16px]">fingerprint</span>
                    Trace : {{ selectedDetail.id }}
                 </p>
              </header>

              <div class="flex-grow space-y-8 overflow-y-auto custom-scrollbar pr-4">
                 <section class="space-y-3">
                    <label class="text-[10px] font-black text-outline/50 uppercase tracking-[0.2em]">Intel Description</label>
                    <div class="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/5 shadow-inner">
                       <p class="text-sm font-medium text-on-surface leading-loose italic opacity-80">"{{ selectedDetail.description }}"</p>
                    </div>
                 </section>

                 <section class="grid grid-cols-2 gap-6">
                    <div class="bg-surface-container-low/50 p-5 rounded-3xl border border-outline-variant/5">
                       <label class="text-[9px] font-black text-outline/40 uppercase tracking-[0.2em] mb-2 block">Temporal Sync</label>
                       <p class="text-xs font-black text-on-surface">{{ selectedDetail.date | date:'MMM d, yyyy HH:mm' }}</p>
                    </div>
                    <div class="bg-surface-container-low/50 p-5 rounded-3xl border border-outline-variant/5">
                       <label class="text-[9px] font-black text-outline/40 uppercase tracking-[0.2em] mb-2 block">Coordinates</label>
                       <p class="text-xs font-black text-on-surface">{{ selectedDetail.localisation || 'Remote Sensor' }}</p>
                    </div>
                 </section>
              </div>

              <div class="mt-8 pt-6 border-t border-outline-variant/10 flex gap-4">

                 <span class="text-[10px] font-black uppercase text-outline self-center">Statut : {{ selectedDetail.statut === 'NON_TRAITEE' ? 'EN ATTENTE DU DIRECTEUR' : 'RÉSOLU PAR LA DIRECTION' }}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .glass-panel { @apply bg-white/70 backdrop-blur-3xl border rounded-[2.5rem]; }
    .animate-in { animation: fadeIn 0.4s ease-out; }
    .animate-up { animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .slide-down { animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slideDown { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-outline-variant/30 rounded-full; }
  `]
})
export class AlerteHistoryComponent implements OnInit, OnDestroy {
  private alerteService = inject(AlerteService);
  private authService = inject(AuthService);
  private vergerService = inject(VergerService);
  private toastService = inject(ToastService);
  public router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);

  Math = Math;

  // Management State
  alerts: Alerte[] = [];
  filteredAlerts: Alerte[] = [];
  pagedAlerts: Alerte[] = [];
  selectedDetail: Alerte | null = null;
  currentPreviewImage: string | null = null;
  activeCount = 0;
  resolvedCount = 0;
  assignedVergers: Verger[] = [];

  // Filtering System
  searchTerm = '';
  statusFilter = 'ALL';
  typeFilter = 'ALL';
  // Pagination System
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  pages: number[] = [];

  // Reporting State
  showReportForm = false;
  loading = false;
  isRefreshing = false;
  autoRefreshActive = true;
  private refreshSub?: Subscription;

  report: Partial<Alerte> = {
    type: 'MACHINE',
    importance: 'MEDIUM',
    vergerId: '',
    description: '',
    imageUrls: [],
    localisation: '',
    statut: 'NON_TRAITEE'
  };

  ngOnInit() {
    this.initAutoRefresh();
    this.loadAssigned();
    const user = this.authService.currentUser();
    if (user) {
      this.report.senderUid = user.id;
      this.report.senderName = user.fullName;
    }
  }

  ngOnDestroy() {
    this.refreshSub?.unsubscribe();
  }

  initAutoRefresh() {
    // Start with an immediate load, then poll every 15 seconds
    this.refreshSub = interval(15000)
      .pipe(
        startWith(0),
        switchMap(() => {
          const uid = this.authService.currentUser()?.id;
          if (!uid) return of([]);
          this.isRefreshing = true;
          this.cdr.detectChanges();
          return this.alerteService.getMyAlertes(uid).pipe(
            catchError(() => of(this.alerts)) // Keep existing if error
          );
        })
      )
      .subscribe({
        next: (data) => {
          this.alerts = data;
          this.applyFilters();
          this.activeCount = data.filter(a => a.statut === 'NON_TRAITEE').length;
          this.resolvedCount = data.length - this.activeCount;
          this.isRefreshing = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadAlerts() {
    const uid = this.authService.currentUser()?.id;
    if (!uid) return;

    this.isRefreshing = true;
    this.cdr.detectChanges();

    this.alerteService.getMyAlertes(uid).subscribe({
      next: (data) => {
        this.alerts = data;
        this.applyFilters();
        this.activeCount = data.filter(a => a.statut === 'NON_TRAITEE').length;
        this.resolvedCount = data.length - this.activeCount;
        this.isRefreshing = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isRefreshing = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredAlerts = this.alerts.filter(a => {

      const matchesSearch = !this.searchTerm || 
        a.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.id?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'ALL' || a.statut === this.statusFilter;
      const matchesType = this.typeFilter === 'ALL' || a.type === this.typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAlerts = this.filteredAlerts.slice(start, end);
  }

  setPage(p: number) {
    this.currentPage = p;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  loadAssigned() {
    this.vergerService.getAssignedVergers().subscribe({
      next: (data) => {
        this.assignedVergers = data;
        this.cdr.detectChanges();
      }
    });
  }

  onVergerChange() {
    const verger = this.assignedVergers.find(v => v.id === this.report.vergerId);
    if (verger) {
      this.report.localisation = verger.localisation;
    }
  }

  onFileSelected(event: any) {
    if (event.target.files) {
      const remainingSlots = 5 - (this.report.imageUrls?.length || 0);
      const filesToProcess = Array.from(event.target.files as FileList).slice(0, remainingSlots);

      filesToProcess.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          this.report.imageUrls?.push(e.target?.result as string);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  onTransmit() {
    const user = this.authService.currentUser();
    if (!user) {
      this.toastService.show('Vérification d\'identité requise. Veuillez vous reconnecter.', 'error');
      return;
    }

    if (!this.report.vergerId || !this.report.description) {
      this.toastService.show('Données manquantes : Catégorie & Secteur requis.', 'error');
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const finalReport: Alerte = {
      ...this.report,
      senderUid: user.id,
      senderName: user.fullName,
      date: new Date(),
      statut: 'NON_TRAITEE'
    } as Alerte;

    this.alerteService.reportAlerte(finalReport).subscribe({
      next: () => {
        this.toastService.show('Alerte d\'urgence transmise au Centre de Commande.', 'success');
        this.loading = false;
        this.showReportForm = false;
        this.resetForm();
        setTimeout(() => this.loadAlerts(), 500);
      },
      error: (err) => {
        this.loading = false;
        this.toastService.show('Erreur : Échec de la transmission.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  private resetForm() {
    this.report = {
      type: 'MACHINE',
      importance: 'MEDIUM',
      vergerId: '',
      description: '',
      imageUrls: [],
      localisation: '',
      statut: 'NON_TRAITEE',
      senderUid: this.authService.currentUser()?.id,
      senderName: this.authService.currentUser()?.fullName
    };
  }

  viewDetails(a: Alerte) {
     this.selectedDetail = a;
     this.currentPreviewImage = (a.imageUrls && a.imageUrls.length > 0) ? a.imageUrls[0] : (a.imageUrl || null);
     this.cdr.detectChanges();
  }

 // On garde le "async" de ta version HEAD
  async confirmDelete(a: Alerte) {
    // On garde ton beau dialogue avec le style 'warning'
    const isConfirmed = await this.dialogService.confirm(
      'Retirer le signalement', 
      'Êtes-vous sûr de vouloir retirer ce rapport d\'incident ?', 
      'warning'
    );

    if (isConfirmed) {
      if (!a.id) return;
      this.alerteService.deleteAlerte(a.id).subscribe({
        next: () => {
          // Utilisation du Toast (Chaima) avec ton message "Intel" traduit
          this.toastService.show('Signalement (Intel) retiré avec succès.', 'success');
          this.loadAlerts();
        },
        error: (err) => {
          this.toastService.show('Erreur lors du retrait du signalement.', 'error');
        }
      });
    }
  }

  getTypeIcon(type: string | undefined): string {
    switch(type) {
      case 'MACHINE': return 'settings_suggest';
      case 'ACCIDENT': return 'emergency';
      case 'INFRASTRUCTURE': return 'apartment';
      case 'WEATHER': return 'cloud_sync';
      default: return 'warning';
    }
  }

  getTypeLabel(type: string | undefined): string {
    if (!type) return 'Incident';
    return type.replace('_', ' ');
  }

  getImportanceClass(a: Alerte): string {
    if (a.statut !== 'NON_TRAITEE') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    switch (a.importance) {
      case 'URGENT': return 'bg-error text-white shadow-lg shadow-error/20';
      case 'MEDIUM': return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    }
  }
}
