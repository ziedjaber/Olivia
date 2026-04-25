import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-affected-vergers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Premium Header -->
      <header class="mb-10 animate-in">
        <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-3 opacity-70">
          <span class="w-12 h-[1px] bg-primary"></span>
          Operational Intelligence
        </div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
              Assigned <span class="text-primary italic">Orchards</span>
            </h1>
            <p class="text-on-surface-variant text-sm font-medium mt-1">Real-time maturity tracking and harvest readiness monitor.</p>
          </div>
          
          <!-- SEARCH & FILTER BAR -->
          <div class="w-full md:w-96 relative group animate-up">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary transition-colors">search</span>
            <input [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" type="text" 
                   placeholder="Search sectors or types..."
                   class="w-full bg-white/60 backdrop-blur-xl border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 focus:border-primary/40 focus:bg-white outline-none transition-all text-sm font-bold text-on-surface shadow-sm shadow-inner">
          </div>
        </div>
      </header>

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        <!-- Orchard Registry Table -->
        <div class="xl:col-span-8 space-y-6">
          <div class="glass-panel overflow-hidden border-white/40 shadow-xl animate-up">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-surface-container-low/50 border-b border-outline-variant/10">
                    <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Estate / Type</th>
                    <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Maturity Spectrum</th>
                    <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-outline">Last telemetry</th>
                    <th class="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-outline text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-outline-variant/5">
                  <tr *ngFor="let v of pagedVergers" 
                      (click)="selectVerger(v)"
                      class="cursor-pointer transition-all group"
                      [ngClass]="selectedVerger?.id === v.id ? 'bg-primary/[0.04]' : 'hover:bg-primary/[0.02]'">
                    <td class="px-6 py-5">
                      <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-surface border border-outline-variant/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                          <span class="material-symbols-outlined text-[20px]">landscape</span>
                        </div>
                        <div>
                          <p class="font-black text-on-surface tracking-tight">{{ v.nom }}</p>
                          <p class="text-[10px] text-outline font-bold uppercase tracking-wider">{{ v.localisation }} • {{ v.typeOlive }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                      <div class="w-48">
                         <div class="flex justify-between items-center mb-1.5">
                            <span class="text-[9px] font-black text-outline uppercase tracking-widest">Readiness</span>
                            <span class="text-xs font-black text-on-surface">{{ v.niveauMaturite || 0 }}%</span>
                         </div>
                         <div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r transition-all duration-1000 shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]"
                                 [style.width.%]="v.niveauMaturite"
                                 [ngClass]="(v.niveauMaturite || 0) >= 100 ? 'from-emerald-400 to-emerald-600' : 'from-primary/40 to-primary'"></div>
                         </div>
                      </div>
                    </td>
                    <td class="px-6 py-5">
                       <div class="flex flex-col">
                          <span class="text-xs font-bold text-on-surface">{{ v.dateDerniereMaturite ? (v.dateDerniereMaturite | date:'MMM d, HH:mm') : 'Pending' }}</span>
                          <span class="text-[9px] font-bold text-outline-variant uppercase tracking-tighter">{{ v.dateDerniereMaturite ? 'Verified update' : 'No telemetry yet' }}</span>
                       </div>
                    </td>
                    <td class="px-6 py-5 text-right">
                       <button class="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-primary transition-colors">
                          <span class="material-symbols-outlined text-[20px]">{{ selectedVerger?.id === v.id ? 'analytics' : 'chevron_right' }}</span>
                       </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="filteredVergers.length === 0" class="py-20 text-center opacity-30">
                 <span class="material-symbols-outlined text-5xl mb-3">radar</span>
                 <p class="text-[10px] font-black uppercase tracking-[0.2em]">No assigned sectors match criteria.</p>
              </div>
            </div>

            <!-- Pagination Footer -->
            <div *ngIf="totalPages > 1" class="px-8 py-5 bg-surface-container-low/50 border-t border-outline-variant/10 flex items-center justify-between">
               <span class="text-[10px] font-black text-outline uppercase tracking-widest">Page {{ currentPage }} of {{ totalPages }}</span>
               <div class="flex gap-2">
                  <button (click)="prevPage()" [disabled]="currentPage === 1" 
                          class="p-2 rounded-lg bg-surface border border-outline-variant/10 text-outline hover:text-primary disabled:opacity-30 transition-all">
                     <span class="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button (click)="nextPage()" [disabled]="currentPage === totalPages" 
                          class="p-2 rounded-lg bg-surface border border-outline-variant/10 text-outline hover:text-primary disabled:opacity-30 transition-all">
                     <span class="material-symbols-outlined">chevron_right</span>
                  </button>
               </div>
            </div>
          </div>
        </div>

        <!-- Maturity Command Center -->
        <div class="xl:col-span-4 sticky top-28 animate-up" style="animation-delay: 0.1s">
          <div *ngIf="selectedVerger" class="glass-panel p-8 border-white bg-white/40 shadow-2xl space-y-8 overflow-hidden relative">
            <!-- Background Glow -->
            <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div class="relative z-10">
              <header class="mb-8">
                <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Command Center</span>
                <h3 class="text-2xl font-black text-on-surface tracking-tighter flex items-center gap-2" style="font-family: Manrope, sans-serif;">
                  <span class="material-symbols-outlined text-primary">monitoring</span>
                  {{ selectedVerger.nom }}
                </h3>
              </header>

              <form (ngSubmit)="onUpdateMaturity()" class="space-y-8">
                <!-- Maturity Range Slider -->
                <div class="space-y-4">
                  <div class="flex justify-between items-end">
                    <label class="text-[10px] font-black text-outline uppercase tracking-widest">Maturity Spectrum</label>
                    <span class="text-3xl font-black text-primary tracking-tighter">{{ maturityData.niveauMaturite }}<small class="text-xs ml-0.5 opacity-40 uppercase">%</small></span>
                  </div>
                  <input type="range" name="niveau" [(ngModel)]="maturityData.niveauMaturite" min="0" max="100" step="1"
                         class="w-full h-2 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary">
                  <div class="flex justify-between text-[9px] font-black text-outline-variant uppercase tracking-widest">
                    <span>Premature</span>
                    <span>Peak Harvest</span>
                  </div>
                </div>

                <!-- Advanced Media Manager -->
                <div class="space-y-4">
                  <label class="text-[10px] font-black text-outline uppercase tracking-widest">Optical Telemetry (Photos)</label>
                  
                  <!-- Drag & Drop Area -->
                  <div (dragover)="onDragOver($event)" 
                       (drop)="onDrop($event)"
                       (click)="fileInput.click()"
                       class="relative group cursor-pointer border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all duration-500 overflow-hidden shadow-inner"
                       [ngClass]="isDragging ? 'border-primary bg-primary/5 scale-[0.98]' : 'border-outline-variant/20 hover:border-primary/40 hover:bg-primary/[0.02]'">
                    
                    <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">

                    <div *ngIf="!maturityData.imageMaturiteUrl" class="text-center animate-in fade-in zoom-in">
                       <div class="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                          <span class="material-symbols-outlined text-3xl">cloud_upload</span>
                       </div>
                       <p class="text-[10px] font-black text-on-surface tracking-tight uppercase mb-1">Drop Image Intelligence</p>
                       <p class="text-[9px] text-outline-variant font-medium italic">Supports JPG, PNG by drag or click</p>
                    </div>

                    <!-- Image Preview -->
                    <div *ngIf="maturityData.imageMaturiteUrl" class="absolute inset-0 group-hover:scale-105 transition-transform duration-1000">
                       <img [src]="maturityData.imageMaturiteUrl" class="w-full h-full object-cover">
                       <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                          <span class="material-symbols-outlined text-3xl mb-2">sync</span>
                          <span class="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
                       </div>
                    </div>
                  </div>
                </div>

                <!-- Observations -->
                <div class="space-y-4">
                  <label class="text-[10px] font-black text-outline uppercase tracking-widest">Field Observations</label>
                  <div class="relative">
                    <span class="absolute left-4 top-4 material-symbols-outlined text-primary/40">edit_note</span>
                    <textarea name="desc" [(ngModel)]="maturityData.descriptionMaturite" rows="4" 
                            class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] pl-12 pr-6 py-4 text-xs font-bold text-on-surface outline-none transition-all shadow-inner"
                            placeholder="Detail fruit condition, pest sightings, or weather impacts..."></textarea>
                  </div>
                </div>

                <div class="pt-4">
                  <button type="submit" [disabled]="loading"
                          class="w-full group relative overflow-hidden py-4 bg-primary text-on-primary font-black rounded-2xl shadow-[0_20px_50px_rgba(var(--primary-rgb),0.2)] hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-50">
                    <span class="relative z-10 flex items-center justify-center gap-3">
                       <span *ngIf="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                       <span>{{ loading ? 'Synchronizing...' : 'Authorize Telemetry Update' }}</span>
                    </span>
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div *ngIf="!selectedVerger && vergers.length > 0" class="glass-panel p-20 flex flex-col items-center justify-center text-center opacity-40 border-dashed animate-pulse">
             <div class="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-6 border border-outline-variant/10">
                <span class="material-symbols-outlined text-4xl">radar</span>
             </div>
             <h3 class="text-on-surface font-black text-sm uppercase tracking-widest">Radar Standby</h3>
             <p class="text-[10px] mt-2 font-medium italic">Select an orchard sector from the list to synchronize field data.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="range"] {
      background: linear-gradient(to right, var(--primary) 0%, var(--primary) var(--value), #f0f0f0 var(--value), #f0f0f0 100%);
    }
  `]
})
export class AffectedVergersComponent implements OnInit {
  private vergerService = inject(VergerService);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);

  vergers: Verger[] = [];
  selectedVerger: Verger | null = null;
  loading = false;
  isDragging = false;
  
  // --- Search & Pagination ---
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;

  maturityData = {
    niveauMaturite: 0,
    descriptionMaturite: '',
    imageMaturiteUrl: ''
  };

  ngOnInit() {
    this.loadAssigned();
  }

  loadAssigned() {
    this.loading = true;
    this.cdr.detectChanges(); // Fix NG0100

    this.vergerService.getAssignedVergers().subscribe({
      next: (data) => {
        this.vergers = data;
        this.loading = false;
        this.cdr.detectChanges(); // Finalize
      },
      error: () => {
        this.loading = false;
        this.toastService.show('Failed to load assigned orchards', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  selectVerger(v: Verger) {
    this.selectedVerger = v;
    this.maturityData = {
      niveauMaturite: v.niveauMaturite || 0,
      descriptionMaturite: v.descriptionMaturite || '',
      imageMaturiteUrl: v.imageMaturiteUrl || ''
    };
    this.cdr.detectChanges();
  }

  // --- Image Handling Logic ---
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.toastService.show('Please select an image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      this.maturityData.imageMaturiteUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  onUpdateMaturity() {
    if (!this.selectedVerger?.id) return;
    this.loading = true;
    this.cdr.detectChanges(); // Fix NG0100 before request

    this.vergerService.updateMaturite(this.selectedVerger.id, this.maturityData).subscribe({
      next: () => {
        this.loading = false;
        this.toastService.show('Telemetry successful!', 'success');
        this.loadAssigned();
      },
      error: () => {
        this.loading = false;
        this.toastService.show('Transmission protocol failed', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  // --- Search & Pagination Helpers ---
  get filteredVergers() {
    if (!this.searchTerm) return this.vergers;
    const s = this.searchTerm.toLowerCase();
    return this.vergers.filter(v => 
      v.nom.toLowerCase().includes(s) || 
      v.localisation.toLowerCase().includes(s) || 
      v.typeOlive.toLowerCase().includes(s)
    );
  }

  get pagedVergers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredVergers.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredVergers.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
}
