import React, { useEffect, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import playerImage from '../images/player.png';
import takeAction from '../actions/takeAction';
import ShakeAnimation from './ShakeAnimation';

interface GameProps {
    onExit: () => void;
    availableKeywords: string[];
}

const Game: React.FC<GameProps> = ({ onExit, availableKeywords: initialAvailableKeywords }) => {
    const [boss, setBoss] = useState<Boss | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [playerMaxLife, setPlayerMaxLife] = useState<number>(100);
    const [playerMaxStamina, setPlayerMaxStamina] = useState<number>(100);
    const [playerMaxMana, setPlayerMaxMana] = useState<number>(100);
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
    const [playerDead, setPlayerDead] = useState<boolean>(false);
    const [actionInProgress, setActionInProgress] = useState<boolean>(false);
    const [turnToken, setTurnToken] = useState<string | null>(null);
    const [grassHeight, setGrassHeight] = useState<number>(50);
    const [playerKeywords, setPlayerKeywords] = useState<string[]>([]);
    const [bossKeywords, setBossKeywords] = useState<string[]>(['skeleton']);
    const [showKeywordSelection, setShowKeywordSelection] = useState<boolean>(false);
    const [availableKeywords] = useState<string[]>(initialAvailableKeywords);

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
        turnToken,
        player,
        boss
    }

    useEffect(() => {
        if (boss) {
            // Assuming boss.stats has life, mana, endurance properties
            console.log('Boss stats:', boss.stats);
            const stats = boss.stats;
            console.log('Boss base stats:', stats.base_stats);
            const maxLife = Math.ceil(stats.base_stats.life) || 100;
            const maxMana = Math.ceil(stats.base_stats.mana) || 100;
            const maxEndurance = Math.ceil(stats.base_stats.endurance) || 100;

            setBossLifePercentage(maxLife / maxLife * 100);
            setBossManaPercentage(maxMana / maxMana * 100);
            setBossStaminaPercentage(maxEndurance / maxEndurance * 100);

            setBossLife(maxLife);
            setBossMana(maxMana);
            setBossStamina(maxEndurance);
            
            // Update boss keywords from loaded boss
            if (boss.keywords && boss.keywords.length > 0) {
                setBossKeywords(boss.keywords);
            }
        }
    }, [boss]);

    useEffect(() => {
        // Check if player has died
        if (playerLife <= 0 && !playerDead) {
            setPlayerDead(true);
            setActionInProgress(true); // Prevent further actions
        }
    }, [playerLife, playerDead]);

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
                const generatedBoss = await BossService.generateBoss(['skeleton','undead']);
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

    const handleDescend = () => {
        if (bossLife <= 0) {
            setShowKeywordSelection(true);
        }
    };

    const handleKeywordSelection = async (selectedKeyword: string) => {
        try {
            // Add selected keyword to player
            setPlayerKeywords([...playerKeywords, selectedKeyword]);
            
            // Remove selected keyword from boss keywords
            const updatedKeywords = bossKeywords.filter(k => k !== selectedKeyword);
            
            // Add two new random keywords from available keywords (excluding boss's current keywords)
            const unusedKeywords = availableKeywords.filter(k => !updatedKeywords.includes(k));
            
            // Add 2 random new keywords
            for (let i = 0; i < 2 && unusedKeywords.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * unusedKeywords.length);
                const newKeyword = unusedKeywords.splice(randomIndex, 1)[0];
                updatedKeywords.push(newKeyword);
            }
            
            setBossKeywords(updatedKeywords);
            setShowKeywordSelection(false);
            
            // Increase player base stats by 10
            const newMaxLife = playerMaxLife + 10;
            const newMaxStamina = playerMaxStamina + 10;
            const newMaxMana = playerMaxMana + 10;
            setPlayerMaxLife(newMaxLife);
            setPlayerMaxStamina(newMaxStamina);
            setPlayerMaxMana(newMaxMana);
            
            // Fully heal player
            setPlayerLife(newMaxLife);
            setPlayerStamina(newMaxStamina);
            setPlayerMana(newMaxMana);
            
            // Reset game state for new boss
            setLoading(true);
            setBossDying(false);
            setBossShaking(false);
            setTurnToken(null);
            
            // Generate new boss with updated keywords
            const generatedBoss = await BossService.generateBoss(updatedKeywords);
            setBoss(generatedBoss);
            
            // If image is still generating, poll for updates
            if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
                pollForImage(generatedBoss.id);
            }
            
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate new boss');
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
    };

    const handleAction = async (action: string, actionTaker: string = 'player', target: string = 'boss') => {
        if (actionInProgress) {
            console.log("Action already in progress, ignoring");
            return;
        }
        
        setActionInProgress(true);
        
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
            
            // Update turn token for next action
            if (currentState.turnToken) {
                console.log("Updating turn token to:", currentState.turnToken);
                setTurnToken(currentState.turnToken);
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
                    
                    // Turn complete, allow new actions
                    setActionInProgress(false);
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
                
                // No boss turn, action complete
                setActionInProgress(false);
            }
        } catch (err) {
            console.error('Error taking action:', err);
            setError(err instanceof Error ? err.message : 'Failed to take action');
            setActionInProgress(false); // Clear on error
        }
    };

    return (<div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-white relative">
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={onExit}>Surrender</button>
            <div className="w-3/4 h-3/4 border-4 border-dashed border-gray-400 flex flex-col">
            <div className="h-full flex items-center justify-center relative">
                <div id="game-background" className="absolute inset-0 -z-1 flex flex-col">
                    <div className="w-full flex-1 bg-gradient-to-b from-blue-900 to-orange-500"></div>
                    <div className="w-full bg-gradient-to-t from-green-700 to-green-900" style={{ height: `${grassHeight}%` }}></div>
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
                            <div className="absolute bottom-0 w-full bg-red-600" style={{height: `${(playerLife / playerMaxLife) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(playerLife)}</div>
                        </div>
                    </div>
                    <div id="stamina-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-green-600" style={{height: `${(playerStamina / playerMaxStamina) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(playerStamina)}</div>
                        </div>
                    </div>
                    <div id="mana-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-blue-600" style={{height: `${(playerMana / playerMaxMana) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(playerMana)}</div>
                        </div>
                    </div>
                    <div id="character-picture" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            CP
                        </div>
                    </div>
                    <div id="action-bar" className="flex items-center gap-2 w-full">
                        {bossLife <= 0 ? (
                            <div 
                                className="w-64 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer bg-green-800 hover:bg-green-700 active:bg-green-600"
                                onClick={handleDescend}
                            >
                                Descend
                            </div>
                        ) : (
                            <div 
                                className={`w-64 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                    actionInProgress || bossDying 
                                        ? 'bg-gray-900 text-gray-600 cursor-not-allowed' 
                                        : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                                }`}
                                onClick={() => !actionInProgress && !bossDying && handleAction('attack', 'player', 'boss')}
                            >
                                Attack
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Keyword Selection Modal */}
            {showKeywordSelection && boss && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-gray-400 rounded-lg p-8 max-w-2xl">
                        <h2 className="text-3xl font-bold mb-6 text-center">Choose a Power to Absorb</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {boss.keywords && boss.keywords.map((keyword: string) => (
                                <button
                                    key={keyword}
                                    onClick={() => handleKeywordSelection(keyword)}
                                    className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 rounded-lg p-4 text-xl font-semibold capitalize transition-colors"
                                >
                                    {keyword}
                                </button>
                            ))}
                        </div>
                        {playerKeywords.length > 0 && (
                            <div className="mt-6 pt-4 border-t-2 border-gray-600">
                                <p className="text-sm text-gray-400">Your Powers: {playerKeywords.join(', ')}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Player Death Modal */}
            {playerDead && (
                <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-red-600 rounded-lg p-8 max-w-md text-center">
                        <h2 className="text-4xl font-bold mb-4 text-red-500">You Died</h2>
                        <p className="text-xl mb-8 text-gray-300">Your descent ends here...</p>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={onExit}
                                className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 rounded-lg p-4 text-xl font-semibold transition-colors"
                            >
                                Return to Surface
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>);
};

export default Game;