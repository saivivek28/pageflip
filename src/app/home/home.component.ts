import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SearchPipe } from '../search.pipe';
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
    NavbarComponent,
    SearchPipe
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  apiUrl = 'http://127.0.0.1:5000/books';
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

  // Enhanced chatbot properties
  chatOpen = false;
  chatMessages: ChatMessage[] = [];
  userInput = '';
  isTyping = false;
  private chatSubscription: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private chatbotService: ChatbotService
  ) {}

  ngOnInit() {
    this.getBooks();
    this.initializeChatbot();
  }

  ngOnDestroy() {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  getBooks() {
    this.http.get(this.apiUrl).subscribe((data: any) => {
      this.books = data;
      this.filteredBooks = this.books;
      // Update chatbot with books data
      this.chatbotService.updateBooksDatabase(this.books);
    });
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
      this.filteredBooks = this.books;
    } else {
      this.filteredBooks = this.books.filter(
        (book: any) => book.genre.toLowerCase() === genre.toLowerCase()
      );
    }
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
}
