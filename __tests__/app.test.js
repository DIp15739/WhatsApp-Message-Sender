import { WhatsAppApp } from '../js/app.js';

describe('WhatsApp App', () => {
  test('should initialize without errors', async () => {
    const app = new WhatsAppApp();
    // Wait a bit for async initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(app).toBeDefined();
  });

  test('should have all required modules', () => {
    const app = new WhatsAppApp();
    expect(app.modules).toBeDefined();
    expect(app.modules.phoneManager).toBeDefined();
    expect(app.modules.messageManager).toBeDefined();
    expect(app.modules.themeManager).toBeDefined();
  });
}); 