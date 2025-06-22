'use client'; // VERY important for client-side hooks like useState/useRouter

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleStart = () => {
    if (name.trim()) {
      router.push(`/play?name=${encodeURIComponent(name.trim())}`);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="bg-gray-200 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">♟️ Play against Aditya</h1>
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded-md text-lg mb-4 border border-gray-300"
        />
        <button
          onClick={handleStart}
          className="w-full bg-black text-white py-2 rounded-md text-lg hover:bg-gray-800"
        >
          Start Game
        </button>
      </div>
    </main>
  );
}
