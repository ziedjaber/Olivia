import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ParticipationService, Participation } from '../../../core/services/participation.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { AuthService } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { HarvestMapComponent } from './harvest-map.component';

@Component({
   selector: 'app-daily-harvest',
   standalone: true,
   imports: [CommonModule, FormsModule, RouterModule, HarvestMapComponent],
   template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      <!-- Premium Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div>
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 block">Field Command Unit</span>
          <h1 class="text-4xl font-black text-on-surface font-headline tracking-tighter">Daily <span class="text-primary italic">Operations</span></h1>
          <p class="text-on-surface-variant font-medium mt-1 opacity-60">Manage real-time tree progress and daily tonnage reports.</p>
        </div>
        
        <div class="flex gap-4">
           <div class="bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                <span class="material-symbols-outlined">analytics</span>
              </div>
              <div>
                <span class="text-[9px] font-black text-outline uppercase tracking-wider block">Active Sectors</span>
                <span class="text-lg font-black text-on-surface">{{ activeCollectes.length }} Campaigns</span>
              </div>
           </div>
        </div>
      </header>

      <!-- Operational Hub -->
      <div *ngIf="loading" class="py-20 flex flex-col items-center justify-center text-outline animate-pulse">
         <span class="material-symbols-outlined text-4xl animate-spin mb-4">settings_accessibility</span>
         <p class="text-[10px] font-black uppercase tracking-widest">Synchronizing operational state...</p>
      </div>

      <div *ngIf="!loading && activeCollectes.length === 0" class="py-32 text-center border-2 border-dashed border-stone-100 rounded-[3rem] bg-stone-50/30">
         <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span class="material-symbols-outlined text-stone-300 text-3xl">map_off</span>
         </div>
         <h4 class="text-xl font-black text-on-surface mb-2">No Active Harvests</h4>
         <p class="text-sm text-outline font-medium max-w-xs mx-auto">Field operations are only available for campaigns currently "In Progress".</p>
         <button routerLink="/dashboard" class="mt-8 px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all">Go to Roster Management</button>
      </div>

      <div *ngIf="!loading && activeCollectes.length > 0" class="space-y-12">
         <div *ngFor="let col of activeCollectes" class="group bg-white rounded-[3rem] border border-stone-100 shadow-xl overflow-hidden animate-slide-up hover:border-primary/20 transition-all duration-500">
            <!-- Mission Strip -->
            <div class="p-8 md:p-12 pb-14 flex flex-col gap-14">
               <div class="flex flex-col lg:flex-row gap-10">
                  <!-- Left: Info & Progress -->
                  <div class="flex-grow space-y-6">
                     <div class="flex items-center gap-4">
                        <span class="px-4 py-1.5 bg-stone-900 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">{{ col.vergerName }}</span>
                        <span class="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                              [ngClass]="col.statut === 'en_cours' ? 'text-primary' : 'text-stone-400'">
                          <span class="w-1.5 h-1.5 rounded-full animate-pulse" 
                                [ngClass]="col.statut === 'en_cours' ? 'bg-primary' : 'bg-stone-300'"></span>
                          Status: {{ col.statut === 'PLANNED' ? 'Ready to Deploy' : (col.statut === 'en_cours' ? 'Live Operations' : col.statut) }}
                        </span>
                     </div>
                     
                     <h2 class="text-3xl font-black text-on-surface font-headline tracking-tighter">{{ col.description }}</h2>
                     
                     <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-4">
                        <div class="p-4 rounded-2xl border border-stone-50 bg-stone-50/50">
                           <span class="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Type</span>
                           <span class="text-xs font-black text-on-surface uppercase">{{ col.type }}</span>
                        </div>
                        <div class="p-4 rounded-2xl border border-stone-50 bg-stone-50/50">
                           <span class="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Reports</span>
                           <span class="text-xs font-black text-on-surface">{{ col.dailyReports?.length || 0 }} Entries</span>
                        </div>
                        <div class="p-4 rounded-2xl border border-stone-50 bg-stone-50/50">
                           <span class="text-[8px] font-black text-outline uppercase tracking-widest block mb-1">Start Date</span>
                           <span class="text-xs font-black text-on-surface">{{ col.startDate | date:'MMM d' }}</span>
                        </div>
                     </div>
                  </div>

                  <!-- Right: Actions & Protocol -->
                  <div class="lg:w-80 flex flex-col justify-center">
                     <div *ngIf="needsDailyVerification(col)" class="p-6 bg-warning/5 border border-warning/20 rounded-3xl space-y-4">
                        <div>
                           <span class="text-[9px] font-black text-warning uppercase tracking-[0.3em] block mb-1">Safety Protocol</span>
                           <p class="text-[11px] font-bold text-on-surface-variant italic leading-relaxed">Please verify personnel presence and verify materials have arrived securely.</p>
                        </div>
                        <button (click)="verifyDay(col)" class="w-full py-4 bg-warning text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg hover:brightness-95 transition-all flex items-center justify-center gap-2">
                           <span class="material-symbols-outlined text-lg font-black">fact_check</span> Validate Entry
                        </button>
                     </div>

                      <div *ngIf="!needsDailyVerification(col) || col.statut === 'PLANNED'" class="space-y-4">
                        <div class="p-6 bg-stone-900 text-white rounded-3xl space-y-4 shadow-2xl">
                           <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] block">Control Deck</span>
                           <div class="flex flex-col gap-2">
                              <!-- Start Mission Button (for PLANNED) -->
                              <button *ngIf="col.statut === 'PLANNED'" (click)="startMission(col)" 
                                      class="w-full py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg">
                                 <span class="material-symbols-outlined text-lg">rocket_launch</span> Deploy Campaign
                              </button>

                              <ng-container *ngIf="col.statut === 'en_cours'">
                                <button (click)="toggleMap(col)" class="w-full py-3 border border-white/20 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                                   <span class="material-symbols-outlined text-lg">{{ activeMapCol === col.id ? 'close' : 'map' }}</span>
                                   {{ activeMapCol === col.id ? 'Close Map' : 'Launch Tracking Map' }}
                                </button>
                                <button (click)="openResultsLedger(col)" class="w-full py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                                   <span class="material-symbols-outlined text-lg">edit_document</span> Manage Daily Results
                                </button>
                                <button (click)="openCrewLedger(col)" class="w-full mt-2 py-4 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-lg">
                                   <span class="material-symbols-outlined text-lg">payments</span> Crew Ledger / Pay
                                </button>
                                
                                <!-- End Mission Button -->
                                <button (click)="endMission(col)" 
                                        class="w-full mt-4 py-3 bg-stone-800 border border-white/10 text-stone-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2">
                                   <span class="material-symbols-outlined text-lg">check_circle</span> Terminer la Mission
                                </button>
                              </ng-container>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Daily Progress Chart -->
               <div *ngIf="col.dailyReports && col.dailyReports.length > 0" class="w-full">
                  <div class="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm">
                     <div class="flex items-center justify-between mb-8">
                        <div>
                           <h3 class="text-base font-black text-on-surface uppercase tracking-tight">Mission Trajectory</h3>
                           <p class="text-[10px] font-bold text-stone-400 mt-0.5 tracking-widest uppercase">Tonnage collected per campaign day</p>
                        </div>
                     </div>

                     <div class="relative h-48 mb-2">
                        <div class="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                           <div class="border-t border-gray-50 w-full h-0"></div>
                           <div class="border-t border-gray-50 w-full h-0"></div>
                           <div class="border-t border-gray-50 w-full h-0"></div>
                           <div class="border-t border-gray-50 w-full h-0"></div>
                        </div>

                        <div class="absolute inset-x-0 bottom-0 top-0 flex items-end gap-3 px-1 pb-2">
                           <div *ngFor="let rep of getChartData(col)" class="group relative flex-1 flex flex-col items-center justify-end h-full">
                              <div class="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 scale-95 group-hover:scale-100 pointer-events-none">
                                 <div class="bg-stone-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2.5 shadow-2xl border border-white/10 backdrop-blur-md">
                                    <div class="text-primary mb-1">{{ rep.dateLabel }}</div>
                                    <div class="text-lg font-black tracking-tight">{{ rep.weightKg }} <span class="text-[10px] opacity-60">KG</span></div>
                                 </div>
                                 <div class="w-2 h-2 bg-stone-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-white/10"></div>
                              </div>
                              <div class="w-full relative group-hover:-translate-y-2 transition-all duration-500 ease-out" [style.height]="(rep.percentage * 0.95) + '%'">
                                 <div class="absolute inset-x-0 top-0 h-full rounded-t-xl bg-gradient-to-t from-blue-600 to-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"></div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Trees Status Grid -->
               <div *ngIf="getVerger(col.vergerId) as v" class="pt-6 border-t border-stone-50">
                  <div class="flex items-center justify-between mb-4">
                     <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-sm text-emerald-500">grid_view</span>
                        <span class="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 font-headline">Harvest Performance Grid</span>
                     </div>
                     <div class="text-right flex items-center gap-3 font-headline">
                        <span class="text-[10px] font-black text-on-surface uppercase">{{ getAggregateStats(col).trees }} Done</span>
                        <span class="text-[10px] font-medium text-stone-200">/</span>
                        <span class="text-[10px] font-black text-stone-400 uppercase">{{ v.nombreArbres }} Units</span>
                        <span class="bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full ml-2 shadow-lg shadow-emerald-500/20">{{ getTreeProgress(col, v) }}%</span>
                     </div>
                  </div>

                  <div class="flex flex-wrap gap-1.5 p-6 bg-stone-50/50 rounded-[2.5rem] border border-stone-100/50">
                     <div *ngFor="let t of [].constructor(v.nombreArbres); let i = index"
                          class="w-2 h-4 rounded-sm transition-all duration-700"
                          [class.bg-emerald-500]="i < getAggregateStats(col).trees"
                          [class.bg-stone-200]="i >= getAggregateStats(col).trees"
                          [style.transition-delay]="(i * 5) + 'ms'">
                     </div>
                  </div>
               </div>
            </div>

            <!-- Map View Boundary -->
            <div *ngIf="activeMapCol === col.id" class="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
               <div class="rounded-[2.5rem] overflow-hidden border border-stone-100 shadow-2xl ring-4 ring-stone-900/5">
                  <app-harvest-map [vergerId]="col.vergerId"></app-harvest-map>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- OPERATIONAL RESULTS LEDGER MODAL -->
    <div *ngIf="showResultsTable && selectedResultsCollecte" class="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" (click)="showResultsTable = false"></div>
       <div class="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col border border-stone-100 animate-slide-up overflow-hidden">
          <header class="p-10 pb-6 border-b border-stone-50 shrink-0">
             <div class="flex justify-between items-start">
                <div>
                   <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] block mb-2 font-headline">Mission Intelligence</span>
                   <h3 class="text-3xl font-black text-on-surface font-headline tracking-tighter">{{ selectedResultsCollecte.vergerName }} Results Ledger</h3>
                   <p class="text-xs text-stone-400 font-medium mt-1">Update production metrics for any day of the campaign.</p>
                </div>
                <button (click)="showResultsTable = false" class="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-on-surface hover:bg-stone-100 transition-all">
                   <span class="material-symbols-outlined">close</span>
                </button>
             </div>
          </header>
          
          <div class="flex-grow overflow-y-auto p-10 pt-6 custom-scrollbar">
             <table class="w-full text-left">
                <thead>
                   <tr class="border-b border-stone-100">
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-headline">Mission Day</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center font-headline">Weight (KG)</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center font-headline">Trees Harvested</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right font-headline">Actions</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-stone-50">
                   <tr *ngFor="let day of missionDays" class="group hover:bg-stone-50/50 transition-colors">
                      <td class="py-6">
                         <div class="flex flex-col">
                            <span class="text-sm font-black text-on-surface">{{ day.date | date:'EEEE, MMM d' }}</span>
                            <span *ngIf="isToday(day.date)" class="text-[8px] font-black text-primary uppercase tracking-widest mt-1">Active Today</span>
                         </div>
                      </td>
                      <td class="py-6 text-center">
                         <input type="number" [(ngModel)]="day.weight" class="w-28 bg-stone-100 border-none rounded-xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-primary transition-all">
                      </td>
                      <td class="py-6 text-center">
                         <input type="number" [(ngModel)]="day.trees" class="w-28 bg-stone-100 border-none rounded-xl px-4 py-3 text-sm font-black text-center focus:ring-2 focus:ring-primary transition-all">
                      </td>
                      <td class="py-6 text-right">
                         <button (click)="saveDayResult(day)" [disabled]="loadingDay === day.date" 
                                 class="px-5 py-2.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-30 flex items-center gap-2 ml-auto shadow-lg">
                            <span *ngIf="loadingDay === day.date" class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></span>
                            {{ loadingDay === day.date ? 'Syncing' : 'Update Record' }}
                         </button>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>

          <footer class="p-8 border-t border-stone-50 bg-stone-50/30 flex justify-end shrink-0">
             <button (click)="showResultsTable=false" class="px-10 py-4 bg-white border border-stone-200 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-100 shadow-sm transition-all">Close Field Ledger</button>
          </footer>
       </div>
    </div>

    <!-- Crew Ledger Modal -->
    <div *ngIf="showCrewModal && selectedCrewCollecte" class="fixed inset-0 z-50 flex items-center justify-center p-4">
       <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" (click)="showCrewModal = false"></div>
       <div class="relative bg-white w-full max-w-4xl max-h-[85vh] rounded-[3rem] shadow-2xl flex flex-col border border-stone-100 animate-slide-up overflow-hidden">
          <header class="p-10 pb-6 border-b border-stone-50 shrink-0">
             <div class="flex justify-between items-start">
                <div>
                   <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] block mb-2 font-headline">Hired Personnel</span>
                   <h3 class="text-3xl font-black text-on-surface font-headline tracking-tighter">{{ selectedCrewCollecte.vergerName }} Crew Ledger</h3>
                   <p class="text-xs text-stone-400 font-medium mt-1 uppercase tracking-widest">Execute payments for completed worker sessions.</p>
                </div>
                <button (click)="showCrewModal = false" class="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 hover:text-on-surface hover:bg-stone-100 transition-all">
                   <span class="material-symbols-outlined">close</span>
                </button>
             </div>
          </header>
          
          <div class="flex-grow overflow-y-auto p-10 pt-6 custom-scrollbar">
             <div *ngIf="loadingCrew" class="py-20 flex flex-col items-center justify-center text-stone-300">
                <span class="material-symbols-outlined text-4xl animate-spin mb-4">revolving_dot</span>
                <p class="text-[9px] font-black uppercase tracking-widest">Accessing Ledger...</p>
             </div>
             
             <table *ngIf="!loadingCrew" class="w-full text-left">
                <thead>
                   <tr class="border-b border-stone-100">
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest font-headline">Worker</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center font-headline">Status</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center font-headline">Daily Salary</th>
                      <th class="py-4 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right font-headline">Payout</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-stone-50">
                   <tr *ngFor="let p of crewParticipations" class="group">
                      <td class="py-6">
                         <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 font-black text-xs">
                               {{ p.ouvrierName?.charAt(0) }}
                            </div>
                            <div class="flex flex-col">
                               <span class="text-sm font-black text-on-surface">{{ p.ouvrierName }}</span>
                               <span class="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{{ p.ouvrierEmail }}</span>
                            </div>
                         </div>
                      </td>
                      <td class="py-6 text-center">
                         <span class="px-3 py-1 bg-stone-100 text-[9px] font-black uppercase tracking-widest rounded-full text-stone-500">{{ p.status }}</span>
                      </td>
                      <td class="py-6 text-center">
                         <div class="flex items-center justify-center gap-2">
                            <input type="number" [(ngModel)]="p.dailySalary" class="w-24 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2 text-sm font-black text-center focus:outline-none focus:border-stone-400 transition-all">
                            <button (click)="syncSalary(p)" class="w-8 h-8 rounded-lg bg-stone-100 text-stone-400 hover:text-on-surface hover:bg-stone-200 transition-all flex items-center justify-center">
                               <span class="material-symbols-outlined text-sm">sync</span>
                            </button>
                         </div>
                      </td>
                      <td class="py-6 text-right">
                         <button *ngIf="!p.salaryPaid" (click)="payWorker(p)" 
                                 class="px-5 py-2.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                            Process Payout
                         </button>
                         <span *ngIf="p.salaryPaid" class="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-xl ml-auto w-fit">
                            <span class="material-symbols-outlined text-sm font-black">check_circle</span> Paid
                         </span>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>

          <footer class="p-8 bg-stone-50/50 border-t border-stone-100 flex justify-end">
             <button (click)="showCrewModal = false" class="px-8 py-3 bg-white border border-stone-200 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-stone-50 shadow-sm transition-all font-headline">Finished</button>
          </footer>
       </div>
    </div>
  `,
   styles: [`
    :host { display: block; }
  `]
})

export class DailyHarvestComponent implements OnInit {
   private collecteService = inject(CollecteService);
   private authService = inject(AuthService);
   private cdr = inject(ChangeDetectorRef);
   private dialogService = inject(DialogService);
   private participationService = inject(ParticipationService);
   private vergerService = inject(VergerService);

   activeCollectes: Collecte[] = [];
   vergers: Verger[] = [];
   loading = false;
   activeMapCol: string | null = null;

   // Results Ledger state
   showResultsTable = false;
   selectedResultsCollecte: Collecte | null = null;
   missionDays: any[] = [];
   loadingDay: string | null = null;

   // Crew Ledger state
   showCrewModal = false;
   selectedCrewCollecte: Collecte | null = null;
   crewParticipations: Participation[] = [];
   loadingCrew = false;

   ngOnInit() {
      this.loadActiveMissions();
      this.loadVergers();
   }

   loadVergers() {
      this.vergerService.getAllVergers().subscribe(data => {
         this.vergers = data || [];
         this.cdr.detectChanges();
      });
   }

   getVerger(id: string): Verger | undefined {
      return this.vergers.find(v => v.id === id);
   }

   loadActiveMissions() {
      this.loading = true;
      const uid = this.authService.currentUser()?.id;

      this.collecteService.getCollectes().subscribe({
         next: (data) => {
            // Show both PLANNED (ready to start) and en_cours (already active)
            this.activeCollectes = (data || []).filter(c => 
               c.chefUid === uid && (c.statut === 'en_cours' || c.statut === 'PLANNED')
            );
            this.loading = false;
            this.cdr.detectChanges();
         },
         error: () => this.loading = false
      });
   }

   needsDailyVerification(col: Collecte): boolean {
      const today = new Date().toISOString().split('T')[0];
      return col.lastVerificationDate !== today;
   }

   getChartData(col: Collecte) {
      if (!col.dailyReports || col.dailyReports.length === 0) return [];
      const reports = [...col.dailyReports].sort((a,b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()).slice(-7);
      const maxWeight = Math.max(...reports.map(r => r.weightKg || 0), 1);

      return reports.map((r, i) => {
         let dateLabel = `D${i + 1}`;
         if (r.date) {
            const d = new Date(r.date);
            dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
         }
         return {
            weightKg: r.weightKg || 0,
            percentage: Math.max(((r.weightKg || 0) / maxWeight) * 100, 5),
            dateLabel
         };
      });
   }

   getAggregateStats(col: Collecte) {
      if (!col.dailyReports) return { weight: 0, trees: 0 };
      return col.dailyReports.reduce((acc, curr) => ({
         weight: acc.weight + (curr.weightKg || 0),
         trees: acc.trees + (curr.treesHarvested || 0)
      }), { weight: 0, trees: 0 });
   }

   getTreeProgress(col: Collecte, verger: Verger): number {
      if (!verger.nombreArbres || verger.nombreArbres === 0) return 0;
      const harvested = this.getAggregateStats(col).trees;
      return Math.min(Math.round((harvested / verger.nombreArbres) * 100), 100);
   }

   verifyDay(col: Collecte) {
      if (!col.id) return;
      this.collecteService.verifyDay(col.id).subscribe({
         next: (updated) => {
            const idx = this.activeCollectes.findIndex(c => c.id === updated.id);
            if (idx >= 0) this.activeCollectes[idx] = updated;
            this.dialogService.alert("Day Validated", "Command protocol initialized for the day.", "success");
            this.cdr.detectChanges();
         },
         error: () => this.dialogService.alert("Protocol Error", "Failed to initiate daily session.", "danger")
      });
   }

   toggleMap(col: Collecte) {
      this.activeMapCol = (this.activeMapCol === col.id) ? null : col.id!;
   }

   // --- Results Ledger Logic ---
   openResultsLedger(col: Collecte) {
      this.selectedResultsCollecte = col;
      this.missionDays = this.generateMissionDays(col);
      this.showResultsTable = true;
   }

   generateMissionDays(col: Collecte): any[] {
      const days: any[] = [];
      const start = new Date(col.startDate!);
      // Generate from start date to today + 2 days (for planning)
      const end = new Date();
      end.setDate(end.getDate() + 2);

      const curr = new Date(start);
      while(curr <= end) {
         const dateStr = curr.toISOString().split('T')[0];
         const existing = col.dailyReports?.find(r => r.date === dateStr);
         days.push({
            date: dateStr,
            weight: existing?.weightKg || 0,
            trees: existing?.treesHarvested || 0,
            isSaved: !!existing
         });
         curr.setDate(curr.getDate() + 1);
      }
      return days.reverse(); // Newest first
   }

   isToday(date: string): boolean {
      return date === new Date().toISOString().split('T')[0];
   }

   saveDayResult(day: any) {
      if (!this.selectedResultsCollecte?.id) return;
      this.loadingDay = day.date;
      
      const payload = {
         date: day.date,
         weightKg: day.weight,
         treesHarvested: day.trees
      };

      this.collecteService.addDailyProgress(this.selectedResultsCollecte.id, payload).subscribe({
         next: (updated) => {
            const idx = this.activeCollectes.findIndex(c => c.id === updated.id);
            if (idx >= 0) {
               this.activeCollectes[idx] = updated;
               this.selectedResultsCollecte = updated;
            }
            day.isSaved = true;
            this.loadingDay = null;
            this.dialogService.alert("Record Updated", `Metrics for ${day.date} synchronized successfully.`, "success");
            this.cdr.detectChanges();
         },
         error: () => {
            this.loadingDay = null;
            this.dialogService.alert("Sync Error", "Failed to transmit data to central ledger.", "danger");
         }
      });
   }

   // --- Crew Ledger Interface ---
   openCrewLedger(col: Collecte) {
      if (!col.id) return;
      this.selectedCrewCollecte = col;
      this.showCrewModal = true;
      this.loadingCrew = true;
      this.crewParticipations = [];

      this.collecteService.getParticipations(col.id).subscribe({
         next: (parts) => {
            this.crewParticipations = parts.filter(p => p.status === 'ACCEPTED' || p.status === 'ASSIGNED');
            this.loadingCrew = false;
            this.cdr.detectChanges();
         },
         error: () => {
            this.dialogService.alert("Error", "Could not fetch crew ledger.", "danger");
            this.loadingCrew = false;
         }
      });
   }

   async payWorker(p: Participation) {
      if (!p.id) return;
      const confirm = await this.dialogService.confirm(
         "Execute Payment",
         `Authorize digital payout of ${p.dailySalary || 0} TND to ${p.ouvrierName}?`,
         "warning"
      );

      if (confirm) {
         this.participationService.payWorker(p.id).subscribe({
            next: () => {
               this.dialogService.alert("Payout Successful", `Payment triggered for ${p.ouvrierName}.`, "success");
               p.salaryPaid = true;
               this.cdr.detectChanges();
            },
            error: (err) => this.dialogService.alert("Payout Failed", err.error || "Payment processing error.", "danger")
         });
      }
   }

   syncSalary(p: Participation) {
      if (!p.id || p.dailySalary === undefined) return;
      this.participationService.updateSalary(p.id, p.dailySalary).subscribe({
         next: () => {
            this.dialogService.alert("Rate Synchronized", `Compensation for ${p.ouvrierName} updated to ${p.dailySalary} TND.`, "success");
            this.cdr.detectChanges();
         },
         error: () => this.dialogService.alert("Sync Error", "Failed to update compensation rate.", "danger")
      });
   }

   // --- Lifecycle Transitions ---

   async startMission(col: Collecte) {
      if (!col.id) return;
      const confirm = await this.dialogService.confirm(
         "Déployer la Campagne",
         `Êtes-vous prêt à commencer la récolte pour "${col.description}" ?`,
         "warning"
      );

      if (confirm) {
         this.collecteService.startCollecte(col.id).subscribe({
            next: () => {
               this.dialogService.alert("Mission Déployée", "La récolte est maintenant en cours. Les ouvriers ont été affectés.", "success");
               this.loadActiveMissions();
            },
            error: (err) => this.dialogService.alert("Erreur", err.error || "Échec du déploiement.", "danger")
         });
      }
   }

   async endMission(col: Collecte) {
      if (!col.id) return;
      const confirm = await this.dialogService.confirm(
         "Terminer la Mission",
         `Voulez-vous clôturer définitivement la récolte pour "${col.description}" ? Cette action libérera les ouvriers.`,
         "danger"
      );

      if (confirm) {
         this.collecteService.endCollecte(col.id).subscribe({
            next: () => {
               this.dialogService.alert("Mission Terminée", "La récolte a été clôturée avec succès.", "success");
               this.loadActiveMissions(); // This will remove it from the list as it's now 'termine'
            },
            error: (err) => this.dialogService.alert("Erreur", err.error || "Échec de la clôture.", "danger")
         });
      }
   }
}
