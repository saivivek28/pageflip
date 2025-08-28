import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../components/toast/toast.component';
import { environment } from '../../environments/environment';

interface Book {
  _id?: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  coverImage: string;
  pdfUrl?: string;
  pages: number;
  publishedDate: string;
  isbn: string;
  rating: number;
  totalRatings: number;
}

@Component({
  selector: 'app-admin-book-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, ToastComponent],
  templateUrl: './admin-book-form.component.html',
  styleUrls: ['./admin-book-form.component.css']
})
export class AdminBookFormComponent implements OnInit {
  book: Book = {
    title: '',
    author: '',
    description: '',
    genre: '',
    coverImage: '',
    pdfUrl: '',
    pages: 0,
    publishedDate: '',
    isbn: '',
    rating: 0,
    totalRatings: 0
  };
  
  isEditMode = false;
  isLoading = false;
  bookId: string | null = null;

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.checkAdminAuth();
    
    // Check if we're in edit mode
    this.bookId = this.route.snapshot.paramMap.get('id');
    if (this.bookId) {
      this.isEditMode = true;
      this.loadBook(this.bookId);
    }
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

  loadBook(id: string) {
    this.isLoading = true;
    this.http.get<Book>(`${environment.apiUrl}/books/${id}`, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: (book) => {
        this.book = book;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading book:', error);
        this.toastService.error('Error!', 'Failed to load book details');
        this.isLoading = false;
        this.router.navigate(['/admin/dashboard']);
      }
    });
  }

  onSubmit() {
    if (!this.book.title || !this.book.author) {
      this.toastService.warning('Validation Error', 'Title and Author are required');
      return;
    }

    this.isLoading = true;

    if (this.isEditMode && this.bookId) {
      this.updateBook();
    } else {
      this.addBook();
    }
  }

  addBook() {
    this.http.post(`${environment.apiUrl}/admin/books`, this.book, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.toastService.success('Success!', 'Book added successfully');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        console.error('Error adding book:', error);
        this.toastService.error('Error!', 'Failed to add book');
        this.isLoading = false;
      }
    });
  }

  updateBook() {
    if (!this.bookId) return;
    
    this.http.put(`${environment.apiUrl}/admin/books/${this.bookId}`, this.book, {
      headers: this.getAuthHeaders()
    }).subscribe({
      next: () => {
        this.toastService.success('Success!', 'Book updated successfully');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (error) => {
        console.error('Error updating book:', error);
        this.toastService.error('Error!', 'Failed to update book');
        this.isLoading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/dashboard']);
  }

  resetForm() {
    this.book = {
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

  onImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
