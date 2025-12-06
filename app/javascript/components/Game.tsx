import React from 'react';

interface GameProps {
    onExit: () => void;
}

const Game: React.FC<GameProps> = ({onExit}) => {
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
                <div id="right-panel" className="w-1/3 h-full flex flex-col items-center justify-center">
                    Right Panel
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