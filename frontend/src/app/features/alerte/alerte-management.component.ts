import { Component, OnInit, inject, AfterViewInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, Alerte } from '../../core/services/alerte.service';
import { ToastService } from '../../core/services/toast.service';
import { VergerService, Verger } from '../../core/services/verger.service';

@Component({
  selector: 'app-alerte-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in font-headline">
      
      <!-- Premium Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div class="animate-in slide-in-from-left duration-700">
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block">Intelligence Opérationnelle</span>
          <h1 class="text-4xl font-black text-on-surface tracking-tighter">Hub d' <span class="text-primary italic">Urgence</span></h1>
          <p class="text-outline font-medium mt-1 italic">Surveillance tactique et gestion des incidents en temps réel.</p>
        </div>
        
      </header>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ng-container *ngIf="!loading; else statsSkeleton">
          <!-- Total Incidents -->
          <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 group hover:border-primary/20 transition-all duration-500">
            <div class="w-16 h-16 rounded-[1.5rem] bg-stone-100 flex items-center justify-center text-stone-600 group-hover:scale-110 transition-transform duration-500">
              <span class="material-symbols-outlined text-3xl">analytics</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Total Incidents</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-on-surface tracking-tighter">{{ alerts.length }}</span>
                <span class="text-[10px] font-black text-stone-300 uppercase">Enregistrés</span>
              </div>
            </div>
          </div>

          <!-- Urgent Signals -->
          <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 group hover:border-error/20 transition-all duration-500">
            <div class="w-16 h-16 rounded-[1.5rem] bg-error/10 flex items-center justify-center text-error group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <span class="material-symbols-outlined text-3xl">warning</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Signaux Critiques</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-error tracking-tighter">{{ activeAlerts.length }}</span>
                <span class="text-[10px] font-black text-error/40 uppercase animate-pulse">Live</span>
              </div>
            </div>
          </div>

          <!-- Resolution Rate -->
          <div class="bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl flex items-center gap-6 group">
            <div class="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
              <span class="material-symbols-outlined text-3xl">verified</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Taux de Résolution</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-white tracking-tighter">{{ getResolutionRate() }}</span>
                <span class="text-sm font-black text-white/50">%</span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Tactical Hub: Map & Stream Combined -->
      <div class="bg-white rounded-[3.5rem] border border-stone-100 shadow-2xl overflow-hidden animate-up grid grid-cols-1 lg:grid-cols-12 h-[600px]">
        <!-- LEFT: Map (8/12) -->
        <div class="lg:col-span-8 relative bg-stone-50 border-r border-stone-100 overflow-hidden h-full">
          <div id="strike-map" class="w-full h-full grayscale-[0.2] contrast-[1.05]" style="min-height: 600px;"></div>
          
          <!-- Map Overlay Label -->
          <div class="absolute top-6 left-6 z-[1000] px-6 py-2.5 bg-stone-900 text-white rounded-full flex items-center gap-3 shadow-2xl border border-white/10">
            <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-widest">Cartographie Tactique</span>
          </div>

          <!-- Map Legend -->
          <div class="absolute bottom-6 left-6 z-[1000] glass-panel p-4 flex gap-6 shadow-2xl bg-white/80 border-white/40">
             <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-error shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                <span class="text-[9px] font-black text-on-surface uppercase tracking-widest">Urgent</span>
             </div>
             <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                <span class="text-[9px] font-black text-on-surface uppercase tracking-widest">Moyen</span>
             </div>
          </div>
        </div>

        <!-- RIGHT: Live Signals (4/12) -->
        <div class="lg:col-span-4 flex flex-col bg-stone-50/30 h-full overflow-hidden">
          <header class="p-8 border-b border-stone-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
             <div>
                <h3 class="text-xs font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary">sensors</span>
                  Flux de Signaux
                </h3>
                <p class="text-[9px] text-outline font-bold mt-1 uppercase tracking-tighter">Événements en direct</p>
             </div>
             <span class="px-3 py-1 rounded-full bg-primary/10 text-primary text-[8px] font-black animate-pulse border border-primary/20">LIVE</span>
          </header>

          <div class="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar max-h-[400px]">
            <div *ngFor="let a of activeAlerts" 
                 (click)="focusOnAlert(a)"
                 class="group bg-white p-5 rounded-[1.5rem] border border-stone-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer">
              <div class="flex gap-4">
                 <div class="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all group-hover:scale-110"
                      [ngClass]="getImportanceClass(a)">
                    <span class="material-symbols-outlined text-lg">{{ getTypeIcon(a.type) }}</span>
                 </div>
                 <div class="flex-grow min-w-0">
                    <div class="flex justify-between items-start mb-0.5">
                       <span class="text-[8px] font-black uppercase tracking-widest" [ngClass]="getImportanceTextClass(a)">{{ a.importance }}</span>
                       <span class="text-[8px] font-bold text-outline uppercase">{{ a.date | date:'HH:mm' }}</span>
                    </div>
                    <h4 class="text-[11px] font-black text-on-surface truncate group-hover:text-primary transition-colors uppercase tracking-tight">
                      {{ getTypeLabel(a) }}
                    </h4>
                    <p class="text-[10px] text-outline font-medium mt-1 line-clamp-1 group-hover:line-clamp-none leading-relaxed italic">@{{ a.vergerName || 'secteur' }}</p>
                 </div>
              </div>
            </div>

            <div *ngIf="activeAlerts.length === 0 && !loading" class="py-20 text-center opacity-30 flex flex-col items-center">
               <span class="material-symbols-outlined text-5xl mb-4 text-emerald-500">verified_user</span>
               <p class="text-[10px] font-black uppercase tracking-[0.3em]">Périmètre Sécurisé</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Archive Table -->
      <div class="space-y-6 animate-up" style="animation-delay: 200ms">
        <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex flex-col xl:flex-row gap-6">
          <div class="flex-grow relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-300">manage_search</span>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                   placeholder="Rechercher par incident, verger ou agent..."
                   class="w-full bg-stone-50 border border-stone-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-primary transition-all shadow-inner">
          </div>
          <div class="flex gap-4">
             <select [(ngModel)]="typeFilter" (ngModelChange)="applyFilters()" class="bg-stone-50 border border-stone-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-primary transition-all">
                <option value="ALL">Tous Types</option>
                <option value="MACHINE">Pannes</option>
                <option value="ACCIDENT">Accidents</option>
                <option value="INFRASTRUCTURE">Infrastructures</option>
                <option value="WEATHER">Météo</option>
             </select>
             <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="bg-stone-50 border border-stone-100 rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white focus:border-primary transition-all">
                <option value="ALL">Tous Statuts</option>
                <option value="NON_TRAITEE">Actives</option>
                <option value="TRAITEE">Résolus</option>
             </select>
          </div>
        </div>

        <div class="bg-white rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-stone-50/50 border-b border-stone-100">
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Incident & Type</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Secteur / Localisation</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Gravité</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Statut</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-50">
              <tr *ngFor="let a of pagedAlerts; let i = index" 
                  class="group hover:bg-primary/[0.02] transition-colors"
                  [style.animation-delay.ms]="i * 50">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center border transition-all group-hover:rotate-12 shadow-sm" [ngClass]="getImportanceClass(a)">
                      <span class="material-symbols-outlined text-lg">{{ getTypeIcon(a.type) }}</span>
                    </div>
                    <div>
                      <p class="font-black text-on-surface text-sm tracking-tight leading-none mb-1">{{ getTypeLabel(a) }}</p>
                      <p class="text-[9px] font-black text-outline uppercase tracking-widest">{{ a.date | date:'dd MMM, HH:mm' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex flex-col">
                    <span class="text-xs font-black text-on-surface uppercase">{{ a.vergerName || 'Remote' }}</span>
                    <span class="text-[9px] text-outline font-bold mt-1 uppercase tracking-tighter">{{ a.localisation || '---' }}</span>
                  </div>
                </td>
                <td class="px-8 py-6 text-center">
                  <span class="px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm" [ngClass]="getImportanceClass(a)">
                    {{ a.importance }}
                  </span>
                </td>
                <td class="px-8 py-6 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full" [ngClass]="a.statut === 'NON_TRAITEE' ? 'bg-error animate-pulse' : 'bg-emerald-500'"></span>
                    <span class="text-[9px] font-black uppercase tracking-widest" [ngClass]="a.statut === 'NON_TRAITEE' ? 'text-error' : 'text-emerald-600'">
                      {{ a.statut === 'NON_TRAITEE' ? 'ALERTE' : 'RÉSOLU' }}
                    </span>
                  </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex justify-end gap-2">
                    <button (click)="focusOnAlert(a)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-primary flex items-center justify-center transition-all shadow-sm">
                      <span class="material-symbols-outlined text-lg">visibility</span>
                    </button>
                    <button *ngIf="a.statut === 'NON_TRAITEE'" (click)="onSolve($event, a)" 
                            class="px-5 py-2.5 bg-stone-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-black shadow-lg transition-all flex items-center gap-2">
                      <span class="material-symbols-outlined text-base">check_circle</span> Résoudre
                    </button>
                  </div>
                </td>
              </tr>
              <!-- Empty State Table -->
              <tr *ngIf="filteredAlerts.length === 0 && !loading">
                <td colspan="5" class="py-20 text-center">
                  <div class="flex flex-col items-center gap-4">
                    <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                      <span class="material-symbols-outlined text-5xl">inventory_2</span>
                    </div>
                    <p class="text-stone-900 font-black text-xl tracking-tight">Aucun enregistrement</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Pagination -->
          <div class="px-8 py-6 border-t border-stone-100 flex items-center justify-between bg-stone-50/30">
            <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Page {{ currentPage }} de {{ totalPages || 1 }}</p>
            <div class="flex gap-2">
              <button (click)="setPage(currentPage - 1)" [disabled]="currentPage === 1" class="p-2 rounded-lg bg-white border border-stone-100 disabled:opacity-30">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <button (click)="setPage(currentPage + 1)" [disabled]="currentPage === totalPages || totalPages === 0" class="p-2 rounded-lg bg-white border border-stone-100 disabled:opacity-30">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- INCIDENT DETAIL MODAL Overlay -->
    <div *ngIf="selectedAlert" 
         class="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl animate-in fade-in" (click)="selectedAlert = null"></div>
      <div class="relative bg-white w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[3.5rem] shadow-2xl animate-up flex flex-col md:flex-row divide-x divide-stone-100">
         <!-- DETAIL LEFT: IMAGE GALLERY -->
         <div class="md:w-1/2 min-h-[300px] relative bg-stone-50 overflow-hidden flex flex-col">
            <div class="flex-grow relative overflow-hidden">
               <img *ngIf="currentPreviewImage" [src]="currentPreviewImage" class="w-full h-full object-cover">
               <div *ngIf="!currentPreviewImage" class="w-full h-full flex flex-col items-center justify-center opacity-30">
                  <span class="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                  <p class="text-[10px] font-black uppercase tracking-widest">Aucune image disponible</p>
               </div>
               <div class="absolute top-8 left-8 flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                  <span class="material-symbols-outlined text-[16px]">visibility</span>
                  Preuve Visuelle
               </div>
            </div>

            <div *ngIf="selectedAlert.imageUrls && selectedAlert.imageUrls.length > 1" 
                 class="h-24 bg-stone-900/5 backdrop-blur-sm flex items-center gap-4 px-6 border-t border-stone-100">
               <div *ngFor="let url of selectedAlert.imageUrls" 
                    (click)="currentPreviewImage = url"
                    class="h-16 aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all shadow-sm"
                    [ngClass]="currentPreviewImage === url ? 'border-primary scale-105' : 'border-transparent opacity-60'">
                  <img [src]="url" class="w-full h-full object-cover">
               </div>
            </div>
         </div>

         <!-- DETAIL RIGHT: DATA -->
         <div class="md:w-1/2 p-10 flex flex-col bg-white">
            <header class="mb-8">
               <div class="flex justify-between items-center mb-8">
                  <span class="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border" [ngClass]="getImportanceClass(selectedAlert)">{{ selectedAlert.importance }} PRIORITÉ</span>
                  <button (click)="selectedAlert = null" class="w-12 h-12 rounded-full bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center text-stone-400">
                     <span class="material-symbols-outlined">close</span>
                  </button>
               </div>
               <h2 class="text-4xl font-black text-on-surface tracking-tighter leading-none mb-4">
                  {{ getTypeLabel(selectedAlert) }} <span class="text-primary italic">Rapport</span>
               </h2>
               <div class="flex flex-wrap items-center gap-6">
                  <p class="text-[10px] text-outline font-black uppercase tracking-widest flex items-center gap-2">
                     <span class="material-symbols-outlined text-primary text-lg">calendar_today</span>
                     {{ selectedAlert.date | date:'dd MMMM, yyyy • HH:mm' }}
                  </p>
                  <p class="text-[10px] text-error font-black uppercase tracking-widest flex items-center gap-2">
                     <span class="material-symbols-outlined text-lg">location_on</span>
                     {{ selectedAlert.vergerName || 'Inconnu' }}
                  </p>
               </div>
            </header>

            <div class="flex-grow space-y-8 overflow-y-auto custom-scrollbar pr-2 mb-8">
               <div class="bg-stone-50 p-6 rounded-[2rem] border border-stone-100 shadow-inner">
                  <label class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-3 block opacity-50">Description de l'incident</label>
                  <p class="text-sm font-medium text-on-surface leading-relaxed italic">"{{ selectedAlert.description }}"</p>
               </div>

               <div class="grid grid-cols-2 gap-6">
                  <div class="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-sm">
                     <label class="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-2 block">Agent Source</label>
                     <p class="text-xs font-black text-on-surface">{{ selectedAlert.senderName || 'Système' }}</p>
                  </div>
                  <div class="bg-white p-5 rounded-[1.5rem] border border-stone-100 shadow-sm">
                     <label class="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-2 block">Coordonnées Grid</label>
                     <p class="text-xs font-black text-on-surface">{{ selectedAlert.localisation || 'Non précisée' }}</p>
                  </div>
               </div>
            </div>

            <button *ngIf="selectedAlert.statut === 'NON_TRAITEE'" 
                    (click)="onSolve($event, selectedAlert)"
                    class="w-full py-5 bg-primary text-on-primary font-black rounded-[1.5rem] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
               <span class="material-symbols-outlined">verified_user</span>
               Confirmer la Résolution
            </button>
         </div>
      </div>
    </div>

    <!-- SKELETON TEMPLATES -->
    <ng-template #statsSkeleton>
        <div *ngFor="let i of [1,2,3]" class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 animate-pulse">
            <div class="w-16 h-16 rounded-[1.5rem] bg-stone-50 shrink-0"></div>
            <div class="space-y-2 flex-grow">
                <div class="h-2 w-12 bg-stone-100 rounded"></div>
                <div class="h-8 w-24 bg-stone-100 rounded"></div>
            </div>
        </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; background: #f4edde; min-height: 100vh; }
    .animate-up { animation: slideUp 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .glass-panel { @apply bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2rem]; }
    
    #strike-map {
      min-height: 600px;
      width: 100%;
      background: #f1f3f5;
    }
    
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3e521920; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #3e521940; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlerteManagementComponent implements OnInit, AfterViewInit {
  protected readonly Math = Math;
  private alerteService = inject(AlerteService);
  private toastService = inject(ToastService);
  private vergerService = inject(VergerService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  alerts: Alerte[] = [];
  filteredAlerts: Alerte[] = [];
  vergers: Record<string, string> = {};
  loading = false;

  searchTerm = '';
  typeFilter = 'ALL';
  statusFilter = 'NON_TRAITEE';

  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  pagedAlerts: Alerte[] = [];

  _selectedAlert: Alerte | null = null;
  currentPreviewImage: string | null = null;

  set selectedAlert(val: Alerte | null) {
    this._selectedAlert = val;
    if (val) {
      this.currentPreviewImage = (val.imageUrls && val.imageUrls.length > 0)
        ? val.imageUrls[0]
        : (val.imageUrl || null);
    } else {
      this.currentPreviewImage = null;
    }
  }
  get selectedAlert() { return this._selectedAlert; }
  private map: any;
  private markersLayer: any;
  private L: any;

  get activeAlerts() {
    return this.alerts.filter(a => a.statut === 'NON_TRAITEE');
  }

  getResolutionRate(): number {
    if (this.alerts.length === 0) return 0;
    const resolved = this.alerts.filter(a => a.statut === 'TRAITEE').length;
    return Math.round((resolved / this.alerts.length) * 100);
  }

  ngOnInit() {
    this.loadVergers();
    this.loadAlerts();
  }

  loadVergers() {
    this.vergerService.getAllVergers().subscribe((list: Verger[]) => {
      list.forEach((v: Verger) => {
        if (v.id) this.vergers[v.id] = v.nom;
      });
      this.enrichAlertNames();
    });
  }

  private enrichAlertNames() {
    this.alerts.forEach(a => {
      if (!a.vergerName && a.vergerId && this.vergers[a.vergerId]) {
        a.vergerName = this.vergers[a.vergerId];
      }
    });
    this.cdr.detectChanges();
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      setTimeout(() => this.initMap(), 400);
    }
  }

  private initMap() {
    if (!this.L) return;
    const mapEl = document.getElementById('strike-map');
    if (!mapEl) return;

    this.map = this.L.map('strike-map', {
      center: [34.0, 9.3],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.updateMarkers();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.fitMapToMarkers();
      }
    }, 1500);
  }

  loadAlerts() {
    this.loading = true;
    this.cdr.detectChanges();
    this.alerteService.getAllAlertes().subscribe({
      next: (data: Alerte[]) => {
        this.alerts = data;
        this.enrichAlertNames();
        this.applyFilters();
        this.loading = false;
        this.updateMarkers();
        this.fitMapToMarkers();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load alerts:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private fitMapToMarkers() {
    if (!this.map || !this.L || this.activeAlerts.length === 0) return;

    const bounds: any[] = [];
    this.activeAlerts.forEach(a => {
      if (a.localisation) {
        const parts = a.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) bounds.push([lat, lng]);
        }
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }

  private updateMarkers() {
    if (!this.L || !this.markersLayer || !this.map) return;
    this.markersLayer.clearLayers();

    this.activeAlerts.forEach(a => {
      if (a.localisation) {
        const parts = a.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());

          if (!isNaN(lat) && !isNaN(lng)) {
            const pinColor = a.importance === 'URGENT' ? '#ef4444' : (a.importance === 'MEDIUM' ? '#f97316' : '#3b82f6');
            const customIcon = this.L.divIcon({
              html: `<div style="background:${pinColor};width:16px;height:16px;border-radius:50%;border:4px solid white;box-shadow:0 0 20px ${pinColor}88;" class="${a.importance === 'URGENT' ? 'animate-pulse' : ''}"></div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            this.L.marker([lat, lng], { icon: customIcon })
              .on('click', () => {
                this.ngZone.run(() => {
                  this.selectedAlert = a;
                  this.cdr.detectChanges();
                });
              })
              .addTo(this.markersLayer);
          }
        }
      }
    });
  }

  applyFilters() {
    this.filteredAlerts = this.alerts.filter(a => {
      const matchesSearch = !this.searchTerm ||
        a.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.vergerName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.senderName?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesType = this.typeFilter === 'ALL' || a.type === this.typeFilter;
      const matchesStatus = this.statusFilter === 'ALL' || a.statut === this.statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredAlerts.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedAlerts = this.filteredAlerts.slice(start, end);
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  focusOnAlert(a: Alerte) {
    this.selectedAlert = a;
    if (this.map && a.localisation && a.statut === 'NON_TRAITEE') {
      const parts = a.localisation.split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setView([lat, lng], 12, { animate: true });
      }
    }
    this.cdr.detectChanges();
  }

  onSolve(event: Event, a: Alerte) {
    event.stopPropagation();
    if (!a.id) return;

    this.alerteService.solveAlerte(a.id).subscribe({
      next: () => {
        this.toastService.show('Alerte résolue avec succès.', 'success');
        this.loadAlerts();
        if (this.selectedAlert?.id === a.id) this.selectedAlert = null;
      }
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'MACHINE': return 'settings_suggest';
      case 'ACCIDENT': return 'emergency';
      case 'INFRASTRUCTURE': return 'apartment';
      case 'WEATHER':
      case 'METEO': return 'cloud_sync';
      default: return 'warning';
    }
  }

  getTypeLabel(a: Alerte | null): string {
    if (!a || !a.type) return 'Incident';
    return a.type.replace('_', ' ');
  }

  getImportanceClass(a: Alerte): string {
    if (a.statut !== 'NON_TRAITEE') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    switch (a.importance) {
      case 'URGENT': return 'bg-error text-white border-transparent';
      case 'MEDIUM': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  }

  getImportanceTextClass(a: Alerte): string {
    if (a.statut !== 'NON_TRAITEE') return 'text-emerald-500';
    switch (a.importance) {
      case 'URGENT': return 'text-error';
      case 'MEDIUM': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  }
}
