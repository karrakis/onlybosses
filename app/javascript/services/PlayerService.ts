export interface Player {
    name: string;
    explicit_keywords: string[];
    derived_keywords: string[];
    keywords: string[];           // combined explicit + derived, used by game logic
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
    // Slot tracking
    max_hands: number;            // hand capacity from race keywords (default 2)
    equipped_hands: number;       // hands used by currently held weapons
    max_race_slots: number;       // 1 + chimerism count
    race_count: number;           // number of creature-type keywords held
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
    },

    async skipKeyword(depth?: number): Promise<Player> {
        const response = await fetch('/skip_keyword', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ depth }),
        });
        if (!response.ok) throw new Error('Failed to skip keyword');
        return response.json();
    },

    async swapWeapons(newKeyword: string, oldKeywords: string[], depth?: number): Promise<Player> {
        const response = await fetch('/swap_weapons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_keyword: newKeyword, old_keywords: oldKeywords, depth }),
        });
        if (!response.ok) throw new Error('Failed to swap weapons');
        return response.json();
    },

    async swapRace(newKeyword: string, oldKeyword: string, depth?: number): Promise<Player> {
        const response = await fetch('/swap_race', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ new_keyword: newKeyword, old_keyword: oldKeyword, depth }),
        });
        if (!response.ok) throw new Error('Failed to swap race');
        return response.json();
    }
};
