import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkModeKey = 'darkMode';

  constructor() {
    const isDark = localStorage.getItem(this.darkModeKey) === 'true';
    if (isDark) document.body.classList.add('dark-mode');
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(this.darkModeKey, String(isDark));
  }
}
