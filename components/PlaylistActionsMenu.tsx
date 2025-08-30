import React, { useState, useLayoutEffect, useRef } from 'react';
import type { UserPlaylist } from '../types';
import { PencilIcon, TrashIcon } from './Icons';

interface PlaylistActionsMenuProps {
  x: number;
  y: number;
  playlist: UserPlaylist;
  onClose: () => void;
  onEditDetails: (playlist: UserPlaylist) => void;
  onDelete: (playlist: UserPlaylist) => void;
}

const PlaylistActionsMenu: React.FC<PlaylistActionsMenuProps> = ({ playlist, x, y, onClose, onEditDetails, onDelete }) => {
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

  const menuStyle: React.CSSProperties = {
    top: `${position.top}px`,
    left: `${position.left}px`,
    opacity: position.opacity,
  };

  const handleAction = (action: (playlist: UserPlaylist) => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation();
      action(playlist);
      onClose();
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
      <ul className="p-1 w-48">
        <li className="px-3 py-2 border-b border-[var(--surface-active-color)]">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate">{playlist.name}</p>
        </li>
        <li className="pt-1">
          <button
            onClick={handleAction(onEditDetails)}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors"
            role="menuitem"
          >
            <PencilIcon className="w-5 h-5 text-[var(--text-muted)]" />
            <span>Edit Details</span>
          </button>
        </li>
        <li>
          <button
            onClick={handleAction(onDelete)}
            className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--heart-color)] hover:bg-[var(--heart-color)]/20 transition-colors"
            role="menuitem"
          >
            <TrashIcon className="w-5 h-5" />
            <span>Delete Playlist</span>
          </button>
        </li>
      </ul>
    </div>
  );
};

export default PlaylistActionsMenu;