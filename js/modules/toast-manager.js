export class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<div class='toast__header'><span class='toast__title'>${type.charAt(0).toUpperCase() + type.slice(1)}</span><button class='toast__close'>&times;</button></div><div class='toast__message'>${message}</div>`;
    this.container.appendChild(toast);
    toast.querySelector('.toast__close').onclick = () => toast.remove();
    setTimeout(() => toast.remove(), duration);
  }
} 