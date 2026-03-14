// Descriptions for passive abilities shown in tooltips
export const passiveDescriptions: Record<string, string> = {
    ethereal: "Your life is set to 0. You use mana as your life resource and will die if your mana reaches 0.",
    // Add more passive descriptions as needed
};

export const getPassiveDescription = (passiveName: string): string => {
    return passiveDescriptions[passiveName.toLowerCase()] || "No description available.";
};
