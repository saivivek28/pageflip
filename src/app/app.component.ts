// app.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FloatingNotificationComponent } from './floating-notification/floating-notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FloatingNotificationComponent], // ✅ Add here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Page Filp';
}
