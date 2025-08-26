import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css'
})
export class FavoritesComponent implements OnInit {
  favoriteBooks: any[] = [];
  filteredFavoriteBooks: any[] = [];
  submittingRatingFor: string | null = null;
  
  // View and display
  viewMode: 'grid' | 'list' = 'grid';
  
  // Filters
  selectedGenres: string[] = [];
  selectedRatings: number[] = [];
  availableGenres: string[] = [];
  availableRatings: number[] = [1, 2, 3, 4, 5];
  
  // Sorting
  sortBy: string = 'title';
  
  // Search
  searchQuery: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFavoriteBooks();
  }

  loadFavoriteBooks() {
    const userId = localStorage.getItem('id');
    if (userId) {
      const stored = localStorage.getItem(`libraryBooks_${userId}`);
      if (stored) {
        const allBooks = JSON.parse(stored);
        this.favoriteBooks = allBooks.filter((book: any) => book.isFavorite);
        this.setupFilters(); // Call setupFilters after books are loaded
        this.applyFiltersAndSort();
      }
    }
  }

  setupFilters() {
    // Extract unique genres from favorite books
    if (this.favoriteBooks && this.favoriteBooks.length > 0) {
      this.availableGenres = [...new Set(this.favoriteBooks.map(book => book.genre).filter(Boolean))];
    } else {
      this.availableGenres = [];
    }
  }

  setViewMode(mode: 'grid' | 'list') {
    this.viewMode = mode;
  }

  toggleGenreFilter(genre: string) {
    const index = this.selectedGenres.indexOf(genre);
    if (index > -1) {
      this.selectedGenres.splice(index, 1);
    } else {
      this.selectedGenres.push(genre);
    }
    this.applyFiltersAndSort();
  }

  toggleRatingFilter(rating: number) {
    const index = this.selectedRatings.indexOf(rating);
    if (index > -1) {
      this.selectedRatings.splice(index, 1);
    } else {
      this.selectedRatings.push(rating);
    }
    this.applyFiltersAndSort();
  }

  onSortChange() {
    this.applyFiltersAndSort();
  }

  onSearchChange() {
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let filtered = [...this.favoriteBooks];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(book => 
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
      );
    }

    // Apply genre filter
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter(book => this.selectedGenres.includes(book.genre));
    }

    // Apply rating filter
    if (this.selectedRatings.length > 0) {
      filtered = filtered.filter(book => this.selectedRatings.includes(Math.round(book.rating || 0)));
    }

    // Apply sorting
    filtered = this.sortBooks(filtered);

    this.filteredFavoriteBooks = filtered;
  }

  sortBooks(books: any[]): any[] {
    switch (this.sortBy) {
      case 'title':
        return books.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return books.sort((a, b) => b.title.localeCompare(a.title));
      case 'author':
        return books.sort((a, b) => a.author.localeCompare(b.author));
      case 'author-desc':
        return books.sort((a, b) => b.author.localeCompare(a.author));
      case 'rating':
        return books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-desc':
        return books.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      default:
        return books;
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedGenres.length > 0 || this.selectedRatings.length > 0 || this.searchQuery.length > 0;
  }

  clearAllFilters() {
    this.selectedGenres = [];
    this.selectedRatings = [];
    this.searchQuery = '';
    this.applyFiltersAndSort();
  }

  toggleFavorite(book: any) {
    book.isFavorite = !book.isFavorite;
    this.saveFavoriteBooks();
    this.loadFavoriteBooks(); // Reload to update the list
  }

  saveFavoriteBooks() {
    const userId = localStorage.getItem('id');
    if (userId) {
      const stored = localStorage.getItem(`libraryBooks_${userId}`);
      if (stored) {
        const allBooks = JSON.parse(stored);
        const updatedBooks = allBooks.map((book: any) => {
          const favoriteBook = this.favoriteBooks.find(fb => fb.bookId === book.bookId);
          if (favoriteBook) {
            return { ...book, isFavorite: favoriteBook.isFavorite };
          }
          return book;
        });
        localStorage.setItem(`libraryBooks_${userId}`, JSON.stringify(updatedBooks));
      }
    }
  }

  removeFromFavorites(book: any) {
    book.isFavorite = false;
    this.saveFavoriteBooks();
    // Remove from filteredFavoriteBooks immediately for UI responsiveness
    this.filteredFavoriteBooks = this.filteredFavoriteBooks.filter(b => b.bookId !== book.bookId);
    // Also update favoriteBooks for consistency
    this.favoriteBooks = this.favoriteBooks.filter(b => b.bookId !== book.bookId);
    // Optionally, re-apply filters and sort
    this.applyFiltersAndSort();
  }

  rateBook(book: any, rating: number) {
    if (!book || !book.bookId || this.submittingRatingFor) return;
    this.submittingRatingFor = book.bookId;
    const url = `http://127.0.0.1:5000/books/${book.bookId}/rate`;
    this.http.post<any>(url, { rating }).subscribe({
      next: (updated) => {
        // Update the book's rating locally (both arrays)
        const applyUpdate = (b: any) => {
          if (b.bookId === book.bookId) {
            b.rating = updated?.rating ?? b.rating;
            b.totalRatings = updated?.totalRatings ?? b.totalRatings;
          }
        };
        this.favoriteBooks.forEach(applyUpdate);
        this.filteredFavoriteBooks.forEach(applyUpdate);

        // Persist to user's library in localStorage so filters reflect new rating
        const userId = localStorage.getItem('id');
        if (userId) {
          const key = `libraryBooks_${userId}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const allBooks = JSON.parse(stored);
            const updatedBooks = allBooks.map((b: any) => (
              b.bookId === book.bookId ? { ...b, rating: updated?.rating ?? rating, totalRatings: updated?.totalRatings ?? b.totalRatings } : b
            ));
            localStorage.setItem(key, JSON.stringify(updatedBooks));
          }
        }

        this.submittingRatingFor = null;
      },
      error: () => {
        this.submittingRatingFor = null;
      }
    });
  }
}
