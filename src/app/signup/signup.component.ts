import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [RouterModule,FormsModule,CommonModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  username: string = '';
  password: string = '';

  constructor(private router: Router) {}

  signup() {
    if (this.firstName && this.lastName && this.email && this.username && this.password) {
      console.log('Sign Up Details:', {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        username: this.username,
        password: this.password
      });
      alert(`Welcome, ${this.firstName}! Your account has been created.`);
      this.router.navigate(['/home']); 
    } else {
      alert('Please fill in all fields.');
    }
  }

  login() {
    console.log('Redirecting to login page...');
    this.router.navigate(['/login']); 
  }
}
