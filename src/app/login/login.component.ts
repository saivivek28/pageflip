import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  email = '';
  password = '';
  logURL = 'http://127.0.0.1:5000/login';

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  signIn() {
    const reqBody = {
      
      email: this.email,
      password: this.password
    };

    this.http.post(this.logURL, reqBody).subscribe({
      next: (res: any) => {
        if (res.token && res._id) {
          localStorage.setItem('JWT_token', res.token);
        
          localStorage.setItem('id', res._id);
          this.toastr.success(res.message || 'Login successful');
          
          this.router.navigate(['/home']);
        } else {
          this.toastr.error(res.error || 'Login failed. Please try again.');
        }
      },
      error: (err) => {
        const errorMsg = err.error?.error || 'Invalid email or password';
        this.toastr.error(errorMsg);
      }
    });
  }

  signup() {
    this.router.navigate(['/signup']);
  }
}
