import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-navbar',
  imports:[FormsModule, CommonModule, HttpClientModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {
  searchQuery: string = '';
  filterOption: string = '';
  userData: any;
  showProfile: boolean = false;

  @Output() search = new EventEmitter<string>();

  constructor(private router: Router, private http: HttpClient, public theme: ThemeService) {}

  ngOnInit() {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
        next: (res) => {
          this.userData = res;
        },
        error: (err) => {
          console.error('Error fetching user data', err);
        }
      });
    }
  }

  onSearchChange() {
    this.search.emit(this.searchQuery);
  }

  toggleProfileDropdown() {
    this.showProfile = !this.showProfile;
  }
  showMenu = false;

toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
}

logout() {
  // Your logout logic here
  this.router.navigate(['/login']);
  console.log("User logged out");
}


  // logout() {
  //   localStorage.removeItem('userId');
  //   localStorage.removeItem('token');
  //   this.router.navigate(['/login']);
  // }
}
