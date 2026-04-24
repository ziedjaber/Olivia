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
}

interface LogisticResource {
  id: string;
  name: string;
  type: string;
  stockLevel: number;
}

@Component({
  selector: 'app-harvest-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Premium Header Section -->
      <header class="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-3 opacity-80" style="font-family: Manrope, sans-serif;">
            <span class="w-8 h-[2px] bg-primary rounded-full"></span>
            Operational Center
          </div>
          <h1 class="text-5xl font-black text-on-surface font-headline tracking-tighter mb-2" style="font-family: Manrope, sans-serif;">
            Harvest <span class="text-primary italic">Planning</span>
          </h1>
          <p class="text-on-surface-variant text-sm font-medium leading-relaxed max-w-md">Strategize and deploy precision harvest missions across mature estate vergers with real-time sync.</p>
        </div>
        <button (click)="showCreateModal = true" 
                class="group bg-primary text-on-primary px-8 py-4 font-black rounded-2xl shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.4)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
          <span class="material-symbols-outlined group-hover:rotate-12 transition-transform">add_task</span>
          Deploy Mission
        </button>
      </header>

      <!-- Active Planning View -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Main Content: Mission Pipeline -->
        <div class="lg:col-span-8 space-y-8">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-2xl font-black font-headline flex items-center gap-3 text-on-surface" style="font-family: Manrope, sans-serif;">
              <span class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <span class="material-symbols-outlined text-[24px]">explore</span>
              </span>
              Active Pipeline
            </h2>
            <div class="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/10">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span class="text-[10px] font-black uppercase text-outline tracking-wider">{{ collectes.length }} Missions Tracks</span>
            </div>
          </div>
          
          <div class="space-y-6">
            <div *ngFor="let c of collectes" 
                 class="group bg-surface shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[2rem] border border-outline-variant/5 overflow-hidden transition-all duration-500 hover:-translate-y-1">
              <div class="flex">
                <!-- Status Bar -->
                <div class="w-2 self-stretch transition-all duration-500 group-hover:w-3"
                     [ngClass]="{
                       'bg-primary/20': c.statut === 'PLANNED',
                       'bg-secondary/40': c.statut === 'RESOURCES_VALIDATED',
                       'bg-primary': c.statut === 'en_cours',
                       'bg-green-500': c.statut === 'termine'
                     }"></div>
                
                <div class="flex-grow p-8">
                  <div class="flex justify-between items-start mb-6">
                    <div>
                      <h3 class="font-black text-2xl text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors" style="font-family: Manrope, sans-serif;">{{ c.description }}</h3>
                      <div class="flex items-center gap-3">
                        <span class="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-[10px] font-black uppercase tracking-widest text-outline">
                          <span class="material-symbols-outlined text-[14px]">yard</span>
                          {{ c.vergerName || c.vergerId }}
                        </span>
                        <span class="flex items-center gap-1.5 px-3 py-1 bg-primary/5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                          <span class="material-symbols-outlined text-[14px]">person</span>
                          {{ c.chefName }}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-2">
                       <span class="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border"
                             [ngClass]="{
                               'bg-primary/10 text-primary border-primary/20': c.statut === 'PLANNED',
                               'bg-secondary/10 text-secondary border-secondary/20': c.statut === 'RESOURCES_VALIDATED',
                               'bg-primary text-on-primary border-transparent shadow-lg': c.statut === 'en_cours',
                               'bg-green-100 text-green-800 border-green-200': c.statut === 'termine'
                             }">
                        {{ c.statut === 'PLANNED' ? 'Pending Logistics' : c.statut }}
                      </span>
                    </div>
                  </div>

                  <!-- Metadata Grid -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-outline-variant/10 my-6 bg-surface-container-lowest/50 rounded-2xl px-6">
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-1">Crew Allocation</span>
                      <div class="flex items-center gap-2 text-on-surface">
                        <span class="material-symbols-outlined text-[18px] text-primary/60">groups</span>
                        <span class="text-sm font-black">{{ c.numberOfWorkers }} Workers</span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-1">Window Start</span>
                      <div class="flex items-center gap-2 text-on-surface">
                        <span class="material-symbols-outlined text-[18px] text-primary/60">calendar_today</span>
                        <span class="text-sm font-black">{{ c.startDate | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-1">Target End</span>
                      <div class="flex items-center gap-2 text-on-surface">
                        <span class="material-symbols-outlined text-[18px] text-primary/60">event_upcoming</span>
                        <span class="text-sm font-black">{{ c.endDate | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col gap-1">
                      <span class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-1">Risk Profile</span>
                      <div class="flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                        <span class="text-xs font-black text-on-surface uppercase tracking-widest">Minimal</span>
                      </div>
                    </div>
                  </div>

                  <div class="mt-6 flex justify-between items-center">
                    <div class="flex -space-x-3 overflow-hidden p-1">
                       <div *ngFor="let i of [1,2,3]" class="inline-block h-8 w-8 rounded-full ring-4 ring-surface bg-surface-container-high flex items-center justify-center text-[10px] font-black text-outline">
                         {{ i === 3 ? '+' + ((c.numberOfWorkers ?? 0) > 2 ? (c.numberOfWorkers! - 2) : 0) : 'W' + i }}
                      </div>
                    </div>
                    <button class="text-xs font-black text-primary hover:bg-primary/10 px-6 py-2.5 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 border border-primary/20">
                      <span class="material-symbols-outlined text-[16px]">visibility</span>
                      Intelligence Hub
                    </button>
                    <!-- Small Resource Chips if any -->
                    <div *ngIf="c.requiredResources && c.requiredResources.length > 0" class="flex flex-wrap gap-2">
                       <span *ngFor="let r of (c.requiredResources).slice(0, 2)" class="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold text-on-surface-variant flex items-center gap-1 border border-outline-variant/10">
                         <span class="material-symbols-outlined text-[12px]">handyman</span>
                         {{ r.quantity }}x {{ r.resourceName }}
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="collectes.length === 0" class="group relative py-24 bg-surface-container-lowest rounded-[3.5rem] border border-outline-variant/10 shadow-[inner_0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center overflow-hidden transition-all duration-700">
              <div class="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div class="w-24 h-24 rounded-[2rem] bg-surface-container-low flex items-center justify-center mb-8 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary/10">
                <span class="material-symbols-outlined text-primary/40 text-5xl transition-colors group-hover:text-primary/60">agriculture</span>
              </div>
              <h4 class="text-on-surface font-black text-2xl mb-3 tracking-tighter" style="font-family: Manrope, sans-serif;">Estate Pipeline <span class="text-primary/40">Inactive</span></h4>
              <p class="text-on-surface-variant text-sm font-medium max-w-[280px] text-center leading-relaxed opacity-60">Your harvest schedule is currently clear. Deploy a new campaign to mobilize field teams.</p>
              
              <button (click)="showCreateModal = true" class="mt-10 px-8 py-3 bg-surface border border-outline-variant/10 text-primary font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-on-primary hover:border-transparent transition-all shadow-sm">
                Initialize Mission
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side: Readiness Monitor Sidebar -->
        <div class="lg:col-span-4 space-y-8">
          <div class="bg-surface-container-low rounded-[2.5rem] p-10 sticky top-28 border border-outline-variant/10 shadow-xl overflow-hidden group">
            <!-- Decorative Glow -->
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-1000"></div>
            
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-10">
                <div>
                  <h2 class="text-2xl font-black font-headline tracking-tighter text-on-surface" style="font-family: Manrope, sans-serif;">Readiness <span class="text-primary italic">Monitor</span></h2>
                  <p class="text-[10px] font-black text-outline uppercase tracking-[0.25em] mt-1">Live Estate Telemetry</p>
                </div>
                <div class="w-12 h-12 rounded-[1.25rem] bg-surface flex items-center justify-center text-primary shadow-sm border border-outline-variant/10">
                  <span class="material-symbols-outlined animate-spin-slow">cyclone</span>
                </div>
              </div>

              <div class="space-y-6">
                <!-- Verger List -->
                <div *ngFor="let v of eligibleVergers" 
                     class="p-6 bg-surface rounded-3xl border border-outline-variant/15 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 transform hover:scale-[1.02]">
                  <div class="flex justify-between items-start mb-4">
                    <div>
                      <span class="text-xs font-black text-on-surface tracking-tight block mb-1">{{ v.nom }}</span>
                      <span class="text-[9px] font-black text-outline uppercase tracking-widest bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Optimal Maturity</span>
                    </div>
                    <span class="text-xl font-black text-emerald-500 tracking-tighter">100<span class="text-xs uppercase ml-0.5 opacity-60 text-outline-variant">%</span></span>
                  </div>
                  <div class="relative h-2 w-full bg-surface-container rounded-full overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.3)] rounded-full w-full"></div>
                  </div>
                  <div class="mt-4 flex justify-between items-center">
                    <div class="flex items-center gap-1.5 text-outline">
                       <span class="material-symbols-outlined text-[14px]">wb_sunny</span>
                       <span class="text-[9px] font-bold uppercase">Sensor ID: ST-{{ v.id.slice(0,4) }}</span>
                    </div>
                    <button class="w-6 h-6 rounded-full bg-surface-container text-outline hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center">
                       <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                <div *ngIf="eligibleVergers.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
                  <div class="w-16 h-16 rounded-full bg-surface mb-4 flex items-center justify-center border border-outline-variant/5">
                    <span class="material-symbols-outlined text-outline/30 text-3xl">cloud_sync</span>
                  </div>
                  <p class="text-[10px] font-bold text-outline uppercase tracking-widest">Scanning Sensors...</p>
                  <p class="text-xs text-outline-variant mt-2 font-medium italic">No vergers finalized at 100% maturity. Real-time updates active.</p>
                </div>
              </div>

              <div class="mt-12 pt-8 border-t border-outline-variant/10 text-center">
                <p class="text-[10px] text-outline font-black uppercase tracking-[0.2em] leading-relaxed mb-6">Autonomous Trigger Enabled</p>
                <div class="inline-flex items-center gap-4 bg-surface p-2 rounded-2xl border border-outline-variant/10 shadow-sm">
                   <div class="flex items-center gap-2 pl-4">
                      <span class="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                      <span class="text-[9px] font-black text-on-surface uppercase tracking-widest">Live Syncing</span>
                   </div>
                   <div class="h-6 w-[1px] bg-outline-variant/10"></div>
                   <button class="bg-primary/5 hover:bg-primary/10 text-primary text-[10px] font-black px-4 py-2 rounded-xl transition-all uppercase tracking-widest">Refresh Now</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODERN CREATE COLLECTE MODAL -->
    <div *ngIf="showCreateModal" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div class="bg-surface w-full max-w-2xl max-h-[92vh] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border border-white/5 animate-in slide-in-from-bottom-12 duration-700">
        <!-- Close Button (Absolute) -->
        <button (click)="closeCreateModal()" class="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white z-20 overflow-hidden group">
            <span class="material-symbols-outlined text-2xl group-hover:rotate-90 transition-transform duration-300">close</span>
            <div class="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>

        <div class="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>

        <div class="p-12 border-b border-outline-variant/10 relative">
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">
            <span class="w-6 h-0.5 bg-primary"></span>
            Mission Architecture
          </div>
          <h3 class="text-4xl font-black text-on-surface font-headline tracking-tighter" style="font-family: Manrope, sans-serif;">Deploy Harvest <span class="text-primary italic">Mission</span></h3>
          <p class="text-sm text-on-surface-variant font-medium mt-2 max-w-md">Configure critical parameters to authorize a precision harvest campaign across your estate.</p>
        </div>
        
        <div class="p-12 overflow-y-auto custom-scrollbar flex-grow space-y-12 relative z-10">
           <!-- Section 1: Core Identity -->
           <div class="space-y-6">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">id_card</span>
                </div>
                <h4 class="text-lg font-black text-on-surface tracking-tight uppercase tracking-widest text-sm">Core Parameters</h4>
              </div>
              
              <div class="space-y-4">
                 <div class="group">
                    <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1 group-focus-within:text-primary transition-colors">Mission Nomenclature</label>
                    <div class="relative">
                      <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] group-focus-within:text-primary transition-colors">edit_note</span>
                      <input [(ngModel)]="newCollecte.description" 
                             class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-surface rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" 
                             placeholder="e.g. Ridge Sector Chemlali 2024">
                    </div>
                 </div>
                 
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div class="group">
                      <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1">Target Mature Verger</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] group-focus-within:text-primary transition-colors">yard</span>
                        <select [(ngModel)]="newCollecte.vergerId" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-surface rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner appearance-none">
                          <option [value]="null">Select Verified Estate</option>
                          <option *ngFor="let v of eligibleVergers" [value]="v.id">{{ v.nom }} (Ready)</option>
                        </select>
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                      </div>
                   </div>
                   <div class="group">
                      <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1">Operational Lead</label>
                      <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] group-focus-within:text-primary transition-colors">person</span>
                        <select [(ngModel)]="newCollecte.chefUid" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-surface rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner appearance-none">
                          <option [value]="null">Assign Campaign Lead</option>
                          <option *ngFor="let c of chefs" [value]="c.id">{{ c.fullName }}</option>
                        </select>
                        <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">expand_more</span>
                      </div>
                   </div>
                 </div>
              </div>
           </div>

           <!-- Section 2: Scheduling & Crew -->
           <div class="space-y-6 pt-10 border-t border-outline-variant/10">
              <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[20px]">calendar_month</span>
                </div>
                <h4 class="text-lg font-black text-on-surface tracking-tight uppercase tracking-widest text-sm">Deployment Logistics</h4>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1">Start Threshold</label>
                  <input type="date" [(ngModel)]="newCollecte.startDate" class="w-full bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 focus:border-primary/40 focus:bg-surface rounded-2xl px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner">
                </div>
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1">Expected Completion</label>
                  <input type="date" [(ngModel)]="newCollecte.endDate" class="w-full bg-surface-container-low border border-outline-variant/10 hover:border-primary/20 focus:border-primary/40 focus:bg-surface rounded-2xl px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner">
                </div>
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3 ml-1">Workforce Quota</label>
                  <div class="relative">
                    <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] group-focus-within:text-primary transition-colors">groups</span>
                    <input type="number" [(ngModel)]="newCollecte.numberOfWorkers" 
                           class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-surface rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-on-surface outline-none transition-all shadow-inner">
                  </div>
                </div>
              </div>
           </div>

           <!-- Warning / Info Alert -->
           <div class="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex gap-4">
              <span class="material-symbols-outlined text-primary">verified_user</span>
              <div>
                <p class="text-xs font-black text-on-surface leading-tight mb-1">Authorization Protocol</p>
                <p class="text-[10px] font-medium text-on-surface-variant leading-relaxed">This mission will be staged for logistics validation before field teams are mobilized. High-priority mission triggers are active.</p>
              </div>
           </div>
        </div>

        <!-- Modern Footer Footer -->
        <div class="p-10 border-t border-outline-variant/10 flex justify-end items-center gap-6 bg-surface-container-lowest/50 backdrop-blur-xl">
           <button (click)="closeCreateModal()" class="px-8 py-3 font-black text-[10px] text-outline hover:text-on-surface transition-all tracking-widest uppercase">Discard Changes</button>
           <button (click)="submitCollecte()" 
                   class="relative overflow-hidden px-12 py-4 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] hover:shadow-primary/40 hover:-translate-y-1 hover:scale-105 active:scale-100 transition-all tracking-[0.2em] uppercase group">
                <span class="relative z-10 transition-colors group-hover:text-white">Deploy Campaign</span>
                <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
           </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-spin-slow { animation: spin 8s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { 
      background: rgba(var(--primary-rgb), 0.1); 
      border-radius: 10px; 
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(var(--primary-rgb), 0.2); }
  `]
})
export class HarvestPlanningComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  collectes: Collecte[] = [];
  chefs: User[] = [];
  eligibleVergers: Verger[] = [];
  availableResources: LogisticResource[] = [];

  showCreateModal = false;
  newCollecte: Partial<Collecte> = { type: 'planifiee', numberOfWorkers: 5 };
  reqResources: { resourceId: string, resourceName: string, quantity: number }[] = [];

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
       this.eligibleVergers = v.filter(verger => verger.niveauMaturite >= 100);
       this.cdr.detectChanges();
    });
    this.http.get<LogisticResource[]>('http://localhost:8080/api/logistics').subscribe(r => {
       this.availableResources = r;
       this.cdr.detectChanges();
    });
  }

  addResourceReq() {
    this.reqResources.push({ resourceId: '', resourceName: '', quantity: 1 });
  }

  removeResourceReq(index: number) {
    this.reqResources.splice(index, 1);
  }

  onResourceSelect(req: any) {
     const r = this.availableResources.find(x => x.id === req.resourceId);
     if (r) req.resourceName = r.name;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newCollecte = { type: 'planifiee', numberOfWorkers: 5 };
  }

  submitCollecte() {
    if (!this.newCollecte.description || !this.newCollecte.vergerId || !this.newCollecte.chefUid) {
      alert("Please ensure Mission Title, Verger, and Chef are properly specified.");
      return;
    }
    
    const chefObj = this.chefs.find(c => c.id === this.newCollecte.chefUid);
    const vergerObj = this.eligibleVergers.find(v => v.id === this.newCollecte.vergerId);

    const payload: Collecte = {
      ...this.newCollecte,
      chefName: chefObj?.fullName,
      vergerName: vergerObj?.nom,
      requiredResources: []
    } as Collecte;

    this.collecteService.createCollecte(payload).subscribe({
       next: () => {
         this.closeCreateModal();
         this.loadData();
       },
       error: (err) => alert("Mission deployment failed: " + (err.error || err.message))
    });
  }
}
