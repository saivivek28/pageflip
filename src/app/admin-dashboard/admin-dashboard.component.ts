import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../components/toast/toast.component';

interface Book {
  _id?: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  coverImage: string;
  pages: number;
  publishedDate: string;
  isbn: string;
  rating: number;
  totalRatings: number;
}

interface AdminStats {
  totalUsers: number;
  totalBooks: number;
  totalAdmins: number;
  recentUsers: number;
  averageRating: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, ToastComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  books: Book[] = [];
  stats: AdminStats = {
    totalUsers: 0,
    totalBooks: 0,
    totalAdmins: 0,
    recentUsers: 0,
    averageRating: 0,
    lastUpdated: ''
  };
  isLoading = false;
  isLoadingStats = false;
  showAddBookForm = false;
  editingBook: Book | null = null;
  
  newBook: Book = {
    title: '',
    author: '',
    description: '',
    genre: '',
    coverImage: '',
    pages: 0,
    publishedDate: '',
    isbn: '',
    rating: 0,
    totalRatings: 0
  };

  constructor(private http: HttpClient, private router: Router, private toastService: ToastService) {}

  ngOnInit() {
    this.checkAdminAuth();
    this.loadBooks();
    this.loadStats();
  }

  checkAdminAuth() {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('JWT_token');
    
    if (role !== 'admin' || !token) {
      this.router.navigate(['/admin/login']);
      return;
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('JWT_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  loadBooks() {
    this.isLoading = true;
    this.http.get<Book[]>(`${environment.apiUrl}/books`).subscribe({
      next: (books) => {
        this.books = books;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  loadStats() {
    this.isLoadingStats = true;
    this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (stats) => {
        this.stats = {
          totalUsers: stats.totalUsers || 0,
          totalBooks: stats.totalBooks || 0,
          totalAdmins: stats.totalAdmins || 0,
          recentUsers: stats.recentUsers || 0,
          averageRating: stats.averageRating || 0,
          lastUpdated: stats.lastUpdated || new Date().toISOString()
        };
        this.isLoadingStats = false;
      },
      error: (error) => {
        // Set default values on error
        this.stats = {
          totalUsers: 0,
          totalBooks: 0,
          totalAdmins: 0,
          recentUsers: 0,
          averageRating: 0,
          lastUpdated: new Date().toISOString()
        };
        this.isLoadingStats = false;
      }
    });
  }

  refreshStats() {
    this.loadStats();
  }

  getFormattedTime(isoString: string): string {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  showAddForm() {
    this.router.navigate(['/admin/book/add']);
  }

  hideAddForm() {
    this.showAddBookForm = false;
    this.editingBook = null;
    this.resetNewBook();
  }

  resetNewBook() {
    this.newBook = {
      title: '',
      author: '',
      description: '',
      genre: '',
      coverImage: '',
      pages: 0,
      publishedDate: '',
      isbn: '',
      rating: 0,
      totalRatings: 0
    };
  }

  addBook() {
    if (!this.newBook.title || !this.newBook.author) {
      alert('Title and Author are required');
      return;
    }

    this.isLoading = true;
    
    this.http.post<Book>(`${environment.apiUrl}/admin/books`, this.newBook, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (book) => {
        this.books.push(book);
        this.hideAddForm();
        this.loadStats(); // Refresh stats to show updated book count
        this.isLoading = false;
        this.toastService.success('Success!', 'Book added successfully');
      },
      error: (error) => {
        this.toastService.error('Error!', 'Failed to add book: ' + (error.error?.error || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }

  editBook(book: Book) {
    this.router.navigate(['/admin/book/edit', book._id]);
  }

  updateBook() {
    if (!this.editingBook || !this.newBook.title || !this.newBook.author) {
      this.toastService.warning('Validation Error', 'Title and Author are required');
      return;
    }

    this.isLoading = true;
    this.http.put<Book>(`${environment.apiUrl}/admin/books/${this.editingBook._id}`, this.newBook, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (book) => {
        const index = this.books.findIndex(b => b._id === this.editingBook!._id);
        if (index !== -1) {
          this.books[index] = book;
        }
        this.hideAddForm();
        this.loadStats();
        this.isLoading = false;
        this.toastService.success('Success!', 'Book updated successfully');
      },
      error: (error) => {
        console.error('Error updating book:', error);
        this.toastService.error('Error!', 'Failed to update book: ' + (error.error?.error || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }

  deleteBook(book: Book) {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }

    this.isLoading = true;
    this.http.delete(`${environment.apiUrl}/admin/books/${book._id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.books = this.books.filter(b => b._id !== book._id);
        this.loadStats();
        this.isLoading = false;
        this.toastService.success('Success!', 'Book deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting book:', error);
        this.toastService.error('Error!', 'Failed to delete book: ' + (error.error?.error || 'Unknown error'));
        this.isLoading = false;
      }
    });
  }

  logout() {
    localStorage.removeItem('JWT_token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
}
