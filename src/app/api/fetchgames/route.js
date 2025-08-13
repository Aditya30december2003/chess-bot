// app/api/fetchgames/route.js
import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';

// Constants
const MAX_MONTHS = 6;
const MAX_GAMES_PER_ARCHIVE = 100;
const MAX_PROCESSING_TIME = 30000;
const MAX_MOVE_TREE_DEPTH = 100;

// Fixed style analysis function
const analyzePlayerStyle = (games, username) => {
  if (!Array.isArray(games) || games.length === 0) {
    return getDefaultStyle();
  }

  const stats = {
    totalGames: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    tacticalMoves: 0,
    aggressiveMoves: 0,
    fastGames: 0,
    totalMoves: 0,
    openings: {},
    timeControls: {},
    pieceActivity: {
      knight: 0,
      bishop: 0,
      rook: 0,
      queen: 0
    }
  };

  // Process games
  const gamesToProcess = Math.min(games.length, 200);
  
  for (let i = 0; i < gamesToProcess; i++) {
    const game = games[i];
    if (!game || !game.pgn) continue;

    stats.totalGames++;

    try {
      // Game result analysis
      const playerIsWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
      const result = game.white?.result || 'unknown';
      
      if (result === 'win') {
        stats.wins += playerIsWhite ? 1 : 0;
        stats.losses += playerIsWhite ? 0 : 1;
      } else if (result === 'checkmated' || result === 'resigned') {
        stats.losses += playerIsWhite ? 1 : 0;
        stats.wins += playerIsWhite ? 0 : 1;
      } else if (result === 'draw') {
        stats.draws++;
      }

      // Time control analysis
      if (game.time_control) {
        const timeControl = String(game.time_control);
        stats.timeControls[timeControl] = (stats.timeControls[timeControl] || 0) + 1;
        
        if ((parseInt(timeControl) || 0) < 600) stats.fastGames++;
      }

      // PGN analysis
      const cleanedPgn = cleanPgn(game.pgn);
      if (!cleanedPgn) continue;

      const chess = new Chess();
      chess.loadPgn(cleanedPgn);
      const history = chess.history();
      
      if (history.length > 0) {
        stats.totalMoves += history.length;
        
        // Opening tracking
        if (history.length >= 4) {
          const opening = history.slice(0, 4).join(' ');
          if (opening.length < 50) {
            stats.openings[opening] = (stats.openings[opening] || 0) + 1;
          }
        }

        // Piece activity
        history.forEach(move => {
          if (move.startsWith('N')) stats.pieceActivity.knight++;
          else if (move.startsWith('B')) stats.pieceActivity.bishop++;
          else if (move.startsWith('R')) stats.pieceActivity.rook++;
          else if (move.startsWith('Q')) stats.pieceActivity.queen++;
        });

        // Tactical/aggressive moves
        const pgnLower = game.pgn.toLowerCase();
        stats.tacticalMoves += Math.min((pgnLower.match(/x/g) || []).length, 20);
        stats.aggressiveMoves += Math.min((pgnLower.match(/[!?]/g) || []).length, 10);
      }
    } catch (e) {
      console.warn(`Game ${i} analysis error:`, e.message.substring(0, 50));
    }
  }

  if (stats.totalGames === 0) return getDefaultStyle();

  return {
    aggression: Math.min(0.3 * (stats.aggressiveMoves / stats.totalGames) + 
                0.7 * (stats.fastGames / stats.totalGames), 1),
    tactics: Math.min(stats.tacticalMoves / stats.totalGames / 5, 1),
    winRate: stats.wins / stats.totalGames,
    drawRate: stats.draws / stats.totalGames,
    speed: stats.fastGames / stats.totalGames,
    averageGameLength: stats.totalMoves / stats.totalGames,
    pieceActivity: {
      knight: stats.pieceActivity.knight / stats.totalMoves,
      bishop: stats.pieceActivity.bishop / stats.totalMoves,
      rook: stats.pieceActivity.rook / stats.totalMoves,
      queen: stats.pieceActivity.queen / stats.totalMoves
    },
    preferredOpenings: stats.openings,
    timeControls: stats.timeControls,
    gamesAnalyzed: stats.totalGames
  };
};
function getDefaultStyle() {
  return {
    aggression: 0.5,
    tactics: 0.5,
    winRate: 0.5,
    drawRate: 0.2,
    speed: 0.5,
    averageGameLength: 40,
    pieceActivity: {
      knight: 0.15,
      bishop: 0.15,
      rook: 0.1,
      queen: 0.05
    },
    preferredOpenings: {},
    timeControls: {},
    gamesAnalyzed: 0
  };
}

// Main API handler
export async function GET(request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'demo';
    const monthsBack = Math.min(parseInt(searchParams.get('months')) || 3, MAX_MONTHS);

    console.log(`🚀 Fetching data for ${username} (last ${monthsBack} months)`);

    // 1. Fetch player profile
    let playerData = {};
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://api.chess.com/pub/player/${username}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Chess-Bot/1.0' }
      });
      
      if (response.ok) playerData = await response.json();
    } catch (e) {
      console.warn('Player data fetch failed:', e.message);
    }

    // 2. Prepare archive URLs
    const now = new Date();
    const archives = [];
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      archives.push(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
    }

    // 3. Process game archives
    const moveTree = {};
    let allGames = [];
    let totalGamesProcessed = 0;
    let errorCount = 0;

    for (const archiveUrl of archives) {
      // Check timeout
      if (Date.now() - startTime > MAX_PROCESSING_TIME - 5000) {
        console.log('⏰ Approaching timeout, stopping archive processing');
        break;
      }

      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch(archiveUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Chess-Bot/1.0' }
        });

        if (!res.ok) {
          console.warn(`Archive ${archiveUrl} failed: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const games = Array.isArray(data.games) 
          ? data.games.slice(0, MAX_GAMES_PER_ARCHIVE)
          : [];

        allGames = allGames.concat(games);
        console.log(`📊 ${archiveUrl}: ${games.length} games`);

        // Process games in batches
        for (let i = 0; i < games.length; i++) {
          if (Date.now() - startTime > MAX_PROCESSING_TIME - 2000) break;

          const game = games[i];
          if (!game?.pgn) {
            errorCount++;
            continue;
          }

          try {
            const cleanedPgn = cleanPgn(game.pgn);
            if (!cleanedPgn) {
              errorCount++;
              continue;
            }

            const chess = new Chess();
            chess.loadPgn(cleanedPgn);
            const history = chess.history();
            
            if (history.length > 0 && history.length < 200) {
              buildMoveTree(history, moveTree);
              totalGamesProcessed++;
            }

            // Yield to event loop periodically
            if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
          } catch (e) {
            errorCount++;
            if (errorCount % 20 === 0) {
              console.warn(`Encountered ${errorCount} errors`);
            }
          }
        }

        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limiting
      } catch (e) {
        console.warn(`Archive ${archiveUrl} failed:`, e.message);
      }
    }

    // 4. Analyze style and prepare response
    const playerStyle = analyzePlayerStyle(allGames, username);
    const rating = playerData.stats?.chess_rapid?.last?.rating || 
                  playerData.stats?.chess_blitz?.last?.rating || 
                  playerData.stats?.chess_bullet?.last?.rating || 1200;

    const response = {
      moveTree,
      player: {
        username: username.toLowerCase(),
        displayName: playerData.name || username,
        rating,
        avatar: playerData.avatar,
        country: playerData.country,
        title: playerData.title
      },
      style: playerStyle,
      stats: {
        totalGames: totalGamesProcessed,
        errorCount,
        monthsAnalyzed: monthsBack,
        processingTime: Date.now() - startTime
      }
    };

    // Enhance with demo data if insufficient games
    if (totalGamesProcessed < 10) {
      console.log('⚠️ Enhancing with demo data');
      response.moveTree = mergeTrees(getStandardOpenings(), response.moveTree);
      response.stats.demoDataAdded = true;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: error.message,
      moveTree: getStandardOpenings(),
      player: {
        username: 'demo',
        displayName: 'Demo Player',
        rating: 1200
      },
      style: getDefaultStyle(),
      stats: {
        totalGames: 0,
        errorCount: 1,
        error: error.message.substring(0, 100)
      }
    }, { status: 200 });
  }
}

// Helper functions
function mergeTrees(tree1, tree2) {
  const result = { ...tree1 };
  for (const [move, data] of Object.entries(tree2)) {
    if (result[move]) {
      result[move].__games += data.__games || 0;
      if (data.__fen) result[move].__fen = data.__fen;
      for (const [childMove, childData] of Object.entries(data)) {
        if (childMove !== '__games' && childMove !== '__fen') {
          result[move][childMove] = mergeTrees(
            result[move][childMove] || {}, 
            childData
          );
        }
      }
    } else {
      result[move] = { ...data };
    }
  }
  return result;
}

function getStandardOpenings() {
  return {
    "e4": {
      "__games": 500,
      "e5": { 
        "__games": 300,
        "Nf3": {
          "__games": 200,
          "Nc6": {
            "__games": 150,
            "Bb5": { "__games": 100, "a6": { "__games": 80 } },
            "Bc4": { "__games": 50, "Nf6": { "__games": 30 } }
          }
        }
      },
      "c5": {
        "__games": 150,
        "Nf3": {
          "__games": 100,
          "d6": { "__games": 70, "Nc6": { "__games": 30 } }
        }
      }
    },
    "d4": {
      "__games": 400,
      "d5": {
        "__games": 250,
        "c4": {
          "__games": 200,
          "e6": { "__games": 120 },
          "dxc4": { "__games": 80 }
        }
      }
    }
  };
}