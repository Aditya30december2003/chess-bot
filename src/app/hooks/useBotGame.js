// hooks/useBotGame.js - SIMPLE FIX TO MAKE BOT PLAY LIKE ADITYA30DEMIGOD
import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';

function getAdiBotMove(fen, moveTree, gameHistory = []) {
  try {
    console.log('[AdiBot] Getting move for FEN:', fen);
    console.log('[AdiBot] Received game history:', gameHistory);
    
    const game = new Chess(fen);
    const moves = gameHistory; // Use the actual game history, not game.history() which is empty from FEN
    console.log('[AdiBot] Move history (SAN):', moves);
    console.log('[AdiBot] Current turn:', game.turn() === 'w' ? 'white' : 'black');

    let node = moveTree;

    // Follow the exact path in the tree based on moves played so far
    for (const move of moves) {
      if (!node[move]) {
        console.warn(`[AdiBot] Move not found in tree: ${move}`);
        return null;
      }
      node = node[move];
      console.log(`[AdiBot] Followed move: ${move}, remaining moves:`, Object.keys(node).filter(k => k !== '__games' && k !== '_stats'));
    }

    // Get all possible next moves from the tree at this position
    const possibleTreeMoves = Object.entries(node)
      .filter(([key]) => key !== '__games' && key !== '_stats')
      .map(([move, data]) => ({
        move,
        count: data.__games || 0,
      }));

    console.log('[AdiBot] Possible moves from tree:', possibleTreeMoves);

    if (possibleTreeMoves.length === 0) {
      console.warn('[AdiBot] No moves found in tree at this position');
      return null;
    }

    // Get legal moves in current position
    const legalMoves = game.moves();
    console.log('[AdiBot] Legal moves in position:', legalMoves);

    // Filter tree moves to only include legal moves
    const validTreeMoves = possibleTreeMoves.filter(treeMove => 
      legalMoves.includes(treeMove.move)
    );

    console.log('[AdiBot] Valid moves (tree ∩ legal):', validTreeMoves);

    if (validTreeMoves.length === 0) {
      console.warn('[AdiBot] No valid tree moves match legal moves');
      return null;
    }

    // Sort by popularity and select the most played valid move
    validTreeMoves.sort((a, b) => b.count - a.count);
    const selectedMove = validTreeMoves[0];
    
    console.log(`[AdiBot] 🎯 Selected move: ${selectedMove.move} (played ${selectedMove.count} times)`);
    
    return selectedMove.move;
  } catch (error) {
    console.error('[AdiBot] Error getting move:', error);
    return null;
  }
}

export function useBotGame() {
  const [moveTree, setMoveTree] = useState(null);
  const [isVsBot, setIsVsBot] = useState(false);
  const [playerColor, setPlayerColor] = useState('white');
  const [isLoading, setIsLoading] = useState(false);
  const [botThinking, setBotThinking] = useState(false);

  useEffect(() => {
    fetchMoveTree();
  }, []);

  const fetchMoveTree = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/fetchgames');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Loaded move tree from API');
        console.log("Move tree", data)
        setMoveTree(data);
      } else {
        console.log('⚠️ API failed, using fallback data');
        setMoveTree(getDefaultMoveTree());
      }
    } catch (error) {
      console.error('❌ Error loading move tree:', error);
      setMoveTree(getDefaultMoveTree());
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultMoveTree = () => {
    return {
      "e4": { 
        "__games": 100, 
        "e5": { 
          "__games": 80, 
          "Nf3": { 
            "__games": 60, 
            "Nc6": { 
              "__games": 40,
              "Bb5": { "__games": 25, "a6": { "__games": 20 } },
              "Bc4": { "__games": 15, "f5": { "__games": 10 } }
            },
            "Nf6": { "__games": 15, "Nxe4": { "__games": 8 } }
          },
          "f4": { "__games": 12, "exf4": { "__games": 8 } },
          "Bc4": { "__games": 8, "f5": { "__games": 5 } }
        },
        "c5": { 
          "__games": 60,
          "Nf3": { "__games": 45, "d6": { "__games": 30, "d4": { "__games": 20 } } },
          "Nc3": { "__games": 15, "Nc6": { "__games": 10 } }
        },
        "e6": { 
          "__games": 25,
          "d4": { "__games": 20, "d5": { "__games": 15 } }
        },
        "c6": {
          "__games": 15,
          "d4": { "__games": 12, "d5": { "__games": 8 } }
        }
      },
      "d4": { 
        "__games": 90, 
        "d5": { 
          "__games": 70,
          "c4": { 
            "__games": 50,
            "e6": { "__games": 30, "Nc3": { "__games": 20 } },
            "c6": { "__games": 15, "cxd5": { "__games": 10 } },
            "dxc4": { "__games": 8, "Nf3": { "__games": 5 } }
          },
          "Nf3": { "__games": 15, "Nf6": { "__games": 10 } },
          "Bg5": { "__games": 5, "f6": { "__games": 3 } }
        },
        "Nf6": { 
          "__games": 50,
          "c4": { "__games": 35, "e6": { "__games": 25, "Nc3": { "__games": 18 } } },
          "Nf3": { "__games": 12, "g6": { "__games": 8 } },
          "Bg5": { "__games": 3, "Ne4": { "__games": 2 } }
        },
        "f5": { 
          "__games": 8, 
          "c4": { "__games": 5, "Nf6": { "__games": 3 } }
        },
        "c5": { 
          "__games": 12, 
          "d5": { "__games": 8, "e6": { "__games": 5 } }
        }
      },
      "Nf3": { 
        "__games": 40,
        "d5": { "__games": 20, "d4": { "__games": 15, "Nf6": { "__games": 10 } } },
        "Nf6": { "__games": 15, "c4": { "__games": 10, "g6": { "__games": 6 } } },
        "c5": { "__games": 3, "c4": { "__games": 2 } },
        "g6": { "__games": 2, "g3": { "__games": 1 } }
      },
      "c4": {
        "__games": 25,
        "e5": { "__games": 12, "Nc3": { "__games": 8, "Nf6": { "__games": 5 } } },
        "Nf6": { "__games": 8, "Nc3": { "__games": 5, "g6": { "__games": 3 } } },
        "c5": { "__games": 3, "Nc3": { "__games": 2 } },
        "e6": { "__games": 2, "Nc3": { "__games": 1 } }
      }
    };
  };

  const makeBotMove = async (gameInstance, updateGameCallback, soundCallback) => {
    if (!moveTree || !gameInstance || botThinking) {
      console.warn('❌ Cannot make bot move - invalid state');
      return;
    }

    console.log('🤖 Starting bot move process...');
    setBotThinking(true);

    // Add natural thinking delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    try {
      const currentFen = gameInstance.fen();
      const gameHistory = gameInstance.history(); // FIXED: Get the actual move history
      const botMove = getAdiBotMove(currentFen, moveTree, gameHistory); // FIXED: Pass the history
      
      if (botMove) {
        console.log(`🎯 Bot attempting move: ${botMove}`);
        
        // Create new game instance and attempt the move
        const newGame = new Chess(currentFen);
        const moveResult = newGame.move(botMove);
        
        if (moveResult) {
          console.log(`✅ Bot move successful: ${moveResult.san}`);
          updateGameCallback(newGame);
          if (soundCallback) {
            soundCallback(moveResult, newGame);
          }
        } else {
          console.warn(`❌ Bot move failed, trying random move`);
          makeRandomMove(gameInstance, updateGameCallback, soundCallback);
        }
      } else {
        console.log(`🎲 No tree move found, making random move`);
        makeRandomMove(gameInstance, updateGameCallback, soundCallback);
      }
    } catch (error) {
      console.error('❌ Error in bot move process:', error);
      makeRandomMove(gameInstance, updateGameCallback, soundCallback);
    } finally {
      setBotThinking(false);
    }
  };

  const makeRandomMove = (gameInstance, updateGameCallback, soundCallback) => {
    try {
      const moves = gameInstance.moves();
      if (moves.length === 0) {
        console.warn('❌ No legal moves available');
        return;
      }

      const randomMove = moves[Math.floor(Math.random() * moves.length)];
      console.log(`🎲 Making random move: ${randomMove}`);
      
      const newGame = new Chess(gameInstance.fen());
      const moveResult = newGame.move(randomMove);
      
      if (moveResult) {
        console.log(`✅ Random move successful: ${moveResult.san}`);
        updateGameCallback(newGame);
        if (soundCallback) {
          soundCallback(moveResult, newGame);
        }
      }
    } catch (error) {
      console.error('❌ Error making random move:', error);
    }
  };

  const startVsBotGame = (color, resetGameCallback) => {
    console.log(`🚀 Starting bot game - Player: ${color}`);
    resetGameCallback();
    setIsVsBot(true);
    setPlayerColor(color);
    setBotThinking(false);
  };

  const startPvPGame = (resetGameCallback) => {
    console.log('🚀 Starting PvP game');
    resetGameCallback();
    setIsVsBot(false);
    setBotThinking(false);
  };

  return {
    moveTree,
    isVsBot,
    playerColor,
    isLoading,
    botThinking,
    makeBotMove,
    startVsBotGame,
    startPvPGame,
    setBotThinking,
    setIsVsBot
  };
}