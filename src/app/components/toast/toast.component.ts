import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast toast-{{toast.type}}"
        [class.toast-enter]="true"
      >
        <div class="toast-icon">
          <i class="fas fa-check-circle" *ngIf="toast.type === 'success'"></i>
          <i class="fas fa-exclamation-circle" *ngIf="toast.type === 'error'"></i>
          <i class="fas fa-info-circle" *ngIf="toast.type === 'info'"></i>
          <i class="fas fa-exclamation-triangle" *ngIf="toast.type === 'warning'"></i>
        </div>
        <div class="toast-content">
          <div class="toast-title">{{toast.title}}</div>
          <div class="toast-message">{{toast.message}}</div>
        </div>
        <button class="toast-close" (click)="removeToast(toast.id)">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./toast.component.css']
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    // Update toasts whenever service changes
    this.updateToasts();
    
    // Set up periodic updates
    setInterval(() => {
      this.updateToasts();
    }, 100);
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private updateToasts() {
    this.toasts = this.toastService.getToasts();
  }

  removeToast(id: string) {
    this.toastService.removeToast(id);
  }
}
