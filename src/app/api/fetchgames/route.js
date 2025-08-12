// app/api/fetchgames/route.js - FIXED VERSION
import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';

// Build move tree from game history - FIXED to prevent infinite recursion
const buildMoveTree = (moves, tree) => {
  let node = tree;
  
  // Safety check to prevent infinite loops
  if (!Array.isArray(moves) || moves.length === 0) {
    return;
  }
  
  // Limit depth to prevent stack overflow (most games are <100 moves)
  const maxDepth = Math.min(moves.length, 80);
  
  for (let i = 0; i < maxDepth; i++) {
    const move = moves[i];
    if (typeof move !== 'string' || move.length === 0) {
      break; // Invalid move, stop here
    }
    
    if (!node[move]) {
      node[move] = { __games: 0 };
    }
    
    // Safety check to prevent circular references
    if (node[move] === node) {
      console.error('Circular reference detected, breaking');
      break;
    }
    
    node[move].__games += 1;
    node = node[move];
  }
};

// Clean PGN data - IMPROVED version
const cleanPgn = (pgn) => {
  if (!pgn || typeof pgn !== 'string') return null;
  
  try {
    // Remove problematic characters and normalize
    let cleanedPgn = pgn
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n')
      .trim();
    
    // Basic validation - must contain moves
    if (!cleanedPgn.includes('1.') && !cleanedPgn.includes('1 ')) {
      return null;
    }
    
    return cleanedPgn;
  } catch (e) {
    console.error('Error cleaning PGN:', e.message);
    return null;
  }
};

// Analyze player style - SAFE version
const analyzePlayerStyle = (games, username) => {
  if (!Array.isArray(games) || games.length === 0) {
    return getDefaultStyle();
  }
  
  let totalGames = 0;
  let wins = 0;
  let tacticalMoves = 0;
  let aggressiveMoves = 0;
  let fastGames = 0;
  let totalMoves = 0;
  
  const openings = {};
  const timeControls = {};
  
  // Limit processing to prevent timeout
  const gamesToProcess = Math.min(games.length, 200);
  
  for (let i = 0; i < gamesToProcess; i++) {
    const game = games[i];
    if (!game || !game.pgn) continue;
    
    totalGames++;
    
    try {
      // Determine if this player won
      const playerIsWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
      const result = game.white?.result || 'unknown';
      
      if ((playerIsWhite && result === 'win') || 
          (!playerIsWhite && result !== 'win' && result !== 'draw')) {
        wins++;
      }
      
      // Analyze time control
      if (game.time_control) {
        const timeControl = String(game.time_control);
        timeControls[timeControl] = (timeControls[timeControl] || 0) + 1;
        
        const timeInSeconds = parseInt(timeControl) || 0;
        if (timeInSeconds < 600) {
          fastGames++;
        }
      }
      
      // PGN analysis with safety checks
      const cleanedPgn = cleanPgn(game.pgn);
      if (!cleanedPgn) continue;
      
      const chess = new Chess();
      
      try {
        chess.loadPgn(cleanedPgn);
        const history = chess.history();
        
        if (history.length > 0) {
          totalMoves += history.length;
          
          // Track opening moves (first 4 moves only)
          if (history.length >= 4) {
            const opening = history.slice(0, 4).join(' ');
            if (opening.length < 50) { // Prevent huge strings
              openings[opening] = (openings[opening] || 0) + 1;
            }
          }
        }
      } catch (pgnError) {
        // Skip this game if PGN is invalid
        continue;
      }
      
      // Simple heuristics for playing style
      const pgnLower = game.pgn.toLowerCase();
      const captureCount = (game.pgn.match(/x/g) || []).length;
      tacticalMoves += Math.min(captureCount, 20); // Cap to prevent overflow
      
      const excitingMoveCount = (game.pgn.match(/[!?]/g) || []).length;
      aggressiveMoves += Math.min(excitingMoveCount, 10); // Cap to prevent overflow
      
    } catch (gameError) {
      console.warn(`Error processing game ${i}:`, gameError.message.substring(0, 50));
      continue;
    }
  }
  
  if (totalGames === 0) {
    return getDefaultStyle();
  }
  
  const averageGameLength = totalMoves / totalGames;
  
  return {
    aggression: Math.min((aggressiveMoves / totalGames) + (fastGames / totalGames * 0.3), 1),
    tactics: Math.min(tacticalMoves / totalGames / 10, 1),
    winRate: wins / totalGames,
    speed: fastGames / totalGames,
    averageGameLength: Math.min(averageGameLength, 200), // Cap game length
    preferredOpenings: openings,
    timeControls,
    gamesAnalyzed: totalGames
  };
};

function getDefaultStyle() {
  return {
    aggression: 0.5,
    tactics: 0.5,
    winRate: 0.5,
    speed: 0.5,
    averageGameLength: 40,
    preferredOpenings: {},
    timeControls: {},
    gamesAnalyzed: 0
  };
}

// Main API handler - SAFE version
export async function GET(request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'demo';
    const monthsBack = Math.min(parseInt(searchParams.get('months')) || 3, 6); // Limit to 6 months max
    
    console.log(`🚀 Fetching data for: ${username} (${monthsBack} months)`);
    
    // Step 1: Get player information with timeout
    let playerData = {};
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`https://api.chess.com/pub/player/${username}`, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Chess-Bot/1.0' }
      });
      
      if (response.ok) {
        playerData = await response.json();
      }
    } catch (error) {
      console.warn('Failed to fetch player data:', error.message);
      // Continue with empty player data
    }
    
    // Step 2: Generate archive URLs
    const now = new Date();
    const archives = [];
    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      archives.push(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
    }
    
    // Step 3: Fetch games with safety limits
    const moveTree = {};
    let allGames = [];
    let totalGames = 0;
    let errorCount = 0;
    const maxGamesPerArchive = 50; // Limit games per month
    
    console.log(`📦 Fetching from ${archives.length} archives...`);
    
    for (let archiveIndex = 0; archiveIndex < archives.length; archiveIndex++) {
      const archiveUrl = archives[archiveIndex];
      
      // Check if we're running out of time (max 25 seconds)
      if (Date.now() - startTime > 25000) {
        console.log('⏰ Timeout approaching, stopping fetch');
        break;
      }
      
      try {
        console.log(`📥 Fetching: ${archiveUrl}`);
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 15000); // 15 second timeout per request
        
        const res = await fetch(archiveUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Chess-Bot/1.0' }
        });
        
        if (!res.ok) {
          console.warn(`❌ Failed to fetch ${archiveUrl}: ${res.status}`);
          continue;
        }
        
        const data = await res.json();
        const games = Array.isArray(data.games) ? data.games.slice(0, maxGamesPerArchive) : [];
        
        allGames = allGames.concat(games);
        console.log(`✅ Found ${games.length} games in archive ${archiveIndex + 1}`);

        // Process games for move tree with safety checks
        for (let gameIndex = 0; gameIndex < games.length; gameIndex++) {
          const game = games[gameIndex];
          
          // Check timeout again
          if (Date.now() - startTime > 27000) {
            console.log('⏰ Timeout during processing, stopping');
            break;
          }
          
          if (!game || !game.pgn) {
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
            
            if (history.length > 0 && history.length < 200) { // Reasonable game length
              buildMoveTree(history, moveTree);
              totalGames++;
            }
            
            // Process in batches to prevent blocking
            if (gameIndex % 10 === 0) {
              await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop
            }
            
          } catch (e) {
            errorCount++;
            if (errorCount % 20 === 0) {
              console.log(`⚠️ PGN errors: ${errorCount}`);
            }
          }
        }
        
        // Small delay between archives to be nice to Chess.com
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        console.error(`❌ Archive fetch failed: ${archiveUrl}`, err.message);
        continue;
      }
    }
    
    // Step 4: Analyze playing style
    const playerStyle = analyzePlayerStyle(allGames, username);
    
    // Step 5: Get rating
    const rating = playerData.stats?.chess_rapid?.last?.rating || 
                  playerData.stats?.chess_blitz?.last?.rating || 
                  playerData.stats?.chess_bullet?.last?.rating || 1200;
    
    console.log(`✅ Processed ${totalGames} games for ${username} in ${Date.now() - startTime}ms`);
    
    // Step 6: Prepare safe response
    const response = {
      moveTree: moveTree,
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
        totalGames,
        errorCount,
        monthsAnalyzed: monthsBack,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      topOpenings: getTopOpenings(playerStyle.preferredOpenings)
    };
    
    // If very few games, enhance with demo data
    if (totalGames < 5) {
      console.log('⚠️ Few games processed, enhancing with demo data');
      response.moveTree = {
        ...getEnhancedDemoTree(),
        ...response.moveTree
      };
      response.stats.demoDataAdded = true;
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ API Error:', error.name, error.message);
    
    // Return safe fallback data
    return NextResponse.json({
      moveTree: getEnhancedDemoTree(),
      player: {
        username: 'demo',
        displayName: 'Demo Player',
        rating: 1200
      },
      style: getDefaultStyle(),
      stats: {
        totalGames: 0,
        errorCount: 0,
        error: `${error.name}: ${error.message.substring(0, 100)}`,
        timestamp: new Date().toISOString()
      },
      topOpenings: {}
    }, { status: 200 });
  }
}

// Helper function to get top openings safely
function getTopOpenings(openings) {
  if (!openings || typeof openings !== 'object') {
    return {};
  }
  
  try {
    return Object.entries(openings)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((obj, [key, value]) => {
        if (typeof key === 'string' && key.length < 100) { // Prevent huge keys
          obj[key] = value;
        }
        return obj;
      }, {});
  } catch (e) {
    return {};
  }
}

// Safe demo tree
function getEnhancedDemoTree() {
  return {
    "e4": { 
      "__games": 150, 
      "e5": { 
        "__games": 85, 
        "Nf3": { 
          "__games": 60,
          "Nc6": {
            "__games": 35,
            "Bb5": { "__games": 20, "a6": { "__games": 15, "Ba4": { "__games": 12 } } },
            "Bc4": { "__games": 10, "f5": { "__games": 6 } }
          },
          "Nf6": { "__games": 15, "Nxe4": { "__games": 8 } }
        },
        "f4": { "__games": 15, "exf4": { "__games": 10 } }
      },
      "c5": { 
        "__games": 40,
        "Nf3": { "__games": 25, "d6": { "__games": 15, "d4": { "__games": 10 } } }
      }
    },
    "d4": { 
      "__games": 120, 
      "d5": { 
        "__games": 70,
        "c4": { "__games": 45, "e6": { "__games": 25 } }
      },
      "Nf6": { "__games": 35, "c4": { "__games": 20 } }
    },
    "Nf3": { 
      "__games": 60,
      "d5": { "__games": 25, "d4": { "__games": 15 } },
      "Nf6": { "__games": 20, "c4": { "__games": 12 } }
    }
  };
}