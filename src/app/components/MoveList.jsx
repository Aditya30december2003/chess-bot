// components/MoveList.jsx
import React, { useMemo, useRef, useEffect } from 'react'

/**
 * MoveList
 * - Shows the ENTIRE game's SAN history in two columns (White / Black).
 * - Auto-scrolls to bottom as new moves appear.
 * - Accepts a fixed panel height so it can visually match the board height.
 *
 * Props:
 *   sanMoves: string[]            // full SAN history from chess.js (game.history())
 *   panelHeight?: number          // px, used to match board height (optional)
 */
export default function MoveList({ sanMoves = [], panelHeight }) {
  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < sanMoves.length; i += 2) {
      r.push({
        idx: 1 + i / 2,
        white: sanMoves[i] || '',
        black: sanMoves[i + 1] || '',
      })
    }
    return r
  }, [sanMoves])

  const scrollerRef = useRef(null)
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight
  }, [sanMoves.length])

  return (
    <div
      className="w-full md:w-72 lg:w-80"
      style={{ height: panelHeight ? panelHeight : undefined }}
    >
      <div
        className="rounded-2xl border border-white/15 shadow-xl overflow-hidden h-full flex flex-col"
        style={{
          background:
            'linear-gradient(180deg, rgba(30,20,35,0.70) 0%, rgba(25,16,30,0.78) 100%)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 text-white font-semibold sticky top-0 z-10 bg-transparent">
          Game Moves
        </div>

        {/* List */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-3 pb-3 text-white/90"
          style={{ scrollbarWidth: 'thin' }}
        >
          {rows.length === 0 && (
            <div className="text-white/60 text-sm">No moves yet</div>
          )}

          {/* column headings */}
          {rows.length > 0 && (
            <div className="grid grid-cols-[40px_1fr_1fr] gap-2 px-1 pb-1 text-xs uppercase tracking-wide text-white/60 sticky top-0 backdrop-blur-sm">
              <div>#</div>
              <div>White</div>
              <div>Black</div>
            </div>
          )}

          {rows.map((r) => (
            <div
              key={r.idx}
              className="grid grid-cols-[40px_1fr_1fr] items-center gap-2 py-1 rounded-md hover:bg-white/5"
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
            >
              <div className="text-white/70">{r.idx}.</div>
              <div className="text-white">{r.white}</div>
              <div className="text-white">{r.black}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
