
export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

export interface Website {
  id: string;
  ownerId: string;
  domain: string;
  domainAuthority: number;
  description: string;
  category: string;
}

export interface Transaction {
  id: string;
  sourceWebsiteId: string; // Where the link is placed
  targetWebsiteId: string; // The link itself
  recipientUserId: string; // Who gets the link
  providerUserId: string;  // Who provides the link
  sourceUrl: string;       // Exact URL where link lives
  pointsTransferred: number;
  status: 'pending' | 'verified' | 'failed';
  timestamp: Date;
}

export interface SEOAnalysis {
  domain: string;
  suggestedDA: number;
  niche: string;
  qualityScore: number;
}
