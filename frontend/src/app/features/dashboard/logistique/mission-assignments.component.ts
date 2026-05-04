import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { LogistiqueService, LogisticResource } from '../../../core/services/logistique.service';
import { VergerService } from '../../../core/services/verger.service';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-mission-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-[#fffcf5] p-8 pb-24">
      <header class="mb-12 max-w-7xl mx-auto">
        <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-2">
          <span class="w-10 h-[1px] bg-primary"></span>
          Contrôle Logistique
        </div>
        <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
          Missions <span class="text-primary italic">Assignées</span>
        </h1>
        <p class="text-on-surface-variant text-sm font-medium mt-1">Gérer l'approvisionnement logistique des opérations de récolte.</p>
      </header>

      <div class="max-w-7xl mx-auto">
        <div class="glass-panel overflow-hidden border-white shadow-xl animate-up p-8">
           <div *ngIf="myMissions.length === 0" class="text-center py-20 opacity-60">
              <span class="material-symbols-outlined text-6xl text-outline mb-4">assignment_turned_in</span>
              <p class="text-lg font-black text-on-surface">No Missions Assigned</p>
              <p class="text-xs font-bold text-outline">You are currently fully provisioned.</p>
           </div>

           <div *ngIf="myMissions.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngFor="let mission of myMissions" class="bg-surface-container-low/50 rounded-[2rem] border border-outline-variant/10 p-8 flex flex-col justify-between hover:shadow-2xl hover:border-primary/20 transition-all group">
                 <div>
                    <div class="flex justify-between items-start mb-4">
                       <h3 class="text-2xl font-black text-on-surface">{{ mission.description }}</h3>
                       <span class="px-3 py-1 bg-white border border-outline-variant/10 rounded-full text-[9px] font-black uppercase tracking-widest text-primary shadow-sm">{{ mission.statut }}</span>
                    </div>
                    <div class="space-y-2 mb-6">
                       <p class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-2"><span class="material-symbols-outlined text-sm">agriculture</span> Verger: <span class="text-on-surface">{{ mission.vergerName }}</span></p>
                       <p class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-2"><span class="material-symbols-outlined text-sm">person</span> Chef d'Équipe: <span class="text-on-surface">{{ mission.chefName }}</span></p>
                       <p class="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-2"><span class="material-symbols-outlined text-sm">calendar_month</span> Period: <span class="text-on-surface">{{ mission.startDate | date }} - {{ mission.endDate | date }}</span></p>
                    </div>

                    <div class="mb-4">
                        <h4 class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2 border-b border-outline-variant/10 pb-2">
Ressources actuellement provisionnées</h4>
                        <div *ngIf="!mission.requiredResources || mission.requiredResources.length === 0" class="text-xs font-bold text-outline italic">
                           Aucune ressource assignée.
                        </div>
                        <ul *ngIf="mission.requiredResources && mission.requiredResources.length > 0" class="space-y-1">
                           <li *ngFor="let res of mission.requiredResources" class="text-xs font-bold text-on-surface flex justify-between items-center bg-white p-2 rounded-lg border border-outline-variant/5">
                              <span>{{ res.resourceName }}</span>
                              <span class="px-2 py-0.5 bg-primary/10 text-primary rounded-md">{{ res.quantity }} units</span>
                           </li>
                        </ul>
                    </div>
                 </div>

                 <div class="flex gap-2">
                    <button (click)="openProvisionModal(mission)" class="flex-grow py-4 mt-6 rounded-2xl bg-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary hover:text-on-primary transition-all shadow-sm">
                       {{ mission.requiredResources && mission.requiredResources.length > 0 ? 'Update' : 'Provison' }}
                    </button>
                    <button *ngIf="mission.requiredResources && mission.requiredResources.length > 0 && !mission.logisticsReady" (click)="markReady(mission)" class="flex-grow py-4 mt-6 rounded-2xl bg-primary text-on-primary font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">
                       Marquer prêt
                    </button>
                    <button *ngIf="mission.logisticsReady" disabled class="flex-grow py-4 mt-6 rounded-2xl bg-green-500 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl opacity-80 cursor-not-allowed">
                       Prêt ✓
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <!-- Provision Modal -->
      <div *ngIf="showModal && activeMission" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
         <div class="bg-surface w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-up">
            <div class="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
               <div>
                  <h2 class="text-2xl font-black text-on-surface font-manrope">Provisioning Console</h2>
                  <p class="text-xs font-bold text-outline tracking-wider uppercase mt-1">Mission: {{ activeMission.description }}</p>
               </div>
               <div class="flex items-center gap-4">
                  <button (click)="suggestAiLogistics()" [disabled]="aiLoading" class="px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50">
                     <span *ngIf="!aiLoading" class="material-symbols-outlined text-[18px]">temp_preferences_custom</span>
                     <span *ngIf="aiLoading" class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                     <span class="text-[10px] font-black uppercase tracking-[0.2em]">{{ aiLoading ? 'Analyzing...' : 'AI Suggest' }}</span>
                  </button>
                  <button (click)="closeModal()" class="w-10 h-10 rounded-full hover:bg-outline-variant/20 flex items-center justify-center transition-colors">
                     <span class="material-symbols-outlined">close</span>
                  </button>
               </div>
            </div>

            <div class="flex-grow overflow-hidden flex flex-col md:flex-row">
               <!-- Inventory Library -->
               <div class="w-full md:w-2/3 border-r border-outline-variant/10 p-6 overflow-y-auto">
                  <h4 class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Available Inventory</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div *ngFor="let item of inventory" class="bg-white border border-outline-variant/15 p-4 rounded-2xl flex flex-col justify-between" [class.opacity-50]="item.stockLevel === 0">
                        <div>
                           <!-- Handle Item Image -->
                           <div class="h-24 w-full bg-surface-container-low rounded-xl mb-3 overflow-hidden flex items-center justify-center">
                              <img *ngIf="item.images && item.images.length > 0" [src]="getImageUrl(item.images[0])" alt="{{item.name}}" class="w-full h-full object-cover">
                              <span *ngIf="!item.images || item.images.length === 0" class="material-symbols-outlined text-outline/30 text-4xl">inventory_2</span>
                           </div>
                           <div class="flex justify-between items-start mb-1">
                              <span class="text-sm font-black text-on-surface leading-tight">{{ item.name }}</span>
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 uppercase">{{ item.type }}</span>
                           </div>
                           <p class="text-[10px] font-black text-primary mb-3">€{{ item.pricePerHour }}/h</p>
                        </div>
                        <div class="flex items-center justify-between mt-2">
                           <span class="text-[10px] font-black text-outline uppercase tracking-widest"><span [class.text-error]="item.stockLevel === 0" [class.text-primary]="item.stockLevel > 0">{{ item.stockLevel }}</span> Available</span>
                           <button [disabled]="item.stockLevel === 0" (click)="addToDraft(item)" class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors disabled:opacity-50">
                              <span class="material-symbols-outlined text-[16px]">add</span>
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               <!-- Draft Cart -->
               <div class="w-full md:w-1/3 p-6 bg-surface-container-low/20">
                  <h4 class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-4">Dispatch Draft</h4>
                   <div *ngIf="draftResources.length === 0" class="text-center py-10 opacity-50">
                      <span class="material-symbols-outlined text-3xl mb-2">shopping_cart</span>
                      <p class="text-[10px] font-black uppercase tracking-widest">Draft is empty</p>
                   </div>
                   <div class="space-y-3 max-h-[320px] overflow-y-auto">
                      <div *ngFor="let draft of draftResources; let i = index" class="bg-white p-3 rounded-xl border border-outline-variant/10 shadow-sm">
                         <div class="flex items-center justify-between gap-2">
                            <div class="flex-grow min-w-0">
                               <p class="text-xs font-black text-on-surface leading-tight">{{ draft.resourceName }}</p>
                               <div class="flex items-center gap-2 mt-2">
                                  <button (click)="updateDraftQuantity(i, -1)" class="w-5 h-5 rounded bg-surface-container flex items-center justify-center text-[10px] hover:bg-primary hover:text-white transition-colors">-</button>
                                  <span class="text-[10px] font-black text-primary">{{ draft.quantity }}</span>
                                  <button (click)="updateDraftQuantity(i, 1)" class="w-5 h-5 rounded bg-surface-container flex items-center justify-center text-[10px] hover:bg-primary hover:text-white transition-colors">+</button>
                               </div>
                            </div>
                            <button (click)="removeFromDraft(i)" class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center outline-none text-outline/40 hover:text-error hover:bg-error/10 transition-colors">
                               <span class="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                         </div>
                         <p *ngIf="draft.justification" class="mt-2 text-[10px] leading-relaxed text-on-surface-variant font-medium border-t border-outline-variant/10 pt-2">
                            <span class="text-[9px] font-black uppercase tracking-widest text-primary/80 block mb-0.5">Justification</span>
                            {{ draft.justification }}
                         </p>
                      </div>
                   </div>
                   <div *ngIf="aiSelectionJustification" class="mt-4 p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100">
                      <p class="text-[9px] font-black uppercase tracking-widest text-indigo-700 mb-2 flex items-center gap-1">
                         <span class="material-symbols-outlined text-[14px]">lightbulb</span>
                         Synthèse — choix des matériels
                      </p>
                      <p class="text-[11px] leading-relaxed text-indigo-950/90 font-medium whitespace-pre-wrap">{{ aiSelectionJustification }}</p>
                   </div>
               </div>
            </div>

            <div class="p-6 border-t border-outline-variant/10 bg-surface-container-low/30">
               <button (click)="finalizeProvisioning()" class="w-full py-4 rounded-2xl bg-primary text-on-primary font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                  {{ (activeMission.requiredResources || []).length > 0 ? 'Update Provisioning' : 'Confirmer' }}
               </button>
            </div>
         </div>
      </div>
    </div>
  `
})
export class MissionAssignmentsComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private logistiqueService = inject(LogistiqueService);
  private vergerService = inject(VergerService);
  private aiService = inject(AiService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private toastService = inject(ToastService);
  private dialogService = inject(DialogService);

  myMissions: Collecte[] = [];
  inventory: LogisticResource[] = [];
  
  showModal = false;
  aiLoading = false;
  activeMission: Collecte | null = null;
  draftResources: { resourceId: string; resourceName: string; quantity: number; justification?: string }[] =
    [];
  /** Justification globale renvoyée par l’IA (non enregistrée en base). */
  aiSelectionJustification: string | null = null;

  ngOnInit() {
     this.fetchData();
  }

  fetchData() {
     const uid = this.authService.currentUser()?.id;
     if (!uid) return;

     this.collecteService.getCollectes().subscribe(allMissions => {
        // Filter missions where logisticsUid matches current user
        this.myMissions = (allMissions || []).filter(c => c.logisticsUid === uid);
        this.cdr.detectChanges();
     });

     this.logistiqueService.getAllResources().subscribe(res => {
        this.inventory = res || [];
        this.cdr.detectChanges();
     });
  }

  openProvisionModal(mission: Collecte) {
     this.activeMission = mission;
     this.draftResources = JSON.parse(JSON.stringify(mission.requiredResources || []));
     this.aiSelectionJustification = null;
     this.showModal = true;
     this.cdr.detectChanges();
  }

  closeModal() {
     this.showModal = false;
     this.activeMission = null;
     this.draftResources = [];
     this.aiSelectionJustification = null;
     this.cdr.detectChanges();
  }

  addToDraft(item: LogisticResource) {
     const existing = this.draftResources.find(d => d.resourceId === item.id);
     if (existing) {
        if (existing.quantity >= item.stockLevel) {
           this.toastService.show(`Cannot exceed available inventory limit of ${item.stockLevel}.`, 'error');
           return;
        }
        existing.quantity++;
        } else {
        this.draftResources.push({
           resourceId: item.id!,
           resourceName: item.name,
           quantity: 1,
           justification: undefined
        });
     }
  }

  updateDraftQuantity(index: number, delta: number) {
     const draft = this.draftResources[index];
     const inventoryItem = this.inventory.find(inv => inv.id === draft.resourceId);
     
     if (delta > 0 && inventoryItem && draft.quantity >= inventoryItem.stockLevel) {
        this.toastService.show(`Inventory limit reached for ${inventoryItem.name}.`, 'error');
        return;
     }

     draft.quantity += delta;
     if (draft.quantity <= 0) {
        this.removeFromDraft(index);
     }
  }

  removeFromDraft(index: number) {
     this.draftResources.splice(index, 1);
  }

  finalizeProvisioning() {
     if (!this.activeMission || !this.activeMission.id) return;
     
     this.activeMission.requiredResources = this.draftResources.map((d) => ({
        resourceId: d.resourceId,
        resourceName: d.resourceName,
        quantity: d.quantity
     }));
     
     this.collecteService.updateCollecte(this.activeMission.id, this.activeMission).subscribe({
        next: () => {
           this.toastService.show('Provisioning successful. Mission updated.', 'success');
           this.closeModal();
           this.fetchData();
        },
        error: (err) => {
           this.toastService.show('Error provisioning resources.', 'error');
           console.error(err);
        }
     });
  }

  async markReady(mission: Collecte) {
     if (!mission.id) return;
     const isConfirmed = await this.dialogService.confirm('Logistics Protocol', 'Mark this mission as Logistics Ready? The Director will be notified.', 'info');
     if (isConfirmed) {
        mission.logisticsReady = true;
        this.collecteService.updateCollecte(mission.id, mission).subscribe({
           next: () => {
              this.dialogService.alert('Success', 'Mission marked ready for collection!', 'success');
              this.fetchData();
           },
           error: (err) => {
              console.error(err);
              this.dialogService.alert('Error', 'Error marking mission as ready.', 'danger');
           }
        });
     }
  }

  suggestAiLogistics() {
     if (!this.activeMission || !this.activeMission.vergerId) {
        this.toastService.show("Cannot identify Verger for analysis.", 'error');
        return;
     }
     this.aiLoading = true;
     this.cdr.detectChanges();

     // Fetch the verger details carefully needed for the prompt
     this.vergerService.getVergerById(this.activeMission.vergerId).subscribe({
        next: (verger) => {
           this.aiService.suggestLogistics(this.activeMission!, verger, this.inventory).subscribe({
              next: (result) => {
                 this.draftResources = [];
                 this.aiSelectionJustification = result.selectionJustification || null;
                 let warnings = 0;

                 result.resources.forEach((s) => {
                    const item = this.inventory.find((i) => i.id === s.resourceId);
                    if (item && item.stockLevel > 0) {
                       const safeQuantity = Math.min(s.quantity, item.stockLevel);
                       if (safeQuantity !== s.quantity) warnings++;
                       this.draftResources.push({
                          resourceId: item.id!,
                          resourceName: item.name,
                          quantity: safeQuantity,
                          justification: s.justification?.trim() || undefined
                       });
                    }
                 });

                 this.aiLoading = false;
                 this.toastService.show(`AI Provisioning Complete. ${warnings > 0 ? '(Adjusted for max stock limits)' : ''}`, 'success');
                 this.cdr.detectChanges();
              },
              error: (err) => {
                 this.aiLoading = false;
                 console.error(err);
                 this.dialogService.alert("AI Error", "Failed to reach AI cognitive core or parsing issue. Check API Key.", "danger");
                 this.cdr.detectChanges();
              }
           });
        },
        error: () => {
           this.aiLoading = false;
           this.toastService.show("Failed to load Verger context.", 'error');
           this.cdr.detectChanges();
        }
     });
  }

  getImageUrl(path: string): string {
     if (!path) return '';
     if (path.startsWith('http')) return path;
     return `http://localhost:8080/${path.startsWith('/') ? path.substring(1) : path}`;
  }
}
