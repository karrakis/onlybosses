import React from 'react';

interface PlayerDeathModalProps {
    handlePlayerDeath: () => void;
}

const PlayerDeathModal: React.FC<PlayerDeathModalProps> = ({ handlePlayerDeath }) => {
    return (
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
    );
}

export default PlayerDeathModal;