import { useState, useEffect, useRef } from 'react';

// SIMPLE Move List Component - just the fucking move list, nothing else
export function ChessMoveHistory({ game }) {
  const [moves, setMoves] = useState([]);
  const scrollRef = useRef(null);

  // Update moves whenever the game changes
  useEffect(() => {
    const history = game.history({ verbose: true });
    const formattedMoves = [];
    
    for (let i = 0; i < history.length; i += 2) {
      const whiteMove = history[i];
      const blackMove = history[i + 1];
      
      formattedMoves.push({
        moveNumber: Math.floor(i / 2) + 1,
        white: whiteMove ? whiteMove.san : null,
        black: blackMove ? blackMove.san : null,
      });
    }
    
    setMoves(formattedMoves);
  }, [game]);

  // Auto-scroll to latest move
  useEffect(() => {
    if (scrollRef.current && moves.length > 0) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  }, [moves]);

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl h-full flex flex-col max-w-sm">
      {/* Header */}
      <div className="p-3 border-b border-white/20">
        <h3 className="text-base font-bold text-white flex items-center">
          📋 Moves
        </h3>
      </div>

      {/* Column Headers */}
      <div className="px-3 py-2 border-b border-white/10 bg-white/5">
        <div className="grid grid-cols-12 gap-1 text-xs font-semibold text-white/80">
          <div className="col-span-2">#</div>
          <div className="col-span-5">White</div>
          <div className="col-span-5">Black</div>
        </div>
      </div>

      {/* Moves List */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.3) transparent'
        }}
      >
        {moves.length === 0 ? (
          <div className="text-center py-6 text-white/60">
            <div className="text-2xl mb-2">♟️</div>
            <p className="text-sm">No moves yet</p>
          </div>
        ) : (
          moves.map((moveSet, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-1 py-0.5 hover:bg-white/10 rounded transition-colors duration-200"
            >
              {/* Move Number */}
              <div className="col-span-2 text-white/80 font-mono text-xs flex items-center">
                {moveSet.moveNumber}.
              </div>

              {/* White Move */}
              <div className="col-span-5">
                {moveSet.white && (
                  <div className="w-full text-left px-1.5 py-0.5 rounded text-xs text-white/90">
                    <span className="font-mono">
                      {moveSet.white}
                    </span>
                  </div>
                )}
              </div>

              {/* Black Move */}
              <div className="col-span-5">
                {moveSet.black && (
                  <div className="w-full text-left px-1.5 py-0.5 rounded text-xs text-white/90">
                    <span className="font-mono">
                      {moveSet.black}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ChessMoveHistory;