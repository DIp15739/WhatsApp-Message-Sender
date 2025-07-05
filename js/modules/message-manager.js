export class MessageManager {
  constructor() {
    this.messageHistory = [];
    this.scheduledMessages = [];
    this.bulkQueue = [];
  }

  async init() {
    await this.loadMessageHistory();
    await this.loadScheduledMessages();
  }

  createWhatsAppUrl(phone, message, platform = 'api') {
    const encodedMsg = encodeURIComponent(message || '');
    const cleanPhone = this.cleanPhoneNumber(phone);
    
    switch (platform) {
      case 'api':
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
      case 'web':
        return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
      case 'business':
        return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
      default:
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
    }
  }

  cleanPhoneNumber(phone) {
    return phone.replace(/[^\d+]/g, '');
  }

  // Rich text formatting
  formatMessage(text, options = {}) {
    let formatted = text;
    
    if (options.bold) {
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');
    }
    
    if (options.italic) {
      formatted = formatted.replace(/__(.*?)__/g, '_$1_');
    }
    
    if (options.strikethrough) {
      formatted = formatted.replace(/~~(.*?)~~/g, '~$1~');
    }
    
    if (options.monospace) {
      formatted = formatted.replace(/```(.*?)```/g, '```$1```');
    }
    
    return formatted;
  }

  // Message templates
  getDefaultTemplates() {
    return [
      {
        name: 'Greeting',
        content: 'Hello! How are you doing today?',
        category: 'greeting'
      },
      {
        name: 'Meeting Reminder',
        content: 'Hi! Just a reminder about our meeting tomorrow at 10 AM.',
        category: 'business'
      },
      {
        name: 'Thank You',
        content: 'Thank you for your time! Have a great day.',
        category: 'courtesy'
      },
      {
        name: 'Quick Question',
        content: 'Hi! I have a quick question for you.',
        category: 'inquiry'
      },
      {
        name: 'Happy Birthday',
        content: '🎉 Happy Birthday! 🎂 Wishing you a wonderful day!',
        category: 'celebration'
      }
    ];
  }

  // Message scheduling (client-side reminders)
  scheduleMessage(phone, message, scheduledTime, options = {}) {
    const scheduledMessage = {
      id: Date.now().toString(),
      phone,
      message,
      scheduledTime: new Date(scheduledTime).toISOString(),
      status: 'pending',
      options
    };

    this.scheduledMessages.push(scheduledMessage);
    this.saveScheduledMessages();
    
    // Set browser reminder
    if (options.reminder) {
      this.setBrowserReminder(scheduledMessage);
    }

    return scheduledMessage;
  }

  setBrowserReminder(message) {
    const timeUntilScheduled = new Date(message.scheduledTime) - new Date();
    
    if (timeUntilScheduled > 0) {
      setTimeout(() => {
        this.showScheduledMessageReminder(message);
      }, timeUntilScheduled);
    }
  }

  showScheduledMessageReminder(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Scheduled WhatsApp Message', {
        body: `Time to send message to ${message.phone}`,
        icon: '/img/whatsapp.png'
      });
    }
  }

  // Bulk messaging
  async prepareBulkMessage(contacts, message, options = {}) {
    const bulkMessage = {
      id: Date.now().toString(),
      contacts: contacts.map(contact => ({
        ...contact,
        status: 'pending',
        attempts: 0
      })),
      message: this.formatMessage(message, options),
      options,
      createdAt: new Date().toISOString(),
      status: 'prepared'
    };

    this.bulkQueue.push(bulkMessage);
    return bulkMessage;
  }

  async sendBulkMessage(bulkMessageId) {
    const bulkMessage = this.bulkQueue.find(msg => msg.id === bulkMessageId);
    if (!bulkMessage) return null;

    bulkMessage.status = 'sending';
    const results = [];

    for (const contact of bulkMessage.contacts) {
      try {
        const url = this.createWhatsAppUrl(contact.phoneNumber, bulkMessage.message);
        window.open(url, '_blank');
        
        contact.status = 'sent';
        contact.sentAt = new Date().toISOString();
        results.push({ contact, success: true });
        
        // Add delay between messages to avoid spam
        await this.delay(1000);
      } catch (error) {
        contact.status = 'failed';
        contact.attempts++;
        results.push({ contact, success: false, error: error.message });
      }
    }

    bulkMessage.status = 'completed';
    bulkMessage.results = results;
    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Message history
  async addToHistory(messageData) {
    const historyEntry = {
      id: Date.now().toString(),
      ...messageData,
      timestamp: new Date().toISOString()
    };

    this.messageHistory.unshift(historyEntry);
    
    // Keep only last 100 messages
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(0, 100);
    }

    await this.saveMessageHistory();
    return historyEntry;
  }

  async getMessageHistory(limit = 20) {
    return this.messageHistory.slice(0, limit);
  }

  async clearMessageHistory() {
    this.messageHistory = [];
    await this.saveMessageHistory();
  }

  // Analytics
  getMessageStats() {
    const total = this.messageHistory.length;
    const today = this.messageHistory.filter(msg => {
      const msgDate = new Date(msg.timestamp).toDateString();
      const todayDate = new Date().toDateString();
      return msgDate === todayDate;
    }).length;

    const thisWeek = this.messageHistory.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return msgDate >= weekAgo;
    }).length;

    return { total, today, thisWeek };
  }

  // Storage methods
  async saveMessageHistory() {
    localStorage.setItem('messageHistory', JSON.stringify(this.messageHistory));
  }

  async loadMessageHistory() {
    const data = localStorage.getItem('messageHistory');
    this.messageHistory = data ? JSON.parse(data) : [];
  }

  async saveScheduledMessages() {
    localStorage.setItem('scheduledMessages', JSON.stringify(this.scheduledMessages));
  }

  async loadScheduledMessages() {
    const data = localStorage.getItem('scheduledMessages');
    this.scheduledMessages = data ? JSON.parse(data) : [];
  }

  // Utility methods
  validateMessage(message) {
    const errors = [];
    
    if (!message || message.trim().length === 0) {
      errors.push('Message cannot be empty');
    }
    
    if (message && message.length > 1000) {
      errors.push('Message is too long (max 1000 characters)');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getMessagePreview(message, maxLength = 50) {
    if (!message) return '';
    return message.length > maxLength 
      ? message.substring(0, maxLength) + '...'
      : message;
  }
} 