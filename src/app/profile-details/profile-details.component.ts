import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-details',
  standalone: true,
  imports:[FormsModule, CommonModule,RouterLink],
  templateUrl: './profile-details.component.html',
  styleUrls: ['./profile-details.component.css']
})
export class ProfileDetailsComponent implements OnInit {
  userData: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userId = localStorage.getItem('id'); // changed from 'userId' to 'id'
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Try to get user data from localStorage first
    const localUserData = localStorage.getItem('userData');
    if (localUserData) {
      try {
        this.userData = JSON.parse(localUserData);
      } catch (e) {
        console.error('Error parsing local user data', e);
      }
    }

    // Also try to fetch from API if available
    this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
      next: (res) => {
        this.userData = res;
        // Store in localStorage for future use
        localStorage.setItem('userData', JSON.stringify(res));
      },
      error: (err) => {
        console.log('API not available, using local data');
        // If API is not available and we don't have local data, create default
        if (!this.userData) {
          this.userData = {
            name: localStorage.getItem('name') || 'User',
            email: localStorage.getItem('email') || 'user@example.com'
          };
        }
      }
    });
  }


  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }
}
