import { Injectable, signal, computed } from '@angular/core';

export interface DialogConfig {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private _dialog = signal<DialogConfig | null>(null);
  private _resolve: ((value: boolean) => void) | null = null;

  dialog = computed(() => this._dialog());

  /** Show an alert dialog (info only, OK button) */
  alert(title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'info'): Promise<boolean> {
    return new Promise(resolve => {
      this._resolve = resolve;
      this._dialog.set({ title, message, type, confirmText: 'OK' });
    });
  }

  /** Show a confirm dialog (OK + Cancel) */
  confirm(title: string, message: string, type: 'info' | 'success' | 'warning' | 'danger' = 'warning'): Promise<boolean> {
    return new Promise(resolve => {
      this._resolve = resolve;
      this._dialog.set({ title, message, type, confirmText: 'Confirm', cancelText: 'Cancel' });
    });
  }

  /** Called by the dialog component */
  close(result: boolean) {
    this._dialog.set(null);
    if (this._resolve) {
      this._resolve(result);
      this._resolve = null;
    }
  }
}
