import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { ParticipationService, Participation } from '../../../core/services/participation.service';
import { UserService } from '../../../core/services/user.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { WeatherWidgetComponent } from '../../../shared/components/weather-widget/weather-widget.component';

@Component({
  selector: 'app-team-lead-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, WeatherWidgetComponent],
  template: `
    <div class="max-w-7xl mx-auto py-6 pb-24 px-4 space-y-12">
      <!-- Branded Header -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 block">Centre de commande</span>
          <h1 class="text-5xl font-extrabold text-on-surface font-headline tracking-tighter leading-none">Opérations de l'équipe</h1>
          <p class="text-on-surface-variant font-medium mt-2 opacity-60 italic">Orchestration précise de la récolte.</p>
        </div>
        <div class="flex gap-4">
           <div class="bg-white/50 backdrop-blur-sm px-6 py-4 rounded-2xl border border-stone-100 shadow-sm flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined">groups</span>
              </div>
              <div>
                <span class="text-[9px] font-black text-outline uppercase tracking-wider block">Équipe active</span>
                <span class="text-lg font-black text-on-surface">{{ totalCrewCount }} Personnel</span>
              </div>
           </div>
        </div>
      </header>

      <!-- Weather Intelligence Widget -->
      <app-weather-widget></app-weather-widget>

      <!-- Harvest Agenda Strip -->
      <section class="space-y-6">
        <h4 class="text-xs font-black text-outline uppercase tracking-[0.2em] flex items-center gap-3">
          <span class="material-symbols-outlined text-sm">calendar_month</span>
          Agenda de récolte
        </h4>
        <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
           <div *ngFor="let day of agendaDays" 
                class="flex-shrink-0 w-24 p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1"
                [ngClass]="day.isActive ? 'bg-black text-white border-black scale-105 shadow-xl' : 'bg-white border-stone-100 text-on-surface hover:border-primary/30'">
             <span class="text-[9px] font-black uppercase tracking-widest opacity-60">{{ day.dayName }}</span>
             <span class="text-2xl font-black">{{ day.dayNum }}</span>
             <div *ngIf="day.hasMission" class="w-1.5 h-1.5 rounded-full mt-1" [ngClass]="day.isActive ? 'bg-primary' : 'bg-primary/40'"></div>
           </div>
        </div>
      </section>

      <!-- Main Operational Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Mission Cards & Recruitment -->
        <div class="lg:col-span-2 space-y-8">
           
           <!-- Active Mission Insight -->
           <div class="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm space-y-8">
              <div class="flex justify-between items-start">
                 <h4 class="text-2xl font-extrabold font-headline tracking-tight text-on-surface">Liste des missions</h4>
                 <div class="flex gap-2">
                   <button (click)="loadData()" class="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-outline hover:bg-stone-100 transition-colors">
                     <span class="material-symbols-outlined text-lg">refresh</span>
                   </button>
                 </div>
              </div>

              <div *ngIf="myCollectes.length === 0" class="py-20 text-center border-2 border-dashed border-stone-100 rounded-[2rem] text-outline italic">
                 Aucune mission assignée par la direction. Restez en attente.
              </div>

              <div class="space-y-6">
                 <div *ngFor="let col of myCollectes" class="group relative bg-stone-50/50 p-6 rounded-[2rem] border border-transparent hover:border-stone-200 transition-all hover:bg-white hover:shadow-lg">
                    <div class="flex flex-col md:flex-row gap-6">
                       <!-- Mission Info -->
                       <div class="flex-grow">
                          <div class="flex items-center gap-3 mb-2">
                             <span class="px-3 py-1 bg-white text-[9px] font-black text-outline uppercase tracking-[0.2em] rounded-full border border-stone-100 shadow-xs ring-1 ring-stone-900/5">{{ col.vergerName }}</span>
                             <span class="w-1.5 h-1.5 rounded-full" [ngClass]="col.statut === 'en_cours' ? 'bg-green-500 animate-pulse' : 'bg-stone-300'"></span>
                             <span class="text-[10px] font-bold text-outline uppercase tracking-widest">{{ col.statut }}</span>
                          </div>
                          <h3 class="text-2xl font-black text-on-surface mb-4">{{ col.description }}</h3>
                          
                           <div class="flex flex-wrap gap-4 text-[10px] font-bold text-outline/60 uppercase tracking-widest">

                             <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">schedule</span>
                                {{ col.startDate | date:'MMM d' }} - {{ col.endDate | date:'MMM d' }}
                             </div>
                             <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-sm">group</span>
                                {{ col.numberOfWorkers }} Ouvriers ciblés
                             </div>
                          </div>
                       </div>

                       <!-- Recruitment Control -->
                       <div class="flex flex-row md:flex-col gap-2 justify-end">
                          <button (click)="openManageWorkersModal(col)" 
                                  class="px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg font-black">person_add</span>
                            Recruter
                          </button>
                          
                          <!-- Redirection to specialized field ops -->
                          <button *ngIf="col.statut === 'en_cours'" 
                                  routerLink="/daily-harvest" 
                                  class="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-sm hover:opacity-90 transition-all flex items-center gap-2">
                            <span class="material-symbols-outlined text-lg font-black">track_changes</span>
                            Field Command
                          </button>
                          
                          <button *ngIf="col.statut === 'en_cours'" (click)="endCollecte(col)" class="px-6 py-3 bg-white text-stone-900 border border-stone-200 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-stone-50 transition-all active:scale-95">Complete</button>

                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <!-- Operational Intel (Charts) -->
           <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm relative overflow-hidden h-72">
                 <h5 class="text-sm font-black text-on-surface mb-2 uppercase tracking-widest">Capacité de l'équipe</h5>
                 <p class="text-[10px] font-medium text-outline mb-6">Déploiement en temps réel par rapport au quota.</p>
                 
                 <!-- Custom SVG Radial Chart -->
                 <div class="flex justify-center items-center h-full -mt-10">
                    <svg viewBox="0 0 36 36" class="w-32 h-32 transform -rotate-90">
                       <path class="text-stone-100 stroke-current" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                       <path class="text-primary stroke-current" [attr.stroke-dasharray]="crewCapacityPercent + ', 100'" stroke-width="3" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute text-center mt-2">
                       <span class="block text-3xl font-black text-on-surface">{{ crewCapacityPercent }}%</span>
                       <span class="text-[9px] text-outline font-black uppercase tracking-tighter">Affecté</span>
                    </div>
                 </div>
              </div>

              <div class="bg-[#1e1c12] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden h-72">
                 <h5 class="text-sm font-black text-white mb-2 uppercase tracking-widest">Évolution du rendement</h5>
                 <p class="text-[10px] font-medium text-white/40 mb-12">Trajectoire des performances par taille de verger.</p>
                 <div class="flex items-end justify-between gap-2 h-24">
                    <div *ngFor="let h of yieldHistory" class="flex-grow bg-white/10 rounded-t-lg transition-all hover:bg-primary" [style.height.%]="h"></div>
                 </div>
                 <div class="mt-4 flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                   <span>01 Oct</span><span>15 Oct</span><span>30 Oct</span>
                 </div>
              </div>
           </div>
        </div>

        <!-- Workforce Directory -->
        <div class="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm h-fit sticky top-24">
           <h4 class="text-xl font-black font-headline text-on-surface mb-2">Annuaire des effectifs</h4>
           <p class="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-8">Moissonneurs disponibles</p>
           
           <div class="space-y-4">
              <div *ngFor="let u of availableWorkers" class="flex items-center gap-4 p-4 rounded-2xl border border-stone-50 hover:bg-stone-50 transition-all group">
                 <div class="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-primary font-black text-xs uppercase shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                   {{ u.fullName.charAt(0) }}
                 </div>
                 <div class="flex-grow overflow-hidden">
                    <span class="block text-sm font-black text-on-surface truncate">{{ u.fullName }}</span>
                    <span class="text-[9px] text-outline font-bold uppercase tracking-widest">Spécialiste • Rang B</span>
                 </div>
                 <a [routerLink]="['/users']" class="text-outline hover:text-primary transition-colors">
                   <span class="material-symbols-outlined text-lg">info</span>
                 </a>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- RECRUITMENT MODAL (STONE STYLE) -->
    <div *ngIf="showWorkerModal && selectedCollecte" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-stone-900/60 backdrop-blur-md" (click)="showWorkerModal = false"></div>
      <div class="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-3xl flex flex-col overflow-hidden border border-stone-100 animate-slide-up">
        
        <header class="p-10 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
           <div>
              <span class="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1 block">Gestion des effectifs</span>
              <h3 class="text-3xl font-black text-on-surface font-headline">{{ selectedCollecte.description }}</h3>
           </div>
           <button (click)="showWorkerModal = false" class="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-outline hover:bg-black hover:text-white transition-all shadow-sm">
             <span class="material-symbols-outlined">close</span>
           </button>
        </header>

        <div class="flex-grow flex flex-col md:flex-row overflow-hidden">
           <!-- Active Table -->
           <div class="w-full md:w-1/2 flex flex-col overflow-y-auto p-10 space-y-6 border-r border-stone-100">
              <div class="flex justify-between items-end">
                <div>
                   <h5 class="text-[10px] font-black text-outline uppercase tracking-[0.3em] mb-1">Personnel actuel</h5>
                   <div class="text-sm font-black text-on-surface">
                      {{ participations.length }} <span class="text-outline">/ {{ selectedCollecte.numberOfWorkers || 0 }} Recruté(s)</span>
                   </div>
                </div>
                <!-- Progress Bar -->
                <div class="w-1/2">
                   <div class="flex justify-between items-center text-[9px] font-black uppercase tracking-widest mb-1 text-outline">
                      <span>Accomplissement</span>
                      <span [ngClass]="{'text-green-600': getRecruitmentProgress() >= 100}">{{ getRecruitmentProgress() }}%</span>
                   </div>
                   <div class="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                     <div class="h-full bg-black transition-all" [style.width.%]="getRecruitmentProgress()"></div>
                   </div>
                </div>
              </div>
              
              <div class="bg-stone-50 rounded-[2rem] overflow-hidden border border-stone-100 flex-grow">
                 <table class="w-full text-left">
                   <thead>
                     <tr class="bg-stone-100/50">
                       <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Moissonneur</th>
                       <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Statut</th>
                       <th class="px-6 py-5 text-right text-[9px] font-black text-outline uppercase tracking-widest">Finances</th>
                       <th class="px-6 py-5 text-right text-[9px] font-black text-outline uppercase tracking-widest">Séc</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-stone-100">
                     <tr *ngFor="let p of participations" class="hover:bg-white transition-all group">
                       <td class="px-6 py-4">
                          <p class="text-xs font-black text-on-surface leading-tight">{{ p.ouvrierName }}</p>
                       </td>
                       <td class="px-6 py-4">
                          <div class="flex items-center gap-1.5">
                             <div class="w-1.5 h-1.5 rounded-full" [ngClass]="{
                                'bg-primary': p.status === 'INVITED',
                                'bg-green-500': p.status === 'ACCEPTED' || p.status === 'ASSIGNED' || p.status === 'COMPLETED',
                                'bg-red-500': p.status === 'REJECTED'
                             }"></div>
                             <span class="text-[9px] font-black uppercase tracking-widest">{{ p.status }}</span>
                          </div>
                       </td>
                       <td class="px-6 py-4 text-right">
                          <span class="block text-[9px] font-bold text-outline mb-1">{{ p.dailySalary ? p.dailySalary + ' TND' : 'Non payé' }}</span>
                          <button (click)="payWorker(p.id!)" 
                                  [disabled]="p.salaryPaid"
                                  class="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                                  [ngClass]="p.salaryPaid ? 'bg-green-100 text-green-700 shadow-inner' : 'bg-white text-stone-900 border border-stone-200 hover:bg-black hover:text-white'">
                             {{ p.salaryPaid ? 'Payé' : 'Payer' }}
                          </button>
                       </td>
                       <td class="px-6 py-4 text-right">
                          <button (click)="removeWorker(p.id!)" class="w-6 h-6 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 ml-auto">
                             <span class="material-symbols-outlined text-[14px]">person_remove</span>
                          </button>
                       </td>
                     </tr>
                     <tr *ngIf="participations.length === 0">
                       <td colspan="4" class="py-12 text-center text-outline italic text-xs">Aucun personnel assigné.</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
           </div>

           <!-- Sidebar Directory (Now a Table) -->
           <div class="w-full md:w-1/2 bg-stone-50/50 p-10 overflow-y-auto space-y-6">
              <h5 class="text-[10px] font-black text-outline uppercase tracking-[0.3em]">Catalogue des ouvriers disponibles</h5>
               
              <div class="bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm">
                 <table class="w-full text-left">
                   <thead>
                     <tr class="bg-stone-100/50">
                       <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Nom de l'ouvrier</th>
                       <th class="px-6 py-5 text-[9px] font-black text-outline uppercase tracking-widest">Salaire journalier</th>
                       <th class="px-6 py-5 text-right text-[9px] font-black text-outline uppercase tracking-widest">Action</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-stone-100">
                     <tr *ngFor="let u of availableWorkers" class="hover:bg-stone-50 transition-all">
                        <td class="px-6 py-4">
                           <div class="flex items-center gap-3">
                              <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                                 {{ u.fullName.charAt(0) }}
                              </div>
                              <span class="text-xs font-black text-on-surface">{{ u.fullName }}</span>
                           </div>
                        </td>
                        <td class="px-6 py-4">
                           <div class="flex items-center gap-2">
                              <input type="number" [(ngModel)]="salaryInputs[u.id]" placeholder="Amt" class="w-16 px-2 py-1.5 text-[10px] font-bold bg-white border border-stone-200 rounded-lg outline-none focus:border-black transition-colors text-center shadow-inner">
                              <span class="text-[9px] font-black text-outline uppercase tracking-wider">TND</span>
                           </div>
                        </td>
                        <td class="px-6 py-4 text-right">
                           <button (click)="inviteWorker(u.id)" 
                                   [disabled]="isAlreadyInvited(u.id)"
                                   class="px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                                   [ngClass]="isAlreadyInvited(u.id) ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-black text-white hover:bg-stone-800 shadow-md active:scale-95'">
                             {{ isAlreadyInvited(u.id) ? 'Invité' : 'Envoyer une offre' }}
                           </button>
                        </td>
                     </tr>
                     <tr *ngIf="availableWorkers.length === 0">
                       <td colspan="3" class="py-12 text-center text-outline italic text-xs">Aucun ouvrier disponible.</td>
                     </tr>
                   </tbody>
                 </table>
              </div>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .custom-scrollbar::-webkit-scrollbar { height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e7e5e4; border-radius: 10px; }
  `]
})
export class ChefEquipeDashboardComponent implements OnInit {
  // --- Injections ---
  private collecteService = inject(CollecteService);
  private participationService = inject(ParticipationService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);

  // --- Propriétés d'état ---
  myCollectes: Collecte[] = [];
  availableWorkers: User[] = [];
  loading = false;
  
  totalCrewCount = 0;
  crewCapacityPercent = 0;
  yieldHistory = [30, 45, 60, 55, 80, 75, 90, 85];

  agendaDays = [
      { dayNum: '12', dayName: 'Mon', isActive: true, hasMission: true },
      { dayNum: '13', dayName: 'Tue', isActive: false, hasMission: true },
      { dayNum: '14', dayName: 'Wed', isActive: false, hasMission: false },
      { dayNum: '15', dayName: 'Thu', isActive: false, hasMission: true },
      { dayNum: '16', dayName: 'Fri', isActive: false, hasMission: false },
      { dayNum: '17', dayName: 'Sat', isActive: false, hasMission: false },
      { dayNum: '18', dayName: 'Sun', isActive: false, hasMission: false }
  ];

  showWorkerModal = false;
  selectedCollecte: Collecte | null = null;
  participations: Participation[] = [];
  salaryInputs: { [uid: string]: number } = {};

  // --- Logique Métier ---

  getRecruitmentProgress(): number {
    if(!this.selectedCollecte || !this.selectedCollecte.numberOfWorkers) return 0;
    const count = this.participations.filter(p => 
      ['ACCEPTED', 'ASSIGNED', 'COMPLETED', 'INVITED'].includes(p.status)
    ).length;
    return Math.min(Math.round((count / this.selectedCollecte.numberOfWorkers) * 100), 100);
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const uid = this.authService.currentUser()?.id;

    // Chargement des collectes
    this.collecteService.getCollectes().subscribe({
      next: (data) => {
        this.myCollectes = (data || []).filter(c => c.chefUid === uid);
        this.calculateStats();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => this.loading = false
    });

    // Chargement des ouvriers disponibles
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.availableWorkers = users.filter(u => u.role === 'OUVRIER_RECOLTE');
        this.cdr.detectChanges();
      }
    });

    // Appel API supplémentaire de ton collègue (monitoring global)
    this.http.get<Participation[]>('http://localhost:8080/api/participations/mine').subscribe({
      next: (all) => {
        // Logique de traitement global si nécessaire
      }
    });
  }

  calculateStats() {
    let assigned = this.totalCrewCount; 
    let target = 0;
    this.myCollectes.forEach(c => {
       target += c.numberOfWorkers || 0;
    });
    // Utilisation de la formule mathématique de ton collègue au lieu du 65% fixe
    this.crewCapacityPercent = target > 0 ? Math.round((assigned / target) * 100) : 0; 
  }

  openManageWorkersModal(c: Collecte) {
    this.selectedCollecte = c;
    this.showWorkerModal = true;
    this.loadParticipations(c.id!);
  }

  loadParticipations(colId: string) {
    this.collecteService.getParticipations(colId).subscribe({
      next: (data) => {
         this.participations = data || [];
         this.totalCrewCount = this.participations.filter(p => p.status === 'ACCEPTED' || p.status === 'ASSIGNED').length;
         this.calculateStats(); // Mise à jour des stats après chargement
         this.cdr.detectChanges();
      }
    });
  }

  isAlreadyInvited(workerUid: string): boolean {
    return this.participations.some(p => 
      p.ouvrierUid === workerUid && p.status !== 'REJECTED' && p.status !== 'REMOVED'
    );
  }

  inviteWorker(workerUid: string) {
    if (!this.selectedCollecte || !this.selectedCollecte.id) return;
    const salary = this.salaryInputs[workerUid] || 0;
    
    this.collecteService.inviteOuvrier(this.selectedCollecte.id, workerUid, salary).subscribe({
      next: () => {
          this.loadParticipations(this.selectedCollecte!.id!);
          this.salaryInputs[workerUid] = 0; // Reset
      },
      error: () => this.dialogService.alert("Erreur", "Échec de l'invitation de l'ouvrier.", "danger")
    });
  }

  payWorker(participationId: string) {
    this.participationService.payWorker(participationId).subscribe({
      next: () => this.loadParticipations(this.selectedCollecte!.id!),
      error: () => this.dialogService.alert("Erreur", "Échec du marquage du salaire comme payé.", "danger")
    });
  }

  // Fusion : Ta méthode confirmDelete avec ton DialogService (bien mieux que confirm())
  async removeWorker(participationId: string) {
    const isConfirmed = await this.dialogService.confirm(
      "Retirer un membre", 
      "Confirmer le retrait de l'ouvrier de la liste de mission ?", 
      "danger"
    );
    
    if (isConfirmed) {
      this.participationService.removeWorker(participationId).subscribe({
        next: () => this.loadParticipations(this.selectedCollecte!.id!),
        error: () => this.dialogService.alert("Erreur", "Échec du retrait de l'ouvrier.", "danger")
      });
    }
  }

  // Ajout de la méthode de ton collègue
  startCollecte(col: Collecte) {
    if (!col.id) return;
    this.collecteService.startCollecte(col.id).subscribe(() => this.loadData());
  }

  endCollecte(col: Collecte) {
    if (!col.id) return;
    this.collecteService.endCollecte(col.id).subscribe(() => this.loadData());
  }
}
