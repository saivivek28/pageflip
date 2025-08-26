import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-book-reader',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './book-reader.component.html',
  styleUrl: './book-reader.component.css'
})
export class BookReaderComponent implements OnInit, OnDestroy {
  @ViewChild('readerContainer', { static: true }) readerContainer!: ElementRef;

  book: any;
  currentPage = 1;
  totalPages = 100; // Default, will be updated based on book content
  pages: string[] = [];
  isFullscreen = false;
  
  // Touch gesture properties
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;
  private minSwipeDistance = 50;
  private maxVerticalDistance = 100;
  
  // Animation properties
  public isAnimating = false;
  private animationDuration = 400; // Optimized for mobile
  
  // Event handler references for proper cleanup
  private handleTouchStart!: (event: TouchEvent) => void;
  private handleTouchMove!: (event: TouchEvent) => void;
  private handleTouchEnd!: (event: TouchEvent) => void;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadBook();
    this.generatePages();
    this.setupTouchListeners();
  }

  ngOnDestroy() {
    this.removeTouchListeners();
  }

  loadBook() {
    const bookId = this.route.snapshot.paramMap.get('id');
    // In a real app, you would fetch the book from an API
    this.book = {
      id: bookId,
      title: 'Sample Book',
      author: 'Sample Author',
      content: 'This is the content of the book...'
    };
  }

  generatePages() {
    // Generate sample pages - in a real app, this would come from the book data
    this.pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      this.pages.push(`Page ${i} content goes here. This is a sample page with some text content that would normally come from the actual book data.`);
    }
  }

  setupTouchListeners() {
    if (this.readerContainer?.nativeElement) {
      const container = this.readerContainer.nativeElement;
      
      this.handleTouchStart = this.onTouchStart.bind(this);
      this.handleTouchMove = this.onTouchMove.bind(this);
      this.handleTouchEnd = this.onTouchEnd.bind(this);
      
      container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
      container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    }
  }

  removeTouchListeners() {
    if (this.readerContainer?.nativeElement) {
      const container = this.readerContainer.nativeElement;
      
      container.removeEventListener('touchstart', this.handleTouchStart);
      container.removeEventListener('touchmove', this.handleTouchMove);
      container.removeEventListener('touchend', this.handleTouchEnd);
    }
  }

  onTouchStart(event: TouchEvent) {
    if (this.isAnimating) {
      event.preventDefault();
      return;
    }
    
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchMove(event: TouchEvent) {
    if (this.isAnimating) {
      event.preventDefault();
      return;
    }
    
    // Prevent default scrolling during horizontal swipes
    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartX);
    const deltaY = Math.abs(touch.clientY - this.touchStartY);
    
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (this.isAnimating) {
      event.preventDefault();
      return;
    }
    
    const touch = event.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
    
    this.handleSwipeGesture();
  }

  handleSwipeGesture() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = Math.abs(this.touchEndY - this.touchStartY);
    
    // Check if it's a horizontal swipe (not vertical scroll)
    if (deltaY > this.maxVerticalDistance) {
      return;
    }
    
    // Check swipe distance
    if (Math.abs(deltaX) < this.minSwipeDistance) {
      return;
    }
    
    // Determine swipe direction and navigate
    if (deltaX > 0) {
      // Swipe right - previous page
      this.previousPage();
    } else {
      // Swipe left - next page
      this.nextPage();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (this.isAnimating) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextPage();
        break;
      case 'Escape':
        if (this.isFullscreen) {
          this.toggleFullscreen();
        }
        break;
    }
  }

  nextPage() {
    if (this.isAnimating || this.currentPage >= this.totalPages) return;
    
    this.isAnimating = true;
    this.currentPage++;
    
    // Add page flip animation
    this.animatePageFlip('next');
    
    setTimeout(() => {
      this.isAnimating = false;
    }, this.animationDuration);
  }

  previousPage() {
    if (this.isAnimating || this.currentPage <= 1) return;
    
    this.isAnimating = true;
    this.currentPage--;
    
    // Add page flip animation
    this.animatePageFlip('previous');
    
    setTimeout(() => {
      this.isAnimating = false;
    }, this.animationDuration);
  }

  goToPage(page: number) {
    if (this.isAnimating || page < 1 || page > this.totalPages) return;
    
    this.isAnimating = true;
    this.currentPage = page;
    
    setTimeout(() => {
      this.isAnimating = false;
    }, this.animationDuration);
  }

  animatePageFlip(direction: 'next' | 'previous') {
    if (!this.readerContainer?.nativeElement) return;
    
    const container = this.readerContainer.nativeElement;
    const pageElement = container.querySelector('.page-content');
    
    if (!pageElement) return;
    
    // Add flip animation class
    pageElement.classList.add(`flip-${direction}`);
    
    setTimeout(() => {
      if (pageElement) {
        pageElement.classList.remove(`flip-${direction}`);
      }
    }, this.animationDuration);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      this.readerContainer.nativeElement.requestFullscreen().then(() => {
        this.isFullscreen = true;
      }).catch((error: any) => {
        console.warn('Could not enter fullscreen mode:', error);
      });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      }).catch((error: any) => {
        console.warn('Could not exit fullscreen mode:', error);
      });
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  get currentPageContent(): string {
    return this.pages[this.currentPage - 1] || 'Page not found';
  }

  get progressPercentage(): number {
    return (this.currentPage / this.totalPages) * 100;
  }

  onPageInputEnter(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      const pageNumber = parseInt(target.value, 10);
      this.goToPage(pageNumber);
    }
  }
}
