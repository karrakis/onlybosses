// API service for boss management
const API_BASE = '/api';

export interface BossKeyword {
  id: number;
  name: string;
  category: string;
  properties: any;
  rarity: number;
}

export interface Boss {
  id: number;
  name: string;
  keywords: string[];
  stats: any;
  image_status: 'pending' | 'generating' | 'completed' | 'failed';
  image_url: string | null;
  created_at: string;
}

export const BossService = {
  // Generate or retrieve a boss by keywords
  async generateBoss(keywordNames: string[]): Promise<Boss> {
    const response = await fetch(`${API_BASE}/bosses/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword_names: keywordNames })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate boss');
    }
    
    return response.json();
  },
  
  // Get a specific boss
  async getBoss(id: number): Promise<Boss> {
    const response = await fetch(`${API_BASE}/bosses/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch boss');
    }
    
    return response.json();
  },
  
  // Get all bosses
  async getAllBosses(): Promise<Boss[]> {
    const response = await fetch(`${API_BASE}/bosses`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch bosses');
    }
    
    return response.json();
  },
  
  // Get all available keywords
  async getKeywords(): Promise<BossKeyword[]> {
    const response = await fetch(`${API_BASE}/bosses/keywords`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch keywords');
    }
    
    return response.json();
  }
};
