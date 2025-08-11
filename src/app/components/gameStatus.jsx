// components/GameStatus.js
import React from 'react';

export function GameStatus({ 
  gameOver, 
  winner, 
  game, 
  isVsBot, 
  botThinking, 
  playerColor 
}) {
  const currentPlayer = game.turn() === 'w' ? 'White' : 'Black';

  const getStatusMessage = () => {
    if (gameOver) {
      return {
        icon: '🏆',
        title: winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`,
        subtitle: game.isCheckmate() ? 'Checkmate!' : 
                 game.isStalemate() ? 'Stalemate!' :
                 game.isDraw() ? 'Draw!' : 'Game Over!'
      };
    }

    if (isVsBot) {
      if (botThinking) {
        return { title: "🤖 AdiBot is thinking..." };
      }
      
      const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || 
                          (playerColor === 'black' && game.turn() === 'b');
      
      return { 
        title: isPlayerTurn ? "Your turn" : "AdiBot's turn",
        subtitle: `You are playing as ${playerColor}`
      };
    }

    return { title: `${currentPlayer}'s Turn` };
  };

  const status = getStatusMessage();

  return (
    <div className="text-center mb-2">
      <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-xl">
        <div className="text-center">
          {status.icon && <div className="text-3xl mb-1">{status.icon}</div>}
          <h2 className="text-lg font-semibold text-white mb-1">
            {status.title}
          </h2>
          {status.subtitle && (
            <p className="text-white/70 text-xs">
              {status.subtitle}
            </p>
          )}
          {game.isCheck() && !gameOver && (
            <p className="text-red-200 font-medium text-sm">Check!</p>
          )}
        </div>
      </div>
    </div>
  );
}
