import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
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
export class NavbarComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  filterOption: string = '';
  userData: any;
  showProfile: boolean = false;
  isMobileMenuOpen = false;
  isMobileView = false;

  @Output() search = new EventEmitter<string>();

  private searchSubject = new Subject<string>(); // 🔥 RxJS Subject
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private router: Router, 
    private http: HttpClient, 
    public theme: ThemeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    // Initialize resize observer for responsive behavior
    if (isPlatformBrowser(this.platformId)) {
      this.setupResizeObserver();
      window.addEventListener('resize', this.checkScreenSize.bind(this));
      this.checkScreenSize();
    }

    // Close mobile menu on route change
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.closeMobileMenu();
      }
    });

    // ✅ Debounce search to wait until user pauses typing
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(query => {
        this.search.emit(query);
        if (this.isMobileView) {
          this.router.navigate(['/home'], { queryParams: { q: query || '', scroll: '1' } });
        }
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

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.checkScreenSize.bind(this));
    }
  }

  private setupResizeObserver() {
    if (isPlatformBrowser(this.platformId) && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(entries => {
        this.checkScreenSize();
      });
      this.resizeObserver.observe(document.body);
    }
  }

  private checkScreenSize() {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobileView = window.innerWidth < 992; // Bootstrap's lg breakpoint
      if (!this.isMobileView) {
        this.isMobileMenuOpen = false;
      }
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  get profileImageUrl(): string {
    if (this.userData && this.userData.profileImageUrl) {
      return this.userData.profileImageUrl;
    }
    return 'https://cdn-icons-png.flaticon.com/128/9131/9131529.png';
  }
}
