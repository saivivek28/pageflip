import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RecentlyViewedBook {
  bookId: string;
  title: string;
  author: string;
  coverImage: string;
  viewedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RecentlyViewedService {
  private readonly STORAGE_KEY = 'recentlyViewedBooks';
  private readonly MAX_RECENT_BOOKS = 10;
  
  private recentBooksSubject = new BehaviorSubject<RecentlyViewedBook[]>([]);
  public recentBooks$ = this.recentBooksSubject.asObservable();

  constructor() {
    this.loadRecentBooks();
  }

  private loadRecentBooks(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const books = JSON.parse(stored).map((book: any) => ({
          ...book,
          viewedAt: new Date(book.viewedAt)
        }));
        this.recentBooksSubject.next(books);
      }
    } catch (error) {
      console.warn('Error loading recently viewed books:', error);
    }
  }

  private saveRecentBooks(books: RecentlyViewedBook[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
    } catch (error) {
      console.warn('Error saving recently viewed books:', error);
    }
  }

  addRecentBook(book: Omit<RecentlyViewedBook, 'viewedAt'>): void {
    const currentBooks = this.recentBooksSubject.value;
    
    // Remove if already exists
    const filteredBooks = currentBooks.filter(b => b.bookId !== book.bookId);
    
    // Add to beginning with current timestamp
    const newBook: RecentlyViewedBook = {
      ...book,
      viewedAt: new Date()
    };
    
    const updatedBooks = [newBook, ...filteredBooks].slice(0, this.MAX_RECENT_BOOKS);
    
    this.recentBooksSubject.next(updatedBooks);
    this.saveRecentBooks(updatedBooks);
  }

  getRecentBooks(): RecentlyViewedBook[] {
    return this.recentBooksSubject.value;
  }

  clearRecentBooks(): void {
    this.recentBooksSubject.next([]);
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Error clearing recently viewed books:', error);
    }
  }

  removeRecentBook(bookId: string): void {
    const currentBooks = this.recentBooksSubject.value;
    const updatedBooks = currentBooks.filter(book => book.bookId !== bookId);
    this.recentBooksSubject.next(updatedBooks);
    this.saveRecentBooks(updatedBooks);
  }
}
