export class ContactManager {
  constructor() {
    this.contacts = [];
  }

  async init() {
    await this.loadContacts();
  }

  async loadContacts() {
    const data = localStorage.getItem('contacts');
    this.contacts = data ? JSON.parse(data) : [];
  }

  async addContact(contact) {
    this.contacts.push(contact);
    await this.saveContacts();
  }

  async saveContacts() {
    localStorage.setItem('contacts', JSON.stringify(this.contacts));
  }

  async getContacts() {
    return this.contacts;
  }

  async importContacts(json) {
    this.contacts = [...this.contacts, ...JSON.parse(json)];
    await this.saveContacts();
  }

  async exportContacts() {
    return JSON.stringify(this.contacts);
  }

  async groupContacts(groupName, contactIds) {
    // Simple grouping by adding a group property
    this.contacts = this.contacts.map(c =>
      contactIds.includes(c.phoneNumber) ? { ...c, group: groupName } : c
    );
    await this.saveContacts();
  }

  async searchContacts(query) {
    return this.contacts.filter(c =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phoneNumber.includes(query)
    );
  }
} 