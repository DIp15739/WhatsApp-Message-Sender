export class ModalManager {
  constructor() {
    this.overlay = document.getElementById('modal-overlay');
    this.modals = document.querySelectorAll('.modal');
    this.init = this.init.bind(this);
  }

  init() {
    this.modals.forEach(modal => {
      const closeBtn = modal.querySelector('.modal__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal(modal.id));
      }
    });
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.closeAll();
    });
  }

  openModal(id) {
    this.overlay.hidden = false;
    this.modals.forEach(modal => {
      modal.hidden = modal.id !== id;
    });
  }

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.hidden = true;
    this.closeAllIfNoneOpen();
  }

  closeAll() {
    this.overlay.hidden = true;
    this.modals.forEach(modal => (modal.hidden = true));
  }

  closeAllIfNoneOpen() {
    const anyOpen = Array.from(this.modals).some(modal => !modal.hidden);
    if (!anyOpen) this.overlay.hidden = true;
  }
} 