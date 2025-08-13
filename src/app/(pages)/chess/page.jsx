// src/app/(pages)/chess/page.jsx
'use client';

import ChessGame from '../../components/chessBoard';

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[#d40202] relative">
      <ChessGame />
    </div>
  );
}
