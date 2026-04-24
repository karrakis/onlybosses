import React from 'react';

interface InitialKeywordSelectionScreenProps {
    initialKeywordOptions: any[];
    selectedInitialKeywords: string[];
    allKeywordsData: any[];
    tieredKeywords: string[];
    tierUpDepth: number;
    loading: boolean;
    onToggleKeyword: (keywordName: string) => void;
    onConfirm: () => void;
    renderKeywordAttributes: (keyword: any, redAttrKeys?: string[]) => React.ReactNode;
    formatKeywordAttributes: (keyword: any) => string;
}

const InitialKeywordSelectionScreen: React.FC<InitialKeywordSelectionScreenProps> = ({
    initialKeywordOptions,
    selectedInitialKeywords,
    allKeywordsData,
    tieredKeywords,
    tierUpDepth,
    loading,
    onToggleKeyword,
    onConfirm,
    renderKeywordAttributes,
    formatKeywordAttributes,
}) => {
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
                                onClick={() => onToggleKeyword(keyword.name)}
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
                        <h3 className="text-lg font-bold text-yellow-400 mb-1">Destined for Depth {tierUpDepth}</h3>
                        <p className="text-sm text-gray-400 mb-3">
                            These keywords are pre-ordained to join the boss at depth {tierUpDepth}. They will not appear before then — use that time to prepare.
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
                        onClick={onConfirm}
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
};

export default InitialKeywordSelectionScreen;
