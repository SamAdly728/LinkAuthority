
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from './mockDatabase';
import { Transaction } from '../types';

/**
 * SEO Verification Service
 * 
 * In a backend Node.js context, this function fetches the HTML of the provider's
 * site and checks for a valid, dofollow backlink pointing to the recipient.
 */
export const verifyBacklink = async (sourceUrl: string, targetDomain: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!sourceUrl.startsWith('http')) return { success: false, error: 'Invalid URL format' };

    // Simulation of the following backend logic:
    // const { data } = await axios.get(sourceUrl);
    // const $ = cheerio.load(data);
    // const link = $(`a[href*="${targetDomain}"]`);
    // const rel = link.attr('rel') || '';
    // if (link.length > 0 && !rel.includes('nofollow')) { return { success: true }; }

    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Simulate verification success (85% probability)
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
 * Therefore, points are calculated directly as the DA of the source site.
 * 
 * - User A (Provider, DA 40) gives a link to User B.
 * - User A earns 40 points (compensating for their authority).
 * - User B pays 40 points (buying the 40 DA authority).
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
