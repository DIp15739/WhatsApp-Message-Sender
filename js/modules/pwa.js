export class PWAManager {
  constructor() {
    this.serviceWorker = null;
    this.isInstalled = false;
    this.deferredPrompt = null;
    this.offlineData = new Map();
  }

  async init() {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    this.setupOfflineDetection();
    this.setupPushNotifications();
    this.checkInstallationStatus();
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorker = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', this.serviceWorker);

        // Listen for service worker updates
        this.serviceWorker.addEventListener('updatefound', () => {
          const newWorker = this.serviceWorker.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Install Prompt Management
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.hideInstallButton();
      this.trackInstallation();
    });
  }

  async showInstallPrompt() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log('Install prompt outcome:', outcome);
      this.deferredPrompt = null;
    }
  }

  showInstallButton() {
    const installButton = document.getElementById('install-app');
    if (installButton) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', () => {
        this.showInstallPrompt();
      });
    }
  }

  hideInstallButton() {
    const installButton = document.getElementById('install-app');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Offline Functionality
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Check initial state
    if (!navigator.onLine) {
      this.handleOffline();
    }
  }

  handleOnline() {
    document.body.classList.remove('offline');
    this.showToast('You are back online!', 'success');
    this.syncOfflineData();
  }

  handleOffline() {
    document.body.classList.add('offline');
    this.showToast('You are offline. Some features may be limited.', 'warning');
  }

  // Offline Data Management
  async storeOfflineData(key, data) {
    try {
      this.offlineData.set(key, {
        data,
        timestamp: new Date().toISOString()
      });

      // Store in IndexedDB for persistence
      await this.storeInIndexedDB(key, data);
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  async getOfflineData(key) {
    try {
      // Try memory first
      const memoryData = this.offlineData.get(key);
      if (memoryData) {
        return memoryData.data;
      }

      // Try IndexedDB
      return await this.getFromIndexedDB(key);
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  async syncOfflineData() {
    try {
      const offlineActions = await this.getOfflineData('pending_actions');
      if (offlineActions && offlineActions.length > 0) {
        for (const action of offlineActions) {
          await this.processOfflineAction(action);
        }
        await this.clearOfflineData('pending_actions');
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
    }
  }

  async processOfflineAction(action) {
    try {
      switch (action.type) {
        case 'message_sent':
          // Re-send message when online
          await this.resendMessage(action.data);
          break;
        case 'contact_saved':
          // Re-save contact when online
          await this.resaveContact(action.data);
          break;
        default:
          console.warn('Unknown offline action type:', action.type);
      }
    } catch (error) {
      console.error('Failed to process offline action:', error);
    }
  }

  // Push Notifications
  async setupPushNotifications() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.subscribeToPushNotifications();
      }
    }
  }

  async subscribeToPushNotifications() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.getVapidPublicKey())
        });

        console.log('Push notification subscription:', subscription);
        this.saveSubscription(subscription);
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
      }
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getVapidPublicKey() {
    // This would be your VAPID public key
    return 'YOUR_VAPID_PUBLIC_KEY';
  }

  saveSubscription(subscription) {
    localStorage.setItem('push_subscription', JSON.stringify(subscription));
  }

  // App Shortcuts
  setupAppShortcuts() {
    if ('beforeinstallprompt' in window) {
      // App shortcuts would be defined in the manifest.json
      console.log('App shortcuts available');
    }
  }

  // Background Sync
  async registerBackgroundSync(tag, data) {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        
        // Store data for background sync
        await this.storeOfflineData(`sync_${tag}`, data);
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  // Update Management
  showUpdateNotification() {
    const updateNotification = document.createElement('div');
    updateNotification.className = 'update-notification';
    updateNotification.innerHTML = `
      <div class="update-content">
        <p>A new version is available!</p>
        <button onclick="this.updateApp()">Update Now</button>
        <button onclick="this.dismissUpdate()">Later</button>
      </div>
    `;
    
    document.body.appendChild(updateNotification);
  }

  updateApp() {
    if (this.serviceWorker && this.serviceWorker.waiting) {
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  dismissUpdate() {
    const notification = document.querySelector('.update-notification');
    if (notification) {
      notification.remove();
    }
  }

  // Installation Status
  checkInstallationStatus() {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }

    // Check if running in standalone mode
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
    }
  }

  // IndexedDB Operations
  async storeInIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WhatsAppSenderDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        const putRequest = store.put({ key, data, timestamp: new Date().toISOString() });
        
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'key' });
        }
      };
    });
  }

  async getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WhatsAppSenderDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readonly');
        const store = transaction.objectStore('offlineData');
        const getRequest = store.get(key);
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result ? getRequest.result.data : null);
        };
        getRequest.onerror = () => reject(getRequest.error);
      };
    });
  }

  async clearOfflineData(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('WhatsAppSenderDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        const deleteRequest = store.delete(key);
        
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      };
    });
  }

  // Utility Methods
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'CACHE_UPDATED':
        this.showToast('App updated successfully!', 'success');
        break;
      case 'OFFLINE_ACTION':
        this.processOfflineAction(data.action);
        break;
      default:
        console.log('Service Worker message:', data);
    }
  }

  showToast(message, type = 'info') {
    // Use the toast manager if available
    if (window.whatsappApp && window.whatsappApp.modules.toastManager) {
      window.whatsappApp.modules.toastManager.show(message, type);
    } else {
      console.log(`Toast: ${message}`);
    }
  }

  trackInstallation() {
    // Track installation event
    if (window.whatsappApp && window.whatsappApp.modules.analyticsManager) {
      window.whatsappApp.modules.analyticsManager.track('app_installed');
    }
  }

  async resendMessage(messageData) {
    // Re-send message when back online
    try {
      const url = `https://api.whatsapp.com/send?phone=${messageData.phone}&text=${encodeURIComponent(messageData.message)}`;
      window.open(url, '_blank');
      
      if (window.whatsappApp && window.whatsappApp.modules.analyticsManager) {
        window.whatsappApp.modules.analyticsManager.track('message_resent_offline');
      }
    } catch (error) {
      console.error('Failed to resend message:', error);
    }
  }

  async resaveContact(contactData) {
    // Re-save contact when back online
    try {
      if (window.whatsappApp && window.whatsappApp.modules.contactManager) {
        await window.whatsappApp.modules.contactManager.addContact(contactData);
      }
    } catch (error) {
      console.error('Failed to resave contact:', error);
    }
  }

  // PWA Status
  getPWAStatus() {
    return {
      isInstalled: this.isInstalled,
      isOnline: navigator.onLine,
      serviceWorkerActive: !!this.serviceWorker,
      pushSupported: 'PushManager' in window,
      backgroundSyncSupported: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype
    };
  }
} 