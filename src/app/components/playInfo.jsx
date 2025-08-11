// src/components/PlayerInfo.jsx
// Player information display with captured pieces

import React from 'react';

// Piece values for scoring
const PIECE_VALUES = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
};

export function PlayerInfo({ isVsBot, playerColor, capturedPieces, playerScore, botScore }) {
  // Render captured pieces for a player
  function renderCapturedPieces(color) {
    const pieces = capturedPieces[color];
    if (!pieces || pieces.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {pieces.map((piece, index) => (
          <div key={index} className="relative">
            <div className="w-6 h-6 flex items-center justify-center text-xs font-bold">
              <span className={`text-${piece.color === 'white' ? 'white' : 'black'}`}>
                {piece.type.toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 text-[8px] bg-black/50 text-white rounded-full w-3 h-3 flex items-center justify-center">
              {piece.moveNumber}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-between mb-4">
      {/* Player Info */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg flex-1 mr-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
              {isVsBot ? 'Y' : 'W'}
            </div>
            <div>
              <h3 className="font-bold text-white">
                {isVsBot ? 'You' : 'White'}
              </h3>
              <p className="text-xs text-white/80">
                Score: {playerScore}
              </p>
            </div>
          </div>
          <div className="text-right">
            {renderCapturedPieces('black')}
          </div>
        </div>
      </div>
      
      {/* Bot/Player 2 Info */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-lg flex-1 ml-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-2">
              {isVsBot ? 'A' : 'B'}
            </div>
            <div>
              <h3 className="font-bold text-white">
                {isVsBot ? 'AdiBot' : 'Black'}
              </h3>
              <p className="text-xs text-white/80">
                Score: {botScore}
              </p>
            </div>
          </div>
          <div className="text-right">
            {renderCapturedPieces('white')}
          </div>
        </div>
      </div>
    </div>
  );
}