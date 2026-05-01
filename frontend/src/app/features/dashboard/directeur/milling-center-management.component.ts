import { Component, OnInit, inject, AfterViewInit, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MillingCenterService, MillingCenter } from '../../../core/services/milling-center.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-milling-center-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in font-headline">
      
      <!-- Premium Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div>
          <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.4em] mb-2 block">Gestion d'infrastructure</span>
          <h1 class="text-4xl font-black text-[#1e1c12] tracking-tighter">Unités de <span class="text-[#3e5219] italic">Trituration</span></h1>
          <p class="text-[#1e1c12]/60 font-medium mt-1 italic">Controle et suivi des actifs industriels de trituration.</p>
        </div>
        
        <div class="flex gap-4">
           <button (click)="loadCenters()" class="p-3 bg-white/80 backdrop-blur-md rounded-2xl border border-stone-100 hover:bg-white hover:scale-105 transition-all shadow-sm">
             <span class="material-symbols-outlined text-stone-400">refresh</span>
           </button>
           <button (click)="toggleForm()" 
                  class="bg-[#3e5219] text-white px-8 py-3.5 font-black rounded-2xl shadow-lg shadow-[#3e5219]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-[10px] uppercase tracking-widest">
            <span class="material-symbols-outlined">add_location_alt</span>
            Enregistrer une unite
          </button>
        </div>
      </header>

      <!-- Map & Search Context -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white rounded-[3rem] p-4 border border-stone-100 shadow-2xl h-[500px] relative group overflow-hidden">
           <div id="milling-map" class="w-full h-full rounded-[2.5rem] z-0"></div>
           <div class="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-stone-100 pointer-events-none">
              <p class="text-[9px] font-black text-[#3e5219] uppercase tracking-widest leading-none mb-1">Fleet Geography</p>
              <p class="text-[11px] font-bold text-stone-600">Click map to pinpoint new units</p>
           </div>
        </div>

        <div class="space-y-6">
           <!-- Search -->
           <div class="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl space-y-4">
              <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest block font-headline">Fast Filtering</span>
              <div class="relative">
                 <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-300">search</span>
                 <input [(ngModel)]="searchTerm" type="text" placeholder="Rechercher par nom ou ville..."
                        class="w-full bg-stone-50 border border-stone-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:bg-white focus:border-[#3e5219] transition-all">
              </div>
           </div>

           <!-- Capacity Insights -->
           <div class="bg-stone-900 rounded-[2.5rem] p-8 shadow-2xl text-white relative overflow-hidden group">
              <div class="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                 <span class="material-symbols-outlined text-9xl">factory</span>
              </div>
              <p class="text-[9px] font-black text-white/40 uppercase tracking-widest mb-4">Network Capacity</p>
              <div class="flex items-baseline gap-2 mb-2">
                 <span class="text-4xl font-black tracking-tighter">{{ totalCapacity | number:'1.0-0' }}</span>
                 <span class="text-sm font-black text-white/40 uppercase">KG/Day</span>
              </div>
              <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <div class="h-full bg-primary" [style.width.%]="75"></div>
              </div>
           </div>
        </div>
      </div>

      <!-- Table View -->
      <div class="bg-white rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden animate-up">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50/50 border-b border-stone-100">
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Industrial Unit</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Geography</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Daily Load</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Status</th>
                <th class="px-8 py-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-50">
              <tr *ngFor="let center of filteredCenters" class="group hover:bg-[#3e5219]/[0.02] transition-colors">
                <td class="px-8 py-7">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-[#3e5219] transition-all shadow-sm border border-stone-100">
                      <span class="material-symbols-outlined text-2xl">factory</span>
                    </div>
                    <div>
                      <p class="font-black text-[#1e1c12] text-lg tracking-tight leading-none mb-1">{{ center.name }}</p>
                      <p class="text-[9px] font-black text-stone-400 uppercase tracking-widest">{{ center.contactNumber }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-7">
                   <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-stone-300 text-lg">location_on</span>
                      <span class="text-xs font-black text-stone-600 uppercase">{{ center.locationName }}</span>
                   </div>
                </td>
                <td class="px-8 py-7 text-center">
                   <span class="text-sm font-black text-[#1e1c12]">{{ center.dailyCapacityKg | number:'1.0-0' }}</span>
                   <span class="text-[9px] font-black text-stone-400 uppercase ml-1">KG</span>
                </td>
                <td class="px-8 py-7 text-center">
                   <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
                         [ngClass]="{
                           'bg-emerald-100 text-emerald-700': center.status === 'ACTIVE',
                           'bg-stone-100 text-stone-500': center.status === 'INACTIVE',
                           'bg-amber-100 text-amber-700': center.status === 'MAINTENANCE'
                         }">
                      {{ center.status }}
                   </span>
                </td>
                <td class="px-8 py-7 text-right">
                   <div class="flex justify-end gap-2">
                      <button (click)="onEdit(center)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-[#3e5219] hover:border-[#3e5219]/30 flex items-center justify-center transition-all shadow-sm">
                         <span class="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button (click)="onDelete(center.id)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-stone-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-all shadow-sm">
                         <span class="material-symbols-outlined text-lg">delete</span>
                      </button>
                   </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FORM MODAL -->
      <div *ngIf="showForm" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-xl" (click)="toggleForm()"></div>
        <div class="relative bg-[#f4edde] w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 space-y-8 border border-white/20 animate-slide-up">
          <header>
            <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.3em] block mb-2">Facility Registration</span>
            <h3 class="text-3xl font-black text-[#1e1c12] tracking-tighter">{{ isEditing ? 'Mettre a jour' : 'Initialiser' }} l'unite de trituration</h3>
          </header>

          <form class="space-y-6" (ngSubmit)="saveCenter()">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
               <label class="block md:col-span-2">
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Unit Official Name</span>
                  <input type="text" [(ngModel)]="currentCenter.name" name="name" placeholder="Huilerie de Sfax Central"
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
               </label>

               <label class="block">
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Location City/Area</span>
                  <input type="text" [(ngModel)]="currentCenter.locationName" name="location" placeholder="Sfax, Tunisia"
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
               </label>

               <label class="block">
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Contact Protocol (Phone)</span>
                  <input type="text" [(ngModel)]="currentCenter.contactNumber" name="contact" placeholder="+216 ..."
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
               </label>

               <label class="block">
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Daily Processing Cap (KG)</span>
                  <input type="number" [(ngModel)]="currentCenter.dailyCapacityKg" name="capacity"
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
               </label>

               <label class="block">
                  <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4 block mb-2">Operational Status</span>
                  <select [(ngModel)]="currentCenter.status" name="status"
                         class="w-full bg-white border border-stone-100 rounded-2xl px-6 py-4 text-sm font-black outline-none focus:border-[#3e5219] shadow-sm">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
               </label>

               <div class="md:col-span-2 p-6 bg-stone-100/50 rounded-3xl border border-stone-100 flex items-center justify-between">
                  <div>
                     <p class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest leading-none mb-1">Geographic Coordinates</p>
                     <p class="text-xs font-black text-[#1e1c12]">{{ currentCenter.latitude || '---' }}, {{ currentCenter.longitude || '---' }}</p>
                  </div>
                  <span class="material-symbols-outlined text-[#3e5219] opacity-20 text-4xl">map</span>
               </div>
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" (click)="toggleForm()" class="flex-1 py-4 bg-white border border-stone-200 text-[#1e1c12] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-stone-50 transition-all font-headline">Annuler</button>
              <button type="submit" [disabled]="!currentCenter.name || !currentCenter.latitude"
                      class="flex-1 py-4 bg-[#3e5219] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all shadow-lg font-headline">
                {{ isEditing ? "Mettre a jour le protocole" : "Initialiser l'unite" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f4edde; min-height: 100vh; }
    .animate-up { animation: slideUp 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MillingCenterManagementComponent implements OnInit, AfterViewInit {
  private centerService = inject(MillingCenterService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  centers: MillingCenter[] = [];
  searchTerm = '';
  loading = false;
  showForm = false;
  isEditing = false;
  
  currentCenter: Partial<MillingCenter> = this.emptyCenter();

  private map: any;
  private L: any;
  private markersLayer: any;
  private clickMarker: any;

  ngOnInit() {
    this.loadCenters();
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      setTimeout(() => this.initMap(), 500);
    }
  }

  loadCenters() {
    this.loading = true;
    this.centerService.getCenters().subscribe(data => {
      this.centers = data || [];
      this.loading = false;
      this.updateMapMarkers();
      this.cdr.detectChanges();
    });
  }

  get totalCapacity() {
    return this.centers.reduce((acc, c) => acc + (c.dailyCapacityKg || 0), 0);
  }

  get filteredCenters() {
    if (!this.searchTerm) return this.centers;
    const s = this.searchTerm.toLowerCase();
    return this.centers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      c.locationName.toLowerCase().includes(s)
    );
  }

  private initMap() {
    if (!this.L) return;
    const mapEl = document.getElementById('milling-map');
    if (!mapEl) return;

    this.map = this.L.map('milling-map', {
      center: [34.0, 9.3], // Tunisia center
      zoom: 7,
      scrollWheelZoom: true
    });

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CARTO'
    }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);

    this.map.on('click', (e: any) => {
      this.ngZone.run(() => {
        this.currentCenter.latitude = parseFloat(e.latlng.lat.toFixed(6));
        this.currentCenter.longitude = parseFloat(e.latlng.lng.toFixed(6));
        
        if (this.clickMarker) this.map.removeLayer(this.clickMarker);
        
        const pinIcon = this.L.divIcon({
          html: `<div style="background:#3e5219;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;display:flex;align-items:center;justify-content:center;">
                   <span class="material-symbols-outlined" style="transform:rotate(45deg); font-size:16px;">factory</span>
                 </div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 30]
        });

        this.clickMarker = this.L.marker(e.latlng, { icon: pinIcon }).addTo(this.map);
        
        if (!this.showForm) this.showForm = true;
        this.cdr.markForCheck();
      });
    });

    this.updateMapMarkers();
  }

  private updateMapMarkers() {
    if (!this.L || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const factoryIcon = this.L.divIcon({
      html: `<div style="background:#1e1c12;color:white;width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.2);">
               <span class="material-symbols-outlined text-[18px]">factory</span>
             </div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.centers.forEach(c => {
      if (c.latitude && c.longitude) {
        this.L.marker([c.latitude, c.longitude], { icon: factoryIcon })
          .bindPopup(`<b>${c.name}</b><br>${c.locationName}<br>Cap: ${c.dailyCapacityKg}KG`)
          .addTo(this.markersLayer);
      }
    });
  }

  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.currentCenter = this.emptyCenter();
      this.isEditing = false;
      if (this.clickMarker) this.map.removeLayer(this.clickMarker);
      this.clickMarker = null;
    }
  }

  private emptyCenter(): MillingCenter {
    return { name: '', locationName: '', latitude: 0, longitude: 0, contactNumber: '', dailyCapacityKg: 5000, status: 'ACTIVE' };
  }

  onEdit(center: MillingCenter) {
    this.currentCenter = { ...center };
    this.isEditing = true;
    this.showForm = true;
    if (this.map && center.latitude) {
       this.map.setView([center.latitude, center.longitude], 12);
    }
  }

  saveCenter() {
    this.loading = true;
    const request = this.isEditing && this.currentCenter.id
      ? this.centerService.updateCenter(this.currentCenter.id, this.currentCenter as MillingCenter)
      : this.centerService.createCenter(this.currentCenter as MillingCenter);

    request.subscribe({
      next: () => {
        this.toggleForm();
        this.loadCenters();
        this.dialogService.alert("Succes", "Protocole de l'unite de trituration mis a jour.", "success");
      },
      error: () => this.dialogService.alert("Erreur", "Echec de synchronisation des donnees de l'unite.", "danger")
    });
  }

  async onDelete(id: string | undefined) {
    if (!id) return;
    const ok = await this.dialogService.confirm("Supprimer l'unite", "Supprimer definitivement cet actif industriel ?", "danger");
    if (ok) {
      this.centerService.deleteCenter(id).subscribe(() => this.loadCenters());
    }
  }
}
