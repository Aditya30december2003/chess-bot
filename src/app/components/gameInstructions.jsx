// components/GameInstructions.js
import React from 'react';

export function GameInstructions() {
  return (
    <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 text-sm">
      <h3 className="font-semibold text-white mb-1">How to Play:</h3>
      <ul className="text-white/80 space-y-1">
        <li>• Choose to play against AdiBot or another player</li>
        <li>• Tap a piece to select it and see valid moves</li>
        <li>• Tap a highlighted square to move there</li>
        <li>• Or drag and drop pieces to move</li>
        <li>• AdiBot learns from your personal Chess.com game history</li>
      </ul>
    </div>
  );
}