import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NavbarComponent } from '../navbar/navbar.component';
import { ChatbotService, ChatMessage } from '../chatbot.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, 
    HttpClientModule,
    RouterLink,
    NavbarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  apiUrl = `${environment.apiUrl}/books`;
  books: any = [];
  filteredBooks: any = [];

  genres: string[] = [
    'Action',
    'Romantic',
    'Sci-Fi',
    'Drama',
    'Fantasy',
    'Horror',
    'Comedy',
    'Self-Help',
    'Philosophy',
    'Classic'
  ];

  selectedGenre: string = 'All';
  searchQuery: string = '';
  // Pagination
  currentPage: number = 1;
  pageSize: number = 12;

  // Hero section properties
  featuredBooks: any[] = [];
  carouselOffset: number = 0;
  currentSlide: number = 0;
  carouselItemWidth: number = 280; // Width of each carousel item including margin
  maxSlides: number = 0;
  isNewUser: boolean = false;

  // Enhanced chatbot properties
  chatOpen = false;
  chatMessages: ChatMessage[] = [];
  userInput = '';
  isTyping = false;
  private chatSubscription: Subscription = new Subscription();
  // Cache for per-session random ratings
  private randomRatings: Map<string, number> = new Map();

  constructor(
    private http: HttpClient,
    private chatbotService: ChatbotService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.getBooks();
    this.initializeChatbot();
    this.route.queryParams.subscribe((params: any) => {
      const q = params['q'];
      const scroll = params['scroll'];
      if (typeof q === 'string') {
        this.searchQuery = q;
        this.currentPage = 1;
      }
      if (scroll) {
        setTimeout(() => this.scrollToBooks(), 0);
      }
    });
  }

  ngOnDestroy() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  getBooks() {
    this.http.get(this.apiUrl).subscribe((data: any) => {
      this.books = data;
      console.log('Raw API data:', data);
      this.filteredBooks = this.books;
      console.log('Featured after set:', this.featuredBooks);
      
      // Set featured books based on user data or random selection
      this.setFeaturedBooks();
      
      // Update chatbot with books data
      this.chatbotService.updateBooksDatabase(this.books);
    });
  }

  setFeaturedBooks() {
    const userId = localStorage.getItem('id');
    if (userId) {
      // Check if user has library books
      const stored = localStorage.getItem(`libraryBooks_${userId}`);
      if (stored) {
        const userBooks = JSON.parse(stored);
        // Get user's favorite books first
        const favorites = userBooks.filter((book: any) => book.isFavorite);
        
        if (favorites.length >= 6) {
          // If user has 6+ favorites, use them
          this.featuredBooks = favorites.slice(0, 6);
          this.isNewUser = false;
        } else if (favorites.length > 0) {
          // Mix favorites with some random books
          const remainingSlots = 6 - favorites.length;
          const randomBooks = this.getRandomBooks(remainingSlots, favorites.map((b: any) => b.bookId));
          this.featuredBooks = [...favorites, ...randomBooks];
          this.isNewUser = false;
        } else {
          // User has no favorites, show random books
          this.featuredBooks = this.getRandomBooks(6);
          this.isNewUser = true;
        }
      } else {
        // New user, show random popular books
        this.featuredBooks = this.getRandomBooks(6);
        this.isNewUser = true;
      }
    } else {
      // No user logged in, show random books
      this.featuredBooks = this.getRandomBooks(6);
      this.isNewUser = true;
    }
    
    // Calculate max slides for carousel
    this.maxSlides = Math.max(0, this.featuredBooks.length - 3);
  }

  // Compute a display rating for a book. If the book has a numeric rating, use it.
  // Otherwise, generate a per-session random rating (cached) so UI looks varied on each visit.
  displayRating(book: any): number {
    const r = Number(book?.rating);
    if (!isNaN(r) && r > 0) return Math.max(0, Math.min(5, r));
    const id = String(book?.bookId || book?.id || '');
    if (!id) return 0;
    if (this.randomRatings.has(id)) return this.randomRatings.get(id)!;
    // Random between 3.0 and 5.0, rounded to 0.5 steps
    const min = 3.0;
    const max = 5.0;
    const raw = min + Math.random() * (max - min);
    const val = Math.round(raw * 2) / 2;
    this.randomRatings.set(id, val);
    return val;
  }

  getRandomBooks(count: number, excludeIds: string[] = []): any[] {
    const availableBooks = this.books.filter((book: any) => !excludeIds.includes(book.bookId));
    const shuffled = [...availableBooks].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Carousel navigation methods
  nextSlide() {
    if (this.currentSlide < this.maxSlides) {
      this.currentSlide++;
      this.carouselOffset = -this.currentSlide * this.carouselItemWidth;
    }
  }

  previousSlide() {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.carouselOffset = -this.currentSlide * this.carouselItemWidth;
    }
  }

  goToSlide(index: number) {
    this.currentSlide = index;
    this.carouselOffset = -this.currentSlide * this.carouselItemWidth;
  }

  getCarouselIndicators(): number[] {
    const indicators = [];
    for (let i = 0; i <= this.maxSlides; i++) {
      indicators.push(i);
    }
    return indicators;
  }

  scrollToBooks() {
    const booksSection = document.getElementById('books-section');
    if (booksSection) {
      booksSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Removed goToAdminLogin method - admin access only via direct URL

  // Method to update filtered books based on current search and genre
  updateFilteredBooks() {
    if (!this.books || this.books.length === 0) {
      this.filteredBooks = [];
      return;
    }
    
    if (this.selectedGenre === 'All') {
      this.filteredBooks = [...this.books];
    } else {
      this.filteredBooks = this.books.filter(
        (book: any) => book && book.genre && book.genre.toLowerCase() === this.selectedGenre.toLowerCase()
      );
    }
    this.currentPage = 1;
  }

  initializeChatbot() {
    this.chatSubscription = this.chatbotService.messages$.subscribe(
      (messages: ChatMessage[]) => {
        this.chatMessages = messages;
      }
    );
  }

  filterByGenre(genre: string) {
    this.selectedGenre = genre;
    if (genre === 'All') {
      this.filteredBooks = [...this.books];
    } else {
      this.filteredBooks = this.books.filter(
        (book: any) => book && book.genre && book.genre.toLowerCase() === genre.toLowerCase()
      );
    }
    this.currentPage = 1;
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
  }

  handleUserInput() {
    if (!this.userInput.trim()) return;

    this.isTyping = true;
    this.chatbotService.sendMessage(this.userInput);
    this.userInput = '';
    
    // Remove typing indicator after response
    setTimeout(() => {
      this.isTyping = false;
    }, 600);
  }

  onSuggestionClick(suggestion: string) {
    this.userInput = suggestion;
    this.handleUserInput();
  }

  clearChat(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    // Optional: Add confirmation for better UX
    if (this.chatMessages.length > 1) {
      const confirmClear = confirm('Are you sure you want to clear the chat history?');
      if (!confirmClear) {
        return;
      }
    }
    
    this.chatbotService.clearChat();
  }

  minimizeChat(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.chatOpen = false;
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.handleUserInput();
    }
  }
  // Navbar search handler
  onSearch(query: string) {
    this.searchQuery = query || '';
    this.currentPage = 1;
    // update URL for shareability and allow scroll trigger
    this.router.navigate([], { queryParams: { q: this.searchQuery, scroll: '1' }, queryParamsHandling: 'merge' });
    this.scrollToBooks();
  }

  // Derived data
  get filteredAndSearchedBooks(): any[] {
    const data = this.filteredBooks && Array.isArray(this.filteredBooks) ? this.filteredBooks : [];
    const q = (this.searchQuery || '').trim().toLowerCase();
    if (!q) return data;
    return data.filter((book: any) => {
      const title = (book?.title || '').toLowerCase();
      const author = (book?.author || '').toLowerCase();
      return title.includes(q) || author.includes(q);
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAndSearchedBooks.length / this.pageSize));
  }

  get pagedBooks(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSearchedBooks.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.scrollToBooks();
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }
}

// Helper functions for pagination and search within the component class
