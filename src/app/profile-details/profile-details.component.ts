import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { filter, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, HttpClientModule],
  templateUrl: './profile-details.component.html',
  styleUrls: ['./profile-details.component.css']
})
export class ProfileDetailsComponent implements OnInit, OnDestroy {
  userData: any;
  private routerSubscription: Subscription;
  private profileImageUpdateListener: (event: Event) => void;

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

    // Listen for profile image updates from edit-profile component
    this.profileImageUpdateListener = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (this.userData && customEvent.detail) {
        this.userData.profileImageUrl = customEvent.detail.imageUrl;
      }
    };
  }

  ngOnInit() {
    this.loadUserData();
    // Add event listener for profile image updates
    window.addEventListener('profileImageUpdated', this.profileImageUpdateListener);
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    // Remove event listener
    window.removeEventListener('profileImageUpdated', this.profileImageUpdateListener);
  }

  loadUserData() {
    let userId = localStorage.getItem('id') || localStorage.getItem('userId');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
  
    // Load cached data for fast UI
    const localUserData = localStorage.getItem('userData');
    if (localUserData) {
      try {
        this.userData = JSON.parse(localUserData);
      } catch (e) {
        console.error('Error parsing local user data', e);
      }
    }
  
    // Fetch fresh data
    this.http.get(`${environment.apiUrl}/user/${userId}`).subscribe({
      next: (res: any) => {
        this.userData = res;
        // make sure userData also contains `id` or `_id` for later use
        localStorage.setItem('userData', JSON.stringify(this.userData));
        localStorage.setItem('id', res.id || res._id);  // ✅ ensure id stored consistently
      },
      error: (err: any) => {
        console.error('Failed to fetch user data from API', err);
      }
    });
  }
  

  getProfileImageUrl(): string {
    return this.userData?.profileImageUrl || 'https://placehold.co/150x150/cccccc/666666?text=Profile&font=roboto';
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }
}
