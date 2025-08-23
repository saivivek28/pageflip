import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeKey = 'darkMode';
  private _isDarkMode: boolean = false;

  constructor() {
    try {
      this._isDarkMode = localStorage.getItem(this.darkModeKey) === 'true';
      if (this._isDarkMode) {
        document.body.classList.add('dark-mode');
      }
    } catch (error) {
      console.warn('Could not access localStorage for theme preference:', error);
      this._isDarkMode = false;
    }
  }

  get isDarkMode(): boolean {
    return this._isDarkMode;
  }

  toggleTheme() {
    try {
      document.body.classList.toggle('dark-mode');
      this._isDarkMode = document.body.classList.contains('dark-mode');
      localStorage.setItem(this.darkModeKey, String(this._isDarkMode));
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  }
}
