// Performance optimization stubs
export function optimizePerformance() {
  // Code splitting, lazy loading, image optimization, SEO, accessibility
  // To be implemented as part of build and runtime
  return 'Performance optimizations applied.';
}

export class PerformanceManager {
  constructor() {
    this.metrics = {};
    this.observers = [];
    this.performanceData = [];
    this.optimizationEnabled = true;
  }

  async init() {
    this.setupPerformanceMonitoring();
    this.setupResourceOptimization();
    this.setupLazyLoading();
    this.setupCaching();
  }

  // Performance Monitoring
  setupPerformanceMonitoring() {
    if ('performance' in window) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.capturePerformanceMetrics();
        }, 1000);
      });

      // Monitor user interactions
      this.setupInteractionMonitoring();

      // Monitor memory usage
      this.setupMemoryMonitoring();

      // Monitor network performance
      this.setupNetworkMonitoring();
    }
  }

  capturePerformanceMetrics() {
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const resource = performance.getEntriesByType('resource');

      this.metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: this.getLargestContentfulPaint(),
        cumulativeLayoutShift: this.getCumulativeLayoutShift(),
        totalBlockingTime: this.getTotalBlockingTime(),
        resourceCount: resource.length,
        resourceSize: resource.reduce((total, r) => total + r.transferSize, 0),
        timestamp: new Date().toISOString()
      };

      this.performanceData.push(this.metrics);
      this.savePerformanceData();
      this.analyzePerformance();
    } catch (error) {
      console.error('Failed to capture performance metrics:', error);
    }
  }

  getLargestContentfulPaint() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      });
    }
    return 0;
  }

  getCumulativeLayoutShift() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
          resolve(cls);
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      });
    }
    return 0;
  }

  getTotalBlockingTime() {
    if ('PerformanceObserver' in window) {
      return new Promise((resolve) => {
        let tbt = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            tbt += entry.duration;
          }
          resolve(tbt);
        });
        observer.observe({ entryTypes: ['longtask'] });
      });
    }
    return 0;
  }

  // Interaction Monitoring
  setupInteractionMonitoring() {
    // Monitor click events
    document.addEventListener('click', (event) => {
      this.measureInteraction('click', event.target);
    });

    // Monitor input events
    document.addEventListener('input', (event) => {
      this.measureInteraction('input', event.target);
    });

    // Monitor scroll events
    let scrollTimeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.measureInteraction('scroll', document);
      }, 100);
    });
  }

  measureInteraction(type, element) {
    const startTime = performance.now();
    
    setTimeout(() => {
      const duration = performance.now() - startTime;
      if (duration > 16) { // Longer than one frame
        this.logSlowInteraction(type, element, duration);
      }
    }, 0);
  }

  logSlowInteraction(type, element, duration) {
    console.warn(`Slow interaction detected: ${type} took ${duration.toFixed(2)}ms`, element);
    
    if (window.whatsappApp && window.whatsappApp.modules.analyticsManager) {
      window.whatsappApp.modules.analyticsManager.track('slow_interaction', {
        type,
        duration,
        element: element.tagName
      });
    }
  }

  // Memory Monitoring
  setupMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        this.metrics.memory = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };

        // Alert if memory usage is high
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercentage > 80) {
          console.warn('High memory usage detected:', usagePercentage.toFixed(2) + '%');
          this.optimizeMemory();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  optimizeMemory() {
    // Clear unnecessary caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name !== 'whatsapp-sender-v1') {
            caches.delete(name);
          }
        });
      });
    }

    // Clear performance data if too large
    if (this.performanceData.length > 100) {
      this.performanceData = this.performanceData.slice(-50);
    }
  }

  // Network Monitoring
  setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      this.metrics.network = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      // Adjust optimization based on connection
      this.adjustOptimizationForConnection(connection);
    }
  }

  adjustOptimizationForConnection(connection) {
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.enableAggressiveOptimization();
    } else if (connection.saveData) {
      this.enableDataSavingMode();
    }
  }

  // Resource Optimization
  setupResourceOptimization() {
    // Optimize images
    this.optimizeImages();

    // Optimize fonts
    this.optimizeFonts();

    // Optimize CSS
    this.optimizeCSS();
  }

  optimizeImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" if not already present
      if (!img.loading) {
        img.loading = 'lazy';
      }

      // Add decoding="async" for better performance
      if (!img.decoding) {
        img.decoding = 'async';
      }
    });
  }

  optimizeFonts() {
    // Preload critical fonts
    const criticalFonts = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'
    ];

    criticalFonts.forEach(fontUrl => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = fontUrl;
      document.head.appendChild(link);
    });
  }

  optimizeCSS() {
    // Inline critical CSS
    const criticalCSS = `
      .app-header { display: flex; align-items: center; }
      .form-group { margin-bottom: 1rem; }
      .btn { padding: 0.5rem 1rem; }
    `;

    const style = document.createElement('style');
    style.textContent = criticalCSS;
    document.head.appendChild(style);
  }

  // Lazy Loading
  setupLazyLoading() {
    // Lazy load non-critical resources
    const lazyElements = document.querySelectorAll('[data-lazy]');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadLazyElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });

    lazyElements.forEach(element => {
      observer.observe(element);
    });
  }

  loadLazyElement(element) {
    const type = element.dataset.lazy;
    
    switch (type) {
      case 'image':
        element.src = element.dataset.src;
        break;
      case 'script':
        const script = document.createElement('script');
        script.src = element.dataset.src;
        document.head.appendChild(script);
        break;
      case 'css':
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = element.dataset.src;
        document.head.appendChild(link);
        break;
    }
  }

  // Caching
  setupCaching() {
    // Cache frequently used data
    this.cacheTemplates();
    this.cacheContacts();
    this.cacheCountryCodes();
  }

  async cacheTemplates() {
    try {
      const templates = await this.get('templates');
      if (templates) {
        sessionStorage.setItem('cached_templates', JSON.stringify(templates));
      }
    } catch (error) {
      console.error('Failed to cache templates:', error);
    }
  }

  async cacheContacts() {
    try {
      const contacts = await this.get('contacts');
      if (contacts) {
        sessionStorage.setItem('cached_contacts', JSON.stringify(contacts));
      }
    } catch (error) {
      console.error('Failed to cache contacts:', error);
    }
  }

  async cacheCountryCodes() {
    try {
      const countryCodes = await this.get('country_codes');
      if (countryCodes) {
        sessionStorage.setItem('cached_country_codes', JSON.stringify(countryCodes));
      }
    } catch (error) {
      console.error('Failed to cache country codes:', error);
    }
  }

  // Performance Analysis
  analyzePerformance() {
    const analysis = {
      score: this.calculatePerformanceScore(),
      recommendations: this.generateRecommendations(),
      bottlenecks: this.identifyBottlenecks()
    };

    this.logPerformanceAnalysis(analysis);
    return analysis;
  }

  calculatePerformanceScore() {
    let score = 100;
    
    if (this.metrics.loadTime > 3000) score -= 20;
    if (this.metrics.firstContentfulPaint > 2000) score -= 15;
    if (this.metrics.largestContentfulPaint > 2500) score -= 15;
    if (this.metrics.cumulativeLayoutShift > 0.1) score -= 10;
    if (this.metrics.totalBlockingTime > 300) score -= 10;
    
    return Math.max(0, score);
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.metrics.loadTime > 3000) {
      recommendations.push('Consider optimizing image sizes and reducing HTTP requests');
    }

    if (this.metrics.firstContentfulPaint > 2000) {
      recommendations.push('Optimize critical rendering path and reduce render-blocking resources');
    }

    if (this.metrics.cumulativeLayoutShift > 0.1) {
      recommendations.push('Fix layout shifts by setting explicit dimensions for images and ads');
    }

    return recommendations;
  }

  identifyBottlenecks() {
    const bottlenecks = [];

    if (this.metrics.resourceCount > 20) {
      bottlenecks.push('Too many HTTP requests');
    }

    if (this.metrics.resourceSize > 5000000) {
      bottlenecks.push('Large resource sizes');
    }

    if (this.metrics.totalBlockingTime > 300) {
      bottlenecks.push('Long tasks blocking main thread');
    }

    return bottlenecks;
  }

  logPerformanceAnalysis(analysis) {
    console.log('Performance Analysis:', analysis);
    
    if (analysis.score < 70) {
      console.warn('Performance score is low. Consider optimizations.');
    }
  }

  // Optimization Modes
  enableAggressiveOptimization() {
    this.optimizationEnabled = true;
    
    // Disable animations
    document.body.style.setProperty('--animation-duration', '0s');
    
    // Reduce image quality
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src.includes('data:image')) {
        // Convert to lower quality
        this.reduceImageQuality(img);
      }
    });
  }

  enableDataSavingMode() {
    // Disable non-critical features
    const nonCriticalElements = document.querySelectorAll('[data-non-critical]');
    nonCriticalElements.forEach(element => {
      element.style.display = 'none';
    });
  }

  reduceImageQuality(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.naturalWidth * 0.5;
    canvas.height = img.naturalHeight * 0.5;
    
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = canvas.toDataURL('image/jpeg', 0.5);
  }

  // Data Management
  savePerformanceData() {
    try {
      localStorage.setItem('performance_data', JSON.stringify(this.performanceData));
    } catch (error) {
      console.error('Failed to save performance data:', error);
    }
  }

  loadPerformanceData() {
    try {
      const data = localStorage.getItem('performance_data');
      this.performanceData = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load performance data:', error);
    }
  }

  // Utility Methods
  async get(key) {
    // This would typically use the storage manager
    return localStorage.getItem(key);
  }

  getPerformanceReport() {
    return {
      currentMetrics: this.metrics,
      historicalData: this.performanceData,
      optimizationEnabled: this.optimizationEnabled,
      score: this.calculatePerformanceScore()
    };
  }
} 