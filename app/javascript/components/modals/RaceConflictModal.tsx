import React from 'react';
import { Player } from '../../services/PlayerService';

interface RaceConflictPending {
    newRace: string;
    existingRaces: string[];
}

interface RaceConflictModalProps {
    raceConflictPending: RaceConflictPending | null;
    player: Player | null;
    allKeywordsData: any[];
    raceReplaceSelection: string;
    setRaceReplaceSelection: (value: string) => void;
    raceWeaponDiscardSelection: string[];
    setRaceWeaponDiscardSelection: React.Dispatch<React.SetStateAction<string[]>>;
    formatKeywordAttributes: (keyword: any) => string;
    onKeep: () => void;
    onSwap: () => void;
    onCancel: () => void;
}

const RaceConflictModal: React.FC<RaceConflictModalProps> = ({
    raceConflictPending,
    player,
    allKeywordsData,
    raceReplaceSelection,
    setRaceReplaceSelection,
    raceWeaponDiscardSelection,
    setRaceWeaponDiscardSelection,
    formatKeywordAttributes,
    onKeep,
    onSwap,
    onCancel,
}) => {
    if (!raceConflictPending || !player) return null;

    const newRaceData = allKeywordsData.find((kw: any) => kw.name === raceConflictPending.newRace);
    const currentRaceName = raceReplaceSelection || raceConflictPending.existingRaces[0] || '';
    const currentRaceData = currentRaceName ? allKeywordsData.find((kw: any) => kw.name === currentRaceName) : null;

    const explicitAfterSwap = (player.explicit_keywords || []).map((name: string) =>
        name === currentRaceName ? raceConflictPending.newRace : name
    );

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
                        onClick={onKeep}
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
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg border-2 border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSwap}
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
};

export default RaceConflictModal;
