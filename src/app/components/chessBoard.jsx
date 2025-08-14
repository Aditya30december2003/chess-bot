// pages/ChessGame.jsx
// Full game move history via moveLog + framed board + PvP flip-on-turn
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Chessboard } from 'react-chessboard'
import { Chess } from 'chess.js'

import { BotSelector, BotProfile } from '../components/BotSelector'
import { GameStatus } from '../components/gameStatus'
import { CustomPiece } from '../components/customPiece'
import { GameControls } from '../components/GameControls'
import { GameInstructions } from '../components/gameInstructions'
import { useSoundManager } from '../components/soundManager'
import { useChessGame } from '../hooks/useChessGame'
import { useHybridBot } from '../hooks/useHybridBot'
import MoveList from '../components/MoveList'
import {
  getCustomSquareStyles,
  isDraggablePiece,
  canPlayerMove,
} from '../utils/chessUtils'

// ----- Frame (coordinates around the board) -----
const FRAME_BG = '#E8C57A'
const FRAME_ACCENT = '#B38C4A'
const LABEL_COLOR = '#5b4a29'
const LABEL_FONT_FAMILY =
  'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial'
const FRAME_PADDING = 36

const filesFor = (o) =>
  o === 'white' ? ['A','B','C','D','E','F','G','H'] : ['H','G','F','E','D','C','B','A']
const ranksFor = (o) =>
  o === 'white' ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1']

function BoardFrame({ size, orientation, children }) {
  const files = filesFor(orientation)
  const ranks = ranksFor(orientation)
  const total = size + FRAME_PADDING * 2

  return (
    <div
      className="mx-auto relative rounded-xl"
      style={{
        width: total,
        height: total,
        background: FRAME_BG,
        boxShadow:
          '0 10px 20px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(0,0,0,0.06)',
        borderRadius: 12,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ boxShadow: `inset 0 0 0 2px ${FRAME_ACCENT}` }}
      />

      {/* top files */}
      <div
        className="absolute left-0 right-0 flex justify-between"
        style={{
          top: 6,
          padding: `0 ${FRAME_PADDING}px`,
          fontFamily: LABEL_FONT_FAMILY,
          color: LABEL_COLOR,
          fontWeight: 600,
          letterSpacing: 1,
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        {files.map((f) => (
          <span key={`t-${f}`} style={{ width: size / 8, textAlign: 'center' }}>
            {f}
          </span>
        ))}
      </div>

      {/* bottom files */}
      <div
        className="absolute left-0 right-0 flex justify-between"
        style={{
          bottom: 6,
          padding: `0 ${FRAME_PADDING}px`,
          fontFamily: LABEL_FONT_FAMILY,
          color: LABEL_COLOR,
          fontWeight: 600,
          letterSpacing: 1,
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        {files.map((f) => (
          <span key={`b-${f}`} style={{ width: size / 8, textAlign: 'center' }}>
            {f}
          </span>
        ))}
      </div>

      {/* left ranks */}
      <div
        className="absolute top-0 bottom-0 flex flex-col justify-between"
        style={{
          left: 6,
          padding: `${FRAME_PADDING}px 0`,
          fontFamily: LABEL_FONT_FAMILY,
          color: LABEL_COLOR,
          fontWeight: 600,
          letterSpacing: 1,
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        {ranks.map((r) => (
          <span
            key={`l-${r}`}
            style={{ height: size / 8, display: 'flex', alignItems: 'center' }}
          >
            {r}
          </span>
        ))}
      </div>

      {/* right ranks */}
      <div
        className="absolute top-0 bottom-0 flex flex-col justify-between"
        style={{
          right: 6,
          padding: `${FRAME_PADDING}px 0`,
          fontFamily: LABEL_FONT_FAMILY,
          color: LABEL_COLOR,
          fontWeight: 600,
          letterSpacing: 1,
          fontSize: 12,
          userSelect: 'none',
        }}
      >
        {ranks.map((r) => (
          <span
            key={`r-${r}`}
            style={{ height: size / 8, display: 'flex', alignItems: 'center' }}
          >
            {r}
          </span>
        ))}
      </div>

      {/* inner board box */}
      <div
        className="absolute"
        style={{
          left: FRAME_PADDING,
          top: FRAME_PADDING,
          width: size,
          height: size,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow:
            '0 20px 25px -5px rgba(0,0,0,0.20), 0 10px 10px -5px rgba(0,0,0,0.10)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function ChessGame() {
  // Bigger board, still responsive
  const [boardSize, setBoardSize] = useState(680)

  const [gameMode, setGameMode] = useState('selection') // 'selection', 'bot', 'pvp'
  const [playerColor, setPlayerColor] = useState('white')
  const [isVsBot, setIsVsBot] = useState(false)
  const [botMoveInProgress, setBotMoveInProgress] = useState(false)
  const [activeBot, setActiveBot] = useState(null)
  const [orientation, setOrientation] = useState('white')

  // 🔥 Full move history we control (fixes “only current move” issue)
  const [moveLog, setMoveLog] = useState([])

  const waitingForFirstBotMove = useRef(false)

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
  } = useChessGame()

  const {
    isLoading,
    botThinking,
    getBotMove,
    createBotFromPlayer,
    setCurrentBot,
    lastError,
    stockfishReady,
  } = useHybridBot()

  const { playMoveSound, SoundElements } = useSoundManager()

  // Responsive board sizing (leaves space for frame and UI)
  useEffect(() => {
    function handleResize() {
      const availW = Math.max(360, window.innerWidth - 16)
      const availH = Math.max(360, window.innerHeight - 220)
      const maxInner = Math.min(availW, availH) - FRAME_PADDING * 2
      const clamped = Math.max(300, Math.min(maxInner, 760))
      setBoardSize(Math.floor(clamped / 8) * 8)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ===== Bot move =====
  const makeBotMoveAsync = useCallback(async () => {
    if (!activeBot || botMoveInProgress || gameOver || botThinking) return
    setBotMoveInProgress(true)
    try {
      const botMove = await getBotMove(game)
      const testGame = new Chess(game.fen())
      const legal = testGame.moves()
      const mv = botMove && legal.includes(botMove) ? botMove : legal[0]
      if (mv) {
        const res = testGame.move(mv)
        if (res) {
          updateGame(testGame)
          playMoveSound(res, testGame)
          setMoveLog((prev) => [...prev, res.san]) // ✅ append to our log
        }
      }
    } finally {
      setBotMoveInProgress(false)
      waitingForFirstBotMove.current = false
    }
  }, [
    activeBot,
    botMoveInProgress,
    gameOver,
    botThinking,
    getBotMove,
    game,
    updateGame,
    playMoveSound,
  ])

  // First bot move (if bot is black)
  useEffect(() => {
    if (
      gameMode === 'bot' &&
      activeBot &&
      waitingForFirstBotMove.current &&
      !gameOver &&
      !botThinking &&
      !botMoveInProgress
    ) {
      const t = setTimeout(() => makeBotMoveAsync(), 300)
      return () => clearTimeout(t)
    }
  }, [activeBot, gameMode, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync])

  // Regular bot turns
  useEffect(() => {
    if (gameMode !== 'bot' || !activeBot || gameOver || botThinking || botMoveInProgress) return
    if (waitingForFirstBotMove.current) return
    const isPlayerTurn =
      (playerColor === 'white' && game.turn() === 'w') ||
      (playerColor === 'black' && game.turn() === 'b')
    if (!isPlayerTurn) {
      const t = setTimeout(() => {
        if (
          gameMode === 'bot' &&
          activeBot &&
          !gameOver &&
          !botThinking &&
          !botMoveInProgress &&
          !waitingForFirstBotMove.current
        ) {
          makeBotMoveAsync()
        }
      }, 220)
      return () => clearTimeout(t)
    }
  }, [fen, gameMode, activeBot, playerColor, gameOver, botThinking, botMoveInProgress, makeBotMoveAsync, game])

  // ===== Start vs Bot / PvP / Back =====
  const handleBotCreated = useCallback(
    async (bot, color) => {
      setActiveBot(bot)
      setCurrentBot(bot)
      setPlayerColor(color)
      setIsVsBot(true)
      setGameMode('bot')
      setBotMoveInProgress(false)

      await new Promise((r) => setTimeout(r, 50))
      resetGame()
      setMoveLog([]) // ✅ fresh log

      setOrientation(color)
      if (color === 'black') {
        waitingForFirstBotMove.current = true
        setTimeout(makeBotMoveAsync, 100)
      }
    },
    [setCurrentBot, resetGame, makeBotMoveAsync]
  )

  const handleStartPvP = useCallback(() => {
    setActiveBot(null)
    setIsVsBot(false)
    setGameMode('pvp')
    setBotMoveInProgress(false)
    waitingForFirstBotMove.current = false
    resetGame()
    setMoveLog([]) // ✅ fresh log
    setOrientation('white')
  }, [resetGame])

  const handleBackToSelection = () => {
    setGameMode('selection')
    setActiveBot(null)
    setIsVsBot(false)
    setBotMoveInProgress(false)
    waitingForFirstBotMove.current = false
    resetGame()
    setMoveLog([]) // ✅ fresh log
    setOrientation('white')
  }

  // ===== User interactions =====
  function onSquareClick(square) {
    if (gameOver) return
    if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) return
    const piece = game.get(square)

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null); setValidMoves([]); return
      }
      const move = makeMove(selectedSquare, square)
      if (move) {
        setSelectedSquare(null); setValidMoves([])
        playMoveSound(move, game)
        setMoveLog((prev) => [...prev, move.san]) // ✅ append to our log
        if (gameMode === 'pvp') setOrientation((o) => (o === 'white' ? 'black' : 'white'))
      } else if (piece && piece.color === game.turn()) {
        selectPiece(square)
      } else {
        setSelectedSquare(null); setValidMoves([])
      }
    } else {
      if (piece && piece.color === game.turn()) selectPiece(square)
    }
  }

  function onPieceDrop(sourceSquare, targetSquare) {
    if (gameOver) return false
    if (!canPlayerMove(isVsBot, playerColor, game, botThinking || botMoveInProgress)) return false
    const move = makeMove(sourceSquare, targetSquare)
    setSelectedSquare(null); setValidMoves([])
    if (move) {
      playMoveSound(move, game)
      setMoveLog((prev) => [...prev, move.san]) // ✅ append to our log
      if (gameMode === 'pvp') setOrientation((o) => (o === 'white' ? 'black' : 'white'))
      return true
    }
    return false
  }

  // Custom pieces
  const customPieces = {}
  ;['wP','wN','wB','wR','wQ','wK','bP','bN','bB','bR','bQ','bK'].forEach((p) => {
    customPieces[p] = ({ squareWidth }) => (
      <CustomPiece piece={p} squareWidth={squareWidth} />
    )
  })

  const boardOrientation = isVsBot ? playerColor : orientation

  // Use *our* authoritative full game history
  const sanMoves = moveLog
  const movePanelHeight = boardSize + FRAME_PADDING * 2

  return (
    <div
      className="min-h-screen p-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {gameMode === 'selection' && (
          <div className="mb-4">
            <BotSelector
              onBotCreated={handleBotCreated}
              onStartPvP={handleStartPvP}
              stockfishReady={stockfishReady}
              isLoading={isLoading}
              currentBot={activeBot}
              createBotFromPlayer={createBotFromPlayer}
            />
          </div>
        )}

        {gameMode === 'bot' && activeBot && !isLoading && (
          <BotProfile bot={activeBot} onStartGame={() => {}} onChangeBot={handleBackToSelection} />
        )}

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

        <div className="flex flex-col md:flex-row items-start gap-6">
          {/* LEFT: Board */}
          <div className="flex-1">
            <BoardFrame size={boardSize} orientation={boardOrientation}>
              <Chessboard
                position={fen}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                boardWidth={boardSize}
                boardOrientation={boardOrientation}
                showBoardNotation={false}
                customDarkSquareStyle={{ background: '#5A635A' }}
                customLightSquareStyle={{ background: '#EAD6A7' }}
                customBoardStyle={{ width: '100%', height: '100%' }}
                customSquareStyles={getCustomSquareStyles(selectedSquare, validMoves)}
                customPieces={customPieces}
                areArrowsAllowed
                arePremovesAllowed={false}
                isDraggablePiece={(pieceInfo) =>
                  isDraggablePiece(
                    pieceInfo,
                    gameOver,
                    isVsBot,
                    botThinking || botMoveInProgress,
                    playerColor,
                    game
                  )
                }
              />
            </BoardFrame>

            <div className="mt-3 px-2">
              <GameControls
                onResetGame={() => {
                  waitingForFirstBotMove.current = false
                  resetGame()
                  setMoveLog([]) // ✅ clear log on reset
                  setOrientation(isVsBot ? playerColor : 'white')
                }}
                isVsBot={isVsBot}
                onBackToModeSelection={handleBackToSelection}
              />
            </div>
          </div>

          {/* RIGHT: Move list */}
          <MoveList sanMoves={sanMoves} panelHeight={movePanelHeight} />
        </div>

        {gameMode === 'selection' && <GameInstructions />}

        {isLoading && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center mt-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4" />
            <p className="text-white text-lg">Creating your opponent...</p>
            <p className="text-white/70 text-sm mt-2">
              Analyzing games and building personality profile
            </p>
          </div>
        )}

        {(botThinking || botMoveInProgress) && gameMode === 'bot' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-center my-4">
            <div className="inline-block animate-pulse rounded-full h-6 w-6 bg-yellow-400 mb-2" />
            <p className="text-white text-sm">{activeBot?.displayName} is thinking...</p>
          </div>
        )}

        {lastError && (
          <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-4 border border-red-500/30 text-center my-4">
            <p className="text-red-200 text-sm">⚠️ Bot Error: {lastError}</p>
          </div>
        )}

        <SoundElements />
      </div>
    </div>
  )
}
