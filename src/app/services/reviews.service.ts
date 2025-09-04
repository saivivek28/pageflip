import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Review {
  _id?: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface BookRating {
  bookId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReviewsService {
  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  public reviews$ = this.reviewsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get reviews for a specific book
  getBookReviews(bookId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${environment.apiUrl}/reviews/${bookId}`);
  }

  // Get book rating statistics
  getBookRating(bookId: string): Observable<BookRating> {
    return this.http.get<BookRating>(`${environment.apiUrl}/reviews/${bookId}/rating`);
  }

  // Add a new review
  addReview(review: Omit<Review, '_id' | 'createdAt'>): Observable<Review> {
    const newReview = {
      ...review,
      createdAt: new Date()
    };
    return this.http.post<Review>(`${environment.apiUrl}/reviews`, newReview);
  }

  // Update an existing review
  updateReview(reviewId: string, review: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${environment.apiUrl}/reviews/${reviewId}`, review);
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/reviews/${reviewId}`);
  }

  // Check if user has already reviewed a book
  getUserReview(bookId: string, userId: string): Observable<Review | null> {
    return this.http.get<Review | null>(`${environment.apiUrl}/reviews/${bookId}/user/${userId}`);
  }

  // Get all reviews by a user
  getUserReviews(userId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${environment.apiUrl}/reviews/user/${userId}`);
  }
}
