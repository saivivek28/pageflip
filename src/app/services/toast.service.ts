import { Injectable } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: ToastMessage[] = [];
  private toastCounter = 0;

  constructor() {}

  private addToast(type: ToastMessage['type'], title: string, message: string, duration: number = 4000) {
    const id = `toast-${++this.toastCounter}`;
    const toast: ToastMessage = {
      id,
      type,
      title,
      message,
      duration
    };

    this.toasts.push(toast);

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(id);
    }, duration);

    return toast;
  }

  success(title: string, message: string, duration?: number) {
    return this.addToast('success', title, message, duration);
  }

  error(title: string, message: string, duration?: number) {
    return this.addToast('error', title, message, duration || 6000);
  }

  info(title: string, message: string, duration?: number) {
    return this.addToast('info', title, message, duration);
  }

  warning(title: string, message: string, duration?: number) {
    return this.addToast('warning', title, message, duration || 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  getToasts() {
    return this.toasts;
  }

  clearAll() {
    this.toasts = [];
  }
}
