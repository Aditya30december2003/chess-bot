// src/app/api/fetchgames/route.js
import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';

const MAX_MONTHS = 6;
const MAX_GAMES_PER_ARCHIVE = 100;
const MAX_PROCESSING_TIME = 30000;

const normSAN = (san) => (san || '').replace(/[#+!?]+/g, '');

function cleanPgn(pgn) {
  if (!pgn) return '';
  // strip clock comments etc – keep it simple
  return String(pgn).replace(/\{[^}]*\}/g, '').trim();
}

function buildMoveTree(history, tree) {
  let node = tree;
  for (const san of history) {
    const key = normSAN(san);
    node[key] = node[key] || { __games: 0 };
    node = node[key];
    node.__games = (node.__games || 0) + 1; // increment at every depth
  }
}

function analyzePlayerStyle(games, username) {
  // Keep a lightweight style; your previous one works—trimmed for brevity
  if (!Array.isArray(games) || games.length === 0) {
    return {
      aggression: 0.5, tactics: 0.5, winRate: 0.5, drawRate: 0.2, speed: 0.5,
      averageGameLength: 40, pieceActivity: { knight: 0.15, bishop: 0.15, rook: 0.1, queen: 0.05 },
      preferredOpenings: {}, timeControls: {}, gamesAnalyzed: 0
    };
  }
  // Minimal; keep your richer calc if you want
  return { aggression: 0.5, tactics: 0.5, winRate: 0.5, drawRate: 0.2, speed: 0.5,
    averageGameLength: 40, pieceActivity: { knight: 0.15, bishop: 0.15, rook: 0.1, queen: 0.05 },
    preferredOpenings: {}, timeControls: {}, gamesAnalyzed: Math.min(200, games.length)
  };
}

export async function GET(request) {
  const start = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get('username') || 'demo').toLowerCase();
    const monthsBack = Math.min(parseInt(searchParams.get('months') || '3', 10), MAX_MONTHS);

    // 1) Player profile (optional)
    let playerData = {};
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch(`https://api.chess.com/pub/player/${username}`, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Chess-Bot/1.0' }
      });
      if (r.ok) playerData = await r.json();
    } catch {}

    // 2) Build archive URLs
    const now = new Date();
    const archives = [];
    for (let i = 0; i < monthsBack; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      archives.push(`https://api.chess.com/pub/player/${username}/games/${y}/${m}`);
    }

    // 3) Fetch + parse
    const moveTree = {};
    const allGames = [];
    let totalGamesProcessed = 0;
    let errorCount = 0;

    for (const url of archives) {
      if (Date.now() - start > MAX_PROCESSING_TIME - 5000) break;
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 10000);
        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: { 'User-Agent': 'Chess-Bot/1.0' }
        });
        if (!res.ok) continue;

        const data = await res.json();
        const games = Array.isArray(data.games)
          ? data.games.slice(0, MAX_GAMES_PER_ARCHIVE) : [];

        allGames.push(...games);

        for (let i = 0; i < games.length; i++) {
          if (Date.now() - start > MAX_PROCESSING_TIME - 2000) break;
          const g = games[i];
          if (!g?.pgn) { errorCount++; continue; }

          try {
            const pgn = cleanPgn(g.pgn);
            const chess = new Chess();
            chess.loadPgn(pgn);
            const hist = chess.history().map(normSAN);

            if (hist.length > 0 && hist.length < 200) {
              buildMoveTree(hist, moveTree);
              totalGamesProcessed++;
            }
          } catch {
            errorCount++;
          }

          if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
        }

        await new Promise(r => setTimeout(r, 200)); // light rate limit
      } catch {
        // ignore per-archive failures
      }
    }

    const style = analyzePlayerStyle(allGames, username);

    const rating = playerData?.stats?.chess_rapid?.last?.rating
      || playerData?.stats?.chess_blitz?.last?.rating
      || playerData?.stats?.chess_bullet?.last?.rating
      || 1200;

    const response = {
      moveTree,
      player: {
        username,
        displayName: playerData.name || username,
        rating,
        avatar: playerData.avatar,
        country: playerData.country,
        title: playerData.title
      },
      style,
      stats: {
        totalGames: totalGamesProcessed,
        errorCount,
        monthsAnalyzed: monthsBack,
        processingTime: Date.now() - start
      }
    };

    // IMPORTANT: no demo tree injection here
    return NextResponse.json(response);

  } catch (error) {
    return NextResponse.json({
      error: error.message,
      moveTree: {},
      player: { username: 'demo', displayName: 'Demo Player', rating: 1200 },
      style: {
        aggression: 0.5, tactics: 0.5, winRate: 0.5, drawRate: 0.2, speed: 0.5,
        averageGameLength: 40, pieceActivity: { knight: 0.15, bishop: 0.15, rook: 0.1, queen: 0.05 },
        preferredOpenings: {}, timeControls: {}, gamesAnalyzed: 0
      },
      stats: { totalGames: 0, errorCount: 1, error: error.message.substring(0, 120) }
    }, { status: 200 });
  }
}
