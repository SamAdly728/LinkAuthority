
import { User, Website, Transaction } from '../types';

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Alex SEO', email: 'alex@example.com', points: 150 },
  { id: 'u2', name: 'Dev Solutions', email: 'dev@example.com', points: 80 },
  { id: 'u3', name: 'Marketing Pro', email: 'pro@example.com', points: 12 },
];

const INITIAL_WEBSITES: Website[] = [
  { id: 'w1', ownerId: 'u1', domain: 'techcrunch.com', domainAuthority: 92, description: 'Tech News and Analysis', category: 'Technology' },
  { id: 'w2', ownerId: 'u2', domain: 'mydevblog.io', domainAuthority: 35, description: 'Personal coding tutorials', category: 'Education' },
  { id: 'w3', ownerId: 'u3', domain: 'healthyliving.net', domainAuthority: 25, description: 'Lifestyle and nutrition tips', category: 'Health' },
];

class MockDB {
  private users: User[] = [];
  private websites: Website[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem('linkauthority_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.users = parsed.users;
      this.websites = parsed.websites;
      this.transactions = parsed.transactions;
    } else {
      this.users = INITIAL_USERS;
      this.websites = INITIAL_WEBSITES;
      this.save();
    }
  }

  private save() {
    localStorage.setItem('linkauthority_db', JSON.stringify({
      users: this.users,
      websites: this.websites,
      transactions: this.transactions
    }));
  }

  getUsers() { return this.users; }
  getWebsites() { return this.websites; }
  getTransactions() { return this.transactions; }

  findOrCreateUser(name: string, email: string, avatar?: string): User {
    let user = this.users.find(u => u.email === email);
    if (!user) {
      user = {
        id: `u${Date.now()}`,
        name,
        email,
        points: 100, // New user bonus
        avatar
      };
      this.users.push(user);
      this.save();
    }
    return user;
  }

  updateUserPoints(userId: string, delta: number) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.points += delta;
      this.save();
    }
  }

  addTransaction(tx: Transaction) {
    this.transactions.unshift(tx);
    this.save();
  }

  addWebsite(web: Website) {
    this.websites.push(web);
    this.save();
  }
}

export const db = new MockDB();
