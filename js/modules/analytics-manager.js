export class AnalyticsManager {
  constructor() {
    this.events = [];
    this.userSessions = [];
    this.performanceMetrics = {};
    this.featureUsage = {};
    this.errorLogs = [];
  }

  async init() {
    await this.loadAnalytics();
    this.startSession();
    this.trackPageView();
    this.setupPerformanceMonitoring();
  }

  // Event tracking
  track(eventName, data = {}) {
    const event = {
      id: Date.now().toString(),
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(event);
    this.saveAnalytics();

    // Track feature usage
    this.trackFeatureUsage(eventName);

    console.log(`Analytics: ${eventName}`, data);
  }

  // Feature usage tracking
  trackFeatureUsage(feature) {
    if (!this.featureUsage[feature]) {
      this.featureUsage[feature] = {
        count: 0,
        firstUsed: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
    }

    this.featureUsage[feature].count++;
    this.featureUsage[feature].lastUsed = new Date().toISOString();
  }

  // Session management
  startSession() {
    const session = {
      id: this.generateSessionId(),
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    this.userSessions.push(session);
    sessionStorage.setItem('currentSessionId', session.id);
  }

  getCurrentSessionId() {
    return sessionStorage.getItem('currentSessionId');
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Page view tracking
  trackPageView() {
    this.track('page_view', {
      title: document.title,
      url: window.location.href,
      referrer: document.referrer
    });
  }

  // Performance monitoring
  setupPerformanceMonitoring() {
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.capturePerformanceMetrics();
        }, 1000);
      });
    }
  }

  capturePerformanceMetrics() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');

      this.performanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        timestamp: new Date().toISOString()
      };

      this.track('performance_metrics', this.performanceMetrics);
    }
  }

  // Error tracking
  trackError(error, context = {}) {
    const errorEvent = {
      id: Date.now().toString(),
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.getCurrentSessionId(),
      url: window.location.href
    };

    this.errorLogs.push(errorEvent);
    this.track('error', errorEvent);
  }

  // User behavior tracking
  trackUserBehavior(action, details = {}) {
    this.track('user_behavior', {
      action,
      details,
      element: details.element || null,
      position: details.position || null
    });
  }

  // Message analytics
  trackMessageSent(data) {
    this.track('message_sent', {
      countryCode: data.countryCode,
      messageLength: data.messageLength,
      hasMessage: data.hasMessage,
      platform: data.platform || 'api',
      templateUsed: data.templateUsed || false
    });
  }

  trackTemplateUsage(templateId, templateName) {
    this.track('template_used', {
      templateId,
      templateName
    });
  }

  trackContactSaved(contactData) {
    this.track('contact_saved', {
      hasName: !!contactData.name,
      hasGroup: !!contactData.group
    });
  }

  trackQRGenerated(type, data) {
    this.track('qr_generated', {
      type,
      dataLength: data ? data.length : 0
    });
  }

  // Analytics reports
  getAnalyticsReport(timeframe = '7d') {
    const now = new Date();
    const cutoff = this.getCutoffDate(timeframe);
    
    const filteredEvents = this.events.filter(event => 
      new Date(event.timestamp) >= cutoff
    );

    return {
      timeframe,
      totalEvents: filteredEvents.length,
      uniqueSessions: this.getUniqueSessions(filteredEvents),
      topEvents: this.getTopEvents(filteredEvents),
      featureUsage: this.getFeatureUsageStats(timeframe),
      performance: this.getPerformanceStats(),
      errors: this.getErrorStats(timeframe)
    };
  }

  getCutoffDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  getUniqueSessions(events) {
    const sessionIds = new Set(events.map(e => e.sessionId));
    return sessionIds.size;
  }

  getTopEvents(events, limit = 10) {
    const eventCounts = {};
    events.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });

    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  }

  getFeatureUsageStats(timeframe) {
    const cutoff = this.getCutoffDate(timeframe);
    const recentUsage = {};

    Object.entries(this.featureUsage).forEach(([feature, data]) => {
      if (new Date(data.lastUsed) >= cutoff) {
        recentUsage[feature] = data;
      }
    });

    return recentUsage;
  }

  getPerformanceStats() {
    return this.performanceMetrics;
  }

  getErrorStats(timeframe) {
    const cutoff = this.getCutoffDate(timeframe);
    const recentErrors = this.errorLogs.filter(error => 
      new Date(error.timestamp) >= cutoff
    );

    return {
      total: recentErrors.length,
      byType: this.groupErrorsByType(recentErrors)
    };
  }

  groupErrorsByType(errors) {
    const grouped = {};
    errors.forEach(error => {
      const type = error.message.split(':')[0] || 'Unknown';
      grouped[type] = (grouped[type] || 0) + 1;
    });
    return grouped;
  }

  // Export analytics data
  exportAnalytics() {
    return {
      events: this.events,
      sessions: this.userSessions,
      performance: this.performanceMetrics,
      featureUsage: this.featureUsage,
      errors: this.errorLogs,
      exportDate: new Date().toISOString()
    };
  }

  // Clear analytics data
  clearAnalytics() {
    this.events = [];
    this.userSessions = [];
    this.performanceMetrics = {};
    this.featureUsage = {};
    this.errorLogs = [];
    this.saveAnalytics();
  }

  // Storage methods
  async saveAnalytics() {
    try {
      const analyticsData = {
        events: this.events.slice(-1000), // Keep last 1000 events
        sessions: this.userSessions.slice(-100), // Keep last 100 sessions
        featureUsage: this.featureUsage,
        errorLogs: this.errorLogs.slice(-100) // Keep last 100 errors
      };
      localStorage.setItem('analytics', JSON.stringify(analyticsData));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  async loadAnalytics() {
    try {
      const data = localStorage.getItem('analytics');
      if (data) {
        const analyticsData = JSON.parse(data);
        this.events = analyticsData.events || [];
        this.userSessions = analyticsData.sessions || [];
        this.featureUsage = analyticsData.featureUsage || {};
        this.errorLogs = analyticsData.errorLogs || [];
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }

  // Privacy and GDPR compliance
  anonymizeData() {
    this.events = this.events.map(event => ({
      ...event,
      sessionId: this.hashString(event.sessionId),
      userAgent: this.anonymizeUserAgent(event.userAgent)
    }));

    this.userSessions = this.userSessions.map(session => ({
      ...session,
      id: this.hashString(session.id),
      userAgent: this.anonymizeUserAgent(session.userAgent)
    }));
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  anonymizeUserAgent(userAgent) {
    // Remove specific browser/OS details, keep only general info
    return userAgent
      .replace(/Chrome\/[\d.]+/, 'Chrome')
      .replace(/Firefox\/[\d.]+/, 'Firefox')
      .replace(/Safari\/[\d.]+/, 'Safari')
      .replace(/Edge\/[\d.]+/, 'Edge');
  }
} 