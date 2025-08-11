// components/GameControls.js
import React from 'react';

export function GameControls({ onResetGame, isVsBot, onBackToModeSelection }) {
  return (
    <div className="flex justify-center space-x-3 mb-2">
      <button
        onClick={onResetGame}
        className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
      >
        🔄 New Game
      </button>
      {isVsBot && (
        <button
          onClick={onBackToModeSelection}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
        >
          🏠 Game Mode
        </button>
      )}
    </div>
  );
}

