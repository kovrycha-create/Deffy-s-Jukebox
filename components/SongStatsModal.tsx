

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Song, PlaybackStat, PlayRecord } from '../types';
import { CloseIcon } from './Icons';
import { formatTime } from '../utils/parser';
import Sparkline from './Sparkline';

interface SongStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  stats: PlaybackStat | null;
  playHistory: PlayRecord[];
}

const formatStat = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) {
        return 'N/A';
    }
    return Math.round(value).toLocaleString();
}

const SongStatsModal: React.FC<SongStatsModalProps> = ({ isOpen, onClose, song, stats, playHistory }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [dailyPlays, setDailyPlays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen && song && playHistory) {
      const songHistory = playHistory.filter(p => p.url === song.url);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const playsByDay = new Array(7).fill(0);
      
      songHistory.forEach(play => {
          const playDate = new Date(play.timestamp);
          const diffTime = today.getTime() - playDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays < 7) {
              playsByDay[6 - diffDays]++;
          }
      });
      setDailyPlays(playsByDay);
    }
  }, [isOpen, song, playHistory]);

  useEffect(() => {
    if (isOpen && modalRef.current && position === null) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = modalRef.current;
      setPosition({ x: (innerWidth - offsetWidth) / 2, y: (innerHeight - offsetHeight) / 2 });
    } else if (!isOpen) {
        setPosition(null);
    }
  }, [isOpen, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPosition({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    headerRef.current?.classList.remove('grabbing');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    isDraggingRef.current = true;
    const modalRect = modalRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - modalRect.left, y: e.clientY - modalRect.top };
    headerRef.current?.classList.add('grabbing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);

  if (!isOpen || !song) return null;

  const playCount = song.playCount || 0;
  const completions = stats?.completions || 0;
  const totalTimePlayed = stats?.totalTimePlayed || 0;
  
  const finishRate = playCount > 0 ? (completions / playCount) * 100 : 0;
  const avgListenTime = playCount > 0 ? totalTimePlayed / playCount : 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={modalRef}
        style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none', position: 'fixed' } : { visibility: 'hidden' }}
        className="bg-[var(--surface-color)] w-full max-w-lg rounded-lg shadow-2xl flex flex-col animate-fade-in-sm"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-labelledby="stats-modal-title"
      >
        <div ref={headerRef} onMouseDown={handleMouseDown} className="modal-header flex items-center justify-between p-4 border-b border-[var(--surface-active-color)]">
          <div>
            <h2 id="stats-modal-title" className="text-lg font-bold text-[var(--text-primary)] truncate">{song.title}</h2>
            <p className="text-sm text-[var(--text-muted)]">Playback Statistics</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[var(--surface-hover-color)] p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Total Plays</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{formatStat(playCount)}</p>
                </div>
                 <div className="bg-[var(--surface-hover-color)] p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Song Finishes</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{formatStat(completions)}</p>
                </div>
                 <div className="bg-[var(--surface-hover-color)] p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Finish Rate</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{finishRate.toFixed(0)}%</p>
                </div>
                <div className="bg-[var(--surface-hover-color)] p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-[var(--text-muted)]">Avg. Listen Time</p>
                    <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{formatTime(avgListenTime)}</p>
                </div>
            </div>
            <div className="mt-4 bg-[var(--surface-hover-color)] p-4 rounded-lg">
                <p className="text-sm font-semibold text-[var(--text-muted)] mb-2">Last 7 Days Activity</p>
                <Sparkline data={dailyPlays} width={400} height={60} className="mx-auto" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default SongStatsModal;