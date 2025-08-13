'use client';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    
    // Pass both names as query params
    router.push(
      `/chess`
    );
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="bg-gray-200 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">Chess Bot Challenge</h1>
        
        
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