export const performAttack = (player, boss, setPlayerLife, setPlayerMana, setPlayerStamina, setBossLife, setBossMana, setBossStamina) => {
    // Calculate damage based on player's attack power
    const playerDamage = Math.max(0, player.attack - boss.defense);
    const newBossLife = Math.max(0, boss.life - playerDamage);
    
    // Calculate stamina cost for attack
    const staminaCost = 10;
    const newPlayerStamina = Math.max(0, player.stamina - staminaCost);
    
    // Boss counter-attack if still alive
    let newPlayerLife = player.life;
    if (newBossLife > 0) {
        const bossDamage = Math.max(0, boss.attack - player.defense);
        newPlayerLife = Math.max(0, player.life - bossDamage);
    }
    
    // Update states
    setBossLife(newBossLife);
    setPlayerStamina(newPlayerStamina);
    setPlayerLife(newPlayerLife);
    
    return {
        playerDamage,
        bossDamage: newBossLife > 0 ? Math.max(0, boss.attack - player.defense) : 0,
        playerLife: newPlayerLife,
        playerStamina: newPlayerStamina,
        bossLife: newBossLife
    };
};