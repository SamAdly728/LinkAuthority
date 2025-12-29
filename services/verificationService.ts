import { db } from './mockDatabase';
import { Transaction } from '../types';

/**
 * SEO Verification Service
 * 
 * Note: Real backend verification would use axios and cheerio to fetch 
 * and parse the DOM. In this frontend demo, we simulate this process.
 */
export const verifyBacklink = async (sourceUrl: string, targetDomain: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!sourceUrl.startsWith('http')) return { success: false, error: 'Invalid URL format' };

    // Simulating network delay for site crawling
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Simulate verification logic:
    // 1. Fetching URL
    // 2. Finding <a> tag with targetDomain
    // 3. Checking for rel="nofollow"
    
    // Random outcome for demo purposes (85% success rate)
    const success = Math.random() > 0.15; 
    return success ? { success: true } : { success: false, error: 'Target backlink not found or marked as nofollow.' };
  } catch (err) {
    return { success: false, error: 'Host unreachable. Verification aborted.' };
  }
};

/**
 * Dynamic Exchange Logic (DA-to-Points)
 * 
 * Logic Rationale:
 * High Domain Authority (DA) sites are more valuable for SEO. 
 * Points are calculated directly as the DA of the source site.
 * 
 * - Provider (Site with DA 40) gives a link.
 * - Provider earns 40 points.
 * - Recipient pays 40 points.
 */
export const executeExchange = (
  providerId: string, 
  recipientId: string, 
  sourceWebsiteDA: number,
  transaction: Transaction
) => {
  const pointValue = sourceWebsiteDA;

  // 1. Recipient points deduction
  db.updateUserPoints(recipientId, -pointValue);
  
  // 2. Provider points award
  db.updateUserPoints(providerId, pointValue);

  // 3. Mark transaction as verified and record
  transaction.status = 'verified';
  transaction.pointsTransferred = pointValue;
  db.addTransaction(transaction);
};