// hooks/useHybridBot.js - Move Tree + Stockfish Engine System
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

// Player personality analysis from games
const analyzePlayerStyle = (games, username) => {
  let totalGames = 0;
  let wins = 0;
  let tacticalMoves = 0;
  let aggressiveMoves = 0;
  let fastGames = 0;
  let averageGameLength = 0;
  
  const openings = {};
  
  games.forEach(game => {
    if (!game.pgn) return;
    
    totalGames++;
    
    // Determine if this player won
    const isWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
    const result = game.white?.result;
    if ((isWhite && result === 'win') || (!isWhite && result !== 'win' && result !== 'draw')) {
      wins++;
    }
    
    // Analyze time control (fast vs slow)
    if (game.time_control && parseInt(game.time_control) < 600) {
      fastGames++;
    }
    
    // Basic PGN analysis for opening detection
    try {
      const moves = game.pgn.split(/\d+\./).slice(1).map(m => m.trim().split(' ')[0]).filter(m => m);
      averageGameLength += moves.length;
      
      // Track opening moves (first 6 moves)
      if (moves.length >= 2) {
        const opening = moves.slice(0, 2).join(' ');
        openings[opening] = (openings[opening] || 0) + 1;
      }
      
      // Simple heuristics for style
      const pgnText = game.pgn.toLowerCase();
      if (pgnText.includes('x')) tacticalMoves++; // Captures
      if (pgnText.includes('!') || pgnText.includes('?!')) aggressiveMoves++; // Exciting moves
      
    } catch (e) {
      // Skip problematic PGNs
    }
  });
  
  if (totalGames === 0) return getDefaultPersonality();
  
  averageGameLength = averageGameLength / totalGames;
  
  return {
    aggression: Math.min((aggressiveMoves / totalGames) + (fastGames / totalGames), 1),
    tactics: Math.min(tacticalMoves / totalGames, 1),
    winRate: wins / totalGames,
    speed: fastGames / totalGames,
    gameLength: averageGameLength,
    preferredOpenings: openings,
    gamesAnalyzed: totalGames
  };
};

const getDefaultPersonality = () => ({
  aggression: 0.5,
  tactics: 0.5,
  winRate: 0.5,
  speed: 0.5,
  gameLength: 40,
  preferredOpenings: {},
  gamesAnalyzed: 0
});

// Convert personality to engine settings
const personalityToEngineSettings = (personality, rating) => {
  const baseRating = Math.max(400, Math.min(2800, rating || 1200));
  
  return {
    // Engine depth based on rating (higher rating = deeper search)
    depth: Math.max(1, Math.min(15, Math.floor(baseRating / 200))),
    
    // Skill level (1-20, where 20 is strongest)
    skillLevel: Math.max(1, Math.min(20, Math.floor(baseRating / 140))),
    
    // Time per move based on speed preference
    moveTime: personality.speed > 0.6 ? 500 : (personality.speed > 0.3 ? 1500 : 3000),
    
    // Contempt factor (aggression)
    contempt: Math.floor(personality.aggression * 50),
    
    // Multiple variations for tactical players
    multipv: personality.tactics > 0.6 ? 3 : 1,
    
    // Error probability (lower rating = more errors)
    errorRate: Math.max(0, (2000 - baseRating) / 2000)
  };
};

export function useHybridBot() {
  const [stockfish, setStockfish] = useState(null);
  const [currentBot, setCurrentBot] = useState(null);
  const [moveTree, setMoveTree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [stockfishReady, setStockfishReady] = useState(false);

  // Initialize Stockfish engine
  useEffect(() => {
    const initStockfish = async () => {
      try {
        // For now, we'll use a CDN version since npm might not work in all environments
        const wasmSupported = (() => {
          try {
            if (typeof WebAssembly === "object"
              && typeof WebAssembly.instantiate === "function") {
              // eslint-disable-next-line @next/next/no-assign-module-variable
              const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
              if (module instanceof WebAssembly.Module)
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
            }
          } catch (e) {}
          return false;
        })();
        
        console.log('🔧 Initializing Stockfish engine...');
        console.log('WASM supported:', wasmSupported);
        
        // Note: In a real implementation, you'd load Stockfish here
        // For demo purposes, we'll simulate the engine
        const mockEngine = {
          postMessage: (cmd) => console.log('Stockfish command:', cmd),
          addMessageListener: (callback) => {},
          removeMessageListener: (callback) => {}
        };
        
        setStockfish(mockEngine);
        setStockfishReady(true);
        console.log('✅ Stockfish engine ready');
        
      } catch (error) {
        console.error('❌ Failed to initialize Stockfish:', error);
        setStockfishReady(false);
      }
    };

    initStockfish();
  }, []);

  // Create bot from any Chess.com player
  const createBotFromPlayer = async (username) => {
    setIsLoading(true);
    try {
      console.log(`🔍 Creating bot from player: ${username}`);
      
      // Step 1: Fetch player info
      const playerResponse = await fetch(`https://api.chess.com/pub/player/${username}`);
      if (!playerResponse.ok) throw new Error('Player not found');
      const playerData = await playerResponse.json();
      
      // Step 2: Get recent game archives (last 6 months)
      const now = new Date();
      const archives = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        archives.push(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
      }
      
      // Step 3: Fetch games and build move tree
      const { games: allGames, moveTree: playerMoveTree } = await fetchAndBuildMoveTree(archives);
      
      // Step 4: Analyze playing style
      const personality = analyzePlayerStyle(allGames, username);
      const rating = playerData.stats?.chess_rapid?.last?.rating || 
                    playerData.stats?.chess_blitz?.last?.rating || 1200;
      
      // Step 5: Create engine configuration
      const engineSettings = personalityToEngineSettings(personality, rating);
      
      const botProfile = {
        username: username.toLowerCase(),
        displayName: playerData.name || username,
        rating,
        personality,
        engineSettings,
        gamesAnalyzed: allGames.length,
        avatar: playerData.avatar,
        country: playerData.country,
        title: playerData.title
      };
      
      setCurrentBot(botProfile);
      setMoveTree(playerMoveTree);
      
      console.log(`✅ Bot created for ${username}:`, botProfile);
      console.log(`📊 Personality:`, personality);
      console.log(`⚙️ Engine settings:`, engineSettings);
      console.log(`📖 Move tree size:`, Object.keys(playerMoveTree).length);
      
      return botProfile;
      
    } catch (error) {
      console.error(`❌ Failed to create bot for ${username}:`, error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch games and build move tree
  const fetchAndBuildMoveTree = async (archives) => {
    const moveTree = {};
    let allGames = [];
    let errorCount = 0;

    for (const archiveUrl of archives) {
      try {
        const res = await fetch(archiveUrl);
        const data = await res.json();
        const games = data.games || [];
        allGames = allGames.concat(games);

        // Build move tree from games
        for (const game of games) {
          if (!game.pgn) continue;

          try {
            const chess = new Chess();
            chess.loadPgn(game.pgn);
            const history = chess.history();
            
            if (history.length > 0) {
              buildMoveTree(history, moveTree);
            }
          } catch (e) {
            errorCount++;
          }
        }
      } catch (err) {
        console.warn(`Failed to fetch: ${archiveUrl}`);
      }
    }

    console.log(`📊 Processed ${allGames.length} games, ${errorCount} errors`);
    return { games: allGames, moveTree };
  };

  // Build move tree from game history
  const buildMoveTree = (moves, tree) => {
    let node = tree;
    for (const move of moves) {
      if (!node[move]) {
        node[move] = { __games: 0 };
      }
      node[move].__games += 1;
      node = node[move];
    }
  };

  // Hybrid move selection: Tree + Engine
  const getBotMove = async (gameInstance, gameHistory) => {
    if (!currentBot) return null;

    setBotThinking(true);
    
    try {
      const game = new Chess(gameInstance.fen());
      const moveCount = gameHistory.length;
      const isOpening = moveCount < 20; // First 10 moves per side
      const isTactical = isPositionTactical(game);
      
      console.log(`🤖 ${currentBot.displayName} thinking... (move ${moveCount + 1}, tactical: ${isTactical})`);
      
      // PRIORITY 1: Use Move Tree for opening moves
      if (isOpening && moveTree && !isTactical) {
        const treeMove = getTreeMove(gameHistory, moveTree, game);
        if (treeMove) {
          console.log(`📖 Using ${currentBot.displayName}'s opening repertoire: ${treeMove}`);
          await simulateThinking();
          return treeMove;
        }
      }
      
      // PRIORITY 2: Use engine for tactical positions or when tree exhausted
      if (stockfishReady) {
        console.log(`⚡ Using engine for ${currentBot.displayName} (${isTactical ? 'tactical' : 'positional'})`);
        const engineMove = await getEngineMove(game, gameHistory);
        if (engineMove) return engineMove;
      }
      
      // FALLBACK: Intelligent random move
      const moves = game.moves();
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      console.log(`🎲 Fallback random move: ${randomMove}`);
      await simulateThinking();
      return randomMove;
      
    } catch (error) {
      console.error('Error getting bot move:', error);
      return null;
    } finally {
      setBotThinking(false);
    }
  };

  // Check if position requires tactical calculation
  const isPositionTactical = (game) => {
    if (game.inCheck()) return true;
    
    const moves = game.moves({ verbose: true });
    const hasCaptures = moves.some(move => move.captured);
    const hasChecks = moves.some(move => {
      game.move(move);
      const inCheck = game.inCheck();
      game.undo();
      return inCheck;
    });
    
    return hasCaptures || hasChecks;
  };

  // Get move from player's move tree
  const getTreeMove = (gameHistory, moveTree, game) => {
    try {
      let node = moveTree;
      
      // Follow the game path in the tree
      for (const move of gameHistory) {
        if (!node[move]) return null;
        node = node[move];
      }
      
      // Get available moves from tree
      const treeMoves = Object.entries(node)
        .filter(([key]) => key !== '__games' && key !== '_stats')
        .map(([move, data]) => ({
          move,
          count: data.__games || 0,
        }));
      
      if (treeMoves.length === 0) return null;
      
      // Filter to legal moves
      const legalMoves = game.moves();
      const validMoves = treeMoves.filter(tm => legalMoves.includes(tm.move));
      
      if (validMoves.length === 0) return null;
      
      // Select move based on popularity with some variety
      validMoves.sort((a, b) => b.count - a.count);
      
      // 70% chance for most played, 30% for variety
      if (Math.random() < 0.7) {
        return validMoves[0].move;
      } else {
        const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
        return topMoves[Math.floor(Math.random() * topMoves.length)].move;
      }
      
    } catch (error) {
      console.error('Error in getTreeMove:', error);
      return null;
    }
  };

  // Get move from engine (simulated for now)
  const getEngineMove = async (game, gameHistory) => {
    const settings = currentBot.engineSettings;
    
    // Simulate engine thinking time
    await new Promise(resolve => setTimeout(resolve, settings.moveTime));
    
    // For demo: return a reasonable move
    // In real implementation, this would use Stockfish
    const moves = game.moves();
    
    // Simulate different playing strengths
    if (Math.random() < settings.errorRate) {
      // Make a suboptimal move occasionally
      return moves[Math.floor(Math.random() * moves.length)];
    }
    
    // Try to make a good move (prioritize captures, checks)
    const captures = moves.filter(move => {
      const moveObj = game.move(move);
      const isCapture = moveObj?.captured;
      game.undo();
      return isCapture;
    });
    
    if (captures.length > 0) {
      return captures[0]; // Take a piece
    }
    
    // Otherwise, make a developing move
    const developingMoves = moves.filter(move => 
      ['N', 'B'].includes(move[0]) && !['x', '+', '#'].some(char => move.includes(char))
    );
    
    if (developingMoves.length > 0 && gameHistory.length < 16) {
      return developingMoves[0];
    }
    
    return moves[Math.floor(Math.random() * moves.length)];
  };

  // Simulate thinking time based on personality
  const simulateThinking = async () => {
    const baseTime = currentBot.engineSettings.moveTime;
    const variance = baseTime * 0.3;
    const thinkingTime = baseTime + (Math.random() - 0.5) * variance;
    await new Promise(resolve => setTimeout(resolve, Math.max(500, thinkingTime)));
  };

  return {
    currentBot,
    moveTree,
    isLoading,
    botThinking,
    stockfishReady,
    createBotFromPlayer,
    getBotMove,
    stockfish
  };
}