import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { NotificationService } from '../notification.service';
import { ReviewsService, Review, BookRating } from '../services/reviews.service';
import { LibraryService } from '../services/library.service';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule, FormsModule],
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css'],
})
export class BookDetailsComponent {
  book: any;
  reviews: Review[] = [];
  recommendedBooks: any[] = [];
  bookRating: BookRating | null = null;
  userReview: Review | null = null;
  isLoggedIn = false;
  currentUserId: string | null = null;
  currentUserName: string = '';
  
  // New review form
  newReview = {
    rating: 0,
    comment: ''
  };
  
  // Edit review form
  editReview = {
    rating: 0,
    comment: ''
  };
  
  hoveredRating = 0;
  isEditingReview = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private notificationService: NotificationService,
    private reviewsService: ReviewsService,
    private libraryService: LibraryService
  ) {
    this.checkLoginStatus();
  }
  ngOnInit() {
    this.loadBook();
  }
  
  private checkLoginStatus() {
    this.currentUserId = localStorage.getItem('id');
    this.isLoggedIn = !!this.currentUserId;
    
    if (this.isLoggedIn) {
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        this.currentUserName = userData.name || userData.username || 'Anonymous User';
      } catch {
        this.currentUserName = 'Anonymous User';
      }
    }
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
        this.loadBookRating();
        this.loadUserReview();
        this.loadRecommended(books);
      },
      error: (error) => {
        this.toastr.error('Failed to load book details', 'Error');
      }
    });
  }

  loadReviews() {
    if (!this.book?.bookId) return;
    
    this.reviewsService.getBookReviews(this.book.bookId).subscribe({
      next: (reviews) => {
        this.reviews = reviews.filter(review => review.userId !== this.currentUserId);
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        // Fallback to mock data for demo
        this.reviews = [
          { 
            _id: '1',
            bookId: this.book.bookId,
            userId: 'user1',
            userName: 'Sai Vivek', 
            rating: 5,
            comment: 'Loved this book. Highly recommend!',
            createdAt: new Date('2024-01-15')
          },
          { 
            _id: '2',
            bookId: this.book.bookId,
            userId: 'user2',
            userName: 'Aarav Reddy', 
            rating: 4,
            comment: 'Interesting story and great writing.',
            createdAt: new Date('2024-01-10')
          },
          { 
            _id: '3',
            bookId: this.book.bookId,
            userId: 'user3',
            userName: 'Meera Sharma', 
            rating: 5,
            comment: 'A must-read for fans of this genre.',
            createdAt: new Date('2024-01-05')
          }
        ];
      }
    });
  }
  
  loadBookRating() {
    if (!this.book?.bookId) return;
    
    this.reviewsService.getBookRating(this.book.bookId).subscribe({
      next: (rating) => {
        this.bookRating = rating;
      },
      error: (error) => {
        console.error('Error loading book rating:', error);
        // Fallback to mock data
        this.bookRating = {
          bookId: this.book.bookId,
          averageRating: 4.5,
          totalReviews: 12,
          ratingDistribution: {
            5: 7,
            4: 3,
            3: 1,
            2: 1,
            1: 0
          }
        };
      }
    });
  }
  
  loadUserReview() {
    if (!this.book?.bookId || !this.currentUserId) return;
    
    this.reviewsService.getUserReview(this.book.bookId, this.currentUserId).subscribe({
      next: (review) => {
        this.userReview = review;
      },
      error: (error) => {
        console.error('Error loading user review:', error);
        this.userReview = null;
      }
    });
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

    // Try to add via backend; if it already exists, just notify
    this.libraryService.addToLibrary(userId, { bookId: book.bookId, dateAdded: new Date() }).subscribe({
      next: () => this.notificationService.showNotification(book, 'added'),
      error: (err) => {
        if (err?.status === 409) {
          this.notificationService.showNotification(book, 'exists');
        } else if (err?.status === 404) {
          // As a fallback, try creating again
          this.libraryService.addToLibrary(userId, { bookId: book.bookId, dateAdded: new Date() }).subscribe(() => {
            this.notificationService.showNotification(book, 'added');
          });
        } else {
          this.toastr.error('Failed to add to library', 'Error');
        }
      }
    });
  }
  
  // Rating and Review Methods
  setRating(rating: number) {
    this.newReview.rating = rating;
  }
  
  submitReview() {
    if (!this.newReview.rating || !this.newReview.comment.trim() || !this.currentUserId) {
      this.toastr.error('Please provide both rating and comment', 'Error');
      return;
    }
    
    const review = {
      bookId: this.book.bookId,
      userId: this.currentUserId,
      userName: this.currentUserName,
      rating: this.newReview.rating,
      comment: this.newReview.comment.trim()
    };
    
    this.reviewsService.addReview(review).subscribe({
      next: (newReview) => {
        this.userReview = newReview;
        this.newReview = { rating: 0, comment: '' };
        this.toastr.success('Review submitted successfully!', 'Success');
        this.loadReviews();
        this.loadBookRating();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        this.toastr.error('Failed to submit review', 'Error');
      }
    });
  }
  
  startEditReview() {
    if (this.userReview) {
      this.editReview = {
        rating: this.userReview.rating,
        comment: this.userReview.comment
      };
      this.isEditingReview = true;
    }
  }
  
  saveReview() {
    if (!this.userReview?._id || !this.editReview.rating || !this.editReview.comment.trim()) {
      this.toastr.error('Please provide both rating and comment', 'Error');
      return;
    }
    
    this.reviewsService.updateReview(this.userReview._id, {
      rating: this.editReview.rating,
      comment: this.editReview.comment.trim()
    }).subscribe({
      next: (updatedReview) => {
        this.userReview = updatedReview;
        this.isEditingReview = false;
        this.toastr.success('Review updated successfully!', 'Success');
        this.loadReviews();
        this.loadBookRating();
      },
      error: (error) => {
        console.error('Error updating review:', error);
        this.toastr.error('Failed to update review', 'Error');
      }
    });
  }
  
  cancelEdit() {
    this.isEditingReview = false;
    this.editReview = { rating: 0, comment: '' };
  }
  
  deleteReview() {
    if (!this.userReview?._id) return;
    
    if (confirm('Are you sure you want to delete your review?')) {
      this.reviewsService.deleteReview(this.userReview._id).subscribe({
        next: () => {
          this.userReview = null;
          this.toastr.success('Review deleted successfully!', 'Success');
          this.loadReviews();
          this.loadBookRating();
        },
        error: (error) => {
          console.error('Error deleting review:', error);
          this.toastr.error('Failed to delete review', 'Error');
        }
      });
    }
  }
  
  getRatingPercentage(rating: number): number {
    if (!this.bookRating?.totalReviews) return 0;
    const count = this.bookRating.ratingDistribution[rating as keyof typeof this.bookRating.ratingDistribution] || 0;
    return (count / this.bookRating.totalReviews) * 100;
  }
  
  getRatingCount(rating: number): number {
    if (!this.bookRating?.ratingDistribution) return 0;
    return this.bookRating.ratingDistribution[rating as keyof typeof this.bookRating.ratingDistribution] || 0;
  }
  
  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  
  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    
    return d.toLocaleDateString();
  }
}