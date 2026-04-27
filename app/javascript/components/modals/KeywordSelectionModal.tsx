import React from 'react';
import { Boss } from '../../services/BossService';
import { Player } from '../../services/PlayerService';

interface KeywordSelectionModalProps {
    show: boolean;
    boss: Boss | null;
    player: Player | null;
    showRemoveKeywordPanel: boolean;
    setShowRemoveKeywordPanel: (value: boolean) => void;
    allKeywordsData: any[];
    getWeaponConflict: (keywordData: any) => string | null;
    getRaceConflict: (keywordData: any) => string | null;
    getBossKeywordDerivedFrom: (passiveName: string) => string | null;
    handleKeywordSelection: (selectedKeyword: string) => void;
    handleRemoveKeywordSelection: (keywordToRemove: string) => void;
    handleFeedToCauldron?: (keywordToFeed: string) => void;
    selectionInProgress?: boolean;
    renderKeywordAttributes: (keyword: any, redAttrKeys?: string[]) => React.ReactNode;
    formatKeywordAttributes: (keyword: any) => string;
}

const KeywordSelectionModal: React.FC<KeywordSelectionModalProps> = ({
    show,
    boss,
    player,
    showRemoveKeywordPanel,
    setShowRemoveKeywordPanel,
    allKeywordsData,
    getWeaponConflict,
    getRaceConflict,
    getBossKeywordDerivedFrom,
    handleKeywordSelection,
    handleRemoveKeywordSelection,
    handleFeedToCauldron,
    selectionInProgress,
    renderKeywordAttributes,
    formatKeywordAttributes,
}) => {
    if (!show || !boss) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 border-4 border-gray-400 rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
                {!showRemoveKeywordPanel ? (
                    <>
                        <h2 className="text-3xl font-bold pt-8 px-8 pb-4 text-center shrink-0">Choose a Power to Absorb</h2>
                        <div className="overflow-y-auto px-8 flex-1 min-h-0">
                            <div className="space-y-3 pb-4">
                                {boss.keywords && boss.keywords.map((keywordName: string) => {
                                    const keywordData = allKeywordsData.find(kw => kw.name === keywordName);
                                    const weaponConflict = keywordData ? getWeaponConflict(keywordData) : null;
                                    const raceConflict = keywordData ? getRaceConflict(keywordData) : null;
                                    const derivedFrom = keywordData?.category === 'passive' ? getBossKeywordDerivedFrom(keywordName) : null;
                                    const hasConflict = !!(weaponConflict || raceConflict);
                                    return (
                                        <div key={keywordName} className="flex gap-2">
                                            <button
                                                onClick={() => handleKeywordSelection(keywordName)}
                                                disabled={selectionInProgress}
                                                className={`flex-1 bg-gray-700 hover:bg-gray-600 border-2 rounded-lg p-4 text-left transition-colors ${hasConflict ? 'border-yellow-600' : 'border-gray-500'}`}
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
                                            {handleFeedToCauldron && (
                                                <button
                                                    onClick={() => handleFeedToCauldron(keywordName)}
                                                    disabled={selectionInProgress}
                                                    className="px-3 py-2 bg-purple-800 hover:bg-purple-700 border-2 border-purple-600 rounded-lg text-purple-200 text-sm font-semibold transition-colors whitespace-nowrap self-start disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Feed this keyword to the cauldron"
                                                >
                                                    🔥 Feed
                                                </button>
                                            )}
                                        </div>
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
                                            disabled={selectionInProgress}
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
    );
};

export default KeywordSelectionModal;
