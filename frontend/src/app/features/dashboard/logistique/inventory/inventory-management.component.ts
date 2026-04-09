import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogistiqueService, LogisticResource } from '../../../../core/services/logistique.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-inventory-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-8 min-h-screen animate-fade-in pb-24">
      <!-- Header -->
      <header class="mb-12 flex justify-between items-end">
        <div>
          <h1 class="text-4xl font-black tracking-tight text-on-surface mb-2">Inventory Registry</h1>
          <p class="text-on-surface-variant font-medium">Manage and monitor the cooperative's physical resources.</p>
        </div>
        <button (click)="openModal()" 
                class="bg-on-surface text-surface px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center gap-2">
          <span class="material-symbols-outlined text-lg">add_circle</span>
          Register New Asset
        </button>
      </header>

      <!-- Asset Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div *ngFor="let res of resources" 
             class="bg-white rounded-[2rem] border border-outline-variant/15 overflow-hidden group hover:shadow-xl transition-all duration-300">
           <!-- Image Area -->
           <div class="relative h-48 bg-stone-100 overflow-hidden flex items-center justify-center">
             <img *ngIf="res.images && res.images.length > 0" [src]="getImageUrl(res.images[0])" 
                  class="w-full h-full object-cover"/>
             <div *ngIf="!res.images || res.images.length === 0" class="text-stone-300 flex flex-col items-center gap-2">
               <span class="material-symbols-outlined text-4xl">inventory_2</span>
               <span class="text-[8px] font-black uppercase tracking-widest">No Image</span>
             </div>
             <div class="absolute top-4 left-4">
                <span class="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-on-surface shadow-sm">
                  {{ res.type }}
                </span>
             </div>
           </div>

           <!-- Info -->
           <div class="p-6">
              <h3 class="text-lg font-black text-on-surface mb-1">{{ res.name }}</h3>
              <p class="text-xs text-outline font-medium line-clamp-2 mb-4 h-8">{{ res.description }}</p>
              
              <div class="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div class="flex flex-col">
                  <span class="text-[9px] font-black uppercase tracking-widest text-outline">Stock</span>
                  <span class="text-sm font-black" [class.text-error]="res.stockLevel <= 2">
                    {{ res.stockLevel }} Units
                  </span>
                </div>
                <div class="flex gap-1">
                  <button (click)="editResource(res)" class="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-outline hover:bg-primary/10 hover:text-primary transition-all">
                    <span class="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button (click)="deleteResource(res.id!)" class="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-outline hover:bg-error/10 hover:text-error transition-all">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      <!-- Slide-in Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex justify-end animate-fade-in" (click)="closeModal()">
        <div class="w-full max-w-lg bg-surface h-full shadow-2xl flex flex-col animate-slide-in" (click)="$event.stopPropagation()">
            <!-- Modal Header -->
            <div class="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-stone-50">
               <div>
                 <h2 class="text-2xl font-black text-on-surface">{{ isEditing ? 'Edit Asset' : 'New Asset' }}</h2>
                 <p class="text-[10px] text-outline font-bold mt-1 uppercase tracking-widest leading-none">Global Inventory System</p>
               </div>
               <button (click)="closeModal()" class="w-12 h-12 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors">
                  <span class="material-symbols-outlined">close</span>
               </button>
            </div>

            <form class="p-8 space-y-6 flex-grow overflow-y-auto">
               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Asset Identity</label>
                  <input [(ngModel)]="activeResource.name" name="name" class="w-full bg-stone-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Enter full name..."/>
               </div>

               <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Class</label>
                    <select [(ngModel)]="activeResource.type" name="type" class="w-full bg-stone-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none appearance-none cursor-pointer">
                      <option value="TRACTORS">Tractor</option>
                      <option value="BENNES">Bennes</option>
                      <option value="TOOLS">Tools</option>
                      <option value="MECHANICS">Mechanics</option>
                    </select>
                 </div>
                 <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Quantity</label>
                    <input [(ngModel)]="activeResource.stockLevel" name="stock" type="number" class="w-full bg-stone-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none"/>
                 </div>
               </div>

               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Specifications</label>
                  <textarea [(ngModel)]="activeResource.description" name="desc" rows="3" class="w-full bg-stone-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none resize-none" placeholder="Technical details..."></textarea>
               </div>

               <!-- Image Upload -->
               <div class="space-y-2">
                  <label class="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Asset Imagery</label>
                  <div class="grid grid-cols-3 gap-2">
                    <div *ngFor="let img of activeResource.images; let i = index" class="relative group h-24 rounded-xl overflow-hidden bg-stone-200">
                      <img [src]="getImageUrl(img)" class="w-full h-full object-cover">
                      <button (click)="removeImage(i)" class="absolute top-1 right-1 w-6 h-6 bg-error/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                    <label *ngIf="activeResource.images.length < 5" class="h-24 rounded-xl border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors">
                      <input type="file" (change)="onFileSelected($event)" class="hidden" multiple accept="image/*">
                      <span class="material-symbols-outlined text-outline/40">add_photo_alternate</span>
                      <span class="text-[8px] font-black uppercase tracking-widest text-outline/40 mt-1">Upload</span>
                    </label>
                  </div>
               </div>
            </form>

            <div class="p-8 bg-stone-50 border-t border-outline-variant/10">
               <button (click)="saveResource()" 
                       class="w-full bg-on-surface text-surface py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:opacity-90 active:scale-[0.98] transition-all">
                 {{ isEditing ? 'Update Asset' : 'Confirm Registry' }}
               </button>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
  `]
})
export class InventoryManagementComponent implements OnInit {
  private logistiqueService = inject(LogistiqueService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  resources: LogisticResource[] = [];
  showModal = false;
  isEditing = false;
  activeResource: LogisticResource = this.emptyResource();

  ngOnInit() {
    this.loadResources();
  }

  loadResources() {
    this.logistiqueService.getAllResources().subscribe(res => {
      this.resources = res || [];
      this.cdr.detectChanges();
    });
  }

  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `http://localhost:8080/${path.startsWith('/') ? path.substring(1) : path}`;
  }

  emptyResource(): LogisticResource {
    return { name: '', type: 'TRACTORS', description: '', pricePerHour: 0, images: [], stockLevel: 1, location: 'DEPOT_1', status: 'active' };
  }

  openModal() {
    this.activeResource = this.emptyResource();
    this.isEditing = false;
    this.showModal = true;
  }

  editResource(res: LogisticResource) {
    this.activeResource = { ...res };
    this.isEditing = true;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files.length > 0) {
      this.logistiqueService.uploadImages(Array.from(files)).subscribe(paths => {
        this.activeResource.images = [...this.activeResource.images, ...paths];
        this.toastService.show('Images uploaded', 'success');
      });
    }
  }

  removeImage(index: number) {
    this.activeResource.images.splice(index, 1);
  }

  saveResource() {
    if (this.isEditing) {
      this.logistiqueService.updateResource(this.activeResource.id!, this.activeResource).subscribe(() => {
        this.toastService.show('Asset updated', 'success');
        this.loadResources();
        this.closeModal();
      });
    } else {
      this.logistiqueService.createResource(this.activeResource).subscribe(() => {
        this.toastService.show('Asset registered', 'success');
        this.loadResources();
        this.closeModal();
      });
    }
  }

  deleteResource(id: string) {
    if (confirm('Delete this asset?')) {
      this.logistiqueService.deleteResource(id).subscribe(() => {
        this.toastService.show('Asset removed', 'success');
        this.loadResources();
      });
    }
  }
}
