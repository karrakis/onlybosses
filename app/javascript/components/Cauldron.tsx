import React, { useState, useEffect } from 'react';

interface CauldronProps {
  depth: number;
  cauldronStatus: {
    fed_count?: number;
    required_count?: number;
    is_ready?: boolean;
    fed_keywords?: string[];
  } | null;
  onSelectPassive: (passive: string) => void;
  formatPassiveDetails?: (passive: string) => string;
  disabled?: boolean;
}

export default function Cauldron({ depth, cauldronStatus, onSelectPassive, formatPassiveDetails, disabled }: CauldronProps) {
  const [showCraftingModal, setShowCraftingModal] = useState(false);
  const [availablePassives, setAvailablePassives] = useState<string[]>([]);
  const [rarityTier, setRarityTier] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cauldronStatus?.is_ready && !showCraftingModal) {
      // Auto-open the modal when cauldron is ready
      handleCraft();
    }
  }, [cauldronStatus?.is_ready]);

  const handleCraft = async () => {
    setLoading(true);
    try {
      const response = await fetch('/craft_passive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depth }),
      });
      const data = await response.json();
      if (response.ok) {
        setAvailablePassives(data.available_passives || []);
        setRarityTier(data.rarity_tier || 0);
        setShowCraftingModal(true);
      } else {
        console.error('Craft error:', data.error);
      }
    } catch (error) {
      console.error('Craft failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPassive = async (passive: string) => {
    try {
      const response = await fetch('/select_crafted_passive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: passive, depth }),
      });
      const data = await response.json();
      if (response.ok) {
        setShowCraftingModal(false);
        onSelectPassive(passive);
      } else {
        console.error('Select passive error:', data.error);
      }
    } catch (error) {
      console.error('Select passive failed:', error);
    }
  };

  if (!cauldronStatus) {
    return null;
  }

  const requiredCount = Math.max(0, Number(cauldronStatus.required_count || 0));
  const fedCount = Math.max(0, Number(cauldronStatus.fed_count || 0));
  const fedKeywords = Array.isArray(cauldronStatus.fed_keywords) ? cauldronStatus.fed_keywords : [];
  const isReady = Boolean(cauldronStatus.is_ready);

  if (requiredCount <= 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="text-sm font-semibold text-gray-400 mb-2">Cauldron</div>
      <div className="flex gap-2 items-center">
        {/* Render empty/filled slots */}
        <div className="flex gap-1">
          {Array.from({ length: requiredCount }).map((_, idx) => (
            <div
              key={idx}
              className={`w-6 h-6 border-2 rounded ${
                idx < fedCount
                  ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500'
                  : 'bg-gray-800 border-gray-600'
              }`}
              title={
                idx < fedKeywords.length
                  ? fedKeywords[idx]
                  : 'Empty slot'
              }
            />
          ))}
        </div>

        {/* Status text */}
        <span className="text-xs text-gray-400">
          {fedCount}/{requiredCount}
        </span>

        {/* Ready indicator */}
        {isReady && (
          <span className="text-xs font-semibold text-green-400 ml-2 animate-pulse">
            Ready to craft!
          </span>
        )}
      </div>

      {/* Crafting Modal */}
      {showCraftingModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCraftingModal(false)}
        >
          <div
            className="bg-gray-950 border-2 border-purple-600 rounded p-6 max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-purple-300 mb-4">
              Choose a Passive ({rarityTier ? `Tier ${rarityTier}` : 'Unknown'})
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                <div className="text-center text-gray-400">Loading passives...</div>
              ) : availablePassives.length > 0 ? (
                availablePassives.map((passive) => (
                  <button
                    key={passive}
                    onClick={() => handleSelectPassive(passive)}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-purple-500 hover:border-purple-300 rounded text-left transition-all text-purple-100"
                  >
                    <div className="text-lg font-semibold mb-2">
                      {passive.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </div>
                    <div className="text-sm text-gray-300 leading-snug">
                      {formatPassiveDetails?.(passive) || 'No special attributes'}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-gray-400">No passives available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
