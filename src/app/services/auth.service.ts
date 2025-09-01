import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  message: string;
  token: string;
  _id: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, private toastService: ToastService) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token && response.role) {
            // Store authentication data
            localStorage.setItem('JWT_token', response.token);
            localStorage.setItem('id', response._id);
            localStorage.setItem('role', response.role);
            
            this.isLoggedInSubject.next(true);
            
            // Role-based redirect with success message
            if (response.role === 'admin') {
              this.toastService.success('Welcome!', 'Admin login successful');
              this.router.navigate(['/admin/dashboard']);
            } else {
              this.toastService.success('Welcome!', 'Login successful');
              this.router.navigate(['/home']);
            }
          }
        })
      );
  }

  adminLogin(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/admin/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token && response.role === 'admin') {
            // Store admin authentication data
            localStorage.setItem('JWT_token', response.token);
            localStorage.setItem('id', response._id);
            localStorage.setItem('role', response.role);
            
            this.isLoggedInSubject.next(true);
            
            // Use setTimeout to ensure localStorage is set before navigation
            setTimeout(() => {
              this.toastService.success('Welcome Admin!', 'Login successful');
              this.router.navigate(['/admin/dashboard']);
            }, 100);
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('JWT_token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('userData');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('phone');
    localStorage.removeItem('address');
    
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/home']);
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  isAdmin(): boolean {
    return localStorage.getItem('role') === 'admin';
  }

  isUser(): boolean {
    return localStorage.getItem('role') === 'user';
  }

  getToken(): string | null {
    return localStorage.getItem('JWT_token');
  }

  getUserId(): string | null {
    return localStorage.getItem('id');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  private hasToken(): boolean {
    const token = localStorage.getItem('JWT_token');
    const userId = localStorage.getItem('id');
    return !!(token && userId);
  }
}
