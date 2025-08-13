// src/hooks/useHybridBot.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { Chess } from 'chess.js';

// IMPORTANT: path from /src/hooks → /src/app/engines
import {
  getStockfishMove,
  warmupStockfish,
  isStockfishReady,
} from '../engines/getStockfishMove';

// ---------------- helpers ----------------

const normSAN = (san) => (san || '').replace(/[#+!?]+/g, '');

// UCI → SAN in the given game position
const uciToSan = (game, uci) => {
  if (!uci) return null;
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const copy = new Chess(game.fen());
  const mv = copy.move({ from, to, promotion }, { sloppy: true });
  return mv ? mv.san : null;
};

// pick with probability proportional to #games so repertoire feels human
const weightedPick = (children) => {
  const total = children.reduce((s, c) => s + (c.games || 1), 0);
  let r = Math.random() * total;
  for (const c of children) {
    r -= c.games || 1;
    if (r <= 0) return c;
  }
  return children[0];
};

// Follow moveTree using SAN and return { san, from: 'tree' } or null
const getTreeMove = (gameHistorySan, moveTree, legalSans) => {
  if (!moveTree || !Object.keys(moveTree).length) return null;

  const hist = gameHistorySan.map(normSAN);
  let node = moveTree;
  for (const san of hist) {
    if (node[san] && typeof node[san] === 'object') {
      node = node[san];
    } else {
      return null; // left the book
    }
  }

  const legalSet = new Set(legalSans.map(normSAN));

  const children = Object.entries(node)
    .filter(([k, v]) => k !== '__games' && typeof v === 'object' && v.__games)
    .map(([move, data]) => ({ move, games: data.__games }))
    .filter(({ move }) => legalSet.has(normSAN(move)));

  if (!children.length) return null;

  const pick = weightedPick(children);
  return { san: pick.move, from: 'tree' };
};

// --------------- hook --------------------

export function useHybridBot() {
  const [currentBot, _setCurrentBot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [lastError, setLastError] = useState(null);
  const [stockfishReady, setStockfishReady] = useState(false);

  const currentBotRef = useRef(null);
  const setCurrentBot = useCallback((bot) => {
    _setCurrentBot(bot);
    currentBotRef.current = bot;
  }, []);

  // Warm up the engine once so UI can show "Ready"
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await warmupStockfish(1200);
        if (alive) setStockfishReady(isStockfishReady());
      } catch (e) {
        console.warn('[SF] warmup failed:', e);
        if (alive) setStockfishReady(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Create bot from username
  const createBotFromPlayer = useCallback(async (username) => {
    setIsLoading(true);
    setLastError(null);

    try {
      // rating (prefer rapid → blitz → bullet)
      let playerRating = 1200;
      try {
        const r = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`);
        const stats = await r.json();
        playerRating =
          stats?.chess_rapid?.last?.rating ??
          stats?.chess_blitz?.last?.rating ??
          stats?.chess_bullet?.last?.rating ??
          1200;
      } catch {
        /* keep default */
      }

      // moveTree + style from our API
      const resp = await fetch(`/api/fetchgames?username=${encodeURIComponent(username)}`);
      const data = await resp.json();

      const bot = {
        id: `bot-${username}-${Date.now()}`,
        username: username.toLowerCase(),
        displayName: data?.player?.displayName || username,
        rating: playerRating,
        personality: data?.style || { aggression: 0.5, tactics: 0.5 },
        gamesAnalyzed: data?.stats?.totalGames || 0,
        avatar: data?.player?.avatar,
        country: data?.player?.country,
        title: data?.player?.title,
        moveTree: data?.moveTree || {},
      };

      setCurrentBot(bot);

      // quick visibility into tree presence
      console.log('📚 moveTree root keys:', Object.keys(bot.moveTree).slice(0, 12));

      setIsLoading(false);
      return bot;
    } catch (e) {
      setIsLoading(false);
      setLastError(`createBotFromPlayer error: ${e.message}`);

      const bot = {
        id: `bot-${username}-${Date.now()}`,
        username: username.toLowerCase(),
        displayName: username,
        rating: 1200,
        personality: { aggression: 0.5, tactics: 0.5 },
        gamesAnalyzed: 0,
        moveTree: {},
      };
      setCurrentBot(bot);
      return bot;
    }
  }, [setCurrentBot]);

  // Main move generator (returns SAN)
  const getBotMove = useCallback(async (game) => {
    const bot = currentBotRef.current;
    if (!bot) return null;

    setBotThinking(true);
    setLastError(null);

    try {
      if (!game || typeof game.fen !== 'function' || typeof game.history !== 'function') {
        throw new Error('Invalid game instance');
      }

      const fen = game.fen();
      const chess = new Chess(fen);
      const legalSans = chess.moves();
      if (!legalSans.length) return null;

      const historySan = game.history();

      let picked = null;

      // 1) opening book
      if (historySan.length < 20) {
        picked = getTreeMove(historySan, bot.moveTree, legalSans);
      }

      // 2) engine fallback
      if (!picked) {
        const uci = await getStockfishMove(chess, bot.rating);
        const san = uciToSan(chess, uci);
        if (san) picked = { san, from: 'engine' };
      }

      // 3) last-ditch: first legal
      if (!picked || !legalSans.includes(picked.san)) {
        picked = { san: legalSans[0], from: 'fallback' };
      }

      console.log(`🧭 Move source: ${picked.from} → ${picked.san}`);
      return picked.san;
    } catch (e) {
      setLastError(`Move error: ${e.message}`);
      try {
        const ls = game.moves();
        return ls[0] || null;
      } catch {
        return null;
      }
    } finally {
      setBotThinking(false);
    }
  }, []);

  return {
    currentBot,
    setCurrentBot,
    createBotFromPlayer,
    getBotMove,
    isLoading,
    botThinking,
    lastError,
    stockfishReady,
  };
}
