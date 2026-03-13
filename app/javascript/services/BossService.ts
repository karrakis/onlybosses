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
  life?: number;
  stamina?: number;
  mana?: number;
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
    
    const boss = await response.json();
    
    // Add computed life/stamina/mana fields to boss object
    const bossWithStats = {
      ...boss,
      life: Math.ceil(boss.stats.base_stats.life),
      stamina: Math.ceil(boss.stats.base_stats.stamina),
      mana: Math.ceil(boss.stats.base_stats.mana)
    };
    
    // Save boss to backend session
    await this.saveBossToSession(bossWithStats);
    
    return bossWithStats;
  },
  
  // Save boss to backend session
  async saveBossToSession(boss: Boss): Promise<void> {
    const response = await fetch('/set_boss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        boss: {
          ...boss,
          life: Math.ceil(boss.stats.base_stats.life),
          stamina: Math.ceil(boss.stats.base_stats.stamina),
          mana: Math.ceil(boss.stats.base_stats.mana)
        }
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save boss to session');
    }
  },
  
  // Get a specific boss
  async getBoss(id: number): Promise<Boss> {
    const response = await fetch(`${API_BASE}/bosses/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch boss');
    }
    
    const boss = await response.json();
    
    // Add computed life/stamina/mana fields if they're not already present
    return {
      ...boss,
      life: boss.life !== undefined ? boss.life : Math.ceil(boss.stats.base_stats.life),
      stamina: boss.stamina !== undefined ? boss.stamina : Math.ceil(boss.stats.base_stats.stamina),
      mana: boss.mana !== undefined ? boss.mana : Math.ceil(boss.stats.base_stats.mana)
    };
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
