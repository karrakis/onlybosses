export interface Player {
    name: string;
    keywords: string[];
    bosses_defeated: number;
    turns_since_mana_cost?: number;
    turns_since_stamina_cost?: number;
    max_life: number;
    max_stamina: number;
    max_mana: number;
    life: number;
    stamina: number;
    mana: number;
    damage: number;
    actions: string[];
}

export const PlayerService = {
    async getPlayer(): Promise<Player> {
        const response = await fetch('/get_player', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to get player');
        }
        
        return response.json();
    },
    
    async addKeyword(keyword: string, depth?: number): Promise<Player> {
        const response = await fetch('/add_keyword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, depth }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add keyword');
        }
        
        return response.json();
    },

    async removeKeyword(keyword: string, depth?: number): Promise<Player> {
        const response = await fetch('/remove_keyword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword, depth }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove keyword');
        }

        return response.json();
    },
    
    async recordSnapshot(depth: number): Promise<void> {
        await fetch('/record_snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ depth }),
        });
    },

    async resetPlayer(outcome?: string): Promise<Player> {
        const response = await fetch('/reset_player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ outcome }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to reset player');
        }
        
        return response.json();
    }
};
