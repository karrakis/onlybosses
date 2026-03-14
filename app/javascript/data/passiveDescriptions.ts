// Descriptions for passive abilities shown in tooltips
export const passiveDescriptions: Record<string, string> = {
    ethereal: "Your life is set to 0. You use mana as your life resource and will die if your mana reaches 0.",
    armoured: "Reduces physical, blunt, piercing, and slashing damage taken by 20%.",
    fragile: "Reduces max life by 10%. Increases blunt damage taken by 20%.",
    mindshield: "Reduces magic damage taken by 50% and dark damage taken by 30%.",
    amplify: "Increases all damage dealt by 3%.",
    squishy: "Increases piercing damage taken by 30% and slashing damage taken by 20%.",
    leech: "Heals you for 20% of damage dealt to your life resource.",
    lucky: "Increases all damage dealt by 2%.",
    versatile: "Increases max life, stamina, and mana by 5%.",
    block: "Reduces physical damage taken by 10%.",
    burn: "Increases fire damage dealt by 3%.",
    chill: "Increases ice damage dealt by 3%.",
    shock: "Increases lightning damage dealt by 3%.",
    heartless: "Reduces physical damage taken by 10%.",
    towering: "Increases max life by 10%.",
    nimble: "Increases max stamina by 10% and physical damage dealt by 2%.",
    // Add more passive descriptions as needed
};

export const getPassiveDescription = (passiveName: string): string => {
    return passiveDescriptions[passiveName.toLowerCase()] || "No description available.";
};
