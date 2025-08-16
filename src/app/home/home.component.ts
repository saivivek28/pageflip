import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { SearchPipe } from '../search.pipe';

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
export class HomeComponent {
  apiUrl = 'http://localhost:3000/books';
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

  
  chatOpen = false;
  chatMessages: string[] = [
    "Hi! 👋 I'm your PageFlip Assistant.",
    "What type of book are you looking for today?"
  ];
  userInput = '';

  constructor(private http: HttpClient) {
    this.getBooks();                                                                                                          
  }

  getBooks() {
    this.http.get(this.apiUrl).subscribe((data: any) => {
      this.books = data;
      this.filteredBooks = this.books;
    });
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

    const input = this.userInput.toLowerCase();

    this.chatMessages.push(`👉 ${this.userInput}`);

    const matches = this.books.filter((b: any) =>
      b.title.toLowerCase().includes(input) ||
      b.author.toLowerCase().includes(input) ||
      b.genre.toLowerCase().includes(input)
    );

    if (matches.length > 0) {
      this.chatMessages.push(`Here are some books I found:`);
      matches.forEach((b: any) => {
        this.chatMessages.push(`📖 ${b.title} by ${b.author} (${b.genre})`);
      });
    } else {
      this.chatMessages.push(`Sorry, I couldn't find any matching books.`);
    }

    this.userInput = '';
  }
}
