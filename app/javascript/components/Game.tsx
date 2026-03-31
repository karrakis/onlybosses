import React, { useEffect, useMemo, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import { PlayerService, Player } from '../services/PlayerService';
import playerImage from '../images/player.png';
import takeAction from '../actions/takeAction';
import ShakeAnimation from './ShakeAnimation';
import Tooltip from './Tooltip';
import { getPassiveDescription } from '../data/passiveDescriptions';

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
    const STATUS_PAGE_SIZE = 10;

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

    const [showCastMenu, setShowCastMenu] = useState<boolean>(false);
    const [showPlayerStatus, setShowPlayerStatus] = useState<boolean>(false);
    const [statusSearch, setStatusSearch] = useState<string>('');
    const [statusPage, setStatusPage] = useState<number>(1);
    const [spellSearch, setSpellSearch] = useState<string>('');
    const [favoriteSpells, setFavoriteSpells] = useState<string[]>([]);
    const [actionBarSpells, setActionBarSpells] = useState<string[]>([]);
    
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

    const getPlayerAbilities = (keywords: any[]): string[] => {
        const abilities = new Set<string>();
        keywords.forEach((keyword) => {
            const keywordAbilities = keyword?.properties?.abilities || [];
            keywordAbilities.forEach((ability: string) => abilities.add(ability));
        });
        return Array.from(abilities);
    };

    const formatSpellName = (spell: string): string => {
        return spell
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const playerAbilities = getPlayerAbilities(playerKeywordData);
    const canCast = playerAbilities.includes('cast');
    const collectedSpells = playerAbilities.filter((ability) => ability !== 'cast');
    const visibleActionBarSpells = canCast
        ? actionBarSpells.filter((spell) => collectedSpells.includes(spell))
        : [];
    const filteredSpells = collectedSpells.filter((spell) =>
        formatSpellName(spell).toLowerCase().includes(spellSearch.toLowerCase())
    );
    const sortedSpells = [...filteredSpells].sort((a, b) => {
        const aFav = favoriteSpells.includes(a);
        const bFav = favoriteSpells.includes(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return formatSpellName(a).localeCompare(formatSpellName(b));
    });

    const playerStatusData = useMemo(() => {
        if (!player) {
            return {
                summaryRows: [] as Array<{ label: string; value: string }>,
                detailRows: [] as Array<{ category: string; label: string; value: string }>
            };
        }

        const resourceMultipliers: Record<string, number> = {
            life: 1,
            stamina: 1,
            mana: 1
        };
        const damageOutputMultipliers: Record<string, number> = {};
        const damageReductionProfile: Record<string, number> = {};
        let damageAmplification = 1;

        (playerKeywordData || []).forEach((keyword) => {
            const attrs = keyword?.properties || {};

            if (attrs.multipliers) {
                Object.entries(attrs.multipliers).forEach(([key, value]) => {
                    const num = value as number;
                    if (typeof num !== 'number') return;
                    if (!(key in resourceMultipliers)) {
                        resourceMultipliers[key] = 1;
                    }
                    resourceMultipliers[key] *= num;
                });
            }

            if (typeof attrs.damage_amplification === 'number') {
                damageAmplification *= attrs.damage_amplification;
            }

            if (attrs.damage_output_by_type) {
                Object.entries(attrs.damage_output_by_type).forEach(([type, value]) => {
                    const num = value as number;
                    if (typeof num !== 'number') return;
                    if (!(type in damageOutputMultipliers)) {
                        damageOutputMultipliers[type] = 1;
                    }
                    damageOutputMultipliers[type] *= num;
                });
            }

            if (attrs.damage_reduction_by_type) {
                Object.entries(attrs.damage_reduction_by_type).forEach(([type, value]) => {
                    const num = value as number;
                    if (typeof num !== 'number') return;
                    if (!(type in damageReductionProfile)) {
                        damageReductionProfile[type] = 1;
                    }
                    damageReductionProfile[type] *= num;
                });
            }
        });

        const formatResourceMultipliers = () => {
            return Object.entries(resourceMultipliers)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}: x${value.toFixed(2)}`)
                .join(' • ');
        };

        const formatTypedOutput = () => {
            const entries = Object.entries(damageOutputMultipliers)
                .filter(([_, value]) => Math.abs(value - 1) > 0.001)
                .sort(([a], [b]) => a.localeCompare(b));

            if (entries.length === 0) return 'None';

            return entries
                .map(([type, value]) => {
                    const pct = ((value - 1) * 100).toFixed(0);
                    return `${type}: ${value >= 1 ? '+' : ''}${pct}%`;
                })
                .join(' • ');
        };

        const formatReductionProfile = () => {
            const entries = Object.entries(damageReductionProfile)
                .filter(([_, value]) => Math.abs(value - 1) > 0.001)
                .sort(([a], [b]) => a.localeCompare(b));

            if (entries.length === 0) return 'None';

            return entries
                .map(([type, value]) => {
                    if (value < 1) {
                        return `${type}: ${((1 - value) * 100).toFixed(0)}% resist`;
                    }
                    return `${type}: +${((value - 1) * 100).toFixed(0)}% vuln`;
                })
                .join(' • ');
        };

        const summaryRows: Array<{ label: string; value: string }> = [
            { label: 'Life', value: `${Math.round(player.life || 0)} / ${Math.round(player.max_life || 0)}` },
            { label: 'Stamina', value: `${Math.round(player.stamina || 0)} / ${Math.round(player.max_stamina || 0)}` },
            { label: 'Mana', value: `${Math.round(player.mana || 0)} / ${Math.round(player.max_mana || 0)}` },
            { label: 'Base Damage', value: String(player.damage || 0) },
            { label: 'Resource Multipliers', value: formatResourceMultipliers() },
            { label: 'Damage Amplification', value: `x${damageAmplification.toFixed(2)}` },
            { label: 'Damage Output Multipliers', value: formatTypedOutput() },
            { label: 'Damage Reduction Profile', value: formatReductionProfile() },
            { label: 'Available Actions', value: (player.actions || []).join(', ') || 'None' },
            { label: 'Available Spells', value: collectedSpells.length ? collectedSpells.map(formatSpellName).join(', ') : 'None' }
        ];

        const rows: Array<{ category: string; label: string; value: string }> = [
            { category: 'Core', label: 'Name', value: player.name },
            { category: 'Progression', label: 'Bosses Defeated', value: String(player.bosses_defeated || 0) },
            { category: 'Progression', label: 'Total Powers', value: String(player.keywords?.length || 0) },
            { category: 'Resource', label: 'Life', value: `${Math.round(player.life || 0)} / ${Math.round(player.max_life || 0)}` },
            { category: 'Resource', label: 'Stamina', value: `${Math.round(player.stamina || 0)} / ${Math.round(player.max_stamina || 0)}` },
            { category: 'Resource', label: 'Mana', value: `${Math.round(player.mana || 0)} / ${Math.round(player.max_mana || 0)}` },
            { category: 'Combat', label: 'Base Damage', value: String(player.damage || 0) },
            { category: 'Recovery', label: 'Turns Since Mana Cost', value: String(player.turns_since_mana_cost || 0) },
            { category: 'Recovery', label: 'Turns Since Stamina Cost', value: String(player.turns_since_stamina_cost || 0) },
            { category: 'Combat', label: 'Actions', value: (player.actions || []).join(', ') || 'None' }
        ];

        const keywordRows = (playerKeywordData || []).map((keyword) => ({
            category: 'Power',
            label: keyword.name,
            value: formatKeywordAttributes(keyword)
        }));

        return {
            summaryRows,
            detailRows: [...rows, ...keywordRows]
        };
    }, [player, playerKeywordData, collectedSpells]);

    const filteredSummaryRows = useMemo(() => {
        const term = statusSearch.trim().toLowerCase();
        const summaryRows = playerStatusData.summaryRows;
        if (!term) return summaryRows;

        return summaryRows.filter((row) =>
            row.label.toLowerCase().includes(term) ||
            row.value.toLowerCase().includes(term)
        );
    }, [playerStatusData.summaryRows, statusSearch]);

    const filteredPlayerStatusRows = useMemo(() => {
        const term = statusSearch.trim().toLowerCase();
        const detailRows = playerStatusData.detailRows;
        if (!term) return detailRows;

        return detailRows.filter((row) =>
            row.category.toLowerCase().includes(term) ||
            row.label.toLowerCase().includes(term) ||
            row.value.toLowerCase().includes(term)
        );
    }, [playerStatusData.detailRows, statusSearch]);

    const statusTotalPages = Math.max(1, Math.ceil(filteredPlayerStatusRows.length / STATUS_PAGE_SIZE));
    const statusPageStart = (statusPage - 1) * STATUS_PAGE_SIZE;
    const paginatedPlayerStatusRows = filteredPlayerStatusRows.slice(statusPageStart, statusPageStart + STATUS_PAGE_SIZE);

    useEffect(() => {
        setStatusPage(1);
    }, [statusSearch, showPlayerStatus]);

    useEffect(() => {
        if (statusPage > statusTotalPages) {
            setStatusPage(statusTotalPages);
        }
    }, [statusPage, statusTotalPages]);

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
            
            // PHASE 1: Show player action result immediately
            // Update player with state after their action (includes lifesteal)
            let playerLifeAfterPlayerAction = player?.life || 100;
            if (currentState.playerAfterPlayerAction) {
                playerLifeAfterPlayerAction = currentState.playerAfterPlayerAction.life;
                setPlayer(currentState.playerAfterPlayerAction);
            }
            
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
                    // Update player with final state (after boss action)
                    if (currentState.player) {
                        setPlayer(currentState.player);
                        // Check if boss damaged player (compare to state after player's action)
                        if (currentState.player.life < playerLifeAfterPlayerAction) {
                            setPlayerShaking(true);
                        }
                    }
                    
                    console.log("Boss action complete");
                    setActionInProgress(false);
                }, 800); // Boss reacts after 800ms
            } else {
                // No boss action (boss is dead)
                setActionInProgress(false);
            }
        } catch (err) {
            console.error('Error taking action:', err);
            setError(err instanceof Error ? err.message : 'Failed to take action');
            setActionInProgress(false); // Clear on error
        }
    };

    const toggleFavoriteSpell = (spell: string) => {
        setFavoriteSpells((prev) =>
            prev.includes(spell) ? prev.filter((s) => s !== spell) : [...prev, spell]
        );
    };

    const addSpellToActionBar = (spell: string) => {
        setActionBarSpells((prev) => (prev.includes(spell) ? prev : [...prev, spell]));
    };
    
    function formatKeywordAttributes(keyword: any): string {
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
    }

    // Render keyword attributes with tooltips for passives
    const renderKeywordAttributes = (keyword: any): React.ReactNode => {
        const attrs = keyword.properties || {};
        const parts: React.ReactNode[] = [];
        
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
        
        // Passives with tooltips
        if (attrs.passives && attrs.passives.length > 0) {
            const passiveElements = attrs.passives.map((passive: string, idx: number) => (
                <Tooltip key={`passive-${idx}`} text={getPassiveDescription(passive)}>
                    <span className="underline decoration-dotted cursor-help">{passive}</span>
                </Tooltip>
            ));
            
            parts.push(
                <span key="passives">
                    Passive: {passiveElements.reduce((acc: React.ReactNode[], elem: React.ReactNode, idx: number) => {
                        if (idx > 0) acc.push(', ');
                        acc.push(elem);
                        return acc;
                    }, [])}
                </span>
            );
        }
        
        if (parts.length === 0) return 'No special attributes';
        
        return parts.reduce((acc: React.ReactNode[], part, idx) => {
            if (idx > 0) acc.push(' • ');
            acc.push(part);
            return acc;
        }, []);
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
                                    <div className="text-sm text-gray-300">{renderKeywordAttributes(keyword)}</div>
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
                        <button
                            onClick={() => setShowPlayerStatus(true)}
                            className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 hover:bg-gray-700 transition-colors flex items-center justify-center text-xs font-bold tracking-wide"
                        >
                            Status
                        </button>
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
                            <>
                                <div 
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        actionInProgress || bossDying 
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed' 
                                            : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                                    }`}
                                    onClick={() => !actionInProgress && !bossDying && handleAction('attack')}
                                >
                                    Attack
                                </div>
                                <div
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        actionInProgress || bossDying
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                                            : 'bg-yellow-900 hover:bg-yellow-800 active:bg-yellow-700'
                                    }`}
                                    onClick={() => !actionInProgress && !bossDying && handleAction('guard')}
                                >
                                    Guard
                                </div>
                                {canCast && (
                                    <div
                                        className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                            actionInProgress || bossDying 
                                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                                                : 'bg-purple-800 hover:bg-purple-700 active:bg-purple-600'
                                        }`}
                                        onClick={() => !actionInProgress && !bossDying && setShowCastMenu(true)}
                                    >
                                        Cast
                                    </div>
                                )}
                                {visibleActionBarSpells.map((spell) => (
                                    <div
                                        key={spell}
                                        className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                            actionInProgress || bossDying 
                                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-800 hover:bg-blue-700 active:bg-blue-600'
                                        }`}
                                        onClick={() => !actionInProgress && !bossDying && handleAction(`cast:${spell}`)}
                                    >
                                        {formatSpellName(spell)}
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Cast Menu Modal */}
            {showCastMenu && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-8 w-full max-w-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-bold">Cast</h2>
                            <button
                                onClick={() => setShowCastMenu(false)}
                                className="text-gray-300 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        <input
                            type="text"
                            placeholder="Search spells..."
                            value={spellSearch}
                            onChange={(e) => setSpellSearch(e.target.value)}
                            className="w-full mb-4 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white"
                        />
                        {sortedSpells.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No spells found.</div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto space-y-2">
                                {sortedSpells.map((spell) => (
                                    <div
                                        key={spell}
                                        className="flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => toggleFavoriteSpell(spell)}
                                                className={`text-xl ${favoriteSpells.includes(spell) ? 'text-yellow-400' : 'text-gray-400'}`}
                                                aria-label="Favorite spell"
                                            >
                                                {favoriteSpells.includes(spell) ? '★' : '☆'}
                                            </button>
                                            <div className="text-lg font-semibold">{formatSpellName(spell)}</div>
                                        </div>
                                        <button
                                            onClick={() => addSpellToActionBar(spell)}
                                            disabled={actionBarSpells.includes(spell)}
                                            className={`px-4 py-2 rounded border ${
                                                actionBarSpells.includes(spell)
                                                    ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                                                    : 'bg-purple-700 border-purple-500 hover:bg-purple-600'
                                            }`}
                                        >
                                            {actionBarSpells.includes(spell) ? 'Added' : 'Add to bar'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Player Status Modal */}
            {showPlayerStatus && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-gray-800 border-4 border-cyan-500 rounded-lg p-8 w-full max-w-4xl max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-3xl font-bold">Player Status</h2>
                            <button
                                onClick={() => setShowPlayerStatus(false)}
                                className="text-gray-300 hover:text-white text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search stats, powers, effects..."
                            value={statusSearch}
                            onChange={(e) => setStatusSearch(e.target.value)}
                            className="w-full mb-4 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white"
                        />

                        <div className="text-sm text-gray-300 mb-3">
                            Showing detail entries {filteredPlayerStatusRows.length === 0 ? 0 : statusPageStart + 1}-
                            {Math.min(statusPageStart + STATUS_PAGE_SIZE, filteredPlayerStatusRows.length)} of {filteredPlayerStatusRows.length}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {filteredSummaryRows.length > 0 && (
                                <div className="bg-gray-700 border border-cyan-500 rounded-lg px-4 py-3">
                                    <div className="text-sm uppercase tracking-wide text-cyan-300 mb-2">Player Status</div>
                                    <div className="space-y-1">
                                        {filteredSummaryRows.map((row, idx) => (
                                            <div key={`summary-${row.label}-${idx}`} className="text-sm text-gray-100 break-words">
                                                <span className="font-semibold">{row.label}:</span> {row.value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {paginatedPlayerStatusRows.length === 0 ? (
                                <div className="text-gray-400 text-center py-8">No detail entries match your search.</div>
                            ) : (
                                paginatedPlayerStatusRows.map((row, idx) => (
                                    <div
                                        key={`${row.category}-${row.label}-${idx}`}
                                        className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3"
                                    >
                                        <div className="text-xs uppercase tracking-wide text-cyan-300 mb-1">{row.category}</div>
                                        <div className="text-lg font-semibold capitalize">{row.label}</div>
                                        <div className="text-sm text-gray-200 break-words">{row.value}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-600 flex items-center justify-between">
                            <button
                                onClick={() => setStatusPage((p) => Math.max(1, p - 1))}
                                disabled={statusPage <= 1}
                                className={`px-4 py-2 rounded border ${
                                    statusPage <= 1
                                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                }`}
                            >
                                Previous
                            </button>
                            <div className="text-sm text-gray-300">
                                Page {statusPage} / {statusTotalPages}
                            </div>
                            <button
                                onClick={() => setStatusPage((p) => Math.min(statusTotalPages, p + 1))}
                                disabled={statusPage >= statusTotalPages}
                                className={`px-4 py-2 rounded border ${
                                    statusPage >= statusTotalPages
                                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                                        : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                            <div className="text-sm text-gray-300">{renderKeywordAttributes(keywordData)}</div>
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