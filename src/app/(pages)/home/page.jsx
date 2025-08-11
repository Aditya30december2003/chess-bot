'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const [chessUsername, setChessUsername] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (!chessUsername.trim()) {
      alert("Please enter a Chess.com username to play against!");
      return;
    }
    
    // Pass both names as query params
    router.push(
      `/chess?name=${encodeURIComponent(name.trim())}&opponent=${encodeURIComponent(chessUsername.trim())}`
    );
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="bg-gray-200 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">Chess Bot Challenge</h1>
        
        {/* Your Name (Optional) */}
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded-md text-lg mb-4 border border-gray-300"
        />
        
        {/* Chess.com Username (Required) */}
        <input
          type="text"
          placeholder="Chess.com username to play against *"
          value={chessUsername}
          onChange={(e) => setChessUsername(e.target.value)}
          className="w-full p-2 rounded-md text-lg mb-4 border border-gray-300"
          required
        />
        
        <button
          onClick={handleStart}
          className="w-full bg-black text-white py-2 rounded-md text-lg hover:bg-gray-800"
        >
          Start Game
        </button>
        
        <p className="mt-2 text-sm text-gray-600">
          * We'll simulate a bot based on this player's style
        </p>
      </div>
    </main>
  );
}