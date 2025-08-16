import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-details',
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

  this.http.get(`http://127.0.0.1:5000/user/${userId}`).subscribe({
    next: (res) => this.userData = res,
    error: (err) => console.error('Error fetching user profile', err)
  });
}


  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
