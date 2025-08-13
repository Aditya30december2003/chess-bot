// utils/adiBot.js - COMPLETELY FIXED VERSION
import { Chess } from 'chess.js';

/**
 * Get the next move from your move tree with proper error handling
 * @param {string} fen - Current board state
 * @param {Object} moveTree - Your personalized move tree
 * @returns {string|null} - The best move or null if none found
 */
export function getAdiBotMove(fen, moveTree) {
  console.log('🤖 AdiBot Move Calculation Starting...');
  
  try {
    // Validate inputs
    if (!fen || typeof fen !== 'string') {
      console.error('❌ Invalid FEN provided');
      return null;
    }
    
    if (!moveTree || typeof moveTree !== 'object') {
      console.error('❌ Invalid move tree provided');
      return null;
    }
    
    const game = new Chess(fen);
    const gameHistory = game.history();
    const legalMoves = game.moves();
    
    console.log(`📋 Position: ${gameHistory.length} moves played`);
    console.log(`⚖️ Legal moves (${legalMoves.length}): ${legalMoves.slice(0, 8).join(', ')}${legalMoves.length > 8 ? '...' : ''}`);
    
    if (legalMoves.length === 0) {
      console.log('❌ No legal moves - game over');
      return null;
    }
    
    // Strategy 1: Try tree-based move
    const treeMove = getTreeMove(gameHistory, moveTree, legalMoves);
    if (treeMove) {
      console.log(`📖 Selected from repertoire: ${treeMove}`);
      return treeMove;
    }
    
    // Strategy 2: Intelligent fallback
    const fallbackMove = getIntelligentFallback(game);
    console.log(`🎯 Fallback move: ${fallbackMove}`);
    return fallbackMove;
    
  } catch (error) {
    console.error('❌ Critical error in getAdiBotMove:', error);
    
    // Emergency fallback
    try {
      const emergencyGame = new Chess(fen);
      const moves = emergencyGame.moves();
      return moves.length > 0 ? moves[0] : null;
    } catch (e) {
      console.error('❌ Emergency fallback failed:', e);
      return null;
    }
  }
}

/**
 * Get move from tree with comprehensive error handling
 */
function getTreeMove(gameHistory, moveTree, legalMoves) {
  try {
    console.log('🔍 Searching move tree...');
    
    // Validate tree structure
    if (!moveTree || Object.keys(moveTree).length === 0) {
      console.log('❌ Empty or invalid move tree');
      return null;
    }
    
    console.log(`📊 Move tree has ${Object.keys(moveTree).length} root moves`);
    
    let currentNode = moveTree;
    let pathDepth = 0;
    
    // Follow the game path in the tree
    for (let i = 0; i < gameHistory.length; i++) {
      const move = gameHistory[i];
      
      if (!move || typeof move !== 'string') {
        console.log(`❌ Invalid move at position ${i}: ${move}`);
        break;
      }
      
      if (currentNode[move] && typeof currentNode[move] === 'object') {
        currentNode = currentNode[move];
        pathDepth++;
        console.log(`  ✅ ${i + 1}. ${move} (games: ${currentNode.__games || 0})`);
      } else {
        console.log(`  ❌ ${i + 1}. ${move} (not in tree)`);
        break;
      }
      
      // Safety check to prevent infinite loops
      if (pathDepth > 100) {
        console.warn('⚠️ Tree path too deep, breaking');
        break;
      }
    }
    
    console.log(`🎯 Tree path followed: ${pathDepth}/${gameHistory.length} moves`);
    
    // Get available moves from current tree position
    const availableMoves = [];
    
    for (const [move, data] of Object.entries(currentNode)) {
      // Skip metadata keys and ensure we have valid move data
      if (move === '__games' || move.startsWith('_') || typeof data !== 'object') {
        continue;
      }
      
      if (typeof move === 'string' && move.length > 0) {
        availableMoves.push({
          move,
          games: (data && typeof data.__games === 'number') ? data.__games : 0
        });
      }
    }
    
    console.log(`📋 Available tree moves: ${availableMoves.length}`);
    availableMoves.forEach(m => console.log(`    ${m.move} (${m.games} games)`));
    
    if (availableMoves.length === 0) {
      console.log('❌ No moves found in tree at current position');
      return null;
    }
    
    // Filter to only legal moves
    const legalTreeMoves = availableMoves.filter(tm => 
      legalMoves.includes(tm.move)
    );
    
    console.log(`⚖️ Legal tree moves: ${legalTreeMoves.length}`);
    legalTreeMoves.forEach(m => console.log(`    ✅ ${m.move} (${m.games} games)`));
    
    if (legalTreeMoves.length === 0) {
      console.log('❌ No tree moves are legal in current position');
      return null;
    }
    
    // Sort by popularity (most games first)
    legalTreeMoves.sort((a, b) => b.games - a.games);
    
    // Add some variety: 80% chance for most popular, 20% for variety
    if (Math.random() < 0.8 || legalTreeMoves.length === 1) {
      return legalTreeMoves[0].move;
    } else {
      // Pick from top 3 moves for variety
      const topMoves = legalTreeMoves.slice(0, Math.min(3, legalTreeMoves.length));
      const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
      console.log(`🎲 Selected variety move: ${selectedMove.move}`);
      return selectedMove.move;
    }
    
  } catch (error) {
    console.error('❌ Error in getTreeMove:', error);
    return null;
  }
}

/**
 * Intelligent fallback when tree moves aren't available
 */
function getIntelligentFallback(game) {
  try {
    const moves = game.moves({ verbose: true });
    const gameHistory = game.history();
    
    console.log('🧠 Using intelligent fallback logic...');
    
    // Priority 1: Checkmate in one
    for (const move of moves) {
      game.move(move);
      if (game.inCheckmate()) {
        game.undo();
        console.log('🏆 Found checkmate!');
        return move.san;
      }
      game.undo();
    }
    
    // Priority 2: Captures (by piece value)
    const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
    const captures = moves
      .filter(move => move.captured)
      .sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
    
    if (captures.length > 0) {
      console.log(`🎯 Capturing ${captures[0].captured}`);
      return captures[0].san;
    }
    
    // Priority 3: Checks (but not always)
    if (Math.random() < 0.3) {
      const checks = [];
      for (const move of moves) {
        game.move(move);
        if (game.inCheck()) {
          checks.push(move);
        }
        game.undo();
      }
      
      if (checks.length > 0) {
        console.log('👑 Giving check');
        return checks[0].san;
      }
    }
    
    // Priority 4: Development in opening (first 16 moves)
    if (gameHistory.length < 16) {
      const developments = moves.filter(move => {
        // Knights and bishops moving from starting squares
        return (['n', 'b'].includes(move.piece.toLowerCase())) &&
               (move.from[1] === '1' || move.from[1] === '8') && // From back rank
               !move.captured;
      });
      
      if (developments.length > 0) {
        console.log('🏰 Developing piece');
        return developments[0].san;
      }
    }
    
    // Priority 5: Central control
    const centerSquares = ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'];
    const centerMoves = moves.filter(move => centerSquares.includes(move.to));
    
    if (centerMoves.length > 0 && Math.random() < 0.5) {
      console.log('⚔️ Controlling center');
      return centerMoves[0].san;
    }
    
    // Priority 6: Avoid hanging pieces
    const safeMoves = moves.filter(move => {
      game.move(move);
      const isAttacked = game.isAttacked(move.to, game.turn());
      game.undo();
      return !isAttacked || move.captured; // Safe moves or captures
    });
    
    if (safeMoves.length > 0 && safeMoves.length < moves.length) {
      console.log('🛡️ Playing safe move');
      return safeMoves[0].san;
    }
    
    // Priority 7: Random legal move
    console.log('🎲 Random move');
    return moves[Math.floor(Math.random() * moves.length)].san;
    
  } catch (error) {
    console.error('❌ Error in intelligent fallback:', error);
    
    // Last resort
    try {
      const moves = game.moves();
      return moves[0];
    } catch {
      return null;
    }
  }
}

/**
 * Test function to validate bot functionality
 */
export function testBotMove(fen, moveTree) {
  console.log('🧪 TESTING BOT MOVE FUNCTION');
  console.log('='.repeat(50));
  
  const result = getAdiBotMove(fen, moveTree);
  
  if (result) {
    console.log(`✅ Test passed! Bot suggests: ${result}`);
    
    // Validate the move is legal
    try {
      const testGame = new Chess(fen);
      const legalMoves = testGame.moves();
      
      if (legalMoves.includes(result)) {
        console.log('✅ Move is legal!');
      } else {
        console.error('❌ ILLEGAL MOVE SUGGESTED!');
        console.log('Legal moves:', legalMoves);
      }
    } catch (e) {
      console.error('❌ Error validating move:', e);
    }
  } else {
    console.error('❌ Test failed - no move returned');
  }
  
  console.log('='.repeat(50));
  return result;
}

/**
 * Enhanced debugging version
 */
export function getAdiBotMoveDebug(fen, moveTree) {
  console.log('🔍 ENHANCED DEBUG MODE');
  console.log('='.repeat(60));
  
  console.log('📥 INPUTS:');
  console.log('FEN:', fen);
  console.log('Move tree keys:', moveTree ? Object.keys(moveTree).slice(0, 5) : 'null');
  console.log('Move tree type:', typeof moveTree);
  
  const result = getAdiBotMove(fen, moveTree);
  
  console.log('📤 OUTPUT:', result);
  console.log('='.repeat(60));
  
  return result;
}