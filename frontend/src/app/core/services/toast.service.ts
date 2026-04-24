import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<ToastMessage[]>([]);
  private idCounter = 0;

  show(message: string, type: ToastType = 'success', durationMs = 4000) {
    const id = this.idCounter++;
    this.toasts.update(current => [...current, { id, message, type }]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
