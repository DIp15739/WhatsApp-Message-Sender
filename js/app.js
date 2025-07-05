// Modern WhatsApp Message Sender
// ES6+ Module Architecture with Comprehensive Features

import { PhoneNumberManager } from './modules/phone-number-manager.js';
import { MessageManager } from './modules/message-manager.js';
import { ThemeManager } from './modules/theme-manager.js';
import { ModalManager } from './modules/modal-manager.js';
import { ToastManager } from './modules/toast-manager.js';
import { ContactManager } from './modules/contact-manager.js';
import { QRCodeManager } from './modules/qr-code-manager.js';
import { TemplateManager } from './modules/template-manager.js';
import { ValidationManager } from './modules/validation-manager.js';
import { StorageManager } from './modules/storage-manager.js';
import { AnalyticsManager } from './modules/analytics-manager.js';
import { PWAManager } from './modules/pwa.js';
import { IntegrationManager } from './modules/integration.js';
import { PerformanceManager } from './modules/performance.js';
import { TestingManager } from './modules/testing.js';
import { DocumentationManager } from './modules/docs.js';
import { GitHubPagesManager } from './modules/gh-pages.js';

class WhatsAppApp {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.currentTheme = 'light';
    this.isOnline = navigator.onLine;
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing WhatsApp Message Sender...');

      // Initialize all modules
      await this.initializeModules();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize UI
      this.initializeUI();

      // Setup analytics
      this.setupAnalytics();

      // Check for updates
      this.checkForUpdates();

      this.isInitialized = true;
      console.log('✅ WhatsApp Message Sender initialized successfully');

      // Track app initialization
      if (this.modules.analyticsManager) {
        this.modules.analyticsManager.track('app_initialized');
      }

    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.modules.toastManager.show('Failed to initialize application', 'error');
    }
  }

  async initializeModules() {
    // Initialize core modules
    this.modules.phoneManager = new PhoneNumberManager();
    this.modules.messageManager = new MessageManager();
    this.modules.themeManager = new ThemeManager();
    this.modules.modalManager = new ModalManager();
    this.modules.toastManager = new ToastManager();
    this.modules.contactManager = new ContactManager();
    this.modules.qrManager = new QRCodeManager();
    this.modules.templateManager = new TemplateManager();
    this.modules.validationManager = new ValidationManager();
    this.modules.storageManager = new StorageManager();
    this.modules.analyticsManager = new AnalyticsManager();
    this.modules.pwaManager = new PWAManager();
    this.modules.integrationManager = new IntegrationManager();
    this.modules.performanceManager = new PerformanceManager();
    this.modules.testingManager = new TestingManager();
    this.modules.documentationManager = new DocumentationManager();
    this.modules.githubPagesManager = new GitHubPagesManager();

    // Initialize all modules
    const initPromises = Object.entries(this.modules).map(async ([name, module]) => {
      try {
        await module.init();
        console.log(`✅ ${name} initialized`);
      } catch (error) {
        console.error(`❌ Failed to initialize ${name}:`, error);
      }
    });

    await Promise.all(initPromises);
  }

  setupEventListeners() {
    // Form submission
    const messageForm = document.getElementById('message-form');
    if (messageForm) {
      messageForm.addEventListener('submit', this.handleFormSubmit.bind(this));
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Settings toggle
    const settingsToggle = document.getElementById('settings-toggle');
    if (settingsToggle) {
      settingsToggle.addEventListener('click', () => {
        this.modules.modalManager.openModal('settings-modal');
      });
    }

    // Quick action buttons
    const addContactBtn = document.getElementById('add-contact');
    if (addContactBtn) {
      addContactBtn.addEventListener('click', () => {
        this.handleAddContact();
      });
    }

    const bulkMessageBtn = document.getElementById('bulk-message');
    if (bulkMessageBtn) {
      bulkMessageBtn.addEventListener('click', () => {
        this.handleBulkMessage();
      });
    }

    const qrGeneratorBtn = document.getElementById('qr-generator');
    if (qrGeneratorBtn) {
      qrGeneratorBtn.addEventListener('click', () => {
        this.handleQRGeneration();
      });
    }

    // Template button
    const templateBtn = document.getElementById('template-btn');
    if (templateBtn) {
      templateBtn.addEventListener('click', () => {
        this.modules.modalManager.openModal('templates-modal');
      });
    }

    // Preview button
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.handleMessagePreview();
      });
    }

    // Emoji picker
    const emojiPickerBtn = document.getElementById('emoji-picker');
    if (emojiPickerBtn) {
      emojiPickerBtn.addEventListener('click', () => {
        this.handleEmojiPicker();
      });
    }

    // Character count
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      messageInput.addEventListener('input', (e) => {
        this.updateCharacterCount(e.target.value);
      });
    }

    // Phone number input
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput) {
      phoneInput.addEventListener('input', (e) => {
        this.modules.phoneManager.formatPhoneNumber(e.target.value);
      });
    }

    // Online/offline detection
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
  }

  initializeUI() {
    // Set initial theme
    this.setTheme(this.currentTheme);

    // Initialize phone number input
    this.initializePhoneInput();

    // Initialize message input
    this.initializeMessageInput();

    // Load saved data
    this.loadSavedData();

    // Show welcome message
    this.showWelcomeMessage();
  }

  async initializePhoneInput() {
    const phoneInput = document.getElementById('phone-input');
    if (phoneInput && this.modules.phoneManager) {
      // Set up phone number formatting
      phoneInput.addEventListener('input', (e) => {
        const formatted = this.modules.phoneManager.formatPhoneNumber(e.target.value);
        e.target.value = formatted;
      });

      // Auto-detect country
      const country = await this.modules.phoneManager.detectCountry();
      if (country) {
        this.updateCountryCode(country.code);
      }
    }
  }

  initializeMessageInput() {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      // Auto-resize textarea
      messageInput.addEventListener('input', (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      });

      // Character counter
      messageInput.addEventListener('input', (e) => {
        this.updateCharacterCount(e.target.value.length);
      });
    }
  }

  updateCharacterCount(count) {
    const counter = document.getElementById('char-count');
    if (counter) {
      counter.textContent = `${count}/1000`;
      counter.className = count > 900 ? 'text-warning' : 'text-muted';
    }
  }

  updateCountryCode(code) {
    const countrySelect = document.getElementById('country-code');
    if (countrySelect) {
      countrySelect.textContent = code;
    }
  }

  async loadSavedData() {
    try {
      // Load saved contacts
      await this.modules.contactManager.loadContacts();
      
      // Load saved templates
      await this.modules.templateManager.loadTemplates();
      
      // Load user preferences
      const preferences = await this.modules.storageManager.get('preferences');
      if (preferences) {
        this.modules.themeManager.setTheme(preferences.theme || 'auto');
      }
    } catch (error) {
      console.error('Failed to load saved data:', error);
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    
    try {
      // Get form data
      const phoneNumber = document.getElementById('phone-input').value;
      const message = document.getElementById('message-input').value;
      const countryCode = document.getElementById('country-code').textContent;

      // Validate input
      const validation = await this.modules.validationManager.validateForm({
        phoneNumber,
        message,
        countryCode
      });

      if (!validation.isValid) {
        this.showValidationErrors(validation.errors);
        return;
      }

      // Format phone number
      const formattedPhone = this.modules.phoneManager.formatPhoneNumber(phoneNumber, countryCode);
      
      // Create WhatsApp URL
      const whatsappUrl = this.modules.messageManager.createWhatsAppUrl(formattedPhone, message);
      
      // Track analytics
      this.modules.analyticsManager.track('message_sent', {
        countryCode,
        messageLength: message.length,
        hasMessage: message.length > 0
      });

      // Open WhatsApp
      this.openWhatsApp(whatsappUrl);
      
      // Show success message
      this.modules.toastManager.show('Message opened in WhatsApp!', 'success');
      
      // Save to history
      await this.modules.storageManager.addToHistory({
        phoneNumber: formattedPhone,
        message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      this.modules.toastManager.show('Failed to send message', 'error');
    }
  }

  showValidationErrors(errors) {
    // Clear previous errors
    const errorElements = document.querySelectorAll('.form__error');
    errorElements.forEach(el => el.hidden = true);

    // Show new errors
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = document.getElementById(`${field}-error`);
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
      }
    });
  }

  async handleAddContact() {
    try {
      const phoneNumber = document.getElementById('phone-input').value;
      const countryCode = document.getElementById('country-code').textContent;
      
      if (!phoneNumber) {
        this.modules.toastManager.show('Please enter a phone number first', 'warning');
        return;
      }

      const contact = {
        name: prompt('Enter contact name:'),
        phoneNumber: this.modules.phoneManager.formatPhoneNumber(phoneNumber, countryCode),
        countryCode
      };

      if (contact.name) {
        await this.modules.contactManager.addContact(contact);
        this.modules.toastManager.show('Contact saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Failed to add contact:', error);
      this.modules.toastManager.show('Failed to save contact', 'error');
    }
  }

  async handleBulkMessage() {
    try {
      const contacts = await this.modules.contactManager.getContacts();
      
      if (contacts.length === 0) {
        this.modules.toastManager.show('No contacts saved. Add some contacts first!', 'warning');
        return;
      }

      // Open bulk message modal (to be implemented)
      this.modules.toastManager.show('Bulk messaging feature coming soon!', 'info');
    } catch (error) {
      console.error('Failed to handle bulk message:', error);
      this.modules.toastManager.show('Failed to open bulk messaging', 'error');
    }
  }

  async handleQRGeneration() {
    try {
      const phoneNumber = document.getElementById('phone-input').value;
      const message = document.getElementById('message-input').value;
      const countryCode = document.getElementById('country-code').textContent;

      if (!phoneNumber) {
        this.modules.toastManager.show('Please enter a phone number first', 'warning');
        return;
      }

      const formattedPhone = this.modules.phoneManager.formatPhoneNumber(phoneNumber, countryCode);
      const whatsappUrl = this.modules.messageManager.createWhatsAppUrl(formattedPhone, message);
      
      // Generate QR code
      const qrCode = await this.modules.qrManager.generateQRCode(whatsappUrl);
      
      // Display in modal
      const qrContainer = document.getElementById('qr-code');
      if (qrContainer) {
        qrContainer.innerHTML = qrCode;
        this.modules.modalManager.openModal('qr-modal');
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      this.modules.toastManager.show('Failed to generate QR code', 'error');
    }
  }

  handleMessagePreview() {
    const message = document.getElementById('message-input').value;
    
    if (!message) {
      this.modules.toastManager.show('Please enter a message first', 'warning');
      return;
    }

    // Show preview in modal (to be implemented)
    this.modules.toastManager.show('Message preview feature coming soon!', 'info');
  }

  handleEmojiPicker() {
    // Implement emoji picker (to be implemented)
    this.modules.toastManager.show('Emoji picker feature coming soon!', 'info');
  }

  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update theme manager
    if (this.modules.themeManager) {
      this.modules.themeManager.setTheme(theme);
    }

    // Save setting
    if (this.modules.storageManager) {
      this.modules.storageManager.setSetting('theme', theme);
    }

    // Track analytics
    if (this.modules.analyticsManager) {
      this.modules.analyticsManager.track('theme_changed', { theme });
    }
  }

  showWelcomeMessage() {
    if (this.modules.toastManager) {
      this.modules.toastManager.show('Welcome to WhatsApp Message Sender! 🚀', 'success');
    }
  }

  openWhatsApp(url) {
    window.open(url, '_blank');
  }

  handleOnline() {
    this.isOnline = true;
    document.body.classList.remove('offline');
    
    if (this.modules.toastManager) {
      this.modules.toastManager.show('You are back online!', 'success');
    }
  }

  handleOffline() {
    this.isOnline = false;
    document.body.classList.add('offline');
    
    if (this.modules.toastManager) {
      this.modules.toastManager.show('You are offline. Some features may be limited.', 'warning');
    }
  }

  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + T: Focus message input
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      const messageInput = document.getElementById('message-input');
      if (messageInput) messageInput.focus();
    }

    // Ctrl/Cmd + P: Focus phone input
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      const phoneInput = document.getElementById('phone-input');
      if (phoneInput) phoneInput.focus();
    }

    // Escape: Close modals
    if (e.key === 'Escape') {
      if (this.modules.modalManager) {
        this.modules.modalManager.closeAllModals();
      }
    }
  }

  setupAnalytics() {
    if (this.modules.analyticsManager) {
      // Track page view
      this.modules.analyticsManager.trackPageView();

      // Track user behavior
      this.modules.analyticsManager.trackUserBehavior('app_opened');
    }
  }

  checkForUpdates() {
    // Check for app updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.update();
        });
      });
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.whatsappApp = new WhatsAppApp();
});

// Export for testing
export { WhatsAppApp }; 