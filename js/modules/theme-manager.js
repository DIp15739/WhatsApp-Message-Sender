export class ThemeManager {
  constructor() {
    this.theme = 'auto';
  }

  init() {
    this.theme = localStorage.getItem('theme') || 'auto';
    this.applyTheme(this.theme);
    document.querySelectorAll('input[name="theme"]').forEach(input => {
      input.checked = input.value === this.theme;
      input.addEventListener('change', (e) => {
        this.setTheme(e.target.value);
      });
    });
  }

  setTheme(theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  toggleTheme() {
    this.setTheme(this.theme === 'dark' ? 'light' : 'dark');
  }

  applyTheme(theme) {
    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
} 