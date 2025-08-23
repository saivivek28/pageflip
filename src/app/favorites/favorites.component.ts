import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {
  favoriteBooks: any[] = [];
  filteredFavoriteBooks: any[] = [];
  
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

  constructor() {}

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
      filtered = filtered.filter(book => this.selectedRatings.includes(book.rating || 5));
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
        return books.sort((a, b) => (b.rating || 5) - (a.rating || 5));
      case 'rating-desc':
        return books.sort((a, b) => (a.rating || 5) - (b.rating || 5));
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
}
