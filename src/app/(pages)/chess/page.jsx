'use client';
import { useState } from 'react';
import { Chess } from 'chess.js';
// import ChessBoard from '../../components/chessBoard';
// import BotSidebar from '../../components/BotSidebar';
// import ChessMoveHistory from '../../components/ChessMoveHistory';
import { useSearchParams } from 'next/navigation';
import ChessGame from '../../components/chessBoard';

export default function PlayPage() {
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Guest';
  
  const [game, setGame] = useState(new Chess());

  return (
    <div className="min-h-screen bg-[#d40202] relative">
      <ChessGame/>
    </div>
  );
}

