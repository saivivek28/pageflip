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
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  signupURL = 'http://localhost:5000/register';

  email: string = '';
  username: string = '';
  password: string = '';
  showPassword: boolean = false;
  phone: string = '';
  address: string = '';
  profileImageFile: File | null = null;
  profileImageUrl: string = '';
  imageUploading: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  signup() {
    const reqBody: any = {
      name: this.username.trim(),
      email: this.email.trim(),
      password: this.password.trim(),
      phone: this.phone.trim(),
      address: this.address.trim()
    };

    if (!reqBody.name || !reqBody.email || !reqBody.password || !reqBody.phone || !reqBody.address) {
      this.toastr.error('All fields are required');
      return;
    }

    // Step 1: Register the user
    this.http.post(this.signupURL, reqBody).subscribe({
      next: (res: any) => {
        this.toastr.success(res?.message || 'User registered successfully');

        // Step 2: Log in to obtain token and user id
        this.http.post<any>('http://127.0.0.1:5000/login', {
          email: this.email.trim(),
          password: this.password.trim()
        }).subscribe({
          next: (loginRes) => {
            // Reset any previous session
            localStorage.removeItem('JWT_token');
            localStorage.removeItem('id');
            localStorage.removeItem('role');
            localStorage.removeItem('userData');

            // Save auth
            if (loginRes?.token) localStorage.setItem('JWT_token', loginRes.token);
            if (loginRes?._id) localStorage.setItem('id', loginRes._id);
            localStorage.setItem('role', 'user');

            const userId = loginRes?._id;

            // Prefetch user data for immediate availability in profile
            if (userId) {
              this.http.get<any>(`http://127.0.0.1:5000/user/${userId}`).subscribe({
                next: (userRes) => {
                  localStorage.setItem('userData', JSON.stringify(userRes));
                },
                error: () => {
                  // ignore; not critical
                }
              });
            }

            // Step 3: If profile image selected, upload to /user/{id}/profile-image
            const doNavigate = () => {
              // Step 4: Navigate to home
              this.router.navigate(['/home']);
            };

            if (this.profileImageFile && userId) {
              const formData = new FormData();
              formData.append('image', this.profileImageFile);
              this.imageUploading = true;
              this.http.post<any>(`http://127.0.0.1:5000/user/${userId}/profile-image`, formData).subscribe({
                next: (uploadRes) => {
                  this.imageUploading = false;
                  // Update cached userData with new image url
                  const current = localStorage.getItem('userData');
                  const parsed = current ? JSON.parse(current) : {};
                  parsed.profileImageUrl = uploadRes?.url || uploadRes?.profileImageUrl || '';
                  localStorage.setItem('userData', JSON.stringify(parsed));
                  doNavigate();
                },
                error: () => {
                  this.imageUploading = false;
                  doNavigate();
                }
              });
            } else {
              doNavigate();
            }
          },
          error: (loginErr) => {
            // If auto-login fails, send user to login explicitly
            this.toastr.error(loginErr?.error?.error || 'Login after registration failed');
            this.router.navigate(['/login']);
          }
        });
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

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Please select a valid image file.');
      return;
    }
    this.profileImageFile = file;
    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  showpassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    this.router.navigate(['/login']);
  }
}
