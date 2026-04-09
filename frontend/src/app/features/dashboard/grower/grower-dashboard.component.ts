import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oleiculteur-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-6">
      <header class="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 class="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">Grower Portal</h1>
          <p class="text-on-surface-variant">Monitoring your orchards and tracking harvest yields.</p>
        </div>
        <div class="bg-tertiary-container/30 px-4 py-2 rounded-xl flex items-center gap-3 border border-tertiary/20">
          <span class="material-symbols-outlined text-tertiary">nature</span>
          <span class="font-label text-sm font-bold text-tertiary italic text-[10px]">1,200 Trees Active</span>
        </div>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:scale-[1.02] transition-all">
          <div class="p-3 bg-primary-container/20 rounded-xl text-primary w-fit mb-4">
            <span class="material-symbols-outlined">yard</span>
          </div>
          <p class="text-outline text-[10px] font-bold uppercase tracking-widest mb-1">Tree Health</p>
          <h3 class="text-3xl font-extrabold text-on-surface">92 <span class="text-sm font-medium text-outline">%</span></h3>
        </div>
        <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:scale-[1.02] transition-all">
          <div class="p-3 bg-secondary-container/20 rounded-xl text-secondary w-fit mb-4">
            <span class="material-symbols-outlined">trending_up</span>
          </div>
          <p class="text-outline text-[10px] font-bold uppercase tracking-widest mb-1">Yield Estimate</p>
          <h3 class="text-3xl font-extrabold text-on-surface">14.2 <span class="text-sm font-medium text-outline">Tons</span></h3>
        </div>
        <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:scale-[1.02] transition-all">
          <div class="p-3 bg-tertiary-container/20 rounded-xl text-tertiary w-fit mb-4">
            <span class="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <p class="text-outline text-[10px] font-bold uppercase tracking-widest mb-1">My Payments</p>
          <h3 class="text-3xl font-extrabold text-on-surface">8.4 <span class="text-sm font-medium text-outline">k TND</span></h3>
        </div>
        <div class="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:scale-[1.02] transition-all">
          <div class="p-3 bg-outline-variant/20 rounded-xl text-on-surface w-fit mb-4">
            <span class="material-symbols-outlined">water_drop</span>
          </div>
          <p class="text-outline text-[10px] font-bold uppercase tracking-widest mb-1">Soil Moisture</p>
          <h3 class="text-3xl font-extrabold text-on-surface">22 <span class="text-sm font-medium text-outline">%</span></h3>
        </div>
      </section>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <!-- Yield comparison chart placeholder -->
        <div class="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/5 h-[320px] flex flex-col">
          <h4 class="text-xl font-bold font-headline mb-6">Annual Yield Growth</h4>
          <div class="flex-grow flex items-end gap-6 h-full pt-10">
            <div class="w-full bg-outline-variant/10 rounded-t-lg h-[40%] text-center">
              <span class="text-[10px] font-bold text-outline -mt-6 block">2022</span>
            </div>
            <div class="w-full bg-outline-variant/20 rounded-t-lg h-[55%] text-center">
              <span class="text-[10px] font-bold text-outline -mt-6 block">2023</span>
            </div>
            <div class="w-full bg-primary text-on-primary rounded-t-lg h-[80%] shadow-lg shadow-primary/20 text-center">
              <span class="text-[10px] font-bold text-on-primary -mt-6 block italic">2024</span>
            </div>
          </div>
        </div>

        <div class="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/5">
          <h4 class="text-xl font-bold font-headline mb-6">Orchard Insights</h4>
          <div class="space-y-4">
            <div class="p-4 bg-tertiary-container/10 rounded-xl border border-tertiary/10">
              <p class="text-sm font-bold text-tertiary mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">tips_and_updates</span>
                Harvest Optimization
              </p>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                The Chemlali sectors in the Northern Slope are reaching peak maturity. Consider scheduling their harvest within the next 48 hours for maximum oil acidity quality.
              </p>
            </div>
            <div class="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <p class="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">verified</span>
                Organic Status
              </p>
              <p class="text-xs text-on-surface-variant leading-relaxed">
                Your plots successfully passed the 2024 organic certification renewal. Premium bonuses will apply to this year's harvest.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class OleiculteurDashboardComponent {}
