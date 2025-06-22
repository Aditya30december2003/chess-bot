import { NextResponse } from 'next/server';
import { Chess } from 'chess.js';
import axios from 'axios';

const archives = [
  "https://api.chess.com/pub/player/adi30demigod/games/2025/04",
  "https://api.chess.com/pub/player/adi30demigod/games/2025/05",
  "https://api.chess.com/pub/player/adi30demigod/games/2025/06"
];

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

export async function GET() {
  const moveTree = {};

  for (const archiveUrl of archives) {
    try {
      const res = await axios.get(archiveUrl);
      const games = res.data.games;

      for (const game of games) {
        const chess = new Chess();
        if (!game.pgn) continue;

        try {
          chess.loadPgn(game.pgn);
          const history = chess.history();
          buildMoveTree(history, moveTree);
        } catch (e) {
          console.error('Invalid PGN:', e.message);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch: ${archiveUrl}`, err.message);
    }
  }

  return NextResponse.json(moveTree);
}
