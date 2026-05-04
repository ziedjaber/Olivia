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
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-headline animate-fade-in">
      <!-- Premium Header -->
      <header class="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-stone-100 pb-8">
        <div class="animate-in slide-in-from-left duration-700">
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.25em] mb-2 opacity-70">
            <span class="w-10 h-[1px] bg-primary"></span>
            Contrôle du Domaine
          </div>
          <h1 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            Récolte <span class="text-primary italic">Pipeline de Mission</span>
          </h1>
          <p class="text-on-surface-variant text-sm font-medium mt-1 italic">Supervision stratégique et déploiement des campagnes de récolte.</p>
        </div>
        
        <div class="flex gap-4 animate-in slide-in-from-right duration-700">
           <button (click)="loadData()" class="p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-stone-100 hover:bg-white hover:rotate-180 transition-all duration-500 shadow-sm">
             <span class="material-symbols-outlined text-outline">refresh</span>
           </button>
           <button (click)="openCreateModal()" 
                  class="bg-primary text-on-primary px-8 py-3.5 font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
            <span class="material-symbols-outlined">add_task</span>
            Initialiser la Mission
          </button>
        </div>
      </header>

      <!-- SEARCH BAR -->
      <div class="mb-8 animate-up">
        <div class="relative group">
          <span class="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/30 group-focus-within:text-primary transition-colors">search</span>
          <input [(ngModel)]="searchTerm" (ngModelChange)="currentPage = 1" type="text" 
                 placeholder="Filtrer les missions par titre, nom du verger ou responsable assigné..."
                 class="w-full bg-white/60 backdrop-blur-xl border border-stone-100 rounded-3xl pl-14 pr-6 py-5 focus:border-primary/40 focus:bg-white outline-none transition-all text-sm font-bold text-on-surface shadow-sm focus:shadow-xl">
        </div>
      </div>

      <!-- Mission Table -->
      <div class="bg-white rounded-[3rem] border border-stone-100 shadow-2xl overflow-hidden animate-up relative">
        <!-- Loader Overlay -->
        <div *ngIf="loading" class="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
                <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p class="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Déploiement tactique en cours...</p>
            </div>
        </div>

        <div class="overflow-x-auto min-h-[400px]">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50/50 border-b border-stone-100">
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Campagne / Lieu</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Direction</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-center">Préparation du Verger</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline">Suivi de Mission</th>
                <th class="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-outline text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-50">
              <ng-container *ngIf="!loading; else tableSkeleton">
                <tr *ngFor="let c of pagedCollectes; let i = index" 
                    class="hover:bg-primary/[0.02] transition-colors group animate-in fade-in slide-in-from-bottom-2"
                    [style.animation-delay.ms]="i * 50">
                  <td class="px-8 py-6">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-primary border border-stone-100 group-hover:scale-110 transition-transform">
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
                       <div class="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-primary/60 border border-stone-100">
                          <span class="material-symbols-outlined text-sm">person</span>
                       </div>
                       <div>
                          <p class="text-sm font-black text-on-surface tracking-tight">{{ c.chefName }}</p>
                          <p class="text-[9px] text-outline font-black uppercase tracking-widest">{{ c.numberOfWorkers }} Membres</p>
                       </div>
                    </div>
                  </td>
                  <td class="px-8 py-6 text-center">
                     <div class="w-40 mx-auto" *ngIf="getVergerForMission(c.vergerId) as v">
                        <div class="flex justify-between items-center mb-1.5">
                          <span class="text-[9px] font-black text-outline uppercase tracking-tight">Maturité</span>
                          <span class="text-xs font-black text-on-surface">{{ v.niveauMaturite }}%</span>
                        </div>
                        <div class="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                          <div class="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(62,82,25,0.3)]" [style.width.%]="v.niveauMaturite"></div>
                        </div>
                     </div>
                  </td>
                  <td class="px-8 py-6">
                     <div class="flex items-center gap-3">
                        <span class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border transition-all"
                              [ngClass]="{
                                'bg-stone-50 text-stone-500 border-stone-100': c.statut === 'PLANNED',
                                'bg-primary text-on-primary border-transparent shadow-primary/20': c.statut === 'en_cours',
                                'bg-emerald-50 text-emerald-700 border-emerald-100': c.statut === 'termine'
                              }">
                           {{ c.statut === 'PLANNED' ? 'LOGISTIQUE' : (c.statut?.replace('_', ' ') || 'INCONNU') }}
                        </span>
                     </div>
                  </td>
                  <td class="px-8 py-6 text-right">
                    <div class="flex justify-end items-center gap-2">
                       <div class="flex gap-1 mr-2">
                          <span *ngIf="c.logisticsReady" class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center" title="Logistique Prête"><span class="material-symbols-outlined text-sm">local_shipping</span></span>
                          <span *ngIf="c.workersReady" class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center" title="Équipe Prête"><span class="material-symbols-outlined text-sm">group</span></span>
                       </div>
                      <button (click)="onEditMission(c)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-outline hover:text-primary transition-all flex items-center justify-center shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">edit_note</span>
                      </button>
                      <button (click)="onDeleteMission(c)" class="w-10 h-10 rounded-xl bg-white border border-stone-200 text-error/40 hover:text-error transition-all flex items-center justify-center shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">delete_sweep</span>
                      </button>
                      <button (click)="openIntelligence(c.vergerId)" 
                              class="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 text-on-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
                        <span class="material-symbols-outlined text-[18px]">assignment_returned</span>
                      </button>
                      <button (click)="viewAssets(c)"
                              class="w-10 h-10 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-primary flex items-center justify-center border border-stone-100 shadow-sm">
                        <span class="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                      <button *ngIf="canLaunch(c)" (click)="launchCollection(c)"
                              class="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">rocket_launch</span> Lancer
                      </button>
                      <button *ngIf="c.statut === 'termine'" (click)="goToTrituration()"
                              class="px-4 py-2 rounded-xl bg-amber-600 text-white font-black text-[9px] uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">oil_barrel</span> Trituration
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- Empty State -->
                <tr *ngIf="filteredCollectes.length === 0">
                  <td colspan="5" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center text-stone-200">
                        <span class="material-symbols-outlined text-6xl">travel_explore</span>
                      </div>
                      <div>
                        <p class="text-stone-900 font-black text-2xl tracking-tight">Aucun protocole détecté</p>
                        <p class="text-stone-400 text-sm font-medium">Lancez une nouvelle mission pour commencer la récolte.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div *ngIf="totalPages > 1" class="px-8 py-6 bg-stone-50/30 border-t border-stone-100 flex items-center justify-between">
           <span class="text-[10px] font-black text-stone-400 uppercase tracking-widest opacity-60">Missions {{ (currentPage-1)*itemsPerPage + 1 }} - {{ Math.min(currentPage*itemsPerPage, filteredCollectes.length) }} de {{ filteredCollectes.length }}</span>
           <div class="flex gap-2">
              <button (click)="prevPage()" [disabled]="currentPage === 1" class="px-4 py-2 rounded-xl bg-white border border-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary disabled:opacity-30 transition-all">Précédent</button>
              <button (click)="nextPage()" [disabled]="currentPage === totalPages" class="px-4 py-2 rounded-xl bg-white border border-stone-100 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary disabled:opacity-30 transition-all">Suivant</button>
           </div>
        </div>
      </div>
    </div>

    <!-- SKELETON TEMPLATE -->
    <ng-template #tableSkeleton>
        <tr *ngFor="let i of [1,2,3,4,5]" class="animate-pulse">
            <td class="px-8 py-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-stone-100"></div>
                    <div class="space-y-2">
                        <div class="h-4 w-40 bg-stone-100 rounded"></div>
                        <div class="h-2 w-24 bg-stone-100 rounded"></div>
                    </div>
                </div>
            </td>
            <td class="px-8 py-6">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-stone-100"></div>
                    <div class="space-y-2">
                        <div class="h-3 w-20 bg-stone-100 rounded"></div>
                        <div class="h-2 w-16 bg-stone-100 rounded"></div>
                    </div>
                </div>
            </td>
            <td class="px-8 py-6"><div class="mx-auto h-4 w-32 bg-stone-100 rounded"></div></td>
            <td class="px-8 py-6"><div class="h-8 w-24 bg-stone-100 rounded-xl"></div></td>
            <td class="px-8 py-6"><div class="ml-auto h-10 w-48 bg-stone-100 rounded-xl"></div></td>
        </tr>
    </ng-template>

    <!-- TELEMETRY HUB MODAL -->
    <div *ngIf="showTelemetryModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-xl p-4 animate-in fade-in">
        <div class="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div class="p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2">Rapports du Chef d'Équipe</span>
                    <h3 class="text-3xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.nom }}</h3>
                    <div class="flex items-center gap-2 mt-2">
                       <span class="text-[10px] font-black text-outline uppercase tracking-widest italic">Responsable : {{ selectedVergerForTelemetry?.responsableName || 'Équipe de Terrain' }}</span>
                    </div>
                </div>
                <button (click)="showTelemetryModal = false" class="w-12 h-12 rounded-full bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div class="space-y-8">
                    <div>
                       <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-4">Analyse de Maturité</label>
                       <div class="flex items-end gap-2 mb-2">
                           <span class="text-5xl font-black text-on-surface tracking-tighter">{{ selectedVergerForTelemetry?.niveauMaturite }}%</span>
                       </div>
                       <div class="h-3 w-full bg-stone-100 rounded-full overflow-hidden shadow-inner">
                           <div class="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(62,82,25,0.4)]" [style.width.%]="selectedVergerForTelemetry?.niveauMaturite"></div>
                       </div>
                    </div>
                    <div class="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 shadow-inner">
                        <label class="text-[10px] font-black text-outline uppercase tracking-widest block mb-2">Notes de Terrain</label>
                        <p class="text-sm font-medium text-on-surface-variant leading-relaxed italic">
                            "{{ selectedVergerForTelemetry?.descriptionMaturite || 'Aucune note de terrain fournie.' }}"
                        </p>
                    </div>
                </div>
                <div class="space-y-4">
                    <label class="text-[10px] font-black text-outline uppercase tracking-widest block">Preuve Optique</label>
                    <div class="aspect-square rounded-[2rem] overflow-hidden bg-stone-50 border border-stone-100 shadow-inner relative group">
                        <img *ngIf="selectedVergerForTelemetry?.imageMaturiteUrl" [src]="selectedVergerForTelemetry?.imageMaturiteUrl" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                    </div>
                </div>
            </div>

            <div class="p-10 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button (click)="showTelemetryModal = false" class="bg-primary text-on-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Fermer l'intelligence</button>
            </div>
        </div>
    </div>

    <!-- CREATE/MODIFY MISSION MODAL -->
    <div *ngIf="showCreateModal" 
         class="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-xl p-4 animate-in fade-in">
      <div class="bg-white w-full max-w-2xl max-h-[92vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/5 animate-in slide-in-from-bottom-8">
        
        <div class="p-12 border-b border-stone-100 relative bg-stone-50/30">
          <div class="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-4 opacity-70">
            <span class="w-6 h-0.5 bg-primary"></span>
            Architecture de la Mission
          </div>
          <h3 class="text-4xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">
            {{ isEditing ? 'Modification' : 'Déploiement' }} <span class="text-primary italic">Protocole</span>
          </h3>
          <button (click)="closeCreateModal()" class="absolute top-12 right-12 w-12 h-12 rounded-full bg-white border border-stone-100 hover:bg-stone-50 transition-all flex items-center justify-center text-stone-400">
            <span class="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        
        <div class="p-12 overflow-y-auto flex-grow space-y-12">
           <div class="space-y-6">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Nomenclature de la Campagne</label>
                <input [(ngModel)]="newCollecte.description" 
                       class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all shadow-inner" 
                       placeholder="ex. Système de Récolte 2024">
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Verger</label>
                  <select [(ngModel)]="newCollecte.vergerId" class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer shadow-inner">
                    <option [value]="null">Sélectionnez le Domaine</option>
                    <option *ngFor="let v of allVergers" [value]="v.id">{{ v.nom }} ({{ v.niveauMaturite }}%)</option>
                  </select>
                </div>
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Responsable Assigné</label>
                  <select [(ngModel)]="newCollecte.chefUid" class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer shadow-inner">
                    <option [value]="null">Assigner un Responsable</option>
                    <option *ngFor="let c of chefs" [value]="c.id">{{ c.fullName }}</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                <div class="group">
                  <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Responsable Logistique</label>
                  <select [(ngModel)]="newCollecte.logisticsUid" class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 focus:bg-white rounded-[1.5rem] px-6 py-5 text-sm font-bold text-on-surface outline-none transition-all cursor-pointer shadow-inner">
                    <option [value]="undefined">Assigner la Logistique</option>
                    <option *ngFor="let rm of logisticsManagers" [value]="rm.id">{{ rm.fullName }}</option>
                  </select>
                </div>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-stone-100">
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Début</label>
                <input type="date" [(ngModel)]="newCollecte.startDate" class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Fin</label>
                <input type="date" [(ngModel)]="newCollecte.endDate" class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-on-surface outline-none transition-all shadow-inner">
              </div>
              <div class="group">
                <label class="block text-[10px] font-black text-outline uppercase tracking-widest mb-3">Taille Équipe</label>
                <input type="number" [(ngModel)]="newCollecte.numberOfWorkers" 
                       class="w-full bg-stone-50 border border-stone-100 focus:border-primary/40 rounded-[1.25rem] px-6 py-4 text-sm font-black text-on-surface outline-none transition-all shadow-inner">
              </div>
           </div>
        </div>

        <div class="p-12 border-t border-stone-100 flex justify-end gap-6 bg-stone-50/30 backdrop-blur-md">
           <button (click)="closeCreateModal()" class="px-8 py-3 font-black text-[10px] text-outline hover:text-on-surface transition-all tracking-widest uppercase">Annuler</button>
           <button (click)="submitCollecte()" 
                   class="px-12 py-4 bg-primary text-on-primary font-black text-xs rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all tracking-widest uppercase">
                {{ isEditing ? 'Confirmer' : 'Déployer' }}
           </button>
        </div>
      </div>
    </div>

    <!-- ASSETS MODAL -->
    <div *ngIf="showAssetsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-xl p-4 animate-in fade-in">
        <div class="bg-white w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[3.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
            <div class="p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/30">
                <div>
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.3em] block mb-2">Allocation des Ressources</span>
                    <h3 class="text-3xl font-black text-on-surface tracking-tighter" style="font-family: Manrope, sans-serif;">{{ selectedMissionForAssets?.description }}</h3>
                </div>
                <button (click)="showAssetsModal = false" class="w-12 h-12 rounded-full bg-stone-50 hover:bg-stone-100 transition-all flex items-center justify-center text-stone-400">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <div class="p-10 overflow-y-auto flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 bg-white">
                
                <!-- Workers Column -->
                <div class="space-y-6">
                   <div class="flex items-center gap-3 text-primary mb-4 border-b border-stone-100 pb-4">
                      <span class="material-symbols-outlined text-2xl">group</span>
                      <h4 class="font-black text-lg tracking-tight">Équipe Assignée</h4>
                      <span class="ml-auto bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">{{ missionWorkers.length }}</span>
                   </div>
                   
                   <div *ngIf="isLoadingAssets" class="flex items-center gap-3 animate-pulse">
                        <div class="w-10 h-10 rounded-full bg-stone-100"></div>
                        <div class="h-4 w-32 bg-stone-100 rounded"></div>
                   </div>

                   <div *ngIf="!isLoadingAssets && missionWorkers.length === 0" class="text-xs text-outline italic bg-stone-50 p-8 rounded-[2rem] text-center border border-stone-100">Aucune équipe assignée pour le moment.</div>
                   
                   <div class="space-y-3">
                      <div *ngFor="let w of missionWorkers" class="bg-white p-4 rounded-3xl border border-stone-100 flex items-center gap-4 hover:shadow-lg transition-all">
                         <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                            {{ w.ouvrierName.charAt(0) || 'U' }}
                         </div>
                         <div class="flex-grow">
                            <p class="font-bold text-sm text-on-surface leading-none mb-1">{{ w.ouvrierName }}</p>
                            <p class="text-[9px] font-black tracking-widest text-outline uppercase">{{ w.status }}</p>
                         </div>
                         <div class="text-right">
                            <p class="text-[10px] font-black tracking-widest text-primary">{{ w.dailySalary }} TND</p>
                         </div>
                      </div>
                   </div>
                </div>

                <!-- Logistics Column -->
                <div class="space-y-6 md:border-l md:border-stone-100 md:pl-8">
                   <div class="flex items-center gap-3 text-emerald-600 mb-4 border-b border-stone-100 pb-4">
                      <span class="material-symbols-outlined text-2xl">local_shipping</span>
                      <h4 class="font-black text-lg tracking-tight">Commandes Logistiques</h4>
                      <span class="ml-auto bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{{ missionLogistics.length }}</span>
                   </div>

                   <div *ngIf="isLoadingAssets" class="h-24 w-full bg-stone-50 rounded-[2rem] animate-pulse"></div>

                   <div *ngIf="!isLoadingAssets && missionLogistics.length === 0" class="text-xs text-outline italic bg-stone-50 p-8 rounded-[2rem] text-center border border-stone-100">Aucune logistique préparée pour le moment.</div>
                   
                   <div class="space-y-3">
                      <div *ngFor="let order of missionLogistics" class="bg-white p-5 rounded-3xl border border-stone-100 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all">
                         <div class="flex justify-between items-center">
                            <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">Approuvé</span>
                            <span class="text-[10px] font-medium text-outline">ID #{{ order.id?.substring(0,6) }}</span>
                         </div>
                         <ul class="space-y-2 mt-2">
                            <li *ngFor="let r of order.resources" class="flex justify-between items-center text-sm font-medium">
                               <span class="text-on-surface flex items-center gap-2">
                                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span>
                                  {{ r.resourceName }}
                               </span>
                               <span class="font-black text-outline">{{ r.quantity }} Unités</span>
                            </li>
                          </ul>
                       </div>
                    </div>
                 </div>
             </div>
             
             <div class="p-8 border-t border-stone-100 bg-stone-50/50 flex justify-end">
                <button (click)="showAssetsModal = false" class="px-8 py-3 bg-white border border-stone-200 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-stone-50 transition-all shadow-sm">
                   Fermer le Tableau de Bord
                </button>
             </div>
         </div>
     </div>
   `,
  styles: [`
     :host { display: block; background: #FDFCF6/50; min-height: 100vh; }
     input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; filter: grayscale(1) opacity(0.3); }
     
     .animate-up { animation: slideUp 0.6s cubic-bezier(0, 0, 0.2, 1) forwards; }
     @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
     
     .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
     @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
     
     .glass-panel {
       background: rgba(255, 255, 255, 0.7);
       backdrop-filter: blur(20px);
       -webkit-backdrop-filter: blur(20px);
     }
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
  loading = false;

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
    this.loading = true;
    this.cdr.detectChanges();

    this.collecteService.getCollectes().subscribe({
      next: (data) => {
        this.collectes = data || [];
        // Slight delay to appreciate the premium skeleton
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }, 800);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
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
      await this.dialogService.alert("Indisponible", "Synchronisation de l'intelligence du verger... veuillez patienter.", "info");
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
      await this.dialogService.alert("Erreur de Validation", "Veuillez vous assurer que le titre de la mission, le verger et le chef sont correctement spécifiés.", "warning");
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
        this.dialogService.alert("Succès", "Protocole de mission enregistré.", "success");
        this.closeCreateModal();
        this.loadData();
      },
      error: (err) => this.dialogService.alert("Erreur", "L'opération de mission a échoué : " + (err.error || err.message), "danger")
    });
  }

  async onDeleteMission(c: Collecte) {
    if (!c.id) return;
    const isConfirmed = await this.dialogService.confirm("Purger la Mission", `Autoriser la suppression permanente de la mission : "${c.description}"?`, "danger");
    if (isConfirmed) {
      this.collecteService.deleteCollecte(c.id).subscribe({
        next: () => this.loadData(),
        error: (err) => this.dialogService.alert("Erreur", "La purge a échoué : " + (err.error || err.message), "danger")
      });
    }
  }

  viewAssets(c: Collecte) {
    if (!c.id) return;
    this.selectedMissionForAssets = c;
    this.showAssetsModal = true;
    this.isLoadingAssets = true;
    this.missionWorkers = [];
    this.missionLogistics = [];
    this.cdr.detectChanges();

    this.collecteService.getParticipations(c.id).subscribe({
      next: (workers) => {
        this.missionWorkers = workers;
        this.cdr.detectChanges();
      },
      error: (e) => console.error(e)
    });

    this.resourceOrderService.getAllOrders().subscribe({
      next: (orders) => {
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
    const isConfirmed = await this.dialogService.confirm("Lancer la Mission", `Lancer la mission "${c.description}" maintenant ? Cela démarrera la récolte.`, "warning");
    if (isConfirmed) {
      this.collecteService.startCollecte(c.id).subscribe({
        next: () => {
          this.dialogService.alert("Lancée", 'Mission lancée avec succès !', "success");
          this.loadData();
        },
        error: (err) => this.dialogService.alert("Échec du Lancement", (err.error || err.message), "danger")
      });
    }
  }

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
