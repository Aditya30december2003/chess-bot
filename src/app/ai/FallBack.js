// src/ai/FallbackEngine.js
// Fallback engine for when Stockfish isn't available (improved 1500-level logic)

import { Chess } from 'chess.js';

export function getFallbackMove(game) {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // 1500 rating bot - advanced strategy with minimal randomness
  const scoredMoves = moves.map(move => {
    const testGame = new Chess(game.fen());
    const moveObj = testGame.move(move);
    let score = 0;

    // Piece values (more accurate)
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    
    // Material evaluation
    if (moveObj.captured) {
      score += pieceValues[moveObj.captured];
    }
    
    // Checkmate is top priority
    if (testGame.isCheckmate()) {
      score += 100000;
    }
    
    // Checks are valuable
    if (testGame.isCheck()) {
      score += 50;
    }
    
    // Castling is good
    if (moveObj.flags.includes('k') || moveObj.flags.includes('q')) {
      score += 60;
    }
    
    // Promotion is very good
    if (moveObj.flags.includes('p')) {
      score += 800;
    }
    
    // Center control (more sophisticated)
    const centerSquares = ['d4', 'd5', 'e4', 'e5'];
    const extendedCenter = ['c3', 'c4', 'c5', 'c6', 'd3', 'd6', 'e3', 'e6', 'f3', 'f4', 'f5', 'f6'];
    
    if (centerSquares.includes(moveObj.to)) {
      score += 30;
    } else if (extendedCenter.includes(moveObj.to)) {
      score += 15;
    }
    
    // Piece development in opening
    const moveCount = testGame.history().length;
    if (moveCount < 20) {
      if (moveObj.piece === 'n' || moveObj.piece === 'b') {
        if (moveObj.from[1] === '1' || moveObj.from[1] === '8') {
          score += 25; // Developing pieces from back rank
        }
      }
    }
    
    // Avoid hanging pieces (more sophisticated)
    const fromSquareAttackers = testGame.attackers(testGame.turn() === 'w' ? 'b' : 'w', moveObj.to);
    const toSquareDefenders = testGame.attackers(testGame.turn(), moveObj.to);
    
    if (fromSquareAttackers.length > toSquareDefenders.length) {
      const pieceValue = pieceValues[moveObj.piece] || 0;
      score -= pieceValue * 0.8; // Penalize hanging pieces
    }
    
    // Pawn structure considerations
    if (moveObj.piece === 'p') {
      // Avoid doubled pawns
      const file = moveObj.to[0];
      const pawnsOnFile = testGame.board().flat().filter(square => 
        square && square.type === 'p' && square.color === testGame.turn()
      ).filter(pawn => {
        // Check if there are other pawns on the same file
        return testGame.board().some((rank, rankIndex) => 
          rank.some((square, fileIndex) => 
            square && square.type === 'p' && square.color === testGame.turn() &&
            String.fromCharCode(97 + fileIndex) === file &&
            rankIndex !== parseInt(moveObj.to[1]) - 1
          )
        );
      });
      
      if (pawnsOnFile.length > 0) {
        score -= 20; // Penalize doubled pawns
      }
      
      // Encourage pawn advances
      const advancement = testGame.turn() === 'w' ? 
        parseInt(moveObj.to[1]) - parseInt(moveObj.from[1]) :
        parseInt(moveObj.from[1]) - parseInt(moveObj.to[1]);
      
      if (advancement > 0) {
        score += advancement * 5;
      }
    }
    
    // King safety
    if (moveObj.piece === 'k') {
      // Penalize king moves in opening/middlegame
      if (moveCount < 40) {
        score -= 30;
      }
    }
    
    // Tactical awareness - look for forks, pins, etc.
    const enemyKing = testGame.board().flat().find(square => 
      square && square.type === 'k' && square.color !== testGame.turn()
    );
    
    if (enemyKing) {
      // Check if this move attacks multiple pieces
      const attackedSquares = [];
      const board = testGame.board();
      
      // Simple fork detection
      for (let rank = 0; rank < 8; rank++) {
        for (let file = 0; file < 8; file++) {
          const square = String.fromCharCode(97 + file) + (rank + 1);
          if (testGame.isAttacked(square, testGame.turn())) {
            const piece = testGame.get(square);
            if (piece && piece.color !== testGame.turn()) {
              attackedSquares.push({ square, piece: piece.type });
            }
          }
        }
      }
      
      if (attackedSquares.length >= 2) {
        score += 40; // Bonus for attacking multiple pieces
      }
    }
    
    // Add small random factor for variety (much smaller than 800 rating)
    score += Math.random() * 10;

    return { move, score };
  });

  // Sort by score and pick the best move
  scoredMoves.sort((a, b) => b.score - a.score);
  
  // 1500 rating: 95% chance to pick best move, 5% chance for second best
  const randomFactor = Math.random();
  if (randomFactor < 0.05 && scoredMoves.length > 1) {
    return scoredMoves[1].move;
  }
  
  return scoredMoves[0].move;
}