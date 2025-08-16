import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent {
  libraryBooks: any[] = [];
  notifications: any[] = []; // store active notifications

  constructor(private toastr: ToastrService) {
    const userId = localStorage.getItem('id');
    if (userId) {
      const stored = localStorage.getItem(`libraryBooks_${userId}`);
      this.libraryBooks = stored ? JSON.parse(stored) : [];
    }
  }

  removeBook(index: number): void {
    const userId = localStorage.getItem('id');
    if (!userId) return;

    const removedBook = this.libraryBooks[index];
    this.libraryBooks.splice(index, 1);
    localStorage.setItem(`libraryBooks_${userId}`, JSON.stringify(this.libraryBooks));

    // Show notification card
    this.showNotification(removedBook, 'removed');
  }

  showNotification(book: any, type: string): void {
    const notification = { book, type };
    this.notifications.push(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 3000);
  }
}
