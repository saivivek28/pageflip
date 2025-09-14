import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LibraryService } from '../services/library.service';

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

  constructor(private http: HttpClient, private libraryService: LibraryService) {}

  ngOnInit() {
    this.loadFavoriteBooks();
  }

  loadFavoriteBooks() {
    const userId = localStorage.getItem('id');
    if (!userId) {
      this.favoriteBooks = [];
      this.applyFiltersAndSort();
      return;
    }
    this.libraryService.getFavorites(userId).subscribe((items) => {
      this.favoriteBooks = items || [];
      this.setupFilters();
      this.applyFiltersAndSort();
    });
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
    const userId = localStorage.getItem('id');
    if (!userId) return;
    const newVal = !book.isFavorite;
    this.libraryService.updateLibraryItem(userId, book.bookId, { isFavorite: newVal }).subscribe({
      next: () => {
        if (!newVal) {
          this.favoriteBooks = this.favoriteBooks.filter(b => b.bookId !== book.bookId);
          this.filteredFavoriteBooks = this.filteredFavoriteBooks.filter(b => b.bookId !== book.bookId);
        } else {
          book.isFavorite = true;
        }
        this.applyFiltersAndSort();
      },
      error: (err) => {
        if (err?.status === 404) {
          // Create the item then toggle favorite
          this.libraryService.addToLibrary(userId, { bookId: book.bookId, isFavorite: newVal, dateAdded: new Date() }).subscribe(() => {
            if (!newVal) {
              this.favoriteBooks = this.favoriteBooks.filter(b => b.bookId !== book.bookId);
              this.filteredFavoriteBooks = this.filteredFavoriteBooks.filter(b => b.bookId !== book.bookId);
            } else {
              book.isFavorite = true;
            }
            this.applyFiltersAndSort();
          });
        }
      }
    });
  }

  // Removed localStorage persistence. Changes are saved via LibraryService API.

  removeFromFavorites(book: any) {
    const userId = localStorage.getItem('id');
    if (!userId) return;
    this.libraryService.updateLibraryItem(userId, book.bookId, { isFavorite: false }).subscribe(() => {
      this.filteredFavoriteBooks = this.filteredFavoriteBooks.filter(b => b.bookId !== book.bookId);
      this.favoriteBooks = this.favoriteBooks.filter(b => b.bookId !== book.bookId);
      this.applyFiltersAndSort();
    });
  }

  rateBook(book: any, rating: number) {
    if (!book || !book.bookId || this.submittingRatingFor) return;
    this.submittingRatingFor = book.bookId;
    const url = `${environment.apiUrl}/books/${book.bookId}/rate`;
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

        // Optionally persist personal rating in user library item
        const userId = localStorage.getItem('id');
        if (userId) {
          this.libraryService.updateLibraryItem(userId, book.bookId, { rating }).subscribe({
            error: (err) => {
              if (err?.status === 404) {
                this.libraryService.addToLibrary(userId, { bookId: book.bookId, rating, dateAdded: new Date() }).subscribe(() => {});
              }
            }
          });
        }

        this.submittingRatingFor = null;
      },
      error: () => {
        this.submittingRatingFor = null;
      }
    });
  }
}
