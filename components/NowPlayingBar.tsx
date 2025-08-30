import React, { useRef, useCallback } from 'react';
import type { Song } from '../types';
import AlbumArt from './AlbumArt';
import { PlayIcon, PauseIcon } from './Icons';

interface NowPlayingBarProps {
  song: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onOpenNowPlaying: () => void;
  artCacheVersion?: number;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const NowPlayingBar: React.FC<NowPlayingBarProps> = ({ song, isPlaying, onPlayPause, onOpenNowPlaying, artCacheVersion, currentTime, duration, onSeek }) => {
    const progressBarRef = useRef<HTMLDivElement>(null);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || duration <= 0) return;
        e.stopPropagation();
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const seekTime = (clickX / width) * duration;
        onSeek(seekTime);
    }, [duration, onSeek]);

    if (!song) return null;

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="now-playing-bar-container animate-slide-in-up" onClick={onOpenNowPlaying}>
            <div ref={progressBarRef} className="now-playing-bar-progress-container" onClick={handleSeek}>
                <div className="now-playing-bar-progress" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="flex items-center h-full gap-3 mt-1">
                <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden">
                    <AlbumArt song={song} cacheVersion={artCacheVersion} />
                </div>
                <div className="flex-grow min-w-0">
                    <p className="font-bold text-base text-[var(--text-primary)] truncate">{song.title}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{song.style || ' '}</p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onPlayPause(); }}
                    className="p-3 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                    {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                </button>
            </div>
        </div>
    );
};

export default NowPlayingBar;