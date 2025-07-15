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
  imports: [FormsModule, CommonModule, HttpClientModule, RouterLink, NavbarComponent,SearchPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  apiUrl = "http://localhost:3000/books";
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
  'Philosophy'
];

  selectedGenre: string = 'All';
   searchQuery: string = '';
  constructor(private http: HttpClient) {
    this.getBooks();
  }

  getBooks() {
    this.http.get(this.apiUrl).subscribe(data => {
      this.books = data;
      this.filteredBooks = this.books; // initially all books
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

  }
