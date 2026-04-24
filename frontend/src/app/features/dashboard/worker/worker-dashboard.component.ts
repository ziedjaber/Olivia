import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipationService, Participation } from '../../../core/services/participation.service';

@Component({
  selector: 'app-ouvrier-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-6 pb-24 px-4 space-y-12">
      <!-- Minimalist Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Personnel Portal</span>
          <h1 class="text-5xl font-extrabold text-on-surface font-headline tracking-tighter leading-none">My Workday</h1>
          <p class="text-on-surface-variant font-medium mt-2 opacity-60 italic">Tracking your contribution to the heritage harvest.</p>
        </div>
        <div class="px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl flex items-center gap-4 shadow-sm">
           <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
             <span class="material-symbols-outlined">verified</span>
           </div>
           <div>
             <span class="text-[9px] font-black text-outline uppercase tracking-wider block">Status</span>
             <span class="text-xs font-black text-on-surface">Active Duty</span>
           </div>
        </div>
      </header>

      <!-- Personal Pulse (Statistics) -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group hover:scale-[1.02] transition-all">
           <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Total Yield</p>
           <h3 class="text-4xl font-black text-on-surface">2.4 <span class="text-sm font-medium text-outline">Tons</span></h3>
           <div class="mt-4 flex items-center gap-2">
              <span class="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12% vs LW</span>
           </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group hover:scale-[1.02] transition-all">
           <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Missions</p>
           <h3 class="text-4xl font-black text-on-surface">08</h3>
           <div class="mt-4 flex items-center gap-2">
              <span class="text-[10px] font-black text-outline opacity-40 uppercase tracking-widest">Completed in 2024</span>
           </div>
        </div>
        <div class="bg-[#1e1c12] p-6 rounded-[2rem] shadow-2xl group hover:scale-[1.02] transition-all overflow-hidden relative">
           <div class="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <p class="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4">Earnings Hub</p>
           <h3 class="text-4xl font-black text-white">840 <span class="text-sm font-medium text-white/40">TND</span></h3>
           <div class="mt-4 flex items-center gap-2">
              <span class="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Ready for payout</span>
           </div>
        </div>
        <div class="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm group hover:scale-[1.02] transition-all">
           <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Performance</p>
           <h3 class="text-4xl font-black text-on-surface">A+</h3>
           <div class="mt-4 flex items-center gap-2">
              <span class="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/5 rounded-full uppercase">Top 5% in Sector</span>
           </div>
        </div>
      </section>

      <!-- Worker Agenda Strip -->
      <section class="space-y-6">
        <h4 class="text-xs font-black text-outline uppercase tracking-[0.2em] flex items-center gap-3">
          <span class="material-symbols-outlined text-sm">event_available</span>
          My Work Agenda
        </h4>
        <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
           <div *ngFor="let day of getAgendaDays()" 
                class="flex-shrink-0 w-24 p-4 rounded-2xl border transition-all flex flex-col items-center gap-1"
                [ngClass]="day.isActive ? 'bg-primary text-white border-primary shadow-lg scale-105' : 'bg-white border-stone-100 text-on-surface'">
             <span class="text-[9px] font-black uppercase tracking-widest opacity-80">{{ day.dayName }}</span>
             <span class="text-2xl font-black">{{ day.dayNum }}</span>
             <span *ngIf="day.hasMission" class="text-[8px] font-black uppercase mt-1 px-2 py-0.5 rounded-full bg-black/20 text-white">Booked</span>
           </div>
        </div>
      </section>

      <!-- Mission Marketplace (Offers & Tasks) -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Table List (Main Content) -->
        <div class="lg:col-span-2 space-y-6">
           <div class="flex justify-between items-center px-2">
              <div>
                 <h4 class="text-2xl font-black font-headline text-on-surface">Available Deployments</h4>
                 <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mt-1">Review and manage your harvest offers</p>
              </div>
              <button (click)="loadParticipations()" class="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-outline hover:bg-stone-100 transition-all shadow-sm">
                <span class="material-symbols-outlined text-lg">sync</span>
              </button>
           </div>

           <div *ngIf="loading" class="text-center py-20 animate-pulse bg-white rounded-[2rem] border border-stone-100">
              <span class="material-symbols-outlined text-4xl text-stone-200">grid_view</span>
              <p class="text-xs font-black text-stone-300 uppercase tracking-widest mt-4">Syncing Mission Feed...</p>
           </div>

           <div *ngIf="!loading && participations.length === 0" class="py-24 text-center border-2 border-dashed border-stone-100 rounded-[3rem] bg-stone-50/30">
              <span class="material-symbols-outlined text-4xl text-stone-200 mb-4 block">notifications_none</span>
              <p class="text-on-surface-variant font-medium opacity-50 italic">No invitations or active missions found.</p>
              <p class="text-[10px] font-black text-outline uppercase tracking-widest mt-2">Wait for a Chef to recruit you.</p>
           </div>

           <div *ngIf="!loading && participations.length > 0" class="bg-white rounded-[2.5rem] border border-stone-100 shadow-sm overflow-hidden">
              <table class="w-full text-left">
                <thead>
                  <tr class="bg-stone-50/80 border-b border-stone-100">
                    <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Mission details</th>
                    <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Duration & Location</th>
                    <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Compensation</th>
                    <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest text-right">Action / Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-stone-100">
                  <tr *ngFor="let p of participations" 
                      class="hover:bg-stone-50/50 transition-all group"
                      [ngClass]="{'opacity-60 bg-stone-50': p.status === 'REJECTED' || p.status === 'COMPLETED'}">
                     
                     <td class="px-6 py-6 border-r border-dashed border-stone-100">
                        <div class="flex items-start gap-4">
                           <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                [ngClass]="{
                                  'bg-black text-white': p.status === 'INVITED',
                                  'bg-green-500 text-white': p.status === 'ACCEPTED' || p.status === 'ASSIGNED',
                                  'bg-stone-200 text-stone-400': p.status === 'REJECTED' || p.status === 'COMPLETED'
                                }">
                              <span class="material-symbols-outlined text-xl">
                                 {{ p.status === 'COMPLETED' ? 'task_alt' : (p.status === 'INVITED' ? 'mark_unread_chat_alt' : 'agriculture') }}
                              </span>
                           </div>
                           <div>
                              <p class="text-xs font-black text-on-surface mb-2">{{ p.collecteDescription }}</p>
                              <div class="flex items-center gap-2">
                                 <div class="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center text-outline">
                                    <span class="material-symbols-outlined text-[12px]">person</span>
                                 </div>
                                 <span class="text-[9px] font-black text-outline uppercase tracking-widest">{{ p.invitedByName }}</span>
                              </div>
                           </div>
                        </div>
                     </td>

                     <td class="px-6 py-6 border-r border-dashed border-stone-100">
                        <div class="space-y-3">
                           <div class="flex items-start gap-2">
                              <span class="material-symbols-outlined text-[14px] text-primary">location_on</span>
                              <div>
                                 <span class="block text-[10px] font-black text-on-surface uppercase tracking-wider">{{ p.collecteLocation || 'Location Pending' }}</span>
                                 <span class="text-[8px] text-outline font-bold tracking-widest uppercase">Orchard Name</span>
                              </div>
                           </div>
                           <div class="flex items-start gap-2">
                              <span class="material-symbols-outlined text-[14px] text-secondary">date_range</span>
                              <div>
                                 <span class="block text-[10px] font-black text-on-surface uppercase tracking-wider">
                                    {{ p.collecteDate | date:'MMM d' }} 
                                    <span *ngIf="p.collecteEndDate"> - {{ p.collecteEndDate | date:'MMM d' }}</span>
                                 </span>
                                 <span class="text-[8px] text-outline font-bold tracking-widest uppercase">Harvest Duration</span>
                              </div>
                           </div>
                        </div>
                     </td>

                     <td class="px-6 py-6 border-r border-dashed border-stone-100">
                        <div class="flex flex-col gap-1">
                           <span class="text-lg font-black text-on-surface">{{ p.dailySalary ? p.dailySalary : '---' }} <span class="text-[10px] text-outline">TND</span></span>
                           <span class="text-[8px] font-black text-outline uppercase tracking-[0.2em]">Offered Daily Rate</span>
                        </div>
                     </td>

                     <td class="px-6 py-6 text-right">
                        <div *ngIf="p.status === 'INVITED'" class="flex gap-2 justify-end">
                           <button (click)="reject(p)" class="px-4 py-2 bg-white border border-stone-200 text-stone-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-stone-50 transition-all active:scale-95 shadow-sm">Decline</button>
                           <button (click)="accept(p)" class="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-md hover:bg-stone-800 transition-all active:scale-95">Accept</button>
                        </div>
                        <div *ngIf="p.status !== 'INVITED'">
                           <span class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                 [ngClass]="{
                                    'bg-green-100 text-green-800 border border-green-200': p.status === 'ACCEPTED' || p.status === 'ASSIGNED',
                                    'bg-stone-100 text-stone-500 border border-stone-200': p.status === 'REJECTED' || p.status === 'COMPLETED'
                                 }">
                              {{ p.status }}
                           </span>
                        </div>
                     </td>

                  </tr>
                </tbody>
              </table>
           </div>
        </div>

        <!-- Career Protocol Sidebar (Side Element) -->
        <div class="space-y-6">
           <div class="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] flex flex-col items-center text-center shadow-sm">
              <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary shadow-sm mb-4">
                 <span class="material-symbols-outlined text-3xl">workspace_premium</span>
              </div>
              <h5 class="text-lg font-black text-on-surface mb-2">Top Tier Talent</h5>
              <p class="text-[10px] text-outline font-medium tracking-tight leading-relaxed mb-6">Your harvest accuracy is unmatched. Continue accepting missions to maintain your A+ sector ranking.</p>
              <button class="w-full py-3 bg-white text-primary font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm border border-primary/20">View Ranking Details</button>
           </div>

           <div class="bg-stone-50 border border-stone-100 p-8 rounded-[2.5rem] flex flex-col gap-4 shadow-sm">
              <div class="flex items-center gap-3 mb-2">
                 <span class="material-symbols-outlined text-stone-400">policy</span>
                 <h5 class="text-xs font-black text-on-surface uppercase tracking-widest">Safety Compliance</h5>
              </div>
              <p class="text-[10px] text-outline font-medium tracking-tight">Requirement: Certified protective equipment must be worn at all times during harvest operations. Failure to comply can result in mission expulsion.</p>
           </div>
        </div>

      </section>
    </div>
  `,
  styles: [`
    :host { display: block; animation: fade-in 0.8s ease-out; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class OuvrierDashboardComponent implements OnInit {
  private participationService = inject(ParticipationService);
  private cdr = inject(ChangeDetectorRef);
  participations: Participation[] = [];
  loading = false;

  getAgendaDays() {
     // A simple dynamic calendar for the next 7 days indicating if worker is booked
     const days = [];
     const today = new Date();
     
     for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        
        // Checking if worker is "Booked" on this day based on accepted/assigned missions
        const isBooked = this.participations.some(p => {
           if (p.status !== 'ACCEPTED' && p.status !== 'ASSIGNED') return false;
           // If we have both start and end dates
           if (p.collecteDate && p.collecteEndDate) {
              const start = new Date(p.collecteDate as string);
              const end = new Date(p.collecteEndDate as string);
              // Normalize times to midnight for comparison
              start.setHours(0,0,0,0);
              end.setHours(0,0,0,0);
              const currentDate = new Date(d);
              currentDate.setHours(0,0,0,0);
              return currentDate >= start && currentDate <= end;
           } else if (p.collecteDate) {
              const start = new Date(p.collecteDate as string);
              return start.toDateString() === d.toDateString();
           }
           return false;
        });

        days.push({
           dayNum: d.getDate(),
           dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
           isActive: isBooked,
           hasMission: isBooked
        });
     }
     return days;
  }

  ngOnInit() {
    this.loadParticipations();
  }

  loadParticipations() {
    this.loading = true;
    this.participationService.getMyParticipations().subscribe({
      next: (data) => {
        this.participations = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  accept(p: Participation) {
    if (!p.id) return;
    this.participationService.acceptInvitation(p.id).subscribe({
      next: () => this.loadParticipations(),
      error: (err) => alert(err.error || 'Failed to accept invitation')
    });
  }

  reject(p: Participation) {
    if (!p.id) return;
    this.participationService.rejectInvitation(p.id).subscribe({
      next: () => this.loadParticipations(),
      error: (err) => alert(err.error || 'Failed to reject invitation')
    });
  }
}
