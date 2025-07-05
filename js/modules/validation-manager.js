export class ValidationManager {
  constructor() {
    this.validationRules = {
      phone: {
        required: true,
        pattern: /^\+?[\d\s\-\(\)]+$/,
        minLength: 7,
        maxLength: 20
      },
      message: {
        required: false,
        maxLength: 1000
      },
      countryCode: {
        required: true,
        pattern: /^\+\d{1,4}$/
      },
      name: {
        required: false,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      email: {
        required: false,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      }
    };

    this.errorMessages = {
      required: 'This field is required',
      invalidPhone: 'Please enter a valid phone number',
      invalidEmail: 'Please enter a valid email address',
      invalidCountryCode: 'Please enter a valid country code',
      tooShort: 'This field is too short',
      tooLong: 'This field is too long',
      invalidFormat: 'Invalid format'
    };
  }

  async init() {
    // Load custom validation rules if any
    await this.loadCustomRules();
  }

  // Main validation method
  async validateForm(formData) {
    const errors = {};
    const warnings = {};

    // Validate each field
    for (const [field, value] of Object.entries(formData)) {
      const fieldErrors = await this.validateField(field, value);
      const fieldWarnings = await this.validateFieldWarnings(field, value);

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors[0]; // Take first error
      }

      if (fieldWarnings.length > 0) {
        warnings[field] = fieldWarnings[0]; // Take first warning
      }
    }

    // Cross-field validation
    const crossFieldErrors = await this.validateCrossFields(formData);
    Object.assign(errors, crossFieldErrors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };
  }

  // Validate individual field
  async validateField(fieldName, value) {
    const rules = this.validationRules[fieldName];
    if (!rules) return [];

    const errors = [];

    // Required validation
    if (rules.required && (!value || value.trim().length === 0)) {
      errors.push(this.errorMessages.required);
      return errors;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim().length === 0) {
      return errors;
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${this.errorMessages.tooShort} (minimum ${rules.minLength} characters)`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${this.errorMessages.tooLong} (maximum ${rules.maxLength} characters)`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      switch (fieldName) {
        case 'phone':
          errors.push(this.errorMessages.invalidPhone);
          break;
        case 'email':
          errors.push(this.errorMessages.invalidEmail);
          break;
        case 'countryCode':
          errors.push(this.errorMessages.invalidCountryCode);
          break;
        default:
          errors.push(this.errorMessages.invalidFormat);
      }
    }

    // Custom field validation
    const customErrors = await this.validateCustomField(fieldName, value);
    errors.push(...customErrors);

    return errors;
  }

  // Validate field warnings (non-blocking)
  async validateFieldWarnings(fieldName, value) {
    const warnings = [];

    // Phone number warnings
    if (fieldName === 'phone' && value) {
      const cleanPhone = value.replace(/[^\d]/g, '');
      
      if (cleanPhone.length < 10) {
        warnings.push('Phone number seems too short');
      }
      
      if (cleanPhone.length > 15) {
        warnings.push('Phone number seems too long');
      }
    }

    // Message warnings
    if (fieldName === 'message' && value) {
      if (value.length > 500) {
        warnings.push('Message is quite long');
      }
      
      if (value.includes('http') || value.includes('www')) {
        warnings.push('Message contains a link');
      }
    }

    return warnings;
  }

  // Cross-field validation
  async validateCrossFields(formData) {
    const errors = {};

    // Phone number with country code validation
    if (formData.phone && formData.countryCode) {
      const phoneValidation = await this.validatePhoneWithCountryCode(
        formData.phone, 
        formData.countryCode
      );
      
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.error;
      }
    }

    // Message content validation
    if (formData.message) {
      const messageValidation = await this.validateMessageContent(formData.message);
      if (!messageValidation.isValid) {
        errors.message = messageValidation.error;
      }
    }

    return errors;
  }

  // Validate phone number with country code
  async validatePhoneWithCountryCode(phone, countryCode) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const cleanCountryCode = countryCode.replace(/[^\d]/g, '');

    // Check if phone number starts with country code
    if (cleanPhone.startsWith(cleanCountryCode)) {
      const localNumber = cleanPhone.substring(cleanCountryCode.length);
      if (localNumber.length < 7) {
        return {
          isValid: false,
          error: 'Phone number is too short for this country'
        };
      }
    }

    // Validate against known country patterns
    const countryValidation = await this.validatePhoneByCountry(cleanPhone, countryCode);
    if (!countryValidation.isValid) {
      return countryValidation;
    }

    return { isValid: true };
  }

  // Validate phone number by country
  async validatePhoneByCountry(phone, countryCode) {
    // This would typically use a phone number validation library
    // For now, we'll use basic validation
    const countryPatterns = {
      '+1': /^\d{10}$/, // US/Canada
      '+44': /^\d{10,11}$/, // UK
      '+91': /^\d{10}$/, // India
      '+86': /^\d{11}$/, // China
      '+81': /^\d{10,11}$/, // Japan
      '+49': /^\d{10,12}$/, // Germany
      '+33': /^\d{9,10}$/, // France
      '+39': /^\d{9,10}$/, // Italy
      '+34': /^\d{9}$/, // Spain
      '+7': /^\d{10,11}$/ // Russia
    };

    const pattern = countryPatterns[countryCode];
    if (pattern && !pattern.test(phone)) {
      return {
        isValid: false,
        error: `Phone number format is invalid for ${countryCode}`
      };
    }

    return { isValid: true };
  }

  // Validate message content
  async validateMessageContent(message) {
    const warnings = [];

    // Check for spam indicators
    const spamIndicators = [
      'FREE', 'URGENT', 'WIN', 'PRIZE', 'MONEY', 'CASH',
      'CLICK HERE', 'ACT NOW', 'LIMITED TIME'
    ];

    const upperMessage = message.toUpperCase();
    const foundSpam = spamIndicators.filter(indicator => 
      upperMessage.includes(indicator)
    );

    if (foundSpam.length > 0) {
      warnings.push('Message contains potential spam indicators');
    }

    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.7) {
      warnings.push('Message contains too many capital letters');
    }

    // Check for excessive punctuation
    const punctRatio = (message.match(/[!?]/g) || []).length / message.length;
    if (punctRatio > 0.1) {
      warnings.push('Message contains too much punctuation');
    }

    return {
      isValid: warnings.length === 0,
      warnings
    };
  }

  // Custom field validation
  async validateCustomField(fieldName, value) {
    const errors = [];

    switch (fieldName) {
      case 'phone':
        errors.push(...await this.validatePhoneCustom(value));
        break;
      case 'message':
        errors.push(...await this.validateMessageCustom(value));
        break;
      case 'email':
        errors.push(...await this.validateEmailCustom(value));
        break;
    }

    return errors;
  }

  // Custom phone validation
  async validatePhoneCustom(value) {
    const errors = [];
    const cleanValue = value.replace(/[^\d]/g, '');

    // Check for repeated digits (likely invalid)
    if (/(\d)\1{5,}/.test(cleanValue)) {
      errors.push('Phone number contains too many repeated digits');
    }

    // Check for sequential digits (likely invalid)
    if (/(012|123|234|345|456|567|678|789)/.test(cleanValue)) {
      errors.push('Phone number contains sequential digits');
    }

    return errors;
  }

  // Custom message validation
  async validateMessageCustom(value) {
    const errors = [];

    // Check for excessive emojis
    const emojiCount = (value.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    if (emojiCount > 10) {
      errors.push('Message contains too many emojis');
    }

    // Check for excessive line breaks
    const lineBreakCount = (value.match(/\n/g) || []).length;
    if (lineBreakCount > 5) {
      errors.push('Message contains too many line breaks');
    }

    return errors;
  }

  // Custom email validation
  async validateEmailCustom(value) {
    const errors = [];

    // Check for disposable email domains
    const disposableDomains = [
      'tempmail.org', '10minutemail.com', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'throwaway.email'
    ];

    const domain = value.split('@')[1];
    if (disposableDomains.includes(domain)) {
      errors.push('Please use a valid email address');
    }

    return errors;
  }

  // Real-time validation
  validateFieldRealTime(fieldName, value) {
    return this.validateField(fieldName, value);
  }

  // Add custom validation rule
  addValidationRule(fieldName, rule) {
    this.validationRules[fieldName] = {
      ...this.validationRules[fieldName],
      ...rule
    };
  }

  // Add custom error message
  addErrorMessage(key, message) {
    this.errorMessages[key] = message;
  }

  // Load custom rules from storage
  async loadCustomRules() {
    try {
      const customRules = localStorage.getItem('customValidationRules');
      if (customRules) {
        const rules = JSON.parse(customRules);
        Object.assign(this.validationRules, rules);
      }
    } catch (error) {
      console.error('Failed to load custom validation rules:', error);
    }
  }

  // Save custom rules to storage
  async saveCustomRules() {
    try {
      localStorage.setItem('customValidationRules', JSON.stringify(this.validationRules));
    } catch (error) {
      console.error('Failed to save custom validation rules:', error);
    }
  }

  // Get validation statistics
  getValidationStats() {
    return {
      totalRules: Object.keys(this.validationRules).length,
      totalErrorMessages: Object.keys(this.errorMessages).length,
      supportedFields: Object.keys(this.validationRules)
    };
  }

  // Clear all validation data
  clearValidationData() {
    this.validationRules = {};
    this.errorMessages = {};
    localStorage.removeItem('customValidationRules');
  }
} 