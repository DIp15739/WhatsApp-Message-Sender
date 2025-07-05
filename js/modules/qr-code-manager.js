export class QRCodeManager {
  constructor() {
    this.qrLibrary = null;
    this.defaultOptions = {
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#FFFFFF',
      correctLevel: 'M', // L, M, Q, H
      margin: 4
    };
  }

  async init() {
    // Try to load QR code library
    await this.loadQRLibrary();
  }

  async loadQRLibrary() {
    // Try multiple QR code libraries
    const libraries = [
      'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
      'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js'
    ];

    for (const library of libraries) {
      try {
        await this.loadScript(library);
        this.qrLibrary = window.QRCode || window.qrcode;
        if (this.qrLibrary) {
          console.log('QR Code library loaded successfully');
          break;
        }
      } catch (error) {
        console.warn(`Failed to load QR library from ${library}:`, error);
      }
    }

    if (!this.qrLibrary) {
      console.warn('No QR code library available, using fallback method');
    }
  }

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async generateQRCode(data, options = {}) {
    const config = { ...this.defaultOptions, ...options };

    try {
      if (this.qrLibrary) {
        return await this.generateWithLibrary(data, config);
      } else {
        return await this.generateFallback(data, config);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return this.generateErrorQR();
    }
  }

  async generateWithLibrary(data, config) {
    return new Promise((resolve, reject) => {
      try {
        // Try QRCode library (most common)
        if (window.QRCode) {
          const canvas = document.createElement('canvas');
          window.QRCode.toCanvas(canvas, data, {
            width: config.width,
            margin: config.margin,
            color: {
              dark: config.colorDark,
              light: config.colorLight
            },
            errorCorrectionLevel: config.correctLevel
          }, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve(canvas.toDataURL('image/png'));
            }
          });
        }
        // Try qrcode-generator library
        else if (window.qrcode) {
          const qr = window.qrcode(0, config.correctLevel);
          qr.addData(data);
          qr.make();
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = config.width;
          canvas.height = config.height;
          
          const cellSize = config.width / qr.getModuleCount();
          const margin = config.margin;
          
          ctx.fillStyle = config.colorLight;
          ctx.fillRect(0, 0, config.width, config.height);
          
          ctx.fillStyle = config.colorDark;
          for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
              if (qr.isDark(row, col)) {
                ctx.fillRect(
                  margin + col * cellSize,
                  margin + row * cellSize,
                  cellSize,
                  cellSize
                );
              }
            }
          }
          
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error('No QR library available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async generateFallback(data, config) {
    // Simple fallback using canvas API
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = config.width;
    canvas.height = config.height;

    // Fill background
    ctx.fillStyle = config.colorLight;
    ctx.fillRect(0, 0, config.width, config.height);

    // Create simple pattern (not a real QR code, just for fallback)
    ctx.fillStyle = config.colorDark;
    const size = Math.min(config.width, config.height) / 8;
    
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * size, j * size, size, size);
        }
      }
    }

    return canvas.toDataURL('image/png');
  }

  generateErrorQR() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 256;

    // Red background
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, 256, 256);

    // Error text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code Error', 128, 120);
    ctx.fillText('Please try again', 128, 140);

    return canvas.toDataURL('image/png');
  }

  // Generate WhatsApp-specific QR codes
  async generateWhatsAppQR(phone, message = '', platform = 'api') {
    const url = this.createWhatsAppURL(phone, message, platform);
    return await this.generateQRCode(url, {
      colorDark: '#25D366', // WhatsApp green
      colorLight: '#FFFFFF'
    });
  }

  createWhatsAppURL(phone, message, platform) {
    const encodedMsg = encodeURIComponent(message);
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
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

  // Download QR code
  async downloadQRCode(data, filename = 'qr-code.png', options = {}) {
    try {
      const qrDataUrl = await this.generateQRCode(data, options);
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    } catch (error) {
      console.error('Failed to download QR code:', error);
      return false;
    }
  }

  // Generate QR code for business card
  async generateBusinessCardQR(contactInfo) {
    const vCard = this.createVCard(contactInfo);
    return await this.generateQRCode(vCard, {
      colorDark: '#128C7E',
      colorLight: '#FFFFFF'
    });
  }

  createVCard(contactInfo) {
    const { name, phone, email, company, title, website } = contactInfo;
    
    let vCard = 'BEGIN:VCARD\nVERSION:3.0\n';
    
    if (name) vCard += `FN:${name}\n`;
    if (phone) vCard += `TEL:${phone}\n`;
    if (email) vCard += `EMAIL:${email}\n`;
    if (company) vCard += `ORG:${company}\n`;
    if (title) vCard += `TITLE:${title}\n`;
    if (website) vCard += `URL:${website}\n`;
    
    vCard += 'END:VCARD';
    return vCard;
  }

  // Generate QR code for WiFi network
  async generateWiFiQR(ssid, password, security = 'WPA') {
    const wifiString = `WIFI:S:${ssid};T:${security};P:${password};;`;
    return await this.generateQRCode(wifiString, {
      colorDark: '#000000',
      colorLight: '#FFFFFF'
    });
  }

  // Generate QR code for URL
  async generateURLQR(url) {
    return await this.generateQRCode(url, {
      colorDark: '#0066CC',
      colorLight: '#FFFFFF'
    });
  }

  // Generate QR code for text
  async generateTextQR(text) {
    return await this.generateQRCode(text, {
      colorDark: '#000000',
      colorLight: '#FFFFFF'
    });
  }

  // Get QR code as SVG
  async generateQRCodeSVG(data, options = {}) {
    const config = { ...this.defaultOptions, ...options };
    
    if (window.QRCode) {
      return new Promise((resolve, reject) => {
        window.QRCode.toString(data, {
          type: 'svg',
          width: config.width,
          margin: config.margin,
          color: {
            dark: config.colorDark,
            light: config.colorLight
          },
          errorCorrectionLevel: config.correctLevel
        }, (error, svg) => {
          if (error) {
            reject(error);
          } else {
            resolve(svg);
          }
        });
      });
    } else {
      throw new Error('SVG generation requires QRCode library');
    }
  }

  // Validate QR code data
  validateQRData(data, type = 'url') {
    const errors = [];

    if (!data || data.trim().length === 0) {
      errors.push('Data cannot be empty');
    }

    switch (type) {
      case 'url':
        try {
          new URL(data);
        } catch {
          errors.push('Invalid URL format');
        }
        break;
      case 'phone':
        if (!/^\+?[\d\s\-\(\)]+$/.test(data)) {
          errors.push('Invalid phone number format');
        }
        break;
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
          errors.push('Invalid email format');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get QR code statistics
  getQRStats() {
    return {
      libraryLoaded: !!this.qrLibrary,
      defaultOptions: this.defaultOptions,
      supportedFormats: ['url', 'text', 'phone', 'email', 'vcard', 'wifi']
    };
  }
} 