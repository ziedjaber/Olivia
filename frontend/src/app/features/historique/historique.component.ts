import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuditLog } from '../../models/audit-log.model';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-historique',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historique.component.html',
  styleUrls: ['./historique.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoriqueComponent implements OnInit, OnDestroy {
  private auditService = inject(AuditService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  auditLogs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  isLoading = false;
  errorMessage = '';

  filterEntity = '';
  filterAction = '';

  entities = ['Verger', 'Collecte', 'Participation', 'Alerte', 'Actif', 'Utilisateur'];
  actions = [
    'VERGER_CRÉÉ', 'VERGER_MODIFIÉ', 'VERGER_SUPPRIMÉ', 'MATURITÉ_MISE_À_JOUR',
    'COLLECTE_CRÉÉE', 'COLLECTE_DÉMARRÉE', 'COLLECTE_TERMINÉE', 'OUVRIER_INVITÉ',
    'ALERTE_CRÉÉE', 'ALERTE_RÉSOLUE', 'OUVRIER_PAYÉ'
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.auditService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (logs) => {
          this.auditLogs = logs;
          this.applyFilter();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors du chargement des logs d\'audit.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  applyFilter(): void {
    this.filteredLogs = this.auditLogs.filter(log => {
      const matchEntity = !this.filterEntity || log.entite === this.filterEntity;
      const matchAction = !this.filterAction || log.action === this.filterAction;
      return matchEntity && matchAction;
    });
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.filterEntity = '';
    this.filterAction = '';
    this.applyFilter();
  }

  exportPDF(): void {
    // Utilise la fonction d'impression native configurée via le CSS @media print
    window.print();
  }

  getRelativeTime(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)} h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  getIconForEntity(entity: string): string {
    switch (entity) {
      case 'Verger': return 'yard';
      case 'Collecte': return 'rebase_edit';
      case 'Participation': return 'person_add';
      case 'Alerte': return 'warning';
      default: return 'history';
    }
  }

  getIconColor(entity: string): string {
    switch (entity) {
      case 'Verger': return 'text-primary';
      case 'Collecte': return 'text-secondary';
      case 'Participation': return 'text-tertiary';
      case 'Alerte': return 'text-error';
      default: return 'text-outline';
    }
  }
}
