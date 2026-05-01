import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogService.dialog(); as d) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" (click)="onCancel()"></div>

        <!-- Dialog Card -->
        <div class="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in ring-1 ring-black/5">
          <!-- Icon Header -->
          <div class="pt-8 pb-4 flex justify-center">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                 [ngClass]="{
                   'bg-primary/10 text-primary': d.type === 'info',
                   'bg-green-100 text-green-600': d.type === 'success',
                   'bg-amber-100 text-amber-600': d.type === 'warning',
                   'bg-red-100 text-red-600': d.type === 'danger'
                 }">
              <span class="material-symbols-outlined text-3xl">
                {{ d.type === 'info' ? 'info' : d.type === 'success' ? 'check_circle' : d.type === 'warning' ? 'warning' : 'error' }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="px-8 pb-4 text-center">
            <h3 class="text-lg font-black text-on-surface mb-2">{{ d.title }}</h3>
            <p class="text-sm text-on-surface-variant leading-relaxed">{{ d.message }}</p>
          </div>

          <!-- Actions -->
          <div class="px-8 pb-8 pt-4 flex gap-3" [class.justify-center]="!d.cancelText" [class.justify-end]="d.cancelText">
            <button *ngIf="d.cancelText" (click)="onCancel()"
                    class="flex-1 py-3.5 rounded-xl bg-stone-100 text-on-surface font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95">
              {{ d.cancelText }}
            </button>
            <button (click)="onConfirm()"
                    class="flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                    [ngClass]="{
                      'bg-primary text-on-primary shadow-primary/20 hover:opacity-90': d.type === 'info',
                      'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700': d.type === 'success',
                      'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600': d.type === 'warning',
                      'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700': d.type === 'danger'
                    }">
              {{ d.confirmText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.2s ease-out forwards; }
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class DialogComponent {
  dialogService = inject(DialogService);

  onConfirm() {
    this.dialogService.close(true);
  }

  onCancel() {
    this.dialogService.close(false);
  }
}
