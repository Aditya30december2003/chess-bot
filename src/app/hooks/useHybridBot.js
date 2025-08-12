import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';

// Enhanced debug logger
const debug = {
  log: (...args) => console.log('[DEBUG]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args)
};

// Enhanced engine settings with validation
const personalityToEngineSettings = (personality, rating) => {
  try {
    debug.log('Generating engine settings');
    const baseRating = Math.max(400, Math.min(2800, rating || 1200));
    
    const settings = {
      depth: Math.max(1, Math.min(15, Math.floor(baseRating / 200))),
      skillLevel: Math.max(1, Math.min(20, Math.floor(baseRating / 140))),
      moveTime: personality.speed > 0.6 ? 500 : (personality.speed > 0.3 ? 1500 : 3000),
      contempt: Math.floor(personality.aggression * 50),
      multipv: personality.tactics > 0.6 ? 3 : 1,
      errorRate: Math.max(0, (2000 - baseRating) / 2000)
    };

    debug.log('Engine settings generated:', settings);
    return settings;
  } catch (error) {
    debug.error('Failed to generate engine settings:', error);
    return {
      depth: 3,
      skillLevel: 8,
      moveTime: 1500,
      contempt: 25,
      multipv: 1,
      errorRate: 0.2
    };
  }
};

// Helper functions
const getEnhancedDemoTree = () => ({
  "e4": {
    "__games": 150,
    "e5": {
      "__games": 85,
      "Nf3": {
        "__games": 60,
        "Nc6": {
          "__games": 35,
          "Bb5": { "__games": 20 },
          "Bc4": { "__games": 15 }
        },
        "Nf6": { "__games": 15 }
      }
    },
    "c5": {
      "__games": 40,
      "Nf3": { "__games": 25 }
    }
  },
  "d4": {
    "__games": 120,
    "d5": {
      "__games": 70,
      "c4": { "__games": 45 }
    },
    "Nf6": { "__games": 35 }
  },
  "Nf3": {
    "__games": 60,
    "d5": { "__games": 25 },
    "Nf6": { "__games": 20 }
  }
});

const getDefaultStyle = () => ({
  aggression: 0.5,
  tactics: 0.5,
  winRate: 0.5,
  speed: 0.5,
  gameLength: 40,
  preferredOpenings: {},
  gamesAnalyzed: 0
});

// Enhanced thinking simulation
const simulateThinking = async (bot, contextId) => {
  const time = bot?.engineSettings?.moveTime || 1000;
  const duration = Math.max(500, time + (Math.random() - 0.5) * time * 0.3);
  debug.log(`[${contextId}] Simulating thinking for ${duration}ms`);
  await new Promise(resolve => setTimeout(resolve, duration));
};

export function useHybridBot() {
  const [stockfish, setStockfish] = useState(null);
  const [currentBot, setCurrentBot] = useState(null);
  const [moveTree, setMoveTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [stockfishReady, setStockfishReady] = useState(false);
  const [lastError, setLastError] = useState(null);

  // Initialize Stockfish engine with detailed logging
  useEffect(() => {
    let isMounted = true;
    const initId = `engine-init-${Date.now()}`;
    
    const initStockfish = async () => {
      try {
        debug.log(`[${initId}] Starting engine initialization`);
        setLastError(null);
        
        // Mock engine - replace with actual Stockfish in production
        const mockEngine = {
          id: initId,
          postMessage: (cmd) => debug.log(`[${initId}] Engine command: ${cmd}`),
          addMessageListener: (callback) => debug.log(`[${initId}] Listener added`),
          removeMessageListener: (callback) => debug.log(`[${initId}] Listener removed`),
          terminate: () => debug.log(`[${initId}] Engine terminated`)
        };

        // Simulate initialization delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isMounted) {
          setStockfish(mockEngine);
          setStockfishReady(true);
          debug.log(`[${initId}] Engine initialized successfully`);
        }
      } catch (error) {
        debug.error(`[${initId}] Engine initialization failed:`, error);
        if (isMounted) {
          setStockfishReady(false);
          setLastError(`Engine init failed: ${error.message}`);
        }
      }
    };

    initStockfish();
    
    return () => {
      isMounted = false;
      debug.log(`[${initId}] Cleaning up engine`);
      if (stockfish) {
        stockfish.terminate();
      }
    };
  }, []);

  // 🔧 CRITICAL FIX: Updated bot creation to properly set state
const createBotFromPlayer = useCallback(async (username, retryCount = 0) => {
  const botId = `bot-${username}-${Date.now()}`;
  
  // Initialize with fallback data FIRST
  let botProfile = {
    id: botId,
    username: username.toLowerCase(),
    displayName: `${username} Bot`,
    rating: 1200,
    personality: getDefaultStyle(),
    engineSettings: personalityToEngineSettings(getDefaultStyle(), 1200),
    gamesAnalyzed: 0,
    isFallback: true
  };

  try {
    const response = await fetch(`/api/fetchgames?username=${encodeURIComponent(username)}`);
    const data = await response.json();
    if (!data.player) {
     console.warn('API returned no player data, using fallback');
      return botProfile; // Return early with fallback
} 

    // Only override fields if API data exists
    botProfile = {
      ...botProfile, // Keep fallback as baseline
      displayName: data.player?.displayName || `${username} Bot`,
      rating: data.player?.rating || 1200,
      personality: data.style || getDefaultStyle(),
      engineSettings: personalityToEngineSettings(data.style || getDefaultStyle(), data.player?.rating),
      gamesAnalyzed: data.stats?.totalGames || 0,
      avatar: data.player?.avatar,
      country: data.player?.country,
      title: data.player?.title,
      isFallback: false // Mark as real bot
    };

    setCurrentBot(botProfile);
    setMoveTree(data.moveTree || getEnhancedDemoTree());
    console.log('Final bot being returned:', {
  id: botProfile.id,
  name: botProfile.displayName,
  rating: botProfile.rating,
  isFallback: botProfile.isFallback
});
return botProfile;
    return botProfile; // ✅ Always returns an object

  } catch (error) {
    console.error('Using fallback bot due to error:', error);
    setCurrentBot(botProfile);
    setMoveTree(getEnhancedDemoTree());
    return botProfile; // ✅ Still returns fallback
  } finally {
    setIsLoading(false);
  }
}, []);

  // Updated getBotMove to have better error handling and logging
  const getBotMove = useCallback(async (gameInstance, gameHistory = []) => {
    const moveId = `move-${Date.now()}`;
    
    debug.log(`[${moveId}] getBotMove called - currentBot: ${currentBot?.displayName || 'None'}`);
    
    if (!currentBot) {
      debug.error(`[${moveId}] No current bot available`);
      return null;
    }

    if (botThinking) {
      debug.warn(`[${moveId}] Bot is already thinking`);
      return null;
    }

    setBotThinking(true);
    setLastError(null);

    try {
      debug.log(`[${moveId}] ${currentBot.displayName} is thinking...`);

      // Validate game instance
      if (!gameInstance || typeof gameInstance.fen !== 'function') {
        throw new Error('Invalid game instance provided');
      }

      const fen = gameInstance.fen();
      const game = new Chess(fen);
      
      // Get legal moves
      const legalMoves = game.moves();
      if (legalMoves.length === 0) {
        debug.log(`[${moveId}] No legal moves - game over`);
        return null;
      }

      debug.log(`[${moveId}] Position: ${fen}`);
      debug.log(`[${moveId}] Legal moves (${legalMoves.length}): ${legalMoves.slice(0, 8).join(', ')}`);

      // Use actual game history, not the parameter
      const actualHistory = game.history();
      const moveCount = actualHistory.length;
      const isOpening = moveCount < 16;

      debug.log(`[${moveId}] Move count: ${moveCount}, Opening: ${isOpening}`);

      // Strategy 1: Try move tree in opening
      if (isOpening && moveTree && Object.keys(moveTree).length > 0) {
        debug.log(`[${moveId}] Attempting tree move`);
        const treeMove = getTreeMove(actualHistory, moveTree, legalMoves, moveId);
        if (treeMove) {
          await simulateThinking(currentBot, moveId);
          debug.log(`[${moveId}] Selected tree move: ${treeMove}`);
          return treeMove;
        }
      }

      // Strategy 2: Intelligent fallback
      debug.log(`[${moveId}] Using intelligent fallback`);
      const smartMove = getIntelligentMove(game, moveId);
      await simulateThinking(currentBot, moveId);
      debug.log(`[${moveId}] Selected smart move: ${smartMove}`);
      return smartMove;

    } catch (error) {
      debug.error(`[${moveId}] Move generation failed:`, error.message);
      setLastError(`Move error: ${error.message}`);
      
      // Emergency fallback
      try {
        const game = new Chess(gameInstance.fen());
        const moves = game.moves();
        if (moves.length > 0) {
          debug.log(`[${moveId}] Emergency fallback: ${moves[0]}`);
          return moves[0];
        }
      } catch (e) {
        debug.error(`[${moveId}] Emergency fallback failed:`, e.message);
      }
      
      return null;

    } finally {
      setBotThinking(false);
      debug.log(`[${moveId}] Move generation completed`);
    }
  }, [currentBot, moveTree, botThinking]);

  // Robust tree move selection
  const getTreeMove = (gameHistory, moveTree, legalMoves, contextId) => {
    try {
      debug.log(`[${contextId}] Tree search - History: ${gameHistory.join(' ')}`);
      
      let currentNode = moveTree;
      let depth = 0;
      
      // Navigate through the tree following game history
      for (const move of gameHistory) {
        if (currentNode[move] && typeof currentNode[move] === 'object') {
          currentNode = currentNode[move];
          depth++;
          debug.log(`[${contextId}] Tree: ${depth}. ${move} ✓ (${currentNode.__games || 0} games)`);
        } else {
          debug.log(`[${contextId}] Tree: ${depth + 1}. ${move} ✗ (path ends)`);
          break;
        }
      }

      // Get available moves from current tree position
      const treeMoves = [];
      for (const [move, data] of Object.entries(currentNode)) {
        if (move === '__games' || move.startsWith('_') || typeof data !== 'object') {
          continue;
        }
        treeMoves.push({
          move,
          games: data.__games || 0
        });
      }

      debug.log(`[${contextId}] Tree moves available: ${treeMoves.length}`);
      
      if (treeMoves.length === 0) {
        return null;
      }

      // Filter to legal moves only
      const legalTreeMoves = treeMoves.filter(tm => legalMoves.includes(tm.move));
      
      if (legalTreeMoves.length === 0) {
        debug.log(`[${contextId}] No legal tree moves found`);
        return null;
      }

      // Sort by popularity and add randomness
      legalTreeMoves.sort((a, b) => b.games - a.games);
      debug.log(`[${contextId}] Legal tree moves:`, legalTreeMoves.map(m => `${m.move}(${m.games})`));

      // 70% most popular, 30% variety
      if (Math.random() < 0.7) {
        return legalTreeMoves[0].move;
      } else {
        const topMoves = legalTreeMoves.slice(0, Math.min(3, legalTreeMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
      }

    } catch (error) {
      debug.error(`[${contextId}] Tree move selection error:`, error.message);
      return null;
    }
  };

  // Intelligent move selection
  const getIntelligentMove = (game, contextId) => {
    try {
      const moves = game.moves({ verbose: true });
      
      // Priority 1: Checkmate
      for (const move of moves) {
        game.move(move);
        if (game.inCheckmate()) {
          game.undo();
          debug.log(`[${contextId}] Found checkmate: ${move.san}`);
          return move.san;
        }
        game.undo();
      }

      // Priority 2: Best captures
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
      const captures = moves
        .filter(move => move.captured)
        .sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));

      if (captures.length > 0) {
        debug.log(`[${contextId}] Best capture: ${captures[0].san}`);
        return captures[0].san;
      }

      // Priority 3: Checks (sometimes)
      if (Math.random() < 0.2) {
        const checks = [];
        for (const move of moves) {
          game.move(move);
          if (game.inCheck()) {
            checks.push(move);
          }
          game.undo();
        }
        if (checks.length > 0) {
          debug.log(`[${contextId}] Check: ${checks[0].san}`);
          return checks[0].san;
        }
      }

      // Priority 4: Development in opening
      const history = game.history();
      if (history.length < 16) {
        const developments = moves.filter(move => 
          ['n', 'b'].includes(move.piece) && 
          (move.from[1] === '1' || move.from[1] === '8') &&
          !move.captured
        );
        
        if (developments.length > 0) {
          debug.log(`[${contextId}] Development: ${developments[0].san}`);
          return developments[0].san;
        }
      }

      // Priority 5: Center control
      const centerMoves = moves.filter(move => 
        ['e4', 'e5', 'd4', 'd5', 'c4', 'f4'].includes(move.to)
      );
      
      if (centerMoves.length > 0 && Math.random() < 0.4) {
        debug.log(`[${contextId}] Center control: ${centerMoves[0].san}`);
        return centerMoves[0].san;
      }

      // Default: Random move
      const randomMove = moves[Math.floor(Math.random() * moves.length)].san;
      debug.log(`[${contextId}] Random: ${randomMove}`);
      return randomMove;

    } catch (error) {
      debug.error(`[${contextId}] Intelligent move error:`, error.message);
      const moves = game.moves();
      return moves.length > 0 ? moves[0] : null;
    }
  };

  // Add debug logging for state changes
  useEffect(() => {
    debug.log('🔍 Hook State Update - currentBot:', currentBot?.displayName || 'None');
  }, [currentBot]);

  return {
    currentBot,
    moveTree,
    isLoading,
    botThinking,
    stockfishReady,
    lastError,
    createBotFromPlayer,
    getBotMove,
    stockfish
  };
}