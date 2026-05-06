import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-surface p-8 space-y-10 animate-fade-in font-headline">
      <!-- HEADER -->
      <header class="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-outline-variant/10 pb-8 bg-white p-8 rounded-[2rem] shadow-sm">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <span class="w-12 h-1.5 bg-primary rounded-full"></span>
            <p class="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Centre de Communication</p>
          </div>
          <h1 class="text-4xl font-black text-on-surface tracking-tighter leading-none" style="font-family: Manrope, sans-serif;">
            Gestion des <span class="text-primary italic">Notifications</span>
          </h1>
          <p class="text-xs text-outline font-medium mt-2">Gérez vos alertes système et messages opérationnels.</p>
        </div>
        
        <div class="flex gap-4">
           <div class="glass-panel px-6 py-4 border-white/40 shadow-sm flex items-center gap-4 bg-white/80">
              <div class="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                <span class="material-symbols-outlined">notifications</span>
              </div>
              <div>
                <span class="text-[9px] font-black text-outline uppercase tracking-wider block">Non lues</span>
                <span class="text-lg font-black text-on-surface">{{ notificationService.unreadCount() }} Messages</span>
              </div>
           </div>
        </div>
      </header>

      <!-- TOOLS & FILTERS -->
      <section class="flex flex-col md:flex-row justify-between items-center gap-6 glass-panel p-6 border-white/40 shadow-lg bg-white/60">
        <div class="flex items-center gap-4 w-full md:w-auto">
          <!-- Selection Actions -->
          <div *ngIf="selectedIds.size > 0" class="flex items-center gap-2 animate-in slide-in-from-left duration-300">
            <span class="text-[10px] font-black text-primary uppercase tracking-widest mr-2 px-3 py-1 bg-primary/10 rounded-full">
              {{ selectedIds.size }} Sélectionnés
            </span>
            <button (click)="markSelectedAsRead()" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">done_all</span> Marquer comme lus
            </button>
            <button (click)="deleteSelected()" class="px-5 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-sm">delete</span> Supprimer
            </button>
            <button (click)="selectedIds.clear()" class="text-[10px] font-black text-outline hover:text-on-surface transition-colors uppercase tracking-widest ml-2">Annuler</button>
          </div>

          <div *ngIf="selectedIds.size === 0" class="flex items-center gap-3">
             <button (click)="notificationService.markAllAsRead()" class="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg transition-all flex items-center gap-2">
                Tout marquer comme lu
             </button>
          </div>
        </div>

        <div class="flex gap-4 w-full md:w-auto">
          <!-- Search -->
          <div class="relative w-full md:w-64">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline/40 text-sm">search</span>
            <input type="text" [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()"
                   placeholder="Rechercher..."
                   class="w-full bg-white border border-outline-variant/10 rounded-xl pl-10 pr-4 py-3 text-[11px] font-bold outline-none focus:border-primary/40 transition-all shadow-sm">
          </div>
          <!-- Filter Read/Unread -->
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()"
                  class="bg-white border border-outline-variant/10 rounded-xl px-4 py-3 text-[11px] font-bold outline-none focus:border-primary/40 shadow-sm appearance-none min-w-[150px]">
            <option value="ALL">Tous les messages</option>
            <option value="UNREAD">Non lus</option>
            <option value="READ">Lus</option>
          </select>
        </div>
      </section>

      <!-- NOTIFICATIONS TABLE -->
      <section class="glass-panel overflow-hidden border-white/40 shadow-2xl bg-white/80 animate-up">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-container-lowest/50 border-b border-outline-variant/10">
              <th class="p-5 w-12 text-center">
                <input type="checkbox" (change)="toggleAll($event)" [checked]="isAllSelected()"
                       class="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary/20">
              </th>
              <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Notification</th>
              <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Type</th>
              <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest">Date</th>
              <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest text-center">Statut</th>
              <th class="p-5 text-[10px] font-black text-outline uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/10">
            <tr *ngFor="let n of pagedNotifs" 
                class="hover:bg-primary/[0.02] transition-colors group relative"
                [ngClass]="{'bg-primary/[0.01]': !n.read}">
              <td class="p-5 text-center w-12">
                <input type="checkbox" [checked]="selectedIds.has(n.id)" (change)="toggleSelection(n.id)"
                       class="w-4 h-4 rounded border-outline-variant/30 text-primary focus:ring-primary/20">
              </td>
              <td class="p-5 min-w-[300px]">
                <div class="flex flex-col gap-1">
                  <span class="text-[13px] font-black text-on-surface" [ngClass]="{'text-primary': !n.read}">{{ n.title }}</span>
                  <p class="text-[11px] font-medium text-outline truncate max-w-md" [title]="n.body">{{ n.body }}</p>
                </div>
              </td>
              <td class="p-5 w-32">
                <span class="px-2.5 py-1 rounded-lg bg-surface text-[9px] font-black uppercase tracking-widest text-outline border border-outline-variant/10 whitespace-nowrap">
                  {{ n.type }}
                </span>
              </td>
              <td class="p-5 w-32">
                <span class="text-[10px] font-bold text-outline whitespace-nowrap">{{ n.createdAt | date:'dd MMM, HH:mm' }}</span>
              </td>
              <td class="p-5 text-center w-20">
                <div class="flex justify-center">
                  <span class="w-2 h-2 rounded-full"
                        [ngClass]="n.read ? 'bg-outline-variant/30' : 'bg-primary shadow-[0_0_8px_rgba(62,82,25,0.4)]'"></span>
                </div>
              </td>
              <td class="p-5 text-right w-24">
                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button *ngIf="!n.read" (click)="markAsRead(n.id)" 
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-all">
                    <span class="material-symbols-outlined text-lg">done</span>
                  </button>
                  <button (click)="deleteSelectedIds([n.id])" 
                          class="w-8 h-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-50 transition-all">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="pagedNotifs.length === 0">
              <td colspan="6" class="p-20 text-center opacity-30 italic font-medium">
                <div class="flex flex-col items-center gap-2">
                  <span class="material-symbols-outlined text-4xl">inbox</span>
                  <p>Aucune notification trouvée.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PAGINATION FOOTER -->
        <div class="p-6 bg-surface-container-lowest/30 border-t border-outline-variant/10 flex justify-between items-center" *ngIf="filteredNotifs.length > 0">
          <p class="text-[10px] font-black text-outline uppercase tracking-widest">
            Affichage de {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, filteredNotifs.length) }} sur {{ filteredNotifs.length }}
          </p>
          <div class="flex items-center gap-2">
            <button [disabled]="currentPage === 1" (click)="setPage(currentPage - 1)"
                    class="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30 transition-all shadow-sm">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <div class="flex items-center gap-1">
              <button *ngFor="let p of pages" (click)="setPage(p)"
                      [class]="p === currentPage ? 'bg-primary text-on-primary' : 'bg-white text-outline'"
                      class="w-10 h-10 rounded-xl border border-outline-variant/10 flex items-center justify-center text-[10px] font-black transition-all shadow-sm">
                {{ p }}
              </button>
            </div>
            <button [disabled]="currentPage === totalPages" (click)="setPage(currentPage + 1)"
                    class="w-10 h-10 rounded-xl bg-white border border-outline-variant/10 flex items-center justify-center text-outline hover:text-primary disabled:opacity-30 transition-all shadow-sm">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .glass-panel { @apply bg-white/60 backdrop-blur-2xl border border-white/40 rounded-[2rem]; }
    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
    .animate-up { animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-outline-variant/20 rounded-full; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationManagementComponent implements OnInit {
  protected readonly Math = Math;
  notificationService = inject(NotificationService);
  toastService = inject(ToastService);
  cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  filteredNotifs: Notification[] = [];
  pagedNotifs: Notification[] = [];
  selectedIds = new Set<string>();

  // Filtres
  searchTerm = '';
  statusFilter = 'ALL';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  pages: number[] = [];

  ngOnInit() {
    this.applyFilters();
    // React to service changes
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        this.applyFilters();
        this.cdr.detectChanges();
      }, 2000);
    }
  }

  applyFilters() {
    const all = this.notificationService.notifications();
    this.filteredNotifs = all.filter(n => {
      const matchesSearch = !this.searchTerm || 
        n.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        n.body?.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesStatus = this.statusFilter === 'ALL' || 
        (this.statusFilter === 'UNREAD' && !n.read) ||
        (this.statusFilter === 'READ' && n.read);

      return matchesSearch && matchesStatus;
    });

    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredNotifs.length / this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    if (this.totalPages === 0) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.pagedNotifs = this.filteredNotifs.slice(start, end);
  }

  setPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.updatePagination();
    this.cdr.detectChanges();
  }

  toggleSelection(id: string) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isAllSelected() {
    return this.pagedNotifs.length > 0 && this.pagedNotifs.every(n => this.selectedIds.has(n.id));
  }

  toggleAll(event: any) {
    if (event.target.checked) {
      this.pagedNotifs.forEach(n => this.selectedIds.add(n.id));
    } else {
      this.pagedNotifs.forEach(n => this.selectedIds.delete(n.id));
    }
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id);
    this.toastService.show('Notification lue', 'success');
  }

  markSelectedAsRead() {
    const ids = Array.from(this.selectedIds);
    this.notificationService.markBulkAsRead(ids);
    this.selectedIds.clear();
    this.toastService.show('Sélection marquée comme lue', 'success');
  }

  deleteSelectedIds(ids: string[]) {
    if (confirm('Voulez-vous supprimer ces notifications ?')) {
      this.notificationService.deleteBulk(ids);
      ids.forEach(id => this.selectedIds.delete(id));
      this.toastService.show('Notifications supprimées', 'success');
    }
  }

  deleteSelected() {
    this.deleteSelectedIds(Array.from(this.selectedIds));
  }
}
