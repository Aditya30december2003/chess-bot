'use client';

import ChessBoard from '../../components/chessBoard';
import BotSidebar from '../../components/BotSidebar';
import MoveList from '../../components/MoveList';
import { useSearchParams } from 'next/navigation';

export default function PlayPage() {
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || 'Guest';

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#1f1f1f] relative">
      {/* Chess Board */}
      <ChessBoard />

      {/* Bot Sidebar (right section) */}
      <BotSidebar playerName={playerName} />

      {/* Move List Overlay (bottom-right) */}
      <MoveList moves={['e4', 'e5', 'Nf3']} />
    </div>
  );
}
