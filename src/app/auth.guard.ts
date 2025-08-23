import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('JWT_token');
    const userId = localStorage.getItem('id');

    console.log('AuthGuard running. JWT token from localStorage:', token);
    console.log('User ID from localStorage:', userId);

    // Simple check: if we have both token and userId, allow access
    if (token && userId) {
      return true;
    } else {
      console.log('No valid authentication found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
