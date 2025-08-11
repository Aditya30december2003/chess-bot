import { Chess } from 'chess.js';

export class AdiBot {
  constructor() {
    this.moveTree = this.createFallbackTree(); // Initialize with fallback tree
    this.botColor = 'white';
  }

  setMoveTree(moveTree) {
    // Ensure moveTree has proper structure
    this.moveTree = {
      white: moveTree?.white || this.createFallbackTree().white,
      black: moveTree?.black || this.createFallbackTree().black
    };
    console.log('🌲 Move tree loaded:', this.moveTree);
  }

  setPlayerColor(color) {
    this.botColor = color === 'white' ? 'black' : 'white';
    console.log(`🤖 Bot playing as ${this.botColor}`);
  }

  getBestMove(fen) {
    try {
      const game = new Chess(fen);
      if (game.isGameOver()) return null;

      const currentTurn = game.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== this.botColor) {
        console.log(`⚠️ Not bot's turn (Bot: ${this.botColor}, Current: ${currentTurn})`);
        return null;
      }

      const tree = this.moveTree[this.botColor];
      if (!tree || Object.keys(tree).length === 0) {
        console.log('⚠️ Empty move tree, using fallback');
        return this.getFallbackMove(game);
      }

      const history = game.history();
      let node = tree;

      for (const move of history) {
        if (node[move]) {
          node = node[move];
        } else {
          break;
        }
      }

      const possibleMoves = Object.entries(node)
        .filter(([key]) => key !== 'games')
        .map(([move, data]) => ({ move, count: data.games || 1 }));

      const validMoves = possibleMoves.filter(({ move }) => 
        game.moves().includes(move)
      );

      if (validMoves.length === 0) {
        return this.getFallbackMove(game);
      }

      // Weighted random selection
      const total = validMoves.reduce((sum, { count }) => sum + count, 0);
      const random = Math.random() * total;
      let cumulative = 0;

      for (const { move, count } of validMoves) {
        cumulative += count;
        if (random <= cumulative) {
          console.log(`✅ Selected move: ${move}`);
          return move;
        }
      }

      return validMoves[0].move;
    } catch (error) {
      console.error('❌ Error in getBestMove:', error);
      return null;
    }
  }

  getFallbackMove(game) {
    const moves = game.moves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }

  createFallbackTree() {
    return {
      white: {
        "e4": { games: 10, "e5": { games: 8 } },
        "d4": { games: 8, "d5": { games: 6 } },
        "Nf3": { games: 6, "d5": { games: 4 } }
      },
      black: {
        "e5": { games: 10, "Nf6": { games: 7 } },
        "e6": { games: 8, "d4": { games: 6 } },
        "c5": { games: 6, "Nf6": { games: 4 } }
      }
    };
  }
}