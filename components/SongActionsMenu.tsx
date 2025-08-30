

import React, { useState, useLayoutEffect, useRef } from 'react';
import type { Song, UserPlaylist } from '../types';
import { QueueListIcon, PlayNextIcon, ShareIcon, HeartIcon, HeartFilledIcon, PlusIcon, TrashIcon, ChartBarIcon, ClockIcon } from './Icons';

interface ContextMenuProps {
  x: number;
  y: number;
  songs: Song[];
  onClose: () => void;
  onAddToQueue: (songs: Song[]) => void;
  onPlayNext: (songs: Song[]) => void;
  onToggleFavorite: (songUrl: string) => void;
  onAddSongsToFavorites: (songs: Song[]) => void;
  addToast: (message: string) => void;
  userPlaylists: UserPlaylist[];
  onAddSongsToPlaylist: (playlistId: string, songs: Song[]) => void;
  onCreatePlaylist: (songs: Song[]) => void;
  isUserPlaylist: boolean;
  onRemoveFromCurrentPlaylist: (songUrl: string) => void;
  onShowStats: (songs: Song[]) => void;
  onShareFromCurrentTime: (song: Song) => void;
}

const SongActionsMenu: React.FC<ContextMenuProps> = ({ 
    songs, x, y, onClose, onAddToQueue, onPlayNext, onToggleFavorite, onAddSongsToFavorites, addToast,
    userPlaylists, onAddSongsToPlaylist, onCreatePlaylist,
    isUserPlaylist, onRemoveFromCurrentPlaylist, onShowStats, onShareFromCurrentTime
}) => {
  const [isPlaylistSubMenuOpen, setIsPlaylistSubMenuOpen] = useState(false);
  const isMultiSelect = songs.length > 1;
  const singleSong = songs[0];
  
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x, opacity: 0 });

  useLayoutEffect(() => {
    if (menuRef.current) {
        const menuRect = menuRef.current.getBoundingClientRect();
        const { innerWidth, innerHeight } = window;
        
        let newX = x;
        let newY = y;
        
        if (x + menuRect.width > innerWidth) {
            newX = innerWidth - menuRect.width - 8;
        }
        if (y + menuRect.height > innerHeight) {
            newY = innerHeight - menuRect.height - 8;
        }
        
        setPosition({ top: newY, left: newX, opacity: 1 });
    }
  }, [x, y]);

  const handleCopyLink = () => {
    if (isMultiSelect) {
      addToast('Cannot copy link for multiple songs.');
      onClose();
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(singleSong.url)}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast('Song link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy link: ', err);
      addToast('Failed to copy link.');
    });
    onClose();
  };

  const menuStyle: React.CSSProperties = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    opacity: position.opacity,
  };

  const handleAction = (action: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      action();
      onClose();
    }
  };
  
  const handleCreatePlaylist = () => {
    onCreatePlaylist(songs);
    onClose();
  };

  const handleFavoriteAction = () => {
    if (isMultiSelect) {
      onAddSongsToFavorites(songs);
    } else {
      onToggleFavorite(singleSong.url);
    }
  };

  return (
    <div 
        ref={menuRef}
        style={menuStyle}
        onClick={e => e.stopPropagation()}
        className="fixed bg-[var(--surface-color)]/80 backdrop-blur-md border border-[var(--surface-active-color)] rounded-lg shadow-2xl z-50 origin-top-left animate-fade-in-sm"
        role="menu"
        aria-orientation="vertical"
    >
      <ul className="p-1 w-56">
        <li className="px-3 py-2 border-b border-[var(--surface-active-color)]">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">
              {isMultiSelect ? `${songs.length} items selected` : singleSong.title}
            </p>
        </li>
        <li className="pt-1">
          <button
            onClick={handleAction(() => onPlayNext(songs))}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors"
            role="menuitem"
          >
            <PlayNextIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>Play Next</span>
          </button>
        </li>
        <li>
          <button
            onClick={handleAction(() => onAddToQueue(songs))}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors"
            role="menuitem"
          >
            <QueueListIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>Add to Queue</span>
          </button>
        </li>
        <div className="h-[1px] bg-[var(--surface-active-color)] my-1"></div>
        <li>
          <button
            onClick={handleAction(handleFavoriteAction)}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors"
            role="menuitem"
          >
            {singleSong?.isFavorite && !isMultiSelect
                ? <HeartFilledIcon className="w-5 h-5 text-[var(--heart-color)]" />
                : <HeartIcon className="w-5 h-5 text-[var(--text-muted)]" />
            }
            <span>{isMultiSelect ? 'Add to Favorites' : (singleSong.isFavorite ? 'Remove from Favorites' : 'Add to Favorites')}</span>
          </button>
        </li>
         <li onMouseEnter={() => setIsPlaylistSubMenuOpen(true)} onMouseLeave={() => setIsPlaylistSubMenuOpen(false)} className="relative">
          <button
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors"
            role="menuitem"
          >
            <div className="flex items-center gap-3">
                <QueueListIcon className="w-5 h-5 text-[var(--text-muted)]" />
                <span>Add to playlist</span>
            </div>
            <span className="text-xs">▶</span>
          </button>
          {isPlaylistSubMenuOpen && (
              <div className="absolute left-full -top-1 w-52 bg-[var(--surface-color)]/80 backdrop-blur-md border border-[var(--surface-active-color)] rounded-lg shadow-2xl animate-fade-in-sm">
                  <ul className="p-1 max-h-60 overflow-y-auto">
                      <li>
                          <button onClick={handleCreatePlaylist} className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors">
                              <PlusIcon className="w-5 h-5 text-[var(--text-muted)]" />
                              <span>New Playlist</span>
                          </button>
                      </li>
                      <div className="h-[1px] bg-[var(--surface-active-color)] my-1"></div>
                      {userPlaylists.map(p => (
                          <li key={p.id}>
                              <button
                                onClick={(e) => { e.stopPropagation(); onAddSongsToPlaylist(p.id, songs); onClose(); }}
                                className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors truncate"
                              >
                                  <span className="truncate">{p.name}</span>
                              </button>
                          </li>
                      ))}
                      {userPlaylists.length === 0 && <li className="px-3 py-2 text-xs text-[var(--text-muted)] text-center">No playlists yet.</li>}
                  </ul>
              </div>
          )}
        </li>
        <li>
          <button
            onClick={handleAction(() => onShowStats(songs))}
            disabled={isMultiSelect}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <ChartBarIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>View Stats</span>
          </button>
        </li>
        <div className="h-[1px] bg-[var(--surface-active-color)] my-1"></div>
        <li>
          <button
            onClick={handleCopyLink}
            disabled={isMultiSelect}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <ShareIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>Copy Link</span>
          </button>
        </li>
        <li>
          <button
            onClick={handleAction(() => onShareFromCurrentTime(singleSong))}
            disabled={isMultiSelect}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            role="menuitem"
          >
            <ClockIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>Share from Current Time</span>
          </button>
        </li>
        {isUserPlaylist && !isMultiSelect && (
            <>
                <div className="h-[1px] bg-[var(--surface-active-color)] my-1"></div>
                <li>
                  <button
                    onClick={handleAction(() => onRemoveFromCurrentPlaylist(singleSong.url))}
                    className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--heart-color)] hover:bg-[var(--heart-color)]/20 transition-colors"
                    role="menuitem"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span>Remove from playlist</span>
                  </button>
                </li>
            </>
        )}
      </ul>
    </div>
  );
};

export default SongActionsMenu;