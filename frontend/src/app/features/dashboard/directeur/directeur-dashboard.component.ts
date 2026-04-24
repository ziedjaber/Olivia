import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';
import { ResourceOrderService, ResourceOrder } from '../../../core/services/resource-order.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { DirectorLogisticsComponent } from './director-logistics.component';

@Component({
  selector: 'app-directeur-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, DirectorLogisticsComponent],
  template: `
    <div class="max-w-7xl mx-auto py-6 pb-24 space-y-12">
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4">
        <div>
          <h1 class="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">Director Dashboard</h1>
          <p class="text-on-surface-variant font-medium opacity-60">Global oversight of Olivia's agricultural operations.</p>
        </div>
        <a routerLink="/harvest-planning" class="bg-black text-white px-8 py-3.5 font-bold rounded-2xl shadow-xl hover:opacity-90 transition flex items-center gap-2 text-xs uppercase tracking-widest">
           <span class="material-symbols-outlined text-lg">event_available</span>
           Open Mission Planning
        </a>
      </header>

      <!-- KPI Section -->
      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 px-4">
        <div class="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
          <p class="text-outline text-[10px] uppercase tracking-widest font-black mb-3">Active Missions</p>
          <h3 class="text-4xl font-black text-on-surface leading-none">{{ activeCollects }}</h3>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
          <p class="text-outline text-[10px] uppercase tracking-widest font-black mb-3">Total Staff</p>
          <h3 class="text-4xl font-black text-on-surface leading-none">{{ workers.length + chefs.length }}</h3>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
          <p class="text-outline text-[10px] uppercase tracking-widest font-black mb-3">Team Leads</p>
          <h3 class="text-4xl font-black text-on-surface leading-none">{{ chefs.length }}</h3>
        </div>
        <div class="bg-white p-8 rounded-[2rem] border border-outline-variant/10 shadow-sm">
          <p class="text-outline text-[10px] uppercase tracking-widest font-black mb-3">Mature Vergers</p>
          <h3 class="text-4xl font-black text-on-surface leading-none">{{ matureCount }}</h3>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4">
        <!-- Recent Collectes Summary -->
        <div class="bg-white p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
           <h4 class="text-xl font-black mb-8 flex justify-between items-center">
             Operational Snapshot
             <a routerLink="/harvest-planning" class="text-xs text-primary font-bold hover:underline">View All</a>
           </h4>
           <div class="space-y-4">
             <div *ngFor="let c of recentCollectes" class="flex items-center gap-4 p-5 bg-stone-50 rounded-2xl border border-stone-100 hover:border-primary/20 transition-colors group">
               <div class="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                 <span class="material-symbols-outlined">event</span>
               </div>
               <div class="flex-grow">
                 <p class="text-sm font-black text-on-surface leading-tight">{{ c.description }}</p>
                 <p class="text-[10px] text-outline font-black uppercase mt-0.5 tracking-wider">{{ c.statut }} • Chef: {{ c.chefName }}</p>
               </div>
               <div class="text-[10px] font-black text-outline uppercase tracking-[0.2em] opacity-40">
                 {{ c.startDate | date:'MMM d' }}
               </div>
             </div>
           </div>
        </div>

        <!-- MY RESERVATIONS SECTION -->
        <div id="my-reservations" class="bg-white p-10 rounded-[2.5rem] border border-outline-variant/10 shadow-sm">
           <h4 class="text-xl font-black mb-8">Reservation Tracker</h4>
           <div class="space-y-4">
              <div *ngFor="let order of myOrders" class="flex items-center justify-between p-5 bg-stone-50 rounded-2xl border border-stone-100">
                <div>
                   <span class="block text-sm font-black text-on-surface leading-tight">Ref: {{ order.collecteId.substring(0,8) }}</span>
                   <span class="text-[10px] text-outline font-black uppercase tracking-wider">{{ order.resources.length }} Items Requested</span>
                </div>
                <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
                      [ngClass]="{
                        'bg-white text-outline': !order.status || order.status === 'PENDING',
                        'bg-green-100 text-green-700': order.status === 'APPROVED',
                        'bg-red-100 text-red-700': order.status === 'REJECTED'
                      }">
                  {{ order.status || 'PENDING' }}
                </span>
              </div>
           </div>
        </div>
      </div>

      <!-- Equipment Marketplace Section -->
      <section class="px-4">
         <div class="bg-white p-1 pb-10 rounded-[3rem] border border-outline-variant/10 shadow-sm overflow-hidden">
            <app-director-logistics></app-director-logistics>
         </div>
      </section>
    </div>
  `
})
export class DirecteurDashboardComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private resourceOrderService = inject(ResourceOrderService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  recentCollectes: Collecte[] = [];
  myOrders: ResourceOrder[] = [];
  workers: User[] = [];
  chefs: User[] = [];
  activeCollects = 0;
  matureCount = 0;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.collecteService.getCollectes().subscribe(data => {
      this.recentCollectes = (data || []).slice(0, 5);
      this.activeCollects = (data || []).filter(c => c.statut === 'en_cours').length;
      this.cdr.detectChanges();
    });

    this.resourceOrderService.getMyOrders().subscribe((orders: ResourceOrder[]) => {
       this.myOrders = (orders || []).slice(0, 10);
       this.cdr.detectChanges();
    });

    this.userService.getAllUsers().subscribe(users => {
       this.chefs = users.filter(u => u.role === 'CHEF_EQUIPE_RECOLTE');
       this.workers = users.filter(u => u.role === 'OUVRIER_RECOLTE');
       this.cdr.detectChanges();
    });

    this.http.get<any[]>('http://localhost:8080/api/vergers').subscribe(v => {
       this.matureCount = (v || []).filter(verger => verger.niveauMaturite >= 100).length;
       this.cdr.detectChanges();
    });
  }
}
