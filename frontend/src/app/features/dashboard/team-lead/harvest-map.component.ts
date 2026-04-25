import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { VergerService, Verger, OliveTree } from '../../../core/services/verger.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-harvest-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full h-[500px] rounded-[2rem] overflow-hidden border border-stone-200 shadow-inner group">
      <div [id]="mapId" class="w-full h-full z-0 relative"></div>
      
      <!-- Left Overlay: Status Legend -->
      <div class="absolute top-4 left-4 z-10">
         <div class="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-stone-100 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
            <span class="text-[9px] font-black uppercase tracking-widest text-stone-600">Pending ({{ stats.pending }})</span>
            
            <span class="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] ml-2"></span>
            <span class="text-[9px] font-black uppercase tracking-widest text-stone-600">In Progress ({{ stats.inProgress }})</span>
            
            <span class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] ml-2"></span>
            <span class="text-[9px] font-black uppercase tracking-widest text-stone-600">Completed ({{ stats.completed }})</span>
         </div>
      </div>

      <!-- Right Overlay: Re-align Action -->
      <div class="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
         <button (click)="realignTrees()" 
                 [disabled]="loading"
                 class="group flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-300 text-white px-5 py-3 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20">
            <span class="material-symbols-outlined text-lg">grid_view</span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Re-align Grid</span>
            <div *ngIf="loading" class="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full"></div>
         </button>
         
         <div class="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-stone-100/50">
            <span class="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-600">Grid Control Active</span>
         </div>
      </div>
      
      <div *ngIf="loading" class="absolute inset-0 z-20 bg-stone-50/50 backdrop-blur-sm flex items-center justify-center">
         <span class="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .custom-leaflet-popup .leaflet-popup-content-wrapper {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(8px);
      border-radius: 1.5rem;
      border: 1px solid rgba(0,0,0,0.05);
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      padding: 0;
    }
    ::ng-deep .custom-leaflet-popup .leaflet-popup-content {
      margin: 0;
    }
    ::ng-deep .custom-leaflet-popup .leaflet-popup-tip {
      display: none;
    }
    .custom-tree-marker {
       transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
       animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .custom-tree-marker:hover {
       transform: scale(1.6);
       z-index: 1000 !important;
       animation: none;
       box-shadow: 0 0 20px rgba(255,255,255,0.8) !important;
    }
    @keyframes pulse-ring {
       0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7), inset 0 0 0 1px rgba(0,0,0,0.1); }
       70% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0), inset 0 0 0 1px rgba(0,0,0,0.1); }
       100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0), inset 0 0 0 1px rgba(0,0,0,0.1); }
    }
  `]
})
export class HarvestMapComponent implements OnInit, OnDestroy {
  @Input() vergerId!: string;
  @Input() mapId: string = 'harvest-map-' + Math.random().toString(36).substr(2, 9);
  
  private vergerService = inject(VergerService);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  
  map!: L.Map;
  verger: Verger | null = null;
  loading = true;
  layerGroup = L.layerGroup();
  
  stats = { pending: 0, inProgress: 0, completed: 0 };

  ngOnInit(): void {
     if (!this.vergerId) return;
     this.fetchVergerData();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  fetchVergerData() {
    this.vergerService.getVergerById(this.vergerId).subscribe({
      next: (v) => {
        this.verger = v;
        if (!this.verger.trees || this.verger.trees.length === 0) {
           this.vergerService.generateTrees(this.vergerId).subscribe({
              next: (generated) => {
                 this.verger = generated;
                 this.initMap();
              }
           });
        } else {
           this.initMap();
        }
      }
    });
  }

  initMap() {
     this.loading = false;
     this.cdr.detectChanges();
     
     if (!this.verger || !this.verger.localisation) return;
     const [lat, lng] = this.verger.localisation.split(',').map(Number);
     
     if (!this.map) {
        // Start at a wider overview level
        this.map = L.map(this.mapId).setView([lat, lng], 16);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
           attribution: '&copy; CartoDB',
           maxZoom: 22
        }).addTo(this.map);
        
        this.layerGroup.addTo(this.map);

        // Click to zoom in effect
        this.map.on('click', (e) => {
           if (this.map.getZoom() < 18) {
              this.map.flyTo(e.latlng, 19, {
                 animate: true,
                 duration: 2.5,
                 easeLinearity: 0.25
              });
           }
        });

        // Toggle markers based on zoom level for clean UI
        this.map.on('zoomend', () => {
           this.renderTrees();
        });
     }
     
     this.renderTrees();
  }

  realignTrees() {
     if (!this.vergerId || this.loading) return;
     this.loading = true;
     this.vergerService.generateTrees(this.vergerId, true).subscribe({
        next: (updated) => {
            this.verger = updated;
            this.loading = false;
            this.renderTrees();
            this.dialogService.alert("Grid Re-aligned", "Orchard units have been reorganized into a perfect rectangular formation.", "success");
            this.cdr.detectChanges();
         },
         error: () => {
            this.loading = false;
            this.dialogService.alert("Sync Error", "Failed to communicate with the field unit database.", "danger");
            this.cdr.detectChanges();
         }
     });
  }

  renderTrees() {
     this.layerGroup.clearLayers();
     this.stats = { pending: 0, inProgress: 0, completed: 0 };
     
     if (!this.verger || !this.verger.trees) return;
     
     // Only show individual trees at deep zoom levels
     if (this.map.getZoom() < 18) {
        const [lat, lng] = this.verger.localisation.split(',').map(Number);
        const sectorMarker = L.circleMarker([lat, lng], {
           radius: 20,
           fillColor: '#3b82f6',
           color: '#fff',
           weight: 3,
           fillOpacity: 0.2
        }).addTo(this.layerGroup);
        
        sectorMarker.bindTooltip(`<div class="p-2 font-black text-[10px] uppercase">Click to view ${this.verger.trees.length} Trees</div>`, {
           permanent: false,
           direction: 'top'
        });
        
        return;
     }
     
     this.verger.trees.forEach(t => {
        // Count stats
        if (t.status === 'A_FAIRE') this.stats.pending++;
        else if (t.status === 'EN_COURS') this.stats.inProgress++;
        else if (t.status === 'TERMINE') this.stats.completed++;
        
        // Get color
        let color = '#3b82f6'; // blue
        let shadow = '0 0 10px rgba(59,130,246,0.8)';
        if (t.status === 'EN_COURS') { color = '#f97316'; shadow = '0 0 10px rgba(249,115,22,0.8)'; }
        if (t.status === 'TERMINE') { color = '#22c55e'; shadow = '0 0 10px rgba(34,197,94,0.8)'; }
        
        const customIcon = L.divIcon({
           className: 'custom-tree-marker',
           html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: ${shadow};"></div>`,
           iconSize: [14, 14],
           iconAnchor: [7, 7]
        });

        const marker = L.marker([t.lat, t.lng], { icon: customIcon });
        
        marker.bindPopup(`
          <div class="p-2 space-y-3 min-w-[150px]">
             <span class="block text-[10px] font-black uppercase text-gray-500 tracking-widest border-b pb-2">Tree ${t.id?.split('-')[1]}</span>
             <div class="flex flex-col gap-2 pt-1">
                <button onclick="window.updateTree('${t.id}', 'A_FAIRE')" class="px-2 py-1 bg-white border border-stone-200 text-blue-500 text-[10px] uppercase font-bold rounded shadow-sm hover:bg-stone-50 transition-all text-left flex justify-between">Pending <span class="${t.status === 'A_FAIRE'? 'block' : 'hidden'} font-black text-xs">✓</span></button>
                <button onclick="window.updateTree('${t.id}', 'EN_COURS')" class="px-2 py-1 bg-white border border-stone-200 text-orange-500 text-[10px] uppercase font-bold rounded shadow-sm hover:bg-stone-50 transition-all text-left flex justify-between">In Progress <span class="${t.status === 'EN_COURS'? 'block' : 'hidden'} font-black text-xs">✓</span></button>
                <button onclick="window.updateTree('${t.id}', 'TERMINE')" class="px-2 py-1 bg-white border border-stone-200 text-green-500 text-[10px] uppercase font-bold rounded shadow-sm hover:bg-stone-50 transition-all text-left flex justify-between">Completed <span class="${t.status === 'TERMINE'? 'block' : 'hidden'} font-black text-xs">✓</span></button>
             </div>
          </div>
        `, { closeButton: false, className: 'custom-leaflet-popup' });

        this.layerGroup.addLayer(marker);
     });
     
     (window as any).updateTree = (treeId: string, status: string) => {
        this.vergerService.updateTreeStatus(this.vergerId, treeId, status).subscribe(updated => {
           this.verger = updated;
           this.map.closePopup();
           this.renderTrees();
           this.cdr.detectChanges();
        });
     };
  }
}
