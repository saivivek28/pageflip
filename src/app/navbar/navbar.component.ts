import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { environment } from '../../environments/environment';
import { ThemeService } from '../theme.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { LibraryService } from '../services/library.service';

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
    @Inject(PLATFORM_ID) private platformId: Object,
    private libraryService: LibraryService
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

      // One-time migration of existing localStorage library to backend
      this.migrateLibraryFromLocalStorage(userId);
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
    localStorage.removeItem('userData');
    localStorage.removeItem('JWT_token');
    localStorage.removeItem('id');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
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

  // One-time migration of existing local library to the backend once per user
  private migrateLibraryFromLocalStorage(userId: string) {
    try {
      const migratedFlag = localStorage.getItem(`library_migrated_${userId}`);
      if (migratedFlag === '1') return;

      const key = `libraryBooks_${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) {
        localStorage.setItem(`library_migrated_${userId}`, '1');
        return;
      }

      const books = JSON.parse(stored || '[]');
      if (!Array.isArray(books) || books.length === 0) {
        localStorage.setItem(`library_migrated_${userId}`, '1');
        localStorage.removeItem(key);
        return;
      }

      let completed = 0;
      const total = books.length;
      const done = () => {
        completed++;
        if (completed >= total) {
          // Mark as migrated and remove old key
          localStorage.setItem(`library_migrated_${userId}`, '1');
          localStorage.removeItem(key);
        }
      };

      for (const b of books) {
        const payload: any = {
          bookId: b.bookId || b._id,
          isFavorite: !!b.isFavorite,
          rating: b.userRating ?? b.rating ?? undefined,
          dateAdded: b.dateAdded || new Date()
        };
        if (!payload.bookId) { done(); continue; }
        this.libraryService.addToLibrary(userId, payload).subscribe({
          next: () => done(),
          error: () => {
            // Try update if add fails (in case it already exists)
            this.libraryService.updateLibraryItem(userId, payload.bookId, { isFavorite: payload.isFavorite, rating: payload.rating }).subscribe({
              next: () => done(),
              error: () => done()
            });
          }
        });
      }
    } catch {
      // If anything goes wrong, set flag to avoid loops but do not crash UI
      localStorage.setItem(`library_migrated_${userId}`, '1');
    }
  }

  get profileImageUrl(): string {
    if (this.userData && this.userData.profileImageUrl) {
      return this.userData.profileImageUrl;
    }
    return 'https://cdn-icons-png.flaticon.com/128/9131/9131529.png';
  }

}