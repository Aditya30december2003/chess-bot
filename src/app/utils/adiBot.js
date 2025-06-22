// utils/adiBot.js
import { Chess } from 'chess.js';

/**
 * Get the next move from your historical move tree.
 * @param {string} fen - Current board state.
 * @param {Object} moveTree - Your personalized move tree fetched from Chess.com games.
 * @returns {string|null} - The best move based on your history, or null if no match found.
 */
export function getAdiBotMove(fen, moveTree) {
  const game = new Chess(fen);
  const moves = game.history(); // Get the move history from the start

  let node = moveTree;

  for (const move of moves) {
    if (!node[move]) {
      return null; // Path not found in history
    }
    node = node[move];
  }

  // Now we're at the node where the current game ends — suggest next move
  const nextMoves = Object.entries(node)
    .filter(([key]) => key !== '__games') // Ignore metadata
    .map(([move, data]) => ({
      move,
      count: data.__games || 0,
    }));

  if (nextMoves.length === 0) return null;

  // Sort by frequency (descending)
  nextMoves.sort((a, b) => b.count - a.count);

  return nextMoves[0].move; // Most played move from this position
}
