import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastService } from '../services/toast.service';
import { ToastComponent } from '../components/toast/toast.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule, ToastComponent],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css'
})
export class EditProfileComponent implements OnInit {
  userData: any = {};
  isEditing = false;
  originalData: any = {};
  imageUploading: boolean = false;
  selectedImageFile: File | null = null;
  previewImageUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const userId = this.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
  }

  private getUserId(): string | null {
    return localStorage.getItem('id') || localStorage.getItem('userId');
  }

  private loadUserData() {
    const localUserData = localStorage.getItem('userData');
    if (localUserData) {
      try {
        const parsedData = JSON.parse(localUserData);
        this.userData = { ...parsedData };
      } catch (e) {
        console.error('Error parsing local user data', e);
      }
    }
  }

  // Remove toggleEdit method since we're always in edit mode now

  saveProfile() {
    const userId = this.getUserId();
    if (!userId) return;

    // Save to localStorage first
    const { profileImage, ...safeUserData } = this.userData || {};
    try {
      localStorage.setItem('userData', JSON.stringify(safeUserData));
    } catch (e) {
      console.warn('Skipping userData localStorage due to quota:', e);
    }
    if (this.userData.name) localStorage.setItem('name', this.userData.name);
    if (this.userData.email) localStorage.setItem('email', this.userData.email);
    if (this.userData.phone) localStorage.setItem('phone', this.userData.phone);
    if (this.userData.address) localStorage.setItem('address', this.userData.address);

    // Update via API
    this.http.put(`${environment.apiUrl}/user/${userId}`, this.userData).subscribe({
      next: (res: any) => {
        console.log('Profile updated successfully via API', res);
        this.toastService.success('Success!', 'Profile updated successfully');
        this.updateProfileImageAcrossApp(res.profileImageUrl);
        this.router.navigate(['/profile'])
      },
      error: (err) => {
        console.log('API error, but profile saved locally', err);
        this.toastService.warning('Connection Issue', 'Profile saved locally. API connection failed.');
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

  hasCustomProfileImage(): boolean {
    return !!(this.userData?.profileImageUrl && this.userData.profileImageUrl.trim() !== '');
  }

  getProfileImageUrl(): string {
    if (this.previewImageUrl) {
      return this.previewImageUrl;
    }
    return this.userData?.profileImageUrl || 'https://placehold.co/150x150/cccccc/666666?text=Profile&font=roboto';
  }

  private updateProfileImageAcrossApp(imageUrl: string | null) {
    if (this.userData) {
      this.userData.profileImageUrl = imageUrl || '';
    }

    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        userData.profileImageUrl = imageUrl || '';
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      if (imageUrl) {
        localStorage.setItem('profileImageUrl', imageUrl);
      } else {
        localStorage.removeItem('profileImageUrl');
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }

    window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
      detail: { imageUrl } 
    }));
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      this.toastService.warning('Invalid File', 'Please select a valid image file (PNG, JPG, JPEG, GIF)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      this.toastService.warning('File Too Large', 'File size must be under 10MB');
      return;
    }

    this.selectedImageFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewImageUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    
    this.uploadImage();
  }

  uploadImage() {
    if (!this.selectedImageFile) return;
    
    const userId = this.getUserId();
    if (!userId) return;
    
    this.imageUploading = true;
    
    const formData = new FormData();
    formData.append('image', this.selectedImageFile);
    
    this.http.post(`${environment.apiUrl}/user/${userId}/profile-image`, formData).subscribe({
      next: (response: any) => {
        const imageUrl = response.url;
        this.userData.profileImageUrl = imageUrl;
        this.updateProfileImageAcrossApp(imageUrl);
        this.imageUploading = false;
        this.toastService.success('Success!', 'Profile image updated successfully');
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.toastService.error('Upload Failed', 'Failed to upload image. Please try again.');
        this.imageUploading = false;
      }
    });
  }

  onRemoveImage() {
    const userId = this.getUserId();
    if (!userId) return;
    
    this.imageUploading = true;
    
    this.http.delete(`${environment.apiUrl}/user/${userId}/profile-image`).subscribe({
      next: () => {
        this.selectedImageFile = null;
        this.previewImageUrl = null;
        this.userData.profileImageUrl = '';
        this.updateProfileImageAcrossApp('');
        this.imageUploading = false;
        alert('Profile image removed successfully!');
      },
      error: (error) => {
        console.error('Error removing image:', error);
        alert('Failed to remove image. Please try again.');
        this.imageUploading = false;
      }
    });
  }
}
