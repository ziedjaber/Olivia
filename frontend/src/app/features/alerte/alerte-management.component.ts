import { Component, OnInit, inject, AfterViewInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, Alerte } from '../../core/services/alerte.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-alerte-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-[calc(100vh-64px)] overflow-hidden flex flex-col md:flex-row bg-surface">
      <!-- LEFT: STRIKE MAP -->
      <div class="flex-grow relative h-1/2 md:h-full border-r border-outline-variant/10">
        <div id="strike-map" class="w-full h-full"></div>
        
        <!-- MAP OVERLAY CONTROLS -->
        <div class="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
          <div class="glass-panel p-4 flex items-center gap-4 border-white/40 shadow-2xl animate-in">
            <div class="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center animate-pulse">
              <span class="material-symbols-outlined">radar</span>
            </div>
            <div>
              <h2 class="text-sm font-black text-on-surface tracking-tight uppercase">Radar d'Urgence Terrain</h2>
              <p class="text-[10px] text-outline font-bold uppercase tracking-widest opacity-60">Surveillance en temps réel</p>
            </div>
          </div>
        </div>

        <!-- LEGEND OVERLAY -->
        <div class="absolute bottom-6 left-6 z-[1000] glass-panel p-4 border-white/40 shadow-xl flex gap-6 animate-up">
           <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-error pulse-danger"></span>
              <span class="text-[9px] font-black text-outline uppercase tracking-widest">Alerte Critique</span>
           </div>
           <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-orange-500"></span>
              <span class="text-[9px] font-black text-outline uppercase tracking-widest">Alerte Prioritaire</span>
           </div>
           <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-blue-500"></span>
              <span class="text-[9px] font-black text-outline uppercase tracking-widest">Priorité Basse</span>
           </div>
        </div>
      </div>

      <!-- RIGHT: INTEL STREAM -->
      <div class="w-full md:w-[450px] bg-white/40 backdrop-blur-3xl flex flex-col border-l border-white/20 shadow-[-20px_0_50px_rgba(0,0,0,0.05)]">
        <header class="p-8 border-b border-outline-variant/10">
          <div class="flex justify-between items-center mb-2">
            <h3 class="text-xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">Flux <span class="text-primary italic">de données</span></h3>
            <span class="px-3 py-1 rounded-full bg-surface-container text-[10px] font-black text-outline uppercase tracking-widest">{{ activeAlerts.length }} Active</span>
          </div>
          <p class="text-xs text-on-surface-variant font-medium">Surveillance des signaux terrain sur l'ensemble du domaine</p>
        </header>

        <!-- ALERTS LIST -->
        <div class="flex-grow overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div *ngFor="let a of alerts" 
               (click)="focusOnAlert(a)"
               class="group relative glass-panel p-5 border-white transition-all duration-500 cursor-pointer overflow-hidden"
               [ngClass]="{
                 'ring-1 ring-error/30 shadow-error/10': a.importance === 'URGENT' && a.statut === 'NON_TRAITEE',
                 'opacity-50 grayscale scale-[0.98]': a.statut !== 'NON_TRAITEE',
                 'hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl': a.statut === 'NON_TRAITEE'
               }">
            
            <!-- Solve Indicator for Solved Alerts -->
            <div *ngIf="a.statut !== 'NON_TRAITEE'" class="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] flex items-center justify-center z-10">
               <span class="px-4 py-2 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-in zoom-in">Problème réglé</span>
            </div>

            <div class="flex gap-5 relative z-0">
               <div class="flex flex-col items-center gap-2">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-12 group-hover:scale-110"
                       [ngClass]="getImportanceClass(a)">
                     <span class="material-symbols-outlined">{{ getTypeIcon(a.type) }}</span>
                  </div>
                  <div *ngIf="a.statut === 'NON_TRAITEE' && a.importance === 'URGENT'" class="w-1.5 h-1.5 rounded-full bg-error animate-ping"></div>
               </div>

               <div class="flex-grow">
                  <div class="flex justify-between items-start mb-1">
                     <span class="text-[9px] font-black uppercase tracking-[0.2em]" [ngClass]="getImportanceTextClass(a)">{{ a.importance }} Incident</span>
                     <span class="text-[9px] font-bold text-outline uppercase">{{ a.date | date:'HH:mm' }}</span>
                  </div>
                  <h4 class="font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{{ getTypeLabel(a) }}</h4>
                  <p class="text-[11px] text-on-surface-variant font-medium mt-1 line-clamp-2 leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{{ a.description }}</p>
                  
                  <div class="flex items-center gap-3 mt-4">
                     <div class="flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[14px] text-outline">person</span>
                        <span class="text-[10px] font-bold text-outline uppercase tracking-tighter">{{ a.senderName || 'Staff' }}</span>
                     </div>
                     <span class="w-1 h-1 rounded-full bg-outline-variant/30"></span>
                     <button *ngIf="a.statut === 'NON_TRAITEE'" 
                             (click)="onSolve($event, a)" 
                             class="ml-auto text-[10px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4 decoration-2">
                        Marqué résolu
                     </button>
                  </div>
               </div>
            </div>
          </div>

          <div *ngIf="alerts.length === 0 && !loading" class="py-20 text-center opacity-30">
             <span class="material-symbols-outlined text-5xl mb-3">radar</span>
             <p class="text-[10px] font-black uppercase tracking-[0.2em]">All sectors clear. No active alerts.</p>
          </div>
        </div>
      </div>

      <!-- INCIDENT DETAIL MODAL Overlay -->
      <div *ngIf="selectedAlert" 
           class="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-surface/80 backdrop-blur-xl animate-in fade-in transition-all duration-500">
        <div class="glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden border-white bg-white shadow-2xl animate-up flex flex-col md:flex-row divide-x divide-outline-variant/10">
           <!-- DETAIL LEFT: IMAGE GALLERY -->
           <div class="md:w-1/2 min-h-[400px] relative bg-surface-container-low overflow-hidden group flex flex-col">
              <!-- Main Large Preview -->
              <div class="flex-grow relative overflow-hidden">
                 <img *ngIf="currentPreviewImage" [src]="currentPreviewImage" class="w-full h-full object-cover animate-in fade-in zoom-in duration-500">
                 <div *ngIf="!currentPreviewImage" class="w-full h-full flex flex-col items-center justify-center opacity-30">
                    <span class="material-symbols-outlined text-6xl mb-4">image_not_supported</span>
                    <p class="text-[10px] font-black uppercase tracking-widest">No Optical Evidence Attached</p>
                 </div>
                 <div class="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                    <span class="material-symbols-outlined text-[16px]">visibility</span>
                    Visual Intel
                 </div>
              </div>

              <!-- Thumbnails Ribbon -->
              <div *ngIf="selectedAlert.imageUrls && selectedAlert.imageUrls.length > 1" 
                   class="h-20 bg-black/5 backdrop-blur-sm flex items-center gap-3 px-4 border-t border-outline-variant/5">
                 <div *ngFor="let url of selectedAlert.imageUrls" 
                      (click)="currentPreviewImage = url"
                      class="h-14 aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all"
                      [ngClass]="currentPreviewImage === url ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-transparent opacity-60 hover:opacity-100'">
                    <img [src]="url" class="w-full h-full object-cover">
                 </div>
              </div>
           </div>

           <!-- DETAIL RIGHT: DATA -->
           <div class="md:w-1/2 p-10 flex flex-col">
              <header class="mb-8 relative">
                 <div class="flex justify-between items-center mb-6">
                    <span class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest" [ngClass]="getImportanceClass(selectedAlert)">{{ selectedAlert.importance }} Severity</span>
                    <button (click)="selectedAlert = null" class="w-10 h-10 rounded-full hover:bg-surface transition-colors flex items-center justify-center text-outline">
                       <span class="material-symbols-outlined">close</span>
                    </button>
                 </div>
                 <h2 class="text-3xl font-black text-on-surface tracking-tighter leading-tight" style="font-family: Manrope, sans-serif;">
                    {{ getTypeLabel(selectedAlert) }} <span class="text-primary italic">Report</span>
                 </h2>
                 <div class="flex items-center gap-4 mt-3">
                    <p class="text-xs text-outline font-bold flex items-center gap-2">
                       <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                       {{ selectedAlert.date | date:'MMMM d, yyyy • HH:mm' }}
                    </p>
                    <span class="w-1 h-1 rounded-full bg-outline-variant/30"></span>
                    <p class="text-xs text-error font-black uppercase tracking-tighter flex items-center gap-1.5">
                       <span class="material-symbols-outlined text-[16px]">location_on</span>
                       {{ selectedAlert.vergerId ? ('Sector ' + selectedAlert.vergerId.substring(0,4)) : 'General' }}
                    </p>
                 </div>
              </header>

              <div class="flex-grow space-y-8 overflow-y-auto custom-scrollbar pr-2 mb-8">
                 <section class="space-y-3">
                    <label class="text-[10px] font-black text-outline/50 uppercase tracking-[0.2em]">Intelligence Summary</label>
                    <div class="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/5">
                       <p class="text-sm font-medium text-on-surface leading-loose italic">"{{ selectedAlert.description }}"</p>
                    </div>
                 </section>

                 <section class="grid grid-cols-2 gap-6">
                    <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                       <label class="text-[9px] font-black text-outline/50 uppercase tracking-[0.2em] mb-2 block">Source Node</label>
                       <p class="text-xs font-black text-on-surface">{{ selectedAlert.senderName || 'Field Agent' }}</p>
                       <p class="text-[9px] font-bold text-primary uppercase mt-1">Status Report</p>
                    </div>
                    <div class="bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/10">
                       <label class="text-[9px] font-black text-outline/50 uppercase tracking-[0.2em] mb-2 block">Grid Coordinates</label>
                       <p class="text-xs font-black text-on-surface">{{ selectedAlert.localisation || 'Not pinpointed' }}</p>
                    </div>
                 </section>
              </div>

              <div class="mt-auto pt-6 border-t border-outline-variant/10 flex gap-4">
                 <button *ngIf="selectedAlert.statut === 'NON_TRAITEE'" 
                         (click)="onSolve($event, selectedAlert)"
                         class="flex-grow group relative overflow-hidden py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:shadow-emerald-600/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">
                    <span class="relative z-10 flex items-center justify-center gap-2">
                       <span class="material-symbols-outlined text-[18px]">check_circle</span>
                       Authorize Resolution
                    </span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .glass-panel {
      @apply bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2rem];
    }
    .pulse-danger {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      animation: pulse-red 2s infinite;
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-outline-variant/20 rounded-full; }
    @keyframes pulse-red {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .animate-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .animate-up { animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlerteManagementComponent implements OnInit, AfterViewInit {
  private alerteService = inject(AlerteService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  alerts: Alerte[] = [];
  loading = false;
  
  _selectedAlert: Alerte | null = null;
  currentPreviewImage: string | null = null;

  set selectedAlert(val: Alerte | null) {
    this._selectedAlert = val;
    if (val) {
      // Preference: check imageUrls list, fallback to legacy imageUrl
      this.currentPreviewImage = (val.imageUrls && val.imageUrls.length > 0)
        ? val.imageUrls[0]
        : (val.imageUrl || null);
    } else {
      this.currentPreviewImage = null;
    }
  }
  get selectedAlert() { return this._selectedAlert; }
  private map: any;
  private markersLayer: any;
  private L: any;

  get activeAlerts() {
    return this.alerts.filter(a => a.statut === 'NON_TRAITEE');
  }

  ngOnInit() {
    this.loadAlerts();
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      setTimeout(() => this.initMap(), 400);
    }
  }

  private initMap() {
    if (!this.L) return;
    const mapEl = document.getElementById('strike-map');
    if (!mapEl) return;

    this.map = this.L.map('strike-map', {
      center: [34.0, 9.3],
      zoom: 7,
      zoomControl: false,
      attributionControl: false
    });

    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.updateMarkers();

    setTimeout(() => {
      this.map.invalidateSize();
      this.fitMapToMarkers();
    }, 800);
  }

  loadAlerts() {
    this.loading = true;
    this.alerteService.getAllAlertes().subscribe({
      next: (data) => {
        this.alerts = data;
        this.loading = false;
        this.updateMarkers();
        this.fitMapToMarkers();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load alerts:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private fitMapToMarkers() {
    if (!this.map || !this.L || this.activeAlerts.length === 0) return;

    const bounds: any[] = [];
    this.activeAlerts.forEach(a => {
      if (a.localisation) {
        const parts = a.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) bounds.push([lat, lng]);
        }
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }

  private updateMarkers() {
    if (!this.L || !this.markersLayer || !this.map) return;
    this.markersLayer.clearLayers();

    const bounds: any[] = [];


    this.alerts.forEach(a => {
      if (a.localisation && a.statut === 'NON_TRAITEE') {
        const parts = a.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          
          if (!isNaN(lat) && !isNaN(lng)) {
            bounds.push([lat, lng]);
            const pulseClass = a.importance === 'URGENT' ? 'pulse-danger' : '';
            const pinColor = a.importance === 'URGENT' ? '#ef4444' : (a.importance === 'MEDIUM' ? '#f97316' : '#3b82f6');
            const customIcon = this.L.divIcon({
              html: `<div style="background:${pinColor};width:16px;height:16px;border-radius:50%;border:4px solid white;box-shadow:0 0 20px ${pinColor}88;" class="${pulseClass}"></div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });

            this.L.marker([lat, lng], { icon: customIcon })
              .on('click', () => {
                this.ngZone.run(() => {
                  this.selectedAlert = a;
                  this.cdr.detectChanges();
                });
              })
              .addTo(this.markersLayer);
          }
        }
      }
    });

    if (bounds.length > 0 && this.map) {
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }

  focusOnAlert(a: Alerte) {
    this.selectedAlert = a;
    if (this.map && a.localisation && a.statut === 'NON_TRAITEE') {
      const parts = a.localisation.split(',');
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setView([lat, lng], 12, { animate: true });
      }
    }
    this.cdr.detectChanges();
  }

  onSolve(event: Event, a: Alerte) {
    event.stopPropagation();
    if (!a.id) return;

    this.alerteService.solveAlerte(a.id).subscribe({
      next: () => {
        this.toastService.show('Alert processed.', 'success');
        this.loadAlerts();
        if (this.selectedAlert?.id === a.id) this.selectedAlert = null;
      }
    });
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'MACHINE': return 'engineering';
      case 'ACCIDENT': return 'urgent';
      case 'INFRASTRUCTURE': return 'foundation';
      case 'METEO': return 'thunderstorm';
      default: return 'report';
    }
  }

  getTypeLabel(a: Alerte | null): string {
    if (!a || !a.type) return 'Incident';
    return a.type.replace('_', ' ');
  }

  getImportanceClass(a: Alerte): string {
    if (a.statut !== 'NON_TRAITEE') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    switch (a.importance) {
      case 'URGENT': return 'bg-error text-white border-transparent';
      case 'MEDIUM': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  }

  getImportanceTextClass(a: Alerte): string {
    if (a.statut !== 'NON_TRAITEE') return 'text-emerald-500';
    switch (a.importance) {
      case 'URGENT': return 'text-error';
      case 'MEDIUM': return 'text-orange-500';
      default: return 'text-blue-500';
    }
  }
}
