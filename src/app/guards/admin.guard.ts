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
    
    if (token && role === 'admin') {
      return true;
    }
    
    this.router.navigate(['/admin/login']);
    return false;
  }
}
