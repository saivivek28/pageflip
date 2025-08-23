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
  showPassword:boolean = false;
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

    const submit = (profileImageUrl?: string) => {
      if (profileImageUrl) reqBody.profileImageUrl = profileImageUrl;
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
    };

    if (this.profileImageFile) {
      const formData = new FormData();
      formData.append('image', this.profileImageFile);
      this.imageUploading = true;
      this.http.post<any>('http://127.0.0.1:5000/upload-profile-image', formData).subscribe({
        next: (resp) => {
          this.imageUploading = false;
          submit(resp.url || resp.profileImageUrl || '');
        },
        error: () => {
          this.imageUploading = false;
          submit();
        }
      });
    } else {
      submit();
    }
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

  showpassword(){
    this.showPassword = !this.showPassword
  }

  login() {
    this.router.navigate(['/login']);
  }
}
