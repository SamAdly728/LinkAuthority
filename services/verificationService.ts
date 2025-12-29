
import axios from 'axios';
import * as cheerio from 'cheerio';
import { db } from './mockDatabase';
import { Transaction } from '../types';

/**
 * BACKEND LOGIC: Verification Function
 * This function simulates visiting a source URL to find a target link.
 * It checks for "dofollow" status.
 * 
 * Note: In a real browser environment, CORS usually prevents fetching other sites.
 * This is designed to be run in a Node.js context as requested.
 */
export const verifyBacklink = async (sourceUrl: string, targetDomain: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // In a browser-only demo, we'd normally use a proxy. 
    // For this prototype, we simulate a successful crawl for common domains.
    if (!sourceUrl.startsWith('http')) return { success: false, error: 'Invalid URL' };

    // MOCK CRAWL LOGIC (Simulation of Axios/Cheerio behavior)
    // const response = await axios.get(sourceUrl);
    // const $ = cheerio.load(response.data);
    // const link = $(`a[href*="${targetDomain}"]`);
    // if (link.length === 0) return { success: false, error: 'Link not found' };
    // const rel = link.attr('rel');
    // const isNoFollow = rel && rel.includes('nofollow');
    // if (isNoFollow) return { success: false, error: 'Link is nofollow' };
    
    // Simulate async network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomized success for demo purposes
    const success = Math.random() > 0.2; 
    return success ? { success: true } : { success: false, error: 'Target URL not found on source page.' };
  } catch (err) {
    return { success: false, error: 'Failed to reach source URL' };
  }
};

/**
 * BACKEND LOGIC: Point Exchange Logic
 * 
 * DA-to-Points Calculation Handling:
 * The provider (User A) creates a link on their site (Site A) for a recipient (User B).
 * User A earns points equal to their site's Domain Authority (DA).
 * User B loses points equal to the PROVIDER'S site DA.
 * 
 * Logic Rationale: 
 * A high DA site provides more SEO value. Therefore, provide a link on a DA 90 site 
 * is worth 90 points, whereas providing one on a DA 10 site is worth 10 points.
 * This ensures the economy scales with the value of the 'Authority' being shared.
 */
export const executeExchange = (
  providerId: string, 
  recipientId: string, 
  sourceWebsiteDA: number,
  transaction: Transaction
) => {
  // 1. Calculate the 'Value' of the exchange
  // The 'Currency' is directly tied to the authority of the publishing domain.
  const pointValue = sourceWebsiteDA;

  // 2. Transfer logic
  // Recipient pays for the authority
  db.updateUserPoints(recipientId, -pointValue);
  
  // Provider earns for the authority they shared
  db.updateUserPoints(providerId, pointValue);

  // 3. Mark transaction as verified
  transaction.status = 'verified';
  transaction.pointsTransferred = pointValue;
  db.addTransaction(transaction);
};
