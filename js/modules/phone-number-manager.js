import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, AsYouType, isValidPhoneNumber } from 'libphonenumber-js';

export class PhoneNumberManager {
  constructor() {
    this.countries = [];
    this.countryData = {};
    this.selectedCountry = 'IN';
    this.countryDropdown = document.getElementById('country-dropdown-menu');
    this.countryCodeSpan = document.getElementById('country-code');
    this.countryFlagImg = document.getElementById('country-flag');
    this.phoneInput = document.getElementById('phone-input');
    this.phoneError = document.getElementById('phone-error');
    this.searchInput = null;
    this.init = this.init.bind(this);
  }

  async init() {
    await this.loadCountries();
    await this.autoDetectCountry();
    this.renderCountryDropdown();
    this.setupDropdownEvents();
    this.updateCountryUI(this.selectedCountry);
    this.setupPasteHandler();
    this.setupInputHandler();
  }

  async loadCountries() {
    this.countries = getCountries();
    this.countryData = this.countries.reduce((acc, code) => {
      acc[code] = {
        code,
        name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code),
        callingCode: '+' + getCountryCallingCode(code),
        flag: `https://flagcdn.com/24x18/${code.toLowerCase()}.png`,
      };
      return acc;
    }, {});
    // Add custom option
    this.countryData['CUSTOM'] = {
      code: 'CUSTOM',
      name: 'Custom',
      callingCode: '+',
      flag: 'https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg',
    };
  }

  async autoDetectCountry() {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data && data.country_code && this.countries.includes(data.country_code)) {
        this.selectedCountry = data.country_code;
      }
    } catch (e) {
      this.selectedCountry = 'IN';
    }
  }

  renderCountryDropdown() {
    if (!this.countryDropdown) return;
    this.countryDropdown.innerHTML = '';
    // Add search input
    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search country or code...';
    this.searchInput.className = 'form__input';
    this.searchInput.style.margin = '0.5rem';
    this.countryDropdown.appendChild(this.searchInput);
    this.searchInput.addEventListener('input', () => this.filterDropdown());
    // Add country options
    this.filteredCountries = [...this.countries, 'CUSTOM'];
    this.renderCountryOptions(this.filteredCountries);
  }

  renderCountryOptions(list) {
    // Remove old options
    Array.from(this.countryDropdown.querySelectorAll('.country-option')).forEach(el => el.remove());
    list.forEach(code => {
      const country = this.countryData[code];
      const div = document.createElement('div');
      div.className = 'country-option';
      div.innerHTML = `
        <img src="${country.flag}" class="country-option__flag" alt="${country.name}" />
        <span class="country-option__name">${country.name}</span>
        <span class="country-option__code">${country.callingCode}</span>
      `;
      div.addEventListener('click', () => {
        this.selectedCountry = code;
        this.updateCountryUI(code);
        this.countryDropdown.hidden = true;
        if (code === 'CUSTOM') {
          this.promptCustomCode();
        }
      });
      this.countryDropdown.appendChild(div);
    });
  }

  filterDropdown() {
    const q = this.searchInput.value.toLowerCase();
    this.filteredCountries = [...this.countries, 'CUSTOM'].filter(code => {
      const c = this.countryData[code];
      return (
        c.name.toLowerCase().includes(q) ||
        c.callingCode.includes(q) ||
        code === 'CUSTOM' && 'custom'.includes(q)
      );
    });
    this.renderCountryOptions(this.filteredCountries);
  }

  setupDropdownEvents() {
    const dropdownBtn = document.getElementById('country-dropdown');
    if (dropdownBtn) {
      dropdownBtn.addEventListener('click', () => {
        this.countryDropdown.hidden = !this.countryDropdown.hidden;
        if (!this.countryDropdown.hidden && this.searchInput) {
          this.searchInput.value = '';
          this.filterDropdown();
          this.searchInput.focus();
        }
      });
    }
    document.addEventListener('click', (e) => {
      if (!this.countryDropdown.contains(e.target) && e.target.id !== 'country-dropdown') {
        this.countryDropdown.hidden = true;
      }
    });
  }

  updateCountryUI(code) {
    const country = this.countryData[code];
    if (this.countryCodeSpan) this.countryCodeSpan.textContent = country.callingCode;
    if (this.countryFlagImg) this.countryFlagImg.src = country.flag;
    if (this.phoneInput) this.phoneInput.placeholder = `e.g. ${this.exampleNumber(code)}`;
  }

  exampleNumber(code) {
    try {
      const example = new AsYouType(code).input('1234567890');
      return example;
    } catch {
      return '';
    }
  }

  formatPhoneNumber(number, countryCode) {
    try {
      const code = countryCode.replace('+', '');
      const country = Object.values(this.countryData).find(c => c.callingCode.replace('+', '') === code);
      if (!country) return number;
      const phone = parsePhoneNumberFromString(number, country.code);
      return phone ? phone.number : number;
    } catch {
      return number;
    }
  }

  setupPasteHandler() {
    if (!this.phoneInput) return;
    this.phoneInput.addEventListener('paste', (e) => {
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      const match = pasted.match(/^(\+\d{1,4})?\s*([\d\s-]+)/);
      if (match) {
        const code = match[1] ? match[1].replace('+', '') : null;
        const number = match[2].replace(/\D/g, '');
        if (code) {
          // Try to auto-select country
          const found = Object.values(this.countryData).find(c => c.callingCode.replace('+', '') === code);
          if (found) {
            this.selectedCountry = found.code;
            this.updateCountryUI(found.code);
          } else {
            this.selectedCountry = 'CUSTOM';
            this.updateCountryUI('CUSTOM');
            this.promptCustomCode('+' + code);
          }
        }
        setTimeout(() => {
          this.phoneInput.value = number;
        }, 10);
      }
    });
  }

  promptCustomCode(defaultValue = '+') {
    const code = prompt('Enter custom country code (e.g. +999):', defaultValue);
    if (code && this.countryCodeSpan) {
      this.countryCodeSpan.textContent = code;
    }
  }

  setupInputHandler() {
    if (!this.phoneInput) return;
    this.phoneInput.addEventListener('input', (e) => {
      const country = this.selectedCountry;
      const value = e.target.value.replace(/[^\d+]/g, '');
      // Format as you type
      const formatter = new AsYouType(country);
      const formatted = formatter.input(value);
      e.target.value = formatted;
      // Validate
      const isValid = this.validatePhoneNumber(formatted, country);
      if (this.phoneError) {
        if (!isValid && formatted.length > 0) {
          this.phoneError.textContent = 'Invalid phone number for selected country.';
          this.phoneError.hidden = false;
        } else {
          this.phoneError.textContent = '';
          this.phoneError.hidden = true;
        }
      }
    });
  }

  validatePhoneNumber(number, country) {
    try {
      return isValidPhoneNumber(number, country);
    } catch {
      return false;
    }
  }
} 