import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CollecteService, Collecte } from '../../../core/services/collecte.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/services/auth.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ResourceOrderService, ResourceOrder } from '../../../core/services/resource-order.service';
import { Participation } from '../../../core/services/participation.service';

interface Verger {
  id: string;
  nom: string;
  niveauMaturite: number;
  statut: string;
  descriptionMaturite?: string;
  imageMaturiteUrl?: string;
  dateDerniereMaturite?: string;
  responsableName?: string;
}

@Component({
  selector: 'app-harvest-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Premium Header -->
      <header class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in">
        <div>
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-2 opacity-70">
            <span class="w-10 h-[1px] bg-primary"></span>
            Estate Control
          </div>
          <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            Harvest <span class="text-primary italic">Mission Pipeline</span>
          </h1>
          <p class="text-on-surface-variant text-sm font-medium mt-1 italic">Strategic oversight and deployment of harvest campaigns.</p>
        </div>
        
        <div class="flex gap-4">
           <button (click)="loadData()" class="p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-outline-variant/10 hover:bg-white hover:scale-105 transition-all shadow-sm">
             <span class="material-symbols-outlined text-outline">refresh</span>
           </button>
           <button (click)="openCreateModal()" 
                  class="bg-primary text-on-primary px-8 py-3.5 font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
            <span class="material-symbols-outlined">add_task</span>
            Initialize Mission
          </button>
        </div>
      </header>

      <!-- SEARCH BAR -->
      <div class="mb-8 animate-up">
        <div class="relative group">
          <span class="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary transition-colors">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" type="text" 
                 placeholder="Filter missions by title, orchard name, or assigned lead..."
                 class="w-full bg-white/60 backdrop-blur-xl border border-outline-variant/10 rounded-3xl pl-14 pr-6 py-5 focus:border-primary/40 focus:bg-white outline-none transition-all text-sm font-bold text-on-surface shadow-sm focus:shadow-xl">
        </div>
      </div>

      <!-- Mission Table -->
      <div class="glass-panel overflow-hidden border-white shadow-2xl animate-up">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low/50 border-b border-outline-variant/10">
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Campaign / Locale</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Leadership</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-center">Orchard Readiness</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Mission Track</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/5">
              <tr *ngFor="let c of pagedCollectes" class="hover:bg-primary/[0.02] transition-colors group">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary border border-outline-variant/10 group-hover:scale-110 transition-transform">
                      <span class="material-symbols-outlined">agriculture</span>
                    </div>
                    <div>
                      <p class="font-black text-on-surface text-lg tracking-tight">{{ c.description }}</p>
                      <div class="flex items-center gap-1.5 text-[10px] text-outline font-black uppercase tracking-widest opacity-60">
                         <span class="material-symbols-outlined text-[14px]">yard</span>
                         {{ c.vergerName }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <div class="flex items-center gap-3">
                     <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary/60 border border-outline-variant/10">
                        <span class="material-symbols-outlined text-sm">person</span>
                     </div>
                     <div>
                        <p class="text-sm font-black text-on-surface tracking-tight">{{ c.chefName }}</p>
                        <p class="text-[9px] text-outline font-black uppercase tracking-widest">{{ c.numberOfWorkers }} Crew Members</p>
                     </div>
                  </div>
                </td>
                <td class="px-8 py-6 text-center">
                   <!-- UNIQUE MATURITY PROGRESS PER MISSION'S ORCHARD -->
                   <div class="w-40 mx-auto" *ngIf="getVergerForMission(c.vergerId) as v">
                      <div class="flex justify-between items-center mb-1.5">
                        <span class="text-[9px] font-black text-outline uppercase">Maturity Status</span>
                        <span class="text-xs font-black text-on-surface">{{ v.niveauMaturite }}%</span>
                      </div>
                      <div class="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="v.niveauMaturite"></div>
                      </div>
                   </div>
                   <div *ngIf="!getVergerForMission(c.vergerId)" class="text-[10px] font-black text-error/40 uppercase tracking-widest italic">
                      Orchard Sync Lost
                   </div>
                </td>
                <td class="px-8 py-6">
                   <div class="flex items-center gap-3">
                      <span class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border"
                            [ngClass]="{
                              'bg-primary/5 text-primary border-primary/20': c.statut === 'PLANNED',
                              'bg-primary text-on-primary border-transparent shadow-primary/20': c.statut === 'en_cours',
                              'bg-emerald-50 text-emerald-700 border-emerald-100': c.statut === 'termine'
                            }">
                         {{ c.statut === 'PLANNED' ? 'LOGISTICS STAGE' : (c.statut?.replace('_', ' ') || 'UNKNOWN') }}
                      </span>
                   </div>
                </td>
                <td class="px-8 py-6 text-right">
                  <div class="flex justify-end items-center gap-2 flex-wrap">
                     <span *ngIf="c.logisticsReady" class="px-2 py-1 rounded-full bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">local_shipping</span> Log</span>
                     <span *ngIf="c.workersReady" class="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[8px] font-black uppercase tracking-widest flex items-center gap-1"><span class="material-symbols-outlined text-[10px]">group</span> Crew</span>
                    <button (click)="onEditMission(c)" class="w-10 h-10 rounded-xl bg-white border border-outline-variant/20 text-outline hover:text-primary transition-all flex items-center justify-center shadow-sm" title="Modify Mission">
                      <span class="material-symbols-outlined text-[18px]">edit_note</span>
                    </button>
                    <button (click)="onDeleteMission(c)" class="w-10 h-10 rounded-xl bg-white border border-error/10 text-error/40 hover:text-error transition-all flex items-center justify-center shadow-sm" title="Purge Mission">
                      <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                    </button>
                    <!-- UNIQUE INTEL BUTTON PER MISSION'S ORCHARD -->
                    <button (click)="openIntelligence(c.vergerId)" 
                            class="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform" 
                            title="View Maturity Intelligence (Chef Equipe Updates)">
                      <span class="material-symbols-outlined text-[18px]">assignment_returned</span>
                    </button>
                    <!-- VIEW ASSETS BUTTON -->
                    <button (click)="viewAssets(c)"
                            class="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors text-primary flex items-center justify-center border border-outline-variant/10 shadow-sm"
                            title="View Assigned Resources (Logistics & Crew)">
                      <span class="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                      <!-- Launch Collection: visible when both flags true AND today matches start date -->
                      <button *ngIf="canLaunch(c)" (click)="launchCollection(c)"
                              class="px-4 py-2 rounded-xl bg-green-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">rocket_launch</span> Launch
                      </button>

                      <!-- Plan Trituration: visible when mission is finished -->
                      <button *ngIf="c.statut === 'termine'" (click)="goToTrituration()"
                              class="px-4 py-2 rounded-xl bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">oil_barrel</span> Plan Trituration
                      </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div *ngIf="totalPages > 1" class="px-8 py-6 bg-surface-container-low/50 border-t border-outline-variant/10 flex items-center justify-between">
           <span class="text-[10px] font-black text-outline uppercase tracking-widest opacity-60">Listing Mission Unit {{ (currentPage-1)*itemsPerPage + 1 }} - {{ Math.min(currentPage*itemsPerPage, filteredCollectes.length) }}</span>
           <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="px-4 py-2 rounded-xl bg-white border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-outline hover:text-primary disabled:opacity-30 transition-all">Prev</button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="px-4 py-2 rounded-xl bg-white border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-outline hover:text-primary disabled:opacity-30 transition-all">Next</button>
           </div>
        </div>
      </div>
    </div>

    <!-- TELEMETRY HUB MODAL -->
    <div *ngIf="showTelemetryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
        <div class="bg-surface w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-up">
            <div class="p-10 border-b border-outline-variant/10 flex justify-between items-center">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2">Team Lead Reports</span>
                    <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.nom }}</h3>
                    <div class="flex items-center gap-2 mt-2">
                       <span class="text-[10px] font-black text-outline uppercase tracking-widest italic text-on-surface">Transmission Lead: {{ selectedVergerForTelemetry?.responsableName || 'Field Team' }}</span>
                    </div>
                </div>
                <button (click)="showTelemetryModal = false" class="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div class="space-y-8">
                    <div>
                       <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-4">Maturity Analysis</label>
                       <div class="flex items-end gap-2 mb-2">
                           <span class="text-5xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.niveauMaturite }}%</span>
                       </div>
                       <div class="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                           <div class="h-full bg-primary transition-all duration-1000" [style.width.%]="selectedVergerForTelemetry?.niveauMaturite"></div>
                       </div>
                    </div>
                    <div class="p-6 bg-surface-container-lowest rounded-[2rem] border border-outline-variant/10 shadow-inner">
                        <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-2">Field Notes</label>
                        <p class="text-sm font-medium text-on-surface-variant leading-relaxed italic">
                            "{{ selectedVergerForTelemetry?.descriptionMaturite || 'No field notes provided.' }}"
                        </p>
                    </div>
                </div>
                <div class="space-y-4">
                    <label class="text-[10px] font-black text-outline uppercase tracking-widest block">Optical Evidence</label>
                    <div class="aspect-square rounded-[2rem] overflow-hidden bg-surface-container border border-outline-variant/10 shadow-inner">
                        <img *ngIf="selectedVergerForTelemetry?.imageMaturiteUrl" [src]="selectedVergerForTelemetry?.imageMaturiteUrl" class="w-full h-full object-cover">
                    </div>
                </div>
            </div>

            <div class="p-10 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-end">
                <button (click)="showTelemetryModal = false" class="bg-primary text-on-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Dismiss intelligence</button>
            </div>
        </div>
    </div>

    <!-- CREATE/MODIFY MISSION MODAL -->
    <div *ngIf="showCreateModal" 
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div class="bg-surface w-full max-w-2xl max-h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-up">
        
        <button (click)="closeCreateModal()" class="absolute top-10 right-10 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center text-white z-20">
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>

        <div class="p-12 border-b border-outline-variant/10 relative">
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">
            <span class="w-6 h-0.5 bg-primary"></span>
            Mission Architecture
          </div>
          <h3 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            {{ isEditing ? 'Modification' : 'Deployment' }} <span class="text-primary italic">Protocol</span>
          </h3>
        </div>
        
        <div class="p-12 overflow-y-auto flex-grow space-y-12">
           <div class="space-y-6">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Campaign Nomenclature</label>
                <input [(ngModel)]="newCollecte.description" 
                       class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all shadow-inner" 
                       placeholder="e.g. Peak Harvest Ridge System 2024">
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Target Estate</label>
                  <select [(ngModel)]="newCollecte.vergerId" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer">
                    <option [value]="null">Select Evaluated Estate</option>
                    <option *ngFor="let v of allVergers" [value]="v.id">{{ v.nom }} ({{ v.niveauMaturite }}%)</option>
                  </select>
                </div>
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Assigned Lead</label>
                  <select [(ngModel)]="newCollecte.chefUid" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer">
                    <option [value]="null">Assign Campaign Lead</option>
                    <option *ngFor="let c of chefs" [value]="c.id">{{ c.fullName }}</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Logistics Manager</label>
                  <select [(ngModel)]="newCollecte.logisticsUid" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer">
                    <option [value]="undefined">Assign Logistics Manager</option>
                    <option *ngFor="let rm of logisticsManagers" [value]="rm.id">{{ rm.fullName }}</option>
                  </select>
                </div>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-outline-variant/10">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Inception</label>
                <input type="date" [(ngModel)]="newCollecte.startDate" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Termination</label>
                <input type="date" [(ngModel)]="newCollecte.endDate" class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Crew Size</label>
                <input type="number" [(ngModel)]="newCollecte.numberOfWorkers" 
                       class="w-full bg-surface-container-low border border-outline-variant/10 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-black text-on-surface outline-none transition-all">
              </div>
           </div>
        </div>

        <div class="p-12 border-t border-outline-variant/10 flex justify-end gap-6 bg-surface-container-low/30 backdrop-blur-md">
           <button (click)="closeCreateModal()" class="px-8 py-3 font-black text-[10px] text-outline hover:text-on-surface transition-all tracking-widest uppercase">Discard Process</button>
           <button (click)="submitCollecte()" 
                   class="px-12 py-4 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-2xl hover:scale-105 transition-all tracking-widest uppercase">
                {{ isEditing ? 'Confirm Update' : 'Deploy Campaign' }}
           </button>
        </div>
      </div>
    </div>

    <!-- ASSETS MODAL -->
    <div *ngIf="showAssetsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in">
        <div class="bg-surface w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 animate-up">
            <div class="p-10 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30 backdrop-blur-md">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2">Resource Allocation</span>
                    <h3 class="text-3xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">{{ selectedMissionForAssets?.description }}</h3>
                </div>
                <button (click)="showAssetsModal = false" class="w-12 h-12 rounded-full bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-10 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-container-lowest">
                
                <!-- Workers Column -->
                <div class="space-y-6">
                   <div class="flex items-center gap-3 text-primary mb-4 border-b border-outline-variant/10 pb-4">
                      <span class="material-symbols-outlined text-2xl">group</span>
                      <h4 class="font-black text-lg tracking-tight">Assigned Crew</h4>
                      <span class="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{{ missionWorkers.length }}</span>
                   </div>
                   
                   <div *ngIf="isLoadingAssets" class="text-xs text-outline italic">Loading crew data...</div>
                   <div *ngIf="!isLoadingAssets && missionWorkers.length === 0" class="text-xs text-outline italic bg-surface-container-low p-6 rounded-3xl text-center">No crew assigned yet.</div>
                   
                   <div class="space-y-3">
                      <div *ngFor="let w of missionWorkers" class="bg-white p-4 rounded-3xl border border-outline-variant/10 flex items-center gap-4 hover:shadow-md transition-shadow">
                         <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                            {{ w.ouvrierName.charAt(0) || 'U' }}
                         </div>
                         <div class="flex-grow">
                            <p class="font-bold text-sm text-on-surface leading-none mb-1">{{ w.ouvrierName }}</p>
                            <p class="text-[9px] font-black tracking-widest text-outline uppercase">{{ w.status }}</p>
                         </div>
                         <div class="text-right">
                            <p class="text-[10px] font-black tracking-widest text-primary">{{ w.dailySalary }} TND/day</p>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- Logistics Column -->
                <div class="space-y-6 md:border-l md:border-outline-variant/10 md:pl-8">
                   <div class="flex items-center gap-3 text-emerald-600 mb-4 border-b border-outline-variant/10 pb-4">
                      <span class="material-symbols-outlined text-2xl">local_shipping</span>
                      <h4 class="font-black text-lg tracking-tight">Logistics Orders</h4>
                      <span class="ml-auto bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{{ missionLogistics.length }}</span>
                   </div>

                   <div *ngIf="isLoadingAssets" class="text-xs text-outline italic">Loading logistics data...</div>
                   <div *ngIf="!isLoadingAssets && missionLogistics.length === 0" class="text-xs text-outline italic bg-surface-container-low p-6 rounded-3xl text-center">No logistics prepared yet.</div>
                   
                   <div class="space-y-3">
                      <div *ngFor="let order of missionLogistics" class="bg-white p-5 rounded-3xl border border-outline-variant/10 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                         <div class="flex justify-between items-center">
                            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">Approved</span>
                            <span class="text-[10px] font-medium text-outline">Order #{{ order.id?.substring(0,6) }}</span>
                         </div>
                         <ul class="space-y-2 mt-2">
                            <li *ngFor="let r of order.resources" class="flex justify-between items-center text-sm font-medium">
                               <span class="text-on-surface flex items-center gap-2">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span>
                                  {{ r.resourceName }}
                               </span>
                               <span class="font-black text-outline">{{ r.quantity }} Units</span>
                            </li>
                         </ul>
                      </div>
                   </div>
                </div>

            </div>
            
            <div class="p-8 border-t border-outline-variant/10 bg-surface-container-low/50 flex justify-end">
               <button (click)="showAssetsModal = false" class="px-8 py-3 bg-white border border-outline-variant/20 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm">
                  Close Dashboard
               </button>
            </div>
        </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: grayscale(1); }
  `]
})
export class HarvestPlanningComponent implements OnInit {
  private collecteService = inject(CollecteService);
  private userService = inject(UserService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private dialogService = inject(DialogService);
  private resourceOrderService = inject(ResourceOrderService);
  private router = inject(Router);

  collectes: Collecte[] = [];
  chefs: User[] = [];
  logisticsManagers: User[] = [];
  allVergers: Verger[] = []; 
  vergerMap: Map<string, Verger> = new Map();
  Math = Math;

  // --- Search & Pagination ---
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 5;

  // --- Telemetry ---
  showTelemetryModal = false;
  selectedVergerForTelemetry: Verger | null = null;

  showCreateModal = false;
  isEditing = false;
  newCollecte: Partial<Collecte> = { type: 'planifiee', numberOfWorkers: 5 };

  // --- Assets Modal ---
  showAssetsModal = false;
  selectedMissionForAssets: Collecte | null = null;
  missionWorkers: Participation[] = [];
  missionLogistics: ResourceOrder[] = [];
  isLoadingAssets = false;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.collecteService.getCollectes().subscribe(data => {
      this.collectes = data || [];
      this.cdr.detectChanges();
    });
    this.userService.getAllUsers().subscribe(users => {
       this.chefs = users.filter(u => u.role === 'CHEF_EQUIPE_RECOLTE');
       this.logisticsManagers = users.filter(u => u.role === 'RESPONSABLE_LOGISTIQUE');
       this.cdr.detectChanges();
    });
    this.http.get<Verger[]>('http://localhost:8080/api/vergers').subscribe(v => {
       this.allVergers = v;
       this.vergerMap.clear();
       v.forEach(v => this.vergerMap.set(v.id, v));
       this.cdr.detectChanges();
    });
  }

  getVergerForMission(vergerId: string): Verger | undefined {
    return this.vergerMap.get(vergerId);
  }

  async openIntelligence(vergerId: string) {
    const verger = this.vergerMap.get(vergerId);
    if (!verger) {
       await this.dialogService.alert("Unavailable", "Synchronizing orchard intelligence... please wait.", "info");
       return;
    }
    this.selectedVergerForTelemetry = verger;
    this.showTelemetryModal = true;
    this.cdr.detectChanges();
  }

  openCreateModal() {
    this.isEditing = false;
    this.newCollecte = { type: 'planifiee', numberOfWorkers: 5 };
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  onEditMission(c: Collecte) {
    this.newCollecte = { ...c };
    this.isEditing = true;
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.newCollecte = { type: 'planifiee', numberOfWorkers: 5 };
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  async submitCollecte() {
    if (!this.newCollecte.description || !this.newCollecte.vergerId || !this.newCollecte.chefUid) {
      await this.dialogService.alert("Validation Error", "Please ensure Mission Title, Verger, and Chef are properly specified.", "warning");
      return;
    }
    
    const chefObj = this.chefs.find(c => c.id === this.newCollecte.chefUid);
    const rmObj = this.logisticsManagers.find(m => m.id === this.newCollecte.logisticsUid);
    const vergerObj = this.vergerMap.get(this.newCollecte.vergerId as string);

    const payload: Collecte = {
      ...this.newCollecte,
      chefName: chefObj?.fullName,
      logisticsName: rmObj?.fullName,
      vergerName: vergerObj?.nom || 'N/A',
      statut: this.isEditing ? this.newCollecte.statut : 'PLANNED'
    } as Collecte;

    const request = this.isEditing && this.newCollecte.id 
      ? this.collecteService.updateCollecte(this.newCollecte.id, payload)
      : this.collecteService.createCollecte(payload);

    request.subscribe({
       next: () => {
         this.dialogService.alert("Success", "Mission protocol recorded.", "success");
         this.closeCreateModal();
         this.loadData();
       },
       error: (err) => this.dialogService.alert("Error", "Mission operation failed: " + (err.error || err.message), "danger")
    });
  }

  async onDeleteMission(c: Collecte) {
    if (!c.id) return;
    const isConfirmed = await this.dialogService.confirm("Purge Mission", `Authorize permanent deletion of mission: "${c.description}"?`, "danger");
    if (isConfirmed) {
      this.collecteService.deleteCollecte(c.id).subscribe({
        next: () => this.loadData(),
        error: (err) => this.dialogService.alert("Error", "Purge failed: " + (err.error || err.message), "danger")
      });
    }
  }

  // --- View Assets Method ---
  viewAssets(c: Collecte) {
    if (!c.id) return;
    this.selectedMissionForAssets = c;
    this.showAssetsModal = true;
    this.isLoadingAssets = true;
    this.missionWorkers = [];
    this.missionLogistics = [];
    this.cdr.detectChanges();

    // Fetch Workers
    this.collecteService.getParticipations(c.id).subscribe({
      next: (workers) => {
        this.missionWorkers = workers;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });

    // Fetch Logistics
    this.resourceOrderService.getAllOrders().subscribe({
      next: (orders) => {
        // Find approved orders for this collecte
        this.missionLogistics = orders.filter(o => o.collecteId === c.id && o.status === 'APPROVED');
        this.isLoadingAssets = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        console.error(e);
        this.isLoadingAssets = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Returns true when both ready flags are set AND today is the mission's start date */
  canLaunch(c: Collecte): boolean {
    if (!c.logisticsReady || !c.workersReady) return false;
    if (c.statut === 'en_cours' || c.statut === 'termine') return false;
    if (!c.startDate) return false;
    const today = new Date();
    const start = new Date(c.startDate);
    return today.getFullYear() === start.getFullYear() &&
           today.getMonth() === start.getMonth() &&
           today.getDate() === start.getDate();
  }

  async launchCollection(c: Collecte) {
    if (!c.id) return;
    const isConfirmed = await this.dialogService.confirm("Launch Mission", `Launch mission "${c.description}" now? This will start the collection.`, "warning");
    if (isConfirmed) {
      this.collecteService.startCollecte(c.id).subscribe({
        next: () => {
          this.dialogService.alert("Launched", 'Collection launched successfully!', "success");
          this.loadData();
        },
        error: (err) => this.dialogService.alert("Launch Failed", (err.error || err.message), "danger")
      });
    }
  }

  // --- Search & Pagination Helpers ---
  get filteredCollectes() {
    if (!this.searchTerm) return this.collectes;
    const s = this.searchTerm.toLowerCase();
    return this.collectes.filter(c => 
      (c.description && c.description.toLowerCase().includes(s)) ||
      (c.vergerName && c.vergerName.toLowerCase().includes(s)) ||
      (c.chefName && c.chefName.toLowerCase().includes(s))
    );
  }

  get pagedCollectes() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCollectes.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredCollectes.length / this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }

  goToTrituration() {
    this.router.navigate(['/trituration-planning']);
  }
}
