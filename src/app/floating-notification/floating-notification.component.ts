import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-floating-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-notification.component.html',
  styleUrls: ['./floating-notification.component.css']
})
export class FloatingNotificationComponent implements OnInit {
  notifications: any[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notification$.subscribe(data => {
      this.notifications.push(data);
      setTimeout(() => {
        this.notifications.shift();
      }, 3000); // disappears after 3s
    });
  }
}
