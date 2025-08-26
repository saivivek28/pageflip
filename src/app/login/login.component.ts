import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  username = '';
  email = '';
  password = '';
  showPassword:boolean = false;
  isLoading = false;
  isAdminLogin = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  setLoginType(isAdmin: boolean) {
    this.isAdminLogin = isAdmin;
    // Clear form when switching login types
    this.email = '';
    this.password = '';
  }

  signIn() {
    if (!this.email || !this.password) {
      this.toast.error('Validation', 'Please enter both email and password');
      return;
    }

    this.isLoading = true;
    
    const loginMethod = this.isAdminLogin ? 
      this.authService.adminLogin({
        email: this.email,
        password: this.password
      }) : 
      this.authService.login({
        email: this.email,
        password: this.password
      });

    loginMethod.subscribe({
      next: (response) => {
        this.isLoading = false;
        // Navigation is handled by AuthService based on role
      },
      error: (err) => {
        this.isLoading = false;
        const errorMsg = err.error?.error || 'Login failed. Please try again.';
        this.toast.error('Login failed', errorMsg);
      }
    });
  }

}
