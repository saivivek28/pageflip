import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { environment } from '../../environments/environment';
import { ThemeService } from '../theme.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  filterOption: string = '';
  userData: any;
  showProfile: boolean = false;

  @Output() search = new EventEmitter<string>();

  private searchSubject = new Subject<string>(); // 🔥 RxJS Subject

  constructor(private router: Router, private http: HttpClient, public theme: ThemeService) {}

  ngOnInit() {
    // ✅ Debounce search to wait until user pauses typing
    this.searchSubject
      .pipe(debounceTime(1000), distinctUntilChanged()) // wait 300ms & ignore same values
      .subscribe(query => {
        this.search.emit(query);
        // Auto navigate when typing
        this.router.navigate(['/home'], { queryParams: { q: query || '', scroll: '1' } });
      });

    // Fetch user details
    const userId = localStorage.getItem('id') || ((): string | null => {
      try { const u = JSON.parse(localStorage.getItem('userData') || '{}'); return u?._id || u?.id || null; } catch { return null; }
    })();
    if (userId) {
      this.http.get(`${environment.apiUrl}/user/${userId}`).subscribe({
        next: (res) => {
          const localUserData = (() => {
            try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; }
          })();
          this.userData = { ...(localUserData || {}), ...(res as any) };
        },
        error: (err) => {
          console.error('Error fetching user data', err);
          try { this.userData = JSON.parse(localStorage.getItem('userData') || '{}'); } catch {}
        }
      });
    }
  }

  // Instead of directly emitting → push into subject
  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  // Still handle Enter key → immediate search
  onSearchEnter() {
    this.search.emit(this.searchQuery);
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
    this.router.navigate(['/login']);
    console.log("User logged out");
  }

  get profileImageUrl(): string {
    if (this.userData && this.userData.profileImageUrl) {
      return this.userData.profileImageUrl;
    }
    return 'https://cdn-icons-png.flaticon.com/128/9131/9131529.png';
  }
}
