import React, { useEffect, useState } from 'react';
import { BossService, Boss } from '../services/BossService';

interface GameProps {
    onExit: () => void;
}

const Game: React.FC<GameProps> = ({onExit}) => {
    const [boss, setBoss] = useState<Boss | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load the first boss (skeleton) when component mounts
        const loadBoss = async () => {
            try {
                setLoading(true);
                const generatedBoss = await BossService.generateBoss(['skeleton']);
                setBoss(generatedBoss);
                
                // If image is still generating, poll for updates
                if (generatedBoss.image_status === 'pending' || generatedBoss.image_status === 'generating') {
                    pollForImage(generatedBoss.id);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load boss');
            } finally {
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

            // Cleanup interval on unmount
            return () => clearInterval(interval);
        };

        loadBoss();
    }, []);

    return (<div className="w-screen h-screen flex flex-col items-center justify-center bg-transparent text-white relative">
            <button className="z-10 absolute top-4 right-4 border border-white rounded px-4 py-2" onClick={onExit}>Surrender</button>
            <div className="w-3/4 h-3/4 border-4 border-dashed border-gray-400 flex flex-col">
            <div className="h-full flex items-center justify-center">
                <div id="left-panel" className="w-1/3 h-full border-r-2 border-gray-400 flex flex-col items-center justify-center">
                    Left Panel
                </div>
                <div id="center-panel" className="w-1/5 h-full border-r-2 border-gray-400 flex flex-col items-center justify-center">
                    Center Panel
                </div>
                <div id="right-panel" className="w-1/3 h-full flex flex-col items-center justify-center p-4">
                    {loading && <div className="text-gray-400">Loading boss...</div>}
                    {error && <div className="text-red-400">Error: {error}</div>}
                    {boss && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            {boss.image_status === 'completed' && boss.image_url ? (
                                <img 
                                    src={boss.image_url} 
                                    alt={boss.name}
                                    className="max-w-full max-h-full object-contain"
                                />
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
                <div id="bottom-panel" className="w-full h-32 border-t-2 border-gray-400 flex items-center justify-between px-4">
                    <div id="life-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full h-[75%] bg-red-600"></div>
                        </div>
                    </div>
                    <div id="stamina-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full h-[55%] bg-green-600"></div>
                        </div>
                    </div>
                    <div id="mana-bar" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-black border-2 border-gray-400 relative overflow-hidden">
                            <div className="absolute bottom-0 w-full h-[40%] bg-blue-600"></div>
                        </div>
                    </div>
                    <div id="character-picture" className="flex items-center gap-2">
                        <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            CP
                        </div>
                    </div>
                    <div id="action-bar" className="flex items-center gap-2 w-full">
                        <div className="w-64 h-24 rounded-lg bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            Action 1
                        </div>
                        <div className="w-64 h-24 rounded-lg bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            Action 2
                        </div>
                        <div className="w-64 h-24 rounded-lg bg-gray-800 border-2 border-gray-400 flex items-center justify-center">
                            Action 3
                        </div>
                    </div>
                </div>
            </div>
        </div>);
};

export default Game;