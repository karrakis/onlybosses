import React, { useEffect, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import playerImage from '../images/player.png';
import takeAction from '../actions/takeAction';
import ShakeAnimation from './ShakeAnimation';

interface GameProps {
    onExit: () => void;
}

const Game: React.FC<GameProps> = ({onExit}) => {
    const [boss, setBoss] = useState<Boss | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [playerLife, setPlayerLife] = useState<number>(100);
    const [playerStamina, setPlayerStamina] = useState<number>(100);
    const [playerMana, setPlayerMana] = useState<number>(100);

    const [bossLifePercentage, setBossLifePercentage] = useState<number>(100);
    const [bossStaminaPercentage, setBossStaminaPercentage] = useState<number>(100);
    const [bossManaPercentage, setBossManaPercentage] = useState<number>(100);

    const [bossLife, setBossLife] = useState<number>(100);
    const [bossStamina, setBossStamina] = useState<number>(100);
    const [bossMana, setBossMana] = useState<number>(100);
    const [bossShaking, setBossShaking] = useState<boolean>(false);
    const [bossDying, setBossDying] = useState<boolean>(false);
    const [playerShaking, setPlayerShaking] = useState<boolean>(false);
    const [grassHeight, setGrassHeight] = useState<number>(50);

    const [player, setPlayer] = useState<any>({
        name: 'Hero',
        stats: {
            life: 100,
            stamina: 100,
            mana: 100,
            damage: 10,
        },
        actions: ['attack']
    });

    const gameStatus = {
        playerLife,
        playerStamina,
        playerMana,
        bossLife,
        bossStamina,
        bossMana,
        player,
        boss
    }

    useEffect(() => {
        if (boss) {
            // Assuming boss.stats has life, mana, endurance properties
            console.log('Boss stats:', boss.stats);
            const stats = boss.stats;
            const maxLife = stats.base_stats.life || 100;
            const maxMana = stats.base_stats.mana || 100;
            const maxEndurance = stats.base_stats.endurance || 100;

            setBossLifePercentage(maxLife / maxLife * 100);
            setBossManaPercentage(maxMana / maxMana * 100);
            setBossStaminaPercentage(maxEndurance / maxEndurance * 100);

            setBossLife(maxLife);
            setBossMana(maxMana);
            setBossStamina(maxEndurance);
        }
    }, [boss]);

    useEffect(() => {
        // Dynamically calculate grass height based on window width
        const calculateGrassHeight = () => {
            const width = window.innerWidth;
            // Linear interpolation: wider screens = taller grass
            // At 400px: 12% grass, at 2000px: 38% grass
            const minWidth = 400;
            const maxWidth = 2000;
            const minHeight = 12;
            const maxHeight = 38;
            
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, width));
            const heightPercent = minHeight + ((clampedWidth - minWidth) / (maxWidth - minWidth)) * (maxHeight - minHeight);
            
            setGrassHeight(heightPercent);
        };
        
        calculateGrassHeight();
        window.addEventListener('resize', calculateGrassHeight);
        
        return () => window.removeEventListener('resize', calculateGrassHeight);
    }, []);

    useEffect(() => {
        // Load the first boss (skeleton) when component mounts
        const loadBoss = async () => {
            try {
                setLoading(true);
                const generatedBoss = await BossService.generateBoss(['skeleton']);
                setBoss(generatedBoss);
                
                // If image is still generating, poll for updates
                if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
                    pollForImage(generatedBoss.id);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load boss');
            } finally {
                setLoading(false);
            }
        };

        const pollForImage = async (bossId: number) => {
            const interval = setInterval(async () => {
                try {
                    const updatedBoss = await BossService.getBoss(bossId);
                    setBoss(updatedBoss);
                    
                    // Stop polling when image is ready or failed
                    if (updatedBoss.image_status === 'completed' || updatedBoss.image_status === 'failed') {
                        clearInterval(interval);
                    }
                } catch (err) {
                    console.error('Error polling for boss image:', err);
                    clearInterval(interval);
                }
            }, 3000); // Poll every 3 seconds

            // Cleanup interval on unmount
            return () => clearInterval(interval);
        };

        loadBoss();
    }, []);

    const handleAction = async (action: string, actionTaker: string = 'player', target: string = 'boss') => {
        try {
            const response = await takeAction(action, gameStatus, actionTaker, target);
            
            console.log("received response:", response);
            
            // Check if response has the new format with metadata
            const hasMetadata = response.playerAction !== undefined;
            const currentState = hasMetadata ? response.gameState : response;
            const bossAction = hasMetadata ? response.bossAction : null;
            
            // Store the state before boss action for comparison
            const stateAfterPlayer = hasMetadata ? {
                bossLife: currentState.bossLife,
                playerLife: playerLife,
                playerStamina: playerStamina,
                playerMana: playerMana
            } : null;
            
            // Apply player action effects immediately
            if (currentState.bossLife !== undefined) {
                console.log("updating boss life to:", currentState.bossLife);
                if (stateAfterPlayer && currentState.bossLife < bossLife) {
                    setBossShaking(true);
                }
                // Check if boss is defeated
                if (currentState.bossLife <= 0 && !bossDying) {
                    setBossDying(true);
                    setBossShaking(true);
                }
                setBossLife(currentState.bossLife);
                const stats = boss?.stats;
                const maxLife = stats?.base_stats?.life || 100;
                console.log("updating boss life percentage to:", (currentState.bossLife / maxLife) * 100);
                setBossLifePercentage((currentState.bossLife / maxLife) * 100);
            }
            
            // If there's a boss action, apply its effects after a delay
            if (bossAction && stateAfterPlayer) {
                setTimeout(() => {
                    console.log("Applying delayed boss action:", bossAction);
                    
                    // Apply boss action effects
                    if (currentState.playerLife !== undefined) {
                        if (currentState.playerLife < playerLife) {
                            setPlayerShaking(true);
                        }
                        setPlayerLife(currentState.playerLife);
                    }
                    if (currentState.playerStamina !== undefined) {
                        setPlayerStamina(currentState.playerStamina);
                    }
                    if (currentState.playerMana !== undefined) {
                        setPlayerMana(currentState.playerMana);
                    }
                }, 1000); // 1 second delay for boss action
            } else {
                // No boss action (boss defeated or old format), apply state immediately
                if (currentState.playerLife !== undefined) {
                    setPlayerLife(currentState.playerLife);
                }
                if (currentState.playerStamina !== undefined) {
                    setPlayerStamina(currentState.playerStamina);
                }
                if (currentState.playerMana !== undefined) {
                    setPlayerMana(currentState.playerMana);
                }
            }
        } catch (err) {
            console.error('Error taking action:', err);
            setError(err instanceof Error ? err.message : 'Failed to take action');
        }
    };

    return (<div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-white relative">
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={onExit}>Surrender</button>
            <div className="w-3/4 h-3/4 border-4 border-dashed border-gray-400 flex flex-col">
            <div className="h-full flex items-center justify-center relative">
                <div id="game-background" className="absolute inset-0 -z-1 flex flex-col">
                    <div className="w-full flex-1 bg-gradient-to-b from-blue-900 to-orange-500"></div>
                    <div className="w-full bg-gradient-to-t from-green-700 to-green-900 transition-all duration-300" style={{ height: `${grassHeight}%` }}></div>
                </div>
                <div id="game-panels" className="absolute inset-0 w-full h-full flex z-10">
                    <div id="left-panel" className="flex-[2] min-w-0 h-full flex flex-col items-center justify-end p-4">
                        <div className="w-full flex flex-col items-center justify-end">
                            <ShakeAnimation 
                                isShaking={playerShaking} 
                                duration={500} 
                                intensity={10}
                                onComplete={() => setPlayerShaking(false)}
                            >
                                <img 
                                    src={playerImage} 
                                    alt="Player"
                                    className="w-1/2 h-auto object-contain mb-16"
                                />
                            </ShakeAnimation>
                        </div>
                    </div>
                    <div id="center-panel" className="flex-1 min-w-0 h-full flex flex-col items-center justify-center">
                    </div>
                    <div id="right-panel" className="flex-[2] min-w-0 h-full flex flex-col items-center justify-end p-4">
                        {loading && <div className="text-gray-400">Loading boss...</div>}
                        {error && <div className="text-red-400">Error: {error}</div>}
                        {boss && (
                            <div className="w-full flex flex-col items-center justify-end">
                                <div className="text-2xl font-bold mb-4">{boss.name}</div>
                                <div className="mb-4 flex gap-2 w-full">
                                    <div id="boss-life-bar" className="flex-1 h-12 bg-gray-600 border-2 border-gray-400 overflow-hidden relative">
                                        <div className="h-full bg-red-500" style={{width: `${bossLifePercentage}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{bossLife}</div>
                                    </div>
                                    <div id="boss-stamina-bar" className="flex-1 h-12 bg-yellow-600 border-2 border-gray-400 overflow-hidden relative">
                                        <div className="h-full bg-green-500" style={{width: `${bossStaminaPercentage}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{bossStamina}</div>
                                    </div>
                                    <div id="boss-mana-bar" className="flex-1 h-12 bg-blue-600 border-2 border-gray-400 overflow-hidden relative">
                                        <div className="h-full bg-blue-500" style={{width: `${bossManaPercentage}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{bossMana}</div>
                                    </div>
                                </div>
                                {boss.image_status === 'completed' && boss.image_url ? (
                                    <ShakeAnimation 
                                        isShaking={bossShaking || bossDying} 
                                        duration={bossDying ? 5000 : 500}
                                        intensity={10}
                                        onComplete={() => {
                                            setBossShaking(false);
                                            if (!bossDying) {
                                                // Only reset shake if not dying
                                            }
                                        }}
                                    >
                                        <img 
                                            src={boss.image_url} 
                                            alt={boss.name}
                                            className="w-1/2 h-auto object-contain mb-16 transition-opacity duration-[5000ms]"
                                            style={{ opacity: bossDying ? 0 : 1 }}
                                        />
                                    </ShakeAnimation>
                                ) : boss.image_status === 'generating' || boss.image_status === 'pending' ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="text-gray-400 animate-pulse">Generating boss image...</div>
                                        <div className="text-sm text-gray-500">{boss.name}</div>
                                    </div>
                                ) : boss.image_status === 'failed' ? (
                                    <div className="text-red-400">Failed to generate image</div>
                                ) : null}
                            </div>
                        )}
                    </div> 
                </div>
            </div>
                <div id="bottom-panel" className="w-full h-32 border-t-2 border-gray-400 flex items-center justify-between px-4">
                    <div id="life-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-red-600" style={{height: `${playerLife}%`}}></div>
                        </div>
                    </div>
                    <div id="stamina-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-green-600" style={{height: `${playerStamina}%`}}></div>
                        </div>
                    </div>
                    <div id="mana-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-blue-600" style={{height: `${playerMana}%`}}></div>
                        </div>
                    </div>
                    <div id="character-picture" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            CP
                        </div>
                    </div>
                    <div id="action-bar" className="flex items-center gap-2 w-full">
                        <div className="w-64 h-24 rounded-lg bg-gray-800 border-2 border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-700 active:bg-gray-600" onClick={() => handleAction('attack', 'player', 'boss')}>
                            Attack
                        </div>
                    </div>
                </div>
            </div>
        </div>);
};

export default Game;