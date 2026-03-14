import React, { useEffect, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import { PlayerService, Player } from '../services/PlayerService';
import playerImage from '../images/player.png';
import takeAction from '../actions/takeAction';
import ShakeAnimation from './ShakeAnimation';

interface GameProps {
    onExit: () => void;
    availableKeywords: string[];
}

// Helper function to get the life resource value for an entity
const getLifeResourceValue = (entity: Player | Boss | null, keywords: any[]): number => {
    if (!entity) return 0;
    
    // Check if entity has ghost keyword (or any keyword with life_resource)
    const lifeResource = keywords.find(kw => kw.properties?.life_resource)?.properties?.life_resource;
    
    if (lifeResource === 'mana') {
        return entity.mana || 0;
    } else if (lifeResource === 'stamina') {
        return entity.stamina || 0;
    }
    
    // Default to life
    return entity.life || 0;
};

// Helper to check if entity is dead
const isDead = (entity: Player | Boss | null, keywords: any[]): boolean => {
    return getLifeResourceValue(entity, keywords) <= 0;
};

const Game: React.FC<GameProps> = ({ onExit, availableKeywords: initialAvailableKeywords }) => {
    const [boss, setBoss] = useState<Boss | null>(null);
    const [player, setPlayer] = useState<Player | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [bossShaking, setBossShaking] = useState<boolean>(false);
    const [bossDying, setBossDying] = useState<boolean>(false);
    const [playerShaking, setPlayerShaking] = useState<boolean>(false);
    const [playerDead, setPlayerDead] = useState<boolean>(false);
    const [actionInProgress, setActionInProgress] = useState<boolean>(false);
    const [turnToken, setTurnToken] = useState<string | null>(null);
    const [grassHeight, setGrassHeight] = useState<number>(50);
    const [bossKeywords, setBossKeywords] = useState<string[]>(['skeleton']);
    const [showKeywordSelection, setShowKeywordSelection] = useState<boolean>(false);
    const [descendClicked, setDescendClicked] = useState<boolean>(false);
    const [availableKeywords] = useState<string[]>(initialAvailableKeywords);
    
    // Keyword data for death checks
    const [allKeywordsData, setAllKeywordsData] = useState<any[]>([]);
    const [playerKeywordData, setPlayerKeywordData] = useState<any[]>([]);
    const [bossKeywordData, setBossKeywordData] = useState<any[]>([]);
    
    // Initial keyword selection state
    const [showInitialKeywordSelection, setShowInitialKeywordSelection] = useState<boolean>(true);
    const [initialKeywordOptions, setInitialKeywordOptions] = useState<any[]>([]);
    const [selectedInitialKeywords, setSelectedInitialKeywords] = useState<string[]>([]);

    useEffect(() => {
        if (boss) {
            // Update boss keywords from loaded boss
            if (boss.keywords && boss.keywords.length > 0) {
                setBossKeywords(boss.keywords);
                // Update boss keyword data
                const bossKwData = allKeywordsData.filter(kw => boss.keywords.includes(kw.name));
                setBossKeywordData(bossKwData);
            }
        }
    }, [boss, allKeywordsData]);

    useEffect(() => {
        // Update player keyword data when player changes
        if (player && player.keywords) {
            const playerKwData = allKeywordsData.filter(kw => player.keywords.includes(kw.name));
            setPlayerKeywordData(playerKwData);
        }
    }, [player, allKeywordsData]);

    useEffect(() => {
        // Check if player has died using correct life resource
        // Only check if we have keyword data loaded AND it matches the player's keywords
        // Also skip during initial keyword selection phase
        if (player && player.keywords && player.keywords.length > 0 && 
            allKeywordsData.length > 0 && 
            playerKeywordData.length === player.keywords.length &&
            !showInitialKeywordSelection) {
            if (isDead(player, playerKeywordData) && !playerDead) {
                setPlayerDead(true);
                setActionInProgress(true); // Prevent further actions
            }
        }
    }, [player, playerKeywordData, playerDead, allKeywordsData, showInitialKeywordSelection]);

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
        // Load player and boss when component mounts
        const loadGame = async () => {
            try {
                setLoading(true);
                
                // Reset player for new game
                await PlayerService.resetPlayer();
                
                // Load fresh player from backend
                const loadedPlayer = await PlayerService.getPlayer();
                setPlayer(loadedPlayer);
                
                // Fetch all keywords for initial selection
                const response = await fetch('/api/bosses/keywords');
                const allKeywords = await response.json();
                setAllKeywordsData(allKeywords);
                
                // Randomly select 5 keywords for the player to choose from
                const shuffled = allKeywords.sort(() => 0.5 - Math.random());
                const selectedOptions = shuffled.slice(0, 5);
                setInitialKeywordOptions(selectedOptions);
                
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load game');
            } finally {
                setLoading(false);
            }
        };

        loadGame();

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
    }, []);

    const handleDescend = () => {
        if (boss && isDead(boss, bossKeywordData) && !descendClicked) {
            setDescendClicked(true);
            setShowKeywordSelection(true);
        }
    };

    const handlePlayerDeath = async () => {
        // Reset player on backend
        await PlayerService.resetPlayer();
        onExit();
    };
    
    const handleInitialKeywordToggle = (keywordName: string) => {
        if (selectedInitialKeywords.includes(keywordName)) {
            setSelectedInitialKeywords(selectedInitialKeywords.filter(k => k !== keywordName));
        } else if (selectedInitialKeywords.length < 2) {
            setSelectedInitialKeywords([...selectedInitialKeywords, keywordName]);
        }
    };
    
    const handleInitialKeywordConfirm = async () => {
        if (selectedInitialKeywords.length !== 2) return;
        
        try {
            setLoading(true);
            
            // Add both keywords to player
            for (const keyword of selectedInitialKeywords) {
                const updatedPlayer = await PlayerService.addKeyword(keyword);
                setPlayer(updatedPlayer);
            }
            
            // Fetch all keywords for boss generation
            const response = await fetch('/api/bosses/keywords');
            const allKeywords = await response.json();
            
            // Filter for rarity 1 creatures and characteristics
            const rarity1Creatures = allKeywords.filter((k: any) => k.category === 'creature' && k.rarity === 1);
            const characteristics = allKeywords.filter((k: any) => k.category === 'characteristic');
            
            // Randomly select one creature and one characteristic
            const randomCreature = rarity1Creatures[Math.floor(Math.random() * rarity1Creatures.length)];
            const randomCharacteristic = characteristics[Math.floor(Math.random() * characteristics.length)];
            
            const selectedKeywords = [randomCreature.name, randomCharacteristic.name];
            
            // Load the first boss with random keywords
            const generatedBoss = await BossService.generateBoss(selectedKeywords);
            setBoss(generatedBoss);
            
            // If image is still generating, poll for updates
            if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
                pollForImage(generatedBoss.id);
            }
            
            // Hide initial selection screen
            setShowInitialKeywordSelection(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to apply keywords');
        } finally {
            setLoading(false);
        }
    };

    const handleKeywordSelection = async (selectedKeyword: string) => {
        try {
            // Add selected keyword to player on backend and level up
            const updatedPlayer = await PlayerService.addKeyword(selectedKeyword);
            setPlayer(updatedPlayer);
            
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
            
            // Reset game state for new boss
            setLoading(true);
            setBossDying(false);
            setBossShaking(false);
            setDescendClicked(false);
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

    const handleAction = async (action: string) => {
        if (actionInProgress) {
            console.log("Action already in progress, ignoring");
            return;
        }
        
        setActionInProgress(true);
        
        try {
            const response = await takeAction(action);
            
            console.log("received response:", response);
            
            // Extract new game state from response
            const currentState = response.gameState;
            const bossAction = response.bossAction;
            const newTurnToken = response.turnToken;
            
            // Save old player state before any updates
            const oldPlayerLife = player?.life || 100;
            const playerBeforeBossAttack = player;
            
            // PHASE 1: Show player action result immediately
            // Update boss from backend (player's attack result)
            if (currentState.boss) {
                const oldBossLife = boss?.life || 100;
                setBoss(currentState.boss);
                
                // Trigger boss shake if damaged
                if (currentState.boss.life < oldBossLife) {
                    setBossShaking(true);
                }
                
                // Check if boss is defeated using correct life resource
                const updatedBossKwData = allKeywordsData.filter(kw => currentState.boss.keywords?.includes(kw.name));
                if (isDead(currentState.boss, updatedBossKwData) && !bossDying) {
                    setBossDying(true);
                    setBossShaking(true);
                }
            }
            
            // Update turn token
            if (newTurnToken) {
                setTurnToken(newTurnToken);
            }
            
            // PHASE 2: Show boss reaction after a delay
            if (bossAction) {
                setTimeout(() => {
                    // Update player from backend (boss's attack result)
                    if (currentState.player) {
                        setPlayer(currentState.player);
                        if (currentState.player.life < oldPlayerLife) {
                            setPlayerShaking(true);
                        }
                    }
                    
                    console.log("Boss action complete");
                    setActionInProgress(false);
                }, 800); // Boss reacts after 800ms
            } else {
                // No boss action (boss is dead), update player immediately
                if (currentState.player) {
                    setPlayer(currentState.player);
                }
                setActionInProgress(false);
            }
        } catch (err) {
            console.error('Error taking action:', err);
            setError(err instanceof Error ? err.message : 'Failed to take action');
            setActionInProgress(false); // Clear on error
        }
    };
    
    const formatKeywordAttributes = (keyword: any): string => {
        const attrs = keyword.properties || {};
        const parts: string[] = [];
        
        // Weapon attributes
        if (attrs.base_damage_by_type) {
            const damages = Object.entries(attrs.base_damage_by_type)
                .map(([type, value]) => `+${value} ${type} damage`)
                .join(', ');
            parts.push(damages);
        }
        
        if (attrs.damage_multiplier && attrs.damage_multiplier !== 1.0) {
            parts.push(`${attrs.damage_multiplier}x damage`);
        }
        
        if (attrs.applies_to && attrs.applies_to.length > 0) {
            parts.push(`Applies to: ${attrs.applies_to.join(', ')}`);
        }
        
        // Multipliers
        if (attrs.multipliers) {
            const mults = attrs.multipliers;
            Object.entries(mults).forEach(([key, value]) => {
                const num = value as number;
                if (num > 1) {
                    parts.push(`+${((num - 1) * 100).toFixed(0)}% ${key}`);
                } else if (num < 1 && num > 0) {
                    parts.push(`${((num - 1) * 100).toFixed(0)}% ${key}`);
                }
            });
        }
        
        // Damage output modifiers
        if (attrs.damage_output_by_type) {
            const outputs = Object.entries(attrs.damage_output_by_type)
                .filter(([_, value]) => (value as number) !== 1.0)
                .map(([type, value]) => {
                    const num = value as number;
                    return `${num > 1 ? '+' : ''}${((num - 1) * 100).toFixed(0)}% ${type} dmg`;
                });
            if (outputs.length > 0) {
                parts.push(outputs.join(', '));
            }
        }
        
        // Damage reduction (new format)
        if (attrs.damage_reduction_by_type) {
            const reductions = Object.entries(attrs.damage_reduction_by_type)
                .map(([type, value]) => {
                    const num = value as number;
                    if (num < 1) {
                        return `${type}: ${((1 - num) * 100).toFixed(0)}% resist`;
                    } else if (num > 1) {
                        return `${type}: +${((num - 1) * 100).toFixed(0)}% vuln`;
                    }
                    return null;
                })
                .filter(Boolean);
            if (reductions.length > 0) {
                parts.push(reductions.join(', '));
            }
        }
        
        // Legacy format support
        if (attrs.resistances && attrs.resistances.length > 0) {
            parts.push(`Resist: ${attrs.resistances.join(', ')}`);
        }
        
        if (attrs.vulnerabilities && attrs.vulnerabilities.length > 0) {
            parts.push(`Weak: ${attrs.vulnerabilities.join(', ')}`);
        }
        
        if (attrs.passives && attrs.passives.length > 0) {
            parts.push(`Passive: ${attrs.passives.join(', ')}`);
        }
        
        return parts.join(' • ') || 'No special attributes';
    };
    
    // Show initial keyword selection screen
    if (showInitialKeywordSelection) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
                <div className="max-w-4xl p-8">
                    <h1 className="text-4xl font-bold mb-4 text-center">Choose Your Path</h1>
                    <p className="text-xl mb-8 text-center text-gray-300">Select 2 keywords to begin your journey</p>
                    
                    <div className="grid grid-cols-1 gap-4 mb-8">
                        {initialKeywordOptions.map((keyword) => {
                            const isSelected = selectedInitialKeywords.includes(keyword.name);
                            return (
                                <button
                                    key={keyword.name}
                                    onClick={() => handleInitialKeywordToggle(keyword.name)}
                                    disabled={!isSelected && selectedInitialKeywords.length >= 2}
                                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                                        isSelected 
                                            ? 'border-green-500 bg-green-900 bg-opacity-30' 
                                            : 'border-gray-600 bg-gray-800 hover:border-gray-400'
                                    } ${!isSelected && selectedInitialKeywords.length >= 2 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-bold capitalize">{keyword.name}</h3>
                                        <span className="text-sm px-3 py-1 rounded bg-gray-700">
                                            {keyword.category} • Rarity {keyword.rarity}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300">{formatKeywordAttributes(keyword)}</p>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center">
                        <button
                            onClick={handleInitialKeywordConfirm}
                            disabled={selectedInitialKeywords.length !== 2 || loading}
                            className={`px-8 py-4 text-xl font-bold rounded-lg ${
                                selectedInitialKeywords.length === 2 && !loading
                                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                    : 'bg-gray-600 cursor-not-allowed opacity-50'
                            }`}
                        >
                            {loading ? 'Loading...' : `Descend (${selectedInitialKeywords.length}/2 selected)`}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                                        <div className="h-full bg-red-500" style={{width: `${boss.life !== undefined && boss.stats?.base_stats?.life ? (boss.life / Math.ceil(boss.stats.base_stats.life)) * 100 : 0}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{boss.life !== undefined ? boss.life : Math.ceil(boss.stats?.base_stats?.life || 100)}</div>
                                    </div>
                                    <div id="boss-stamina-bar" className="flex-1 h-12 bg-yellow-600 border-2 border-gray-400 overflow-hidden relative">
                                        <div className="h-full bg-green-500" style={{width: `${boss.stamina !== undefined && boss.stats?.base_stats?.stamina ? (boss.stamina / Math.ceil(boss.stats.base_stats.stamina)) * 100 : 0}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{boss.stamina !== undefined ? boss.stamina : Math.ceil(boss.stats?.base_stats?.stamina || 100)}</div>
                                    </div>
                                    <div id="boss-mana-bar" className="flex-1 h-12 bg-blue-600 border-2 border-gray-400 overflow-hidden relative">
                                        <div className="h-full bg-blue-500" style={{width: `${boss.mana !== undefined && boss.stats?.base_stats?.mana ? (boss.mana / Math.ceil(boss.stats.base_stats.mana)) * 100 : 0}%`}}></div>
                                        <div className="absolute inset-0 flex items-center justify-center text-sm">{boss.mana !== undefined ? boss.mana : Math.ceil(boss.stats?.base_stats?.mana || 100)}</div>
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
                            <div className="absolute bottom-0 w-full bg-red-600" style={{height: `${((player?.life || 0) / (player?.max_life || 100)) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.life || 0)}</div>
                        </div>
                    </div>
                    <div id="stamina-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-green-600" style={{height: `${((player?.stamina || 0) / (player?.max_stamina || 100)) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.stamina || 0)}</div>
                        </div>
                    </div>
                    <div id="mana-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full bg-blue-600" style={{height: `${((player?.mana || 0) / (player?.max_mana || 100)) * 100}%`}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{Math.round(player?.mana || 0)}</div>
                        </div>
                    </div>
                    <div id="character-picture" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            CP
                        </div>
                    </div>
                    <div id="action-bar" className="flex items-center gap-2 w-full">
                        {boss && isDead(boss, bossKeywordData) ? (
                            <div 
                                className={`w-64 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center ${
                                    descendClicked 
                                        ? 'bg-gray-900 text-gray-600 cursor-not-allowed' 
                                        : 'cursor-pointer bg-green-800 hover:bg-green-700 active:bg-green-600'
                                }`}
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
                                onClick={() => !actionInProgress && !bossDying && handleAction('attack')}
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
                            {boss.keywords && boss.keywords.map((keywordName: string) => {
                                const keywordData = allKeywordsData.find(kw => kw.name === keywordName);
                                return (
                                    <button
                                        key={keywordName}
                                        onClick={() => handleKeywordSelection(keywordName)}
                                        className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-500 rounded-lg p-4 text-left transition-colors"
                                    >
                                        <div className="text-xl font-semibold capitalize mb-2">{keywordName}</div>
                                        {keywordData && (
                                            <p className="text-sm text-gray-300">{formatKeywordAttributes(keywordData)}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {player && player.keywords.length > 0 && (
                            <div className="mt-6 pt-4 border-t-2 border-gray-600">
                                <p className="text-sm text-gray-400">Your Powers: {player.keywords.join(', ')}</p>
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
                                onClick={handlePlayerDeath}
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