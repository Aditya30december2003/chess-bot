// hooks/useChessGame.js
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

export function useChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Check for game over conditions
  useEffect(() => {
    if (game.isGameOver()) {
      setGameOver(true);
      if (game.isCheckmate()) {
        setWinner(game.turn() === 'w' ? 'Black' : 'White');
      } else {
        setWinner('Draw');
      }
    }
  }, [fen, game]);

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
  };

  // ADD THIS FUNCTION - This is what was missing!
  const updateGame = (newGame) => {
    setGame(newGame);
    setFen(newGame.fen());
  };

  const makeMove = (sourceSquare, targetSquare) => {
    try {
      const piece = game.get(sourceSquare);
             
      if (!piece || piece.color !== game.turn()) {
        return false;
      }

      const isPromotion = piece.type === 'p' && 
        (targetSquare[1] === '8' || targetSquare[1] === '1');

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });

      if (move === null) return false;

      setFen(game.fen());
      return move;
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
  };

  const selectPiece = (square) => {
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setValidMoves(moves.map(move => move.to));
  };

  return {
    game,
    fen,
    selectedSquare,
    validMoves,
    gameOver,
    winner,
    setSelectedSquare,
    setValidMoves,
    resetGame,
    makeMove,
    selectPiece,
    updateGame  // ADD THIS TO THE RETURN
  };
}