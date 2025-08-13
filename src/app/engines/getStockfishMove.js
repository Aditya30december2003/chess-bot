"use client";
import { StockfishEngine } from './StockfishEngine';

let _engine = null;
let _ready = false;

const eloToDepth = (elo) => {
  const e = Math.max(400, Math.min(3200, elo || 1200));
  if (e < 800) return 6;
  if (e < 1200) return 8;
  if (e < 1600) return 10;
  if (e < 2000) return 12;
  if (e < 2400) return 16;
  return 20;
};

export async function warmupStockfish(initialElo = 1200) {
  if (!_engine) {
    console.log('[SF] warmup: creating engine…');
    _engine = new StockfishEngine({ elo: initialElo, depth: eloToDepth(initialElo) });
    await _engine.ready();
    console.log('[SF] warmup: ready');
    _ready = true;
  }
  return true;
}

export function isStockfishReady() { return _ready; }

export async function getStockfishMove(gameOrFen, rating = 1200) {
  const fen = typeof gameOrFen === 'string' ? gameOrFen : gameOrFen.fen();
  await warmupStockfish(rating);
  _engine.setStrength({ elo: rating, depth: eloToDepth(rating) });
  return _engine.getBestMove(fen); // UCI string
}
