
import React from 'react';
import type { Song } from '../types';
import AlbumArt from './AlbumArt';
import { PlayIcon } from './Icons';

interface SharedSongModalProps {
  song: Song;
  onConfirm: () => void;
}

const SharedSongModal: React.FC<SharedSongModalProps> = ({ song, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in-sm" role="dialog" aria-modal="true" aria-labelledby="shared-song-title">
      <div className="bg-[var(--surface-color)] w-full max-w-sm rounded-lg shadow-2xl flex flex-col items-center p-8 text-center">
        <div className="w-32 h-32 rounded-lg overflow-hidden mb-6 shadow-lg">
          <AlbumArt song={song} />
        </div>
        <p className="text-[var(--text-muted)] text-sm mb-1">You've been sent a song!</p>
        <h2 id="shared-song-title" className="text-2xl font-bold text-[var(--text-primary)] mb-6">{song.title}</h2>
        <button
          onClick={onConfirm}
          className="flex items-center justify-center gap-2 bg-[var(--accent-color)] text-[var(--accent-text-color)] w-full px-6 py-3 rounded-lg font-semibold hover:bg-[var(--accent-hover-color)] transition-all transform hover:scale-105"
        >
          <PlayIcon className="w-6 h-6" />
          <span>Play Song</span>
        </button>
      </div>
    </div>
  );
};

export default SharedSongModal;
