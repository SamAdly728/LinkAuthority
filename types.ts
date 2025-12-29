export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  avatar?: string;
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
  sourceWebsiteId: string; 
  targetWebsiteId: string; 
  recipientUserId: string; 
  providerUserId: string;  
  sourceUrl: string;       
  pointsTransferred: number;
  status: 'pending' | 'verified' | 'failed';
  timestamp: Date;
}

export interface SEOAnalysis {
  da: number;
  niche: string;
  summary: string;
}