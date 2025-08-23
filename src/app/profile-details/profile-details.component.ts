import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports:[FormsModule, CommonModule,RouterLink],
  templateUrl: './profile-details.component.html',
  styleUrls: ['./profile-details.component.css']
})
export class ProfileDetailsComponent implements OnInit, OnDestroy {
  userData: any;
  private routerSubscription: Subscription;

  constructor(private http: HttpClient, private router: Router) {
    // Subscribe to router events to refresh data when navigating back
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Refresh data when navigating to this component
      if (this.router.url === '/profile') {
        this.loadUserData();
      }
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadUserData() {
    const userId = localStorage.getItem('id') || ((): string | null => {
      try { const u = JSON.parse(localStorage.getItem('userData') || '{}'); return u?._id || u?.id || null; } catch { return null; }
    })();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Try to get user data from localStorage first
    const localUserData = localStorage.getItem('userData');
    if (localUserData) {
      try {
        this.userData = JSON.parse(localUserData);
      } catch (e) {
        console.error('Error parsing local user data', e);
      }
    }

    // Also try to fetch from API if available
    this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
      next: (res) => {
        // Base merge
        const merged = { ...(this.userData || {}), ...(res as any) } as any;
        // Prefer non-empty local values for phone/address if API is missing/empty
        const localPhone = (this.userData && this.userData.phone) || localStorage.getItem('phone') || '';
        const localAddress = (this.userData && this.userData.address) || localStorage.getItem('address') || '';
        const prefer = (apiVal: any, localVal: string) => (apiVal !== undefined && apiVal !== null && apiVal !== '' ? apiVal : localVal);
        merged.phone = prefer((res as any).phone, localPhone);
        merged.address = prefer((res as any).address, localAddress);
        this.userData = merged;
        // Store merged data in localStorage for future use
        localStorage.setItem('userData', JSON.stringify(this.userData));
        if (this.userData.phone) localStorage.setItem('phone', this.userData.phone);
        if (this.userData.address) localStorage.setItem('address', this.userData.address);
      },
      error: (err) => {
        console.log('API not available, using local data');
        // If API is not available and we don't have local data, create default
        if (!this.userData) {
          this.userData = {
            name: localStorage.getItem('name') || 'User',
            email: localStorage.getItem('email') || 'user@example.com',
            phone: localStorage.getItem('phone') || '',
            address: localStorage.getItem('address') || ''
          };
        }
      }
    });
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }
}
