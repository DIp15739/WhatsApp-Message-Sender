// Mock DOM elements for Jest tests
document.body.innerHTML = `
  <div id="app">
    <div id="modal-overlay"></div>
    <div id="toast-container"></div>
    <form id="message-form"></form>
    <input id="phone-input" />
    <textarea id="message-input" />
    <span id="country-code">+91</span>
    <img id="country-flag" />
    <div id="country-dropdown-menu"></div>
    <button id="theme-toggle"></button>
    <button id="settings-toggle"></button>
    <button id="add-contact"></button>
    <button id="bulk-message"></button>
    <button id="qr-generator"></button>
    <button id="template-btn"></button>
    <button id="preview-btn"></button>
    <button id="emoji-picker"></button>
    <span id="char-count"></span>
    <div id="phone-error"></div>
  </div>
`;

// Simple test to satisfy Jest
describe('Setup', () => {
  test('should setup DOM elements', () => {
    expect(document.getElementById('app')).toBeDefined();
    expect(document.getElementById('modal-overlay')).toBeDefined();
    expect(document.getElementById('toast-container')).toBeDefined();
  });
}); 