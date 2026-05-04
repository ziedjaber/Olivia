import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlerteService, Alerte } from '../../core/services/alerte.service';
import { VergerService, Verger } from '../../core/services/verger.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alerte-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <header class="mb-10 animate-in">
        <div class="flex items-center gap-2 text-error font-black text-[10px] uppercase tracking-[0.25em] mb-3 opacity-70">
          <span class="w-12 h-[1px] bg-error"></span>
          Protocole d'urgence
        </div>
        <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
          Signaler un <span class="text-error italic">incident</span>
        </h1>
        <p class="text-on-surface-variant text-sm font-medium mt-1">Soumettez les alertes terrain prioritaires directement au centre de commande.</p>
      </header>

      <div class="glass-panel p-8 border-white bg-white/40 shadow-2xl animate-up relative overflow-hidden">
        <!-- Warning Glow -->
        <div class="absolute -top-24 -right-24 w-64 h-64 bg-error/5 rounded-full blur-[100px] pointer-events-none"></div>

        <form (ngSubmit)="onSubmit()" class="space-y-8 relative z-10">
          <!-- INCIDENT TYPE & PRIORITY -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-outline uppercase tracking-widest">Categorie d'incident</label>
              <div class="relative group">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40 group-focus-within:text-error transition-colors">category</span>
                <select [(ngModel)]="report.type" name="type" required
                        class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 appearance-none outline-none focus:border-error/40 focus:bg-white text-sm font-bold text-on-surface transition-all shadow-inner">
                  <option value="MACHINE">Panne machine</option>
                  <option value="ACCIDENT">Medical / Accident</option>
                  <option value="INFRASTRUCTURE">Degat d'infrastructure</option>
                  <option value="WEATHER">Perturbation meteo</option>
                  <option value="OTHER">Autre probleme</option>
                </select>
                <span class="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 pointer-events-none">expand_more</span>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-black text-outline uppercase tracking-widest">Gravite de l'impact</label>
              <div class="flex gap-2">
                <button *ngFor="let imp of ['LOW', 'MEDIUM', 'URGENT']" 
                        type="button"
                        (click)="report.importance = imp"
                        [ngClass]="{
                          'bg-error text-white shadow-lg scale-105': report.importance === imp,
                          'bg-surface-container-low text-outline hover:bg-surface-container': report.importance !== imp
                        }"
                        class="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border border-outline-variant/5">
                  {{ imp }}
                </button>
              </div>
            </div>
          </div>

          <!-- TARGET SECTOR & LOCATION -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-3">
              <label class="text-[10px] font-black text-outline uppercase tracking-widest">Secteur / domaine concerne</label>
              <div class="relative group">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40 group-focus-within:text-error transition-colors">location_on</span>
                <select [(ngModel)]="report.vergerId" name="verger" (change)="onVergerChange()" required
                        class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 appearance-none outline-none focus:border-error/40 focus:bg-white text-sm font-bold text-on-surface transition-all shadow-inner">
                  <option value="">Selectionner un verger assigne...</option>
                  <option *ngFor="let v of assignedVergers" [value]="v.id">{{ v.nom }}</option>
                </select>
              </div>
            </div>

            <div class="space-y-3">
              <label class="text-[10px] font-black text-outline uppercase tracking-widest">Coordonnees de mission</label>
              <div class="relative group">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40 group-focus-within:text-error transition-colors">map</span>
                <input [(ngModel)]="report.localisation" name="loc" type="text" placeholder="lat, lng"
                       class="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 outline-none focus:border-error/40 focus:bg-white text-sm font-bold text-on-surface transition-all shadow-inner">
              </div>
            </div>
          </div>

          <!-- OPTICAL EVIDENCE (IMAGE GALLERY) -->
          <div class="space-y-4">
            <div class="flex justify-between items-end">
               <label class="text-[10px] font-black text-outline uppercase tracking-widest">Preuves visuelles</label>
               <span class="text-[9px] font-bold" [ngClass]="report.imageUrls!.length >= 5 ? 'text-error' : 'text-outline-variant'">
                  {{ report.imageUrls!.length }} / 5 FILES
               </span>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
               <!-- Existing Images -->
               <div *ngFor="let url of report.imageUrls; let i = index" 
                    class="relative aspect-square rounded-2xl overflow-hidden group shadow-md animate-in fade-in zoom-in duration-300">
                  <img [src]="url" class="w-full h-full object-cover">
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <button type="button" (click)="removeImage(i)" 
                             class="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center hover:scale-110 transition-transform">
                        <span class="material-symbols-outlined text-sm">delete</span>
                     </button>
                  </div>
               </div>

               <!-- Upload Zone -->
               <div *ngIf="report.imageUrls!.length < 5"
                    (dragover)="onDragOver($event)" 
                    (drop)="onDrop($event)"
                    (click)="fileInput.click()"
                    class="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer group shadow-inner"
                    [ngClass]="isDragging ? 'border-error bg-error/5 scale-[0.98]' : 'border-outline-variant/20 hover:border-error/40 hover:bg-error/[0.02]'">
                  <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden" multiple>
                  <span class="material-symbols-outlined text-outline-variant group-hover:text-error transition-colors mb-1">add_photo_alternate</span>
                  <span class="text-[9px] font-black uppercase text-outline-variant group-hover:text-error transition-colors">Ajouter photo</span>
               </div>
            </div>
            
            <div *ngIf="report.imageUrls!.length === 0" class="text-center py-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/5">
               <p class="text-[10px] font-bold text-outline-variant italic uppercase tracking-tighter">Aucune preuve jointe pour l'instant</p>
            </div>
          </div>

          <!-- DESCRIPTION -->
          <div class="space-y-4">
            <label class="text-[10px] font-black text-outline uppercase tracking-widest">Details de l'incident</label>
            <div class="relative">
              <span class="absolute left-4 top-4 material-symbols-outlined text-error/40">description</span>
              <textarea [(ngModel)]="report.description" name="desc" rows="4" required
                      class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-error/40 focus:bg-white rounded-[1.5rem] pl-12 pr-6 py-4 text-xs font-bold text-on-surface outline-none transition-all shadow-inner"
                      placeholder="Precisez ce qui s'est passe et les mesures immediates prises..."></textarea>
            </div>
          </div>

          <!-- SUBMIT ACTION -->
          <div class="pt-6">
            <button type="submit" [disabled]="loading"
                    class="w-full group relative overflow-hidden py-5 bg-error text-white font-black rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] hover:shadow-error/50 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-sm uppercase tracking-[0.2em] disabled:opacity-50">
              <span class="relative z-10 flex items-center justify-center gap-3">
                 <span *ngIf="loading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                 <span>{{ loading ? "Transmission en cours..." : "Transmettre" }}</span>
                 <span class="material-symbols-outlined text-[18px]">send</span>
              </span>
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </button>
            <p class="text-center text-[9px] font-bold text-outline uppercase tracking-widest mt-4 opacity-50">En transmettant, vous autorisez une intervention immediate du centre de commande.</p>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: radial-gradient(circle at 100% 0%, rgba(239,68,68,0.03) 0%, transparent 40%); min-height: 100vh; }
    .glass-panel {
      @apply bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2.5rem];
    }
    .animate-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AlerteReportComponent implements OnInit {
  private alerteService = inject(AlerteService);
  private vergerService = inject(VergerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  assignedVergers: Verger[] = [];
  loading = false;
  isDragging = false;

  report: Partial<Alerte> = {
    type: 'MACHINE',
    importance: 'MEDIUM',
    vergerId: '',
    description: '',
    imageUrls: [],
    localisation: '',
    statut: 'NON_TRAITEE'
  };

  ngOnInit() {
    this.loadAssigned();
    const user = this.authService.currentUser();
    if (user) {
      this.report.senderUid = user.id;
      this.report.senderName = user.fullName;
    }
  }

  loadAssigned() {
    this.vergerService.getAssignedVergers().subscribe({
      next: (data) => {
        this.assignedVergers = data;
        this.cdr.detectChanges();
      }
    });
  }

  onVergerChange() {
     const verger = this.assignedVergers.find(v => v.id === this.report.vergerId);
     if (verger) {
       this.report.localisation = verger.localisation;
     }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }
  onFileSelected(event: any) {
    if (event.target.files) {
      this.handleFiles(event.target.files);
    }
  }

  private handleFiles(files: FileList) {
    const remainingSlots = 5 - (this.report.imageUrls?.length || 0);
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.report.imageUrls?.push(e.target?.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.report.imageUrls?.splice(index, 1);
    this.cdr.detectChanges();
  }

  onSubmit() {
    if (!this.report.vergerId || !this.report.description) {
      this.toastService.show('Veuillez completer toutes les donnees essentielles de mission.', 'error');
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.toastService.show('Session expiree. Veuillez vous reconnecter.', 'error');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    // Ensure all critical fields are strictly assigned
    const finalReport: Alerte = {
      ...this.report,
      date: new Date().toISOString(),
      statut: 'NON_TRAITEE'
    } as Alerte;

    // Use legacy imageUrl for fallback if needed by older clients
    if (this.report.imageUrls && this.report.imageUrls.length > 0) {
       finalReport.imageUrl = this.report.imageUrls[0];
    }

    this.alerteService.reportAlerte(finalReport).subscribe({
      next: () => {
        this.toastService.show('Incident transmis au centre de commande.', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        console.error('[DIAGNOSTIC] TRANSMISSION FAILURE DATA:', err);
        if (err.error) {
           try {
             const detail = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
             console.error('[DIAGNOSTIC] SERVER MESSAGE:', detail);
             this.toastService.show(`Erreur relais : ${detail.message || 'Verification echouee'}`, 'error');
           } catch(e) {
             console.error('[DIAGNOSTIC] RAW ERROR BODY:', err.error);
             this.toastService.show('Echec de transmission. Verifiez integrite du relais.', 'error');
           }
        } else {
           this.toastService.show('Erreur reseau. Verifiez la connectivite serveur.', 'error');
        }
        this.cdr.markForCheck();
      }
    });
  }
}
