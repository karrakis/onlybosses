import React, { useEffect, useMemo, useState } from 'react';
import { BossService, Boss } from '../services/BossService';
import { PlayerService, Player } from '../services/PlayerService';
import takeAction from '../actions/takeAction';
import CreatureCompositor, { compositeCreature } from './CreatureCompositor';
import ShakeAnimation from './ShakeAnimation';
import Tooltip from './Tooltip';
import { getPassiveDescription } from '../data/passiveDescriptions';
import PlayerDeathModal from './modals/PlayerDeath';
import CastMenuModal from './modals/CastMenuModal';
import KeywordSelectionModal from './modals/KeywordSelectionModal';
import PlayerStatusModal from './modals/PlayerStatusModal';
import RaceConflictModal from './modals/RaceConflictModal';
import WeaponConflictModal from './modals/WeaponConflictModal';
import BottomPanel from './BottomPanel';
import InitialKeywordSelectionScreen from './InitialKeywordSelectionScreen';
import DepthCounter from './DepthCounter';

const WING_SVG = '/assets/keywords/wing.svg';
const WING_SVG_STATIC = '/assets/keywords/wing.svg?static=1';
const WING_SVG_FLAPX = '/assets/keywords/wing.svg?flapx=1';

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
    const [playerCombatAnim, setPlayerCombatAnim] = useState<'whirlwind' | 'smash' | 'fly' | null>(null);
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

    const renderCreatureWithWings = (keywords: string[], animStyle: React.CSSProperties = {}) => {
        const { hasWings, goatBody, wingsBackground, wingAnchorX, wingAnchorY } = compositeCreature(keywords);
        const wingAsset = wingsBackground ? WING_SVG_STATIC : WING_SVG;

        const wingStyleRight: React.CSSProperties = goatBody ? {
            position: 'absolute', width: 350, height: 330,
            left: -24, top: -33,
            transformOrigin: '28px 140px',
            transform: 'rotate(-40deg) rotateY(70deg)',
            pointerEvents: 'none',
        } : {
            position: 'absolute', width: 350, height: 330,
            left: wingAnchorX - 30, top: wingAnchorY - 220,
            pointerEvents: 'none',
        };

        const wingStyleLeft: React.CSSProperties = goatBody ? {
            position: 'absolute', width: 350, height: 330,
            left: 5, top: -33,
            transformOrigin: '28px 140px',
            transform: 'scaleX(-1) scaleY(-1) rotate(153deg) rotateY(-70deg)',
            pointerEvents: 'none',
        } : {
            position: 'absolute', width: 350, height: 330,
            left: wingAnchorX - 320, top: wingAnchorY - 220,
            transform: 'scaleX(-1)',
            pointerEvents: 'none',
        };

        return (
            <div style={{ position: 'relative', width: 160, height: 420, overflow: 'visible' }}>
                {hasWings && goatBody && (
                    <object type="image/svg+xml" data={WING_SVG_FLAPX} aria-label="right wing"
                        style={{ ...wingStyleRight, zIndex: 0 }}
                    />
                )}

                <div style={{ position: 'absolute', inset: 0, perspective: '800px', ...animStyle }}>
                    {hasWings && !goatBody && (
                        <>
                            <object type="image/svg+xml" data={wingAsset} aria-label="right wing"
                                style={{ ...wingStyleRight, zIndex: 0 }}
                            />
                            <object type="image/svg+xml" data={wingAsset} aria-label="left wing"
                                style={{ ...wingStyleLeft, zIndex: 0 }}
                            />
                        </>
                    )}

                    <div style={{ position: 'absolute', left: 0, top: 0, zIndex: 10 }}>
                        <CreatureCompositor keywords={keywords} />
                    </div>
                </div>

                {hasWings && goatBody && (
                    <object type="image/svg+xml" data={WING_SVG_FLAPX} aria-label="left wing"
                        style={{ ...wingStyleLeft, zIndex: 20 }}
                    />
                )}
            </div>
        );
    };

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
        if (playerBase === 'fly') {
            setPlayerCombatAnim('fly');
            setTimeout(() => setPlayerCombatAnim(null), 1200);
        } else if (playerBase === 'whirlwind' || playerBase === 'smash') {
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
            <InitialKeywordSelectionScreen
                initialKeywordOptions={initialKeywordOptions}
                selectedInitialKeywords={selectedInitialKeywords}
                allKeywordsData={allKeywordsData}
                tieredKeywords={tieredKeywords}
                tierUpDepth={TIER_UP_DEPTH}
                loading={loading}
                onToggleKeyword={handleInitialKeywordToggle}
                onConfirm={handleInitialKeywordConfirm}
                renderKeywordAttributes={renderKeywordAttributes}
                formatKeywordAttributes={formatKeywordAttributes}
            />
        );
    }

    return (<div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-white relative">
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={async () => { await PlayerService.resetPlayer('quit'); onExit(); }}>Surrender</button>

            {/* Depth counter */}
            {player && <DepthCounter depth={depth} />}
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
                                    {renderCreatureWithWings(
                                        player?.keywords ?? [],
                                        playerCombatAnim === 'whirlwind' ? { animation: 'whirlwindSpin 0.7s ease-in-out' }
                                        : playerCombatAnim === 'smash'   ? { animation: 'smashSlam 0.8s ease-in-out' }
                                        : playerCombatAnim === 'fly'     ? { animation: 'anim-fly 1.1s ease-in-out both' }
                                        : isFlying                        ? { animation: 'flyFloat 2s ease-in-out infinite' }
                                        : {}
                                    )}
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
                                        {renderCreatureWithWings(
                                            bossKeywords,
                                            bossCombatAnim === 'whirlwind'
                                                ? { animation: 'whirlwindSpin 0.7s ease-in-out' }
                                                : bossCombatAnim === 'smash'
                                                ? { animation: 'smashSlam 0.8s ease-in-out' }
                                                : isBossWebbed
                                                ? { animation: 'webPulse 1.5s ease-in-out infinite' }
                                                : {}
                                        )}
                                    </div>
                                </ShakeAnimation>
                            </div>
                        )}
                    </div> 
                </div>
            </div>
                <BottomPanel
                    player={player}
                    boss={boss}
                    isBossDefeated={isDead(boss, bossKeywordData)}
                    bossDying={bossDying}
                    descendClicked={descendClicked}
                    actionInProgress={actionInProgress}
                    forcedPlayerAction={forcedPlayerAction}
                    physicalAbilities={physicalAbilities}
                    activeAbilities={activeAbilities}
                    canCast={canCast}
                    visibleActionBarSpells={visibleActionBarSpells}
                    formatSpellName={formatSpellName}
                    handleAction={handleAction}
                    onOpenCastMenu={() => setShowCastMenu(true)}
                    onDescend={handleDescend}
                    onShowPlayerStatus={() => setShowPlayerStatus(true)}
                />
            </div>
            
            <CastMenuModal
                show={showCastMenu}
                onClose={() => setShowCastMenu(false)}
                spellSearch={spellSearch}
                setSpellSearch={setSpellSearch}
                sortedSpells={sortedSpells}
                favoriteSpells={favoriteSpells}
                actionBarSpells={actionBarSpells}
                formatSpellName={formatSpellName}
                toggleFavoriteSpell={toggleFavoriteSpell}
                addSpellToActionBar={addSpellToActionBar}
            />

            <PlayerStatusModal
                show={showPlayerStatus}
                onClose={() => setShowPlayerStatus(false)}
                statusSearch={statusSearch}
                setStatusSearch={setStatusSearch}
                statusPage={statusPage}
                setStatusPage={setStatusPage}
                statusTotalPages={statusTotalPages}
                summaryRows={playerStatusData.summaryRows}
                paginatedKeywordRows={paginatedKeywordRows}
                filteredKeywordRows={filteredKeywordRows}
            />

            <KeywordSelectionModal
                show={showKeywordSelection}
                boss={boss}
                player={player}
                showRemoveKeywordPanel={showRemoveKeywordPanel}
                setShowRemoveKeywordPanel={setShowRemoveKeywordPanel}
                allKeywordsData={allKeywordsData}
                getWeaponConflict={getWeaponConflict}
                getRaceConflict={getRaceConflict}
                getBossKeywordDerivedFrom={getBossKeywordDerivedFrom}
                handleKeywordSelection={handleKeywordSelection}
                handleRemoveKeywordSelection={handleRemoveKeywordSelection}
                renderKeywordAttributes={renderKeywordAttributes}
                formatKeywordAttributes={formatKeywordAttributes}
            />
            
            <RaceConflictModal
                raceConflictPending={raceConflictPending}
                player={player}
                allKeywordsData={allKeywordsData}
                raceReplaceSelection={raceReplaceSelection}
                setRaceReplaceSelection={setRaceReplaceSelection}
                raceWeaponDiscardSelection={raceWeaponDiscardSelection}
                setRaceWeaponDiscardSelection={setRaceWeaponDiscardSelection}
                formatKeywordAttributes={formatKeywordAttributes}
                onKeep={() => handleRaceConflictChoice('keep')}
                onSwap={() => handleRaceConflictChoice('swap')}
                onCancel={() => {
                    setRaceConflictPending(null);
                    setRaceWeaponDiscardSelection([]);
                    setRaceReplaceSelection('');
                }}
            />

            <WeaponConflictModal
                weaponConflictPending={weaponConflictPending}
                player={player}
                allKeywordsData={allKeywordsData}
                weaponDiscardSelection={weaponDiscardSelection}
                setWeaponDiscardSelection={setWeaponDiscardSelection}
                onCancel={() => {
                    setWeaponConflictPending(null);
                    setWeaponDiscardSelection([]);
                }}
                onConfirm={handleWeaponConflictConfirm}
            />

            {/* Player Death Modal */}
            {playerDead && (
                <PlayerDeathModal handlePlayerDeath={handlePlayerDeath} />
            )}
        </div>);
};

export default Game;