import { User, Website, Transaction } from '../types.ts';

const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'SEO Ninja', email: 'ninja@links.io', points: 150 },
  { id: 'u2', name: 'Startup Growth', email: 'growth@startup.co', points: 45 },
  { id: 'u3', name: 'Tech Blog Pro', email: 'pro@tech.net', points: 0 }, // Hidden by default (<1 pt)
];

const INITIAL_WEBSITES: Website[] = [
  { id: 'w1', ownerId: 'u1', domain: 'forbes.com', domainAuthority: 95, description: 'Global business and finance news.', category: 'Business' },
  { id: 'w2', ownerId: 'u2', domain: 'indiehackers.com', domainAuthority: 72, description: 'Community of profitable side projects.', category: 'Tech' },
  { id: 'w3', ownerId: 'u3', domain: 'my-tiny-blog.me', domainAuthority: 12, description: 'Personal coding journey.', category: 'Education' },
];

class MockDB {
  private users: User[] = [];
  private websites: Website[] = [];
  private transactions: Transaction[] = [];

  constructor() {
    this.load();
  }

  private load() {
    const saved = localStorage.getItem('linkauthority_v2');
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
    localStorage.setItem('linkauthority_v2', JSON.stringify({
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
      user = { id: `u${Date.now()}`, name, email, points: 50, avatar };
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

  addWebsite(web: Website) {
    this.websites.push(web);
    this.save();
  }

  addTransaction(tx: Transaction) {
    this.transactions.unshift(tx);
    this.save();
  }
}

export const db = new MockDB();