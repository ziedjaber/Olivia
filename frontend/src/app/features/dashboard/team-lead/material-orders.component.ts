import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';

interface ResourceOrder {
  id?: string;
  collecteId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: string;
  orderDate?: Date;
  resources: { resourceId: string; resourceName: string; quantity: number }[];
}

@Component({
  selector: 'app-material-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-6">
      <header class="mb-12 flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h1 class="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">My Material Orders</h1>
          <p class="text-on-surface-variant">Manage logistic resources and material requests for your active missions.</p>
        </div>
        <div class="flex gap-2">
           <button (click)="loadOrders()" class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-outline hover:text-primary transition-all shadow-sm">
             <span class="material-symbols-outlined">refresh</span>
           </button>
        </div>
      </header>

      <!-- Active Missions that need resources -->
      <section class="mb-12">
        <h2 class="text-xl font-bold font-headline mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">local_shipping</span>
          Deploy Resources for Missions
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let col of myCollectes" class="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-4">
                 <span class="px-2 py-1 bg-surface-container-high rounded text-[10px] font-bold uppercase">{{ col.statut }}</span>
                 <span class="text-[10px] font-bold text-outline uppercase tracking-wider">{{ col.type }}</span>
              </div>
              <h3 class="font-bold text-lg mb-1">{{ col.description }}</h3>
              <p class="text-xs text-outline mb-4">Duration: {{ col.startDate | date:'MMM d' }} - {{ col.endDate | date:'MMM d' }}</p>
              
              <!-- Required Resources Preview -->
              <div *ngIf="col.requiredResources && col.requiredResources.length > 0" class="space-y-1 mb-4 pt-4 border-t border-outline-variant/5">
                <p class="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Director's Provisioning List:</p>
                <div *ngFor="let r of col.requiredResources" class="text-xs font-bold text-on-surface-variant flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                  {{ r.quantity }}x {{ r.resourceName }}
                </div>
              </div>
            </div>

            <button (click)="openOrderModal(col)" class="w-full mt-4 py-3 bg-primary text-on-primary font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 shadow-md">
              <span class="material-symbols-outlined text-sm">shopping_cart_checkout</span>
              Dispatch Materials
            </button>
          </div>
        </div>
      </section>

      <!-- Recent Orders History (Table) -->
      <section>
        <h2 class="text-xl font-bold font-headline mb-6">Historical Orders History</h2>
        <div class="bg-surface overflow-hidden rounded-2xl border border-outline-variant/10 shadow-sm">
           <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-lowest border-b border-outline-variant/10">
                  <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Order ID</th>
                  <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Mission Context</th>
                  <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Dispatch List</th>
                  <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Order Date</th>
                  <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let ord of myOrders" class="border-b border-outline-variant/5 hover:bg-surface-container-low transition-colors">
                  <td class="p-5 text-xs font-mono text-outline">{{ ord.id | slice:0:8 }}</td>
                  <td class="p-5">
                    <p class="text-sm font-bold text-on-surface">Mission Ref: {{ ord.collecteId | slice:0:8 }}</p>
                    <p class="text-[10px] text-outline font-medium tracking-tight">{{ ord.startDate | date:'MMM d' }} - {{ ord.endDate | date:'MMM d' }}</p>
                  </td>
                  <td class="p-5">
                    <div class="flex flex-wrap gap-1">
                      <span *ngFor="let r of ord.resources" class="px-2 py-0.5 bg-surface-container border border-outline-variant/5 rounded-md text-[10px] font-bold text-on-surface-variant">
                         {{ r.quantity }}x {{ r.resourceName }}
                      </span>
                    </div>
                  </td>
                  <td class="p-5 text-xs text-on-surface font-medium">{{ ord.orderDate | date:'MMM d, HH:mm' }}</td>
                  <td class="p-5 text-center">
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      {{ ord.status }}
                    </span>
                  </td>
                </tr>
                <tr *ngIf="myOrders.length === 0">
                   <td colspan="5" class="p-10 text-center text-outline italic font-medium">No material orders placed yet. Select a mission above to begin.</td>
                </tr>
              </tbody>
           </table>
        </div>
      </section>
    </div>

    <!-- ORDER MODAL -->
    <div *ngIf="showOrderModal && selectedCollecte" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div class="bg-surface w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/10">
        <div class="p-8 border-b border-outline-variant/10 bg-surface-container-lowest">
           <h3 class="text-2xl font-black text-primary font-headline">Order Materials</h3>
           <p class="text-xs text-outline font-bold uppercase tracking-widest mt-1">Resource allocation request</p>
        </div>

        <div class="p-8 space-y-6">
           <div class="bg-surface-container-low p-4 rounded-xl border border-outline-variant/5 flex flex-col gap-2">
             <span class="text-[10px] font-black text-outline uppercase tracking-widest">Mission Context</span>
             <p class="text-sm font-bold text-on-surface">{{ selectedCollecte.description }}</p>
             <p class="text-xs text-outline font-medium tracking-tight">Deployment Duration: {{ selectedCollecte.startDate | date }} to {{ selectedCollecte.endDate | date }}</p>
           </div>

           <div class="flex justify-between items-center">
              <label class="block text-[10px] font-black text-outline uppercase tracking-widest">Selected Item Stack</label>
              <button (click)="addOrderRow()" class="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">+ New Manual Item</button>
           </div>

           <div class="space-y-3">
              <div *ngFor="let row of draftOrder.resources; let i = index" class="group flex gap-3 items-center bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/5 shadow-inner">
                 <div class="flex-grow">
                    <select [(ngModel)]="row.resourceId" (change)="onOrderResourceChange(row)" class="w-full bg-transparent border-none text-sm font-bold outline-none cursor-pointer">
                       <option value="">Select Equipment/Material</option>
                       <option *ngFor="let a of sysResources" [value]="a.id">{{ a.name }}</option>
                    </select>
                 </div>
                 <div class="flex items-center bg-surface-container rounded-lg px-2 shadow-sm border border-outline-variant/10">
                    <input type="number" [(ngModel)]="row.quantity" class="w-10 bg-transparent border-none p-3 text-sm font-black text-center outline-none">
                 </div>
                 <button (click)="draftOrder.resources.splice(i, 1)" class="w-8 h-8 flex items-center justify-center text-outline hover:text-error transition-all opacity-0 group-hover:opacity-100">
                   <span class="material-symbols-outlined text-[18px]">remove_circle</span>
                 </button>
              </div>
           </div>
        </div>

        <div class="p-8 border-t border-outline-variant/10 flex justify-end gap-4 bg-surface-container-lowest">
           <button (click)="showOrderModal = false" class="px-6 py-3 font-black text-xs text-outline uppercase tracking-widest hover:bg-surface-container transition-all rounded-xl">Discard</button>
           <button (click)="submitOrder()" class="px-10 py-3 bg-primary text-on-primary font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-xl hover:scale-[1.03] transition-all shadow-md active:scale-100 border-b-4 border-primary-container-highest">Confirm Order</button>
        </div>
      </div>
    </div>
  `
})
export class MaterialOrdersComponent implements OnInit {
  private authService = inject(AuthService);
  private collecteService = inject(CollecteService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  myCollectes: Collecte[] = [];
  myOrders: ResourceOrder[] = [];
  sysResources: any[] = [];
  
  showOrderModal = false;
  selectedCollecte: Collecte | null = null;
  draftOrder: ResourceOrder = { resources: [] };

  ngOnInit() {
    this.loadData();
    this.loadOrders();
    this.loadResources();
  }

  loadData() {
    const uid = this.authService.currentUser()?.id;
    this.collecteService.getCollectes().subscribe(data => {
      this.myCollectes = (data || []).filter(c => c.chefUid === uid && c.statut !== 'termine');
      this.cdr.detectChanges();
    });
  }

  loadOrders() {
    this.http.get<ResourceOrder[]>('http://localhost:8080/api/resource-orders/mine').subscribe(or => {
       this.myOrders = or || [];
       this.cdr.detectChanges();
    });
  }

  loadResources() {
    this.http.get<any[]>('http://localhost:8080/api/logistics').subscribe(r => {
       this.sysResources = r;
       this.cdr.detectChanges();
    });
  }

  openOrderModal(c: Collecte) {
    this.selectedCollecte = c;
    this.draftOrder = {
       collecteId: c.id,
       startDate: c.startDate,
       endDate: c.endDate,
       resources: []
    };
    
    // Prefill with Director's recommendations if they exist
    if (c.requiredResources && c.requiredResources.length > 0) {
       this.draftOrder.resources = c.requiredResources.map(r => ({ ...r }));
    } else {
       this.addOrderRow();
    }
    
    this.showOrderModal = true;
  }

  addOrderRow() {
    this.draftOrder.resources.push({ resourceId: '', resourceName: '', quantity: 1 });
  }

  onOrderResourceChange(row: any) {
    const res = this.sysResources.find(x => x.id === row.resourceId);
    if (res) row.resourceName = res.name;
  }

  submitOrder() {
    const payload = {
      ...this.draftOrder,
      resources: this.draftOrder.resources.filter(r => r.resourceId !== '')
    };

    if (payload.resources.length === 0) {
      alert("Selection list cannot be empty.");
      return;
    }

    this.http.post('http://localhost:8080/api/resource-orders', payload).subscribe({
      next: () => {
        this.showOrderModal = false;
        this.loadOrders();
      },
      error: (err) => alert("Order submission failed: " + err.message)
    });
  }
}
