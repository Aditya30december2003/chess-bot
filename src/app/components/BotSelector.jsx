// components/BotSelector.jsx - Component for selecting/creating chess bots
import React, { useState } from 'react';
import { useHybridBot } from '../hooks/useHybridBot';

export function BotSelector({ onBotCreated, onStartPvP }) {
  const [username, setUsername] = useState('');
  const [selectedColor, setSelectedColor] = useState('white');
  const { createBotFromPlayer, isLoading, stockfishReady, currentBot } = useHybridBot();

const handleCreateBot = async () => {
  if (!username.trim()) return;
  
  console.log('🎯 Starting bot creation for', username);
  
  try {
    const bot = await createBotFromPlayer(username.toLowerCase());
    console.log('🎯 createBotFromPlayer returned:', bot);
    
    if (bot) {
      console.log('🚀 Calling onBotCreated with:', bot.displayName);
      onBotCreated(bot, selectedColor);
    } else {
      console.error('❌ No bot available after creation');
      alert('Bot creation failed. Please try again.');
    }
  } catch (error) {
    console.error('❌ Error creating bot:', error);
    alert(`Failed to create bot: ${error.message}`);
  }
};

const handlePresetBot = async (presetUsername) => {
  setUsername(presetUsername);
  console.log('🎯 Starting preset bot for', presetUsername);
  
  try {
    const bot = await createBotFromPlayer(presetUsername);
    console.log('🎯 createBotFromPlayer returned:', bot);
    
    if (bot) {
      console.log('🚀 Calling onBotCreated with:', bot.displayName);
      onBotCreated(bot, selectedColor);
    } else {
      console.error('❌ No bot available after creation');
      alert('Preset bot creation failed.');
    }
  } catch (error) {
    console.error('❌ Error creating preset bot:', error);
    alert(`Failed to create ${presetUsername} bot.`);
  }
};

  const popularBots = [
    { 
      username: 'hikaru', 
      name: 'Hikaru Nakamura', 
      style: 'Speed Demon',
      description: 'Lightning-fast tactical play',
      emoji: '⚡'
    },
    { 
      username: 'magnuscarlsen', 
      name: 'Magnus Carlsen', 
      style: 'Universal Master',
      description: 'Positional perfection',
      emoji: '👑'
    },
    { 
      username: 'gothamchess', 
      name: 'Levy Rozman', 
      style: 'The Entertainer',
      description: 'Instructive and fun',
      emoji: '🎭'
    },
    { 
      username: 'anishgiri', 
      name: 'Anish Giri', 
      style: 'Solid Rock',
      description: 'Unbreakable defense',
      emoji: '🛡️'
    },
    { 
      username: 'chessbrah', 
      name: 'Chessbrah', 
      style: 'Bro Style',
      description: 'Chill but deadly',
      emoji: '😎'
    },
    { 
      username: 'penguingm1', 
      name: 'Andrew Tang', 
      style: 'Bullet Master',
      description: 'Ultra-fast precision',
      emoji: '🐧'
    }
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4 border border-white/20">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Choose Your Opponent
      </h2>

      {/* Engine Status */}
      <div className="flex items-center justify-center mb-4 text-sm">
        <div className={`w-2 h-2 rounded-full mr-2 ${stockfishReady ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
        <span className="text-white/80">
          Engine: {stockfishReady ? 'Ready' : 'Loading...'}
        </span>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center mb-4">
          <p className="text-white text-xs mb-2">BotSelector Debug:</p>
          <p className="text-white/70 text-xs">
            currentBot: {currentBot ? `${currentBot.displayName} (${currentBot.id})` : 'None'} |
            isLoading: {isLoading ? 'Yes' : 'No'} |
            stockfishReady: {stockfishReady ? 'Yes' : 'No'}
          </p>
        </div>
      )}

      {/* Color Selection */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3">Play as:</h3>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setSelectedColor('white')}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedColor === 'white' 
                ? 'border-white bg-white/20 text-white' 
                : 'border-white/30 text-white/70 hover:border-white/50'
            }`}
          >
            ♔ White
          </button>
          <button
            onClick={() => setSelectedColor('black')}
            className={`px-4 py-2 rounded-lg border-2 transition-all ${
              selectedColor === 'black' 
                ? 'border-white bg-white/20 text-white' 
                : 'border-white/30 text-white/70 hover:border-white/50'
            }`}
          >
            ♚ Black
          </button>
        </div>
      </div>

      {/* Custom Username Input */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3">Create Bot from Any Chess.com Player:</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter Chess.com username"
            className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/70"
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateBot()}
          />
          <button
            onClick={handleCreateBot}
            disabled={isLoading || !username.trim() || !stockfishReady}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Bot'}
          </button>
        </div>
        <p className="text-white/60 text-sm mt-2">
          Examples: hikaru, magnuscarlsen, gothamchess, your_username
        </p>
      </div>

      {/* Popular Bots */}
      <div className="mb-6">
        <h3 className="text-white font-medium mb-3">Popular Bots:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {popularBots.map(bot => (
            <button
              key={bot.username}
              onClick={() => handlePresetBot(bot.username)}
              disabled={isLoading || !stockfishReady}
              className="p-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 border border-white/20 rounded-lg text-left transition-all group disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{bot.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium group-hover:text-blue-200">
                    {bot.name}
                  </div>
                  <div className="text-blue-200 text-sm font-medium">
                    {bot.style}
                  </div>
                  <div className="text-white/60 text-sm">
                    {bot.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* PvP Option */}
      <div className="border-t border-white/20 pt-4">
        <button
          onClick={onStartPvP}
          className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          🏁 Play Against Human (Local PvP)
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-4 text-center">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <p className="text-white/80 mt-2">Analyzing games and creating bot...</p>
        </div>
      )}
    </div>
  );
}

// Bot Profile Display Component
export function BotProfile({ bot, onStartGame, onChangeBot }) {
  if (!bot) return null;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-4 border border-white/20">
      <div className="flex items-center gap-4 mb-4">
        {bot.avatar && (
          <img 
            src={bot.avatar} 
            alt={bot.displayName}
            className="w-16 h-16 rounded-full border-2 border-white/30"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white">
            {bot.displayName}
            {bot.title && <span className="text-blue-200 ml-2">{bot.title}</span>}
          </h2>
          <div className="text-white/80">
            Rating: {bot.rating} • Games analyzed: {bot.gamesAnalyzed}
          </div>
        </div>
      </div>

      {/* Playing Style */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/60">Aggression</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-1">
            <div 
              className="bg-red-400 h-2 rounded-full" 
              style={{ width: `${bot.personality.aggression * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/60">Tactics</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-400 h-2 rounded-full" 
              style={{ width: `${bot.personality.tactics * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/60">Speed</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-1">
            <div 
              className="bg-yellow-400 h-2 rounded-full" 
              style={{ width: `${bot.personality.speed * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/60">Win Rate</div>
          <div className="w-full bg-white/20 rounded-full h-2 mt-1">
            <div 
              className="bg-green-400 h-2 rounded-full" 
              style={{ width: `${bot.personality.winRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onStartGame}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Start Game
        </button>
        <button
          onClick={onChangeBot}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors"
        >
          Change Bot
        </button>
      </div>
    </div>
  );
}