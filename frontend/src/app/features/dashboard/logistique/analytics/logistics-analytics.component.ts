import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogistiqueService, LogisticResource } from '../../../../core/services/logistique.service';
import { ResourceOrderService, ResourceOrder } from '../../../../core/services/resource-order.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-logistics-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 min-h-screen vibrant-mesh animate-fade-in">
      <!-- Header -->
      <header class="mb-12">
        <h1 class="text-4xl font-black tracking-tight text-on-surface mb-2">
          Logistics <span class="text-gradient">Intelligence</span>
        </h1>
        <p class="text-on-surface-variant font-medium">Real-time operational metrics and asset distribution.</p>
      </header>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div class="glass-panel p-6 rounded-3xl group shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-outline">Total Assets</span>
          </div>
          <h2 class="text-3xl font-black text-on-surface">{{ resources.length }}</h2>
          <p class="text-[10px] text-outline mt-2 font-bold uppercase tracking-wider">Across 6 Categories</p>
        </div>

        <div class="glass-panel p-6 rounded-3xl group shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-outline">Active Orders</span>
          </div>
          <h2 class="text-3xl font-black text-on-surface">{{ pendingOrdersCount }}</h2>
          <p class="text-[10px] text-outline mt-2 font-bold uppercase tracking-wider">Pending Approval</p>
        </div>

        <div class="glass-panel p-6 rounded-3xl group shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-outline">Utilization</span>
          </div>
          <h2 class="text-3xl font-black text-on-surface">{{ utilizationRate }}%</h2>
          <div class="mt-3 w-full h-1 bg-surface-container rounded-full overflow-hidden">
            <div class="h-full bg-tertiary transition-all duration-1000" [style.width.%]="utilizationRate"></div>
          </div>
        </div>

        <div class="glass-panel p-6 rounded-3xl group shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <span class="material-symbols-outlined text-2xl">warning</span>
            </div>
            <span class="text-[10px] font-black uppercase tracking-widest text-outline">Critical Stock</span>
          </div>
          <h2 class="text-3xl font-black text-on-surface">{{ criticalStockCount }}</h2>
          <p class="text-[10px] text-error/70 mt-2 font-bold uppercase tracking-wider">Below 10% Capacity</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Visual Distribution -->
        <div class="glass-panel p-8 rounded-3xl shadow-lg border border-white/40">
           <h3 class="text-xl font-black mb-8 border-b border-outline-variant/10 pb-4">Category Distribution</h3>
           <div class="space-y-6">
              <div *ngFor="let cat of distribution" class="space-y-2">
                <div class="flex justify-between items-end">
                  <span class="text-xs font-black uppercase tracking-widest text-on-surface">{{ cat.name }}</span>
                  <span class="text-sm font-black text-outline">{{ cat.count }} items</span>
                </div>
                <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                   <div class="h-full transition-all duration-1000 ease-out flex" [style.width.%]="(cat.count / resources.length) * 100">
                      <div class="h-full w-full bg-gradient-to-r" [ngClass]="cat.color"></div>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <!-- Recent Activity Feed -->
        <div class="glass-panel p-8 rounded-3xl shadow-lg border border-white/40">
           <h3 class="text-xl font-black mb-8 border-b border-outline-variant/10 pb-4">Pipeline Pulse</h3>
           <div class="space-y-6">
             <div *ngFor="let order of recentOrders" class="flex gap-4 p-4 rounded-2xl bg-white/40 hover:bg-white/60 transition-colors border border-white/20 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-outline">
                  <span class="material-symbols-outlined">{{ order.status === 'APPROVED' ? 'check_circle' : 'pending' }}</span>
                </div>
                <div class="flex-grow">
                  <p class="text-sm font-black text-on-surface">{{ order.requesterName }}</p>
                  <p class="text-[10px] text-outline font-bold uppercase">Reserved {{ order.resources.length }} types for Mission {{ order.collecteId.substring(0,8) }}</p>
                </div>
                <div class="text-right">
                  <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase"
                        [ngClass]="{
                          'bg-primary/10 text-primary': order.status === 'APPROVED',
                          'bg-surface-container text-outline': !order.status || order.status === 'PENDING'
                        }">{{ order.status || 'PENDING' }}</span>
                </div>
             </div>
             <div *ngIf="recentOrders.length === 0" class="text-center py-12 text-outline italic text-sm">No recent movement in the provisioning pipeline.</div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-gradient-cat1 { background: linear-gradient(to right, #8b5cf6, #a78bfa); }
    .bg-gradient-cat2 { background: linear-gradient(to right, #ec4899, #f472b6); }
    .bg-gradient-cat3 { background: linear-gradient(to right, #10b981, #34d399); }
    .bg-gradient-cat4 { background: linear-gradient(to right, #f59e0b, #fbbf24); }
    .bg-gradient-cat5 { background: linear-gradient(to right, #3b82f6, #60a5fa); }
  `]
})
export class LogisticsAnalyticsComponent implements OnInit {
  private logistiqueService = inject(LogistiqueService);
  private resourceOrderService = inject(ResourceOrderService);
  private cdr = inject(ChangeDetectorRef);

  resources: LogisticResource[] = [];
  orders: ResourceOrder[] = [];
  
  pendingOrdersCount = 0;
  utilizationRate = 0;
  criticalStockCount = 0;
  distribution: any[] = [];
  recentOrders: ResourceOrder[] = [];

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    forkJoin({
      res: this.logistiqueService.getAllResources(),
      orders: this.resourceOrderService.getAllOrders()
    }).subscribe(({ res, orders }) => {
      this.resources = res || [];
      this.orders = orders || [];
      this.calculateStats();
      this.cdr.detectChanges();
    });
  }

  calculateStats() {
    this.pendingOrdersCount = this.orders.filter(o => !o.status || o.status === 'PENDING').length;
    this.recentOrders = this.orders.slice(-5).reverse();
    this.criticalStockCount = this.resources.filter(r => r.stockLevel <= 2).length;
    
    // Utilization rate (rough estimate based on total ordered items vs total items)
    const totalOrdered = this.orders.filter(o => o.status === 'APPROVED').length;
    this.utilizationRate = this.orders.length > 0 ? Math.round((totalOrdered / this.orders.length) * 100) : 0;

    // Distibution by Category
    const cats: { [key: string]: number } = {};
    const colorClasses = ['bg-gradient-cat1', 'bg-gradient-cat2', 'bg-gradient-cat3', 'bg-gradient-cat4', 'bg-gradient-cat5'];
    
    this.resources.forEach(r => {
      cats[r.type] = (cats[r.type] || 0) + 1;
    });

    this.distribution = Object.keys(cats).map((name, i) => ({
      name,
      count: cats[name],
      color: colorClasses[i % colorClasses.length]
    }));
  }
}
