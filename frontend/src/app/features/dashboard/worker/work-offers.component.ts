import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipationService, Participation } from '../../../core/services/participation.service';

@Component({
  selector: 'app-work-offers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
      <!-- Branded Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Career Opportunities</span>
          <h1 class="text-5xl font-extrabold text-on-surface font-headline tracking-tighter leading-none">Marketplace</h1>
          <p class="text-on-surface-variant font-medium mt-2 opacity-60 italic">Review and manage your harvest work invitations.</p>
        </div>
        <div class="flex gap-4">
           <div class="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                <span class="material-symbols-outlined">mail_outline</span>
              </div>
              <div>
                <span class="text-[9px] font-black text-outline uppercase tracking-wider block">Pending Invitations</span>
                <span class="text-lg font-black text-on-surface">{{ pendingOffers.length }} Offers</span>
              </div>
           </div>
        </div>
      </header>

      <!-- Offers Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div *ngFor="let offer of participations" 
             class="group bg-white rounded-[3rem] border border-stone-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 flex flex-col"
             [ngClass]="{'opacity-60 grayscale-[0.5]': offer.status === 'REJECTED' || offer.status === 'COMPLETED'}">
          
          <!-- Offer Header -->
          <div class="p-8 border-b border-stone-50 flex justify-between items-start bg-stone-50/30">
             <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                   <span class="material-symbols-outlined text-2xl">agriculture</span>
                </div>
                <div>
                   <h3 class="text-xl font-black text-on-surface leading-tight">{{ offer.collecteDescription }}</h3>
                   <span class="text-[10px] font-bold text-outline uppercase tracking-[0.2em] opacity-60">Invited by Chef {{ offer.invitedByName }}</span>
                </div>
             </div>
             <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                   [ngClass]="{
                     'bg-primary/10 text-primary': offer.status === 'INVITED',
                     'bg-green-50 text-green-700': offer.status === 'ACCEPTED' || offer.status === 'ASSIGNED',
                     'bg-stone-200 text-stone-500': offer.status === 'REJECTED' || offer.status === 'COMPLETED'
                   }">
               {{ offer.status }}
             </span>
          </div>

          <!-- Offer Details -->
          <div class="p-8 grid grid-cols-2 gap-6 flex-grow">
             <div class="space-y-4">
                <div class="flex items-start gap-3">
                   <div class="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-outline">
                      <span class="material-symbols-outlined text-sm">location_on</span>
                   </div>
                   <div>
                      <span class="block text-xs font-black text-on-surface uppercase">{{ offer.collecteLocation || 'Field A12' }}</span>
                      <span class="text-[9px] font-bold text-outline uppercase tracking-tighter">Mission Site</span>
                   </div>
                </div>
                <div class="flex items-start gap-3">
                   <div class="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-outline">
                      <span class="material-symbols-outlined text-sm">event</span>
                   </div>
                   <div>
                      <span class="block text-xs font-black text-on-surface uppercase">
                         {{ offer.collecteDate | date:'MMM d' }} 
                         <span *ngIf="offer.collecteEndDate"> - {{ offer.collecteEndDate | date:'MMM d' }}</span>
                      </span>
                      <span class="text-[9px] font-bold text-outline uppercase tracking-tighter">Harvest Timeline</span>
                   </div>
                </div>
             </div>

             <div class="bg-black/5 rounded-[2rem] p-6 flex flex-col justify-center items-center text-center">
                <span class="text-[9px] font-black text-outline uppercase tracking-[0.2em] mb-2">Compensation Offer</span>
                <h4 class="text-3xl font-black text-on-surface leading-none">{{ offer.dailySalary }} <span class="text-xs font-medium text-outline">TND/day</span></h4>
             </div>
          </div>

          <!-- Actions -->
          <div *ngIf="offer.status === 'INVITED'" class="p-8 pt-0 grid grid-cols-2 gap-4">
             <button (click)="reject(offer)" class="py-4 bg-white border border-stone-200 text-on-surface text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-all active:scale-95 shadow-sm">Refuse Offer</button>
             <button (click)="accept(offer)" class="py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95">Accept & Join</button>
          </div>
          <div *ngIf="offer.status !== 'INVITED'" class="p-8 pt-0">
             <div class="w-full py-4 text-center text-outline italic text-xs font-medium bg-stone-50 rounded-2xl border border-stone-100">
                You have already {{ offer.status | lowercase }} this mission.
             </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="participations.length === 0" class="col-span-full py-40 border-2 border-dashed border-stone-100 rounded-[4rem] text-center flex flex-col items-center gap-6">
           <div class="w-24 h-24 rounded-full bg-stone-50 flex items-center justify-center text-stone-200">
              <span class="material-symbols-outlined text-5xl">notifications_off</span>
           </div>
           <div>
              <h4 class="text-lg font-black text-on-surface uppercase tracking-widest">No Active Work Invitations</h4>
              <p class="text-xs font-medium text-outline opacity-60">Wait for Team Leads to recruit you for upcoming missions.</p>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #fcfcfc; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fade-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class WorkOffersComponent implements OnInit {
  private participationService = inject(ParticipationService);
  private cdr = inject(ChangeDetectorRef);
  participations: Participation[] = [];
  pendingOffers: Participation[] = [];

  ngOnInit() {
    this.loadOffers();
  }

  loadOffers() {
    this.participationService.getMyParticipations().subscribe(data => {
      this.participations = data.sort((a,b) => b.status === 'INVITED' ? 1 : -1);
      this.pendingOffers = data.filter(p => p.status === 'INVITED');
      this.cdr.detectChanges();
    });
  }

  accept(p: Participation) {
    if (!p.id) return;
    this.participationService.acceptInvitation(p.id).subscribe(() => this.loadOffers());
  }

  reject(p: Participation) {
    if (!p.id) return;
    this.participationService.rejectInvitation(p.id).subscribe(() => this.loadOffers());
  }
}
