import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  userData: any = {};
  isEditing = false;
  originalData: any = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userId = localStorage.getItem('id');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    // Try to get user data from localStorage first, then from API if available
    const localUserData = localStorage.getItem('userData');
    if (localUserData) {
      try {
        const parsedData = JSON.parse(localUserData);
        this.userData = { ...parsedData };
        this.originalData = { ...parsedData };
      } catch (e) {
        console.error('Error parsing local user data', e);
      }
    }

    // Also try to fetch from API if available
    this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
      next: (res) => {
        this.userData = { ...res };
        this.originalData = { ...res };
        // Store in localStorage for future use
        localStorage.setItem('userData', JSON.stringify(res));
      },
      error: (err) => {
        console.log('API not available, using local data');
        // If API is not available, create default user data
        if (!this.userData.name) {
          this.userData = {
            name: localStorage.getItem('name') || 'User',
            email: localStorage.getItem('email') || 'user@example.com',
            phone: '',
            address: ''
          };
          this.originalData = { ...this.userData };
        }
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset to original data if canceling edit
      this.userData = { ...this.originalData };
    }
  }

  saveProfile() {
    const userId = localStorage.getItem('id');
    if (!userId) return;

    // Update localStorage first
    localStorage.setItem('userData', JSON.stringify(this.userData));
    
    // Also update individual localStorage items for compatibility
    if (this.userData.name) localStorage.setItem('name', this.userData.name);
    if (this.userData.email) localStorage.setItem('email', this.userData.email);

    // Try to update via API if available
    this.http.put(`http://127.0.0.1:5000/user/${userId}`, this.userData).subscribe({
      next: (res) => {
        console.log('Profile updated successfully via API', res);
        this.originalData = { ...this.userData };
        this.isEditing = false;
        // Navigate back to profile page
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.log('API not available, profile saved locally');
        // Even if API fails, we've saved locally, so proceed
        this.originalData = { ...this.userData };
        this.isEditing = false;
        // Navigate back to profile page
        this.router.navigate(['/profile']);
      }
    });
  }

  cancelEdit() {
    this.userData = { ...this.originalData };
    this.isEditing = false;
  }

  goBack() {
    this.router.navigate(['/profile']);
  }
}
