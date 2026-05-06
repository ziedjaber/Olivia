import { Component, OnInit, inject, AfterViewInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-verger-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './verger-management.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VergerManagementComponent implements OnInit, AfterViewInit {
  private vergerService = inject(VergerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private userService = inject(UserService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private dialogService = inject(DialogService);

  currentUser = this.authService.currentUser;
  isGrower = false;

  vergers: Verger[] = [];
  oleiculteurs: User[] = [];
  chefsEquipe: User[] = [];
  loading = false;
  showCreateForm = false;
  isEditing = false;
  showDeleteConfirm = false;
  vergerToDeleteId: string | null = null;

  // --- Search & Pagination ---
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 10;

  // --- Telemetry Hub ---
  showTelemetryModal = false;
  selectedVergerForTelemetry: Verger | null = null;

  newVerger: Verger = this.emptyVerger();

  statuts = ['EN_ATTENTE', 'RECOLTE_EN_COURS', 'RECOLTE_TERMINEE'];
  varietes = ['CHEMLALI', 'CHETOUI', 'OUESLATI', 'GERBOUI', 'SAHLI', 'ZALMATI', 'MESKI'];

  private map: any;
  private markersLayer: any;
  private clickMarkers: any[] = [];
  private clickMarker: any; // Keep for backward compatibility if needed, but primarily using clickMarkers
  private boundaryLine: any;
  private boundaryPolygon: any;
  private L: any;

  boundaryPoints: { lat: number, lng: number }[] = [];

  private emptyVerger(): Verger {
    return {
      nom: '',
      typeOlive: 'CHEMLALI',
      varieteOlive: 'CHEMLALI',
      niveauMaturite: 0,
      localisation: '',
      proprietaireId: '',
      responsableUid: '',
      nombreArbres: 0,
      statut: 'EN_ATTENTE',
      boundary: [],
      dateReferenceCalculGDD: new Date().toISOString().split('T')[0]
    };
  }

  ngOnInit() {
    this.isGrower = this.currentUser()?.role === 'OLEICULTEUR';
    this.loadVergers();
    if (!this.isGrower) {
      this.loadOleiculteurs();
    } else {
      // Auto-set the owner ID for the grower
      this.newVerger.proprietaireId = this.currentUser()?.id || '';
    }

    // Global listener for map popup buttons
    window.addEventListener('selectVerger', (e: any) => {
      const vergerId = e.detail;
      const v = this.vergers.find(v => v.id === vergerId);
      if (v) this.selectVerger(v);
    });
  }

  async ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.L = await import('leaflet');
      setTimeout(() => this.initMap(), 400);
    }
  }

  private initMap() {
    if (!this.L) return;
    const mapEl = document.getElementById('verger-map');
    if (!mapEl) return;

    // Tunisia exact bounding box
    const SW = this.L.latLng(30.2, 7.5);
    const NE = this.L.latLng(37.6, 11.8);
    const tunisiaBounds = this.L.latLngBounds(SW, NE);

    this.map = this.L.map('verger-map', {
      center: [34.0, 9.3],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      maxBounds: tunisiaBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: true,
      scrollWheelZoom: true,
      keyboard: false,       // disable default keyboard — we'll add our own
      doubleClickZoom: true,
      dragging: true,
      touchZoom: true
    });

    // BASE LAYER: OpenStreetMap (Ultra Reliable)
    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // SATELLITE OVERLAY (Premium Detail)
    const satelliteLayer = this.L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
      maxZoom: 19,
      opacity: 0.8
    });
    
    // Add satellite layer too or use a layer control if needed, 
    // for now we add both, satellite on top with some opacity or just switch to OSM primary
    satelliteLayer.addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);
    this.map.fitBounds(tunisiaBounds);

    const fix = () => {
      if (this.map) {
        this.map.invalidateSize();
      }
    };
    fix();
    [100, 300, 600, 1000, 2000, 3000].forEach(delay => setTimeout(fix, delay));

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fix).observe(mapEl);
    }

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', fix);
    }

    this.updateMapMarkers();

    mapEl.setAttribute('tabindex', '0');
    mapEl.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'z': this.map.zoomIn(); break;
        case 's': this.map.zoomOut(); break;
        case 'arrowleft': this.map.panBy([-80, 0]); break;
        case 'arrowright': this.map.panBy([80, 0]); break;
        case 'arrowup': this.map.panBy([0, -80]); break;
        case 'arrowdown': this.map.panBy([0, 80]); break;
      }
      e.preventDefault();
    });
    setTimeout(() => mapEl.focus(), 600);

    this.map.on('click', (e: any) => {
      if (this.isGrower) return;
      this.ngZone.run(() => {
        if (!this.showCreateForm) {
          this.showCreateForm = true;
          this.isEditing = false;
        }

        const pt = { lat: e.latlng.lat, lng: e.latlng.lng };
        this.boundaryPoints.push(pt);
        this.updateBoundaryDrawing();
        this.cdr.markForCheck();
      });
    });
  }

  private updateBoundaryDrawing() {
    if (!this.L) return;

    // Remove existing
    this.clickMarkers.forEach(m => this.map.removeLayer(m));
    this.clickMarkers = [];
    if (this.boundaryLine) this.map.removeLayer(this.boundaryLine);
    if (this.boundaryPolygon) this.map.removeLayer(this.boundaryPolygon);

    // AMBER TACTICAL VERTEX ICON FOR DRAFTING
    const draftVertexIcon = this.L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-amber-400/20 rounded-full animate-ping"></div>
          <div class="w-3.5 h-3.5 bg-white border-2 border-amber-500 rounded-full shadow-lg"></div>
        </div>
      `,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.boundaryPoints.forEach((pt, i) => {
      const m = this.L.marker([pt.lat, pt.lng], { icon: draftVertexIcon }).addTo(this.map);
      this.clickMarkers.push(m);
    });

    if (this.boundaryPoints.length > 1) {
      const pts = this.boundaryPoints.map(p => [p.lat, p.lng]);

      if (this.boundaryPoints.length >= 3) {
        this.boundaryPolygon = this.L.polygon(pts, {
          color: '#FFB300',
          fillColor: '#FFB300',
          fillOpacity: 0.15,
          weight: 4,
          dashArray: '8, 8',
          className: 'drafting-polygon'
        }).addTo(this.map);
      } else {
        this.boundaryLine = this.L.polyline(pts, {
          color: '#FFB300',
          weight: 4,
          dashArray: '10, 10',
          opacity: 0.8
        }).addTo(this.map);
      }
    }
  }

  finalizeBoundary() {
    if (this.boundaryPoints.length < 3) return;

    let latSum = 0;
    let lngSum = 0;
    this.boundaryPoints.forEach(p => {
      latSum += p.lat;
      lngSum += p.lng;
    });

    const count = this.boundaryPoints.length;
    const centerLat = (latSum / count).toFixed(6);
    const centerLng = (lngSum / count).toFixed(6);

    this.newVerger.localisation = `${centerLat},${centerLng}`;
    this.newVerger.boundary = [...this.boundaryPoints];

    // Auto-focus on completion
    this.map.flyTo([parseFloat(centerLat), parseFloat(centerLng)], 17, { duration: 1.5 });

    // Visual Polish: Show final green polygon
    if (this.boundaryPolygon) {
      this.boundaryPolygon.setStyle({
        color: '#2E7D32',
        fillColor: '#81C784',
        fillOpacity: 0.3,
        weight: 3,
        dashArray: ''
      });
    }
  }

  clearBoundary() {
    this.boundaryPoints = [];
    this.updateBoundaryDrawing();
    this.newVerger.localisation = '';
    this.newVerger.boundary = [];
    this.cdr.markForCheck();
  }

  private updateMapMarkers() {
    if (!this.L || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const greenVertexIcon = this.L.divIcon({
      html: '<div class="w-2 h-2 bg-green-600 border border-white rounded-full"></div>',
      className: '',
      iconSize: [8, 8],
      iconAnchor: [4, 4]
    });

    this.vergers.forEach(v => {
      if (v.boundary && v.boundary.length >= 3) {
        const polyPoints = v.boundary.map((p: any) => [p.lat, p.lng]);
        const surfaceArea = this.calculateArea(v.boundary);

        const poly = this.L.polygon(polyPoints, {
          color: '#2E7D32',
          fillColor: '#81C784',
          fillOpacity: 0.2,
          weight: 3,
          className: 'orchard-polygon'
        }).addTo(this.markersLayer);

        v.boundary.forEach((pt: any) => {
          this.L.marker([pt.lat, pt.lng], { icon: greenVertexIcon, interactive: false }).addTo(this.markersLayer);
        });

        poly.bindTooltip(`
          <div class="p-2 font-headline">
            <p class="font-black text-[10px] uppercase text-[#3e5219]">${v.nom}</p>
            <p class="text-[9px] font-bold text-gray-500">${surfaceArea.toFixed(2)} Hectares</p>
          </div>
        `, { sticky: true, direction: 'top' });

        poly.on('click', () => {
          if (v.localisation) {
            const [lat, lng] = v.localisation.split(',').map(parseFloat);
            this.map.flyTo([lat, lng], 18, { duration: 1.2 });
            this.selectVerger(v);
          }
        });
      }

      if (v.localisation) {
        const parts = v.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          const treeIcon = this.L.divIcon({
            html: `
              <div class="relative group">
                <div class="absolute -inset-4 bg-[#3e5219]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                <div class="relative w-10 h-10 bg-white shadow-2xl rounded-2xl flex items-center justify-center border-2 border-[#3e5219]/20 group-hover:border-[#3e5219] group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                  <span class="material-symbols-outlined text-[#3e5219] text-[22px]">spa</span>
                </div>
              </div>
            `,
            className: '',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const marker = this.L.marker([lat, lng], { icon: treeIcon })
            .bindPopup(`
              <div class="p-4 min-w-[220px] font-headline animate-in fade-in zoom-in duration-300">
                <div class="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                  <div class="w-10 h-10 bg-[#3e5219]/10 rounded-lg flex items-center justify-center">
                    <span class="material-symbols-outlined text-[#3e5219]">park</span>
                  </div>
                  <div>
                    <h3 class="font-black text-sm text-gray-900 uppercase tracking-tight">${v.nom}</h3>
                    <p class="text-[10px] font-bold text-[#3e5219] uppercase tracking-widest">${v.varieteOlive || v.typeOlive}</p>
                  </div>
                </div>
                <div class="space-y-2 mb-4">
                  <div class="flex justify-between text-[10px]">
                    <span class="text-outline font-bold uppercase">Surface Area</span>
                    <span class="text-on-surface font-black">${v.boundary ? this.calculateArea(v.boundary).toFixed(2) : '0'} Ha</span>
                  </div>
                  <div class="flex justify-between text-[10px]">
                    <span class="text-outline font-bold uppercase">Maturity (GDD)</span>
                    <span class="text-[#3e5219] font-black">${v.pourcentageMaturite || v.niveauMaturite}%</span>
                  </div>
                  <div class="flex justify-between text-[10px]">
                    <span class="text-outline font-bold uppercase">Statut</span>
                    <span class="text-[#3e5219] font-black">${v.statut.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <button onclick="window.dispatchEvent(new CustomEvent('selectVerger', {detail: '${v.id}'}))" 
                  class="w-full py-2.5 bg-[#3e5219] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2d3d14] transition-all shadow-lg shadow-[#3e5219]/20">
                  Manage Estate
                </button>
              </div>
            `, { className: 'custom-map-popup' })
            .addTo(this.markersLayer);

          marker.on('click', () => {
            this.map.flyTo([lat, lng], 18, { duration: 1.5, easeLinearity: 0.25 });
            this.selectVerger(v);
          });
        }
      }
    });
  }

  private calculateArea(points: any[]): number {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      let j = (i + 1) % points.length;
      area += points[i].lng * points[j].lat;
      area -= points[j].lng * points[i].lat;
    }
    area = Math.abs(area) / 2;
    // Rough Hectare conversion for Tunisia coordinates
    return area * 12321;
  }

  loadOleiculteurs() {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.oleiculteurs = users.filter((u: User) => u.role === 'OLEICULTEUR');
        this.chefsEquipe = users.filter((u: User) => u.role === 'CHEF_EQUIPE_RECOLTE');
        this.cdr.detectChanges();
      }
    });
  }

loadVergers() {
  this.loading = true;
  this.cdr.detectChanges(); // Force skeleton display

  const request = this.isGrower
    ? this.vergerService.getMyVergers()
    : this.vergerService.getAllVergers();

  request.subscribe({
    next: (data: Verger[]) => {
      this.vergers = data;
      // Slight delay to appreciate the smooth skeleton transition
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
        this.updateMapMarkers();
      }, 800);
    },
    error: () => {
      this.loading = false;
      this.cdr.detectChanges();
    }
  });
}

getGeolocation() {
  if (!isPlatformBrowser(this.platformId)) return;
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      this.ngZone.run(() => {
        this.newVerger.localisation = `${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`;
        this.cdr.markForCheck();
      });
    },
    () => {
      this.ngZone.run(() => {
        this.toastService.show('GPS refusé ou échoué.', 'error');
      });
    }
  );
}

selectVerger(v: Verger) {
  this.ngZone.run(() => {
    this.newVerger = { ...v };
    this.isEditing = true;
    this.showCreateForm = true;

    // Load boundary points for drawing
    if (v.boundary) {
      this.boundaryPoints = [...v.boundary];
      this.updateBoundaryDrawing();
    }

    this.cdr.markForCheck();
    this.toastService.show(`Secteur ${v.nom} sélectionné`, 'info');
  });
}

toggleForm() {
  this.showCreateForm = !this.showCreateForm;
  if (!this.showCreateForm) {
    this.newVerger = this.emptyVerger();
    if (this.isGrower) {
      this.newVerger.proprietaireId = this.currentUser()?.id || '';
    }
    this.isEditing = false;
    this.boundaryPoints = [];
    this.updateBoundaryDrawing();
    if (this.clickMarker && this.map) {
      this.map.removeLayer(this.clickMarker);
      this.clickMarker = null;
    }
  }
  this.cdr.markForCheck();
}

onCreateVerger() {
  if (!this.newVerger.nom || !this.newVerger.typeOlive || !this.newVerger.localisation || !this.newVerger.proprietaireId || (!this.isGrower && !this.newVerger.responsableUid)) {
    this.toastService.show('Veuillez remplir tous les champs requis. Ajoutez au moins 3 points sur la carte.', 'error');
    return;
  }

  if (this.newVerger.responsableUid) {
    const chef = this.chefsEquipe.find(c => c.id === this.newVerger.responsableUid);
    if (chef) this.newVerger.responsableName = chef.fullName;
  }

  this.loading = true;
  this.cdr.markForCheck();

  if (this.isEditing && this.newVerger.id) {
    this.vergerService.updateVerger(this.newVerger.id, this.newVerger).subscribe({
      next: () => {
        this.toastService.show('Verger modifié!', 'success');
        this.showCreateForm = false;
        this.isEditing = false;
        this.newVerger = this.emptyVerger();
        this.boundaryPoints = [];
        this.updateBoundaryDrawing();
        this.loadVergers();
      },
      error: () => {
        this.toastService.show('Erreur modification.', 'error');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  } else {
    this.vergerService.createVerger(this.newVerger).subscribe({
      next: () => {
        this.toastService.show('Verger enregistré!', 'success');
        this.showCreateForm = false;
        this.newVerger = this.emptyVerger();
        this.boundaryPoints = [];
        this.updateBoundaryDrawing();
        if (this.clickMarker && this.map) {
          this.map.removeLayer(this.clickMarker);
          this.clickMarker = null;
        }
        this.loadVergers();
      },
      error: () => {
        this.toastService.show('Erreur enregistrement.', 'error');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}

onEdit(verger: Verger) {
  this.newVerger = { ...verger };
  this.isEditing = true;
  this.showCreateForm = true;
  this.boundaryPoints = verger.boundary ? [...verger.boundary] : [];
  this.updateBoundaryDrawing();
  this.cdr.markForCheck();

  if (this.map && verger.localisation) {
    const parts = verger.localisation.split(',');
    if (parts.length === 2) {
      const lat = parseFloat(parts[0].trim());
      const lng = parseFloat(parts[1].trim());
      if (!isNaN(lat) && !isNaN(lng)) {
        this.map.setView([lat, lng], 13, { animate: true });
      }
    }
  }
  if (isPlatformBrowser(this.platformId)) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

onStatutChange(verger: Verger, newStatut: string) {
  if (!verger.id) return;
  this.vergerService.updateVerger(verger.id, { ...verger, statut: newStatut }).subscribe({
    next: () => {
      verger.statut = newStatut;
      this.toastService.show('Statut mis à jour.', 'success');
      this.cdr.markForCheck();
    },
    error: () => this.toastService.show('Erreur statut.', 'error')
  });
}

  onDelete(id: string | undefined) {
    if (!id) return;
    this.vergerToDeleteId = id;
    this.showDeleteConfirm = true;
    this.cdr.markForCheck();
  }

  confirmDelete() {
    if (!this.vergerToDeleteId) return;
    
    this.vergerService.deleteVerger(this.vergerToDeleteId).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.toastService.show('Verger supprimé.', 'success');
          this.showDeleteConfirm = false;
          this.vergerToDeleteId = null;
          this.loadVergers();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.toastService.show('Erreur suppression.', 'error');
          this.showDeleteConfirm = false;
          this.vergerToDeleteId = null;
          this.cdr.detectChanges();
        });
      }
    });
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.vergerToDeleteId = null;
  }

  // --- Search & Pagination Helpers ---
  get filteredVergers() {
  if (!this.searchTerm) return this.vergers;
  const s = this.searchTerm.toLowerCase();
  return this.vergers.filter(v =>
    v.nom.toLowerCase().includes(s) ||
    (v.typeOlive && v.typeOlive.toLowerCase().includes(s)) ||
    (v.varieteOlive && v.varieteOlive.toLowerCase().includes(s)) ||
    v.localisation.toLowerCase().includes(s) ||
    (v.responsableName && v.responsableName.toLowerCase().includes(s))
  );
}

  get pagedVergers() {
  const start = (this.currentPage - 1) * this.itemsPerPage;
  return this.filteredVergers.slice(start, start + this.itemsPerPage);
}

  get totalPages() {
  return Math.ceil(this.filteredVergers.length / this.itemsPerPage);
}

nextPage() {
  if (this.currentPage < this.totalPages) this.currentPage++;
}

prevPage() {
  if (this.currentPage > 1) this.currentPage--;
}

// --- Telemetry Hub Handlers ---
openTelemetry(verger: Verger) {
  this.selectedVergerForTelemetry = verger;
  this.showTelemetryModal = true;
  this.cdr.markForCheck();
}

closeTelemetry() {
  this.showTelemetryModal = false;
  this.selectedVergerForTelemetry = null;
  this.cdr.markForCheck();
}
syncPredictions() {
  this.loading = true;
  this.cdr.markForCheck();
  this.vergerService.syncPredictions().subscribe({
    next: (res) => {
      this.toastService.show(res.message || 'Mise à jour des prédictions lancée.', 'success');
      this.loadVergers();
    },
    error: () => {
      this.toastService.show('Erreur lors de la synchronisation.', 'error');
      this.loading = false;
      this.cdr.markForCheck();
    }
  });
}
}
