import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ParticipationService } from '../../../core/services/participation.service';
import { ToastService } from '../../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-worker-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
      <!-- Premium Hero Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="w-8 h-[2px] bg-primary"></span>
            <span class="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Recruitment Hub</span>
          </div>
          <h1 class="text-6xl font-black text-on-surface font-headline tracking-tighter leading-none">
            Harvester <span class="text-primary italic">Personnel</span>
          </h1>
          <p class="text-on-surface-variant font-medium mt-4 text-lg max-w-xl opacity-70 leading-relaxed font-sans">
            Optimized workforce management for the olive season. Select a mission below to begin recruitment.
          </p>
        </div>
        
        <div class="flex flex-col items-end gap-4">
           <div class="bg-white/40 backdrop-blur-xl px-8 py-5 rounded-[2rem] border border-white shadow-2xl flex items-center gap-6 ring-1 ring-black/5 hover:ring-primary/20 transition-all duration-500">
              <div class="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <span class="material-symbols-outlined text-2xl">group_add</span>
              </div>
              <div class="pr-4">
                <span class="text-[10px] font-black text-outline uppercase tracking-widest block opacity-50">Global Availability</span>
                <span class="text-2xl font-black text-on-surface tracking-tight">{{ filteredWorkers.length }} Verified Staff</span>
              </div>
           </div>
        </div>
      </header>

      <!-- Contextual Controls Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <!-- GLOBAL MISSION CONTEXT CARD -->
        <div class="lg:col-span-12 xl:col-span-5 bg-[#0f0e0a] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5 min-h-[400px] flex flex-col justify-between">
           <div class="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -mr-32 -mt-32"></div>
           
           <div class="relative z-10 space-y-8">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-xl">target</span>
                  </div>
                  <h4 class="text-xs font-black text-white/90 uppercase tracking-[0.3em]">Mission Deployment</h4>
                </div>
                <span class="px-3 py-1 bg-primary/10 text-primary rounded-full text-[8px] font-black uppercase tracking-widest border border-primary/20">Active Session</span>
              </div>

              <div class="relative group/select">
                <label class="block text-[9px] font-black text-white/40 uppercase tracking-widest mb-3 ml-1">Select Target Harvest Mission</label>
                <div class="relative">
                  <select [(ngModel)]="selectedMissionId" 
                          (change)="onMissionChange()"
                          class="w-full bg-white/5 border-2 border-white/10 rounded-[1.5rem] py-5 px-8 text-sm font-bold text-white appearance-none outline-none focus:border-primary/50 focus:bg-white/10 transition-all cursor-pointer shadow-inner">
                    <option value="" class="bg-[#0f0e0a]">Currently unassigned...</option>
                    <option *ngFor="let m of activeMissions" [value]="m.id" class="bg-[#0f0e0a]">
                      {{ m.description }}
                    </option>
                  </select>
                  <div class="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover/select:text-primary transition-colors">
                    <span class="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              <!-- Selection Summary (Conditionally Rendered) -->
              <div *ngIf="selectedMission" class="bg-white/5 rounded-[2rem] p-6 border border-white/5 animate-fade-in space-y-4">
                 <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1">
                       <span class="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Deployment Site</span>
                       <span class="block text-xs font-bold text-white truncate">{{ selectedMission.vergerName }}</span>
                    </div>
                    <div class="space-y-1">
                       <span class="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Target Yield</span>
                       <span class="block text-xs font-bold text-white truncate">{{ selectedMission.numberOfWorkers || 10 }} Harvesters</span>
                    </div>
                 </div>
                 <div class="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                       <span class="material-symbols-outlined text-sm text-primary">event_note</span>
                       <span class="text-[10px] font-bold text-white/60 uppercase">Starts {{ selectedMission.startDate | date:'MMM d, y' }}</span>
                    </div>
                    <span class="text-[9px] font-black text-primary italic uppercase">{{ selectedMission.type }}</span>
                 </div>
              </div>

              <p *ngIf="!selectedMissionId" class="text-[10px] font-medium text-white/30 leading-relaxed italic border-l-2 border-primary/50 pl-4 py-1">
                 You must select an active mission context before you can invite workers to the field.
              </p>
           </div>
        </div>

        <!-- ENHANCED SEARCH & FILTERS -->
        <div class="lg:col-span-12 xl:col-span-7 bg-white p-10 rounded-[3.5rem] border border-stone-100 shadow-sm flex flex-col justify-between space-y-8">
            <div class="space-y-2">
              <h4 class="text-xs font-black text-on-surface uppercase tracking-[0.3em] opacity-40 italic">Search & Filter</h4>
              <div class="relative w-full">
                <span class="material-symbols-outlined absolute left-8 top-1/2 -translate-y-1/2 text-primary text-2xl opacity-40">search</span>
                <input type="text" [(ngModel)]="searchQuery" (input)="filterWorkers()" placeholder="Find harvesters by name, email or skills..." 
                       class="w-full pl-20 pr-10 py-7 bg-stone-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-stone-100 shadow-inner transition-all font-black text-lg placeholder:text-stone-300">
              </div>
            </div>
            
            <div class="flex flex-wrap gap-4">
               <button class="px-8 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3">
                  <span class="material-symbols-outlined text-sm">filter_list</span>
                  Show Available Only
               </button>
               <button class="px-8 py-4 bg-stone-50 border border-stone-100 text-on-surface/60 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                  <span class="material-symbols-outlined text-sm">history</span>
                  Recent Collaborators
               </button>
            </div>
        </div>
      </div>

      <!-- Workers Table - Premium Desktop Variant -->
      <div class="bg-white rounded-[4rem] border border-stone-100 shadow-2xl overflow-hidden ring-1 ring-black/5 animate-fade-in-up">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-stone-50/50 border-b border-stone-100">
              <th class="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-widest opacity-60">Personnel Info</th>
              <th class="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-widest text-center opacity-60">Status</th>
              <th class="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-widest opacity-60">Daily Compensation</th>
              <th class="px-10 py-8 text-[11px] font-black text-outline uppercase tracking-widest text-right opacity-60">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-50">
            <tr *ngFor="let worker of filteredWorkers" class="hover:bg-primary/[0.02] transition-all group/row">
              <td class="px-10 py-10">
                <div class="flex items-center gap-6">
                  <div class="relative">
                    <div class="w-16 h-16 rounded-[1.5rem] bg-stone-100 text-on-surface flex items-center justify-center font-black text-xl uppercase shadow-inner group-hover/row:bg-primary group-hover/row:text-white group-hover/row:rotate-6 transition-all duration-500">
                      {{ worker.fullName.charAt(0) }}
                    </div>
                    <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center" [ngClass]="isWorkerBusy(worker.id) ? 'bg-amber-500' : 'bg-green-500'"></div>
                  </div>
                  <div>
                    <span class="block text-xl font-black text-on-surface tracking-tight leading-none mb-1">{{ worker.fullName }}</span>
                    <span class="text-[11px] font-bold text-outline uppercase tracking-widest opacity-40">{{ worker.email }}</span>
                  </div>
                </div>
              </td>
              <td class="px-10 py-10 text-center">
                 <div class="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-stone-100 bg-stone-50/50 group-hover/row:border-primary/20 transition-all">
                    <span class="text-[10px] font-black uppercase tracking-widest" [ngClass]="isWorkerBusy(worker.id) ? 'text-amber-700' : 'text-green-700'">
                       {{ isWorkerBusy(worker.id) ? 'Deployed' : 'On Standby' }}
                    </span>
                 </div>
              </td>
              <td class="px-10 py-10">
                 <div class="relative max-w-[180px] group/input">
                    <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-1">
                      <span class="text-on-surface font-black text-lg opacity-20">$</span>
                    </div>
                    <input type="number" [(ngModel)]="salaryInputs[worker.id]" 
                           [disabled]="isWorkerBusy(worker.id)"
                           placeholder="0.00" 
                           class="w-full bg-stone-50 border-b-2 border-stone-200 py-3 pl-6 pr-12 font-black text-xl outline-none focus:border-primary focus:bg-primary/[0.03] transition-all placeholder:text-stone-200 disabled:opacity-20">
                    <span class="absolute right-0 top-1/2 -translate-y-1/2 text-[9px] font-black text-outline uppercase tracking-widest opacity-40">TND/DAY</span>
                 </div>
              </td>
              <td class="px-10 py-10 text-right">
                <button (click)="sendOffer(worker)" 
                        [disabled]="!selectedMissionId || isWorkerBusy(worker.id)"
                        class="h-14 px-10 bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:shadow-primary/20 hover:bg-primary transition-all active:scale-95 flex items-center gap-4 ml-auto disabled:opacity-5 disabled:cursor-not-allowed">
                  <span class="material-symbols-outlined text-xl">ios_share</span>
                  Invite to Field
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State Premium -->
        <div *ngIf="filteredWorkers.length === 0" class="py-40 text-center space-y-6">
           <div class="w-32 h-32 rounded-[2.5rem] bg-stone-50 border border-stone-100 flex items-center justify-center mx-auto shadow-inner text-stone-200 rotate-12">
              <span class="material-symbols-outlined text-6xl">person_off</span>
           </div>
           <div>
              <h4 class="text-xl font-black text-on-surface uppercase tracking-widest">Database Clean</h4>
              <p class="text-sm font-medium text-outline opacity-50 italic">No matches discovered for "{{ searchQuery }}"</p>
           </div>
           <button (click)="searchQuery = ''; filterWorkers()" class="text-[10px] font-black text-primary uppercase tracking-widest underline underline-offset-8 decoration-2">Clear Parameters</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fffdfa; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fade-in-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-fade-in-up { animation: fade-in-up 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    
    select { 
      background-image: none !important; 
    }
    
    .custom-scrollbar::-webkit-scrollbar { height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 20px; }

    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
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

  allWorkers: User[] = [];
  filteredWorkers: User[] = [];
  busyWorkerIds: Set<string> = new Set();
  searchQuery: string = '';

  activeMissions: Collecte[] = [];
  selectedMissionId: string = '';
  selectedMission: Collecte | null = null;
  salaryInputs: { [uid: string]: number } = {};
  private router = inject(Router);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const user = this.authService.currentUser();
    const currentUid = user?.id;
    console.log('[WorkerDir] Loading. UID:', currentUid);

    if (!currentUid) {
      console.warn('[WorkerDir] No UID — redirecting to login.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allWorkers = users.filter(u => u.role === 'OUVRIER_RECOLTE');
        this.filterWorkers();
        this.cdr.detectChanges();
      },
      error: (e) => console.error('[WorkerDir] Failed to load users:', e)
    });

    this.participationService.getActiveParticipations().subscribe({
      next: (active) => {
        this.busyWorkerIds = new Set(active.map(p => p.ouvrierUid));
        this.cdr.detectChanges();
      },
      error: (e) => console.error('[WorkerDir] Failed to load participations:', e)
    });

    this.collecteService.getCollectes().subscribe({
      next: (data) => {
        console.log('[WorkerDir] All collectes from backend:', data.length);
        
        // ROBUST FILTER: Matches by UID (Primary) OR Full Name (Recovery fallback)
        this.activeMissions = data.filter(c => {
          const isNotTerminated = c.statut !== 'termine' && c.statut !== 'TERMINATED';
          const matchesUid = c.chefUid === currentUid;
          const matchesName = c.chefName?.toLowerCase() === user.fullName?.toLowerCase();
          
          return isNotTerminated && (matchesUid || matchesName);
        });

        console.log('[WorkerDir] Displaying', this.activeMissions.length, 'missions for', user.fullName);

        if (this.activeMissions.length > 0 && !this.selectedMissionId) {
          this.selectedMissionId = this.activeMissions[0].id || '';
          this.onMissionChange();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[WorkerDir] MISSION_LOAD_FAILED:', err);
        this.activeMissions = [];
        this.toastService.show('Failed to load missions.', 'error');
      }
    });
  }

  onMissionChange() {
    this.selectedMission = this.activeMissions.find(m => m.id === this.selectedMissionId) || null;
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
  }

  isWorkerBusy(uid: string): boolean {
    return this.busyWorkerIds.has(uid);
  }

  sendOffer(worker: User) {
    if (!this.selectedMissionId) {
      this.toastService.show("Please select an active mission first.", "error");
      return;
    }
    const salary = this.salaryInputs[worker.id];
    if (!salary || salary <= 0) {
      this.toastService.show("Please enter a valid daily compensation rate.", "error");
      return;
    }

    this.collecteService.inviteOuvrier(this.selectedMissionId, worker.id, salary).subscribe({
      next: () => {
        this.toastService.show(`Offer successfully sent to ${worker.fullName}`, "success");
        this.salaryInputs[worker.id] = 0;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toastService.show(err.error || "Failed to send work proposition.", "error");
      }
    });
  }
}
