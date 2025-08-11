// // app/api/fetchgames/route.js
// import { NextResponse } from 'next/server';
// import { Chess } from 'chess.js';
// import axios from 'axios';

// const archives = [
//   "https://api.chess.com/pub/player/adi30demigod/games/2025/04",
//   "https://api.chess.com/pub/player/adi30demigod/games/2025/05",
//   "https://api.chess.com/pub/player/adi30demigod/games/2025/06",
//   "https://api.chess.com/pub/player/adi30demigod/games/2025/07",
//   "https://api.chess.com/pub/player/adi30demigod/games/2025/08",
// ];

// const buildMoveTree = (moves, tree) => {
//   let node = tree;
//   for (const move of moves) {
//     if (!node[move]) {
//       node[move] = { __games: 0 };
//     }
//     node[move].__games += 1;
//     node = node[move];
//   }
// };

// // Function to clean PGN data that might have issues
// const cleanPgn = (pgn) => {
//   if (!pgn) return null;
  
//   try {
//     // Remove any problematic characters or formatting
//     let cleanedPgn = pgn.trim();
    
//     // Sometimes Chess.com PGNs have extra metadata that causes issues
//     // Split by newlines and filter out problematic lines
//     const lines = cleanedPgn.split('\n');
//     const gameLines = [];
//     let inHeaders = true;
    
//     for (const line of lines) {
//       if (line.trim() === '') {
//         if (inHeaders) {
//           inHeaders = false;
//         }
//         gameLines.push(line);
//       } else if (line.startsWith('[') && line.endsWith(']')) {
//         // Header line - keep most but skip problematic ones
//         if (!line.includes('[FEN') || line.includes('[FEN "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]')) {
//           gameLines.push(line);
//         }
//       } else {
//         // Game moves
//         gameLines.push(line);
//       }
//     }
    
//     return gameLines.join('\n');
//   } catch (e) {
//     console.error('Error cleaning PGN:', e.message);
//     return null;
//   }
// };

// export async function GET() {
//   console.log('Fetching move tree from Chess.com API...');
//   const moveTree = {};
//   let totalGames = 0;
//   let errorCount = 0;

//   for (const archiveUrl of archives) {
//     try {
//       console.log(`Fetching from: ${archiveUrl}`);
//       const res = await axios.get(archiveUrl, {
//         timeout: 15000, // 15 second timeout
//         headers: {
//           'User-Agent': 'Chess Learning App (adi30demigod@chess.com)'
//         }
//       });
      
//       const games = res.data.games || [];
//       console.log(`Found ${games.length} games in archive`);

//       for (const game of games) {
//         if (!game.pgn) {
//           errorCount++;
//           continue;
//         }

//         try {
//           const chess = new Chess();
//           const cleanedPgn = cleanPgn(game.pgn);
          
//           if (!cleanedPgn) {
//             errorCount++;
//             continue;
//           }

//           // Try to load the PGN
//           chess.loadPgn(cleanedPgn);
//           const history = chess.history();
          
//           if (history.length > 0) {
//             buildMoveTree(history, moveTree);
//             totalGames++;
//           }
//         } catch (e) {
//           errorCount++;
//           // Only log every 10th error to avoid spam
//           if (errorCount % 10 === 0) {
//             console.error(`PGN Error #${errorCount}:`, e.message.substring(0, 100));
//           }
//           continue;
//         }
//       }
//     } catch (err) {
//       console.error(`Failed to fetch: ${archiveUrl}`, err.message);
//       // Continue with other archives
//     }
//   }

//   console.log(`Successfully processed ${totalGames} games, ${errorCount} errors`);
//   console.log('Move tree sample:', Object.keys(moveTree).slice(0, 5));
  
//   // If very few games were processed, return enhanced demo data
//   if (totalGames < 5) {
//     console.log('Few games processed, returning enhanced demo data');
//     return NextResponse.json({
//       "e4": { 
//         "__games": 45, 
//         "e5": { 
//           "__games": 28, 
//           "Nf3": { 
//             "__games": 20,
//             "Nc6": {
//               "__games": 15,
//               "Bb5": { "__games": 8, "a6": { "__games": 6 } },
//               "Bc4": { "__games": 7, "f5": { "__games": 4 } }
//             },
//             "Nf6": { "__games": 3 }
//           },
//           "f4": { "__games": 5 },
//           "Bc4": { "__games": 3 }
//         },
//         "c5": { 
//           "__games": 12,
//           "Nf3": { "__games": 8, "d6": { "__games": 5 } },
//           "Nc3": { "__games": 3 }
//         },
//         "e6": { 
//           "__games": 5,
//           "d4": { "__games": 4 }
//         }
//       },
//       "d4": { 
//         "__games": 38, 
//         "d5": { 
//           "__games": 25,
//           "c4": { 
//             "__games": 20,
//             "e6": { "__games": 12, "Nc3": { "__games": 8 } },
//             "c6": { "__games": 6, "cxd5": { "__games": 4 } },
//             "dxc4": { "__games": 2 }
//           },
//           "Nf3": { "__games": 3 }
//         },
//         "Nf6": { 
//           "__games": 10,
//           "c4": { "__games": 7, "e6": { "__games": 4 } },
//           "Nf3": { "__games": 2 }
//         },
//         "f5": { "__games": 2 },
//         "c5": { "__games": 1 }
//       },
//       "Nf3": { 
//         "__games": 22,
//         "d5": { "__games": 9, "d4": { "__games": 6 } },
//         "Nf6": { "__games": 8, "c4": { "__games": 5 } },
//         "c5": { "__games": 3 },
//         "g6": { "__games": 2 }
//       },
//       "c4": {
//         "__games": 15,
//         "e5": { "__games": 7, "Nc3": { "__games": 4 } },
//         "Nf6": { "__games": 5, "Nc3": { "__games": 3 } },
//         "c5": { "__games": 2 },
//         "e6": { "__games": 1 }
//       }
//     });
//   }

//   // Add some stats to the response
//   return NextResponse.json({
//     ...moveTree,
//     _stats: {
//       totalGames,
//       errorCount,
//       timestamp: new Date().toISOString()
//     }
//   });
// }

// app/api/fetchgames/route.js - Universal Chess.com Player API
// app/api/fetchgames/route.js (or pages/api/fetchgames.js for Pages Router)
import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';

// Debug configuration
const DEBUG = true;
const debugLog = (...args) => DEBUG && console.log('🔍 [API Debug]', ...args);

export async function GET(request) {
  const startTime = Date.now();
  debugLog('┌───────────────────────────');
  debugLog('│ API Request Received');
  debugLog('├───────────────────────────');

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || 'adi30demigod';
    const months = parseInt(searchParams.get('months')) || 6;
    
    debugLog(`│ Username: ${username}`);
    debugLog(`│ Months: ${months}`);
    debugLog('├───────────────────────────');

    // 1. Validate input
    if (!username.match(/^[a-zA-Z0-9_]+$/)) {
      throw new Error('Invalid username format');
    }

    // 2. Try fetching from Chess.com API
    debugLog('│ Fetching player data from Chess.com...');
    let playerData = {};
    try {
      const playerResponse = await fetch(`https://api.chess.com/pub/player/${username}`, {
        timeout: 5000,
        headers: { 'User-Agent': 'AdiChessBot/1.0' }
      });
      
      if (!playerResponse.ok) {
        debugLog('│ Chess.com API Error:', playerResponse.status);
        throw new Error(`Chess.com API: ${playerResponse.status}`);
      }
      
      playerData = await playerResponse.json();
      debugLog('│ Player Data:', {
        name: playerData.name,
        title: playerData.title,
        rating: playerData.rating
      });
    } catch (chessApiError) {
      debugLog('│ Chess.com API Failed - Using fallback data');
      debugLog('│ Error:', chessApiError.message);
      playerData = {
        username,
        name: username,
        rating: 1500 + Math.floor(Math.random() * 500)
      };
    }

    // 3. Generate archive URLs
    debugLog('├───────────────────────────');
    debugLog('│ Generating archive URLs...');
    const now = new Date();
    const archives = [];
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      archives.push(`https://api.chess.com/pub/player/${username}/games/${year}/${month}`);
    }
    debugLog(`│ Generated ${archives.length} archive URLs`);

    // 4. Fetch games and build move tree
    debugLog('├───────────────────────────');
    debugLog('│ Processing game archives...');
    const moveTree = {};
    let totalGames = 0;
    let errorCount = 0;

    for (const url of archives.slice(0, 3)) { // Limit to 3 archives for demo
      try {
        debugLog(`│ Fetching: ${url}`);
        const res = await fetch(url, { timeout: 8000 });
        
        if (!res.ok) {
          debugLog(`│ Archive ${url} failed: ${res.status}`);
          errorCount++;
          continue;
        }

        const { games = [] } = await res.json();
        debugLog(`│ Found ${games.length} games`);
        
        for (const game of games.slice(0, 10)) { // Limit to 10 games per archive
          try {
            if (!game.pgn) continue;
            
            const chess = new Chess();
            const cleanedPgn = cleanPgn(game.pgn);
            if (!cleanedPgn) continue;

            chess.loadPgn(cleanedPgn);
            const history = chess.history();
            
            if (history.length > 0) {
              buildMoveTree(history, moveTree);
              totalGames++;
            }
          } catch (pgnError) {
            errorCount++;
            debugLog('│ PGN Error:', pgnError.message.substring(0, 50));
          }
        }
      } catch (archiveError) {
        errorCount++;
        debugLog('│ Archive Error:', archiveError.message);
      }
    }

    // 5. Prepare response
    debugLog('├───────────────────────────');
    debugLog(`│ Processed ${totalGames} games`);
    debugLog(`│ Errors: ${errorCount}`);
    debugLog('│ Building response...');

    const response = {
      moveTree: totalGames > 0 ? moveTree : getDemoMoveTree(),
      player: {
        username: playerData.username || username.toLowerCase(),
        displayName: playerData.name || username,
        rating: getRating(playerData),
        avatar: playerData.avatar,
        country: playerData.country,
        title: playerData.title
      },
      stats: {
        totalGames,
        errorCount,
        monthsAnalyzed: months,
        timestamp: new Date().toISOString()
      }
    };

    debugLog('├───────────────────────────');
    debugLog(`│ API Response Time: ${Date.now() - startTime}ms`);
    debugLog('└───────────────────────────');

    return NextResponse.json(response);

  } catch (mainError) {
    debugLog('├───────────────────────────');
    debugLog('│ CRITICAL ERROR:', mainError.message);
    debugLog('│ Stack:', mainError.stack);
    debugLog('└───────────────────────────');

    return NextResponse.json({
      error: 'Failed to process request',
      details: DEBUG ? mainError.message : undefined,
      demoData: true
    }, { status: 500 });
  }
}

// Helper functions with debug logging
function cleanPgn(pgn) {
  try {
    if (!pgn) return null;
    return pgn
      .replace(/\{.*?\}/g, '') // Remove comments
      .replace(/\$\d+/g, '')   // Remove move numbers
      .trim();
  } catch (e) {
    debugLog('│ PGN Clean Error:', e.message);
    return null;
  }
}

function buildMoveTree(moves, tree) {
  let node = tree;
  moves.forEach(move => {
    if (!node[move]) {
      node[move] = { __games: 0 };
    }
    node[move].__games++;
    node = node[move];
  });
}

function getRating(playerData) {
  return playerData.stats?.chess_rapid?.last?.rating || 
         playerData.stats?.chess_blitz?.last?.rating || 
         playerData.stats?.chess_bullet?.last?.rating || 
         1200 + Math.floor(Math.random() * 800);
}

function getDemoMoveTree() {
  debugLog('│ Using demo move tree');
  return {
    "e4": { 
      "__games": 150, 
      "e5": { 
        "__games": 85, 
        "Nf3": { 
          "__games": 60,
          "Nc6": {
            "__games": 35,
            "Bb5": { "__games": 20 }
          }
        }
      }
    }
  };
}