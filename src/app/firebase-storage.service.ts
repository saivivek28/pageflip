import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private isFirebaseAvailable = false;

  constructor() {
    // Check if Firebase is available
    this.checkFirebaseAvailability();
  }

  private checkFirebaseAvailability(): void {
    // In a real implementation, you would check if Firebase is properly configured
    // For now, we'll simulate Firebase functionality with local storage and base64
    this.isFirebaseAvailable = false; // Set to true when Firebase is properly configured
  }

  async uploadProfileImage(file: File, userId: string): Promise<string> {
    if (this.isFirebaseAvailable) {
      return this.uploadToFirebase(file, userId);
    } else {
      return this.uploadToLocalStorage(file, userId);
    }
  }

  private async uploadToFirebase(file: File, userId: string): Promise<string> {
    // Firebase Storage implementation would go here
    // Example:
    // const storage = getStorage();
    // const storageRef = ref(storage, `profile-images/${userId}/${file.name}`);
    // const snapshot = await uploadBytes(storageRef, file);
    // return await getDownloadURL(snapshot.ref);
    
    throw new Error('Firebase not configured. Please configure Firebase to use cloud storage.');
  }

  private async uploadToLocalStorage(file: File, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const base64String = event.target?.result as string;
          const imageKey = `profile_image_${userId}`;
          
          // Store in localStorage (with size limit consideration)
          if (base64String.length > 1000000) { // ~1MB limit
            reject(new Error('Image too large. Please choose a smaller image.'));
            return;
          }
          
          localStorage.setItem(imageKey, base64String);
          resolve(base64String);
        } catch (error) {
          reject(new Error('Failed to process image'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  async deleteProfileImage(userId: string): Promise<void> {
    if (this.isFirebaseAvailable) {
      return this.deleteFromFirebase(userId);
    } else {
      return this.deleteFromLocalStorage(userId);
    }
  }

  private async deleteFromFirebase(userId: string): Promise<void> {
    // Firebase Storage deletion would go here
    // Example:
    // const storage = getStorage();
    // const storageRef = ref(storage, `profile-images/${userId}/`);
    // await deleteObject(storageRef);
    
    throw new Error('Firebase not configured');
  }

  private async deleteFromLocalStorage(userId: string): Promise<void> {
    const imageKey = `profile_image_${userId}`;
    localStorage.removeItem(imageKey);
  }

  getProfileImageUrl(userId: string): string | null {
    if (this.isFirebaseAvailable) {
      // In Firebase implementation, you might store the URL in user data
      return null;
    } else {
      const imageKey = `profile_image_${userId}`;
      return localStorage.getItem(imageKey);
    }
  }

  getDefaultAvatarUrl(): string {
    return 'https://cdn-icons-png.flaticon.com/128/16869/16869838.png';
  }

  validateImageFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return Promise.resolve({ valid: false, error: 'Please select a valid image file.' });
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return Promise.resolve({ valid: false, error: 'Image size must be less than 5MB.' });
    }

    // Check image dimensions (optional)
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 2000 || img.height > 2000) {
          resolve({ valid: false, error: 'Image dimensions should be less than 2000x2000 pixels.' });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        resolve({ valid: false, error: 'Invalid image file.' });
      };
      img.src = URL.createObjectURL(file);
    });
  }

  resizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        }, file.type, quality);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}
