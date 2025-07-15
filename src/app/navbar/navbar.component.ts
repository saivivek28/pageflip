import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports:[FormsModule, CommonModule, HttpClientModule,RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
constructor(private router:Router){}
searchQuery: string = '';
  filterOption: string = '';

  @Output() search = new EventEmitter<string>();

  onSearchChange() {
    this.search.emit(this.searchQuery);
  }
logout() {
    this.router.navigate(['/login']);
  }

}
