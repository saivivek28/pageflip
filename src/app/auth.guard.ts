import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('JWT_token');

    console.log('AuthGuard running. JWT token from localStorage:', token);

    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const expiry = decoded.exp;
        const now = Math.floor(Date.now() / 1000);

        if (expiry > now) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      } catch (error) {
        console.error('Invalid token:', error);
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
