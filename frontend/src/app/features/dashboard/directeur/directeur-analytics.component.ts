import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, inject as injectFn, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AlerteService, Alerte } from '../../../core/services/alerte.service';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { UserService } from '../../../core/services/user.service';
import { VergerService, Verger } from '../../../core/services/verger.service';
import { User } from '../../../core/services/auth.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-directeur-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 p-6 bg-stone-50/50 rounded-[3rem] border border-stone-200/60">
      <header class="flex flex-col md:flex-row justify-between items-center gap-4 px-2">
        <div>
          <h2 class="text-2xl font-black text-on-surface tracking-tight uppercase">Intelligence Opérationnelle</h2>
          <p class="text-xs text-outline font-bold tracking-widest opacity-60 uppercase">Analyse des performances et risques</p>
        </div>
        
        <div class="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-200">
          <span class="text-[10px] font-black text-outline uppercase ml-3">Période :</span>
          <select [(ngModel)]="period" (change)="updateCharts()" 
                  class="bg-stone-100 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:bg-stone-200 transition-colors">
            <option value="7">7 Derniers Jours</option>
            <option value="30">30 Derniers Jours</option>
            <option value="365">Cette Année</option>
          </select>
        </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Chart 1: Alerts Distribution -->
        <div class="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col items-center">
          <h4 class="text-center text-[10px] font-black uppercase tracking-widest text-outline mb-8">Répartition des Alertes</h4>
          <div class="relative w-full aspect-square max-w-[220px]">
            <canvas #alertsChart></canvas>
          </div>
          <div class="mt-6 w-full space-y-2">
            <div *ngFor="let stat of alertStats" class="flex justify-between items-center text-[10px] px-2">
              <span class="flex items-center gap-2 font-bold uppercase tracking-wider text-outline">
                <span class="w-2 h-2 rounded-full" [style.backgroundColor]="stat.color"></span>
                {{ stat.name }}
              </span>
              <span class="font-black text-on-surface">{{ stat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Chart 2: Missions Trend -->
        <div class="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-outline mb-8 pl-4">Évolution des Récoltes</h4>
          <div class="w-full h-[300px]">
            <canvas #missionsChart></canvas>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- New Chart 3: Workforce Distribution -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-outline mb-8">Force de Travail par Rôle</h4>
          <div class="w-full h-[250px]">
            <canvas #workforceChart></canvas>
          </div>
        </div>

        <!-- New Visual: Maturity Status -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col justify-center">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-outline mb-6 text-center">Maturité Globale du Domaine</h4>
          <div class="flex flex-col items-center gap-6">
            <div class="relative w-32 h-32 flex items-center justify-center">
              <svg class="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" class="text-stone-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" stroke-width="8" fill="transparent" 
                        [style.stroke-dasharray]="364.4" 
                        [style.stroke-dashoffset]="364.4 * (1 - avgMaturity / 100)"
                        class="text-primary transition-all duration-1000" />
              </svg>
              <span class="absolute text-2xl font-black text-on-surface">{{ avgMaturity }}%</span>
            </div>
            <div class="text-center">
              <p class="text-sm font-bold text-on-surface">Moyenne de Maturité</p>
              <p class="text-[10px] text-outline font-medium max-w-[200px] mt-1 italic">Indicateur de préparation pour la récolte globale.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Decision Support Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div class="bg-primary/5 p-6 rounded-[2rem] border border-primary/10">
          <div class="flex items-center gap-3 mb-3">
             <span class="material-symbols-outlined text-primary">analytics</span>
             <h5 class="text-[10px] font-black uppercase text-primary tracking-widest">Taux de Résolution</h5>
          </div>
          <p class="text-2xl font-black text-primary">{{ resolutionRate }}%</p>
          <p class="text-[10px] font-medium text-primary/60 mt-1 italic">Alertes traitées versus totales</p>
        </div>

        <div class="bg-secondary/5 p-6 rounded-[2rem] border border-secondary/10">
          <div class="flex items-center gap-3 mb-3">
             <span class="material-symbols-outlined text-secondary">flash_on</span>
             <h5 class="text-[10px] font-black uppercase text-secondary tracking-widest">Urgence Moyenne</h5>
          </div>
          <p class="text-2xl font-black text-secondary">{{ urgentRatio }}%</p>
          <p class="text-[10px] font-medium text-secondary/60 mt-1 italic">Missions classées comme urgentes</p>
        </div>

        <div class="bg-tertiary/5 p-6 rounded-[2rem] border border-tertiary/10">
          <div class="flex items-center gap-3 mb-3">
             <span class="material-symbols-outlined text-tertiary">group</span>
             <h5 class="text-[10px] font-black uppercase text-tertiary tracking-widest">Activité Equipe</h5>
          </div>
          <p class="text-2xl font-black text-tertiary">{{ activeMissionsCount }}</p>
          <p class="text-[10px] font-medium text-tertiary/60 mt-1 italic">Missions en cours d'exécution</p>
        </div>

        <div class="bg-stone-100 p-6 rounded-[2rem] border border-stone-200">
          <div class="flex items-center gap-3 mb-3">
             <span class="material-symbols-outlined text-stone-600">report_problem</span>
             <h5 class="text-[10px] font-black uppercase text-stone-600 tracking-widest">Santé Vergers</h5>
          </div>
          <p class="text-2xl font-black text-stone-700">{{ riskScore }}%</p>
          <p class="text-[10px] font-medium text-stone-500 mt-1 italic">Indicateur de risque global</p>
        </div>
      </div>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DirecteurAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  private alerteService = inject(AlerteService);
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private vergerService = inject(VergerService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @ViewChild('alertsChart') alertsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('missionsChart') missionsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('workforceChart') workforceChartCanvas!: ElementRef<HTMLCanvasElement>;

  period = '30';
  alertChartInstance?: Chart;
  missionChartInstance?: Chart;
  workforceChartInstance?: Chart;

  allAlertes: Alerte[] = [];
  allCollectes: Collecte[] = [];
  allUsers: User[] = [];
  allVergers: Verger[] = [];

  alertStats: any[] = [];
  resolutionRate = 0;
  urgentRatio = 0;
  activeMissionsCount = 0;
  riskScore = 0;
  avgMaturity = 0;

  ngOnInit() {}

  ngAfterViewInit() {
    this.refreshData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.alertChartInstance) this.alertChartInstance.destroy();
    if (this.missionChartInstance) this.missionChartInstance.destroy();
  }

  refreshData() {
    forkJoin({
      alertes: this.alerteService.getAllAlertes(),
      collectes: this.collecteService.getCollectes(),
      users: this.userService.getAllUsers(),
      vergers: this.vergerService.getAllVergers()
    }).pipe(takeUntil(this.destroy$)).subscribe((res: { alertes: Alerte[], collectes: Collecte[], users: User[], vergers: Verger[] }) => {
      const { alertes, collectes, users, vergers } = res;
      this.allAlertes = alertes || [];
      this.allCollectes = collectes || [];
      this.allUsers = users || [];
      this.allVergers = vergers || [];
      this.updateCharts();
    });
  }

  updateCharts() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(this.period));

    // Filter by period
    const filteredAlerts = this.allAlertes.filter(a => new Date(a.date || '') >= cutoff);
    const filteredCollectes = this.allCollectes.filter(c => new Date(c.startDate || '') >= cutoff);

    this.calculateKPIs(filteredAlerts, filteredCollectes);
    this.renderAlertsChart(filteredAlerts);
    this.renderMissionsChart(filteredCollectes);
    this.renderWorkforceChart();
    this.calculateMaturity();
    
    this.cdr.detectChanges();
  }

  calculateKPIs(alerts: Alerte[], collectes: Collecte[]) {
    // Resolution Rate
    const solved = alerts.filter(a => a.statut === 'SOLVED').length;
    this.resolutionRate = alerts.length > 0 ? Math.round((solved / alerts.length) * 100) : 100;

    // Urgent Ratio
    const urgent = collectes.filter(c => c.type === 'urgente').length;
    this.urgentRatio = collectes.length > 0 ? Math.round((urgent / collectes.length) * 100) : 0;

    // Active
    this.activeMissionsCount = collectes.filter(c => c.statut === 'en_cours').length;

    // Risk Score (Alerts per mission ratio)
    this.riskScore = collectes.length > 0 ? Math.min(100, Math.round((alerts.length / (collectes.length * 2)) * 100)) : 0;
  }

  renderAlertsChart(alerts: Alerte[]) {
    if (this.alertChartInstance) this.alertChartInstance.destroy();

    const types = ['MACHINE', 'ACCIDENT', 'INFRASTRUCTURE', 'WEATHER', 'OTHER'];
    const colors = ['#3e5219', '#6b3b65', '#3e6842', '#ba1a1a', '#75796b'];
    const data = types.map(t => alerts.filter(a => a.type === t).length);

    this.alertStats = types.map((t, i) => ({ name: t, count: data[i], color: colors[i] }));

    this.alertChartInstance = new Chart(this.alertsChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: types,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        cutout: '75%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  renderMissionsChart(collectes: Collecte[]) {
    if (this.missionChartInstance) this.missionChartInstance.destroy();

    // Group by date
    const lastN = parseInt(this.period);
    const labels = [];
    const counts = [];
    
    for (let i = lastN - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      labels.push(dateStr);
      
      const count = collectes.filter(c => {
        const cDate = new Date(c.startDate || '');
        return cDate.getDate() === d.getDate() && cDate.getMonth() === d.getMonth();
      }).length;
      counts.push(count);
    }

    this.missionChartInstance = new Chart(this.missionsChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nombre de missions',
          data: counts,
          borderColor: '#3e5219',
          backgroundColor: 'rgba(62, 82, 25, 0.05)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#3e5219'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { display: false },
            ticks: { font: { size: 10, weight: 'bold' } }
          },
          x: { 
            grid: { display: false },
            ticks: { font: { size: 9, weight: 'bold' } }
          }
        }
      }
    });
  }

  renderWorkforceChart() {
    if (this.workforceChartInstance) this.workforceChartInstance.destroy();

    const roles = ['DIRECTEUR', 'RESPONSABLE_LOGISTIQUE', 'CHEF_EQUIPE_RECOLTE', 'OLEICULTEUR', 'OUVRIER_RECOLTE'];
    const data = roles.map(r => this.allUsers.filter(u => u.role === r).length);

    this.workforceChartInstance = new Chart(this.workforceChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Dir', 'Log', 'Chef', 'Prop', 'Ouvrier'],
        datasets: [{
          label: 'Effectifs',
          data: data,
          backgroundColor: '#3e5219',
          borderRadius: 8,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { display: false }, ticks: { font: { size: 9 } } },
          x: { grid: { display: false }, ticks: { font: { size: 9, weight: 'bold' } } }
        }
      }
    });
  }

  calculateMaturity() {
    if (this.allVergers.length === 0) {
      this.avgMaturity = 0;
      return;
    }
    const sum = this.allVergers.reduce((acc, v) => acc + (v.niveauMaturite || 0), 0);
    this.avgMaturity = Math.round(sum / this.allVergers.length);
  }
}
