// import React, { useEffect, useState, useCallback } from 'react';
// import { Chessboard } from 'react-chessboard';
// import { Chess } from 'chess.js';

// // Import components and hooks
// import { BotSelector, BotProfile } from '../components/BotSelector';
// import { GameStatus } from '../components/gameStatus';
// import { CustomPiece } from '../components/customPiece';
// import { GameControls } from '../components/GameControls';
// import { GameInstructions } from '../components/gameInstructions';
// import { useSoundManager } from '../components/soundManager';
// import { useChessGame } from '../hooks/useChessGame';
// import { useHybridBot } from '../hooks/useHybridBot';
// import { 
//   getCustomSquareStyles, 
//   isDraggablePiece, 
//   canPlayerMove 
// } from '../utils/chessUtils';
// // Add this at the very top of your component, right after the imports
// console.log('🔄 Chess component loaded');

// export default function ChessGame() {
//   const [boardWidth, setBoardWidth] = useState(400);
//   const [gameMode, setGameMode] = useState('selection'); // 'selection', 'bot', 'pvp'
//   const [playerColor, setPlayerColor] = useState('white');
//   const [isVsBot, setIsVsBot] = useState(false);
//   const [botMoveInProgress, setBotMoveInProgress] = useState(false);

//   // Custom hooks
//   const {
//     game,
//     fen,
//     selectedSquare,
//     validMoves,
//     gameOver,
//     winner,
//     setSelectedSquare,
//     setValidMoves,
//     resetGame,
//     makeMove,
//     selectPiece,
//     updateGame,
//   } = useChessGame();

//   const {
//     currentBot,
//     isLoading,
//     botThinking,
//     getBotMove,
//     createBotFromPlayer,
//     lastError  // Add this to show errors
//   } = useHybridBot();

//   const { playMoveSound, SoundElements } = useSoundManager();

//   // Responsive board sizing
//   useEffect(() => {
//     function handleResize() {
//       const maxWidth = window.innerWidth - 40;
//       const maxHeight = window.innerHeight - 200;
//       const newWidth = Math.min(maxWidth, maxHeight, 600);
//       setBoardWidth(newWidth);
//     }

//     window.addEventListener('resize', handleResize);
//     handleResize();
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // 🔧 FIXED: Better bot move function with improved error handling
//   const makeBotMoveAsync = useCallback(async () => {
//     if (botMoveInProgress || !currentBot || gameOver || botThinking) {
//       console.log('🚫 Bot move blocked:', { 
//         botMoveInProgress, 
//         currentBot: !!currentBot, 
//         gameOver, 
//         botThinking 
//       });
//       return;
//     }

//     console.log('🤖 Starting bot move process...');
//     setBotMoveInProgress(true);
    
//     try {
//       // 🔧 FIX: Use the game instance directly, don't pass history separately
//       console.log(`📍 Current position: ${game.fen()}`);
//       console.log(`📜 Game history: ${game.history().join(' ')}`);
      
//       // 🔧 FIX: Call getBotMove with just the game instance
//       const botMove = await getBotMove(game);
      
//       if (!botMove) {
//         console.warn('❌ Bot returned no move');
//         // 🔧 FIX: Add fallback - try to get any legal move
//         const legalMoves = game.moves();
//         if (legalMoves.length > 0) {
//           console.log('🎲 Using fallback random move:', legalMoves[0]);
//           const testGame = new Chess(game.fen());
//           const moveResult = testGame.move(legalMoves[0]);
//           if (moveResult) {
//             updateGame(testGame);
//             playMoveSound(moveResult, testGame);
//           }
//         }
//         setBotMoveInProgress(false);
//         return;
//       }
      
//       console.log(`🎯 Bot (${currentBot.displayName}) attempting move: ${botMove}`);
      
//       // Verify the move is legal before applying
//       const testGame = new Chess(game.fen());
//       const legalMoves = testGame.moves();
      
//       if (!legalMoves.includes(botMove)) {
//         console.warn(`❌ Bot move ${botMove} is not legal. Legal moves: ${legalMoves.slice(0, 5).join(', ')}`);
        
//         // 🔧 FIX: Try first legal move as fallback
//         if (legalMoves.length > 0) {
//           console.log('🎲 Using first legal move as fallback:', legalMoves[0]);
//           const moveResult = testGame.move(legalMoves[0]);
//           if (moveResult) {
//             updateGame(testGame);
//             playMoveSound(moveResult, testGame);
//           }
//         }
//         setBotMoveInProgress(false);
//         return;
//       }
      
//       // Execute the move
//       const moveResult = testGame.move(botMove);
      
//       if (moveResult) {
//         console.log(`✅ Bot move successful: ${moveResult.san}`);
//         updateGame(testGame);
//         playMoveSound(moveResult, testGame);
//       } else {
//         console.warn(`❌ Failed to execute bot move: ${botMove}`);
//       }
      
//     } catch (error) {
//       console.error('❌ Error in bot move process:', error);
//       // 🔧 FIX: Show error to user
//       if (lastError) {
//         console.error('Bot error details:', lastError);
//       }
//     } finally {
//       setBotMoveInProgress(false);
//     }
//   }, [currentBot, game, gameOver, getBotMove, updateGame, playMoveSound, botMoveInProgress, botThinking, lastError]);

//   // 🔧 FIXED: Improved bot turn detection with debouncing
//   useEffect(() => {
//   console.log("🔍 DIAGNOSTIC: useEffect triggered");
  
//   // Check each condition individually
//   console.log("📊 Condition Check:", {
//     gameMode,
//     "gameMode !== 'bot'": gameMode !== 'bot',
//     currentBot: !!currentBot,
//     "!currentBot": !currentBot,
//     gameOver,
//     botThinking,
//     botMoveInProgress
//   });

//   if (gameMode !== 'bot') {
//     console.log("❌ EARLY RETURN: gameMode is not 'bot', it's:", gameMode);
//     return;
//   }

//   if (!currentBot) {
//     console.log("❌ EARLY RETURN: No currentBot available");
//     return;
//   }

//   if (gameOver) {
//     console.log("❌ EARLY RETURN: Game is over");
//     return;
//   }

//   if (botThinking) {
//     console.log("❌ EARLY RETURN: Bot is thinking");
//     return;
//   }

//   if (botMoveInProgress) {
//     console.log("❌ EARLY RETURN: Bot move in progress");
//     return;
//   }

//   console.log("✅ All conditions passed! Continuing with bot logic...");

//   const currentTurn = game.turn();
//   const isPlayerTurn = (playerColor === 'white' && currentTurn === 'w') || 
//                       (playerColor === 'black' && currentTurn === 'b');
//   const isBotTurn = !isPlayerTurn;
  
//   console.log('🔍 Turn Analysis:', {
//     gameMode,
//     playerColor,
//     currentTurn: currentTurn === 'w' ? 'white' : 'black',
//     isPlayerTurn,
//     isBotTurn,
//     gameOver,
//     botThinking,
//     botMoveInProgress,
//     botLoaded: !!currentBot,
//     moveCount: game.history().length,
//     fen: game.fen().split(' ')[0]
//   });
  
//   if (isBotTurn) {
//     console.log('🚀 Bot turn detected - scheduling move');
//     const timeoutId = setTimeout(() => {
//       if (gameMode === 'bot' && currentBot && !gameOver && !botThinking && !botMoveInProgress) {
//         console.log('⏰ Timeout fired - calling makeBotMoveAsync');
//         makeBotMoveAsync();
//       } else {
//         console.log('🚫 Bot move cancelled - conditions changed');
//       }
//     }, 300);
    
//     return () => clearTimeout(timeoutId);
//   } else {
//     console.log('👤 Player turn - waiting for player move');
//   }
// }, [fen, gameMode, currentBot, playerColor, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync, game]);

//   // Handle bot creation and game start
//   const handleBotCreated = (bot, color) => {
//     console.log("Hello 1")
//     console.log(`🚀 Starting game against ${bot.displayName} - Player: ${color}`);
//     setPlayerColor(color);
//     setIsVsBot(true);
//     setGameMode('bot');
//     setBotMoveInProgress(false);
//     resetGame();
    
//     // 🔧 FIX: If player chose black, trigger bot move after reset
//     if (color === 'black') {
//       setTimeout(() => {
//         console.log('🎯 Player chose black - bot should move first');
//         // The useEffect will handle this automatically
//       }, 500);
//     }
//   };

//   // Handle PvP game start
//   const handleStartPvP = () => {
//     console.log('🚀 Starting PvP game');
//     setIsVsBot(false);
//     setGameMode('pvp');
//     setBotMoveInProgress(false);
//     resetGame();
//   };

//   // Handle back to selection
//   const handleBackToSelection = () => {
//     setGameMode('selection');
//     setIsVsBot(false);
//     setBotMoveInProgress(false);
//     resetGame();
//   };

//   // 🔧 FIX: Add manual bot move trigger for testing
//   const handleForceBotMove = () => {
//     if (currentBot && !botMoveInProgress && !botThinking) {
//       console.log('🔧 Manual bot move trigger');
//       makeBotMoveAsync();
//     }
//   };

//   // Chess move handlers
//   function onSquareClick(square) {
//     if (gameOver) return;
    
//     if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) {
//       console.log('🚫 Cannot move - not player turn or bot is thinking');
//       return;
//     }

//     const piece = game.get(square);
    
//     if (selectedSquare) {
//       if (selectedSquare === square) {
//         setSelectedSquare(null);
//         setValidMoves([]);
//         return;
//       }
      
//       const move = makeMove(selectedSquare, square);
//       if (move) {
//         setSelectedSquare(null);
//         setValidMoves([]);
//         playMoveSound(move, game);
//         console.log(`✅ Player move: ${move.san}`);
//         // Bot move will be triggered by useEffect
//       } else if (piece && piece.color === game.turn()) {
//         selectPiece(square);
//       } else {
//         setSelectedSquare(null);
//         setValidMoves([]);
//       }
//     } else {
//       if (piece && piece.color === game.turn()) {
//         selectPiece(square);
//       }
//     }
//   }

//   function onPieceDrop(sourceSquare, targetSquare, piece) {
//     if (gameOver) return false;
    
//     if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) {
//       console.log('🚫 Cannot drop piece - not player turn or bot is thinking');
//       return false;
//     }

//     const move = makeMove(sourceSquare, targetSquare);
//     setSelectedSquare(null);
//     setValidMoves([]);
    
//     if (move) {
//       playMoveSound(move, game);
//       console.log(`✅ Player drag move: ${move.san}`);
//       // Bot move will be triggered by useEffect
//       return true;
//     }
//     return false;
//   }

//   // Create custom pieces object
//   const customPieces = {};
//   ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].forEach(piece => {
//     customPieces[piece] = ({ squareWidth }) => <CustomPiece piece={piece} squareWidth={squareWidth} />;
//   });

//   const boardOrientation = isVsBot ? playerColor : 'white';

//   return (
//     <div className="min-h-screen p-4 flex flex-col items-center" style={{
//       background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//     }}>
//       <div className="w-full max-w-2xl">
        
//         {/* Game Mode Selection */}
//         {gameMode === 'selection' && (
//           <BotSelector 
//             onBotCreated={handleBotCreated}
//             onStartPvP={handleStartPvP}
//           />
//         )}

//         {/* Bot Profile Display */}
//         {gameMode === 'bot' && currentBot && !isLoading && (
//           <BotProfile 
//             bot={currentBot}
//             onStartGame={() => {}}
//             onChangeBot={handleBackToSelection}
//           />
//         )}

//         {/* Game Status */}
//         {(gameMode === 'bot' || gameMode === 'pvp') && (
//           <GameStatus 
//             gameOver={gameOver}
//             winner={winner}
//             game={game}
//             isVsBot={isVsBot}
//             botThinking={botThinking || botMoveInProgress}
//             playerColor={playerColor}
//             botName={currentBot?.displayName}
//           />
//         )}

//         {/* Chess Board */}
//         {(gameMode === 'bot' || gameMode === 'pvp') && (
//           <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 mb-2 border border-white/20 shadow-2xl">
//             <Chessboard
//               position={fen}
//               onPieceDrop={onPieceDrop}
//               onSquareClick={onSquareClick}
//               boardWidth={boardWidth}
//               boardOrientation={boardOrientation}
//               customDarkSquareStyle={{ 
//                 background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
//                 boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
//               }}
//               customLightSquareStyle={{ 
//                 background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
//                 boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)'
//               }}
//               customBoardStyle={{
//                 borderRadius: '0.5rem',
//                 overflow: 'hidden',
//                 boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
//               }}
//               customSquareStyles={getCustomSquareStyles(selectedSquare, validMoves)}
//               customPieces={customPieces}
//               areArrowsAllowed={true}
//               arePremovesAllowed={false}
//               isDraggablePiece={(pieceInfo) => 
//                 isDraggablePiece(pieceInfo, gameOver, isVsBot, botThinking || botMoveInProgress, playerColor, game)
//               }
//             />
//           </div>
//         )}

//         {/* Game Controls */}
//         {(gameMode === 'bot' || gameMode === 'pvp') && (
//           <GameControls 
//             onResetGame={resetGame}
//             isVsBot={isVsBot}
//             onBackToModeSelection={handleBackToSelection}
//           />
//         )}

//         {/* Game Instructions */}
//         {gameMode === 'selection' && <GameInstructions />}

//         {/* Loading State */}
//         {isLoading && (
//           <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
//             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
//             <p className="text-white text-lg">Creating your opponent...</p>
//             <p className="text-white/70 text-sm mt-2">
//               Analyzing games and building personality profile
//             </p>
//           </div>
//         )}

//         {/* Bot Thinking Indicator */}
//         {(botThinking || botMoveInProgress) && gameMode === 'bot' && (
//           <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center mb-4">
//             <div className="inline-block animate-pulse rounded-full h-6 w-6 bg-yellow-400 mb-2"></div>
//             <p className="text-white text-sm">
//               {currentBot?.displayName} is thinking...
//             </p>
//           </div>
//         )}

//         {/* 🔧 FIX: Error Display */}
//         {lastError && (
//           <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-4 border border-red-500/30 text-center mb-4">
//             <p className="text-red-200 text-sm">
//               ⚠️ Bot Error: {lastError}
//             </p>
//           </div>
//         )}

//         {/* Debug Info */}
//         {process.env.NODE_ENV === 'development' && gameMode === 'bot' && (
//           <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center mt-4">
//             <p className="text-white text-xs mb-2">Debug Info:</p>
//             <p className="text-white/70 text-xs">
//               Turn: {game.turn() === 'w' ? 'White' : 'Black'} | 
//               Player: {playerColor} | 
//               Bot Thinking: {botThinking ? 'Yes' : 'No'} | 
//               Bot Move In Progress: {botMoveInProgress ? 'Yes' : 'No'} | 
//               Game Over: {gameOver ? 'Yes' : 'No'}
//             </p>
//             <p className="text-white/70 text-xs mb-2">
//               History: {game.history().join(' ') || 'No moves yet'}
//             </p>
//             {/* 🔧 FIX: Add manual trigger for testing */}
//             <button 
//               onClick={handleForceBotMove}
//               className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
//               disabled={!currentBot || botMoveInProgress || botThinking}
//             >
//               🔧 Force Bot Move
//             </button>
//           </div>
//         )}

//         {/* Sound Elements */}
//         <SoundElements />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

// Import components and hooks
import { BotSelector, BotProfile } from '../components/BotSelector';
import { GameStatus } from '../components/gameStatus';
import { CustomPiece } from '../components/customPiece';
import { GameControls } from '../components/GameControls';
import { GameInstructions } from '../components/gameInstructions';
import { useSoundManager } from '../components/soundManager';
import { useChessGame } from '../hooks/useChessGame';
import { useHybridBot } from '../hooks/useHybridBot';
import { 
  getCustomSquareStyles, 
  isDraggablePiece, 
  canPlayerMove 
} from '../utils/chessUtils';

console.log('🔄 Chess component loaded');

export default function ChessGame() {
  const [boardWidth, setBoardWidth] = useState(400);
  const [gameMode, setGameMode] = useState('selection'); // 'selection', 'bot', 'pvp'
  const [playerColor, setPlayerColor] = useState('white');
  const [isVsBot, setIsVsBot] = useState(false);
  const [botMoveInProgress, setBotMoveInProgress] = useState(false);
  const [activeBot, setActiveBot] = useState(null); // 🔧 Single source of truth for bot
  
  // Add ref to track if we're waiting for first bot move
  const waitingForFirstBotMove = useRef(false);
  
  // Custom hooks
  const {
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
    updateGame,
  } = useChessGame();

  const {
    isLoading,
    botThinking,
    getBotMove,
    createBotFromPlayer,
    lastError
  } = useHybridBot();

  const { playMoveSound, SoundElements } = useSoundManager();

  // Responsive board sizing
  useEffect(() => {
    function handleResize() {
      const maxWidth = window.innerWidth - 40;
      const maxHeight = window.innerHeight - 200;
      const newWidth = Math.min(maxWidth, maxHeight, 600);
      setBoardWidth(newWidth);
    }

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🔧 FIXED: Bot move function that uses the correct bot instance
  const makeBotMoveAsync = useCallback(async () => {
    if (botMoveInProgress || !activeBot || gameOver || botThinking) {
      console.log('🚫 Bot move blocked:', { 
        botMoveInProgress, 
        activeBot: !!activeBot, 
        gameOver, 
        botThinking 
      });
      return;
    }

    console.log('🤖 Starting bot move process...');
    setBotMoveInProgress(true);
    
    try {
      console.log(`📍 Current position: ${game.fen()}`);
      console.log(`📜 Game history: ${game.history().join(' ')}`);
      
      const botMove = await getBotMove(game);
      
      if (!botMove) {
        console.warn('❌ Bot returned no move');
        // Fallback - try to get any legal move
        const legalMoves = game.moves();
        if (legalMoves.length > 0) {
          console.log('🎲 Using fallback random move:', legalMoves[0]);
          const testGame = new Chess(game.fen());
          const moveResult = testGame.move(legalMoves[0]);
          if (moveResult) {
            updateGame(testGame);
            playMoveSound(moveResult, testGame);
          }
        }
        setBotMoveInProgress(false);
        return;
      }
      
      console.log(`🎯 Bot (${activeBot.displayName}) attempting move: ${botMove}`);
      
      // Verify the move is legal before applying
      const testGame = new Chess(game.fen());
      const legalMoves = testGame.moves();
      
      if (!legalMoves.includes(botMove)) {
        console.warn(`❌ Bot move ${botMove} is not legal. Legal moves: ${legalMoves.slice(0, 5).join(', ')}`);
        
        // Try first legal move as fallback
        if (legalMoves.length > 0) {
          console.log('🎲 Using first legal move as fallback:', legalMoves[0]);
          const moveResult = testGame.move(legalMoves[0]);
          if (moveResult) {
            updateGame(testGame);
            playMoveSound(moveResult, testGame);
          }
        }
        setBotMoveInProgress(false);
        return;
      }
      
      // Execute the move
      const moveResult = testGame.move(botMove);
      
      if (moveResult) {
        console.log(`✅ Bot move successful: ${moveResult.san}`);
        updateGame(testGame);
        playMoveSound(moveResult, testGame);
      } else {
        console.warn(`❌ Failed to execute bot move: ${botMove}`);
      }
      
    } catch (error) {
      console.error('❌ Error in bot move process:', error);
      if (lastError) {
        console.error('Bot error details:', lastError);
      }
    } finally {
      setBotMoveInProgress(false);
      waitingForFirstBotMove.current = false; // Clear the waiting flag
    }
  }, [activeBot, game, gameOver, getBotMove, updateGame, playMoveSound, botMoveInProgress, botThinking, lastError]);

  // 🔧 FIXED: Separate effect for handling first bot move when bot is created
  useEffect(() => {
    if (gameMode === 'bot' && activeBot && waitingForFirstBotMove.current && !gameOver && !botThinking && !botMoveInProgress) {
      console.log('🎯 Bot just created and it should move first');
      const timeoutId = setTimeout(() => {
        makeBotMoveAsync();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [activeBot, gameMode, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync]);

  // 🔧 FIXED: Main bot move effect - now uses activeBot instead of currentBot
  useEffect(() => {
    console.log("🔍 DIAGNOSTIC: Bot turn effect triggered");
    
    // Early returns for invalid states
    if (gameMode !== 'bot') {
      console.log("❌ EARLY RETURN: gameMode is not 'bot', it's:", gameMode);
      return;
    }

    if (!activeBot) {
      console.log("❌ EARLY RETURN: No activeBot available");
      return;
    }

    if (gameOver) {
      console.log("❌ EARLY RETURN: Game is over");
      return;
    }

    if (botThinking || botMoveInProgress) {
      console.log("❌ EARLY RETURN: Bot is thinking or moving");
      return;
    }

    // Skip if we're waiting for the first bot move (handled by separate effect)
    if (waitingForFirstBotMove.current) {
      console.log("❌ EARLY RETURN: Waiting for first bot move");
      return;
    }

    console.log("✅ All conditions passed! Checking if it's bot's turn...");

    const currentTurn = game.turn();
    const isPlayerTurn = (playerColor === 'white' && currentTurn === 'w') || 
                        (playerColor === 'black' && currentTurn === 'b');
    const isBotTurn = !isPlayerTurn;
    
    console.log('🔍 Turn Analysis:', {
      gameMode,
      playerColor,
      currentTurn: currentTurn === 'w' ? 'white' : 'black',
      isPlayerTurn,
      isBotTurn,
      gameOver,
      botThinking,
      botMoveInProgress,
      botLoaded: !!activeBot,
      moveCount: game.history().length,
      waitingForFirst: waitingForFirstBotMove.current
    });
    
    if (isBotTurn) {
      console.log('🚀 Bot turn detected - scheduling move');
      const timeoutId = setTimeout(() => {
        if (gameMode === 'bot' && activeBot && !gameOver && !botThinking && !botMoveInProgress && !waitingForFirstBotMove.current) {
          console.log('⏰ Timeout fired - calling makeBotMoveAsync');
          makeBotMoveAsync();
        } else {
          console.log('🚫 Bot move cancelled - conditions changed');
        }
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      console.log('👤 Player turn - waiting for player move');
    }
  }, [fen, gameMode, activeBot, playerColor, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync, game]);

  // 🔧 FIXED: Handle bot creation and game start
  const handleBotCreated = useCallback((bot, color) => {
    console.log("🚨 HANDLEBOT CREATED CALLED!");
    console.log("📋 Bot details:", bot);
    console.log("🎨 Player color:", color);
    console.log(`🚀 Starting game against ${bot.displayName} - Player: ${color}`);
    
    // 🔧 KEY FIX: Set the activeBot directly here
    setActiveBot(bot);
    setPlayerColor(color);
    setIsVsBot(true);
    setGameMode('bot');
    setBotMoveInProgress(false);
    
    // Set flag if bot should move first
    if (color === 'black') {
      waitingForFirstBotMove.current = true;
      console.log('🎯 Player chose black - bot should move first after reset');
    }
    
    resetGame();
  }, [resetGame]);

  // Handle PvP game start
  const handleStartPvP = useCallback(() => {
    console.log('🚀 Starting PvP game');
    setActiveBot(null);
    setIsVsBot(false);
    setGameMode('pvp');
    setBotMoveInProgress(false);
    waitingForFirstBotMove.current = false;
    resetGame();
  }, [resetGame]);

  // Handle back to selection
  const handleBackToSelection = () => {
    setGameMode('selection');
    setActiveBot(null);
    setIsVsBot(false);
    setBotMoveInProgress(false);
    waitingForFirstBotMove.current = false;
    resetGame();
  };

  // Manual bot move trigger for testing
  const handleForceBotMove = () => {
    if (activeBot && !botMoveInProgress && !botThinking) {
      console.log('🔧 Manual bot move trigger');
      waitingForFirstBotMove.current = false; // Clear waiting flag
      makeBotMoveAsync();
    }
  };

  // Chess move handlers
  function onSquareClick(square) {
    if (gameOver) return;
    
    if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) {
      console.log('🚫 Cannot move - not player turn or bot is thinking');
      return;
    }

    const piece = game.get(square);
    
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      
      const move = makeMove(selectedSquare, square);
      if (move) {
        setSelectedSquare(null);
        setValidMoves([]);
        playMoveSound(move, game);
        console.log(`✅ Player move: ${move.san}`);
        // Bot move will be triggered by useEffect
      } else if (piece && piece.color === game.turn()) {
        selectPiece(square);
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else {
      if (piece && piece.color === game.turn()) {
        selectPiece(square);
      }
    }
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (gameOver) return false;
    
    if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) {
      console.log('🚫 Cannot drop piece - not player turn or bot is thinking');
      return false;
    }

    const move = makeMove(sourceSquare, targetSquare);
    setSelectedSquare(null);
    setValidMoves([]);
    
    if (move) {
      playMoveSound(move, game);
      console.log(`✅ Player drag move: ${move.san}`);
      return true;
    }
    return false;
  }

  // Create custom pieces object
  const customPieces = {};
  ['wP', 'wN', 'wB', 'wR', 'wQ', 'wK', 'bP', 'bN', 'bB', 'bR', 'bQ', 'bK'].forEach(piece => {
    customPieces[piece] = ({ squareWidth }) => <CustomPiece piece={piece} squareWidth={squareWidth} />;
  });

  const boardOrientation = isVsBot ? playerColor : 'white';

  return (
    <div className="min-h-screen p-4 flex flex-col items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="w-full max-w-2xl">
        
        {/* Game Mode Selection */}
        {gameMode === 'selection' && (
          <div>
            <div className="bg-yellow-500/20 backdrop-blur-md rounded-xl p-4 border border-yellow-500/30 text-center mb-4">
              <p className="text-yellow-200 text-sm">
                🔍 DEBUG: BotSelector should call handleBotCreated when bot is created
              </p>
              <p className="text-yellow-200 text-xs mt-2">
                handleBotCreated type: {typeof handleBotCreated}
              </p>
              <button 
                onClick={() => {
                  console.log("🧪 TEST: Manual call to handleBotCreated");
                  handleBotCreated({ displayName: "Test Bot", id: "test" }, "white");
                }}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 mt-2"
              >
                🧪 Test handleBotCreated
              </button>
            </div>
            <BotSelector 
              onBotCreated={handleBotCreated}
              onStartPvP={handleStartPvP}
            />
          </div>
        )}

        {/* Bot Profile Display */}
        {gameMode === 'bot' && activeBot && !isLoading && (
          <BotProfile 
            bot={activeBot}
            onStartGame={() => {}}
            onChangeBot={handleBackToSelection}
          />
        )}

        {/* Game Status */}
        {(gameMode === 'bot' || gameMode === 'pvp') && (
          <GameStatus 
            gameOver={gameOver}
            winner={winner}
            game={game}
            isVsBot={isVsBot}
            botThinking={botThinking || botMoveInProgress}
            playerColor={playerColor}
            botName={activeBot?.displayName}
          />
        )}

        {/* Chess Board */}
        {(gameMode === 'bot' || gameMode === 'pvp') && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 mb-2 border border-white/20 shadow-2xl">
            <Chessboard
              position={fen}
              onPieceDrop={onPieceDrop}
              onSquareClick={onSquareClick}
              boardWidth={boardWidth}
              boardOrientation={boardOrientation}
              customDarkSquareStyle={{ 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
              customLightSquareStyle={{ 
                background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)'
              }}
              customBoardStyle={{
                borderRadius: '0.5rem',
                overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
              customSquareStyles={getCustomSquareStyles(selectedSquare, validMoves)}
              customPieces={customPieces}
              areArrowsAllowed={true}
              arePremovesAllowed={false}
              isDraggablePiece={(pieceInfo) => 
                isDraggablePiece(pieceInfo, gameOver, isVsBot, botThinking || botMoveInProgress, playerColor, game)
              }
            />
          </div>
        )}

        {/* Game Controls */}
        {(gameMode === 'bot' || gameMode === 'pvp') && (
          <GameControls 
            onResetGame={() => {
              waitingForFirstBotMove.current = false;
              resetGame();
            }}
            isVsBot={isVsBot}
            onBackToModeSelection={handleBackToSelection}
          />
        )}

        {/* Game Instructions */}
        {gameMode === 'selection' && <GameInstructions />}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white text-lg">Creating your opponent...</p>
            <p className="text-white/70 text-sm mt-2">
              Analyzing games and building personality profile
            </p>
          </div>
        )}

        {/* Bot Thinking Indicator */}
        {(botThinking || botMoveInProgress) && gameMode === 'bot' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center mb-4">
            <div className="inline-block animate-pulse rounded-full h-6 w-6 bg-yellow-400 mb-2"></div>
            <p className="text-white text-sm">
              {activeBot?.displayName} is thinking...
            </p>
          </div>
        )}

        {/* Error Display */}
        {lastError && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-4 border border-red-500/30 text-center mb-4">
            <p className="text-red-200 text-sm">
              ⚠️ Bot Error: {lastError}
            </p>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && gameMode === 'bot' && (
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center mt-4">
            <p className="text-white text-xs mb-2">Debug Info:</p>
            <p className="text-white/70 text-xs">
              Turn: {game.turn() === 'w' ? 'White' : 'Black'} | 
              Player: {playerColor} | 
              Bot Thinking: {botThinking ? 'Yes' : 'No'} | 
              Bot Move In Progress: {botMoveInProgress ? 'Yes' : 'No'} | 
              Game Over: {gameOver ? 'Yes' : 'No'} |
              Waiting for First: {waitingForFirstBotMove.current ? 'Yes' : 'No'} |
              ActiveBot: {activeBot ? `${activeBot.displayName} (${activeBot.id})` : 'None'}
            </p>
            <p className="text-white/70 text-xs mb-2">
              History: {game.history().join(' ') || 'No moves yet'}
            </p>
            <button 
              onClick={handleForceBotMove}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 mr-2"
              disabled={!activeBot || botMoveInProgress || botThinking}
            >
              🔧 Force Bot Move
            </button>
            <button 
              onClick={() => {
                waitingForFirstBotMove.current = false;
                console.log('🔧 Cleared waiting for first bot move flag');
              }}
              className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
            >
              🔧 Clear Wait Flag
            </button>
          </div>
        )}

        {/* Sound Elements */}
        <SoundElements />
      </div>
    </div>
  );
}