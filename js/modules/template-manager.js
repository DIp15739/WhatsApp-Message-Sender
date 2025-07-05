export class TemplateManager {
  constructor() {
    this.templates = [];
    this.categories = ['greeting', 'business', 'courtesy', 'inquiry', 'celebration', 'custom'];
  }

  async init() {
    await this.loadTemplates();
    
    // Initialize with default templates if none exist
    if (this.templates.length === 0) {
      await this.initializeDefaultTemplates();
    }
  }

  async initializeDefaultTemplates() {
    const defaultTemplates = [
      {
        id: 'greeting-1',
        name: 'Casual Greeting',
        content: 'Hi! How are you doing today? 😊',
        category: 'greeting',
        tags: ['hello', 'casual'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'business-1',
        name: 'Meeting Reminder',
        content: 'Hi! Just a friendly reminder about our meeting tomorrow at 10 AM. Looking forward to it!',
        category: 'business',
        tags: ['meeting', 'reminder'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'business-2',
        name: 'Follow Up',
        content: 'Hi! I wanted to follow up on our recent conversation. Do you have a moment to chat?',
        category: 'business',
        tags: ['follow-up', 'professional'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'courtesy-1',
        name: 'Thank You',
        content: 'Thank you for your time! Have a wonderful day ahead. 🙏',
        category: 'courtesy',
        tags: ['thanks', 'gratitude'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'inquiry-1',
        name: 'Quick Question',
        content: 'Hi! I have a quick question for you. Do you have a moment?',
        category: 'inquiry',
        tags: ['question', 'quick'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'celebration-1',
        name: 'Happy Birthday',
        content: '🎉 Happy Birthday! 🎂 Wishing you a wonderful day filled with joy and laughter!',
        category: 'celebration',
        tags: ['birthday', 'celebration'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'celebration-2',
        name: 'Congratulations',
        content: '🎉 Congratulations! 🎊 Well done on your achievement!',
        category: 'celebration',
        tags: ['congrats', 'achievement'],
        usageCount: 0,
        createdAt: new Date().toISOString()
      }
    ];

    for (const template of defaultTemplates) {
      await this.addTemplate(template);
    }
  }

  async loadTemplates() {
    const data = localStorage.getItem('templates');
    this.templates = data ? JSON.parse(data) : [];
  }

  async addTemplate(template) {
    const newTemplate = {
      id: template.id || `template-${Date.now()}`,
      name: template.name,
      content: template.content,
      category: template.category || 'custom',
      tags: template.tags || [],
      usageCount: template.usageCount || 0,
      createdAt: template.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    await this.saveTemplates();
    return newTemplate;
  }

  async updateTemplate(id, updates) {
    const templateIndex = this.templates.findIndex(t => t.id === id);
    if (templateIndex === -1) return null;

    this.templates[templateIndex] = {
      ...this.templates[templateIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await this.saveTemplates();
    return this.templates[templateIndex];
  }

  async deleteTemplate(id) {
    const templateIndex = this.templates.findIndex(t => t.id === id);
    if (templateIndex === -1) return false;

    this.templates.splice(templateIndex, 1);
    await this.saveTemplates();
    return true;
  }

  async saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(this.templates));
  }

  async getTemplates(filters = {}) {
    let filteredTemplates = [...this.templates];

    // Filter by category
    if (filters.category) {
      filteredTemplates = filteredTemplates.filter(t => t.category === filters.category);
    }

    // Filter by search query
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredTemplates = filteredTemplates.filter(t => 
        filters.tags.some(tag => t.tags.includes(tag))
      );
    }

    // Sort by usage count (most used first) or by name
    if (filters.sortBy === 'usage') {
      filteredTemplates.sort((a, b) => b.usageCount - a.usageCount);
    } else {
      filteredTemplates.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filteredTemplates;
  }

  async getTemplateById(id) {
    return this.templates.find(t => t.id === id);
  }

  async getTemplatesByCategory(category) {
    return this.templates.filter(t => t.category === category);
  }

  async searchTemplates(query) {
    const searchLower = query.toLowerCase();
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.content.toLowerCase().includes(searchLower) ||
      t.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  async useTemplate(id) {
    const template = await this.getTemplateById(id);
    if (!template) return null;

    template.usageCount++;
    template.lastUsed = new Date().toISOString();
    await this.saveTemplates();

    return template;
  }

  async getPopularTemplates(limit = 5) {
    return this.templates
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  async getRecentTemplates(limit = 5) {
    return this.templates
      .filter(t => t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, limit);
  }

  async getCategories() {
    return this.categories;
  }

  async getTemplateStats() {
    const total = this.templates.length;
    const byCategory = {};
    let totalUsage = 0;

    this.categories.forEach(category => {
      const categoryTemplates = this.templates.filter(t => t.category === category);
      byCategory[category] = {
        count: categoryTemplates.length,
        usage: categoryTemplates.reduce((sum, t) => sum + t.usageCount, 0)
      };
      totalUsage += byCategory[category].usage;
    });

    return {
      total,
      totalUsage,
      byCategory
    };
  }

  // Template validation
  validateTemplate(template) {
    const errors = [];

    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.content || template.content.trim().length === 0) {
      errors.push('Template content is required');
    }

    if (template.content && template.content.length > 1000) {
      errors.push('Template content is too long (max 1000 characters)');
    }

    if (template.name && template.name.length > 100) {
      errors.push('Template name is too long (max 100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Export/Import functionality
  async exportTemplates() {
    return JSON.stringify(this.templates, null, 2);
  }

  async importTemplates(jsonData) {
    try {
      const importedTemplates = JSON.parse(jsonData);
      
      if (!Array.isArray(importedTemplates)) {
        throw new Error('Invalid template data format');
      }

      // Validate each template
      for (const template of importedTemplates) {
        const validation = this.validateTemplate(template);
        if (!validation.isValid) {
          throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
        }
      }

      // Add imported templates
      for (const template of importedTemplates) {
        await this.addTemplate(template);
      }

      return importedTemplates.length;
    } catch (error) {
      throw new Error(`Failed to import templates: ${error.message}`);
    }
  }
} 