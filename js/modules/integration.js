export class IntegrationManager {
  constructor() {
    this.whatsappWebDetected = false;
    this.deepLinkSupported = false;
    this.shareSupported = false;
    this.clipboardSupported = false;
    this.fileSharingSupported = false;
  }

  async init() {
    this.detectCapabilities();
    await this.detectWhatsAppWeb();
    this.setupEventListeners();
    this.setupKeyboardShortcuts();
  }

  // Capability Detection
  detectCapabilities() {
    this.deepLinkSupported = 'URLSearchParams' in window;
    this.shareSupported = 'share' in navigator;
    this.clipboardSupported = 'clipboard' in navigator;
    this.fileSharingSupported = 'showOpenFilePicker' in window;
  }

  // WhatsApp Web Detection
  async detectWhatsAppWeb() {
    try {
      // Check if WhatsApp Web is open in another tab
      const whatsappWebUrl = 'https://web.whatsapp.com/';
      const response = await fetch(whatsappWebUrl, { method: 'HEAD' });
      
      // Check if user has WhatsApp Web open
      if (window.location.href.includes('web.whatsapp.com')) {
        this.whatsappWebDetected = true;
        this.setupWhatsAppWebIntegration();
      }
    } catch (error) {
      console.log('WhatsApp Web detection failed:', error);
    }
  }

  setupWhatsAppWebIntegration() {
    // Add WhatsApp Web specific features
    const webFeatures = document.createElement('div');
    webFeatures.className = 'whatsapp-web-features';
    webFeatures.innerHTML = `
      <div class="web-integration-notice">
        <span>🟢 WhatsApp Web detected - Enhanced features available</span>
      </div>
    `;
    document.body.appendChild(webFeatures);
  }

  // Deep Linking Support
  createDeepLink(phone, message, platform = 'api') {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const encodedMessage = encodeURIComponent(message || '');
    
    switch (platform) {
      case 'api':
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
      case 'web':
        return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
      case 'business':
        return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
      case 'mobile':
        return `whatsapp://send?phone=${cleanPhone}&text=${encodedMessage}`;
      default:
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
    }
  }

  async openDeepLink(phone, message, platform = 'api') {
    const deepLink = this.createDeepLink(phone, message, platform);
    
    try {
      // Try to open in new window/tab
      const newWindow = window.open(deepLink, '_blank');
      
      if (newWindow) {
        // Check if window was blocked
        setTimeout(() => {
          if (newWindow.closed) {
            this.showFallbackMessage(deepLink);
          }
        }, 1000);
      } else {
        this.showFallbackMessage(deepLink);
      }
    } catch (error) {
      console.error('Failed to open deep link:', error);
      this.showFallbackMessage(deepLink);
    }
  }

  showFallbackMessage(deepLink) {
    const fallbackModal = document.createElement('div');
    fallbackModal.className = 'fallback-modal';
    fallbackModal.innerHTML = `
      <div class="fallback-content">
        <h3>WhatsApp Link</h3>
        <p>Click the link below to open WhatsApp:</p>
        <a href="${deepLink}" target="_blank" class="whatsapp-link">
          Open WhatsApp
        </a>
        <button onclick="this.closeFallback()">Close</button>
      </div>
    `;
    
    document.body.appendChild(fallbackModal);
    
    // Add close method
    fallbackModal.closeFallback = () => {
      fallbackModal.remove();
    };
  }

  // Share API Integration
  async shareMessage(phone, message, platform = 'api') {
    if (!this.shareSupported) {
      this.showFallbackShare(phone, message);
      return;
    }

    try {
      const shareData = {
        title: 'WhatsApp Message',
        text: message || 'Check out this message',
        url: this.createDeepLink(phone, message, platform)
      };

      await navigator.share(shareData);
    } catch (error) {
      console.error('Share failed:', error);
      this.showFallbackShare(phone, message);
    }
  }

  showFallbackShare(phone, message) {
    const shareModal = document.createElement('div');
    shareModal.className = 'share-modal';
    shareModal.innerHTML = `
      <div class="share-content">
        <h3>Share Message</h3>
        <p>Copy the link below to share:</p>
        <input type="text" value="${this.createDeepLink(phone, message)}" readonly>
        <button onclick="this.copyShareLink()">Copy Link</button>
        <button onclick="this.closeShare()">Close</button>
      </div>
    `;
    
    document.body.appendChild(shareModal);
    
    // Add methods
    shareModal.copyShareLink = () => {
      const input = shareModal.querySelector('input');
      input.select();
      document.execCommand('copy');
      this.showToast('Link copied to clipboard!', 'success');
    };
    
    shareModal.closeShare = () => {
      shareModal.remove();
    };
  }

  // Clipboard Integration
  async copyToClipboard(text) {
    if (!this.clipboardSupported) {
      this.fallbackCopyToClipboard(text);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showToast('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Clipboard write failed:', error);
      this.fallbackCopyToClipboard(text);
    }
  }

  async readFromClipboard() {
    if (!this.clipboardSupported) {
      return null;
    }

    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      console.error('Clipboard read failed:', error);
      return null;
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showToast('Copied to clipboard!', 'success');
    } catch (error) {
      console.error('Fallback copy failed:', error);
      this.showToast('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
  }

  // File Sharing Integration
  async shareFile(file) {
    if (!this.fileSharingSupported) {
      this.showToast('File sharing not supported in this browser', 'warning');
      return;
    }

    try {
      const shareData = {
        title: 'WhatsApp File',
        files: [file]
      };

      await navigator.share(shareData);
    } catch (error) {
      console.error('File share failed:', error);
      this.showToast('Failed to share file', 'error');
    }
  }

  async selectAndShareFile() {
    if (!this.fileSharingSupported) {
      this.showToast('File picker not supported in this browser', 'warning');
      return;
    }

    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'Images',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif']
            }
          },
          {
            description: 'Documents',
            accept: {
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
            }
          }
        ]
      });

      const file = await fileHandle.getFile();
      await this.shareFile(file);
    } catch (error) {
      console.error('File selection failed:', error);
      this.showToast('Failed to select file', 'error');
    }
  }

  // Keyboard Shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      // Only trigger if not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.triggerSendMessage();
          }
          break;
        case 'Escape':
          event.preventDefault();
          this.closeAllModals();
          break;
        case 't':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.focusMessageInput();
          }
          break;
        case 'p':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            this.focusPhoneInput();
          }
          break;
      }
    });
  }

  // Event Listeners
  setupEventListeners() {
    // Paste event for phone number
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) {
      phoneInput.addEventListener('paste', (event) => {
        this.handlePhonePaste(event);
      });
    }

    // Paste event for message
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('paste', (event) => {
        this.handleMessagePaste(event);
      });
    }

    // Drag and drop for files
    document.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('drop', (event) => {
      event.preventDefault();
      this.handleFileDrop(event);
    });
  }

  // Paste Handlers
  handlePhonePaste(event) {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    // Try to extract phone number from pasted text
    const phoneMatch = pastedText.match(/[\+]?[\d\s\-\(\)]+/);
    if (phoneMatch) {
      event.preventDefault();
      event.target.value = phoneMatch[0];
      
      // Trigger phone number formatting
      const inputEvent = new Event('input', { bubbles: true });
      event.target.dispatchEvent(inputEvent);
    }
  }

  handleMessagePaste(event) {
    const pastedText = (event.clipboardData || window.clipboardData).getData('text');
    
    // Check if pasted text contains a URL
    const urlMatch = pastedText.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      // Add URL to message with context
      const currentValue = event.target.value;
      const newValue = currentValue + (currentValue ? '\n' : '') + `Check this out: ${urlMatch[0]}`;
      event.target.value = newValue;
      event.preventDefault();
    }
  }

  // File Drop Handler
  handleFileDrop(event) {
    const files = Array.from(event.dataTransfer.files);
    
    if (files.length > 0) {
      this.showToast(`Dropped ${files.length} file(s)`, 'info');
      
      // Process files (could be used for QR code generation, etc.)
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          this.processImageFile(file);
        }
      });
    }
  }

  async processImageFile(file) {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Could be used for QR code scanning or image processing
        console.log('Image file processed:', file.name);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to process image file:', error);
    }
  }

  // Utility Methods
  triggerSendMessage() {
    const sendButton = document.querySelector('button[type="submit"]');
    if (sendButton) {
      sendButton.click();
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  }

  focusMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.focus();
    }
  }

  focusPhoneInput() {
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) {
      phoneInput.focus();
    }
  }

  showToast(message, type = 'info') {
    if (window.whatsappApp && window.whatsappApp.modules.toastManager) {
      window.whatsappApp.modules.toastManager.show(message, type);
    } else {
      console.log(`Toast: ${message}`);
    }
  }

  // Integration Status
  getIntegrationStatus() {
    return {
      whatsappWebDetected: this.whatsappWebDetected,
      deepLinkSupported: this.deepLinkSupported,
      shareSupported: this.shareSupported,
      clipboardSupported: this.clipboardSupported,
      fileSharingSupported: this.fileSharingSupported
    };
  }
} 