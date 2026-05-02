import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TriturationService, Trituration } from '../../../core/services/trituration.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { MillingCenterService, MillingCenter } from '../../../core/services/milling-center.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-trituration-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in font-headline">
      
      <!-- Premium Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div class="animate-in slide-in-from-left duration-700">
          <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.4em] mb-2 block">Production & Refining</span>
          <h1 class="text-4xl font-black text-[#1e1c12] tracking-tighter">Planning <span class="text-[#3e5219] italic">Trituration</span></h1>
          <p class="text-[#1e1c12]/60 font-medium mt-1 italic">Strategic oversight and production analytics for olive oil extraction.</p>
        </div>
        
        <div class="flex gap-4 animate-in slide-in-from-right duration-700">
           <button (click)="openCreateModal()" 
                  class="bg-[#3e5219] text-white px-8 py-3.5 font-black rounded-2xl shadow-lg shadow-[#3e5219]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest">
            <span class="material-symbols-outlined">oil_barrel</span>
            Nouvelle Planification
          </button>
        </div>
      </header>

      <!-- Stats Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ng-container *ngIf="!loading; else statsSkeleton">
          <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 group hover:border-[#3e5219]/20 transition-all duration-500">
            <div class="w-16 h-16 rounded-[1.5rem] bg-[#3e5219]/10 flex items-center justify-center text-[#3e5219] group-hover:scale-110 transition-transform duration-500">
              <span class="material-symbols-outlined text-3xl">scale</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Tonnage Global</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-[#1e1c12] tracking-tighter">{{ stats.totalInputWeight | number:'1.0-0' }}</span>
                <span class="text-sm font-black text-stone-400">KG</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 group hover:border-[#3e5219]/20 transition-all duration-500">
            <div class="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform duration-500">
              <span class="material-symbols-outlined text-3xl">water_drop</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-1">Huile Produite</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-[#1e1c12] tracking-tighter">{{ stats.totalOil | number:'1.0-0' }}</span>
                <span class="text-sm font-black text-stone-400">Litres</span>
              </div>
            </div>
          </div>

          <div class="bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl flex items-center gap-6 group">
            <div class="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center text-primary group-hover:rotate-12 transition-transform">
              <span class="material-symbols-outlined text-3xl">percent</span>
            </div>
            <div>
              <span class="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Rendement Moyen</span>
              <div class="flex items-baseline gap-2">
                <span class="text-3xl font-black text-white tracking-tighter">{{ stats.avgRatio | number:'1.1-1' }}</span>
                <span class="text-sm font-black text-white/50">%</span>
              </div>
            </div>
          </div>
        </ng-container>
      </div>

      <!-- Search and Filters -->
      <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex flex-col md:flex-row gap-6">
        <div class="flex-grow relative">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-300">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" type="text" placeholder="Rechercher par verger, campagne ou centre..."
                 class="w-full bg-stone-50 border border-stone-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-[#3e5219] transition-all shadow-inner">
        </div>
        <div class="flex gap-4">
           <select [(ngModel)]="statusFilter" (ngModelChange)="currentPage = 1" class="bg-stone-50 border border-stone-100 rounded-xl px-6 py-3 text-sm font-black outline-none focus:bg-white focus:border-[#3e5219] transition-all">
              <option value="">Tous les Statuts</option>
              <option value="PLANNED">PLANNED</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
           </select>
        </div>
      </div>

      <!-- Main Plan Table -->
      <div class="bg-white rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden animate-up relative">
        <!-- Loader Overlay -->
        <div *ngIf="loading" class="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-[#3e5219]/20 border-t-[#3e5219] rounded-full animate-spin"></div>
                <p class="text-[10px] font-black text-[#3e5219] uppercase tracking-widest animate-pulse">Synchronisation des données...</p>
            </div>
        </div>

        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-stone-50/50 border-b border-stone-100">
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Campagne / Verger</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Centre de Trituration</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Statut</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Extraction</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-50">
              <ng-container *ngIf="!loading; else tableSkeleton">
                <tr *ngFor="let tri of pagedTriturations; let i = index" 
                    class="group hover:bg-[#3e5219]/[0.02] transition-colors animate-in fade-in slide-in-from-bottom-2"
                    [style.animation-delay.ms]="i * 50">
                  <td class="px-8 py-7">
                    <div class="flex items-center gap-4">
                      <div class="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#3e5219] transition-all shadow-sm border border-stone-100">
                        <span class="material-symbols-outlined text-lg">description</span>
                      </div>
                      <div>
                        <p class="font-black text-[#1e1c12] text-base tracking-tight leading-none mb-1">{{ tri.vergerName }}</p>
                        <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest">{{ tri.oliveType }} • {{ tri.inputWeightKg }} KG</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-7">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-stone-300 text-lg">factory</span>
                      <span class="text-xs font-black text-stone-600 uppercase">{{ tri.millName }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-7 text-center">
                    <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
                          [ngClass]="{
                            'bg-stone-100 text-stone-500': tri.status === 'PLANNED',
                            'bg-amber-100 text-amber-700': tri.status === 'PROCESSING',
                            'bg-emerald-100 text-emerald-700': tri.status === 'COMPLETED'
                          }">
                      {{ tri.status }}
                    </span>
                  </td>
                  <td class="px-8 py-7">
                    <div class="flex flex-col items-center gap-2">
                      <span class="text-xs font-black" [ngClass]="tri.oilProducedLiters ? 'text-[#1e1c12]' : 'text-stone-300'">
                        {{ tri.oilProducedLiters || '---' }} L
                      </span>
                      <div class="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden shadow-inner">
                        <div class="h-full bg-[#3e5219] transition-all duration-700" 
                             [style.width.%]="calculateRatio(tri)"></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-8 py-7 text-right">
                    <div class="flex justify-end gap-2">
                      <button (click)="onEdit(tri)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-[#3e5219] flex items-center justify-center transition-all shadow-sm">
                        <span class="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button *ngIf="tri.status === 'PLANNED'" (click)="updateStatus(tri, 'PROCESSING')" 
                              class="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center hover:scale-110 transition-all shadow-lg">
                        <span class="material-symbols-outlined text-lg text-primary">play_arrow</span>
                      </button>
                      <button *ngIf="tri.status === 'PROCESSING'" (click)="openResultModal(tri)" 
                              class="px-5 py-2.5 bg-[#3e5219] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 shadow-lg transition-all flex items-center gap-2">
                        <span class="material-symbols-outlined text-base">check_circle</span> Clôturer
                      </button>
                      <button (click)="onDelete(tri)" 
                              class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-300 hover:text-red-500 flex items-center justify-center hover:scale-110 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Empty State -->
                <tr *ngIf="filteredTriturations.length === 0">
                  <td colspan="5" class="py-20 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                        <span class="material-symbols-outlined text-5xl">inventory_2</span>
                      </div>
                      <div>
                        <p class="text-stone-900 font-black text-xl tracking-tight">Aucun protocole trouvé</p>
                        <p class="text-stone-400 text-sm font-medium">Ajustez vos filtres ou créez une nouvelle planification.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
          
          <!-- Pagination -->
          <div class="px-8 py-6 border-t border-stone-50 flex items-center justify-between bg-stone-50/30">
            <p class="text-[10px] font-black text-stone-400 uppercase tracking-widest">Page {{ currentPage }} de {{ totalPages || 1 }}</p>
            <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="p-2 rounded-lg bg-white border border-stone-100 disabled:opacity-30">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages || totalPages === 0" class="p-2 rounded-lg bg-white border border-stone-100 disabled:opacity-30">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CREATE / EDIT MODAL -->
      <div *ngIf="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl animate-in fade-in duration-300" (click)="toggleModal()"></div>
        <div class="relative bg-[#f4edde] w-full max-w-xl rounded-[3rem] shadow-2xl p-10 space-y-8 border border-white/20 animate-in slide-in-from-bottom-8 duration-500">
          <header>
            <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.3em] block mb-2 font-headline">Gestion du protocole</span>
            <h3 class="text-3xl font-black text-[#1e1c12] tracking-tighter">{{ isEditing ? 'Modifier' : 'Nouvelle' }} Planification</h3>
          </header>

          <form class="space-y-6" (ngSubmit)="saveTrituration()">
            <div class="space-y-4">
              <label class="block">
                <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Campagne de Récolte Terminé</span>
                <select [(ngModel)]="currentTrituration.collecteId" name="collecte" (change)="onCollecteSelect()"
                        class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
                  <option value="">Sélectionner une récolte...</option>
                  <option *ngFor="let col of finishedCollectes" [value]="col.id">{{ col.description }} ({{ col.vergerName }})</option>
                </select>
              </label>

              <label class="block">
                <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Unité de Trituration</span>
                <select [(ngModel)]="currentTrituration.millId" name="mill" (change)="onMillSelect()"
                        class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
                  <option value="">Sélectionner un centre...</option>
                  <option *ngFor="let m of millingCenters" [value]="m.id">{{ m.name }} ({{ m.locationName }})</option>
                </select>
              </label>

              <div class="grid grid-cols-2 gap-4">
                <label>
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Poids d'Entrée (KG)</span>
                  <input type="number" [(ngModel)]="currentTrituration.inputWeightKg" name="weight"
                         class="w-full bg-stone-100/50 border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none shadow-inner">
                </label>
                <label>
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Date Prévue</span>
                  <input type="date" [(ngModel)]="currentTrituration.plannedDate" name="pDate"
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
                </label>
              </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" (click)="toggleModal()" class="flex-1 py-4 bg-white border border-stone-200 text-[#1e1c12] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-all">Annuler</button>
              <button type="submit" [disabled]="!currentTrituration.collecteId || !currentTrituration.millId"
                      class="flex-1 py-4 bg-[#3e5219] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 shadow-lg">Confirmer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- RESULTS MODAL -->
      <div *ngIf="showResultModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl animate-in fade-in duration-300" (click)="showResultModal = false"></div>
        <div class="relative bg-[#f4edde] w-full max-w-xl rounded-[3rem] shadow-2xl p-10 space-y-8 border border-white/20 animate-in slide-in-from-bottom-8 duration-500">
          <header>
            <span class="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em] block mb-2 italic">Production Analytics</span>
            <h3 class="text-3xl font-black text-[#1e1c12] tracking-tighter">Enregistrer les Résultats</h3>
          </header>

          <form class="space-y-6" (ngSubmit)="saveResults()">
            <div class="grid grid-cols-2 gap-4">
              <label>
                <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Huile Produite (Litres)</span>
                <input type="number" [(ngModel)]="resultsPayload.oilGenerated" name="oil"
                       class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500 shadow-sm">
              </label>
              <label>
                <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Acidité (%)</span>
                <input type="number" step="0.1" [(ngModel)]="resultsPayload.acidity" name="acid"
                       class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500 shadow-sm">
              </label>
            </div>

            <label class="block">
              <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Classification Qualité</span>
              <select [(ngModel)]="resultsPayload.quality" name="quality"
                      class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-amber-500 shadow-sm">
                <option value="Extra Virgin">Extra Vierge (EVOO)</option>
                <option value="Virgin">Vierge</option>
                <option value="Lampante">Lampante</option>
              </select>
            </label>

            <div class="flex gap-4 pt-4">
              <button type="button" (click)="showResultModal = false" class="flex-1 py-4 bg-white border border-stone-200 text-[#1e1c12] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-all">Annuler</button>
              <button type="submit" class="flex-1 py-4 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 shadow-lg shadow-amber-600/20">Finaliser Protocol</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- SKELETON TEMPLATES -->
    <ng-template #statsSkeleton>
        <div *ngFor="let i of [1,2,3]" class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl flex items-center gap-6 animate-pulse">
            <div class="w-16 h-16 rounded-[1.5rem] bg-stone-100 shrink-0"></div>
            <div class="space-y-2 flex-grow">
                <div class="h-2 w-12 bg-stone-100 rounded"></div>
                <div class="h-8 w-24 bg-stone-100 rounded"></div>
            </div>
        </div>
    </ng-template>

    <ng-template #tableSkeleton>
        <tr *ngFor="let i of [1,2,3,4,5]" class="animate-pulse">
            <td class="px-8 py-7">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-stone-100"></div>
                    <div class="space-y-2">
                        <div class="h-4 w-32 bg-stone-100 rounded"></div>
                        <div class="h-2 w-20 bg-stone-100 rounded"></div>
                    </div>
                </div>
            </td>
            <td class="px-8 py-7"><div class="h-4 w-24 bg-stone-100 rounded"></div></td>
            <td class="px-8 py-7"><div class="mx-auto h-6 w-16 bg-stone-100 rounded-full"></div></td>
            <td class="px-8 py-7">
                <div class="flex flex-col items-center gap-2">
                    <div class="h-4 w-12 bg-stone-100 rounded"></div>
                    <div class="h-1.5 w-24 bg-stone-100 rounded-full"></div>
                </div>
            </td>
            <td class="px-8 py-7"><div class="ml-auto h-8 w-24 bg-stone-100 rounded-xl"></div></td>
        </tr>
    </ng-template>
  `,
  styles: [`
    :host { display: block; background: #f4edde; min-height: 100vh; }
    .animate-up { animation: slideUp 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    
    .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* Custom scrollbar for better look */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #3e521920; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #3e521940; }
  `]
})
export class TriturationPlanningComponent implements OnInit {
  private triturationService = inject(TriturationService);
  private collecteService = inject(CollecteService);
  private millingCenterService = inject(MillingCenterService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);

  triturations: Trituration[] = [];
  finishedCollectes: Collecte[] = [];
  millingCenters: MillingCenter[] = [];

  searchTerm = '';
  statusFilter = '';
  currentPage = 1;
  itemsPerPage = 5;
  loading = false;

  stats = { totalInputWeight: 0, totalOil: 0, avgRatio: 0 };

  showModal = false;
  isEditing = false;
  currentTrituration: Partial<Trituration> = this.emptyTrituration();

  showResultModal = false;
  resultsPayload = { oilGenerated: 0, acidity: 0.3, quality: 'Extra Virgin', notes: '' };

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading = true;
    this.cdr.detectChanges(); // Force skeleton display

    this.triturationService.getTriturations().subscribe({
      next: (data) => {
        console.log('[DEBUG] Triturations received:', data);
        this.triturations = data || [];
        this.calculateStats();
        // Give a slight delay to avoid flicker and show the beautiful skeleton
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 800);
      },
      error: (err) => {
        console.error('[DEBUG] Error fetching triturations:', err);
        this.loading = false;
        this.dialogService.alert("Erreur", "Impossible de charger les données de trituration.", "danger");
      }
    });

    this.collecteService.getCollectes().subscribe(data => {
      this.finishedCollectes = (data || []).filter(c => c.statut === 'termine');
      this.cdr.detectChanges();
    });

    this.millingCenterService.getCenters().subscribe(data => {
      this.millingCenters = data || [];
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    const totalInput = this.triturations.reduce((acc, curr) => acc + (curr.inputWeightKg || 0), 0);
    const totalOil = this.triturations.reduce((acc, curr) => acc + (curr.oilProducedLiters || 0), 0);
    const realRatio = totalInput > 0 ? (totalOil / totalInput) * 100 : 0;

    this.stats = { totalInputWeight: totalInput, totalOil: totalOil, avgRatio: realRatio };
  }

  get filteredTriturations() {
    let result = this.triturations;
    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase();
      result = result.filter(t =>
        (t.vergerName?.toLowerCase().includes(s)) ||
        (t.millName?.toLowerCase().includes(s))
      );
    }
    if (this.statusFilter) {
      result = result.filter(t => t.status === this.statusFilter);
    }
    return result;
  }

  get pagedTriturations() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredTriturations.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredTriturations.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  calculateRatio(tri: Trituration): number {
    if (!tri.inputWeightKg || !tri.oilProducedLiters) return 0;
    return Math.min((tri.oilProducedLiters / tri.inputWeightKg) * 100 * 4, 100);
  }

  private emptyTrituration(): Partial<Trituration> {
    return { collecteId: '', millId: '', millName: '', plannedDate: new Date().toISOString().split('T')[0], status: 'PLANNED' };
  }

  toggleModal() {
    this.showModal = !this.showModal;
    if (!this.showModal) {
      this.currentTrituration = this.emptyTrituration();
      this.isEditing = false;
    }
  }

  openCreateModal() {
    this.isEditing = false;
    this.currentTrituration = this.emptyTrituration();
    this.showModal = true;
  }

  onEdit(tri: Trituration) {
    this.currentTrituration = { ...tri };
    this.isEditing = true;
    this.showModal = true;
  }

  onCollecteSelect() {
    const selected = this.finishedCollectes.find(c => c.id === this.currentTrituration.collecteId);
    if (selected) {
      this.currentTrituration.vergerId = selected.vergerId;
      this.currentTrituration.vergerName = selected.vergerName;
      this.currentTrituration.oliveType = selected.type;
      const totalWeight = selected.dailyReports?.reduce((acc, r) => acc + (r.weightKg || 0), 0) || 0;
      this.currentTrituration.inputWeightKg = totalWeight;
    }
  }

  onMillSelect() {
    const selected = this.millingCenters.find(m => m.id === this.currentTrituration.millId);
    if (selected) {
      this.currentTrituration.millName = selected.name;
    }
  }

  saveTrituration() {
    if (!this.currentTrituration.collecteId || !this.currentTrituration.millId) return;

    console.log('[DEBUG] Saving trituration:', this.currentTrituration);

    const request = this.isEditing && this.currentTrituration.id
      ? this.triturationService.updateTrituration(this.currentTrituration.id, this.currentTrituration as Trituration)
      : this.triturationService.createTrituration(this.currentTrituration as Trituration);

    request.subscribe({
      next: (res) => {
        console.log('[DEBUG] Save response:', res);
        this.toggleModal();
        this.loadAll();
        this.dialogService.alert("Succès", "Le protocole de trituration a été synchronisé.", "success");
      },
      error: (err) => {
        console.error('[DEBUG] Save error:', err);
        this.dialogService.alert("Erreur", "Échec de la synchronisation du protocole.", "danger");
      }
    });
  }

  updateStatus(tri: Trituration, status: string) {
    if (!tri.id) return;
    this.triturationService.updateTrituration(tri.id, { ...tri, status }).subscribe(() => {
      this.loadAll();
    });
  }

  openResultModal(tri: Trituration) {
    this.currentTrituration = tri;
    this.showResultModal = true;
  }

  saveResults() {
    if (!this.currentTrituration.id) return;

    const update: Trituration = {
      ...(this.currentTrituration as Trituration),
      status: 'COMPLETED',
      oilProducedLiters: this.resultsPayload.oilGenerated,
      acidity: this.resultsPayload.acidity,
      quality: this.resultsPayload.quality
    };

    this.triturationService.updateTrituration(this.currentTrituration.id, update).subscribe({
      next: () => {
        this.showResultModal = false;
        this.loadAll();
        this.dialogService.alert("Félicitations", "Campagne de production clôturée.", "success");
      },
      error: () => this.dialogService.alert("Erreur", "Échec de la clôture du protocole.", "danger")
    });
  }

  async onDelete(tri: Trituration) {
    if (!tri.id) return;
    const ok = await this.dialogService.confirm("Suppression", "Supprimer définitivement ce protocole?", "danger");
    if (ok) {
      this.triturationService.deleteTrituration(tri.id).subscribe(() => this.loadAll());
    }
  }
}
