
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Song } from '../types';
import { generateAlbumArt, getArtFromCache } from '../utils/albumArt';
import { CloseIcon, SearchIcon } from './Icons';
import AlbumArt from './AlbumArt';

interface AlbumArtGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onArtGenerated: () => void;
}

const AlbumArtGenerator: React.FC<AlbumArtGeneratorProps> = ({ isOpen, onClose, songs, onArtGenerated }) => {
  const [generatingUrl, setGeneratingUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

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


  const songsToProcess = useMemo(() => {
    const processable = songs.filter(song => !song.coverArtUrl && !song.disableAlbumArtGeneration);
    if (!searchQuery) return processable;
    return processable.filter(song => song.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [songs, searchQuery]);

  const handleGenerate = async (song: Song) => {
    setGeneratingUrl(song.url);
    try {
      await generateAlbumArt(song);
      onArtGenerated();
    } catch (error) {
      console.error(`Failed to generate art for ${song.title}`, error);
      alert(`Could not generate art for "${song.title}". Check the console for details.`);
    } finally {
      setGeneratingUrl(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={modalRef}
        style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none', position: 'fixed' } : { visibility: 'hidden' }}
        className="bg-[var(--surface-color)] w-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col animate-fade-in-sm"
        onClick={e => e.stopPropagation()}
      >
        <div
          ref={headerRef}
          onMouseDown={handleMouseDown}
          className="modal-header flex items-center justify-between p-4 border-b border-[var(--surface-active-color)]"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Generate Album Art</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex flex-col gap-4 flex-grow min-h-0">
          <p className="text-[var(--text-secondary)]">
            Select a song to generate unique, AI-powered album art. The result will be cached in your browser.
          </p>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-5 h-5 text-[var(--text-muted)]" />
            </span>
            <input
              type="text"
              placeholder="Filter songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--bg-color)] text-[var(--text-primary)] border border-[var(--surface-active-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
              aria-label="Filter songs to generate art for"
            />
          </div>
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <ul className="space-y-2">
              {songsToProcess.map(song => (
                <li key={song.url} className="flex items-center gap-4 p-2 bg-[var(--surface-hover-color)] rounded-md">
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                    <AlbumArt song={song} cacheVersion={generatingUrl === song.url ? Date.now() : 0} />
                  </div>
                  <div className="flex-grow truncate">
                    <p className="text-[var(--text-primary)] truncate">{song.title}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{song.style || 'No style metadata'}</p>
                  </div>
                  <button
                    onClick={() => handleGenerate(song)}
                    disabled={generatingUrl === song.url}
                    className="bg-[var(--accent-color)] text-[var(--accent-text-color)] px-4 py-1.5 rounded-md font-semibold hover:bg-[var(--accent-hover-color)] transition-all disabled:opacity-50 disabled:cursor-wait w-32 text-center"
                  >
                    {generatingUrl === song.url ? 'Generating...' : 'Generate'}
                  </button>
                </li>
              ))}
              {songsToProcess.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    <p>No songs available for art generation.</p>
                    <p className="text-sm">This may be because all songs have pre-defined art, have art generation disabled, or don't match your filter.</p>
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumArtGenerator;