// // book-details.component.ts ✅ FIXED
// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, RouterLink } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-book-details',
//   standalone: true,
//   imports: [CommonModule, RouterLink],
//   templateUrl: './book-details.component.html',
//   styleUrls: ['./book-details.component.css']
// })
// export class BookDetailsComponent implements OnInit {
//   bookId: string | null = null;
//   book: any = null;
//   apiUrl:string = 'http://localhost:3000/books';

//   constructor(private route: ActivatedRoute, private http: HttpClient) {}
//   ngOnInit(): void {
//     this.bookId = this.route.snapshot.paramMap.get('id');
//     this.http.get<any>(this.apiUrl).subscribe(data => {
//       this.book = data.find((b: any) => b.bookId == this.bookId);
//     });
//   }
//   addToLibrary(book: any) {
//   const stored = localStorage.getItem('libraryBooks');
//   let books = stored ? JSON.parse(stored) : [];

//   // Prevent duplicates
//   const exists = books.some((b: any) => b.bookId === book.bookId);
//   if (!exists) {
//     books.push(book);
//     localStorage.setItem('libraryBooks', JSON.stringify(books));
//   }
// }

// }

import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  templateUrl: './book-details.component.html',
  styleUrls: ['./book-details.component.css'],
})
export class BookDetailsComponent {
  book: any;
  reviews: any[] = [];
  recommendedBooks: any[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    this.loadBook();
  }

  loadBook() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any[]>('http://localhost:3000/books').subscribe((books) => {
      this.book = books.find((b) => b.bookId === id);
      this.loadReviews();
      this.loadRecommended(books);
    });
  }

  loadReviews() {
    // Dummy reviews — replace with backend later
    this.reviews = [
      { user: 'Sai Vivek', comment: 'Loved this book. Highly recommend!' },
      { user: 'Aarav Reddy', comment: 'Interesting story and great writing.' },
      { user: 'Meera Sharma', comment: 'A must-read for fans of this genre.' },
    ];
  }

  loadRecommended(allBooks: any[]) {
    this.recommendedBooks = allBooks.filter(
      (b) =>
        b.bookId !== this.book.bookId &&
        (b.genre === this.book.genre || b.author === this.book.author)
    );
  }

addToLibrary(book: any) {
  const stored = localStorage.getItem('libraryBooks');
  let books = stored ? JSON.parse(stored) : [];

  // ✅ Prevent adding duplicate books
  const exists = books.some((b: any) => b.bookId === book.bookId);
  if (!exists) {
    books.push(book);
    localStorage.setItem('libraryBooks', JSON.stringify(books));
    alert(`✅ "${book.title}" added to your library!`);
  } else {
    alert(`ℹ️ "${book.title}" is already in your library.`);
  }
}

}

