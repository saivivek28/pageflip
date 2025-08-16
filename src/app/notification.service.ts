import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<any>();
  notification$ = this.notificationSubject.asObservable();

  showNotification(book: any, type: 'added' | 'exists') {
    this.notificationSubject.next({ book, type });
  }
}
