export class StorageManager {
  constructor() {
    this.prefix = 'whatsapp_sender_';
    this.encryptionKey = null;
    this.compressionEnabled = true;
  }

  async init() {
    await this.setupEncryption();
    await this.migrateOldData();
    await this.cleanupExpiredData();
  }

  // Setup encryption for sensitive data
  async setupEncryption() {
    try {
      // Generate or retrieve encryption key
      let key = localStorage.getItem(`${this.prefix}encryption_key`);
      if (!key) {
        key = this.generateEncryptionKey();
        localStorage.setItem(`${this.prefix}encryption_key`, key);
      }
      this.encryptionKey = key;
    } catch (error) {
      console.warn('Encryption setup failed:', error);
    }
  }

  generateEncryptionKey() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Basic storage operations
  async set(key, value, options = {}) {
    try {
      const fullKey = this.prefix + key;
      let dataToStore = value;

      // Encrypt if needed
      if (options.encrypt && this.encryptionKey) {
        dataToStore = await this.encrypt(JSON.stringify(value));
      }

      // Compress if enabled and data is large
      if (this.compressionEnabled && JSON.stringify(value).length > 1000) {
        dataToStore = await this.compress(JSON.stringify(value));
      }

      const storageData = {
        value: dataToStore,
        timestamp: new Date().toISOString(),
        encrypted: options.encrypt || false,
        compressed: this.compressionEnabled && JSON.stringify(value).length > 1000,
        expiresAt: options.expiresAt || null
      };

      localStorage.setItem(fullKey, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('Failed to set storage item:', error);
      return false;
    }
  }

  async get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const data = localStorage.getItem(fullKey);
      
      if (!data) return defaultValue;

      const storageData = JSON.parse(data);

      // Check if data has expired
      if (storageData.expiresAt && new Date(storageData.expiresAt) < new Date()) {
        localStorage.removeItem(fullKey);
        return defaultValue;
      }

      let value = storageData.value;

      // Decompress if needed
      if (storageData.compressed) {
        value = await this.decompress(value);
      }

      // Decrypt if needed
      if (storageData.encrypted && this.encryptionKey) {
        value = await this.decrypt(value);
      }

      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.error('Failed to get storage item:', error);
      return defaultValue;
    }
  }

  async remove(key) {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Failed to remove storage item:', error);
      return false;
    }
  }

  async clear() {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      appKeys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  // Session storage operations
  async setSession(key, value, options = {}) {
    try {
      const fullKey = this.prefix + key;
      let dataToStore = value;

      if (options.encrypt && this.encryptionKey) {
        dataToStore = await this.encrypt(JSON.stringify(value));
      }

      const storageData = {
        value: dataToStore,
        timestamp: new Date().toISOString(),
        encrypted: options.encrypt || false
      };

      sessionStorage.setItem(fullKey, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('Failed to set session storage item:', error);
      return false;
    }
  }

  async getSession(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const data = sessionStorage.getItem(fullKey);
      
      if (!data) return defaultValue;

      const storageData = JSON.parse(data);
      let value = storageData.value;

      if (storageData.encrypted && this.encryptionKey) {
        value = await this.decrypt(value);
      }

      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch (error) {
      console.error('Failed to get session storage item:', error);
      return defaultValue;
    }
  }

  async removeSession(key) {
    try {
      const fullKey = this.prefix + key;
      sessionStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('Failed to remove session storage item:', error);
      return false;
    }
  }

  // Data management
  async addToHistory(data) {
    try {
      const history = await this.get('message_history', []);
      const historyItem = {
        id: Date.now().toString(),
        ...data,
        timestamp: new Date().toISOString()
      };

      history.unshift(historyItem);

      // Keep only last 100 items
      if (history.length > 100) {
        history.splice(100);
      }

      await this.set('message_history', history);
      return historyItem;
    } catch (error) {
      console.error('Failed to add to history:', error);
      return null;
    }
  }

  async getHistory(limit = 20) {
    try {
      const history = await this.get('message_history', []);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Failed to get history:', error);
      return [];
    }
  }

  async clearHistory() {
    try {
      await this.remove('message_history');
      return true;
    } catch (error) {
      console.error('Failed to clear history:', error);
      return false;
    }
  }

  // Settings management
  async setSetting(key, value) {
    try {
      const settings = await this.get('settings', {});
      settings[key] = value;
      await this.set('settings', settings);
      return true;
    } catch (error) {
      console.error('Failed to set setting:', error);
      return false;
    }
  }

  async getSetting(key, defaultValue = null) {
    try {
      const settings = await this.get('settings', {});
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return defaultValue;
    }
  }

  async getAllSettings() {
    try {
      return await this.get('settings', {});
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return {};
    }
  }

  // Data export/import
  async exportData() {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      const exportData = {};
      for (const key of appKeys) {
        const cleanKey = key.replace(this.prefix, '');
        exportData[cleanKey] = localStorage.getItem(key);
      }

      return {
        data: exportData,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  async importData(data) {
    try {
      if (!data || !data.data) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;
      for (const [key, value] of Object.entries(data.data)) {
        const fullKey = this.prefix + key;
        localStorage.setItem(fullKey, value);
        importedCount++;
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import data:', error);
      return 0;
    }
  }

  // Storage statistics
  async getStorageStats() {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      let totalSize = 0;
      const keyStats = {};

      for (const key of appKeys) {
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        
        const cleanKey = key.replace(this.prefix, '');
        keyStats[cleanKey] = {
          size,
          lastModified: new Date().toISOString()
        };
      }

      return {
        totalKeys: appKeys.length,
        totalSize,
        keyStats,
        quota: await this.getStorageQuota()
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  async getStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          usagePercentage: (estimate.usage / estimate.quota) * 100
        };
      } catch (error) {
        console.warn('Failed to get storage quota:', error);
      }
    }
    return null;
  }

  // Data cleanup
  async cleanupExpiredData() {
    try {
      const keys = Object.keys(localStorage);
      const appKeys = keys.filter(key => key.startsWith(this.prefix));
      
      let cleanedCount = 0;
      for (const key of appKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const storageData = JSON.parse(data);
            if (storageData.expiresAt && new Date(storageData.expiresAt) < new Date()) {
              localStorage.removeItem(key);
              cleanedCount++;
            }
          } catch (error) {
            // Invalid JSON, remove it
            localStorage.removeItem(key);
            cleanedCount++;
          }
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      return 0;
    }
  }

  // Data migration
  async migrateOldData() {
    try {
      // Check for old data format and migrate if needed
      const oldData = localStorage.getItem('contacts');
      if (oldData && !localStorage.getItem(`${this.prefix}contacts`)) {
        await this.set('contacts', JSON.parse(oldData));
        localStorage.removeItem('contacts');
      }

      const oldTemplates = localStorage.getItem('templates');
      if (oldTemplates && !localStorage.getItem(`${this.prefix}templates`)) {
        await this.set('templates', JSON.parse(oldTemplates));
        localStorage.removeItem('templates');
      }
    } catch (error) {
      console.error('Failed to migrate old data:', error);
    }
  }

  // Encryption methods
  async encrypt(text) {
    if (!this.encryptionKey) return text;
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.encryptionKey),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      const encryptedArray = new Uint8Array(encrypted);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(encryptedArray);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }

  async decrypt(encryptedText) {
    if (!this.encryptionKey) return encryptedText;
    
    try {
      const combined = new Uint8Array(
        atob(encryptedText).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.encryptionKey),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  // Compression methods
  async compress(text) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      
      const compressed = await new Promise((resolve) => {
        const reader = new ReadableStream({
          start(controller) {
            controller.enqueue(data);
            controller.close();
          }
        });

        reader
          .pipeThrough(new CompressionStream('gzip'))
          .pipeTo(new WritableStream({
            write(chunk) {
              resolve(chunk);
            }
          }));
      });

      return btoa(String.fromCharCode(...new Uint8Array(compressed)));
    } catch (error) {
      console.error('Compression failed:', error);
      return text;
    }
  }

  async decompress(compressedText) {
    try {
      const compressed = new Uint8Array(
        atob(compressedText).split('').map(char => char.charCodeAt(0))
      );

      const decompressed = await new Promise((resolve) => {
        const reader = new ReadableStream({
          start(controller) {
            controller.enqueue(compressed);
            controller.close();
          }
        });

        reader
          .pipeThrough(new DecompressionStream('gzip'))
          .pipeTo(new WritableStream({
            write(chunk) {
              resolve(chunk);
            }
          }));
      });

      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.error('Decompression failed:', error);
      return compressedText;
    }
  }
} 