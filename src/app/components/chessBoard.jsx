// // ===============================================
// // ChessGame.js - FINAL FIXED VERSION
// // ===============================================

// import React, { useEffect, useState } from 'react';
// import { Chessboard } from 'react-chessboard';
// import { Chess } from 'chess.js';

// // Import components and hooks
// import { GameModeSelector } from '../components/gameModeSelector';
// import { GameStatus } from '../components/gameStatus';
// import { CustomPiece } from '../components/customPiece';
// import { GameControls } from '../components/GameControls';
// import { GameInstructions } from '../components/gameInstructions';
// import { useSoundManager } from '../components/soundManager';
// import { useChessGame } from '../hooks/useChessGame';
// import { useBotGame } from '../hooks/useBotGame';
// import { 
//   getCustomSquareStyles, 
//   isDraggablePiece, 
//   canPlayerMove 
// } from '../utils/chessUtils';

// export default function ChessGame() {
//   const [boardWidth, setBoardWidth] = useState(400);

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
//     moveTree,
//     isVsBot,
//     playerColor,
//     isLoading,
//     botThinking,
//     setBotThinking,
//     setIsVsBot,
//     makeBotMove,
//     startVsBotGame,
//     startPvPGame
//   } = useBotGame();

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

//   // FIXED: Bot move trigger logic - SIMPLIFIED
//   useEffect(() => {
//     if (isVsBot && !gameOver && moveTree && !botThinking) {
//       const currentTurn = game.turn(); // 'w' for white, 'b' for black
      
//       // Simple logic: if it's not the player's turn, it's the bot's turn
//       const isPlayerTurn = (playerColor === 'white' && currentTurn === 'w') || 
//                           (playerColor === 'black' && currentTurn === 'b');
//       const isBotTurn = !isPlayerTurn;
      
//       console.log('🔍 Bot Turn Check:', {
//         playerColor,
//         currentTurn: currentTurn === 'w' ? 'white' : 'black',
//         isPlayerTurn,
//         isBotTurn,
//         gameOver,
//         botThinking,
//         moveTreeLoaded: !!moveTree
//       });
      
//       if (isBotTurn) {
//         console.log('🤖 Triggering bot move...');
//         makeBotMove(game, updateGame, playMoveSound);
//       }
//     }
//   }, [fen, isVsBot, playerColor, moveTree, gameOver, botThinking, game, updateGame, playMoveSound, makeBotMove]);

//   function onSquareClick(square) {
//     if (gameOver) return;
    
//     if (!canPlayerMove(isVsBot, playerColor, game, botThinking)) return;

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
    
//     if (!canPlayerMove(isVsBot, playerColor, game, botThinking)) return false;

//     const move = makeMove(sourceSquare, targetSquare);
//     setSelectedSquare(null);
//     setValidMoves([]);
    
//     if (move) {
//       playMoveSound(move, game);
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
//         {!isVsBot && (
//           <GameModeSelector 
//             onStartVsBot={(color) => startVsBotGame(color, resetGame)}
//             onStartPvP={() => startPvPGame(resetGame)}
//             isLoading={isLoading}
//           />
//         )}

//         {/* Game Status */}
//         <GameStatus 
//           gameOver={gameOver}
//           winner={winner}
//           game={game}
//           isVsBot={isVsBot}
//           botThinking={botThinking}
//           playerColor={playerColor}
//         />

//         {/* Chess Board */}
//         <div className="bg-white/10 backdrop-blur-md rounded-xl p-2 mb-2 border border-white/20 shadow-2xl">
//           <Chessboard
//             position={fen}
//             onPieceDrop={onPieceDrop}
//             onSquareClick={onSquareClick}
//             boardWidth={boardWidth}
//             boardOrientation={boardOrientation}
//             customDarkSquareStyle={{ 
//               background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
//               boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
//             }}
//             customLightSquareStyle={{ 
//               background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 100%)',
//               boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)'
//             }}
//             customBoardStyle={{
//               borderRadius: '0.5rem',
//               overflow: 'hidden',
//               boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
//             }}
//             customSquareStyles={getCustomSquareStyles(selectedSquare, validMoves)}
//             customPieces={customPieces}
//             areArrowsAllowed={true}
//             arePremovesAllowed={false}
//             isDraggablePiece={(pieceInfo) => 
//               isDraggablePiece(pieceInfo, gameOver, isVsBot, botThinking, playerColor, game)
//             }
//           />
//         </div>

//         {/* Game Controls */}
//         <GameControls 
//           onResetGame={resetGame}
//           isVsBot={isVsBot}
//           onBackToModeSelection={() => setIsVsBot(false)}
//         />

//         {/* Game Instructions */}
//         <GameInstructions />

//         {/* Sound Elements */}
//         <SoundElements />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useCallback } from 'react';
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

export default function ChessGame() {
  const [boardWidth, setBoardWidth] = useState(400);
  const [gameMode, setGameMode] = useState('selection'); // 'selection', 'bot', 'pvp'
  const [playerColor, setPlayerColor] = useState('white');
  const [isVsBot, setIsVsBot] = useState(false);
  const [botMoveInProgress, setBotMoveInProgress] = useState(false);

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
    currentBot,
    isLoading,
    botThinking,
    getBotMove,
    createBotFromPlayer
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

  // Memoized bot move function to prevent infinite re-renders
  const makeBotMoveAsync = useCallback(async () => {
    if (botMoveInProgress || !currentBot || gameOver) {
      return;
    }

    console.log('🤖 Starting bot move process...');
    setBotMoveInProgress(true);
    
    try {
      const gameHistory = game.history();
      console.log(`📜 Game history length: ${gameHistory.length}`);
      
      const botMove = await getBotMove(game, gameHistory);
      
      if (!botMove) {
        console.warn('❌ Bot returned no move');
        setBotMoveInProgress(false);
        return;
      }
      
      console.log(`🎯 Bot (${currentBot.displayName}) attempting move: ${botMove}`);
      
      // Verify the move is legal before applying
      const testGame = new Chess(game.fen());
      const legalMoves = testGame.moves();
      
      if (!legalMoves.includes(botMove)) {
        console.warn(`❌ Bot move ${botMove} is not legal. Legal moves: ${legalMoves.slice(0, 5).join(', ')}`);
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
    } finally {
      setBotMoveInProgress(false);
    }
  }, [currentBot, game, gameOver, getBotMove, updateGame, playMoveSound, botMoveInProgress]);

  // Improved bot turn detection with better logging
  useEffect(() => {
    if (gameMode !== 'bot' || !currentBot || gameOver || botThinking || botMoveInProgress) {
      return;
    }

    const currentTurn = game.turn(); // 'w' for white, 'b' for black
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
      botLoaded: !!currentBot,
      fen: game.fen()
    });
    
    if (isBotTurn) {
      console.log('🚀 Bot turn detected - triggering move');
      // Add a small delay to ensure UI updates properly
      setTimeout(() => {
        makeBotMoveAsync();
      }, 100);
    } else {
      console.log('👤 Player turn - waiting for player move');
    }
  }, [fen, gameMode, currentBot, playerColor, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync, game]);

  // Handle bot creation and game start
  const handleBotCreated = (bot, color) => {
    console.log(`🚀 Starting game against ${bot.displayName} - Player: ${color}`);
    setPlayerColor(color);
    setIsVsBot(true);
    setGameMode('bot');
    setBotMoveInProgress(false); // Reset bot move state
    resetGame();
  };

  // Handle PvP game start
  const handleStartPvP = () => {
    console.log('🚀 Starting PvP game');
    setIsVsBot(false);
    setGameMode('pvp');
    setBotMoveInProgress(false);
    resetGame();
  };

  // Handle back to selection
  const handleBackToSelection = () => {
    setGameMode('selection');
    setIsVsBot(false);
    setBotMoveInProgress(false);
    resetGame();
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
          <BotSelector 
            onBotCreated={handleBotCreated}
            onStartPvP={handleStartPvP}
          />
        )}

        {/* Bot Profile Display */}
        {gameMode === 'bot' && currentBot && !isLoading && (
          <BotProfile 
            bot={currentBot}
            onStartGame={() => {}} // Already started
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
            botName={currentBot?.displayName}
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
            onResetGame={resetGame}
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
              {currentBot?.displayName} is thinking...
            </p>
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && gameMode === 'bot' && (
          <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 text-center mt-4">
            <p className="text-white text-xs mb-2">Debug Info:</p>
            <p className="text-white/70 text-xs">
              Turn: {game.turn() === 'w' ? 'White' : 'Black'} | 
              Player: {playerColor} | 
              Bot Thinking: {botThinking ? 'Yes' : 'No'} | 
              Bot Move In Progress: {botMoveInProgress ? 'Yes' : 'No'} | 
              Game Over: {gameOver ? 'Yes' : 'No'}
            </p>
            <p className="text-white/70 text-xs">
              FEN: {fen.slice(0, 50)}...
            </p>
          </div>
        )}

        {/* Sound Elements */}
        <SoundElements />
      </div>
    </div>
  );
}