import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceOrderService, ResourceOrder } from '../../../../core/services/resource-order.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-provisioning-demands',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 min-h-screen animate-fade-in pb-24">
      <!-- Header -->
      <header class="mb-12">
        <h1 class="text-4xl font-black tracking-tight text-on-surface mb-2">Provisioning Pipeline</h1>
        <p class="text-on-surface-variant font-medium opacity-60">Review and validate material reservation requests for field operations.</p>
      </header>

      <!-- Stats Strip -->
      <div class="flex gap-6 mb-12 overflow-x-auto pb-4 custom-scrollbar">
        <div class="bg-white px-8 py-5 rounded-2xl border border-stone-100 flex items-center gap-4 flex-shrink-0 shadow-sm">
           <div class="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
           <div>
             <span class="text-[10px] font-black uppercase tracking-widest text-outline block mb-0.5">Awaiting Action</span>
             <span class="text-lg font-black text-on-surface">{{ pendingOrders.length }} Demands</span>
           </div>
        </div>
      </div>

      <!-- Main Operational Table -->
      <div class="bg-white rounded-[2.5rem] overflow-hidden border border-outline-variant/10 shadow-sm">
         <div class="overflow-x-auto">
           <table class="w-full text-left">
             <thead>
               <tr class="bg-stone-50/50">
                 <th class="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Requester</th>
                 <th class="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Deployment</th>
                 <th class="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Manifest</th>
                 <th class="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-[0.2em]">Status</th>
                 <th class="px-8 py-6 text-[10px] font-black text-outline uppercase tracking-[0.2em] text-right">Actions</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-stone-100">
               <tr *ngFor="let order of orders" class="group hover:bg-stone-50 transition-colors">
                 <!-- Requester -->
                 <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                       <div class="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-primary font-black text-xs">
                         {{ order.requesterName?.charAt(0) || 'U' }}
                       </div>
                       <div>
                         <span class="block text-sm font-black text-on-surface">{{ order.requesterName }}</span>
                         <span class="text-[9px] text-outline font-black uppercase tracking-wider opacity-60">Hectare Specialist</span>
                       </div>
                    </div>
                 </td>
                 
                 <!-- Date -->
                 <td class="px-8 py-6">
                    <span class="block text-sm font-black text-on-surface">{{ order.startDate | date:'MMM d' }}</span>
                    <span class="text-[10px] text-outline font-bold uppercase">To {{ order.endDate | date:'MMM d' }}</span>
                 </td>

                 <!-- Resources -->
                 <td class="px-8 py-6">
                    <div class="flex flex-wrap gap-2 max-w-sm">
                       <span *ngFor="let res of order.resources" 
                             class="px-3 py-1.5 rounded-xl bg-white text-[10px] font-black text-outline border border-stone-200 shadow-sm">
                         {{ res.quantity }}x {{ res.resourceName }}
                       </span>
                    </div>
                 </td>

                 <!-- Status -->
                 <td class="px-8 py-6">
                    <div class="flex items-center gap-2">
                       <div class="w-2 h-2 rounded-full" 
                            [ngClass]="{
                              'bg-primary': !order.status || order.status === 'PENDING',
                              'bg-green-500': order.status === 'APPROVED',
                              'bg-red-500': order.status === 'REJECTED'
                            }"></div>
                       <span class="text-[10px] font-black uppercase tracking-widest"
                             [ngClass]="{
                               'text-primary': !order.status || order.status === 'PENDING',
                               'text-green-600': order.status === 'APPROVED',
                               'text-red-600': order.status === 'REJECTED'
                             }">
                         {{ order.status || 'PENDING' }}
                       </span>
                    </div>
                 </td>

                 <!-- Actions -->
                 <td class="px-8 py-6 text-right">
                    <div class="flex justify-end gap-2" *ngIf="!order.status || order.status === 'PENDING'">
                       <button (click)="approve(order.id!)" 
                               class="w-10 h-10 rounded-xl bg-stone-100 text-on-surface hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-90">
                         <span class="material-symbols-outlined text-lg">check</span>
                       </button>
                       <button (click)="reject(order.id!)" 
                               class="w-10 h-10 rounded-xl bg-stone-100 text-on-surface hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center active:scale-90">
                         <span class="material-symbols-outlined text-lg">close</span>
                       </button>
                    </div>
                    <span *ngIf="order.status && order.status !== 'PENDING'" class="text-[10px] font-bold text-outline uppercase tracking-widest italic opacity-40">Processed</span>
                 </td>
               </tr>
               
               <tr *ngIf="orders.length === 0">
                 <td colspan="5" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4 text-outline/40">
                       <span class="material-symbols-outlined text-6xl">cloud_off</span>
                       <p class="font-black text-sm uppercase tracking-widest font-headline">No provisioning demands in queue</p>
                    </div>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ProvisioningDemandsComponent implements OnInit {
  private resourceOrderService = inject(ResourceOrderService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  orders: ResourceOrder[] = [];

  get pendingOrders() {
    return this.orders.filter(o => !o.status || o.status === 'PENDING');
  }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.resourceOrderService.getAllOrders().subscribe(res => {
      this.orders = res || [];
      this.cdr.detectChanges();
    });
  }

  approve(id: string) {
    this.resourceOrderService.approveOrder(id).subscribe(() => {
      this.toastService.show('Provisioning Approved', 'success');
      this.loadOrders();
    });
  }

  reject(id: string) {
    this.resourceOrderService.rejectOrder(id).subscribe(() => {
      this.toastService.show('Provisioning Rejected', 'success');
      this.loadOrders();
    });
  }
}
