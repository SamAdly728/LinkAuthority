/**
 * LinkAuthority - Mongoose Schemas (Conceptual Reference)
 * 
 * Logic Note: 
 * - Points field is critical for the "Authority Economy".
 * - Websites are linked to Users via ownerId.
 */

/* 
import mongoose from 'mongoose';

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  points: { type: Number, default: 100 }, // Starting bonus
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});

// Website Schema
const WebsiteSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  domain: { type: String, required: true, unique: true },
  domainAuthority: { type: Number, required: true },
  description: String,
  category: String,
  isPublic: { type: Boolean, default: true }
});

// Transaction Schema
const TransactionSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sourceWebsite: { type: mongoose.Schema.Types.ObjectId, ref: 'Website' },
  targetWebsite: { type: mongoose.Schema.Types.ObjectId, ref: 'Website' },
  points: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'verified', 'failed'], default: 'pending' },
  timestamp: { type: Date, default: Date.now }
});

export const UserModel = mongoose.model('User', UserSchema);
export const WebsiteModel = mongoose.model('Website', WebsiteSchema);
export const TransactionModel = mongoose.model('Transaction', TransactionSchema);
*/
