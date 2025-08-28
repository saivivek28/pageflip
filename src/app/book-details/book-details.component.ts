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
    this.loadBook();
  }

  loadBook() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Loading book with ID:', id);
    
    this.http.get<any[]>(`${environment.apiUrl}/books`).subscribe({
      next: (books) => {
        console.log('All books received:', books);
        
        // Try both _id and bookId for matching
        this.book = books.find(b => b._id === id || b.bookId === id);
        
        if (this.book) {
          console.log('Found book:', this.book);
          console.log('Book PDF URL:', this.book.pdfUrl);
          
          // Ensure the book has a bookId (for backward compatibility)
          if (!this.book.bookId && this.book._id) {
            this.book.bookId = this.book._id;
          }
        } else {
          console.error('Book not found with ID:', id);
          console.log('Available book IDs:', books.map(b => ({
            _id: b._id,
            bookId: b.bookId,
            title: b.title
          })));
        }
        
        this.loadReviews();
        this.loadRecommended(books);
      },
      error: (error) => {
        console.error('Error loading books:', error);
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

  readBook(book: any) {
    console.log('readBook called with:', book); // Debug log
    
    if (!book) {
      console.error('No book data provided');
      return;
    }
    
    const pdfUrl = book.pdfUrl || '';
    console.log('PDF URL from book:', pdfUrl); // Debug log
    
    if (pdfUrl && (pdfUrl.startsWith('http://') || pdfUrl.startsWith('https://'))) {
      try {
        // Open in a new tab
        const newWindow = window.open(pdfUrl, '_blank', 'noopener,noreferrer');
        
        // If window.open was blocked (e.g., by popup blocker)
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Fallback to window.location
          window.location.href = pdfUrl;
        }
      } catch (error) {
        console.error('Error opening PDF:', error);
        this.toastr.error('Failed to open PDF. Please try again.', 'Error');
      }
    } else if (pdfUrl) {
      // Handle case where URL is present but invalid
      console.error('Invalid PDF URL format:', pdfUrl);
      this.toastr.error('Invalid PDF URL format', 'Error');
    } else {
      console.log('No PDF URL available for this book');
      this.toastr.warning('No PDF available for this book', 'Not Available');
    }
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