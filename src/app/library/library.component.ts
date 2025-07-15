import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.css']
})
export class LibraryComponent {
  libraryBooks: any[] = [];

  constructor() {
    const stored = localStorage.getItem('libraryBooks');
    this.libraryBooks = stored ? JSON.parse(stored) : [];
  }
}
