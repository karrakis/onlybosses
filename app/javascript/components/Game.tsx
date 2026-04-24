import React, { useEffect, useMemo, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import { PlayerService, Player } from '../services/PlayerService';
import takeAction from '../actions/takeAction';
import CreatureCompositor from './CreatureCompositor';
import ShakeAnimation from './ShakeAnimation';
import Tooltip from './Tooltip';
import { getPassiveDescription } from '../data/passiveDescriptions';
import PlayerDeathModal from './modals/PlayerDeath';

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
    const [playerCombatAnim, setPlayerCombatAnim] = useState<'whirlwind' | 'smash' | null>(null);
    const [bossCombatAnim, setBossCombatAnim] = useState<'whirlwind' | 'smash' | null>(null);
    const [activeEffect, setActiveEffect] = useState<{ type: 'whirlwind' | 'smash'; direction: 'ltr' | 'rtl' } | null>(null);
    const [actionInProgress, setActionInProgress] = useState<boolean>(false);
    const [turnToken, setTurnToken] = useState<string | null>(null);
    const [grassHeight, setGrassHeight] = useState<number>(50);
    const [bossKeywords, setBossKeywords] = useState<string[]>(['skeleton']);
    const [showKeywordSelection, setShowKeywordSelection] = useState<boolean>(false);
    const [showRemoveKeywordPanel, setShowRemoveKeywordPanel] = useState<boolean>(false);
    const [descendClicked, setDescendClicked] = useState<boolean>(false);
    const [depth, setDepth] = useState<number>(1);
    const [availableKeywords] = useState<string[]>(initialAvailableKeywords);

    const [showCastMenu, setShowCastMenu] = useState<boolean>(false);
    const [showPlayerStatus, setShowPlayerStatus] = useState<boolean>(false);
    const [statusSearch, setStatusSearch] = useState<string>('');
    const [statusPage, setStatusPage] = useState<number>(1);
    const [spellSearch, setSpellSearch] = useState<string>('');
    const [favoriteSpells, setFavoriteSpells] = useState<string[]>([]);
    const [actionBarSpells, setActionBarSpells] = useState<string[]>([]);
    const [forcedPlayerAction, setForcedPlayerAction] = useState<string | null>(null);
    
    // Keyword data for death checks
    const [allKeywordsData, setAllKeywordsData] = useState<any[]>([]);
    const [playerKeywordData, setPlayerKeywordData] = useState<any[]>([]);
    const [bossKeywordData, setBossKeywordData] = useState<any[]>([]);
    
    // Initial keyword selection state
    const [showInitialKeywordSelection, setShowInitialKeywordSelection] = useState<boolean>(true);
    const [initialKeywordOptions, setInitialKeywordOptions] = useState<any[]>([]);
    const [selectedInitialKeywords, setSelectedInitialKeywords] = useState<string[]>([]);

    // Pre-rolled keywords that are guaranteed to appear on the boss at TIER_UP_DEPTH.
    // Excluded from normal rotation until then so the player can plan around them.
    const [tieredKeywords, setTieredKeywords] = useState<string[]>([]);
    // Race conflict: set when player tries to pick a creature keyword at their race cap.
    const [raceConflictPending, setRaceConflictPending] = useState<{ newRace: string; existingRaces: string[] } | null>(null);
    const [raceReplaceSelection, setRaceReplaceSelection] = useState<string>('');
    const [raceWeaponDiscardSelection, setRaceWeaponDiscardSelection] = useState<string[]>([]);
    // Weapon conflict: set when a new weapon would exceed hand capacity.
    const [weaponConflictPending, setWeaponConflictPending] = useState<{ newWeapon: string; handsNeeded: number } | null>(null);
    const [weaponDiscardSelection, setWeaponDiscardSelection] = useState<string[]>([]);
    const TIER_UP_DEPTH = 5;

    useEffect(() => {
        if (boss) {
            // Update boss keywords from loaded boss
            if (boss.keywords && boss.keywords.length > 0) {
                setBossKeywords(boss.keywords);
                // Update boss keyword data — include derived passives so that
                // life_resource checks (ghost/ethereal) still work correctly.
                const bossKwData = allKeywordsData.filter(kw =>
                    boss.keywords.includes(kw.name) ||
                    (boss.derived_passives || []).includes(kw.name)
                );
                setBossKeywordData(bossKwData);
            }
        }
    }, [boss, allKeywordsData]);

    useEffect(() => {
        // Update player keyword data when player changes.
        // Map over player.keywords (which can contain duplicates for stacking) so each
        // copy of a keyword gets its own data object — required for stacking calculations.
        if (player && player.keywords) {
            const playerKwData = player.keywords
                .map((name: string) => allKeywordsData.find((kw: any) => kw.name === name))
                .filter(Boolean);
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
    // Only abilities from spell-category keywords are spells (dispatched via cast:)
    const collectedSpells = playerKeywordData
        .filter((kw: any) => kw.category === 'spell')
        .flatMap((kw: any) => (kw.properties?.abilities || []).filter((a: string) => a !== 'cast'));
    // Abilities from weapon/attack-category keywords are direct physical actions
    const physicalAbilities = [...new Set<string>(
        playerKeywordData
            .filter((kw: any) => kw.category === 'weapon' || kw.category === 'attack')
            .flatMap((kw: any) => {
                if (kw.category === 'attack') {
                    // Attack keywords ARE the ability — the keyword name is the action
                    return [kw.name];
                }
                // Weapon keywords list their granted abilities explicitly
                return (kw.properties?.abilities || []).filter((a: string) => a !== 'cast');
            })
    )];
    const activeAbilities = [...new Set<string>(
        playerKeywordData
            .filter((kw: any) => kw.category === 'ability')
            .map((kw: any) => kw.name)
    )];
    const isFlying = ((player?.active_buffs?.physical_immunity ?? 0) as number) > 0;
    const isBossWebbed = ((boss?.active_debuffs?.fire_vulnerability ?? 0) as number) > 0;
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
                keywordRows: [] as Array<{ label: string; value: string; count: number }>
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
            { label: 'Available Spells', value: collectedSpells.length ? collectedSpells.map(formatSpellName).join(', ') : 'None' },
            { label: 'Hands', value: `${player.equipped_hands ?? 0} / ${player.max_hands ?? 2}` },
            { label: 'Race Slots', value: `${player.race_count ?? 0} / ${player.max_race_slots ?? 1}` }
        ];

        // Deduplicate keywords for display but track how many times each appears.
        // (playerKeywordData may have duplicate entries when passives stack.)
        const kwCountMap = new Map<string, number>();
        const kwDataMap = new Map<string, any>();
        (playerKeywordData || []).forEach((keyword) => {
            kwCountMap.set(keyword.name, (kwCountMap.get(keyword.name) || 0) + 1);
            if (!kwDataMap.has(keyword.name)) kwDataMap.set(keyword.name, keyword);
        });
        const keywordRows = Array.from(kwCountMap.entries()).map(([name, count]) => ({
            label: name,
            value: formatKeywordAttributes(kwDataMap.get(name)),
            count
        }));

        return {
            summaryRows,
            keywordRows
        };
    }, [player, playerKeywordData, collectedSpells]);

    const filteredKeywordRows = useMemo(() => {
        const term = statusSearch.trim().toLowerCase();
        const keywordRows = playerStatusData.keywordRows;
        if (!term) return keywordRows;
        return keywordRows.filter((row) =>
            row.label.toLowerCase().includes(term) ||
            row.value.toLowerCase().includes(term)
        );
    }, [playerStatusData.keywordRows, statusSearch]);

    const statusTotalPages = Math.max(1, Math.ceil(filteredKeywordRows.length / STATUS_PAGE_SIZE));
    const keywordPageStart = (statusPage - 1) * STATUS_PAGE_SIZE;
    const paginatedKeywordRows = filteredKeywordRows.slice(keywordPageStart, keywordPageStart + STATUS_PAGE_SIZE);

    useEffect(() => {
        setStatusPage(1);
    }, [statusSearch, showPlayerStatus]);

    useEffect(() => {
        if (statusPage > statusTotalPages) {
            setStatusPage(statusTotalPages);
        }
    }, [statusPage, statusTotalPages]);

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
                
                // Randomly select 5 rarity-1 keywords for the player to choose from
                const rarity1Keywords = allKeywords.filter((k: any) => k.rarity === 1);
                const shuffled = rarity1Keywords.sort(() => 0.5 - Math.random());
                const selectedOptions = shuffled.slice(0, 5);
                setInitialKeywordOptions(selectedOptions);

                // Pre-roll the 2 keywords destined for TIER_UP_DEPTH using the same
                // rarity-budget logic applied at descent time, so the pair respects
                // the additive cap (max(2, 2*floor(D/5)+1) — at depth 5 that's 3,
                // meaning e.g. R2+R1 but not R2+R2).
                const tierMaxRarity = Math.floor(TIER_UP_DEPTH / 5) + 1;
                const tierRarityCap = Math.max(2, 2 * Math.floor(TIER_UP_DEPTH / 5) + 1);
                const tierPool = [...allKeywords]
                    .filter((k: any) =>
                        (k.rarity - 1) * 5 <= TIER_UP_DEPTH &&
                        k.rarity <= tierMaxRarity
                    )
                    .sort(() => 0.5 - Math.random());

                const rolledTiered: string[] = [];
                let tierBudget = tierRarityCap;
                for (const k of tierPool) {
                    if (rolledTiered.length >= 2) break;
                    if (k.rarity <= tierBudget) {
                        rolledTiered.push(k.name);
                        tierBudget -= k.rarity;
                    }
                }
                setTieredKeywords(rolledTiered);

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
        if (boss && (isDead(boss, bossKeywordData) || bossDying) && !descendClicked) {
            setDescendClicked(true);
            setShowRemoveKeywordPanel(false);
            setShowKeywordSelection(true);
        }
    };

    const handlePlayerDeath = async () => {
        // Reset player on backend, recording the run outcome
        await PlayerService.resetPlayer('died');
        onExit();
    };
    
    const handleInitialKeywordToggle = (keywordName: string) => {
        if (selectedInitialKeywords.includes(keywordName)) {
            setSelectedInitialKeywords(selectedInitialKeywords.filter(k => k !== keywordName));
            return;
        }
        if (selectedInitialKeywords.length >= 2) return;

        const newKw = allKeywordsData.find((k: any) => k.name === keywordName);

        // Race check: only one creature allowed at start (default max_race_slots = 1)
        if (newKw?.category === 'creature') {
            const alreadyHasCreature = selectedInitialKeywords.some((n: string) => {
                const kw = allKeywordsData.find((k: any) => k.name === n);
                return kw?.category === 'creature';
            });
            if (alreadyHasCreature) return;
            // Also block if this creature's max_hands would make existing selected weapons invalid
            if (newKw.properties?.max_hands != null) {
                const handsUsed = selectedInitialKeywords.reduce((sum: number, n: string) => {
                    const kw = allKeywordsData.find((k: any) => k.name === n);
                    return kw?.category === 'weapon' ? sum + (kw.properties?.hands ?? 1) : sum;
                }, 0);
                if (handsUsed > newKw.properties.max_hands) return;
            }
        }

        // Weapon hands check
        if (newKw?.category === 'weapon') {
            const newHands: number = newKw.properties?.hands ?? 1;
            // Effective max hands: from already-selected creature if it declares max_hands, else 2
            const creatureKw = selectedInitialKeywords
                .map((n: string) => allKeywordsData.find((k: any) => k.name === n))
                .find((k: any) => k?.category === 'creature' && k.properties?.max_hands != null);
            const effectiveMaxHands: number = creatureKw ? creatureKw.properties.max_hands : 2;
            const handsUsed = selectedInitialKeywords.reduce((sum: number, n: string) => {
                const kw = allKeywordsData.find((k: any) => k.name === n);
                return kw?.category === 'weapon' ? sum + (kw.properties?.hands ?? 1) : sum;
            }, 0);
            if (handsUsed + newHands > effectiveMaxHands) return;
        }

        setSelectedInitialKeywords([...selectedInitialKeywords, keywordName]);
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

            // Store the boss in the session before recording the snapshot so
            // record_snapshot can read boss keyword IDs from get_current_boss
            await fetch('/set_boss', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ boss: generatedBoss }),
            });

            // Record depth-1 snapshot now that player keywords and boss are both known
            await PlayerService.recordSnapshot(1);

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
            const keywordData = allKeywordsData.find((kw: any) => kw.name === selectedKeyword);

            // When at race capacity, pause and show the race-swap modal instead.
            if (keywordData?.category === 'creature' && player) {
                const raceCount = player.race_count ?? 0;
                const maxSlots = player.max_race_slots ?? 1;
                if (raceCount >= maxSlots) {
                    const existingRaces = (player.explicit_keywords || []).filter((kw: string) => {
                        const kwData = allKeywordsData.find((k: any) => k.name === kw);
                        return kwData?.category === 'creature';
                    });
                    setRaceConflictPending({ newRace: selectedKeyword, existingRaces });
                    setRaceReplaceSelection(existingRaces[0] || '');
                    setRaceWeaponDiscardSelection([]);
                    return;
                }
            }

            // When over hand capacity, pause and show the weapon discard modal.
            if (keywordData?.category === 'weapon' && player) {
                const newHands: number = keywordData.properties?.hands ?? 1;
                const equipped: number = player.equipped_hands ?? 0;
                const maxHands: number = player.max_hands ?? 2;
                if (equipped + newHands > maxHands) {
                    setWeaponConflictPending({ newWeapon: selectedKeyword, handsNeeded: newHands });
                    setWeaponDiscardSelection([]);
                    return;
                }
            }

            // Add selected keyword to player on backend and level up
            // Pass nextDepth so the backend records a descent snapshot
            const nextDepth = depth + 1;
            const updatedPlayer = await PlayerService.addKeyword(selectedKeyword, nextDepth);
            setPlayer(updatedPlayer);

            await proceedWithBossKeywords(selectedKeyword, nextDepth);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate new boss');
            setLoading(false);
        }
    };

    // Handles the weapon-conflict choice: discard selected weapons then take the new one.
    const handleWeaponConflictConfirm = async () => {
        if (!weaponConflictPending || !player) return;
        const { newWeapon } = weaponConflictPending;
        setWeaponConflictPending(null);
        try {
            const nextDepth = depth + 1;
            const updatedPlayer = await PlayerService.swapWeapons(newWeapon, weaponDiscardSelection, nextDepth);
            setWeaponDiscardSelection([]);
            setPlayer(updatedPlayer);
            await proceedWithBossKeywords(newWeapon, nextDepth);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resolve weapon choice');
            setLoading(false);
        }
    };

    // Handles the race-conflict choice.
    // 'keep' = stay current race, discard the offered keyword; boss still loses it.
    // 'swap' = remove current race, take the new one.
    const handleRaceConflictChoice = async (choice: 'keep' | 'swap') => {
        if (!raceConflictPending || !player) return;
        const { newRace } = raceConflictPending;
        setRaceConflictPending(null);
        try {
            const nextDepth = depth + 1;
            let updatedPlayer: any;
            if (choice === 'swap') {
                const currentRace = raceReplaceSelection;
                updatedPlayer = await PlayerService.swapRace(newRace, currentRace || '', raceWeaponDiscardSelection, nextDepth);
                setRaceWeaponDiscardSelection([]);
                setRaceReplaceSelection('');
            } else {
                // Keep current race — just level up without taking the keyword
                updatedPlayer = await PlayerService.skipKeyword(nextDepth);
                setRaceWeaponDiscardSelection([]);
                setRaceReplaceSelection('');
            }
            setPlayer(updatedPlayer);
            await proceedWithBossKeywords(newRace, nextDepth);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resolve race choice');
            setLoading(false);
        }
    };

    // Shared tail of keyword selection: removes the taken/discarded keyword from the boss pool,
    // rolls 3 new keywords, regenerates the boss. Call after player state is already updated.
    const proceedWithBossKeywords = async (takenKeyword: string, nextDepth: number) => {
        // Remove selected keyword from boss keywords
        const updatedKeywords = bossKeywords.filter(k => k !== takenKeyword);

        // At tier-up depth, inject the pre-rolled tiered keywords instead of random rolls.
        // Otherwise, roll new keywords respecting the tier threshold and additive rarity cap.
        let addedCount = 0;
        if (nextDepth >= TIER_UP_DEPTH && tieredKeywords.length > 0) {
            for (const kw of tieredKeywords) {
                if (!updatedKeywords.includes(kw)) {
                    updatedKeywords.push(kw);
                    addedCount++;
                }
            }
            setTieredKeywords([]);
        }

        if (addedCount < 3) {
            // Tier threshold: rarity R unlocks at depth (R-1)*5
            const maxRarity = Math.floor(nextDepth / 5) + 1;
            // Additive rarity cap: combined rarity of the 3 new keywords cannot exceed this
            const rarityCap = Math.max(3, 3 * Math.floor(nextDepth / 5) + 1);

            const candidatePool = allKeywordsData
                .filter(kw =>
                    kw.category !== 'passive' &&
                    kw.category !== 'ability' &&
                    !updatedKeywords.includes(kw.name) &&
                    !tieredKeywords.includes(kw.name) &&
                    (kw.rarity - 1) * 5 <= nextDepth &&
                    kw.rarity <= maxRarity
                )
                .sort(() => 0.5 - Math.random());

            let rarityBudget = rarityCap;
            while (addedCount < 3 && candidatePool.length > 0) {
                const eligible = candidatePool.filter(kw => kw.rarity <= rarityBudget);
                if (eligible.length === 0) break;
                const chosen = eligible[0];
                candidatePool.splice(candidatePool.indexOf(chosen), 1);
                updatedKeywords.push(chosen.name);
                rarityBudget -= chosen.rarity;
                addedCount++;
            }
        }

        setBossKeywords(updatedKeywords);
        setShowKeywordSelection(false);
        setDepth((d) => d + 1);

        // Reset game state for new boss
        setLoading(true);
        setBossDying(false);
        setBossShaking(false);
        setDescendClicked(false);
        setTurnToken(null);
        setForcedPlayerAction(null);
        setActionInProgress(false);

        // Generate new boss with updated keywords
        const generatedBoss = await BossService.generateBoss(updatedKeywords);
        setBoss(generatedBoss);

        // If image is still generating, poll for updates
        if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
            pollForImage(generatedBoss.id);
        }

        setLoading(false);
    };

    const handleRemoveKeywordSelection = async (keywordToRemove: string) => {
        try {
            // Remove selected keyword from player on backend and level up
            // Pass nextDepth so the backend records a descent snapshot
            const nextDepth = depth + 1;
            const updatedPlayer = await PlayerService.removeKeyword(keywordToRemove, nextDepth);
            setPlayer(updatedPlayer);

            // Boss keywords evolve: add new keywords (nothing removed since player didn't absorb).
            // At tier-up depth, inject pre-rolled tiered keywords; otherwise use rarity-capped rolling.
            const updatedKeywords = [...bossKeywords];
            let addedCount = 0;

            if (nextDepth >= TIER_UP_DEPTH && tieredKeywords.length > 0) {
                for (const kw of tieredKeywords) {
                    if (!updatedKeywords.includes(kw)) {
                        updatedKeywords.push(kw);
                        addedCount++;
                    }
                }
                setTieredKeywords([]);
            }

            if (addedCount < 3) {
                const maxRarity = Math.floor(nextDepth / 5) + 1;
                const rarityCap = Math.max(3, 3 * Math.floor(nextDepth / 5) + 1);

                const candidatePool = allKeywordsData
                    .filter(kw =>
                        kw.category !== 'passive' &&
                        kw.category !== 'ability' &&
                        !updatedKeywords.includes(kw.name) &&
                        !tieredKeywords.includes(kw.name) &&
                        (kw.rarity - 1) * 5 <= nextDepth &&
                        kw.rarity <= maxRarity
                    )
                    .sort(() => 0.5 - Math.random());

                let rarityBudget = rarityCap;
                while (addedCount < 3 && candidatePool.length > 0) {
                    const eligible = candidatePool.filter(kw => kw.rarity <= rarityBudget);
                    if (eligible.length === 0) break;
                    const chosen = eligible[0];
                    candidatePool.splice(candidatePool.indexOf(chosen), 1);
                    updatedKeywords.push(chosen.name);
                    rarityBudget -= chosen.rarity;
                    addedCount++;
                }
            }

            setBossKeywords(updatedKeywords);
            setShowKeywordSelection(false);
            setShowRemoveKeywordPanel(false);
            setDepth((d) => d + 1);

            // Reset game state for new boss
            setLoading(true);
            setBossDying(false);
            setBossShaking(false);
            setDescendClicked(false);
            setTurnToken(null);
            setForcedPlayerAction(null);
            setActionInProgress(false);

            const generatedBoss = await BossService.generateBoss(updatedKeywords);
            setBoss(generatedBoss);

            if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
                pollForImage(generatedBoss.id);
            }

            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove keyword');
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

        // Fire player combat animation immediately (before API roundtrip)
        const playerBase = action.split(':')[0];
        if (playerBase === 'whirlwind' || playerBase === 'smash') {
            setPlayerCombatAnim(playerBase as 'whirlwind' | 'smash');
            if (playerBase === 'smash') {
                // Delay shockwave to sync with the slam impact (~60% into the animation)
                setTimeout(() => {
                    setActiveEffect({ type: 'smash', direction: 'ltr' });
                    setTimeout(() => setActiveEffect(null), 700);
                }, 450);
            } else {
                setActiveEffect({ type: 'whirlwind', direction: 'ltr' });
                setTimeout(() => setActiveEffect(null), 500);
            }
            setTimeout(() => setPlayerCombatAnim(null), playerBase === 'whirlwind' ? 700 : 800);
        }
        
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
                const updatedBossKwData = allKeywordsData.filter(kw =>
                    currentState.boss.keywords?.includes(kw.name) ||
                    (currentState.boss.derived_passives || []).includes(kw.name)
                );
                if (isDead(currentState.boss, updatedBossKwData) && !bossDying) {
                    setBossDying(true);
                    setBossShaking(true);
                }
            }
            
            // Update turn token
            if (newTurnToken) {
                setTurnToken(newTurnToken);
            }

            // Sync forced-action state from server
            setForcedPlayerAction(response.forcedPlayerAction ?? null);
            
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

                    // Fire boss combat animation
                    const bossBase = bossAction.split(':')[0];
                    if (bossBase === 'whirlwind' || bossBase === 'smash') {
                        setBossCombatAnim(bossBase as 'whirlwind' | 'smash');
                        if (bossBase === 'smash') {
                            setTimeout(() => {
                                setActiveEffect({ type: 'smash', direction: 'rtl' });
                                setTimeout(() => setActiveEffect(null), 700);
                            }, 450);
                        } else {
                            setActiveEffect({ type: 'whirlwind', direction: 'rtl' });
                            setTimeout(() => setActiveEffect(null), 500);
                        }
                        setTimeout(() => setBossCombatAnim(null), bossBase === 'whirlwind' ? 700 : 800);
                    }
                    
                    console.log("Boss action complete");
                    setActionInProgress(false);
                    // Show death modal only after animations have played
                    if (response.playerDied) {
                        setPlayerDead(true);
                    }
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
    
    function getWeaponConflict(keywordData: any): string | null {
        if (keywordData?.category !== 'weapon') return null;
        const newHands: number = keywordData?.properties?.hands ?? 1;
        const equippedHands: number = player?.equipped_hands ?? 0;
        const maxHands: number = player?.max_hands ?? 2;
        if (equippedHands + newHands <= maxHands) return null;
        return `Requires ${newHands} hand${newHands !== 1 ? 's' : ''} (${equippedHands}/${maxHands} used) — drop a weapon to equip this`;
    }

    function getRaceConflict(keywordData: any): string | null {
        if (keywordData?.category !== 'creature') return null;
        const raceCount: number = player?.race_count ?? 0;
        const maxSlots: number = player?.max_race_slots ?? 1;
        if (raceCount < maxSlots) return null;
        const base = `You already have ${raceCount} creature type${raceCount !== 1 ? 's' : ''} (${raceCount}/${maxSlots}) — you'll choose one to replace`;
        if ((player?.equipped_hands ?? 0) > (keywordData.properties?.max_hands ?? 2)) {
            return `${base}; swapping may require discarding weapons to fit hand limit`;
        }
        return base;
    }

    function getBossKeywordDerivedFrom(passiveName: string): string | null {
        if (!boss) return null;
        for (const bossKwName of (boss.keywords || [])) {
            const kw = allKeywordsData.find((k: any) => k.name === bossKwName);
            if (kw?.properties?.passives?.includes(passiveName)) return bossKwName;
        }
        return null;
    }

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

        if (typeof attrs.damage_amplification === 'number' && attrs.damage_amplification !== 1.0) {
            parts.push(`+${((attrs.damage_amplification - 1) * 100).toFixed(0)}% all damage dealt`);
        }

        if (typeof attrs.lifesteal === 'number') {
            parts.push(`${(attrs.lifesteal * 100).toFixed(0)}% lifesteal`);
        }

        if (attrs.life_resource) {
            parts.push(`Life resource: ${attrs.life_resource}`);
        }

        if (typeof attrs.mana_regen_multiplier === 'number') {
            parts.push(`${(attrs.mana_regen_multiplier * 100).toFixed(0)}% mana regen`);
        }

        if (typeof attrs.hands === 'number') {
            parts.push(`${attrs.hands} hand${attrs.hands !== 1 ? 's' : ''} required`);
        }

        if (typeof attrs.max_hands === 'number') {
            parts.push(`Provides ${attrs.max_hands} hand${attrs.max_hands !== 1 ? 's' : ''}`);
        }

        if (typeof attrs.race_slots === 'number') {
            parts.push(`+${attrs.race_slots} race slot${attrs.race_slots !== 1 ? 's' : ''}`);
        }

        if (typeof attrs.stamina_cost === 'number') {
            parts.push(`${attrs.stamina_cost} stamina`);
        }

        if (typeof attrs.hit_count === 'number' && attrs.hit_count > 1) {
            parts.push(`${attrs.hit_count} hits`);
        }

        if (typeof attrs.cooldown === 'number' && attrs.cooldown > 0) {
            parts.push(`${attrs.cooldown}-turn cooldown`);
        }

        if (typeof attrs.block_chance === 'number') {
            parts.push(`${(attrs.block_chance * 100).toFixed(0)}% block chance`);
        }

        if (typeof attrs.evasion_chance === 'number') {
            parts.push(`${(attrs.evasion_chance * 100).toFixed(0)}% evasion`);
        }

        if (typeof attrs.flat_damage_reduction === 'number') {
            parts.push(`${attrs.flat_damage_reduction} flat reduction per hit`);
        }

        if (typeof attrs.ignore_physical_reduction_fraction === 'number') {
            parts.push(`Ignores ${(attrs.ignore_physical_reduction_fraction * 100).toFixed(0)}% of physical resistances`);
        }

        if (attrs.abilities && attrs.abilities.length > 0) {
            const display = (attrs.abilities as string[])
                .map((a) => a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                .join(', ');
            parts.push(`Grants: ${display}`);
        }

        if (attrs.can_hit_flying) {
            parts.push('Can hit flying targets');
        }

        if (attrs.ability_immunities && (attrs.ability_immunities as string[]).length > 0) {
            parts.push(`Immune to: ${(attrs.ability_immunities as string[]).join(', ')}`);
        }

        if (typeof attrs.description === 'string' && attrs.description) {
            parts.push(attrs.description);
        }

        return parts.join(' • ') || 'No special attributes';
    }

    // Render keyword attributes with tooltips for passives
    const renderKeywordAttributes = (keyword: any, redAttrKeys?: string[]): React.ReactNode => {
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

        if (typeof attrs.damage_amplification === 'number' && attrs.damage_amplification !== 1.0) {
            parts.push(`+${((attrs.damage_amplification - 1) * 100).toFixed(0)}% all damage dealt`);
        }

        if (typeof attrs.lifesteal === 'number') {
            parts.push(`${(attrs.lifesteal * 100).toFixed(0)}% lifesteal`);
        }

        if (attrs.life_resource) {
            parts.push(`Life resource: ${attrs.life_resource}`);
        }

        if (typeof attrs.mana_regen_multiplier === 'number') {
            parts.push(`${(attrs.mana_regen_multiplier * 100).toFixed(0)}% mana regen`);
        }

        if (typeof attrs.hands === 'number') {
            const handsText = `${attrs.hands} hand${attrs.hands !== 1 ? 's' : ''} required`;
            parts.push(redAttrKeys?.includes('hands')
                ? <span key="hands-req" className="text-red-400">{handsText}</span>
                : handsText);
        }

        if (typeof attrs.max_hands === 'number') {
            const maxHandsText = `Provides ${attrs.max_hands} hand${attrs.max_hands !== 1 ? 's' : ''}`;
            parts.push(redAttrKeys?.includes('max_hands')
                ? <span key="max-hands" className="text-red-400">{maxHandsText}</span>
                : maxHandsText);
        }

        if (typeof attrs.race_slots === 'number') {
            parts.push(`+${attrs.race_slots} race slot${attrs.race_slots !== 1 ? 's' : ''}`);
        }

        if (typeof attrs.stamina_cost === 'number') {
            parts.push(`${attrs.stamina_cost} stamina`);
        }

        if (typeof attrs.hit_count === 'number' && attrs.hit_count > 1) {
            parts.push(`${attrs.hit_count} hits`);
        }

        if (typeof attrs.cooldown === 'number' && attrs.cooldown > 0) {
            parts.push(`${attrs.cooldown}-turn cooldown`);
        }

        if (typeof attrs.block_chance === 'number') {
            parts.push(`${(attrs.block_chance * 100).toFixed(0)}% block chance`);
        }

        if (typeof attrs.evasion_chance === 'number') {
            parts.push(`${(attrs.evasion_chance * 100).toFixed(0)}% evasion`);
        }

        if (typeof attrs.flat_damage_reduction === 'number') {
            parts.push(`${attrs.flat_damage_reduction} flat reduction per hit`);
        }

        if (typeof attrs.ignore_physical_reduction_fraction === 'number') {
            parts.push(`Ignores ${(attrs.ignore_physical_reduction_fraction * 100).toFixed(0)}% of physical resistances`);
        }

        if (attrs.abilities && attrs.abilities.length > 0) {
            const display = (attrs.abilities as string[])
                .map((a) => a.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                .join(', ');
            parts.push(`Grants: ${display}`);
        }

        if (attrs.can_hit_flying) {
            parts.push('Can hit flying targets');
        }

        if (attrs.ability_immunities && (attrs.ability_immunities as string[]).length > 0) {
            parts.push(`Immune to: ${(attrs.ability_immunities as string[]).join(', ')}`);
        }

        if (typeof attrs.description === 'string' && attrs.description) {
            parts.push(attrs.description);
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
                            let isBlocked = false;
                            let blockReason: 'race' | 'hands_too_low' | 'hands_overflow' | 'slots_full' | null = null;

                            if (!isSelected && selectedInitialKeywords.length >= 2) {
                                isBlocked = true;
                                blockReason = 'slots_full';
                            } else if (!isSelected) {
                                if (keyword.category === 'creature') {
                                    const alreadyHasCreature = selectedInitialKeywords.some((n: string) => {
                                        const kw = allKeywordsData.find((k: any) => k.name === n);
                                        return kw?.category === 'creature';
                                    });
                                    if (alreadyHasCreature) {
                                        isBlocked = true;
                                        blockReason = 'race';
                                    }
                                    if (!isBlocked && keyword.properties?.max_hands != null) {
                                        const handsUsed = selectedInitialKeywords.reduce((sum: number, n: string) => {
                                            const kw = allKeywordsData.find((k: any) => k.name === n);
                                            return kw?.category === 'weapon' ? sum + (kw.properties?.hands ?? 1) : sum;
                                        }, 0);
                                        if (handsUsed > keyword.properties.max_hands) {
                                            isBlocked = true;
                                            blockReason = 'hands_too_low';
                                        }
                                    }
                                } else if (keyword.category === 'weapon') {
                                    const newHands: number = keyword.properties?.hands ?? 1;
                                    const creatureKw = selectedInitialKeywords
                                        .map((n: string) => allKeywordsData.find((k: any) => k.name === n))
                                        .find((k: any) => k?.category === 'creature' && k.properties?.max_hands != null);
                                    const effectiveMaxHands: number = creatureKw ? creatureKw.properties.max_hands : 2;
                                    const handsUsed = selectedInitialKeywords.reduce((sum: number, n: string) => {
                                        const kw = allKeywordsData.find((k: any) => k.name === n);
                                        return kw?.category === 'weapon' ? sum + (kw.properties?.hands ?? 1) : sum;
                                    }, 0);
                                    if (handsUsed + newHands > effectiveMaxHands) {
                                        isBlocked = true;
                                        blockReason = 'hands_overflow';
                                    }
                                }
                            }

                            const redAttrKeys: string[] =
                                blockReason === 'hands_too_low' ? ['max_hands'] :
                                blockReason === 'hands_overflow' ? ['hands'] :
                                [];

                            return (
                                <button
                                    key={keyword.name}
                                    onClick={() => handleInitialKeywordToggle(keyword.name)}
                                    disabled={isBlocked}
                                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                                        isSelected 
                                            ? 'border-green-500 bg-green-900 bg-opacity-30' 
                                            : 'border-gray-600 bg-gray-800 hover:border-gray-400'
                                    } ${isBlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-2xl font-bold capitalize">{keyword.name}</h3>
                                        <span className="text-sm px-3 py-1 rounded bg-gray-700">
                                            {keyword.category} • Rarity {keyword.rarity}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-300">{renderKeywordAttributes(keyword, redAttrKeys)}</div>
                                </button>
                            );
                        })}
                    </div>
                    
                    {tieredKeywords.length > 0 && (
                        <div className="mb-8 p-4 border border-yellow-700 bg-yellow-900 bg-opacity-20 rounded-lg">
                            <h3 className="text-lg font-bold text-yellow-400 mb-1">Destined for Depth {TIER_UP_DEPTH}</h3>
                            <p className="text-sm text-gray-400 mb-3">
                                These keywords are pre-ordained to join the boss at depth {TIER_UP_DEPTH}. They will not appear before then — use that time to prepare.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {tieredKeywords.map(kwName => {
                                    const kw = allKeywordsData.find((k: any) => k.name === kwName);
                                    return kw ? (
                                        <div key={kwName} className="p-3 border border-yellow-700 rounded bg-gray-800">
                                            <div className="font-bold capitalize">{kw.name}</div>
                                            <div className="text-xs text-gray-400">{kw.category} · Rarity {kw.rarity}</div>
                                            <div className="text-xs text-gray-300 mt-1">{formatKeywordAttributes(kw)}</div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

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
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={async () => { await PlayerService.resetPlayer('quit'); onExit(); }}>Surrender</button>

            {/* Depth counter */}
            {player && (() => {
                const t = Math.min((depth - 1) / 9, 1);
                const orange = Math.round(255 * t);
                const red = Math.round(180 * t);
                const glowSpread = Math.round(4 + t * 20);
                const glowBlur = Math.round(8 + t * 32);
                const flickerAnim = t > 0.3 ? 'depth-flicker' : undefined;
                return (
                    <div
                        className="z-10 absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none"
                        style={{
                            textShadow: t > 0
                                ? `0 0 ${glowBlur / 2}px rgba(255,${255 - orange},0,${0.6 + t * 0.4}), 0 0 ${glowBlur}px rgba(255,${100 - red},0,${0.4 + t * 0.4}), 0 0 ${glowSpread * 2}px rgba(200,0,0,${t * 0.5})`
                                : undefined,
                            animation: flickerAnim ? 'depthFlicker 1.8s ease-in-out infinite alternate' : undefined,
                        }}
                    >
                        <span
                            className="text-xs uppercase tracking-widest font-semibold"
                            style={{ color: `rgba(255, ${Math.round(200 - orange * 0.6)}, ${Math.round(180 - orange)}, 0.85)` }}
                        >
                            Depth
                        </span>
                        <span
                            className="text-4xl font-black leading-none"
                            style={{
                                color: `rgb(255, ${Math.round(220 - orange * 0.8)}, ${Math.round(80 - 80 * t)})`,
                            }}
                        >
                            {depth}
                        </span>
                    </div>
                );
            })()}
            <div className="w-3/4 h-3/4 border-4 border-dashed border-gray-400 flex flex-col">
            <div className="h-full flex items-center justify-center relative">
                <div id="game-background" className="absolute inset-0 -z-1 flex flex-col">
                    <div className="w-full flex-1 bg-gradient-to-b from-blue-900 to-orange-500"></div>
                    <div className="w-full bg-gradient-to-t from-green-700 to-green-900" style={{ height: `${grassHeight}%` }}></div>
                </div>
                <div id="game-panels" className="absolute inset-0 w-full h-full flex z-10">
                    {/* Combat effect overlay — covers the full battle area */}
                    {activeEffect && (
                        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                            {activeEffect.type === 'whirlwind' && [0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        top: `${24 + i * 13}%`,
                                        left: 0,
                                        right: 0,
                                        height: '3px',
                                        background: 'linear-gradient(to right, transparent 0%, rgba(180,220,255,0) 8%, rgba(180,220,255,0.85) 32%, rgba(255,255,255,1) 50%, rgba(180,220,255,0.85) 68%, rgba(180,220,255,0) 92%, transparent 100%)',
                                        transform: `rotate(${-20 + i * 13}deg)`,
                                        animation: `${activeEffect.direction === 'ltr' ? 'slashSweepLtr' : 'slashSweepRtl'} 0.38s ease-out ${i * 0.07}s both`,
                                    }}
                                />
                            ))}
                            {activeEffect.type === 'smash' && [0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        top: '65%',
                                        left: activeEffect.direction === 'ltr' ? '73%' : '27%',
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        border: `${3 - i}px solid rgba(255,${150 + i * 30},${30 + i * 50},${0.9 - i * 0.25})`,
                                        animation: `shockwaveExpand 0.65s ease-out ${i * 0.15}s both`,
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    <div id="left-panel" className="flex-[2] min-w-0 h-full flex flex-col items-center justify-end p-4">
                        <div className="w-full flex flex-col items-center justify-end">
                            <ShakeAnimation 
                                isShaking={playerShaking} 
                                duration={500} 
                                intensity={10}
                                onComplete={() => setPlayerShaking(false)}
                            >
                                {/* scaleX(-1) mirrors the left-facing compositor so the player faces right */}
                                <div style={{ transform: 'scaleX(-1)', display: 'inline-block', marginBottom: '4rem' }}>
                                    <CreatureCompositor
                                        keywords={player?.keywords ?? []}
                                        animStyle={playerCombatAnim === 'whirlwind'
                                            ? { animation: 'whirlwindSpin 0.7s ease-in-out' }
                                            : playerCombatAnim === 'smash'
                                            ? { animation: 'smashSlam 0.8s ease-in-out' }
                                            : isFlying
                                            ? { animation: 'flyFloat 2s ease-in-out infinite' }
                                            : {}}
                                    />
                                </div>
                            </ShakeAnimation>
                        </div>
                    </div>
                    <div id="center-panel" className="flex-1 min-w-0 h-full flex flex-col items-center justify-center">
                    </div>
                    <div id="right-panel" className="flex-[2] min-w-0 h-full flex flex-col items-center justify-end p-4 relative">
                        {/* Tier-up countdown — upper right of boss area */}
                        {tieredKeywords.length > 0 && (
                            <div className="absolute top-2 right-2 text-right text-sm border border-yellow-700 bg-gray-900 bg-opacity-90 rounded-lg px-3 py-2 max-w-[190px] z-10">
                                <div className="text-yellow-400 font-semibold mb-1">
                                    {depth < TIER_UP_DEPTH
                                        ? `${TIER_UP_DEPTH - depth} descent${TIER_UP_DEPTH - depth === 1 ? '' : 's'} until:`
                                        : 'Arriving now:'}
                                </div>
                                {tieredKeywords.map(kw => (
                                    <div key={kw} className="text-gray-200 capitalize">{kw}</div>
                                ))}
                            </div>
                        )}
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
                                <ShakeAnimation 
                                    isShaking={bossShaking || bossDying} 
                                    duration={bossDying ? 5000 : 500}
                                    intensity={10}
                                    onComplete={() => {
                                        setBossShaking(false);
                                    }}
                                >
                                    <div style={{
                                        opacity: bossDying ? 0 : 1,
                                        transition: 'opacity 5000ms',
                                        marginBottom: '4rem',
                                    }}>
                                        <CreatureCompositor
                                            keywords={bossKeywords}
                                            animStyle={bossCombatAnim === 'whirlwind'
                                                ? { animation: 'whirlwindSpin 0.7s ease-in-out' }
                                                : bossCombatAnim === 'smash'
                                                ? { animation: 'smashSlam 0.8s ease-in-out' }
                                                : isBossWebbed
                                                ? { animation: 'webPulse 1.5s ease-in-out infinite' }
                                                : {}}
                                        />
                                    </div>
                                </ShakeAnimation>
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
                        {boss && (isDead(boss, bossKeywordData) || bossDying) ? (
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
                                {forcedPlayerAction && (
                                    <div className="shrink-0 px-3 h-24 rounded-lg border-2 border-yellow-500 bg-yellow-900 bg-opacity-40 flex flex-col items-center justify-center text-yellow-300 text-xs font-semibold gap-1">
                                        <span className="uppercase tracking-widest text-yellow-500" style={{fontSize:'0.6rem'}}>Forced</span>
                                        <span className="text-sm capitalize">{forcedPlayerAction}</span>
                                    </div>
                                )}
                                <div 
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== 'attack')
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40' 
                                            : 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600'
                                    }`}
                                    onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === 'attack') && handleAction('attack')}
                                >
                                    Attack
                                </div>
                                <div
                                    className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                        actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== 'guard')
                                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                            : 'bg-yellow-900 hover:bg-yellow-800 active:bg-yellow-700'
                                    }`}
                                    onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === 'guard') && handleAction('guard')}
                                >
                                    Guard
                                </div>
                                {physicalAbilities.map((ability) => (
                                    <div
                                        key={ability}
                                        className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                            actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== ability)
                                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                                : 'bg-orange-900 hover:bg-orange-800 active:bg-orange-700'
                                        }`}
                                        onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === ability) && handleAction(ability)}
                                    >
                                        {formatSpellName(ability)}
                                    </div>
                                ))}
                                {activeAbilities.map((ability) => {
                                    const cooldownTurns = ((player?.cooldowns?.[ability] ?? 0) as number);
                                    const onCooldown = cooldownTurns > 0;
                                    const abilityDisabled = actionInProgress || bossDying || onCooldown || (forcedPlayerAction != null && forcedPlayerAction !== ability);
                                    return (
                                        <div
                                            key={ability}
                                            className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex flex-col items-center justify-center cursor-pointer ${
                                                abilityDisabled
                                                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                                    : 'bg-teal-900 hover:bg-teal-800 active:bg-teal-700'
                                            }`}
                                            onClick={() => !abilityDisabled && handleAction(ability)}
                                        >
                                            <span>{formatSpellName(ability)}</span>
                                            {onCooldown && <span className="text-xs mt-1 opacity-80">{cooldownTurns} turn{cooldownTurns !== 1 ? 's' : ''}</span>}
                                        </div>
                                    );
                                })}
                                {canCast && (
                                    <div
                                        className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                            actionInProgress || bossDying || (forcedPlayerAction && !forcedPlayerAction.startsWith('cast'))
                                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                                : 'bg-purple-800 hover:bg-purple-700 active:bg-purple-600'
                                        }`}
                                        onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction.startsWith('cast')) && setShowCastMenu(true)}
                                    >
                                        Cast
                                    </div>
                                )}
                                {visibleActionBarSpells.map((spell) => (
                                    <div
                                        key={spell}
                                        className={`w-48 h-24 rounded-lg border-2 border-gray-400 flex items-center justify-center cursor-pointer ${
                                            actionInProgress || bossDying || (forcedPlayerAction && forcedPlayerAction !== `cast:${spell}`)
                                                ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-40'
                                                : 'bg-blue-800 hover:bg-blue-700 active:bg-blue-600'
                                        }`}
                                        onClick={() => !actionInProgress && !bossDying && (!forcedPlayerAction || forcedPlayerAction === `cast:${spell}`) && handleAction(`cast:${spell}`)}
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
                            placeholder="Search powers..."
                            value={statusSearch}
                            onChange={(e) => setStatusSearch(e.target.value)}
                            className="w-full mb-4 px-4 py-2 rounded bg-gray-900 border border-gray-600 text-white"
                        />

                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                            {/* Summary — always shown on page 1, hidden when searching/paginating into keywords */}
                            {statusPage === 1 && !statusSearch && (
                                <div className="bg-gray-700 border border-cyan-700 rounded-lg px-4 py-3 space-y-2">
                                    {playerStatusData.summaryRows.map((row, idx) => (
                                        <div
                                            key={`summary-${row.label}-${idx}`}
                                            className="flex justify-between gap-4"
                                        >
                                            <span className="font-semibold text-cyan-300 shrink-0">{row.label}</span>
                                            <span className="text-gray-100 text-right break-words">{row.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Keywords */}
                            {paginatedKeywordRows.length === 0 && filteredKeywordRows.length === 0 && statusSearch ? (
                                <div className="text-gray-400 text-center py-8">No powers match your search.</div>
                            ) : (
                                paginatedKeywordRows.map((row, idx) => (
                                    <div
                                        key={`keyword-${row.label}-${idx}`}
                                        className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 relative"
                                    >
                                        {row.count > 1 && (
                                            <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded">
                                                x{row.count}
                                            </span>
                                        )}
                                        <div className="text-lg font-semibold capitalize mb-1">{row.label}</div>
                                        <div className="text-sm text-gray-200 break-words">{row.value}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {statusTotalPages > 1 && (
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
                        )}
                    </div>
                </div>
            )}

            {/* Keyword Selection Modal */}
            {showKeywordSelection && boss && (
                <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border-4 border-gray-400 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                        {!showRemoveKeywordPanel ? (
                            <>
                                <h2 className="text-3xl font-bold pt-8 px-8 pb-4 text-center shrink-0">Choose a Power to Absorb</h2>
                                <div className="overflow-y-auto px-8 flex-1 min-h-0">
                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                        {boss.keywords && boss.keywords.map((keywordName: string) => {
                                            const keywordData = allKeywordsData.find(kw => kw.name === keywordName);
                                            const weaponConflict = keywordData ? getWeaponConflict(keywordData) : null;
                                            const raceConflict = keywordData ? getRaceConflict(keywordData) : null;
                                            const derivedFrom = keywordData?.category === 'passive' ? getBossKeywordDerivedFrom(keywordName) : null;
                                            const hasConflict = !!(weaponConflict || raceConflict);
                                            return (
                                                <button
                                                    key={keywordName}
                                                    onClick={() => handleKeywordSelection(keywordName)}
                                                    className={`bg-gray-700 hover:bg-gray-600 border-2 rounded-lg p-4 text-left transition-colors ${hasConflict ? 'border-yellow-600' : 'border-gray-500'}`}
                                                >
                                                    <div className="text-xl font-semibold capitalize mb-2">{keywordName}</div>
                                                    {keywordData && (
                                                        <div className="text-sm text-gray-300">{renderKeywordAttributes(keywordData)}</div>
                                                    )}
                                                    {derivedFrom && (
                                                        <div className="mt-2 text-xs text-yellow-400 italic">↳ Derived from {derivedFrom} — boss will re-acquire</div>
                                                    )}
                                                    {weaponConflict && (
                                                        <div className="mt-2 text-xs text-yellow-300">⚠ {weaponConflict}</div>
                                                    )}
                                                    {raceConflict && (
                                                        <div className="mt-2 text-xs text-yellow-300">⚠ {raceConflict}</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {boss.derived_passives && boss.derived_passives.length > 0 && (
                                        <div className="pb-4">
                                            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Derived passives — steal the primary keyword to acquire</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {boss.derived_passives.map((passiveName: string) => {
                                                    const passiveData = allKeywordsData.find(kw => kw.name === passiveName);
                                                    return (
                                                        <div
                                                            key={passiveName}
                                                            className="bg-gray-800 border border-gray-600 rounded-lg p-3 opacity-60 cursor-default"
                                                        >
                                                            <div className="text-sm font-semibold capitalize text-gray-400 mb-1">{passiveName}</div>
                                                            {passiveData && (
                                                                <div className="text-xs text-gray-500">{formatKeywordAttributes(passiveData)}</div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {player && ((player.explicit_keywords?.length ?? 0) > 0 || (player.keywords?.length ?? 0) > 0) && (
                                    <div className="px-8 pb-8 pt-4 border-t-2 border-gray-600 shrink-0">
                                        <p className="text-sm text-gray-300 mb-1">
                                            <span className="text-gray-400">Your Powers: </span>
                                            {(player.explicit_keywords || player.keywords).join(', ')}
                                        </p>
                                        {(player.derived_keywords?.length ?? 0) > 0 && (
                                            <p className="text-xs text-gray-500 mb-1">Derived: {player.derived_keywords.join(', ')}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mb-1">
                                            Hands: {player.equipped_hands ?? 0}/{player.max_hands ?? 2} &nbsp;|&nbsp; Race Slots: {player.race_count ?? 0}/{player.max_race_slots ?? 1}
                                        </p>
                                        <button
                                            onClick={() => setShowRemoveKeywordPanel(true)}
                                            className="mt-3 w-full py-2 rounded-lg border-2 border-red-700 text-red-400 hover:bg-red-900 hover:bg-opacity-30 transition-colors text-sm font-semibold"
                                        >
                                            Forget a Keyword Instead
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="pt-8 px-8 pb-4 shrink-0">
                                    <h2 className="text-3xl font-bold mb-2 text-center text-red-400">Forget a Keyword</h2>
                                    <p className="text-sm text-gray-400 text-center">Choose one of your keywords to permanently remove.</p>
                                </div>
                                <div className="overflow-y-auto px-8 flex-1 min-h-0">
                                    <div className="grid grid-cols-2 gap-4 pb-4">
                                        {player && (player.explicit_keywords || player.keywords).map((keywordName: string) => {
                                            const keywordData = allKeywordsData.find(kw => kw.name === keywordName);
                                            return (
                                                <button
                                                    key={keywordName}
                                                    onClick={() => handleRemoveKeywordSelection(keywordName)}
                                                    className="bg-gray-700 hover:bg-red-900 border-2 border-red-700 rounded-lg p-4 text-left transition-colors"
                                                >
                                                    <div className="text-xl font-semibold capitalize mb-2">{keywordName}</div>
                                                    {keywordData && (
                                                        <div className="text-sm text-gray-300">{renderKeywordAttributes(keywordData)}</div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="px-8 pb-8 pt-4 border-t-2 border-gray-600 flex justify-center shrink-0">
                                    <button
                                        onClick={() => setShowRemoveKeywordPanel(false)}
                                        className="px-6 py-2 rounded-lg border-2 border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors text-sm font-semibold"
                                    >
                                        ← Back to Absorb
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            {/* Race Conflict Modal */}
            {raceConflictPending && player && (() => {
                const newRaceData = allKeywordsData.find((kw: any) => kw.name === raceConflictPending.newRace);
                const currentRaceName = raceReplaceSelection || raceConflictPending.existingRaces[0] || '';
                const currentRaceData = currentRaceName ? allKeywordsData.find((kw: any) => kw.name === currentRaceName) : null;
                const explicitAfterSwap = (player.explicit_keywords || []).map((name: string) =>
                    name === currentRaceName ? raceConflictPending.newRace : name
                );
                // Mirror PlayerFactory.recalculate_stats max_hands logic exactly.
                const raceKeywordsAfterSwap = explicitAfterSwap
                    .map((name: string) => allKeywordsData.find((kw: any) => kw.name === name))
                    .filter((kw: any) => kw?.category === 'creature');
                let maxHandsFromRaces: number | null = null;
                raceKeywordsAfterSwap.forEach((kw: any) => {
                    const creatureHands = kw?.properties?.max_hands;
                    if (creatureHands != null) {
                        maxHandsFromRaces = (maxHandsFromRaces ?? 0) + creatureHands;
                    }
                });
                const postSwapMaxHands = maxHandsFromRaces == null ? 2 : maxHandsFromRaces;
                const equippedWeapons = (player.explicit_keywords || [])
                    .map((kw: string) => allKeywordsData.find((k: any) => k.name === kw))
                    .filter((kw: any) => kw?.category === 'weapon');
                const discardedHands = raceWeaponDiscardSelection.reduce((sum: number, name: string) => {
                    const kw = allKeywordsData.find((k: any) => k.name === name);
                    return sum + (kw?.properties?.hands ?? 1);
                }, 0);
                const requiredHandsToFree = Math.max(0, (player.equipped_hands ?? 0) - postSwapMaxHands);
                const hasEnoughDiscards = discardedHands >= requiredHandsToFree;
                const canConfirmSwap = !!currentRaceName && hasEnoughDiscards;
                return (
                    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 border-4 border-yellow-600 rounded-lg max-w-2xl w-full p-8">
                            <h2 className="text-2xl font-bold text-yellow-400 text-center mb-2">Race Conflict</h2>
                            <p className="text-gray-300 text-center text-sm mb-6">
                                You are at creature capacity. Choose which existing race to replace with the new one.
                                Either way, the boss loses this trait.
                            </p>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <button
                                    onClick={() => handleRaceConflictChoice('keep')}
                                    className="bg-gray-700 hover:bg-gray-600 border-2 border-gray-400 rounded-lg p-4 text-left transition-colors"
                                >
                                    <div className="text-xs text-gray-400 mb-1">Keep current</div>
                                    <div className="text-xl font-bold capitalize mb-2">Current races</div>
                                    <div className="text-xs text-gray-300">{raceConflictPending.existingRaces.join(', ') || 'None'}</div>
                                </button>
                                <div className="bg-gray-700 border-2 border-yellow-600 rounded-lg p-4 text-left">
                                    <div className="text-xs text-yellow-400 mb-1">Become new race</div>
                                    <div className="text-xl font-bold capitalize mb-2">{raceConflictPending.newRace}</div>
                                    {newRaceData && (
                                        <div className="text-xs text-gray-300 mb-3">{formatKeywordAttributes(newRaceData)}</div>
                                    )}
                                    <label className="text-xs text-gray-400 block mb-1">Replace this existing race:</label>
                                    <select
                                        value={currentRaceName}
                                        onChange={(e) => {
                                            setRaceReplaceSelection(e.target.value);
                                            setRaceWeaponDiscardSelection([]);
                                        }}
                                        className="w-full bg-gray-800 border border-gray-500 rounded px-2 py-1 text-sm"
                                    >
                                        {raceConflictPending.existingRaces.map((race: string) => (
                                            <option key={race} value={race}>{race}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {currentRaceData && requiredHandsToFree > 0 && (
                                <div className="mb-4 bg-gray-900 border border-orange-700 rounded p-3">
                                    <div className="text-sm text-orange-300 mb-2">
                                        Swapping {currentRaceName} {'->'} {raceConflictPending.newRace} reduces hand capacity to {postSwapMaxHands}.
                                        You must discard weapons freeing {requiredHandsToFree} hand{requiredHandsToFree !== 1 ? 's' : ''}.
                                    </div>
                                    <div className="space-y-2">
                                        {equippedWeapons.map((kw: any) => {
                                            const selected = raceWeaponDiscardSelection.includes(kw.name);
                                            return (
                                                <button
                                                    key={kw.name}
                                                    onClick={() => setRaceWeaponDiscardSelection(sel =>
                                                        selected ? sel.filter(n => n !== kw.name) : [...sel, kw.name]
                                                    )}
                                                    className={`w-full rounded border px-3 py-2 text-left ${selected ? 'bg-red-900 border-red-500' : 'bg-gray-700 border-gray-500'}`}
                                                >
                                                    <span className="capitalize font-semibold">{kw.name}</span>
                                                    <span className="text-xs text-gray-400 ml-2">{kw.properties?.hands ?? 1} hand{(kw.properties?.hands ?? 1) !== 1 ? 's' : ''}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-2">
                                        Selected discard frees {discardedHands}/{requiredHandsToFree} hands.
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setRaceConflictPending(null);
                                        setRaceWeaponDiscardSelection([]);
                                        setRaceReplaceSelection('');
                                    }}
                                    className="flex-1 py-2 rounded-lg border-2 border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleRaceConflictChoice('swap')}
                                    disabled={!canConfirmSwap}
                                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                                        canConfirmSwap
                                            ? 'bg-yellow-800 border-yellow-500 hover:bg-yellow-700 text-white'
                                            : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {canConfirmSwap ? 'Confirm Swap' : 'Select valid replacement/discards'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Weapon Conflict Modal */}
            {weaponConflictPending && player && (() => {
                const newWeaponData = allKeywordsData.find((kw: any) => kw.name === weaponConflictPending.newWeapon);
                const equippedWeapons = (player.explicit_keywords || [])
                    .map((kw: string) => allKeywordsData.find((k: any) => k.name === kw))
                    .filter((kw: any) => kw?.category === 'weapon');
                const discardedHands = weaponDiscardSelection.reduce((sum: number, name: string) => {
                    const kw = allKeywordsData.find((k: any) => k.name === name);
                    return sum + (kw?.properties?.hands ?? 1);
                }, 0);
                const willFit = (player.equipped_hands ?? 0) - discardedHands + weaponConflictPending.handsNeeded <= (player.max_hands ?? 2);
                return (
                    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800 border-4 border-orange-600 rounded-lg max-w-lg w-full p-8">
                            <h2 className="text-2xl font-bold text-orange-400 text-center mb-1">Not Enough Hands</h2>
                            <p className="text-gray-300 text-center text-sm mb-1">
                                <span className="font-semibold capitalize">{weaponConflictPending.newWeapon}</span> needs {weaponConflictPending.handsNeeded} hand{weaponConflictPending.handsNeeded !== 1 ? 's' : ''}.
                                You have {player.equipped_hands ?? 0}/{player.max_hands ?? 2} used.
                            </p>
                            <p className="text-gray-400 text-center text-xs mb-4">Select weapons to drop until you have room.</p>
                            <div className="space-y-2 mb-4">
                                {equippedWeapons.map((kw: any) => {
                                    const selected = weaponDiscardSelection.includes(kw.name);
                                    return (
                                        <button
                                            key={kw.name}
                                            onClick={() => setWeaponDiscardSelection(sel =>
                                                selected ? sel.filter(n => n !== kw.name) : [...sel, kw.name]
                                            )}
                                            className={`w-full rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                                                selected
                                                    ? 'bg-red-900 border-red-500 text-white'
                                                    : 'bg-gray-700 border-gray-500 hover:bg-gray-600'
                                            }`}
                                        >
                                            <span className="font-semibold capitalize">{kw.name}</span>
                                            <span className="text-xs text-gray-400 ml-2">{kw.properties?.hands ?? 1} hand{(kw.properties?.hands ?? 1) !== 1 ? 's' : ''}</span>
                                            {selected && <span className="float-right text-red-400 text-xs font-bold">DROP</span>}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setWeaponConflictPending(null); setWeaponDiscardSelection([]); }}
                                    className="flex-1 py-2 rounded-lg border-2 border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleWeaponConflictConfirm}
                                    disabled={!willFit}
                                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                                        willFit
                                            ? 'bg-orange-800 border-orange-500 hover:bg-orange-700 text-white'
                                            : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {willFit ? `Equip ${weaponConflictPending.newWeapon}` : `Need ${weaponConflictPending.handsNeeded - ((player.max_hands ?? 2) - (player.equipped_hands ?? 0) + discardedHands)} more hand${weaponConflictPending.handsNeeded - ((player.max_hands ?? 2) - (player.equipped_hands ?? 0) + discardedHands) !== 1 ? 's' : ''} freed`}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Player Death Modal */}
            {playerDead && (
                <PlayerDeathModal handlePlayerDeath={handlePlayerDeath} />
            )}
        </div>);
};

export default Game;