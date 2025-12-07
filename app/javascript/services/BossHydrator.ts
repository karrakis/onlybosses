interface Boss {
    keywords: string[];
    level: number;
    life: number;
    mana: number;
    endurance: number;
    damage: number;
    actions: string[];
}

interface KeywordModifier {
    lifeMultiplier?: number;
    manaMultiplier?: number;
    enduranceMultiplier?: number;
    damageMultiplier?: number;
    actions?: string[];
}

const KEYWORD_MODIFIERS: Record<string, KeywordModifier> = {
    fire: {
        damageMultiplier: 1.3,
        manaMultiplier: 1.2,
        actions: ['fireball', 'flame_strike'],
    },
    ice: {
        enduranceMultiplier: 1.2,
        manaMultiplier: 1.1,
        actions: ['ice_lance', 'frost_armor'],
    },
    tank: {
        lifeMultiplier: 1.5,
        enduranceMultiplier: 1.4,
        actions: ['shield_bash', 'taunt'],
    },
    berserker: {
        damageMultiplier: 1.4,
        lifeMultiplier: 0.8,
        actions: ['rage', 'whirlwind'],
    },
};

const BASE_STATS = {
    life: 100,
    mana: 50,
    endurance: 50,
    damage: 10,
};

export function hydrateBoss(keywords: string[], level: number): Boss {
    let life = BASE_STATS.life * level;
    let mana = BASE_STATS.mana * level;
    let endurance = BASE_STATS.endurance * level;
    let damage = BASE_STATS.damage * level;
    const actions: string[] = ['basic_attack'];

    keywords.forEach((keyword) => {
        const modifier = KEYWORD_MODIFIERS[keyword.toLowerCase()];
        if (modifier) {
            life *= modifier.lifeMultiplier ?? 1;
            mana *= modifier.manaMultiplier ?? 1;
            endurance *= modifier.enduranceMultiplier ?? 1;
            damage *= modifier.damageMultiplier ?? 1;
            if (modifier.actions) {
                actions.push(...modifier.actions);
            }
        }
    });

    return {
        keywords,
        level,
        life: Math.round(life),
        mana: Math.round(mana),
        endurance: Math.round(endurance),
        damage: Math.round(damage),
        actions,
    };
}