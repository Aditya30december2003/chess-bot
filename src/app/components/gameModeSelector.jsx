// components/GameModeSelector.js
import React from 'react';

export function GameModeSelector({ onStartVsBot, onStartPvP, isLoading }) {
  return (
    <div className="text-center mb-4">
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-3">Choose Game Mode</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => onStartVsBot('white')}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50"
          >
            🤖 vs AdiBot (Play as White)
          </button>
          <button
            onClick={() => onStartVsBot('black')}
            disabled={isLoading}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50"
          >
            🤖 vs AdiBot (Play as Black)
          </button>
          <button
            onClick={onStartPvP}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            👥 Player vs Player
          </button>
        </div>
        {isLoading && (
          <p className="text-white/80 text-sm mt-2">Loading AdiBot...</p>
        )}
      </div>
    </div>
  );
}