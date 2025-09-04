import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeKey = 'darkMode';
  private _isDarkMode: boolean = false;
  private themeSubject = new BehaviorSubject<boolean>(false);
  
  public theme$ = this.themeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    try {
      // Check system preference first
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedTheme = localStorage.getItem(this.darkModeKey);
      
      if (savedTheme !== null) {
        this._isDarkMode = savedTheme === 'true';
      } else {
        this._isDarkMode = systemPrefersDark;
      }
      
      this.applyTheme();
      this.themeSubject.next(this._isDarkMode);
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem(this.darkModeKey) === null) {
          this._isDarkMode = e.matches;
          this.applyTheme();
          this.themeSubject.next(this._isDarkMode);
        }
      });
    } catch (error) {
      console.warn('Could not access localStorage for theme preference:', error);
      this._isDarkMode = false;
    }
  }

  private applyTheme() {
    const root = document.documentElement;
    
    if (this._isDarkMode) {
      document.body.classList.add('dark-mode');
      root.style.setProperty('--primary-bg', '#1a1a1a');
      root.style.setProperty('--secondary-bg', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--border-color', '#404040');
      root.style.setProperty('--card-bg', '#2a2a2a');
      root.style.setProperty('--hero-gradient', 'linear-gradient(135deg, rgba(26,26,26,0.9) 0%, rgba(45,45,45,0.9) 60%, rgba(20,20,20,0.95) 100%)');
    } else {
      document.body.classList.remove('dark-mode');
      root.style.setProperty('--primary-bg', '#ffffff');
      root.style.setProperty('--secondary-bg', '#f8f9fa');
      root.style.setProperty('--text-primary', '#2c3e50');
      root.style.setProperty('--text-secondary', '#7f8c8d');
      root.style.setProperty('--border-color', '#e1e8ed');
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--hero-gradient', 'linear-gradient(135deg, rgba(52,152,219,0.6) 0%, rgba(41,128,185,0.6) 60%, rgba(44,62,80,0.7) 100%)');
    }
  }

  get isDarkMode(): boolean {
    return this._isDarkMode;
  }

  toggleTheme() {
    try {
      this._isDarkMode = !this._isDarkMode;
      this.applyTheme();
      this.themeSubject.next(this._isDarkMode);
      localStorage.setItem(this.darkModeKey, String(this._isDarkMode));
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  }

  setTheme(isDark: boolean) {
    this._isDarkMode = isDark;
    this.applyTheme();
    this.themeSubject.next(this._isDarkMode);
    try {
      localStorage.setItem(this.darkModeKey, String(this._isDarkMode));
    } catch (error) {
      console.warn('Could not save theme preference to localStorage:', error);
    }
  }
}
