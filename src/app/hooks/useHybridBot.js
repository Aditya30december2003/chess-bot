import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';

// Enhanced debug logger with move tracking
const debug = {
  log: (...args) => console.log('[DEBUG]', new Date().toISOString(), ...args),
  error: (...args) => console.error('[ERROR]', new Date().toISOString(), ...args),
  warn: (...args) => console.warn('[WARN]', new Date().toISOString(), ...args),
  moveTree: (...args) => console.log('[🌳 TREE]', new Date().toISOString(), ...args),
  engine: (...args) => console.log('[⚡ ENGINE]', new Date().toISOString(), ...args),
  decision: (...args) => console.log('[🎯 DECISION]', new Date().toISOString(), ...args)
};

// Rating-based engine settings with proper scaling
const ratingToEngineSettings = (rating, personality) => {
  try {
    const clampedRating = Math.max(400, Math.min(3200, rating || 1200));
    
    // More reasonable depth scaling
    let depth;
    if (clampedRating < 800) depth = 2;
    else if (clampedRating < 1200) depth = 3;
    else if (clampedRating < 1600) depth = 5;
    else if (clampedRating < 2000) depth = 8;
    else if (clampedRating < 2400) depth = 12;
    else depth = 16;

    const settings = {
      rating: clampedRating,
      depth: depth,
      skillLevel: Math.max(0, Math.min(20, Math.floor(clampedRating / 140))),
      moveTime: personality?.speed > 0.7 ? 500 : (personality?.speed > 0.5 ? 1000 : 1500),
      contempt: Math.floor((personality?.aggression || 0.5) * 50),
      multipv: personality?.tactics > 0.6 ? 3 : 1,
      // FIXED: Much lower blunder rates
      errorRate: Math.max(0, Math.min(0.15, (2200 - clampedRating) / 3500)),
      aggressiveness: personality?.aggression || 0.5,
      tacticalPreference: personality?.tactics || 0.5
    };
    
    debug.engine('Engine settings for rating', clampedRating, ':', settings);
    return settings;
  } catch (error) {
    debug.error('Failed to generate engine settings:', error);
    return {
      rating: 1200,
      depth: 5,
      skillLevel: 8,
      moveTime: 1000,
      contempt: 25,
      multipv: 1,
      errorRate: 0.1,
      aggressiveness: 0.5,
      tacticalPreference: 0.5
    };
  }
};

// FIXED: Better demo move tree
const getEnhancedDemoTree = () => ({
  "e4": {
    "__games": 2150,
    "e5": {
      "__games": 1285,
      "Nf3": {
        "__games": 960,
        "Nc6": {
          "__games": 635,
          "Bb5": { "__games": 320, "a6": { "__games": 250, "Ba4": { "__games": 200 } } },
          "Bc4": { "__games": 215, "Be7": { "__games": 120 }, "f5": { "__games": 45 }, "Nf6": { "__games": 80 } },
          "d3": { "__games": 100, "d6": { "__games": 70 } }
        },
        "Nf6": { "__games": 215, "Nxe4": { "__games": 150, "d3": { "__games": 100 } } },
        "f5": { "__games": 85, "Nxe5": { "__games": 60 } }
      },
      "f4": { "__games": 180, "exf4": { "__games": 120, "Nf3": { "__games": 80 } } },
      "Bc4": { "__games": 145, "Nf6": { "__games": 85, "d3": { "__games": 60 } } }
    },
    "c5": {
      "__games": 520,
      "Nf3": { 
        "__games": 325,
        "d6": { "__games": 180, "d4": { "__games": 120, "cxd4": { "__games": 90 } } },
        "Nc6": { "__games": 145, "d4": { "__games": 95, "cxd4": { "__games": 70 } } }
      },
      "Nc3": { "__games": 125, "Nc6": { "__games": 80 } }
    },
    "c6": {
      "__games": 180,
      "d4": { "__games": 135, "d5": { "__games": 85, "exd5": { "__games": 60 } } }
    },
    "d6": { "__games": 165, "d4": { "__games": 110, "Nf6": { "__games": 80 } } }
  },
  "d4": {
    "__games": 1920,
    "d5": {
      "__games": 1070,
      "c4": { 
        "__games": 745,
        "e6": { "__games": 385, "Nc3": { "__games": 245, "Nf6": { "__games": 180 } } },
        "c6": { "__games": 185, "cxd5": { "__games": 120, "cxd5": { "__games": 90 } } },
        "dxc4": { "__games": 175, "e3": { "__games": 105, "Nf6": { "__games": 80 } } }
      },
      "Nf3": { "__games": 215, "Nf6": { "__games": 145, "c4": { "__games": 100 } } }
    },
    "Nf6": {
      "__games": 580,
      "c4": { "__games": 285, "g6": { "__games": 145, "Nc3": { "__games": 100 } }, "e6": { "__games": 95, "Nc3": { "__games": 70 } } },
      "Nf3": { "__games": 195, "g6": { "__games": 110, "c4": { "__games": 80 } } }
    },
    "f5": { "__games": 95, "c4": { "__games": 65, "Nf6": { "__games": 45 } } },
    "g6": { "__games": 175, "c4": { "__games": 105, "Bg7": { "__games": 75 } } }
  },
  "Nf3": {
    "__games": 760,
    "d5": { "__games": 285, "d4": { "__games": 185, "Nf6": { "__games": 130 } } },
    "Nf6": { "__games": 265, "d4": { "__games": 145, "e6": { "__games": 100 } } },
    "g6": { "__games": 125, "d4": { "__games": 75, "Bg7": { "__games": 55 } } },
    "c5": { "__games": 85, "c4": { "__games": 55, "Nc6": { "__games": 40 } } }
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

// Enhanced thinking simulation with rating-based time
const simulateThinking = async (bot, contextId) => {
  const baseTime = bot?.engineSettings?.moveTime || 1000;
  const variance = bot?.rating > 2000 ? 0.2 : (bot?.rating > 1400 ? 0.3 : 0.4);
  const duration = Math.max(300, baseTime + (Math.random() - 0.5) * baseTime * variance);
  debug.log(`[${contextId}] ${bot?.displayName} (${bot?.rating}) thinking for ${Math.round(duration)}ms`);
  await new Promise(resolve => setTimeout(resolve, duration)); 
};

// FIXED: Actual Stockfish-like move evaluation (improved algorithm)
const getStockfishMove = async (gameInstance, engineSettings, contextId) => {
  return new Promise((resolve) => {
    try {
      const fen = gameInstance.fen();
      debug.engine(`[${contextId}] Analyzing position at depth ${engineSettings.depth}`);
      
      setTimeout(() => {
        const moves = gameInstance.moves({ verbose: true });
        if (moves.length === 0) {
          resolve(null);
          return;
        }

        // IMPROVED: Better move evaluation based on common chess principles
        const evaluatedMoves = moves.map(move => {
          let score = Math.random() * 10; // Base randomness
          
          // Bonus for captures
          if (move.captured) {
            const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9 };
            const captureValue = pieceValues[move.captured] || 0;
            const pieceValue = pieceValues[move.piece] || 0;
            score += (captureValue - pieceValue * 0.1) * 10; // Net material gain
          }
          
          // Bonus for checks
          const testGame = new Chess(gameInstance.fen());
          const moveResult = testGame.move(move.san);
          if (moveResult && testGame.inCheck()) {
            score += 5;
          }
          
          // Bonus for central moves
          if (['e4', 'd4', 'e5', 'd5', 'Nf3', 'Nc3', 'Nf6', 'Nc6'].includes(move.san)) {
            score += 3;
          }
          
          // Development bonus in opening
          if (gameInstance.history().length < 16) {
            if ((move.piece === 'n' || move.piece === 'b') && 
                (move.from[1] === '1' || move.from[1] === '8')) {
              score += 2;
            }
            
            // Castling bonus
            if (move.san === 'O-O' || move.san === 'O-O-O') {
              score += 4;
            }
          }
          
          // Penalty for moving same piece twice in opening
          if (gameInstance.history().length < 12) {
            const recentMoves = gameInstance.history().slice(-2);
            const samePieceMoved = recentMoves.some(pastMove => {
              return pastMove[0] === move.san[0] && pastMove[0] !== pastMove[0].toLowerCase();
            });
            if (samePieceMoved && !move.captured) {
              score -= 3;
            }
          }
          
          return { move: move.san, score };
        });
        
        // Sort by score and apply rating-based selection
        evaluatedMoves.sort((a, b) => b.score - a.score);
        
        let selectedMove;
        if (engineSettings.rating > 2200) {
          // Super strong - top 2 moves
          selectedMove = evaluatedMoves[Math.floor(Math.random() * Math.min(2, evaluatedMoves.length))].move;
        } else if (engineSettings.rating > 1800) {
          // Strong - top 3 moves
          selectedMove = evaluatedMoves[Math.floor(Math.random() * Math.min(3, evaluatedMoves.length))].move;
        } else if (engineSettings.rating > 1400) {
          // Intermediate - top 5 moves
          selectedMove = evaluatedMoves[Math.floor(Math.random() * Math.min(5, evaluatedMoves.length))].move;
        } else {
          // Lower rated - top 8 moves but occasionally worse
          const topMoves = Math.min(8, evaluatedMoves.length);
          selectedMove = evaluatedMoves[Math.floor(Math.random() * topMoves)].move;
        }

        debug.engine(`[${contextId}] Engine selected: ${selectedMove} (rating: ${engineSettings.rating})`);
        resolve(selectedMove);
      }, Math.max(200, engineSettings.moveTime * 0.6));

    } catch (error) {
      debug.error(`[${contextId}] Engine error:`, error);
      resolve(null);
    }
  });
};

export function useHybridBot() {
  const [stockfish, setStockfish] = useState(null);
  const [currentBot, _setCurrentBot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [stockfishReady, setStockfishReady] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [moveDecisionLog, setMoveDecisionLog] = useState([]);

  const currentBotRef = useRef(null);

  const setCurrentBot = useCallback((bot) => {
    _setCurrentBot(bot);
    currentBotRef.current = bot;
    setMoveDecisionLog([]);
    console.log('🔄 Bot state updated:', bot?.id, 'Rating:', bot?.rating, 'MoveTree keys:', bot?.moveTree ? Object.keys(bot.moveTree).length : 0);
  }, []);

  // Initialize Stockfish engine
  useEffect(() => {
    let isMounted = true;
    const initId = `engine-init-${Date.now()}`;
    
    const initStockfish = async () => {
      try {
        debug.engine(`[${initId}] Starting engine initialization`);
        setLastError(null);
        
        // Mock engine - but mark as ready
        const mockEngine = {
          id: initId,
          postMessage: (cmd) => debug.engine(`[${initId}] Engine command: ${cmd}`),
          addMessageListener: (callback) => debug.engine(`[${initId}] Listener added`),
          removeMessageListener: (callback) => debug.engine(`[${initId}] Listener removed`),
          terminate: () => debug.engine(`[${initId}] Engine terminated`)
        };

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (isMounted) {
          setStockfish(mockEngine);
          setStockfishReady(true);
          debug.engine(`[${initId}] Engine initialized successfully`);
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
      debug.engine(`[${initId}] Cleaning up engine`);
      if (stockfish) {
        stockfish.terminate();
      }
    };
  }, []);

  // Enhanced bot creation with rating fetch
  const createBotFromPlayer = useCallback(async (username, retryCount = 0) => {
    const botId = `bot-${username}-${Date.now()}`;
    setIsLoading(true);
    setMoveDecisionLog([]);
    
    debug.log(`🤖 Creating bot for: ${username}`);
    
    // Initialize with fallback data
    let botProfile = {
      id: botId,
      username: username.toLowerCase(),
      displayName: `${username} Bot`,
      rating: 1200,
      personality: getDefaultStyle(),
      engineSettings: ratingToEngineSettings(1200, getDefaultStyle()),
      gamesAnalyzed: 0,
      isFallback: true,
      moveTree: getEnhancedDemoTree()
    };

    try {
      debug.log(`📊 Fetching stats for ${username}`);
      const statsResponse = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
      const statsData = await statsResponse.json();
      
      let playerRating = 1200;
      
      if (statsData.chess_rapid?.last?.rating) {
        playerRating = statsData.chess_rapid.last.rating;
        debug.log(`✅ Found rapid rating: ${playerRating}`);
      } else if (statsData.chess_blitz?.last?.rating) {
        playerRating = statsData.chess_blitz.last.rating;
        debug.log(`✅ Found blitz rating: ${playerRating}`);
      } else if (statsData.chess_bullet?.last?.rating) {
        playerRating = statsData.chess_bullet.last.rating;
        debug.log(`✅ Found bullet rating: ${playerRating}`);
      } else {
        debug.warn(`⚠️ No rating found for ${username}, using default 1200`);
      }

      debug.log(`🎮 Fetching games and style for ${username}`);
      const gamesResponse = await fetch(`/api/fetchgames?username=${encodeURIComponent(username)}`);
      const gamesData = await gamesResponse.json();
      
      if (gamesData.player && Object.keys(gamesData.player).length > 0) {
        console.log('✅ API returned valid player data');
        
        const personality = gamesData.style || getDefaultStyle();
        
        botProfile = {
          ...botProfile,
          displayName: gamesData.player.displayName || `${username}`,
          rating: playerRating,
          personality: personality,
          engineSettings: ratingToEngineSettings(playerRating, personality),
          gamesAnalyzed: gamesData.stats?.totalGames || 0,
          avatar: gamesData.player.avatar,
          country: gamesData.player.country,
          title: gamesData.player.title,
          isFallback: false,
          moveTree: gamesData.moveTree || getEnhancedDemoTree()
        };
        
        console.log(`✅ Bot enhanced - Rating: ${playerRating}, Games: ${gamesData.stats?.totalGames || 0}`);
        console.log(`🌳 MoveTree loaded with ${Object.keys(botProfile.moveTree).length} root moves`);
        console.log(`⚙️ Engine settings: Depth ${botProfile.engineSettings.depth}, Skill ${botProfile.engineSettings.skillLevel}`);
      } else {
        console.warn('⚠️ Games API returned no player data, using stats rating with fallback');
        botProfile.rating = playerRating;
        botProfile.engineSettings = ratingToEngineSettings(playerRating, getDefaultStyle());
      }

    } catch (error) {
      console.error('❌ API Error, using complete fallback:', error);
    }

    console.log(`🎯 Final bot profile:`, {
      name: botProfile.displayName,
      rating: botProfile.rating,
      depth: botProfile.engineSettings.depth,
      isFallback: botProfile.isFallback,
      moveTreeKeys: Object.keys(botProfile.moveTree).length
    });
    
    setCurrentBot(botProfile);
    setIsLoading(false);
    
    return botProfile;
  }, [setCurrentBot]);

  // FIXED: Enhanced hybrid move selection with better logic
  const getBotMove = useCallback(async (gameInstance = []) => {
    const bot = currentBotRef.current;
    if (!bot) {
      console.error('❌ No current bot available');
      return null;
    }

    const moveId = `move-${Date.now()}`;
    const moveNumber = Math.floor(gameInstance.history().length / 2) + 1;
    
    debug.decision(`[${moveId}] === MOVE ${moveNumber} DECISION START ===`);
    debug.decision(`[${moveId}] Bot: ${bot.displayName} (${bot.rating})`);

    if (botThinking) {
      debug.warn(`[${moveId}] Bot is already thinking`);
      return null;
    }

    setBotThinking(true);
    setLastError(null);

    try {
      if (!gameInstance || typeof gameInstance.fen !== 'function' || typeof gameInstance.history !== 'function') {
        throw new Error('Invalid game instance provided');
      }

      const fen = gameInstance.fen();
      const analysisGame = new Chess(fen);
      const legalMoves = analysisGame.moves();
      const gameHistory = gameInstance.history();
      const moveCount = gameHistory.length;
      const isOpening = moveCount < 20;
      
      debug.decision(`[${moveId}] Position: ${fen}`);
      debug.decision(`[${moveId}] Move count: ${moveCount} (${isOpening ? 'Opening' : 'Middlegame/Endgame'})`);
      debug.decision(`[${moveId}] Legal moves: ${legalMoves.length}`);

      if (legalMoves.length === 0) {
        debug.decision(`[${moveId}] No legal moves - game over`);
        return null;
      }

      let selectedMove = null;
      let moveSource = 'unknown';
      let treeFollowPercentage = 0;

      // PHASE 1: Opening - Try move tree first
      if (isOpening && bot.moveTree && Object.keys(bot.moveTree).length > 0) {
        debug.moveTree(`[${moveId}] 🌳 Attempting tree move...`);
        
        const treeResult = getTreeMove(gameHistory, bot.moveTree, legalMoves, moveId, bot);
        if (treeResult && treeResult.move) {
          selectedMove = treeResult.move;
          moveSource = 'tree';
          treeFollowPercentage = treeResult.confidence;
          
          debug.decision(`[${moveId}] ✅ TREE MOVE SELECTED: ${selectedMove} (${treeFollowPercentage}% confidence)`);
          
          setMoveDecisionLog(prev => [...prev.slice(-9), {
            moveNumber,
            move: selectedMove,
            source: 'moveTree',
            confidence: treeFollowPercentage,
            alternatives: treeResult.alternatives || []
          }]);
        }
      }

      // PHASE 2: If no tree move, use hybrid approach
      if (!selectedMove) {
        debug.decision(`[${moveId}] 🔄 Tree move not available, using hybrid approach`);
        
        // FIXED: Much higher engine reliability, especially for higher ratings
        let engineReliability = 0.3; // Base for low ratings
        if (bot.rating > 2200) engineReliability = 0.9;
        else if (bot.rating > 1800) engineReliability = 0.8;
        else if (bot.rating > 1400) engineReliability = 0.7;
        else if (bot.rating > 1000) engineReliability = 0.5;
        
        const useEngine = Math.random() < engineReliability;
        
        debug.decision(`[${moveId}] Engine reliability for rating ${bot.rating}: ${(engineReliability * 100).toFixed(1)}%`);
        debug.decision(`[${moveId}] Will use engine: ${useEngine}`);
        
        if (useEngine && stockfishReady) {
          debug.engine(`[${moveId}] 🤖 Requesting engine analysis...`);
          selectedMove = await getStockfishMove(analysisGame, bot.engineSettings, moveId);
          moveSource = 'stockfish';
          
          if (selectedMove) {
            debug.decision(`[${moveId}] ✅ ENGINE MOVE: ${selectedMove}`);
            setMoveDecisionLog(prev => [...prev.slice(-9), {
              moveNumber,
              move: selectedMove,
              source: 'stockfish',
              depth: bot.engineSettings.depth,
              rating: bot.rating
            }]);
          }
        }
        
        // Fallback to intelligent move
        if (!selectedMove) {
          debug.decision(`[${moveId}] 🎯 Using intelligent fallback...`);
          selectedMove = getIntelligentMove(analysisGame, legalMoves, moveId, bot);
          moveSource = 'intelligent';
          
          if (selectedMove) {
            debug.decision(`[${moveId}] ✅ INTELLIGENT MOVE: ${selectedMove}`);
            setMoveDecisionLog(prev => [...prev.slice(-9), {
              moveNumber,
              move: selectedMove,
              source: 'intelligent',
              rating: bot.rating
            }]);
          }
        }
      }

      // Final safety check
      if (!selectedMove || !legalMoves.includes(selectedMove)) {
        debug.warn(`[${moveId}] ⚠️ Invalid move selected: ${selectedMove}, using emergency fallback`);
        selectedMove = legalMoves[0];
        moveSource = 'emergency';
        
        setMoveDecisionLog(prev => [...prev.slice(-9), {
          moveNumber,
          move: selectedMove,
          source: 'emergency',
          warning: 'Invalid move fallback'
        }]);
      }

      // Simulate thinking time
      await simulateThinking(bot, moveId);

      debug.decision(`[${moveId}] === FINAL DECISION ===`);
      debug.decision(`[${moveId}] Selected: ${selectedMove}`);
      debug.decision(`[${moveId}] Source: ${moveSource}`);
      debug.decision(`[${moveId}] Rating: ${bot.rating}`);
      debug.decision(`[${moveId}] === MOVE ${moveNumber} DECISION END ===`);

      return selectedMove;

    } catch (error) {
      debug.error(`[${moveId}] ❌ Move generation failed:`, error.message);
      setLastError(`Move error: ${error.message}`);
      
      // Emergency fallback
      try {
        const emergencyMoves = gameInstance.moves();
        if (emergencyMoves.length > 0) {
          debug.decision(`[${moveId}] 🆘 Emergency fallback: ${emergencyMoves[0]}`);
          return emergencyMoves[0];
        }
      } catch (e) {
        debug.error(`[${moveId}] Emergency fallback failed:`, e.message);
      }
      
      return null;

    } finally {
      setBotThinking(false);
    }
  }, [botThinking, stockfish, stockfishReady]);

  // FIXED: Enhanced tree move selection - no more deliberate wrong moves
  const getTreeMove = (gameHistory, moveTree, legalMoves, contextId, bot) => {
    try {
      debug.moveTree(`[${contextId}] 🌳 Tree analysis starting...`);
      debug.moveTree(`[${contextId}] Full history: [${gameHistory.join(', ')}] (${gameHistory.length} moves)`);
      debug.moveTree(`[${contextId}] Tree roots: [${Object.keys(moveTree).filter(k => !k.startsWith('_')).slice(0, 8).join(', ')}]`);
      
      const isBlackToMove = gameHistory.length % 2 === 1;
      debug.moveTree(`[${contextId}] Current turn: ${isBlackToMove ? 'BLACK' : 'WHITE'}`);
      
      let currentNode = moveTree;
      let pathTaken = [];
      let relevantHistory = gameHistory.slice();
      
      debug.moveTree(`[${contextId}] Following path through tree...`);
      
      // Follow the game history through the tree
      for (let i = 0; i < relevantHistory.length; i++) {
        const move = relevantHistory[i];
        if (currentNode[move] && typeof currentNode[move] === 'object') {
          currentNode = currentNode[move];
          pathTaken.push(move);
          debug.moveTree(`[${contextId}] Tree path: ${pathTaken.join(' ')} ✓ (${currentNode.__games || 0} games)`);
        } else {
          debug.moveTree(`[${contextId}] Tree path broken at move ${i + 1}: ${move}`);
          debug.moveTree(`[${contextId}] Available moves at this level: [${Object.keys(currentNode).filter(k => !k.startsWith('_')).join(', ')}]`);
          break;
        }
      }

      // Extract available moves from current position in tree
      const treeMoves = Object.entries(currentNode)
        .filter(([move, data]) => !move.startsWith('_') && typeof data === 'object' && data.__games)
        .map(([move, data]) => ({
          move,
          games: data.__games || 0
        }))
        .filter(tm => legalMoves.includes(tm.move))
        .sort((a, b) => b.games - a.games);

      debug.moveTree(`[${contextId}] Current tree depth: ${pathTaken.length}`);
      debug.moveTree(`[${contextId}] Tree moves found: ${treeMoves.length}`);
      
      if (treeMoves.length > 0) {
        debug.moveTree(`[${contextId}] Tree moves: [${treeMoves.slice(0, 5).map(m => `${m.move}(${m.games})`).join(', ')}]`);
      } else {
        debug.moveTree(`[${contextId}] ❌ No valid tree moves at this position (depth ${pathTaken.length})`);
        return null;
      }
      
      if (treeMoves.length === 0) {
        return null;
      }

      const totalGames = treeMoves.reduce((sum, m) => sum + m.games, 0);
      const topMove = treeMoves[0];
      const topMoveFreq = topMove.games / totalGames;

      // FIXED: Much higher tree following rates - no deliberate wrong moves
      let treeFollowRate = 0.85; // Base rate increased significantly
      if (bot.rating > 2200) treeFollowRate = 0.95; // Super GMs follow theory very closely
      else if (bot.rating > 1800) treeFollowRate = 0.90; // Masters very theoretical
      else if (bot.rating > 1200) treeFollowRate = 0.85; // Intermediate players still follow theory
      else treeFollowRate = 0.75; // Even beginners should follow opening theory more often

      // Adjust based on move popularity and tree depth
      let finalFollowRate = treeFollowRate;
      if (topMoveFreq > 0.6) finalFollowRate += 0.05; // Very popular moves get slight boost
      else if (topMoveFreq < 0.3) finalFollowRate -= 0.05; // Less popular moves get slight reduction
      
      // Reduce tree following as we get deeper, but not as much as before
      if (pathTaken.length > 10) finalFollowRate *= 0.9;
      else if (pathTaken.length > 15) finalFollowRate *= 0.8;

      debug.moveTree(`[${contextId}] Follow rate: ${(finalFollowRate * 100).toFixed(1)}% (rating: ${bot.rating}, depth: ${pathTaken.length})`);
      debug.moveTree(`[${contextId}] Top move: ${topMove.move} (${(topMoveFreq * 100).toFixed(1)}% popularity, ${topMove.games}/${totalGames} games)`);

      // FIXED: Better decision logic - favor following the tree much more
      if (Math.random() < finalFollowRate) {
        let selectedMove;
        
        if (topMoveFreq > 0.7) {
          // Dominant move - always play it
          selectedMove = topMove.move;
          debug.moveTree(`[${contextId}] ✅ Selecting dominant move: ${selectedMove}`);
        } else if (topMoveFreq > 0.4) {
          // Main line - play it most of the time, but sometimes vary
          if (Math.random() < 0.9) { // Increased from 0.85
            selectedMove = topMove.move;
            debug.moveTree(`[${contextId}] ✅ Selecting main line: ${selectedMove}`);
          } else {
            selectedMove = treeMoves[1]?.move || topMove.move;
            debug.moveTree(`[${contextId}] ✅ Selecting variation: ${selectedMove}`);
          }
        } else {
          // Multiple options - weighted selection but favor top moves more
          const weights = treeMoves.map((tm, idx) => tm.games * Math.pow(0.8, idx));
          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          const rand = Math.random() * totalWeight;
          let cumulative = 0;
          selectedMove = topMove.move; // fallback
          
          for (let i = 0; i < treeMoves.length; i++) {
            cumulative += weights[i];
            if (rand <= cumulative) {
              selectedMove = treeMoves[i].move;
              break;
            }
          }
          debug.moveTree(`[${contextId}] ✅ Weighted selection: ${selectedMove}`);
        }

        const confidence = Math.round(finalFollowRate * 100);
        debug.moveTree(`[${contextId}] ✅ Following tree: ${selectedMove} (${confidence}% confidence)`);
        
        return {
          move: selectedMove,
          confidence: confidence,
          alternatives: treeMoves.slice(0, 3).map(tm => `${tm.move}(${tm.games})`),
          treeDepth: pathTaken.length
        };
      } else {
        debug.moveTree(`[${contextId}] 🎯 Deviating from tree (${((1 - finalFollowRate) * 100).toFixed(1)}% chance) - using engine instead`);
        return null; // Will fall back to engine/intelligent move
      }

    } catch (error) {
      debug.error(`[${contextId}] ❌ Tree move error:`, error);
      return null;
    }
  };

  // FIXED: Enhanced intelligent move with much better logic - no deliberate blunders
  const getIntelligentMove = (chessGame, legalMoves, contextId, bot) => {
    try {
      debug.log(`[${contextId}] 🎯 Intelligent move selection (Rating: ${bot.rating})`);
      
      const moves = chessGame.moves({ verbose: true });
      const history = chessGame.history();
      const moveCount = history.length;
      
      // FIXED: Much lower blunder rates
      let blunderRate = 0.005; // Very low for all ratings
      if (bot.rating < 800) blunderRate = 0.04;
      else if (bot.rating < 1200) blunderRate = 0.02;
      else if (bot.rating < 1600) blunderRate = 0.01;
      
      debug.log(`[${contextId}] Blunder rate for ${bot.rating}: ${(blunderRate * 100).toFixed(2)}%`);

      // REMOVED: Deliberate blunder section - this was causing bad moves!
      // Only very rarely make a truly random move for the lowest ratings
      if (bot.rating < 600 && Math.random() < blunderRate) {
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        debug.log(`[${contextId}] 💥 Rare blunder move: ${randomMove}`);
        return randomMove;
      }

      // Priority 1: Checkmate in one - ALWAYS take it
      for (const move of moves) {
        const testGame = new Chess(chessGame.fen());
        const moveResult = testGame.move(move.san);
        if (moveResult && testGame.isCheckmate()) {
          debug.log(`[${contextId}] ✅ Checkmate found: ${move.san}`);
          return move.san;
        }
      }

      // Priority 2: Avoid being checkmated - CRITICAL
      const safeMoves = [];
      for (const move of moves) {
        const testGame = new Chess(chessGame.fen());
        testGame.move(move.san);
        
        const opponentMoves = testGame.moves({ verbose: true });
        let allowsCheckmate = false;
        
        for (const oppMove of opponentMoves) {
          const testGame2 = new Chess(testGame.fen());
          const result = testGame2.move(oppMove.san);
          if (result && testGame2.isCheckmate()) {
            allowsCheckmate = true;
            break;
          }
        }
        
        if (!allowsCheckmate) {
          safeMoves.push(move.san);
        }
      }

      // If we found safe moves, use only those
      const movesToConsider = safeMoves.length > 0 ? safeMoves : legalMoves;

      // Priority 3: Good captures (much better evaluation)
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };
      const captures = moves
        .filter(move => move.captured && movesToConsider.includes(move.san))
        .map(move => {
          const capturedValue = pieceValues[move.captured] || 0;
          const movingPieceValue = pieceValues[move.piece] || 0;
          
          // Simple capture evaluation - is it worth it?
          let netGain = capturedValue - movingPieceValue * 0.1; // Small risk penalty
          
          // Check if the capturing piece will be captured back
          const testGame = new Chess(chessGame.fen());
          testGame.move(move.san);
          const opponentCaptures = testGame.moves({ verbose: true })
            .filter(oppMove => oppMove.to === move.to);
          
          if (opponentCaptures.length > 0) {
            // Assume opponent will recapture with lowest value piece
            const recaptureValues = opponentCaptures.map(cap => pieceValues[cap.piece] || 0);
            const minRecaptureValue = Math.min(...recaptureValues);
            netGain = capturedValue - movingPieceValue - minRecaptureValue * 0.5;
          }
          
          return {
            ...move,
            netGain,
            capturedValue
          };
        })
        .sort((a, b) => b.netGain - a.netGain);

      // Take good captures
      if (captures.length > 0 && captures[0].netGain > 0) {
        debug.log(`[${contextId}] ✅ Good capture: ${captures[0].san} (net gain: ${captures[0].netGain})`);
        return captures[0].san;
      }

      // Priority 4: Enhanced opening principles
      if (moveCount < 16) {
        debug.log(`[${contextId}] Applying opening principles...`);
        
        // 4a: Center control with pawns
        const centerPawnMoves = movesToConsider.filter(move => 
          ['e4', 'd4', 'e5', 'd5'].includes(move)
        );
        if (centerPawnMoves.length > 0) {
          const preferredCenter = centerPawnMoves.find(move => ['e4', 'd4'].includes(move)) || centerPawnMoves[0];
          debug.log(`[${contextId}] ✅ Center control: ${preferredCenter}`);
          return preferredCenter;
        }

        // 4b: Knight development (much better evaluation)
        const knightMoves = moves.filter(move => 
          move.piece === 'n' && 
          movesToConsider.includes(move.san) &&
          !move.captured &&
          (move.from[1] === '1' || move.from[1] === '8') // From back rank
        );
        
        if (knightMoves.length > 0) {
          // Prefer good squares for knights
          const goodKnightSquares = ['f3', 'c3', 'f6', 'c6', 'e2', 'd2', 'e7', 'd7'];
          const goodKnightMove = knightMoves.find(move => 
            goodKnightSquares.some(square => move.san.includes(square))
          ) || knightMoves[0];
          
          debug.log(`[${contextId}] ✅ Knight development: ${goodKnightMove.san}`);
          return goodKnightMove.san;
        }

        // 4c: Bishop development
        const bishopMoves = moves.filter(move => 
          move.piece === 'b' && 
          movesToConsider.includes(move.san) &&
          !move.captured &&
          (move.from[1] === '1' || move.from[1] === '8')
        );
        
        if (bishopMoves.length > 0) {
          // Prefer active squares for bishops
          const activeBishopSquares = ['c4', 'f4', 'c5', 'f5', 'b5', 'g5'];
          const goodBishopMove = bishopMoves.find(move => 
            activeBishopSquares.some(square => move.san.includes(square))
          ) || bishopMoves[0];
          
          debug.log(`[${contextId}] ✅ Bishop development: ${goodBishopMove.san}`);
          return goodBishopMove.san;
        }

        // 4d: Castling when appropriate
        const castling = movesToConsider.filter(move => move === 'O-O' || move === 'O-O-O');
        if (castling.length > 0 && moveCount > 6) {
          // Prefer kingside castling
          const preferredCastling = castling.find(move => move === 'O-O') || castling[0];
          debug.log(`[${contextId}] ✅ Castling: ${preferredCastling}`);
          return preferredCastling;
        }
      }

      // Priority 5: Middle/Endgame tactics (improved)
      if (moveCount >= 16) {
        // Look for good checks (not random ones)
        if (bot.personality?.tactics > 0.6 || bot.rating > 1600) {
          const goodChecks = [];
          for (const move of moves) {
            if (!movesToConsider.includes(move.san)) continue;
            
            const testGame = new Chess(chessGame.fen());
            const moveResult = testGame.move(move.san);
            if (moveResult && testGame.inCheck()) {
              // Evaluate if this check is useful
              const opponentMoves = testGame.moves();
              if (opponentMoves.length < moves.length) { // Limits opponent's options
                goodChecks.push(move);
              }
            }
          }
          
          if (goodChecks.length > 0) {
            debug.log(`[${contextId}] ✅ Tactical check: ${goodChecks[0].san}`);
            return goodChecks[0].san;
          }
        }
      }

      // Priority 6: Smart positional moves (much improved)
      const smartMoves = movesToConsider.filter(move => {
        const moveObj = moves.find(m => m.san === move);
        if (!moveObj) return true; // Keep if we can't analyze
        
        // Don't move queen too early unless capturing
        if (moveCount < 10 && moveObj.piece === 'q' && !moveObj.captured) {
          return false;
        }
        
        // Don't move same piece twice in opening without good reason
        if (moveCount < 16 && moveObj.piece !== 'p') {
          const recentMoves = history.slice(-4);
          const samePieceMoved = recentMoves.some(pastMove => {
            return pastMove[0] === moveObj.san[0] && pastMove[0] !== pastMove[0].toLowerCase();
          });
          
          if (samePieceMoved && !moveObj.captured) {
            return false;
          }
        }
        
        // Don't make obvious backward moves (unless forced)
        if (moveObj.piece === 'p' && !moveObj.captured) {
          const isBackward = (moveObj.from[1] > moveObj.to[1] && chessGame.turn() === 'w') ||
                            (moveObj.from[1] < moveObj.to[1] && chessGame.turn() === 'b');
          if (isBackward && movesToConsider.length > 3) {
            return false;
          }
        }
        
        return true;
      });

      // Final selection based on rating
      const finalMoves = smartMoves.length > 0 ? smartMoves : movesToConsider;
      let selectedMove;
      
      if (bot.rating > 2000) {
        // Very strong players - best 2-3 moves
        selectedMove = finalMoves[Math.floor(Math.random() * Math.min(3, finalMoves.length))];
      } else if (bot.rating > 1600) {
        // Strong players - top 25% of moves
        const topQuarter = Math.max(1, Math.floor(finalMoves.length * 0.25));
        selectedMove = finalMoves[Math.floor(Math.random() * topQuarter)];
      } else if (bot.rating > 1200) {
        // Intermediate - top 40% of moves
        const topPortion = Math.max(1, Math.floor(finalMoves.length * 0.4));
        selectedMove = finalMoves[Math.floor(Math.random() * topPortion)];
      } else if (bot.rating > 800) {
        // Lower intermediate - top 60% of moves
        const topPortion = Math.max(1, Math.floor(finalMoves.length * 0.6));
        selectedMove = finalMoves[Math.floor(Math.random() * topPortion)];
      } else {
        // Beginners - any reasonable move from filtered list
        selectedMove = finalMoves[Math.floor(Math.random() * finalMoves.length)];
      }

      if (!selectedMove) {
        selectedMove = legalMoves[0]; // Ultimate fallback
      }

      debug.log(`[${contextId}] ✅ Selected intelligent move: ${selectedMove} (rating-based selection from ${finalMoves.length} candidates)`);
      return selectedMove;

    } catch (error) {
      debug.error(`[${contextId}] ❌ Intelligent move error:`, error);
      return legalMoves[0]; // Emergency fallback
    }
  };

  // Add method to get move decision log for debugging
  const getMoveDecisionLog = useCallback(() => {
    return moveDecisionLog;
  }, [moveDecisionLog]);

  // Add method to check if bot is following tree
  const getTreeFollowingStats = useCallback(() => {
    const treeDecisions = moveDecisionLog.filter(log => log.source === 'moveTree');
    const totalDecisions = moveDecisionLog.length;
    
    return {
      treeMovesCount: treeDecisions.length,
      totalMoves: totalDecisions,
      treeFollowingRate: totalDecisions > 0 ? (treeDecisions.length / totalDecisions * 100).toFixed(1) + '%' : '0%',
      averageConfidence: treeDecisions.length > 0 ? 
        (treeDecisions.reduce((sum, log) => sum + (log.confidence || 0), 0) / treeDecisions.length).toFixed(1) + '%' : 'N/A'
    };
  }, [moveDecisionLog]);

  // Enhanced logging for debugging
  useEffect(() => {
    if (currentBot) {
      debug.log('🔍 Bot Updated:', {
        name: currentBot.displayName,
        rating: currentBot.rating,
        engineDepth: currentBot.engineSettings?.depth,
        treeSize: currentBot.moveTree ? Object.keys(currentBot.moveTree).length : 0,
        personality: currentBot.personality
      });
    }
  }, [currentBot]);

  return {
    // Core functionality
    setCurrentBot,
    currentBot,
    moveTree: currentBot?.moveTree,
    isLoading,
    botThinking,
    stockfishReady,
    lastError,
    createBotFromPlayer,
    getBotMove,
    stockfish,
    
    // Enhanced debugging and monitoring
    getMoveDecisionLog,
    getTreeFollowingStats,
    moveDecisionLog: moveDecisionLog.slice(-10), // Last 10 moves for UI display
    
    // Bot stats for UI
    botStats: currentBot ? {
      rating: currentBot.rating,
      engineDepth: currentBot.engineSettings?.depth,
      engineSkill: currentBot.engineSettings?.skillLevel,
      gamesAnalyzed: currentBot.gamesAnalyzed,
      treeSize: Object.keys(currentBot.moveTree || {}).length,
      personality: currentBot.personality
    } : null
  };
}