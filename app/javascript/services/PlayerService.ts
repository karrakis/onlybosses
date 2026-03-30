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
    
    async addKeyword(keyword: string): Promise<Player> {
        const response = await fetch('/add_keyword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyword }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to add keyword');
        }
        
        return response.json();
    },
    
    async resetPlayer(): Promise<Player> {
        const response = await fetch('/reset_player', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to reset player');
        }
        
        return response.json();
    }
};
