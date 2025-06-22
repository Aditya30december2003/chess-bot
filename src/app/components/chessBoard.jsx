import { useRef, useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

// Simulated AdiBot function (replace with your actual implementation)
function getAdiBotMove(fen, moveTree) {
  const game = new Chess(fen);
  const moves = game.history();

  let node = moveTree;

  for (const move of moves) {
    if (!node[move]) {
      return null;
    }
    node = node[move];
  }

  const nextMoves = Object.entries(node)
    .filter(([key]) => key !== '__games')
    .map(([move, data]) => ({
      move,
      count: data.__games || 0,
    }));

  if (nextMoves.length === 0) return null;

  nextMoves.sort((a, b) => b.count - a.count);
  return nextMoves[0].move;
}

export default function ChessGame() {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [boardWidth, setBoardWidth] = useState(400);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [moveTree, setMoveTree] = useState(null);
  const [isVsBot, setIsVsBot] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);

  // Sound refs
  const moveSound = useRef(null);
  const captureSound = useRef(null);
  const castleSound = useRef(null);
  const moveCheckSound = useRef(null);
  const promoteSound = useRef(null);

  // Fetch move tree when component mounts
  useEffect(() => {
    fetchMoveTree();
  }, []);

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

  // Check for game over conditions
  useEffect(() => {
    if (game.isGameOver()) {
      setGameOver(true);
      if (game.isCheckmate()) {
        setWinner(game.turn() === 'w' ? 'Black' : 'White');
      } else {
        setWinner('Draw');
      }
    }
  }, [fen, game]);

  // Bot move logic
  useEffect(() => {
    if (isVsBot && !gameOver && moveTree) {
      const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || 
                          (playerColor === 'black' && game.turn() === 'b');
      
      if (!isPlayerTurn) {
        makeBotMove();
      }
    }
  }, [fen, isVsBot, playerColor, moveTree, gameOver]);

  async function fetchMoveTree() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/move-tree');
      if (response.ok) {
        const data = await response.json();
        setMoveTree(data);
      } else {
        console.error('Failed to fetch move tree');
        // Fallback to demo data
        setMoveTree({
          "e4": { "__games": 15, "e5": { "__games": 8, "Nf3": { "__games": 5 } } },
          "d4": { "__games": 10, "d5": { "__games": 6 } },
          "Nf3": { "__games": 5 }
        });
      }
    } catch (error) {
      console.error('Error fetching move tree:', error);
      // Fallback to demo data
      setMoveTree({
        "e4": { "__games": 15, "e5": { "__games": 8, "Nf3": { "__games": 5 } } },
        "d4": { "__games": 10, "d5": { "__games": 6 } },
        "Nf3": { "__games": 5 }
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function makeBotMove() {
    if (!moveTree) return;
    
    setBotThinking(true);
    
    // Add delay to make it feel more natural
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500));
    
    try {
      const botMove = getAdiBotMove(fen, moveTree);
      
      if (botMove) {
        const newGame = new Chess(fen);
        const move = newGame.move(botMove);
        
        if (move) {
          setGame(newGame);
          setFen(newGame.fen());
          playMoveSound(move);
        } else {
          // If AdiBot move fails, make a random valid move
          makeRandomMove();
        }
      } else {
        // No move found in tree, make random move
        makeRandomMove();
      }
    } catch (error) {
      console.error('Bot move error:', error);
      makeRandomMove();
    } finally {
      setBotThinking(false);
    }
  }

  function makeRandomMove() {
    const moves = game.moves();
    if (moves.length > 0) {
      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      const newGame = new Chess(fen);
      const move = newGame.move(randomMove);
      
      if (move) {
        setGame(newGame);
        setFen(newGame.fen());
        playMoveSound(move);
      }
    }
  }

  function onSquareClick(square) {
    if (gameOver) return;
    
    // Prevent moves when it's bot's turn
    if (isVsBot) {
      const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || 
                          (playerColor === 'black' && game.turn() === 'b');
      if (!isPlayerTurn || botThinking) return;
    }

    const piece = game.get(square);
    
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }
      
      const moveAttempted = makeMove(selectedSquare, square);
      if (moveAttempted) {
        setSelectedSquare(null);
        setValidMoves([]);
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

  function selectPiece(square) {
    setSelectedSquare(square);
    const moves = game.moves({ square, verbose: true });
    setValidMoves(moves.map(move => move.to));
  }

  function makeMove(sourceSquare, targetSquare) {
    try {
      const piece = game.get(sourceSquare);
      
      if (!piece || piece.color !== game.turn()) {
        return false;
      }

      const isPromotion = piece.type === 'p' && 
        (targetSquare[1] === '8' || targetSquare[1] === '1');

      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromotion ? 'q' : undefined,
      });

      if (move === null) return false;

      playMoveSound(move);
      setFen(game.fen());
      return true;
    } catch (e) {
      console.error('Move error:', e);
      return false;
    }
  }

  function onPieceDrop(sourceSquare, targetSquare, piece) {
    if (gameOver) return false;
    
    // Prevent moves when it's bot's turn
    if (isVsBot) {
      const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || 
                          (playerColor === 'black' && game.turn() === 'b');
      if (!isPlayerTurn || botThinking) return false;
    }

    const moveResult = makeMove(sourceSquare, targetSquare);
    setSelectedSquare(null);
    setValidMoves([]);
    return moveResult;
  }

  function playMoveSound(move) {
    if (!move) return;

    try {
      const sound = 
        move.flags.includes('c') ? captureSound :
        (move.flags.includes('k') || move.flags.includes('q')) ? castleSound :
        move.flags.includes('p') ? promoteSound :
        game.isCheck() ? moveCheckSound :
        moveSound;

      if (sound.current) {
        sound.current.currentTime = 0;
        sound.current.play().catch(() => {});
      }
    } catch (e) {
      console.error('Sound error:', e);
    }
  }

  function resetGame() {
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    setSelectedSquare(null);
    setValidMoves([]);
    setGameOver(false);
    setWinner(null);
    setBotThinking(false);
  }

  function startVsBotGame(color) {
    resetGame();
    setIsVsBot(true);
    setPlayerColor(color);
    
    // If player chose black, bot (white) should move first
    if (color === 'black') {
      setTimeout(() => makeBotMove(), 1000);
    }
  }

  function startPvPGame() {
    resetGame();
    setIsVsBot(false);
  }

  // Custom pieces with black/white styling
  function CustomPiece({ piece, squareWidth }) {
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

  // Custom square styling
  function getCustomSquareStyles() {
    const styles = {};
    
    if (selectedSquare) {
      styles[selectedSquare] = {
        background: 'radial-gradient(circle, rgba(255,255,0,0.4) 0%, transparent 70%)',
        boxShadow: 'inset 0 0 20px rgba(255,255,0,0.6)'
      };
    }
    
    validMoves.forEach(square => {
      styles[square] = {
        background: 'radial-gradient(circle, rgba(0,255,0,0.3) 0%, transparent 70%)',
        position: 'relative'
      };
    });
    
    return styles;
  }

  const currentPlayer = game.turn() === 'w' ? 'White' : 'Black';
  const boardOrientation = isVsBot ? playerColor : 'white';

  return (
    <div className="min-h-screen p-4 flex flex-col items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div className="w-full max-w-2xl">
        {/* Game Mode Selection */}
        {!isVsBot && (
          <div className="text-center mb-4">
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-3">Choose Game Mode</h2>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => startVsBotGame('white')}
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50"
                >
                  🤖 vs AdiBot (Play as White)
                </button>
                <button
                  onClick={() => startVsBotGame('black')}
                  disabled={isLoading}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm disabled:opacity-50"
                >
                  🤖 vs AdiBot (Play as Black)
                </button>
                <button
                  onClick={startPvPGame}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  👥 Player vs Player
                </button>
              </div>
              {isLoading && (
                <p className="text-white/80 text-sm mt-2">Loading AdiBot...</p>
              )}
            </div>
          </div>
        )}

        {/* Game Status */}
        <div className="text-center mb-2">
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-3 border border-white/30 shadow-xl">
            {gameOver ? (
              <div className="text-center">
                <div className="text-3xl mb-1">🏆</div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
                </h2>
                <p className="text-white/80 text-sm">
                  {game.isCheckmate() ? 'Checkmate!' : 
                   game.isStalemate() ? 'Stalemate!' :
                   game.isDraw() ? 'Draw!' : 'Game Over!'}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white mb-1">
                  {isVsBot ? (
                    botThinking ? "🤖 AdiBot is thinking..." : 
                    (playerColor === 'white' && game.turn() === 'w') || (playerColor === 'black' && game.turn() === 'b') ? 
                    "Your turn" : "AdiBot's turn"
                  ) : (
                    `${currentPlayer}'s Turn`
                  )}
                </h2>
                {game.isCheck() && (
                  <p className="text-red-200 font-medium text-sm">Check!</p>
                )}
                {isVsBot && (
                  <p className="text-white/70 text-xs">
                    You are playing as {playerColor}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chess Board */}
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
            customSquareStyles={getCustomSquareStyles()}
            customPieces={{
              wP: ({ squareWidth }) => <CustomPiece piece="wP" squareWidth={squareWidth} />,
              wN: ({ squareWidth }) => <CustomPiece piece="wN" squareWidth={squareWidth} />,
              wB: ({ squareWidth }) => <CustomPiece piece="wB" squareWidth={squareWidth} />,
              wR: ({ squareWidth }) => <CustomPiece piece="wR" squareWidth={squareWidth} />,
              wQ: ({ squareWidth }) => <CustomPiece piece="wQ" squareWidth={squareWidth} />,
              wK: ({ squareWidth }) => <CustomPiece piece="wK" squareWidth={squareWidth} />,
              bP: ({ squareWidth }) => <CustomPiece piece="bP" squareWidth={squareWidth} />,
              bN: ({ squareWidth }) => <CustomPiece piece="bN" squareWidth={squareWidth} />,
              bB: ({ squareWidth }) => <CustomPiece piece="bB" squareWidth={squareWidth} />,
              bR: ({ squareWidth }) => <CustomPiece piece="bR" squareWidth={squareWidth} />,
              bQ: ({ squareWidth }) => <CustomPiece piece="bQ" squareWidth={squareWidth} />,
              bK: ({ squareWidth }) => <CustomPiece piece="bK" squareWidth={squareWidth} />,
            }}
            areArrowsAllowed={true}
            arePremovesAllowed={false}
            isDraggablePiece={({ piece }) => {
              if (gameOver) return false;
              if (isVsBot) {
                if (botThinking) return false;
                const isPlayerTurn = (playerColor === 'white' && game.turn() === 'w') || 
                                   (playerColor === 'black' && game.turn() === 'b');
                return isPlayerTurn && piece[0] === game.turn();
              }
              return piece[0] === game.turn();
            }}
          />
        </div>

        {/* Game Controls */}
        <div className="flex justify-center space-x-3 mb-2">
          <button
            onClick={resetGame}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            🔄 New Game
          </button>
          {isVsBot && (
            <button
              onClick={() => setIsVsBot(false)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-medium py-2 px-4 rounded-lg border border-white/30 transition-all duration-200 shadow-md hover:shadow-lg text-sm"
            >
              🏠 Game Mode
            </button>
          )}
        </div>

        {/* Game Instructions */}
        <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 text-sm">
          <h3 className="font-semibold text-white mb-1">How to Play:</h3>
          <ul className="text-white/80 space-y-1">
            <li>• Choose to play against AdiBot or another player</li>
            <li>• Tap a piece to select it and see valid moves</li>
            <li>• Tap a highlighted square to move there</li>
            <li>• Or drag and drop pieces to move</li>
            <li>• AdiBot learns from your personal Chess.com game history</li>
          </ul>
        </div>

        {/* Sound Elements */}
        <audio ref={moveSound} preload="auto">
          <source src="/move.mp3" type="audio/wav" />
        </audio>
        <audio ref={captureSound} preload="auto">
          <source src="/capture.mp3" type="audio/wav" />
        </audio>
        <audio ref={castleSound} preload="auto">
          <source src="/castle.mp3" type="audio/wav" />
        </audio>
        <audio ref={moveCheckSound} preload="auto">
          <source src="/move-check.mp3" type="audio/wav" />
        </audio>
        <audio ref={promoteSound} preload="auto">
          <source src="/promote.mp3" type="audio/wav" />
        </audio>
      </div>
    </div>
  );
}