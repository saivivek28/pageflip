import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
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
    
  }
  ngOnInit(){
    this.loadBook();
  }

  loadBook() {
    const id = this.route.snapshot.paramMap.get('id');
    
    this.http.get<any[]>(`${environment.apiUrl}/books`).subscribe({
      next: (books) => {
        // Try both _id and bookId for matching
        this.book = books.find(b => b._id === id || b.bookId === id);
        
        if (this.book) {
          // Ensure the book has a bookId (for backward compatibility)
          if (!this.book.bookId && this.book._id) {
            this.book.bookId = this.book._id;
          }
        }
        
        this.loadReviews();
        this.loadRecommended(books);
      },
      error: (error) => {
        this.toastr.error('Failed to load book details', 'Error');
      }
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
        b._id !== this.book._id &&
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