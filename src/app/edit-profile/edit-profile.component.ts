import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule, CommonModule, HttpClientModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {
  userData: any = {};
  isEditing = false;
  originalData: any = {};
  imageUploading: boolean = false;
  selectedImageFile: File | null = null;
  previewImageUrl: string | null = null;
  removeImageRequested: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    const userId = this.getUserId();
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
        // Base merge
        const merged = { ...(this.userData || {}), ...(res as any) } as any;
        // Prefer non-empty local values for phone/address if API is missing/empty
        const localPhone = (this.userData && this.userData.phone) || localStorage.getItem('phone') || '';
        const localAddress = (this.userData && this.userData.address) || localStorage.getItem('address') || '';
        const prefer = (apiVal: any, localVal: string) => (apiVal !== undefined && apiVal !== null && apiVal !== '' ? apiVal : localVal);
        merged.phone = prefer((res as any).phone, localPhone);
        merged.address = prefer((res as any).address, localAddress);

        this.userData = { ...merged };
        this.originalData = { ...merged };
        // Store merged in localStorage
        localStorage.setItem('userData', JSON.stringify(merged));
        if (merged.phone) localStorage.setItem('phone', merged.phone);
        if (merged.address) localStorage.setItem('address', merged.address);
      },
      error: (err) => {
        console.log('API not available, using local data');
        // If API is not available, create default user data
        if (!this.userData.name) {
          this.userData = {
            name: localStorage.getItem('name') || 'User',
            email: localStorage.getItem('email') || 'user@example.com',
            phone: localStorage.getItem('phone') || '',
            address: localStorage.getItem('address') || ''
          };
          this.originalData = { ...this.userData };
        }
      }
    });
  }

  private getUserId(): string | null {
    const fromStorage = localStorage.getItem('id');
    if (fromStorage) return fromStorage;
    const fromUserData = (() => { try { return JSON.parse(localStorage.getItem('userData') || '{}'); } catch { return {}; } })();
    return fromUserData?._id || fromUserData?.id || null;
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset to original data if canceling edit
      this.userData = { ...this.originalData };
    }
  }

  saveProfile() {
    const userId = this.getUserId();
    if (!userId) return;

    const saveToLocalStorage = () => {
      // Avoid storing large base64 images in localStorage (quota errors)
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
    };

    const putProfile = () => this.http.put(`http://127.0.0.1:5000/user/${userId}`, this.userData).subscribe({
      next: (res) => {
        console.log('Profile updated successfully via API', res);
        this.originalData = { ...this.userData };
        this.isEditing = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.log('API not available, profile saved locally');
        this.originalData = { ...this.userData };
        this.isEditing = false;
        this.router.navigate(['/profile']);
      }
    });

    // If remove requested and no new file, clear profile image via backend
    if (this.removeImageRequested && !this.selectedImageFile) {
      this.imageUploading = true;
      this.http.delete<any>(`http://127.0.0.1:5000/user/${userId}/profile-image`).subscribe({
        next: () => {
          this.imageUploading = false;
          this.userData.profileImageUrl = '';
          saveToLocalStorage();
          putProfile();
        },
        error: (err) => {
          console.warn('Image remove failed, proceeding anyway', err);
          this.imageUploading = false;
          this.userData.profileImageUrl = '';
          saveToLocalStorage();
          putProfile();
        }
      });
      return;
    }

    // If a new image is selected but immediate upload failed or hasn't completed, try uploading now
    if (this.selectedImageFile && !this.imageUploading) {
      const formData = new FormData();
      formData.append('image', this.selectedImageFile);
      this.imageUploading = true;
      this.http.post<any>(`http://127.0.0.1:5000/user/${userId}/profile-image`, formData).subscribe({
        next: (resp) => {
          this.imageUploading = false;
          if (resp && (resp.url || resp.profileImageUrl)) {
            this.userData.profileImageUrl = resp.url || resp.profileImageUrl;
          }
          saveToLocalStorage();
          putProfile();
        },
        error: (err) => {
          console.warn('Image upload during save failed', err);
          this.imageUploading = false;
          saveToLocalStorage();
          putProfile();
        }
      });
      return;
    }

    // Image uploads are handled immediately on select; proceed to save other fields

    // No image selected, just save
    saveToLocalStorage();
    putProfile();
  }

  cancelEdit() {
    this.userData = { ...this.originalData };
    this.isEditing = false;
  }

  goBack() {
    this.router.navigate(['/profile']);
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    this.selectedImageFile = file;
    this.removeImageRequested = false;
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImageUrl = reader.result as string; // preview immediately
    };
    reader.readAsDataURL(file);

    // Upload immediately and update profileImageUrl
    const userId = this.getUserId();
    if (!userId) return;
    const formData = new FormData();
    formData.append('image', file);
    this.imageUploading = true;
    this.http.post<any>(`http://127.0.0.1:5000/user/${userId}/profile-image`, formData).subscribe({
      next: (resp) => {
        this.imageUploading = false;
        if (resp && (resp.url || resp.profileImageUrl)) {
          this.userData.profileImageUrl = resp.url || resp.profileImageUrl;
        }
        // Refresh full user from API to ensure consistency
        this.http.get<any>(`http://127.0.0.1:5000/user/${userId}`).subscribe({
          next: (fresh) => {
            this.userData = { ...(fresh || {}) };
            try {
              localStorage.setItem('userData', JSON.stringify(this.userData));
            } catch {}
          },
          error: () => {
            try {
              const { profileImage, ...safe } = this.userData || {};
              localStorage.setItem('userData', JSON.stringify(safe));
            } catch {}
          }
        });
      },
      error: (err) => {
        console.warn('Image upload failed', err);
        this.imageUploading = false;
      }
    });
  }

  onRemoveImage() {
    this.selectedImageFile = null;
    this.previewImageUrl = null;
    this.removeImageRequested = true;
    const userId = localStorage.getItem('id');
    if (!userId) {
      return;
    }
    this.imageUploading = true;
    this.http.delete<any>(`http://127.0.0.1:5000/user/${userId}/profile-image`).subscribe({
      next: () => {
        this.imageUploading = false;
        this.userData.profileImageUrl = '';
        // Save minimal user data locally without large blobs
        try {
          const { profileImage, ...safe } = this.userData || {};
          localStorage.setItem('userData', JSON.stringify(safe));
        } catch {}
      },
      error: () => {
        this.imageUploading = false;
      }
    });
  }
}
