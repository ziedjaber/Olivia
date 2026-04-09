import { Component, OnInit, inject, AfterViewInit, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';

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

  currentUser = this.authService.currentUser;
  isGrower = false;

  vergers: Verger[] = [];
  oleiculteurs: User[] = [];
  loading = false;
  showCreateForm = false;
  isEditing = false;

  newVerger: Verger = this.emptyVerger();

  statuts = ['EN_ATTENTE', 'RECOLTE_EN_COURS', 'RECOLTE_TERMINEE'];

  private map: any;
  private markersLayer: any;
  private clickMarker: any;
  private L: any;

  private emptyVerger(): Verger {
    return { nom: '', typeOlive: '', niveauMaturite: 0, localisation: '', proprietaireId: '', nombreArbres: 0, statut: 'EN_ATTENTE' };
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

    // CartoDB Positron — clean white tiles, loads fast, no blank spaces
    this.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer = this.L.layerGroup().addTo(this.map);

    // Fit Tunisia
    this.map.fitBounds(tunisiaBounds);

    // Force tile repaint — staggered to handle slow DOM paints
    const fix = () => this.map.invalidateSize({ animate: false, debounceMoveend: true });
    fix();
    [100, 300, 600, 1200, 2000].forEach(delay => setTimeout(fix, delay));

    // ResizeObserver for runtime container resize
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(fix).observe(mapEl);
    }

    // Also repaint when window resizes
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', fix);
    }

    this.updateMapMarkers();

    // Custom keyboard: Z = zoom in, S = zoom out, arrows = pan
    mapEl.setAttribute('tabindex', '0');
    mapEl.addEventListener('keydown', (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'z': this.map.zoomIn(); break;
        case 's': this.map.zoomOut(); break;
        case 'arrowleft':  this.map.panBy([-80, 0]); break;
        case 'arrowright': this.map.panBy([80, 0]); break;
        case 'arrowup':    this.map.panBy([0, -80]); break;
        case 'arrowdown':  this.map.panBy([0, 80]); break;
      }
      e.preventDefault();
    });
    setTimeout(() => mapEl.focus(), 600);

    // Click on map to select location
    this.map.on('click', (e: any) => {
      if (this.isGrower) return;
      this.ngZone.run(() => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);

        if (this.clickMarker) {
          this.map.removeLayer(this.clickMarker);
        }

        const pinIcon = this.L.divIcon({
          html: `<div style="background:#4CAF50;color:white;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:16px;">
                   <span style="transform:rotate(45deg)">📍</span>
                 </div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });

        this.clickMarker = this.L.marker([e.latlng.lat, e.latlng.lng], { icon: pinIcon })
          .addTo(this.map)
          .bindPopup(`<b>Emplacement sélectionné</b><br>${lat}, ${lng}`)
          .openPopup();

        this.newVerger.localisation = `${lat},${lng}`;
        if (!this.showCreateForm) {
          this.showCreateForm = true;
          this.isEditing = false;
        }
        this.cdr.markForCheck();
      });
    });
  }

  private updateMapMarkers() {
    if (!this.L || !this.markersLayer) return;
    this.markersLayer.clearLayers();

    const treeIcon = this.L.divIcon({
      html: `<div style="background:#2F4F4F;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 4px 8px rgba(0,0,0,0.3);font-size:18px;">
               <span class="material-symbols-outlined text-[20px]">potted_plant</span>
             </div>`,
      className: '',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    this.vergers.forEach(v => {
      if (v.localisation) {
        const parts = v.localisation.split(',');
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          if (!isNaN(lat) && !isNaN(lng)) {
            this.L.marker([lat, lng], { icon: treeIcon })
              .bindPopup(`
                <div style="font-family:sans-serif;min-width:160px;padding:4px;">
                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                    <span class="material-symbols-outlined text-primary text-[18px]">potted_plant</span>
                    <b style="font-size:14px;color:#1a1c1e;">${v.nom}</b>
                  </div>
                  <span style="color:#666;font-size:12px;font-weight:500;">${v.typeOlive}</span><br>
                  <hr style="margin:8px 0;border-color:#eee;">
                  <div style="display:flex;flex-direction:column;gap:4px;font-size:12px;">
                    <div style="display:flex;justify-content:between;align-items:center;">
                      <span style="display:flex;align-items:center;gap:4px;color:#444;"><span class="material-symbols-outlined text-[14px]">forest</span> Arbres:</span>
                      <b style="margin-left:auto;">${v.nombreArbres}</b>
                    </div>
                    <div style="display:flex;justify-content:between;align-items:center;">
                      <span style="display:flex;align-items:center;gap:4px;color:#444;"><span class="material-symbols-outlined text-[14px]">monitoring</span> Maturité:</span>
                      <b style="margin-left:auto;">${v.niveauMaturite}%</b>
                    </div>
                    <div style="display:flex;justify-content:between;align-items:center;margin-top:4px;">
                      <span style="padding:2px 8px;background:#f0f4f8;border-radius:6px;font-size:10px;font-weight:bold;color:#444;text-transform:uppercase;">${v.statut.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                </div>`)
              .addTo(this.markersLayer);
          }
        }
      }
    });
  }

  loadOleiculteurs() {
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.oleiculteurs = users.filter((u: User) => u.role === 'OLEICULTEUR');
        this.cdr.detectChanges();
      }
    });
  }

  loadVergers() {
    this.loading = true;
    this.cdr.markForCheck();
    
    const request = this.isGrower 
      ? this.vergerService.getMyVergers() 
      : this.vergerService.getAllVergers();

    request.subscribe({
      next: (data: Verger[]) => {
        this.vergers = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.updateMapMarkers();
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

  toggleForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.newVerger = this.emptyVerger();
      if (this.isGrower) {
        this.newVerger.proprietaireId = this.currentUser()?.id || '';
      }
      this.isEditing = false;
      if (this.clickMarker && this.map) {
        this.map.removeLayer(this.clickMarker);
        this.clickMarker = null;
      }
    }
    this.cdr.markForCheck();
  }

  onCreateVerger() {
    if (!this.newVerger.nom || !this.newVerger.typeOlive || !this.newVerger.localisation || !this.newVerger.proprietaireId) {
      this.toastService.show('Veuillez remplir tous les champs requis.', 'error');
      return;
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
    if (isPlatformBrowser(this.platformId) && confirm('Supprimer ce verger?')) {
      this.vergerService.deleteVerger(id).subscribe({
        next: () => {
          this.toastService.show('Verger supprimé.', 'success');
          this.loadVergers();
        },
        error: () => this.toastService.show('Erreur suppression.', 'error')
      });
    }
  }
}
