import { Component, OnInit, inject, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogistiqueService, LogisticResource } from '../../../core/services/logistique.service';
import { ResourceOrderService, ResourceOrder } from '../../../core/services/resource-order.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-director-logistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#fffcf5] pb-20">
      <!-- HEADER SECTION -->
      <div class="bg-surface-container-low/40 backdrop-blur-3xl border-b border-outline-variant/10 sticky top-0 z-40 px-8 py-6">
        <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Logistics Hub</span>
            </div>
            <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">Equipment <span class="text-primary/40">Market</span></h1>
            <p class="text-on-surface-variant text-sm font-medium opacity-60">Provision your harvest campaigns with professional hardware.</p>
          </div>

          <!-- Quick Navigation / Stats -->
          <div class="flex items-center gap-4">
             <div class="hidden sm:flex bg-white/60 p-1 rounded-2xl border border-outline-variant/10 shadow-sm">
                <button (click)="categoryFilter = ''" [class.bg-primary]="categoryFilter === ''" [class.text-on-primary]="categoryFilter === ''" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">All</button>
                <button (click)="categoryFilter = 'TRACTORS'" [class.bg-primary]="categoryFilter === 'TRACTORS'" [class.text-on-primary]="categoryFilter === 'TRACTORS'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Machinery</button>
                <button (click)="categoryFilter = 'TOOLS'" [class.bg-primary]="categoryFilter === 'TOOLS'" [class.text-on-primary]="categoryFilter === 'TOOLS'" class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Tools</button>
             </div>
             <div class="flex bg-white/80 rounded-full px-4 py-2.5 border border-outline-variant/20 w-64 shadow-inner group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
               <span class="material-symbols-outlined text-outline text-[18px] mr-2">search</span>
               <input [(ngModel)]="searchQuery" class="bg-transparent border-none outline-none text-xs w-full text-on-surface placeholder:text-outline/50" placeholder="Search the catalog...">
             </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-8 pt-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <!-- CATALOG GRID -->
          <div class="lg:col-span-8">
             <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                   <h2 class="text-xl font-black text-on-surface">Available Inventory</h2>
                   <span class="px-2 py-0.5 bg-surface-container rounded-md text-[10px] font-bold text-outline">{{ filteredResources.length }} Items</span>
                </div>
                <div class="h-px flex-grow mx-6 bg-outline-variant/10"></div>
                <!-- Sort Dropdown placeholder -->
                <button class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-1 hover:text-primary transition-colors">
                   Sort By <span class="material-symbols-outlined text-[14px]">expand_more</span>
                </button>
             </div>

             <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <!-- PRODUCT CARD -->
                <div *ngFor="let res of filteredResources" 
                     class="group bg-white rounded-[2rem] border border-outline-variant/15 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2 flex flex-col shadow-sm">
                  
                  <div class="h-44 relative overflow-hidden bg-surface-container-low flex items-center justify-center">
                    <img *ngIf="res.images && res.images.length > 0" [src]="getImageUrl(res.images[0])" 
                         class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Res">
                    <div *ngIf="!res.images || res.images.length === 0" class="flex flex-col items-center gap-2 text-outline/20">
                       <span class="material-symbols-outlined text-5xl">inventory_2</span>
                       <span class="text-[8px] font-black uppercase tracking-widest">No Visual Hub</span>
                    </div>

                    <!-- Overlays -->
                    <div class="absolute top-3 left-3 flex flex-col gap-1.5">
                       <span class="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">{{ res.type }}</span>
                       <span *ngIf="res.stockLevel < 5 && res.stockLevel > 0" class="px-3 py-1 bg-tertiary/80 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">Low Stock</span>
                       <span *ngIf="res.stockLevel === 0" class="px-3 py-1 bg-error/80 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest shadow-lg">Out of stock</span>
                    </div>

                    <div class="absolute bottom-3 right-3 px-3 py-1.5 bg-white shadow-xl rounded-xl">
                       <span class="text-primary font-black text-sm">€{{ res.pricePerHour }}</span>
                       <span class="text-[10px] font-bold text-outline">/h</span>
                    </div>
                  </div>

                  <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <div class="flex justify-between items-start mb-2">
                        <h4 class="font-black text-on-surface text-lg tracking-tight group-hover:text-primary transition-colors leading-tight">{{ res.name }}</h4>
                        <button (click)="selectedResource = res" class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:bg-primary/10 hover:text-primary transition-all">
                          <span class="material-symbols-outlined text-[18px]">info</span>
                        </button>
                      </div>
                      <p class="text-xs text-on-surface-variant line-clamp-2 leading-relaxed opacity-70 mb-4">{{ res.description || 'Professional grade equipment for high-efficiency harvest operations.' }}</p>
                    </div>

                    <div class="space-y-4 pt-4 border-t border-outline-variant/10">
                      <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                         <span class="text-outline">Live Availability</span>
                         <span [class.text-error]="res.stockLevel === 0" [class.text-primary]="res.stockLevel > 0" class="flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full" [class.bg-error]="res.stockLevel === 0" [class.bg-primary]="res.stockLevel > 0"></span>
                            {{ res.stockLevel }} Units
                         </span>
                      </div>
                      
                      <div class="flex gap-2">
                        <button (click)="selectedResource = res" 
                                class="flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-outline-variant/20 text-outline hover:bg-surface-container transition-all">
                          Details
                        </button>
                        <button [disabled]="res.stockLevel === 0" 
                                (click)="addToCart(res)" 
                                class="flex-[2] py-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm transition-all duration-300"
                                [ngClass]="res.stockLevel > 0 ? 'bg-primary text-on-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95' : 'bg-surface-container text-outline cursor-not-allowed'">
                          Add to Dispatch
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
             </div>

             <!-- EMPTY STATE -->
             <div *ngIf="filteredResources.length === 0" class="text-center py-24 bg-surface-container-low/20 rounded-[3rem] border border-dashed border-outline-variant/20">
                <span class="material-symbols-outlined text-6xl text-outline/20 mb-4">search_off</span>
                <h3 class="text-xl font-black text-on-surface/40">No Equipment Found</h3>
                <p class="text-xs text-outline font-medium max-w-xs mx-auto mt-2">The catalog doesn't match your current selection. Try broadening your criteria or checking with Logistics.</p>
             </div>
          </div>

          <!-- SHOPPING CART sidebar -->
          <div class="lg:col-span-4 h-fit sticky top-32">
             <div class="bg-white rounded-[2.5rem] border border-outline-variant/15 shadow-2xl shadow-primary/5 flex flex-col overflow-hidden">
                <div class="p-8 bg-surface-container-low/50 border-b border-outline-variant/10">
                   <div class="flex items-center justify-between mb-2">
                      <h3 class="text-xl font-black text-on-surface tracking-tighter">Dispatch Summary</h3>
                      <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                         <span class="text-xs font-black text-primary">{{ cart.length }}</span>
                      </div>
                   </div>
                   <p class="text-[10px] font-bold text-outline uppercase tracking-widest leading-none">Drafting logistics order</p>
                </div>

                <div class="p-8 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                   <div *ngFor="let item of cart; let i = index" class="group flex items-center justify-between gap-4 p-4 bg-surface-container-low/30 rounded-2xl border border-outline-variant/10 hover:border-primary/20 transition-all">
                      <div class="flex items-center gap-3">
                         <div class="w-12 h-12 rounded-xl bg-white overflow-hidden shadow-sm border border-outline-variant/10">
                            <img *ngIf="item.image" [src]="getImageUrl(item.image)" class="w-full h-full object-cover" alt="Item">
                            <div *ngIf="!item.image" class="w-full h-full flex items-center justify-center bg-surface-container">
                               <span class="material-symbols-outlined text-outline/30 text-lg">image_not_supported</span>
                            </div>
                         </div>
                         <div>
                            <span class="block text-xs font-black text-on-surface leading-tight">{{ item.resourceName }}</span>
                            <div class="flex items-center gap-2 mt-1">
                               <button (click)="updateQuantity(i, -1)" class="w-5 h-5 rounded-md bg-white border border-outline-variant/20 flex items-center justify-center text-[10px] hover:bg-primary hover:text-white transition-colors">-</button>
                               <span class="text-[10px] font-black text-primary">{{ item.quantity }}</span>
                               <button (click)="updateQuantity(i, 1)" class="w-5 h-5 rounded-md bg-white border border-outline-variant/20 flex items-center justify-center text-[10px] hover:bg-primary hover:text-white transition-colors">+</button>
                            </div>
                         </div>
                      </div>
                      <button (click)="removeFromCart(i)" class="w-8 h-8 rounded-full flex items-center justify-center text-outline/40 hover:text-error hover:bg-error/10 transition-all">
                         <span class="material-symbols-outlined text-lg">delete_outline</span>
                      </button>
                   </div>
                   
                   <div *ngIf="cart.length === 0" class="py-12 text-center text-outline/20">
                      <span class="material-symbols-outlined text-4xl mb-2">shopping_bag</span>
                      <p class="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
                   </div>
                </div>

                <div class="p-8 bg-surface-container-low/30 border-t border-outline-variant/10 mt-auto">
                   <!-- Mission Selector -->
                   <div class="mb-6">
                      <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Target Harvest Mission</label>
                      <div class="relative group">
                         <select [(ngModel)]="targetCollecteId" (change)="onCollecteChange()"
                                 class="w-full bg-white border border-outline-variant/20 rounded-2xl py-3.5 px-4 text-xs font-bold text-on-surface appearance-none outline-none focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer">
                            <option value="">Select an active mission...</option>
                            <option *ngFor="let c of plannedCollectes" [value]="c.id">
                               {{ c.description }} ({{ c.vergerName }})
                            </option>
                         </select>
                         <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline/40">
                            <span class="material-symbols-outlined text-lg">unfold_more</span>
                         </div>
                      </div>
                      <div *ngIf="targetCollecte" class="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                         <div class="flex items-center gap-2">
                           <span class="material-symbols-outlined text-primary text-sm">calendar_today</span>
                           <span class="text-[10px] font-black text-primary uppercase">{{ targetCollecte.startDate | date:'MMM d' }} - {{ targetCollecte.endDate | date:'MMM d' }}</span>
                         </div>
                         <span class="material-symbols-outlined text-primary text-[14px]">arrow_forward</span>
                      </div>
                   </div>

                   <div class="flex items-center justify-between mb-6">
                      <span class="text-xs font-black text-on-surface capitalize">Estimated Impact</span>
                      <span class="text-lg font-black text-primary">€{{ totalCartValue }}</span>
                   </div>

                   <button [disabled]="!canSubmit" 
                           (click)="submitOrder()" 
                           class="w-full bg-primary text-on-primary py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2">
                      <span *ngIf="submitting" class="w-3 h-3 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
                      {{ submitting ? 'Processing Dispatch...' : 'Initialize Provisioning' }}
                   </button>
                   <p class="text-[9px] text-center text-outline font-medium mt-4">Subject to Logistics Manager validation</p>
                </div>
             </div>
          </div>

      <!-- MATERIAL DETAILS MODAL -->
      <div *ngIf="selectedResource" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
         <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" (click)="selectedResource = null"></div>
         
         <div class="relative w-full max-w-5xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            <!-- Modal Close -->
            <button (click)="selectedResource = null" class="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-on-surface hover:bg-white hover:shadow-xl transition-all">
               <span class="material-symbols-outlined">close</span>
            </button>

            <div class="w-full md:w-1/2 h-80 md:h-[600px] bg-surface-container-low relative">
               <img [src]="getImageUrl(selectedResource.images[0])" class="w-full h-full object-cover" alt="Detail">
               <div class="absolute bottom-6 left-6 right-6 flex gap-2">
                  <div *ngFor="let img of selectedResource.images" class="w-16 h-16 rounded-xl border-2 border-white/50 overflow-hidden shadow-lg cursor-pointer hover:border-primary transition-all">
                     <img [src]="getImageUrl(img)" class="w-full h-full object-cover">
                  </div>
               </div>
            </div>

            <!-- Details Content -->
            <div class="w-full md:w-1/2 p-10 md:p-16 flex flex-col">
               <div class="mb-8">
                  <span class="px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black text-primary uppercase tracking-widest mb-4 inline-block">{{ selectedResource.type }}</span>
                  <h2 class="text-4xl font-black text-on-surface tracking-tighter mb-4 leading-none">{{ selectedResource.name }}</h2>
                  <div class="flex items-center gap-4">
                     <div class="px-4 py-2 bg-surface-container rounded-2xl flex items-center gap-2">
                        <span class="text-lg font-black text-primary">€{{ selectedResource.pricePerHour }}</span>
                        <span class="text-[10px] font-bold text-outline">/ hour</span>
                     </div>
                     <span class="text-xs font-bold text-outline tracking-wider uppercase">{{ selectedResource.sku }}</span>
                  </div>
               </div>

               <div class="flex-grow space-y-8">
                  <div>
                     <h5 class="text-[10px] font-black text-outline uppercase tracking-widest mb-3">Specification Manifest</h5>
                     <p class="text-sm text-on-surface-variant leading-relaxed opacity-80">{{ selectedResource.description || 'This professional-grade equipment is optimized for peak harvest performance, featuring advanced durability and ergonomic design for extended field operations.' }}</p>
                  </div>

                  <div class="grid grid-cols-2 gap-6 bg-surface-container-low/30 p-6 rounded-[2rem] border border-outline-variant/10">
                     <div class="flex flex-col gap-1">
                        <span class="text-[9px] font-black text-outline uppercase tracking-widest">Inventory State</span>
                        <span class="text-xs font-bold text-on-surface flex items-center gap-2">
                           <span class="w-2 h-2 rounded-full" [class.bg-primary]="selectedResource.stockLevel > 0" [class.bg-error]="selectedResource.stockLevel === 0"></span>
                           {{ selectedResource.stockLevel > 0 ? 'Available for Dispatch' : 'Out of Stock' }}
                        </span>
                     </div>
                     <div class="flex flex-col gap-1">
                        <span class="text-[9px] font-black text-outline uppercase tracking-widest">Units In Store</span>
                        <span class="text-xs font-bold text-on-surface">{{ selectedResource.stockLevel }} Current Units</span>
                     </div>
                  </div>
               </div>

               <div class="mt-12">
                  <button [disabled]="selectedResource.stockLevel === 0" 
                          (click)="addToCart(selectedResource); selectedResource = null" 
                          class="w-full bg-primary text-on-primary py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all disabled:opacity-40 disabled:grayscale">
                     Add to Dispatch Draft
                  </button>
               </div>
            </div>
         </div>
      </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
  `]
})
export class DirectorLogisticsComponent implements OnInit, AfterViewChecked {
  private logistiqueService = inject(LogistiqueService);
  private collecteService = inject(CollecteService);
  private resourceOrderService = inject(ResourceOrderService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  resources: LogisticResource[] = [];
  collectes: Collecte[] = [];
  searchQuery = '';
  categoryFilter = '';
  
  targetCollecteId = '';
  targetCollecte: Collecte | null = null;
  cart: { resourceId: string, resourceName: string, quantity: number, image?: string, price: number, resourceName_raw?: string }[] = [];
  submitting = false;
  selectedResource: LogisticResource | null = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.logistiqueService.getAllResources().subscribe({
      next: (r) => {
        this.resources = (r || []).map(item => ({...item, status: item.status?.toLowerCase() || 'active'}));
      },
      error: () => this.toastService.show('System connection error. Catalog unavailable.', 'error')
    });
    this.collecteService.getCollectes().subscribe(c => this.collectes = c || []);
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  get filteredResources() {
    let list = this.resources.filter(r => r.status !== 'inactive');
    if (this.categoryFilter) {
      list = list.filter(r => r.type === this.categoryFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q));
    }
    return list;
  }

  get plannedCollectes() {
    return this.collectes.filter(c => c.statut === 'PLANNED' || c.statut === 'en_attente');
  }

  get totalCartValue(): number {
     return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get canSubmit(): boolean {
    return this.cart.length > 0 && !!this.targetCollecteId && !this.submitting;
  }

  getImageUrl(path: string | undefined): string {
    if (!path) return 'https://images.unsplash.com/photo-1589923188900-85dae5233ea8?q=80&w=400&auto=format&fit=crop'; 
    if (path.startsWith('http')) return path;
    const baseUrl = 'http://localhost:8080';
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${baseUrl}${cleanPath}`;
  }

  onCollecteChange() {
    this.targetCollecte = this.collectes.find(c => c.id === this.targetCollecteId) || null;
  }

  addToCart(res: LogisticResource) {
    const existing = this.cart.find(r => r.resourceId === res.id);
    if (existing) {
       if (existing.quantity >= res.stockLevel) {
          this.toastService.show(`Logistics limit: Only ${res.stockLevel} units currently in inventory.`, 'info');
          return;
       }
       existing.quantity++;
    } else {
       this.cart.push({ 
         resourceId: res.id!, 
         resourceName: res.name, 
         quantity: 1,
         image: res.images?.[0],
         price: res.pricePerHour
       });
    }
    this.toastService.show(`${res.name} added to dispatch draft.`, 'success');
  }

  updateQuantity(index: number, delta: number) {
     const item = this.cart[index];
     const resource = this.resources.find(r => r.id === item.resourceId);
     if (delta > 0 && resource && item.quantity >= resource.stockLevel) {
        this.toastService.show(`Maximum stock level reached.`, 'info');
        return;
     }
     item.quantity += delta;
     if (item.quantity <= 0) {
        this.removeFromCart(index);
     }
  }

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  submitOrder() {
    if (!this.canSubmit) return;
    this.submitting = true;

    const payload: ResourceOrder = {
       collecteId: this.targetCollecteId,
       startDate: this.targetCollecte?.startDate || new Date(),
       endDate: this.targetCollecte?.endDate || new Date(),
       resources: this.cart.map(i => ({
          resourceId: i.resourceId,
          resourceName: i.resourceName,
          quantity: i.quantity
       }))
    };

    this.resourceOrderService.createOrder(payload).subscribe({
       next: () => {
          this.toastService.show('Logistics demand dispatched! Waiting for approval.', 'success');
          this.submitting = false;
          this.cart = [];
          this.targetCollecteId = '';
          this.targetCollecte = null;
       },
       error: (err) => {
          console.error('Provisioning Error:', err);
          const msg = err.status === 403 
             ? 'Security Block: Please ensure your account has Director privileges.' 
             : 'Failed to initiate provisioning. Please check network connection.';
          this.toastService.show(msg, 'error');
          this.submitting = false;
       }
    });
  }
}
