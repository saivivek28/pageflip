import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent implements OnInit {
  libraryBooks: any[] = [];
  filteredLibraryBooks: any[] = [];
  notifications: any[] = [];
  
  // View and display
  viewMode: 'grid' | 'list' = 'grid';
  
  // Filters
  selectedGenres: string[] = [];
  selectedYears: string[] = [];
  selectedRatings: number[] = [];
  availableGenres: string[] = [];
  availableYears: string[] = [];
  availableRatings: number[] = [1, 2, 3, 4, 5];
  
  // Sorting
  sortBy: string = 'title';
  
  // Pagination
  currentPage: number = 1;
  booksPerPage: number = 12;
  hasMoreBooks: boolean = false;
  isLoading: boolean = false;

  constructor() {}

  ngOnInit() {
    this.loadLibraryBooks();
  }

  loadLibraryBooks() {
    const userId = localStorage.getItem('id');
    if (userId) {
      const stored = localStorage.getItem(`libraryBooks_${userId}`);
      this.libraryBooks = stored ? JSON.parse(stored) : [];
      this.setupFilters(); // Call setupFilters after books are loaded
      this.applyFiltersAndSort();
    }
  }

  setupFilters() {
    // Extract unique genres and years from library books
    if (this.libraryBooks && this.libraryBooks.length > 0) {
      this.availableGenres = [...new Set(this.libraryBooks.map(book => book.genre).filter(Boolean))];
      this.availableYears = [...new Set(this.libraryBooks.map(book => book.publicationYear || 'Unknown').filter(Boolean))];
    } else {
      this.availableGenres = [];
      this.availableYears = [];
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

  toggleYearFilter(year: string) {
    const index = this.selectedYears.indexOf(year);
    if (index > -1) {
      this.selectedYears.splice(index, 1);
    } else {
      this.selectedYears.push(year);
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

  applyFiltersAndSort() {
    let filtered = [...this.libraryBooks];

    // Apply genre filter
    if (this.selectedGenres.length > 0) {
      filtered = filtered.filter(book => this.selectedGenres.includes(book.genre));
    }

    // Apply year filter
    if (this.selectedYears.length > 0) {
      filtered = filtered.filter(book => this.selectedYears.includes(book.publicationYear || 'Unknown'));
    }

    // Apply rating filter
    if (this.selectedRatings.length > 0) {
      filtered = filtered.filter(book => this.selectedRatings.includes(book.rating || 5));
    }

    // Apply sorting
    filtered = this.sortBooks(filtered);

    this.filteredLibraryBooks = filtered;
    this.currentPage = 1;
    this.hasMoreBooks = filtered.length > this.booksPerPage;
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
      case 'date-added':
        return books.sort((a, b) => new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime());
      default:
        return books;
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedGenres.length > 0 || this.selectedYears.length > 0 || this.selectedRatings.length > 0;
  }

  clearAllFilters() {
    this.selectedGenres = [];
    this.selectedYears = [];
    this.selectedRatings = [];
    this.applyFiltersAndSort();
  }

  toggleFavorite(book: any) {
    book.isFavorite = !book.isFavorite;
    this.saveLibraryBooks();
    this.showNotification(book, book.isFavorite ? 'favorited' : 'unfavorited');
  }

  removeBook(index: number): void {
    const userId = localStorage.getItem('id');
    if (!userId) return;

    const removedBook = this.libraryBooks[index];
    this.libraryBooks.splice(index, 1);
    this.saveLibraryBooks();
    this.applyFiltersAndSort();
    this.showNotification(removedBook, 'removed');
  }

  saveLibraryBooks() {
    const userId = localStorage.getItem('id');
    if (userId) {
      localStorage.setItem(`libraryBooks_${userId}`, JSON.stringify(this.libraryBooks));
    }
  }

  loadMoreBooks() {
    this.isLoading = true;
    // Simulate loading delay
    setTimeout(() => {
      this.currentPage++;
      this.isLoading = false;
      this.hasMoreBooks = this.filteredLibraryBooks.length > this.currentPage * this.booksPerPage;
    }, 500);
  }

  showNotification(book: any, type: string): void {
    const messages: { [key: string]: string } = {
      'removed': `${book.title} removed from library`,
      'favorited': `${book.title} added to favorites`,
      'unfavorited': `${book.title} removed from favorites`
    };

    const message = messages[type] || 'Book updated';
    console.log(message, 'Library Update');
  }
}
