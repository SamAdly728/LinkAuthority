import { db } from './mockDatabase.ts';
import { Transaction } from '../types.ts';

/**
 * Verification Logic (The "Backend" Simulation)
 * In a real Node environment, this uses axios and cheerio.
 */
export const verifyBacklink = async (sourceUrl: string, targetDomain: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // 1. Visit Source URL (Simulated)
    // const { data } = await axios.get(sourceUrl);
    // const $ = cheerio.load(data);
    
    // 2. Search for Target Domain
    // const link = $('a').filter((i, el) => $(el).attr('href').includes(targetDomain));
    
    // 3. Validate rel="nofollow"
    // if (link.attr('rel')?.includes('nofollow')) return { success: false, error: 'Link is nofollow' };
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    const success = Math.random() > 0.1; // 90% success for demo
    
    return success ? { success: true } : { success: false, error: 'No dofollow link found on host page.' };
  } catch (err) {
    return { success: false, error: 'Source URL unreachable.' };
  }
};

/**
 * Exchange Logic Function
 * 
 * Calculation Handled:
 * - Provider (User A) hosts a link on their site (DA 40).
 * - User A earns 40 points (The DA value of the source site).
 * - Recipient (User B) loses 40 points.
 */
export const executeExchange = (
  providerId: string,
  recipientId: string,
  daScore: number,
  tx: Transaction
) => {
  // Transfer Logic
  db.updateUserPoints(providerId, daScore);
  db.updateUserPoints(recipientId, -daScore);
  
  // Record Transaction
  tx.status = 'verified';
  tx.pointsTransferred = daScore;
  db.addTransaction(tx);
};