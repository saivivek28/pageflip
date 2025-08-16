import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../notification.service';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css'],
})
export class BookDetailsComponent {
  book: any;
  reviews: any[] = [];
  recommendedBooks: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private notificationService: NotificationService
  ) {
    this.loadBook();
  }

  loadBook() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any[]>('http://localhost:3000/books').subscribe((books) => {
      this.book = books.find((b) => b.bookId === id);
      this.loadReviews();
      this.loadRecommended(books);
    });
  }

  loadReviews() {
    this.reviews = [
      { user: 'Sai Vivek', comment: 'Loved this book. Highly recommend!' },
      { user: 'Aarav Reddy', comment: 'Interesting story and great writing.' },
      { user: 'Meera Sharma', comment: 'A must-read for fans of this genre.' },
    ];
  }

  loadRecommended(allBooks: any[]) {
    this.recommendedBooks = allBooks.filter(
      (b) =>
        b.bookId !== this.book.bookId &&
        (b.genre === this.book.genre || b.author === this.book.author)
    );
  }

  addToLibrary(book: any) {
  const userId = localStorage.getItem('id');
  if (!userId) {
    this.notificationService.showNotification(
      { title: 'Please login', cover: 'assets/error.png' },
      'exists'
    );
    return;
  }

  const key = `libraryBooks_${userId}`;
  const stored = localStorage.getItem(key);
  let books = stored ? JSON.parse(stored) : [];

  const exists = books.some((b: any) => b.bookId === book.bookId);
  if (!exists) {
    books.push(book);
    localStorage.setItem(key, JSON.stringify(books));
    this.notificationService.showNotification(book, 'added');
  } else {
    this.notificationService.showNotification(book, 'exists');
  }
}
}
