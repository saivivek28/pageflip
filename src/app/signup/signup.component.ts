import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupURL = 'http://localhost:5000/register';

  email: string = '';
  username: string = '';
  password: string = '';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  signup() {
    const reqBody = {
      name: this.username.trim(),
      email: this.email.trim(),
      password: this.password.trim()
    };

    if (!reqBody.name || !reqBody.email || !reqBody.password) {
      this.toastr.error('All fields are required');
      return;
    }

    this.http.post(this.signupURL, reqBody).subscribe({
      next: (res: any) => {
        if (res.token) {
          localStorage.setItem('JWT_token', res.token);
        }
        this.toastr.success(res.message || 'User registered successfully');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        let errorMsg = 'Registration failed';

        if (err.status === 400 && err.error && typeof err.error === 'object') {
          errorMsg = Object.entries(err.error)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join(' | ');
        } else if (err.status === 409 && err.error?.error) {
          errorMsg = err.error.error;
        } else if (typeof err.error === 'string') {
          errorMsg = err.error;
        } else if (err.error?.error) {
          errorMsg = err.error.error;
        }

        this.toastr.error(errorMsg);
      }
    });
  }

  login() {
    this.router.navigate(['/login']);
  }
}
