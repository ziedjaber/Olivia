import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { LogistiqueService, LogisticResource } from '../../../core/services/logistique.service';
import { ResourceOrderService, ResourceOrder } from '../../../core/services/resource-order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-logistique-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- LIGHTBOX -->
<div *ngIf="lightboxImages.length > 0"
     class="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
     (click)="closeLightbox()">
  <button class="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          (click)="closeLightbox()">
    <span class="material-symbols-outlined">close</span>
  </button>
  <!-- Prev -->
  <button *ngIf="lightboxImages.length > 1"
          class="absolute left-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          (click)="$event.stopPropagation(); navigateLightbox(-1)">
    <span class="material-symbols-outlined">chevron_left</span>
  </button>
  <!-- Image -->
  <img [src]="getImageUrl(lightboxImages[lightboxIndex])"
       class="max-h-[85vh] max-w-[85vw] rounded-2xl shadow-2xl object-contain"
       (click)="$event.stopPropagation()"/>
  <!-- Next -->
  <button *ngIf="lightboxImages.length > 1"
          class="absolute right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          (click)="$event.stopPropagation(); navigateLightbox(1)">
    <span class="material-symbols-outlined">chevron_right</span>
  </button>
  <!-- Dots -->
  <div class="absolute bottom-6 flex gap-2">
    <div *ngFor="let img of lightboxImages; let i = index"
         class="w-2 h-2 rounded-full cursor-pointer transition-all"
         [class]="i === lightboxIndex ? 'bg-white scale-125' : 'bg-white/40'"
         (click)="$event.stopPropagation(); lightboxIndex = i">
    </div>
  </div>
</div>
<!-- SLIDE-IN MODAL -->
<div class="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-50 flex justify-end transition-all duration-300"
     [class.opacity-0]="!showModal" [class.pointer-events-none]="!showModal">
  <div class="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col transition-transform duration-300 overflow-y-auto"
       [class.translate-x-full]="!showModal">
    <!-- Modal Header -->
    <div class="p-8 flex items-center justify-between border-b border-outline-variant/15 bg-surface-container-low">
      <div>
        <h3 class="text-2xl font-bold text-on-surface" style="font-family: Manrope, sans-serif;">
          {{ isEditing ? 'Edit Resource' : 'Add New Resource' }}
        </h3>
        <p class="text-xs text-on-surface-variant mt-1">{{ isEditing ? 'Update the selected item' : 'Register a new inventory item' }}</p>
      </div>
      <button (click)="closeModal()"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-outline-variant/20 transition-colors">
        <span class="material-symbols-outlined text-on-surface-variant">close</span>
      </button>
    </div>

    <!-- Modal Form -->
    <form class="p-8 space-y-5 flex-grow overflow-y-auto">
      <!-- Name -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Item Name *</label>
        <input [(ngModel)]="newResource.name" name="name"
               class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none"
               placeholder="e.g. John Deere Tractor 6M" type="text"/>
      </div>

      <!-- Type -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Category *</label>
        <select [(ngModel)]="newResource.type" name="type"
                class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none appearance-none cursor-pointer">
          <option value="">Select a category</option>
          <option value="TRACTORS">Tractors</option>
          <option value="BENNES">Bennes (Bins/Trailers)</option>
          <option value="MECHANICS">Mechanics & Vehicles</option>
          <option value="TOOLS">Hand Tools & Equipment</option>
          <option value="FERTILIZER">Fertilizers & Nutrition</option>
          <option value="SAFETY">Safety Gear</option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Description</label>
        <textarea [(ngModel)]="newResource.description" name="description" rows="3"
                  class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none resize-none"
                  placeholder="Describe the item..."></textarea>
      </div>

      <!-- Price & Stock -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">€/Hour</label>
          <input [(ngModel)]="newResource.pricePerHour" name="pricePerHour" type="number" min="0" step="0.5"
                 class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none"
                 placeholder="0.00"/>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Stock Level</label>
          <input [(ngModel)]="newResource.stockLevel" name="stockLevel" type="number" min="0"
                 class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none"
                 placeholder="0"/>
        </div>
      </div>

      <!-- Location -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Storage Location</label>
        <input [(ngModel)]="newResource.location" name="location"
               class="w-full bg-surface-container-highest border-none rounded-xl font-body text-sm py-3 px-4 focus:ring-2 focus:ring-primary/30 text-on-surface outline-none"
               placeholder="e.g. Warehouse A, Bay 4"/>
      </div>

      <!-- Status -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Status</label>
        <div class="flex gap-2">
          <label class="flex-1">
            <input type="radio" name="status" value="active" [(ngModel)]="newResource.status" class="hidden peer"/>
            <div class="text-center py-2.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface-variant peer-checked:bg-secondary peer-checked:text-white cursor-pointer transition-all">
              Active
            </div>
          </label>
          <label class="flex-1">
            <input type="radio" name="status" value="low_stock" [(ngModel)]="newResource.status" class="hidden peer"/>
            <div class="text-center py-2.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface-variant peer-checked:bg-tertiary peer-checked:text-white cursor-pointer transition-all">
              Low Stock
            </div>
          </label>
          <label class="flex-1">
            <input type="radio" name="status" value="inactive" [(ngModel)]="newResource.status" class="hidden peer"/>
            <div class="text-center py-2.5 rounded-xl bg-surface-container text-xs font-bold text-on-surface-variant peer-checked:bg-error peer-checked:text-white cursor-pointer transition-all">
              Inactive
            </div>
          </label>
        </div>
      </div>

      <!-- Image Upload (max 4) -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
          Images <span class="text-outline font-normal normal-case">(max 4)</span>
        </label>
        <div class="border-2 border-dashed border-outline-variant/30 rounded-xl p-4 text-center hover:border-primary/40 transition-colors cursor-pointer relative"
             (click)="imageInput.click()">
          <span class="material-symbols-outlined text-outline/40 text-4xl mb-2 block">add_photo_alternate</span>
          <p class="text-xs text-on-surface-variant">Click to add images ({{ imageFiles.length }}/4)</p>
          <input #imageInput type="file" accept="image/*" multiple class="hidden"
                 (change)="onImagesSelected($event)" [disabled]="imageFiles.length >= 4"/>
        </div>
        <!-- Previews -->
        <div *ngIf="imageFiles.length > 0 || newResource.images.length > 0" class="grid grid-cols-4 gap-2 mt-3">
          <!-- Existing saved images (when editing) -->
          <div *ngFor="let imgUrl of newResource.images; let i = index"
               class="relative h-16 rounded-lg overflow-hidden group border border-outline-variant/20">
            <img [src]="getImageUrl(imgUrl)" class="w-full h-full object-cover"/>
            <button (click)="removeSavedImage(i)"
                    class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined text-white text-lg">delete</span>
            </button>
          </div>
          <!-- New local file previews -->
          <div *ngFor="let preview of imagePreviews; let i = index"
               class="relative h-16 rounded-lg overflow-hidden group border border-primary/30">
            <img [src]="preview" class="w-full h-full object-cover"/>
            <button (click)="removeNewImage(i)"
                    class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span class="material-symbols-outlined text-white text-lg">delete</span>
            </button>
          </div>
        </div>
      </div>
    </form>

    <!-- Modal Footer -->
    <div class="p-8 border-t border-outline-variant/15 bg-surface-container-low">
      <button (click)="onSaveResource()" [disabled]="saving"
              class="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style="font-family: Manrope, sans-serif;">
        <span *ngIf="saving" class="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin"></span>
        {{ saving ? 'Saving...' : (isEditing ? 'Update Resource' : 'Add to Inventory') }}
      </button>
    </div>
  </div>
</div>

<!-- MAIN DASHBOARD -->
<div class="min-h-screen" style="background-color: #fff9eb;">
  <!-- Top Bar -->
  <header class="bg-surface-container-low/80 backdrop-blur-xl border-b border-outline-variant/15 sticky top-0 z-30 flex justify-between items-center px-8 py-4">
    <div>
      <h2 class="text-xl font-extrabold text-on-surface" style="font-family: Manrope, sans-serif;">Logistics &amp; Inventory</h2>
      <p class="text-xs text-on-surface-variant mt-0.5">Real-time resource management</p>
    </div>
    <div class="flex items-center gap-4">
      <!-- Search -->
      <div class="hidden md:flex items-center bg-surface-container rounded-full px-4 py-2.5 gap-2 w-64 border border-outline-variant/20">
        <span class="material-symbols-outlined text-outline text-[18px]">search</span>
        <input [(ngModel)]="searchQuery" class="bg-transparent border-none outline-none text-sm w-full text-on-surface placeholder:text-outline" placeholder="Search SKU or Item..." type="text"/>
      </div>
      <!-- Add Resource Button -->
      <button (click)="openModal()"
              class="bg-primary text-on-primary px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              style="font-family: Manrope, sans-serif;">
        <span class="material-symbols-outlined text-[18px]">add</span>
        New Resource
      </button>
    </div>
  </header>

  <main class="p-8 space-y-10 max-w-7xl mx-auto">

    <!-- KPI Cards -->
    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-36 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div>
          <p class="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1" style="font-family: Manrope, sans-serif;">Total Resources</p>
          <h3 class="text-3xl font-extrabold text-primary" style="font-family: Manrope, sans-serif;">{{ resources.length }}</h3>
        </div>
        <div class="flex items-center text-secondary text-xs font-bold gap-1">
          <span class="material-symbols-outlined text-[16px]">inventory_2</span>
          Registered items
        </div>
      </div>
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-36 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div>
          <p class="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1" style="font-family: Manrope, sans-serif;">Active Items</p>
          <h3 class="text-3xl font-extrabold text-primary" style="font-family: Manrope, sans-serif;">{{ activeCount }}</h3>
        </div>
        <div class="w-full bg-surface-container-highest h-1.5 rounded-full mt-2">
          <div class="bg-primary h-full rounded-full transition-all" [style.width]="activePercent + '%'"></div>
        </div>
      </div>
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-36 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div>
          <p class="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1" style="font-family: Manrope, sans-serif;">Low Stock Alerts</p>
          <h3 class="text-3xl font-extrabold text-tertiary" style="font-family: Manrope, sans-serif;">{{ lowStockCount | number: '2.0' }}</h3>
        </div>
        <div class="flex items-center text-tertiary text-xs font-bold gap-1">
          <span class="material-symbols-outlined text-[16px]">warning</span>
          Requires attention
        </div>
      </div>
      <div class="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/15 flex flex-col justify-between h-36 hover:shadow-md transition-all hover:-translate-y-0.5">
        <div>
          <p class="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-1" style="font-family: Manrope, sans-serif;">Hourly Budget</p>
          <h3 class="text-3xl font-extrabold text-primary" style="font-family: Manrope, sans-serif;">€{{ totalHourlyValue | number: '1.0-0' }}</h3>
        </div>
        <div class="flex items-center text-on-surface-variant text-xs font-bold gap-1">
          <span class="material-symbols-outlined text-[16px]">euro</span>
          Total rent rate/hour
        </div>
      </div>
    </section>

    <!-- Inventory Table + Category Breakdown -->
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-8">

      <!-- Table & Incoming Orders -->
      <div class="lg:col-span-2 space-y-8">
      
      <!-- INCOMING RESOURCE ORDERS SECTION -->
      <div id="provisioning" class="bg-surface-container-lowest rounded-[2rem] p-10 border border-outline-variant/15 shadow-2xl shadow-primary/5" *ngIf="pendingOrders.length > 0">
         <div class="flex items-center justify-between mb-8">
            <div>
               <h4 class="text-2xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
                 Provisioning Gate
               </h4>
               <p class="text-xs text-on-surface-variant font-medium opacity-60">Demand queue from the Director's Office</p>
            </div>
            <div class="px-4 py-2 bg-error/10 rounded-2xl flex items-center gap-2 border border-error/10">
               <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>
               <span class="text-[10px] font-black text-error uppercase tracking-widest">{{ pendingOrders.length }} Pending</span>
            </div>
         </div>
         
         <div class="overflow-x-auto">
           <table class="w-full text-left border-separate border-spacing-y-4">
             <thead>
               <tr class="text-[10px] font-black text-outline uppercase tracking-[0.2em]">
                 <th class="px-6 pb-2">Target Mission</th>
                 <th class="px-6 pb-2">Requester</th>
                 <th class="px-6 pb-2">Deployment Period</th>
                 <th class="px-6 pb-2">Resources</th>
                 <th class="px-6 pb-2 text-right">Actions</th>
               </tr>
             </thead>
             <tbody>
               <tr *ngFor="let order of pendingOrders" class="group bg-surface-container-low/30 hover:bg-white border border-outline-variant/10 rounded-[1.5rem] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5">
                 <!-- Mission -->
                 <td class="py-6 px-6">
                   <div class="flex items-center gap-4">
                     <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                       <span class="material-symbols-outlined text-xl">pending_actions</span>
                     </div>
                     <div>
                       <span class="block text-sm font-black text-on-surface leading-tight">{{ getOrderMissionName(order) }}</span>
                       <span class="text-[9px] font-bold text-outline uppercase tracking-wider">Campaign ID: {{ order.collecteId.substring(0,8) }}</span>
                     </div>
                   </div>
                 </td>
                 <!-- Requester -->
                 <td class="py-6 px-6">
                   <div class="flex flex-col">
                     <span class="text-xs font-black text-on-surface">{{ order.requesterName }}</span>
                     <span class="text-[9px] font-medium text-outline">Operation Director</span>
                   </div>
                 </td>
                 <!-- Period -->
                 <td class="py-6 px-6">
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-[12px] text-primary">calendar_today</span>
                        <span class="text-[10px] font-black text-on-surface">{{ order.startDate | date:'MMM d' }} - {{ order.endDate | date:'MMM d, y' }}</span>
                      </div>
                    </div>
                 </td>
                 <!-- Resource Summary -->
                 <td class="py-6 px-6">
                    <div class="flex -space-x-2 overflow-hidden">
                       <div *ngFor="let res of order.resources.slice(0, 3)" 
                            class="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-primary-container flex items-center justify-center text-[10px] font-bold text-primary"
                            [title]="res.resourceName + ' ×' + res.quantity">
                          {{ res.resourceName.charAt(0) }}
                       </div>
                       <div *ngIf="order.resources.length > 3" 
                            class="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-surface-container flex items-center justify-center text-[9px] font-black text-outline">
                          +{{ order.resources.length - 3 }}
                       </div>
                    </div>
                 </td>
                 <!-- Actions -->
                 <td class="py-6 px-6">
                   <div class="flex items-center justify-end gap-2">
                     <button (click)="approveOrder(order.id!)" 
                             class="h-10 px-4 bg-primary text-on-primary font-black text-[9px] rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2 uppercase tracking-widest">
                       <span class="material-symbols-outlined text-sm">check_circle</span> Validate
                     </button>
                     <button (click)="rejectOrder(order.id!)" 
                             class="h-10 px-4 bg-surface-container text-error font-black text-[9px] rounded-xl hover:bg-error hover:text-white transition-all flex items-center gap-2 uppercase tracking-widest">
                       <span class="material-symbols-outlined text-sm">cancel</span> Reject
                     </button>
                   </div>
                 </td>
               </tr>
             </tbody>
           </table>
         </div>
      </div>

        <div class="bg-surface-container-low rounded-xl p-8 border border-outline-variant/15">
        <div class="flex justify-between items-end mb-8">
          <div>
            <h4 class="text-2xl font-extrabold text-on-surface" style="font-family: Manrope, sans-serif;">Inventory Matrix</h4>
            <p class="text-on-surface-variant text-sm mt-1">Live stock monitoring across all locations.</p>
          </div>
          <button (click)="loadResources()" class="p-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container transition-colors" title="Refresh">
            <span class="material-symbols-outlined text-outline text-[20px]">refresh</span>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="loading" class="flex items-center justify-center py-16 gap-3">
          <div class="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p class="text-xs font-bold text-outline uppercase tracking-widest">Loading inventory...</p>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading && filteredResources.length === 0" class="text-center py-16">
          <span class="material-symbols-outlined text-outline/30 text-6xl block mb-4">inventory_2</span>
          <p class="text-on-surface-variant font-medium">No resources in inventory yet.</p>
          <p class="text-xs text-outline mt-1">Click "New Resource" to add the first item.</p>
        </div>

        <!-- Resource Rows -->
        <div *ngIf="!loading && filteredResources.length > 0" class="overflow-x-auto">
          <table class="w-full text-left border-separate border-spacing-y-3">
            <thead>
              <tr class="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest" style="font-family: Manrope, sans-serif;">
                <th class="pb-2 px-4">SKU</th>
                <th class="pb-2 px-4">Name</th>
                <th class="pb-2 px-4 min-w-[160px]">Images</th>
                <th class="pb-2 px-4">Category</th>
                <th class="pb-2 px-4">Stock</th>
                <th class="pb-2 px-4">€/Hour</th>
                <th class="pb-2 px-4"></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let res of filteredResources"
                  class="bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all group">
                <!-- SKU -->
                <td class="py-4 px-4 font-bold text-sm text-on-surface-variant" style="font-family: Manrope, sans-serif;">{{ res.sku }}</td>
                <!-- Name -->
                <td class="py-4 px-4">
                  <div class="flex items-center gap-3">
                    <div *ngIf="!res.images || res.images.length === 0"
                         class="w-9 h-9 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <span class="material-symbols-outlined text-primary text-[18px]">{{ getCategoryIcon(res.type) }}</span>
                    </div>
                    <span class="font-semibold text-on-surface text-sm">{{ res.name }}</span>
                  </div>
                </td>
                <!-- Image Strip -->
                <td class="py-3 px-4">
                  <div *ngIf="res.images && res.images.length > 0" class="flex gap-1.5 items-center">
                    <div *ngFor="let img of res.images.slice(0, 4); let i = index"
                         class="relative w-10 h-10 rounded-lg overflow-hidden border border-outline-variant/20 cursor-pointer hover:scale-110 transition-transform flex-shrink-0 shadow-sm"
                         (click)="openLightbox(res.images, i)">
                      <img [src]="getImageUrl(img)" class="w-full h-full object-cover"/>
                    </div>
                  </div>
                  <div *ngIf="!res.images || res.images.length === 0"
                       class="text-[10px] text-outline italic">No images</div>
                </td>
                <!-- Category -->
                <td class="py-4 px-4">
                  <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase"
                        [class]="getCategoryBadgeClass(res.type)">{{ res.type }}</span>
                </td>
                <!-- Stock -->
                <td class="py-4 px-4">
                  <div class="flex items-center gap-2">
                    <div class="w-20 h-1 rounded-full bg-surface-container-highest overflow-hidden">
                      <div class="h-full rounded-full transition-all" [class]="getStockBarClass(res.status)"
                           [style.width]="getStockPercent(res) + '%'"></div>
                    </div>
                    <span class="text-xs font-bold" [class]="getStockTextClass(res.status)">{{ res.stockLevel }}</span>
                  </div>
                </td>
                <!-- Price -->
                <td class="py-4 px-4">
                  <span class="text-sm font-bold text-on-surface">€{{ res.pricePerHour }}/h</span>
                </td>
                <!-- Actions -->
                <td class="py-4 px-4 text-right">
                  <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button (click)="onEdit(res)"
                            class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
                      <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button (click)="onDelete(res.id!)"
                            class="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors">
                      <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- End of Table & Incoming Orders column -->
      </div>

      <!-- Right Panel: Category Breakdown + CTA -->
      <div class="space-y-6">
        <!-- Category Breakdown -->
        <div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/15 shadow-sm">
          <h4 class="text-xl font-bold text-on-surface mb-6" style="font-family: Manrope, sans-serif;">By Category</h4>
          <div class="space-y-4">
            <div *ngFor="let cat of categoryBreakdown" class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" [class]="cat.iconBg">
                <span class="material-symbols-outlined text-[18px]" [class]="cat.iconColor">{{ cat.icon }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{{ cat.label }}</span>
                  <span class="text-xs font-black text-on-surface">{{ cat.count }}</span>
                </div>
                <div class="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" [class]="cat.barColor"
                       [style.width]="(resources.length > 0 ? (cat.count / resources.length) * 100 : 0) + '%'"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Card -->
        <div class="bg-primary text-on-primary rounded-xl p-8 shadow-xl relative overflow-hidden">
          <div class="relative z-10">
            <h4 class="text-xl font-extrabold mb-2" style="font-family: Manrope, sans-serif;">Resource Hub</h4>
            <p class="text-sm opacity-80 mb-6">Manage all your logistics assets from one place. Add machinery, tools and more.</p>
            <button (click)="openModal()"
                    class="w-full bg-surface text-primary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
                    style="font-family: Manrope, sans-serif;">
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              Add New Item
            </button>
          </div>
          <div class="absolute -right-6 -bottom-6 opacity-10">
            <span class="material-symbols-outlined text-[9rem]">agriculture</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Resource Cards Gallery (Images) -->
    <section *ngIf="resourcesWithImages.length > 0">
      <div class="flex items-center justify-between mb-6">
        <h4 class="text-xl font-extrabold text-on-surface" style="font-family: Manrope, sans-serif;">Equipment Gallery</h4>
        <p class="text-xs text-on-surface-variant">Items with images: {{ resourcesWithImages.length }}</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        <div *ngFor="let res of resourcesWithImages"
             class="bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant/10 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer"
             (click)="onEdit(res)">
          <!-- Image Carousel Thumbnails -->
          <div class="h-44 relative overflow-hidden">
            <img [src]="getImageUrl(res.images[0])" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
            <!-- Image Count Badge -->
            <div *ngIf="res.images.length > 1"
                 class="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">photo_library</span>
              {{ res.images.length }}
            </div>
            <!-- Status Badge -->
            <div class="absolute top-2 left-2">
              <span class="text-[10px] font-bold uppercase px-2 py-1 rounded-full" [class]="getStatusBadgeClass(res.status)">
                {{ res.status.replace('_', ' ') }}
              </span>
            </div>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <p class="font-bold text-on-surface text-sm leading-tight">{{ res.name }}</p>
              <span class="text-xs font-black text-primary whitespace-nowrap">€{{ res.pricePerHour }}/h</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{{ res.type }}</span>
              <span class="text-xs text-outline">{{ res.location || 'No location' }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

  </main>
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
export class LogistiqueDashboardComponent implements OnInit {
  private logistiqueService = inject(LogistiqueService);
  private resourceOrderService = inject(ResourceOrderService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  resources: LogisticResource[] = [];
  pendingOrders: ResourceOrder[] = [];
  loading = false;
  saving = false;
  showModal = false;
  isEditing = false;
  searchQuery = '';

  imageFiles: File[] = [];
  imagePreviews: string[] = [];

  // Lightbox
  lightboxImages: string[] = [];
  lightboxIndex = 0;

  newResource: LogisticResource = this.emptyResource();

  ngOnInit() {
    this.loadResources();
    this.loadOrders();
    
    // Handle fragment navigation (Provisioning Gate shortcut)
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'provisioning') {
        setTimeout(() => {
          const element = document.getElementById('provisioning');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500); // Wait for animations/data to settle
      }
    });
  }

  emptyResource(): LogisticResource {
    return {
      name: '',
      type: '',
      description: '',
      pricePerHour: 0,
      images: [],
      stockLevel: 0,
      location: '',
      status: 'active'
    };
  }

  loadResources() {
    this.loading = true;
    this.logistiqueService.getAllResources().subscribe({
      next: (data) => { 
        this.resources = data; 
        this.loading = false; 
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; }
    });
  }

  loadOrders() {
    this.resourceOrderService.getAllOrders().subscribe({
      next: (data) => {
        this.pendingOrders = (data || []).filter(o => o.status === 'PENDING');
        this.cdr.detectChanges();
      }
    });
  }

  approveOrder(id: string) {
    this.resourceOrderService.approveOrder(id).subscribe({
      next: () => {
        this.toastService.show('Order approved successfully!', 'success');
        this.loadOrders();
      },
      error: () => this.toastService.show('Failed to approve order.', 'error')
    });
  }

  rejectOrder(id: string) {
    if(!confirm("Are you sure you want to reject this demand?")) return;
    this.resourceOrderService.rejectOrder(id).subscribe({
      next: () => {
        this.toastService.show('Order rejected.', 'success');
        this.loadOrders();
      },
      error: () => this.toastService.show('Failed to reject order.', 'error')
    });
  }

  get filteredResources(): LogisticResource[] {
    if (!this.searchQuery.trim()) return this.resources;
    const q = this.searchQuery.toLowerCase();
    return this.resources.filter(r =>
      r.name?.toLowerCase().includes(q) ||
      r.sku?.toLowerCase().includes(q) ||
      r.type?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q)
    );
  }

  getOrderMissionName(order: ResourceOrder): string {
    // In a real app, you might fetch the mission name from a map or the collecteService
    // For now, we utilize the requesterName and the mission ID in the UI
    return `Harvest Campaign Mission #${order.collecteId?.slice(-4).toUpperCase()}`;
  }

  get resourcesWithImages(): LogisticResource[] {
    return this.resources.filter(r => r.images && r.images.length > 0);
  }

  get activeCount(): number {
    return this.resources.filter(r => r.status === 'active').length;
  }
  get lowStockCount(): number {
    return this.resources.filter(r => r.status === 'low_stock').length;
  }
  get activePercent(): number {
    return this.resources.length > 0 ? (this.activeCount / this.resources.length) * 100 : 0;
  }
  get totalHourlyValue(): number {
    return this.resources.reduce((sum, r) => sum + (r.pricePerHour || 0), 0);
  }

  get categoryBreakdown() {
    const categories = [
      { key: 'TRACTORS', label: 'Tractors', icon: 'agriculture', iconBg: 'bg-primary/10', iconColor: 'text-primary', barColor: 'bg-primary', count: 0 },
      { key: 'BENNES', label: 'Bennes', icon: 'local_shipping', iconBg: 'bg-secondary/10', iconColor: 'text-secondary', barColor: 'bg-secondary', count: 0 },
      { key: 'MECHANICS', label: 'Mechanics', icon: 'build', iconBg: 'bg-tertiary/10', iconColor: 'text-tertiary', barColor: 'bg-tertiary', count: 0 },
      { key: 'TOOLS', label: 'Tools', icon: 'construction', iconBg: 'bg-outline-variant/20', iconColor: 'text-on-surface', barColor: 'bg-outline', count: 0 },
      { key: 'FERTILIZER', label: 'Fertilizers', icon: 'eco', iconBg: 'bg-secondary-container/20', iconColor: 'text-secondary', barColor: 'bg-secondary-container', count: 0 },
    ];
    categories.forEach(cat => {
      cat.count = this.resources.filter(r => r.type === cat.key).length;
    });
    return categories;
  }

  openModal() {
    this.newResource = this.emptyResource();
    this.isEditing = false;
    this.imageFiles = [];
    this.imagePreviews = [];
    this.showModal = true;
  }

  onEdit(resource: LogisticResource) {
    this.newResource = { ...resource, images: [...(resource.images || [])] };
    this.isEditing = true;
    this.imageFiles = [];
    this.imagePreviews = [];
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.imageFiles = [];
    this.imagePreviews = [];
  }

  onImagesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const remaining = 4 - this.newResource.images.length;
    const chosen = Array.from(input.files).slice(0, remaining);
    chosen.forEach(file => {
      if (this.imageFiles.length + this.newResource.images.length >= 4) return;
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => this.imagePreviews.push(e.target?.result as string);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeSavedImage(index: number) {
    this.newResource.images.splice(index, 1);
  }

  removeNewImage(index: number) {
    this.imageFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSaveResource() {
    if (!this.newResource.name || !this.newResource.type) {
      this.toastService.show('Please fill in the Name and Category fields.', 'error');
      return;
    }
    this.saving = true;

    const proceed = (finalImages: string[]) => {
      this.newResource.images = finalImages;
      const operation = this.isEditing
        ? this.logistiqueService.updateResource(this.newResource.id!, this.newResource)
        : this.logistiqueService.createResource(this.newResource);

      operation.subscribe({
        next: () => {
          this.toastService.show(this.isEditing ? 'Resource updated!' : 'Resource added to inventory!', 'success');
          this.saving = false;
          this.closeModal();
          this.loadResources();
        },
        error: (err: any) => {
          this.toastService.show('Failed to save resource. Please try again.', 'error');
          this.saving = false;
          console.error(err);
        }
      });
    };

    if (this.imageFiles.length > 0) {
      this.logistiqueService.uploadImages(this.imageFiles).subscribe({
        next: (urls: string[]) => proceed([...this.newResource.images, ...urls]),
        error: () => {
          this.toastService.show('Image upload failed. Saving without new images.', 'error');
          proceed(this.newResource.images);
        }
      });
    } else {
      proceed(this.newResource.images);
    }
  }

  onDelete(id: string) {
    if (!confirm('Remove this resource from inventory?')) return;
    this.logistiqueService.deleteResource(id).subscribe({
      next: () => {
        this.toastService.show('Resource removed.', 'success');
        this.loadResources();
      },
      error: () => this.toastService.show('Failed to delete resource.', 'error')
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080${path}`;
  }

  getCategoryIcon(type: string): string {
    const icons: Record<string, string> = {
      TRACTORS: 'agriculture', BENNES: 'local_shipping', MECHANICS: 'build',
      TOOLS: 'construction', FERTILIZER: 'eco', SAFETY: 'safety_check'
    };
    return icons[type] || 'inventory_2';
  }

  getCategoryBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      TRACTORS: 'bg-primary/10 text-primary', BENNES: 'bg-secondary/10 text-secondary',
      MECHANICS: 'bg-tertiary/10 text-tertiary', TOOLS: 'bg-outline-variant/30 text-on-surface-variant',
      FERTILIZER: 'bg-secondary-container/30 text-on-secondary-container', SAFETY: 'bg-error/10 text-error'
    };
    return classes[type] || 'bg-surface-container text-on-surface-variant';
  }

  getStockBarClass(status: string): string {
    if (status === 'low_stock') return 'bg-tertiary';
    if (status === 'inactive') return 'bg-error';
    return 'bg-secondary';
  }
  getStockTextClass(status: string): string {
    if (status === 'low_stock') return 'text-tertiary font-black';
    if (status === 'inactive') return 'text-error font-black';
    return 'text-secondary font-black';
  }
  getStockPercent(res: LogisticResource): number {
    if (!res.stockLevel || res.stockLevel === 0) return 5;
    const max = Math.max(...this.resources.map(r => r.stockLevel || 0));
    return max > 0 ? (res.stockLevel / max) * 100 : 50;
  }
  getStatusBadgeClass(status: string): string {
    if (status === 'low_stock') return 'bg-tertiary/80 text-white';
    if (status === 'inactive') return 'bg-error/80 text-white';
    return 'bg-secondary/80 text-white';
  }

  openLightbox(images: string[], index: number) {
    this.lightboxImages = images;
    this.lightboxIndex = index;
  }

  closeLightbox() {
    this.lightboxImages = [];
    this.lightboxIndex = 0;
  }

  navigateLightbox(direction: number) {
    this.lightboxIndex = (this.lightboxIndex + direction + this.lightboxImages.length) % this.lightboxImages.length;
  }
}
