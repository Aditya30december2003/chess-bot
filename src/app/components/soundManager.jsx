// components/SoundManager.js
import React, { useRef } from 'react';

export function useSoundManager() {
  const moveSound = useRef(null);
  const captureSound = useRef(null);
  const castleSound = useRef(null);
  const moveCheckSound = useRef(null);
  const promoteSound = useRef(null);

  const playMoveSound = (move, game) => {
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
  };

  const SoundElements = () => (
    <>
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
    </>
  );

  return { playMoveSound, SoundElements };
}
