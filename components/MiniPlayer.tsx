import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Song } from '../types';
import AlbumArt from './AlbumArt';
import { PlayIcon, PauseIcon, ArrowsPointingOutIcon } from './Icons';

interface MiniPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onExpand: () => void;
  artCacheVersion?: number;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ song, isPlaying, onPlayPause, onExpand, artCacheVersion }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 }); // Position from bottom-right
  const miniPlayerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Constrain position within viewport
    const newX = elementStartPos.current.x - dx;
    const newY = elementStartPos.current.y - dy;
    
    const constrainedX = Math.max(20, Math.min(newX, window.innerWidth - (miniPlayerRef.current?.offsetWidth || 280) - 20));
    const constrainedY = Math.max(20, Math.min(newY, window.innerHeight - (miniPlayerRef.current?.offsetHeight || 64) - 20));

    setPosition({ x: constrainedX, y: constrainedY });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    if (miniPlayerRef.current) {
        miniPlayerRef.current.classList.remove('grabbing');
    }
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Prevent drag on controls
    if ((e.target as HTMLElement).closest('button')) return;
    
    isDragging.current = true;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };

    if (miniPlayerRef.current) {
        miniPlayerRef.current.classList.add('grabbing');
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position.x, position.y, handleMouseMove, handleMouseUp]);
  
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  if (!song) return null;

  return (
    <div
      ref={miniPlayerRef}
      className="mini-player"
      style={{ bottom: `${position.y}px`, right: `${position.x}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="mini-player-art">
        <AlbumArt song={song} cacheVersion={artCacheVersion} />
      </div>
      <div className="mini-player-info">
        <p className="font-semibold truncate">{song.title}</p>
      </div>
      <div className="mini-player-controls">
        <button onClick={(e) => { e.stopPropagation(); onPlayPause(); }} className="mini-player-button" aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onExpand(); }} className="mini-player-button" aria-label="Expand player">
          <ArrowsPointingOutIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default MiniPlayer;
