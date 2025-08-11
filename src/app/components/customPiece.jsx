// components/CustomPiece.js
import React from 'react';

export function CustomPiece({ piece, squareWidth }) {
  const pieceSymbols = {
    wP: '♙', wN: '♘', wB: '♗', wR: '♖', wQ: '♕', wK: '♔',
    bP: '♙', bN: '♘', bB: '♗', bR: '♖', bQ: '♕', bK: '♔'
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: squareWidth * 0.5,
      fontWeight: 'bold',
      color: piece[0] === 'w' ? '#ffffff' : '#000000',
      textShadow: piece[0] === 'w' 
        ? '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)' 
        : '0 0 4px rgba(255,255,255,0.3), 0 0 8px rgba(255,255,255,0.2)',
      userSelect: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }}>
      {pieceSymbols[piece]}
    </div>
  );
}