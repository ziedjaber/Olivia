import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipationService, Participation } from '../../../core/services/participation.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-worker-earnings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      <!-- Premium Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div>
          <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.4em] mb-2 block">Personal Finance</span>
          <h1 class="text-4xl font-black text-[#1e1c12] font-headline tracking-tighter">My <span class="text-[#3e5219] italic">Earnings</span></h1>
          <p class="text-stone-500 font-medium mt-1 opacity-60">Track your mission payouts and financial history.</p>
        </div>
        
        <div class="flex gap-4">
           <div class="bg-white/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-stone-100 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-2xl bg-[#3e5219]/10 flex items-center justify-center text-[#3e5219] shadow-inner">
                <span class="material-symbols-outlined text-2xl font-black">payments</span>
              </div>
              <div>
                <span class="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Total Earned</span>
                <span class="text-xl font-black text-[#1e1c12]">{{ totalEarned }} TND</span>
              </div>
           </div>
        </div>
      </header>

      <!-- Earnings Content -->
      <div *ngIf="loading" class="py-20 flex flex-col items-center justify-center text-stone-300 animate-pulse">
         <span class="material-symbols-outlined text-4xl animate-spin mb-4">revolving_dot</span>
         <p class="text-[10px] font-black uppercase tracking-widest">Synchronizing ledger...</p>
      </div>

      <div *ngIf="!loading && earnings.length === 0" class="py-32 text-center border-2 border-dashed border-stone-100 rounded-[3rem] bg-stone-50/30">
         <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <span class="material-symbols-outlined text-stone-300 text-3xl">account_balance_wallet</span>
         </div>
         <h4 class="text-xl font-black text-on-surface mb-2">No Earnings Yet</h4>
         <p class="text-sm text-outline font-medium max-w-xs mx-auto">Complete your first harvest mission to start seeing your earnings here.</p>
      </div>

      <div *ngIf="!loading && earnings.length > 0" class="overflow-hidden bg-white border border-stone-100 rounded-[2.5rem] shadow-xl">
         <div class="overflow-x-auto">
            <table class="w-full text-left">
               <thead>
                  <tr class="bg-stone-50/50">
                     <th class="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest">Mission</th>
                     <th class="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Date</th>
                     <th class="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Type</th>
                     <th class="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Daily Payout</th>
                     <th class="px-8 py-5 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                  </tr>
               </thead>
               <tbody class="divide-y divide-stone-50">
                  <tr *ngFor="let p of earnings" class="hover:bg-stone-50/50 transition-colors group">
                     <td class="px-8 py-6">
                        <div class="flex flex-col">
                           <span class="text-sm font-black text-[#1e1c12]">{{ p.collecteDescription }}</span>
                           <span class="text-[10px] font-bold text-stone-400 flex items-center gap-1 mt-1">
                              <span class="material-symbols-outlined text-[12px]">location_on</span>
                              {{ p.collecteLocation }}
                           </span>
                        </div>
                     </td>
                     <td class="px-8 py-6 text-center">
                        <span class="text-xs font-bold text-stone-600">{{ p.collecteDate | date:'MMM d, y' }}</span>
                     </td>
                     <td class="px-8 py-6 text-center">
                        <span class="px-3 py-1 bg-stone-100 text-[9px] font-black uppercase tracking-widest rounded-full text-stone-500">{{ p.collecteType }}</span>
                     </td>
                     <td class="px-8 py-6 text-right">
                        <span class="text-base font-black text-[#3e5219]">{{ p.dailySalary || 0 }} TND</span>
                     </td>
                     <td class="px-8 py-6 text-center">
                        <div class="flex items-center justify-center gap-2">
                           <span *ngIf="p.salaryPaid" class="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full">
                              <span class="material-symbols-outlined text-sm font-black">check_circle</span>
                              <span class="text-[9px] font-black uppercase tracking-widest">Paid</span>
                           </span>
                           <span *ngIf="!p.salaryPaid" class="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full">
                              <span class="material-symbols-outlined text-sm font-black">pending</span>
                              <span class="text-[9px] font-black uppercase tracking-widest">Pending</span>
                           </span>
                        </div>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class WorkerEarningsComponent implements OnInit {
  private participationService = inject(ParticipationService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  earnings: Participation[] = [];
  loading = false;
  totalEarned = 0;

  ngOnInit() {
    this.loadEarnings();
  }

  loadEarnings() {
    this.loading = true;
    
    this.participationService.getMyParticipations().subscribe({
      next: (data) => {
        // Sort by date descending
        this.earnings = (data || []).sort((a, b) => 
          new Date(b.collecteDate!).getTime() - new Date(a.collecteDate!).getTime()
        );
        this.calculateTotal();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calculateTotal() {
    this.totalEarned = this.earnings
      .filter(p => p.salaryPaid)
      .reduce((acc, curr) => acc + (curr.dailySalary || 0), 0);
  }
}
