import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): boolean {
    const token = this.authService.getToken();
    const role = this.authService.getRole();
    
    console.log('AdminGuard - Token:', token);
    console.log('AdminGuard - Role:', role);
    
    if (token && role === 'admin') {
      console.log('AdminGuard - Access granted');
      return true;
    }
    
    console.log('AdminGuard - Access denied, redirecting to admin login');
    this.router.navigate(['/admin/login']);
    return false;
  }
}
