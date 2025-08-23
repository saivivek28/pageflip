import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports:[FormsModule, CommonModule, HttpClientModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  filterOption: string = '';
  userData: any;
  showProfile: boolean = false;

  @Output() search = new EventEmitter<string>();

  constructor(private router: Router, private http: HttpClient, public theme: ThemeService) {}

  ngOnInit() {
    const userId = localStorage.getItem('id') || ((): string | null => {
      try { const u = JSON.parse(localStorage.getItem('userData') || '{}'); return u?._id || u?.id || null; } catch { return null; }
    })();
    if (userId) {
      this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
        next: (res) => {
          const localUserData = (() => {
            try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
          })();
          // Merge to preserve profileImageUrl if API doesn't include it
          this.userData = { ...(localUserData || {}), ...(res as any) };
        },
        error: (err) => {
          console.error('Error fetching user data', err);
          // Fallback to local user data if available
          try { this.userData = JSON.parse(localStorage.getItem('userData') || '{}'); } catch {}
        }
      });
    }
    
    // Initialize theme state - ensure it's properly initialized
    try {
      const isDark = this.theme.isDarkMode;
      console.log('Theme initialized:', isDark ? 'Dark' : 'Light');
    } catch (error) {
      console.warn('Theme initialization error:', error);
    }
  }

  onSearchChange() {
    this.search.emit(this.searchQuery);
  }

  onSearchEnter() {
    // Trigger search on Enter key press
    this.search.emit(this.searchQuery);
    // Navigate to home with query params to trigger scroll
    this.router.navigate(['/home'], { queryParams: { q: this.searchQuery || '', scroll: '1' } });
  }

  toggleProfileDropdown() {
    this.showProfile = !this.showProfile;
  }
  showMenu = false;

  toggleTheme() {
    this.theme.toggleTheme();
  }

  logout() {
    // Your logout logic here
    this.router.navigate(['/login']);
    console.log("User logged out");
  }

  get profileImageUrl(): string {
    if (this.userData && this.userData.profileImageUrl) {
      return this.userData.profileImageUrl;
    }
    return 'https://cdn-icons-png.flaticon.com/128/9131/9131529.png';
  }


  // logout() {
  //   localStorage.removeItem('userId');
  //   localStorage.removeItem('token');
  //   this.router.navigate(['/login']);
  // }
}
