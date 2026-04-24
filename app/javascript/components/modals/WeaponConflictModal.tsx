import React from 'react';
import { Player } from '../../services/PlayerService';

interface WeaponConflictPending {
    newWeapon: string;
    handsNeeded: number;
}

interface WeaponConflictModalProps {
    weaponConflictPending: WeaponConflictPending | null;
    player: Player | null;
    allKeywordsData: any[];
    weaponDiscardSelection: string[];
    setWeaponDiscardSelection: React.Dispatch<React.SetStateAction<string[]>>;
    onCancel: () => void;
    onConfirm: () => void;
}

const WeaponConflictModal: React.FC<WeaponConflictModalProps> = ({
    weaponConflictPending,
    player,
    allKeywordsData,
    weaponDiscardSelection,
    setWeaponDiscardSelection,
    onCancel,
    onConfirm,
}) => {
    if (!weaponConflictPending || !player) return null;

    const equippedWeapons = (player.explicit_keywords || [])
        .map((kw: string) => allKeywordsData.find((k: any) => k.name === kw))
        .filter((kw: any) => kw?.category === 'weapon');

    const discardedHands = weaponDiscardSelection.reduce((sum: number, name: string) => {
        const kw = allKeywordsData.find((k: any) => k.name === name);
        return sum + (kw?.properties?.hands ?? 1);
    }, 0);

    const willFit = (player.equipped_hands ?? 0) - discardedHands + weaponConflictPending.handsNeeded <= (player.max_hands ?? 2);
    const handsStillNeeded = weaponConflictPending.handsNeeded - ((player.max_hands ?? 2) - (player.equipped_hands ?? 0) + discardedHands);

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
                        onClick={onCancel}
                        className="flex-1 py-2 rounded-lg border-2 border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!willFit}
                        className={`flex-1 py-2 rounded-lg border-2 text-sm font-semibold transition-colors ${
                            willFit
                                ? 'bg-orange-800 border-orange-500 hover:bg-orange-700 text-white'
                                : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        {willFit ? `Equip ${weaponConflictPending.newWeapon}` : `Need ${handsStillNeeded} more hand${handsStillNeeded !== 1 ? 's' : ''} freed`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WeaponConflictModal;
