import React from 'react';

interface CastMenuModalProps {
    show: boolean;
    onClose: () => void;
    spellSearch: string;
    setSpellSearch: (value: string) => void;
    sortedSpells: string[];
    favoriteSpells: string[];
    actionBarSpells: string[];
    formatSpellName: (spell: string) => string;
    toggleFavoriteSpell: (spell: string) => void;
    addSpellToActionBar: (spell: string) => void;
}

const CastMenuModal: React.FC<CastMenuModalProps> = ({
    show,
    onClose,
    spellSearch,
    setSpellSearch,
    sortedSpells,
    favoriteSpells,
    actionBarSpells,
    formatSpellName,
    toggleFavoriteSpell,
    addSpellToActionBar,
}) => {
    if (!show) return null;

    return (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 border-4 border-purple-500 rounded-lg p-8 w-full max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">Cast</h2>
                    <button
                        onClick={onClose}
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
    );
};

export default CastMenuModal;
