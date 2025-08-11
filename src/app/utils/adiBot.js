// utils/adiBot.js - FIXED VERSION
import { Chess } from 'chess.js';

/**
 * Get the next move from your historical move tree with proper fallbacks.
 * @param {string} fen - Current board state.
 * @param {Object} moveTree - Your personalized move tree fetched from Chess.com games.
 * @returns {string|null} - The best move based on your history, or a fallback move.
 */
export function getAdiBotMove(fen, moveTree) {
  const game = new Chess(fen);
  const gameHistory = game.history(); // Get the move history from the start
  const legalMoves = game.moves(); // Get all legal moves in current position
  
  if (legalMoves.length === 0) {
    console.log('❌ No legal moves available');
    return null; // Game is over
  }
  
  console.log(`🔍 Analyzing position after ${gameHistory.length} moves`);
  console.log(`⚖️ Legal moves: ${legalMoves.slice(0, 5).join(', ')}${legalMoves.length > 5 ? '...' : ''}`);
  
  // STRATEGY 1: Try to follow your move tree
  const treeMove = getTreeMove(gameHistory, moveTree, legalMoves);
  if (treeMove) {
    console.log(`📖 Using move from your repertoire: ${treeMove}`);
    return treeMove;
  }
  
  // STRATEGY 2: Try partial tree matching (go as far as possible, then branch)
  const partialTreeMove = getPartialTreeMove(gameHistory, moveTree, legalMoves);
  if (partialTreeMove) {
    console.log(`📚 Using partial repertoire match: ${partialTreeMove}`);
    return partialTreeMove;
  }
  
  // STRATEGY 3: Intelligent fallback based on position
  const fallbackMove = getIntelligentFallback(game);
  console.log(`🎯 Using intelligent fallback: ${fallbackMove}`);
  return fallbackMove;
}

/**
 * Try to get a move from the complete path in move tree
 */
function getTreeMove(gameHistory, moveTree, legalMoves) {
  try {
    let node = moveTree;
    
    // Follow the complete game path
    for (const move of gameHistory) {
      if (!node[move]) {
        console.log(`🔍 Move tree path breaks at: ${move}`);
        return null; // Path not found
      }
      node = node[move];
    }
    
    // Get available next moves from tree
    const nextMoves = Object.entries(node)
      .filter(([key]) => key !== '__games' && !key.startsWith('_'))
      .map(([move, data]) => ({
        move,
        count: data.__games || 0,
      }));
    
    if (nextMoves.length === 0) {
      console.log('🔍 No moves available in tree at this position');
      return null;
    }
    
    // Filter to only legal moves
    const validMoves = nextMoves.filter(tm => legalMoves.includes(tm.move));
    
    if (validMoves.length === 0) {
      console.log('🔍 No tree moves are legal in current position');
      return null;
    }
    
    // Sort by frequency and add some randomness
    validMoves.sort((a, b) => b.count - a.count);
    
    // 80% chance for most popular, 20% for variety among top 3
    if (Math.random() < 0.8 || validMoves.length === 1) {
      return validMoves[0].move;
    } else {
      const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
      return topMoves[Math.floor(Math.random() * topMoves.length)].move;
    }
    
  } catch (error) {
    console.error('❌ Error in getTreeMove:', error);
    return null;
  }
}

/**
 * Try partial matching - go as deep as possible in the tree, then find moves
 */
function getPartialTreeMove(gameHistory, moveTree, legalMoves) {
  try {
    let node = moveTree;
    let depthReached = 0;
    
    // Go as deep as possible in the tree
    for (let i = 0; i < gameHistory.length; i++) {
      const move = gameHistory[i];
      if (!node[move]) {
        break; // Can't go deeper
      }
      node = node[move];
      depthReached = i + 1;
    }
    
    console.log(`🔍 Partial tree match reached depth: ${depthReached}/${gameHistory.length}`);
    
    // If we couldn't even start following the path, give up
    if (depthReached === 0) {
      return null;
    }
    
    // Look for moves from this partial position
    const nextMoves = Object.entries(node)
      .filter(([key]) => key !== '__games' && !key.startsWith('_'))
      .map(([move, data]) => ({
        move,
        count: data.__games || 0,
      }));
    
    const validMoves = nextMoves.filter(tm => legalMoves.includes(tm.move));
    
    if (validMoves.length > 0) {
      validMoves.sort((a, b) => b.count - a.count);
      return validMoves[0].move;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error in getPartialTreeMove:', error);
    return null;
  }
}

/**
 * Intelligent fallback when tree-based moves aren't available
 */
function getIntelligentFallback(game) {
  const moves = game.moves({ verbose: true });
  
  // Check for checkmate in one
  for (const move of moves) {
    game.move(move);
    if (game.inCheckmate()) {
      game.undo();
      return move.san; // Checkmate!
    }
    game.undo();
  }
  
  // Prefer captures (sorted by piece value)
  const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const captures = moves
    .filter(move => move.captured)
    .sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
  
  if (captures.length > 0) {
    return captures[0].san;
  }
  
  // Check for checks
  const checks = moves.filter(move => {
    game.move(move);
    const givesCheck = game.inCheck();
    game.undo();
    return givesCheck;
  });
  
  if (checks.length > 0 && Math.random() < 0.3) {
    return checks[Math.floor(Math.random() * checks.length)].san;
  }
  
  // Prefer piece development in opening (first 20 moves)
  if (game.history().length < 20) {
    const developments = moves.filter(move => 
      ['N', 'B'].includes(move.piece) && 
      !move.captured &&
      ['c', 'd', 'e', 'f'].includes(move.to[0]) // Central files
    );
    
    if (developments.length > 0) {
      return developments[Math.floor(Math.random() * developments.length)].san;
    }
  }
  
  // Control center
  const centerMoves = moves.filter(move => 
    ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'].includes(move.to)
  );
  
  if (centerMoves.length > 0 && Math.random() < 0.4) {
    return centerMoves[Math.floor(Math.random() * centerMoves.length)].san;
  }
  
  // Random legal move as last resort
  return moves[Math.floor(Math.random() * moves.length)].san;
}

/**
 * Enhanced version with even more debugging
 */
export function getAdiBotMoveDebug(fen, moveTree) {
  console.log('🤖 AdiBot Move Analysis Starting...');
  console.log(`📋 FEN: ${fen}`);
  
  const game = new Chess(fen);
  const gameHistory = game.history();
  const legalMoves = game.moves();
  
  console.log(`📜 Game history (${gameHistory.length} moves): ${gameHistory.join(', ')}`);
  console.log(`⚖️ Legal moves (${legalMoves.length}): ${legalMoves.join(', ')}`);
  
  if (!moveTree || Object.keys(moveTree).length === 0) {
    console.log('❌ Move tree is empty or invalid');
    return getIntelligentFallback(game);
  }
  
  console.log(`📊 Move tree has ${Object.keys(moveTree).length} root moves`);
  
  const result = getAdiBotMove(fen, moveTree);
  console.log(`🎯 Final move decision: ${result}`);
  
  return result;
}
