import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
    <div class="space-y-10 p-4 md:p-8 min-h-screen animate-fade-in font-headline text-[#1e1c12]">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-200/40 pb-10">
        <div class="space-y-2">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-[#3e5219] animate-pulse"></span>
            <span class="text-[10px] font-black text-[#3e5219] uppercase tracking-[0.4em]">Strategic Analytics</span>
          </div>
          <h1 class="text-4xl font-black tracking-tighter">Intelligence <span class="text-[#3e5219] italic">Opérationnelle</span></h1>
          <p class="text-[#1e1c12]/50 font-medium text-sm italic">Analyse prédictive et performance globale du domaine.</p>
        </div>
        
        <div class="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-2 rounded-[1.5rem] shadow-2xl shadow-[#3e5219]/5 border border-white/40 group transition-all duration-500 hover:scale-105">
          <span class="text-[10px] font-black text-[#1e1c12]/40 uppercase tracking-widest ml-4">Horizon Temporel :</span>
          <select [(ngModel)]="period" (change)="updateCharts()" 
                  class="bg-stone-900 text-white rounded-xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer hover:bg-[#3e5219] transition-all">
            <option value="7">7 Jours</option>
            <option value="30">30 Jours</option>
            <option value="365">Année</option>
          </select>
        </div>
      </header>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div class="kpi-card bg-emerald-50/30 border-emerald-100/50" style="--accent: #3e5219">
          <div class="kpi-icon bg-emerald-100/50 text-[#3e5219]">
            <span class="material-symbols-outlined">analytics</span>
          </div>
          <div class="space-y-1">
            <span class="text-[9px] font-black uppercase tracking-widest text-emerald-900/40">Taux de Résolution</span>
            <div class="flex items-baseline gap-1">
               <p class="text-3xl font-black text-emerald-950">{{ resolutionRate }}</p>
               <span class="text-xs font-bold text-emerald-950/40">%</span>
            </div>
          </div>
          <div class="kpi-glow"></div>
        </div>

        <div class="kpi-card bg-amber-50/30 border-amber-100/50" style="--accent: #d97706">
          <div class="kpi-icon bg-amber-100/50 text-amber-600">
            <span class="material-symbols-outlined">bolt</span>
          </div>
          <div class="space-y-1">
            <span class="text-[9px] font-black uppercase tracking-widest text-amber-900/40">Urgence Récolte</span>
            <div class="flex items-baseline gap-1">
               <p class="text-3xl font-black text-amber-950">{{ urgentRatio }}</p>
               <span class="text-xs font-bold text-amber-950/40">%</span>
            </div>
          </div>
          <div class="kpi-glow"></div>
        </div>

        <div class="kpi-card bg-stone-900 border-stone-800 text-white" style="--accent: #ffffff">
          <div class="kpi-icon bg-white/10 text-white">
            <span class="material-symbols-outlined">tactic</span>
          </div>
          <div class="space-y-1">
            <span class="text-[9px] font-black uppercase tracking-widest text-white/40">Missions Actives</span>
            <div class="flex items-baseline gap-1">
               <p class="text-3xl font-black">{{ activeMissionsCount }}</p>
               <span class="text-xs font-bold text-white/40">UNITÉS</span>
            </div>
          </div>
          <div class="kpi-glow"></div>
        </div>

        <div class="kpi-card bg-red-50/30 border-red-100/50" style="--accent: #dc2626">
          <div class="kpi-icon bg-red-100/50 text-red-600">
            <span class="material-symbols-outlined">warning</span>
          </div>
          <div class="space-y-1">
            <span class="text-[9px] font-black uppercase tracking-widest text-red-900/40">Score de Risque</span>
            <div class="flex items-baseline gap-1">
               <p class="text-3xl font-black text-red-950">{{ riskScore }}</p>
               <span class="text-xs font-bold text-red-950/40">%</span>
            </div>
          </div>
          <div class="kpi-glow"></div>
        </div>
      </div>

      <!-- Main Analytics Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Missions Evolution (Line Chart) -->
        <div class="lg:col-span-8 bg-white/60 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] flex flex-col group transition-all duration-700 hover:shadow-[0_48px_96px_-24px_rgba(62,82,25,0.12)]">
          <header class="flex justify-between items-center mb-12">
            <div class="space-y-1">
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-[#3e5219]">Flux de Production</h4>
              <p class="text-xl font-black tracking-tight">Évolution des Récoltes</p>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-stone-50 rounded-full border border-stone-100">
              <span class="w-2 h-2 rounded-full bg-[#3e5219]"></span>
              <span class="text-[9px] font-black uppercase tracking-widest text-stone-400">Total Missions</span>
            </div>
          </header>
          <div class="w-full h-[350px] relative">
            <canvas #missionsChart></canvas>
          </div>
        </div>

        <!-- Alert Distribution (Doughnut Chart) -->
        <div class="lg:col-span-4 bg-stone-950 p-10 rounded-[3.5rem] shadow-3xl flex flex-col items-center text-white overflow-hidden relative group">
          <div class="absolute inset-0 bg-gradient-to-br from-[#3e5219]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
          <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-10 relative z-10">Santé de l'Infrastructure</h4>
          <div class="relative w-full aspect-square max-w-[240px] z-10 scale-95 group-hover:scale-100 transition-transform duration-700">
            <canvas #alertsChart></canvas>
            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span class="text-[9px] font-black text-white/40 uppercase tracking-widest">Total</span>
              <span class="text-4xl font-black tracking-tighter">{{ allAlertes.length || 0 }}</span>
            </div>
          </div>
          <div class="mt-10 w-full space-y-4 relative z-10">
            <div *ngFor="let stat of alertStats" class="flex justify-between items-center group/item cursor-default">
              <span class="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/50 group-hover/item:text-white transition-colors">
                <span class="w-2 h-2 rounded-full shadow-[0_0_8px_var(--tw-shadow-color)]" [style.backgroundColor]="stat?.color" [style.--tw-shadow-color]="stat?.color"></span>
                {{ stat?.name }}
              </span>
              <span class="text-sm font-black text-white/80">{{ stat?.count || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Workforce (Bar Chart) -->
        <div class="lg:col-span-6 bg-white/60 backdrop-blur-2xl p-10 rounded-[3.5rem] border border-white/60 shadow-xl">
          <header class="flex justify-between items-center mb-10">
            <div class="space-y-1">
              <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-[#3e5219]">Capital Humain</h4>
              <p class="text-xl font-black tracking-tight">Répartition des Effectifs</p>
            </div>
          </header>
          <div class="w-full h-[280px]">
            <canvas #workforceChart></canvas>
          </div>
        </div>

        <!-- Maturity (Circular Progress) -->
        <div class="lg:col-span-6 bg-gradient-to-br from-[#3e5219] to-[#1e290b] p-10 rounded-[3.5rem] shadow-2xl shadow-[#3e5219]/20 text-white flex flex-col items-center justify-center relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-1000"></div>
          
          <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-8 relative z-10 text-center">Préparation Globale</h4>
          <div class="flex flex-col items-center gap-8 relative z-10">
            <div class="relative w-44 h-44 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
              <svg class="w-full h-full -rotate-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <circle cx="88" cy="88" r="80" stroke="rgba(255,255,255,0.1)" stroke-width="12" fill="transparent" />
                <circle cx="88" cy="88" r="80" stroke="white" stroke-width="12" fill="transparent" 
                        stroke-linecap="round"
                        [style.stroke-dasharray]="502.4" 
                        [style.stroke-dashoffset]="502.4 * (1 - (avgMaturity || 0) / 100)"
                        class="transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1)" />
              </svg>
              <div class="absolute flex flex-col items-center">
                <span class="text-5xl font-black tracking-tighter">{{ avgMaturity || 0 }}<span class="text-xl opacity-40">%</span></span>
                <span class="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Maturité</span>
              </div>
            </div>
            <div class="text-center space-y-2">
              <p class="text-lg font-black tracking-tight leading-none italic">Statut du Domaine</p>
              <p class="text-[10px] text-white/50 font-medium max-w-[240px] uppercase tracking-widest">Calculé sur la base de {{ allVergers.length || 0 }} vergers actifs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; overflow-x: hidden; }
    
    .animate-fade-in { animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .kpi-card {
      position: relative;
      padding: 2.5rem 2rem;
      border-radius: 2.5rem;
      border-width: 1px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      overflow: hidden;
      transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
    }

    .kpi-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 40px 80px -20px rgba(0,0,0,0.12);
    }

    .kpi-icon {
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 1.25rem;
      display: flex;
      items-center: center;
      justify-content: center;
      transition: all 0.5s ease;
    }

    .kpi-card:hover .kpi-icon {
      transform: rotate(12deg) scale(1.1);
    }

    .kpi-glow {
      position: absolute;
      bottom: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      background: var(--accent);
      filter: blur(40px);
      opacity: 0.1;
      transition: opacity 0.5s ease;
    }

    .kpi-card:hover .kpi-glow {
      opacity: 0.3;
    }

    .shadow-3xl {
      box-shadow: 0 40px 100px -30px rgba(0,0,0,0.3);
    }

    /* Hide scrollbar */
    ::-webkit-scrollbar { width: 0px; background: transparent; }
  `],
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

  ngOnInit() { }

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
    const colors = ['#3e5219', '#d97706', '#0f172a', '#dc2626', '#75796b'];
    const data = types.map(t => alerts.filter(a => a.type === t).length);

    this.alertStats = types.map((t, i) => ({ name: t, count: data[i], color: colors[i] }));

    this.alertChartInstance = new Chart(this.alertsChartCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: types,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        cutout: '82%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            titleFont: { size: 10, weight: 'bold' },
            bodyFont: { size: 10 },
            displayColors: false
          }
        }
      }
    });
  }

  renderMissionsChart(collectes: Collecte[]) {
    if (this.missionChartInstance) this.missionChartInstance.destroy();

    const ctx = this.missionsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(62, 82, 25, 0.4)');
    gradient.addColorStop(1, 'rgba(62, 82, 25, 0)');

    const lastN = parseInt(this.period);
    const labels = [];
    const counts = [];

    for (let i = lastN - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));

      const count = collectes.filter(c => {
        const cDate = new Date(c.startDate || '');
        return cDate.getDate() === d.getDate() && cDate.getMonth() === d.getMonth();
      }).length;
      counts.push(count);
    }

    this.missionChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Récoltes',
          data: counts,
          borderColor: '#3e5219',
          borderWidth: 4,
          backgroundColor: gradient,
          fill: true,
          tension: 0.45,
          pointRadius: 6,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#3e5219',
          pointBorderWidth: 2,
          pointHoverRadius: 8,
          pointHoverBackgroundColor: '#3e5219'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: '#1e1c12',
            padding: 15,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { size: 12 }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.03)', drawTicks: false },
            border: { display: false },
            ticks: { padding: 10, font: { size: 9, weight: 'bold' }, color: '#1e1c12/40' }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { padding: 10, font: { size: 9, weight: 'bold' }, color: '#1e1c12/40' }
          }
        }
      }
    });
  }

  renderWorkforceChart() {
    if (this.workforceChartInstance) this.workforceChartInstance.destroy();

    const ctx = this.workforceChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#3e5219');
    gradient.addColorStop(1, '#a3b18a');

    const roles = ['DIRECTEUR', 'RESPONSABLE_LOGISTIQUE', 'CHEF_EQUIPE_RECOLTE', 'OLEICULTEUR', 'OUVRIER_RECOLTE'];
    const data = roles.map(r => this.allUsers.filter(u => u.role === r).length);

    this.workforceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Dir.', 'Log.', 'Chef', 'Prop.', 'Ouvrier'],
        datasets: [{
          data: data,
          backgroundColor: gradient,
          borderRadius: 12,
          barThickness: 32,
          hoverBackgroundColor: '#1e1c12'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.03)', drawTicks: false },
            border: { display: false },
            ticks: { stepSize: 1, font: { size: 9, weight: 'bold' } }
          },
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { font: { size: 10, weight: 'bold' } }
          }
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
