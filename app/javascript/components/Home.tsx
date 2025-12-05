import React from 'react';

const StartButton: React.FC<{message: string}> = ({message}) => {
    return (
        <button className="w-64 h-16 rounded-lg border-2 border-gray-400 hover:border-gray-600">{message}</button>
    );
}

const Home: React.FC = () => {
    return (
        <div className="w-screen h-screen flex items-center justify-center text-3xl font-bold">
            <div className="text-center w-[320px] h-[320px] flex flex-col items-center justify-around border-4 border-dashed border-gray-300 rounded-lg">
                <StartButton message="New Game" />
                <StartButton message="Load Game" />               
            </div>
        </div>
    );
};

export default Home;