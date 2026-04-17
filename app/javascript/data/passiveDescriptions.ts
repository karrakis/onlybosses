// Descriptions for passive abilities shown in tooltips
export const passiveDescriptions: Record<string, string> = {
    ethereal: "Empties your life pool — mana becomes your life resource and you die when it reaches 0. 20% mana regen rate. 50% physical resist. Immune to web.",
    armoured: "5% blunt & piercing resist. 10% slashing resist. Absorbs 1 flat damage per hit.",
    fragile: "-10% max life. +20% blunt damage taken.",
    mindshield: "10% magic resist. 5% dark resist.",
    amplify: "+5% all damage dealt.",
    squishy: "+30% piercing damage taken. +20% slashing damage taken.",
    leech: "Heals for 5% of damage dealt.",
    lucky: "+2% all damage dealt. 2% evasion chance.",
    versatile: "+5% max life, stamina, and mana.",
    block: "5% chance to completely block all incoming physical damage per hit. Stacks with diminishing returns.",
    burn: "+15% fire damage dealt.",
    chill: "+15% ice damage dealt.",
    shock: "+15% lightning damage dealt.",
    heartless: "Absorbs 2 flat damage per hit.",
    towering: "+10% max life.",
    nimble: "+10% max stamina. +20% physical damage dealt.",
    regeneration: "Doubles health regeneration rate.",
    revive: "50% chance to revive on death.",
    chimerism: "Allows acquiring one additional creature type.",
    evasion: "8% chance to completely dodge all incoming damage per hit. Stacks with diminishing returns. Light damage cannot be evaded.",
};

export const getPassiveDescription = (passiveName: string): string => {
    return passiveDescriptions[passiveName.toLowerCase()] || "No description available.";
};
