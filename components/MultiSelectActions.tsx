
import React, { useState } from 'react';
import type { Song, UserPlaylist } from '../types';
import { CloseIcon, HeartIcon, PlusIcon, PlayNextIcon, QueueListIcon } from './Icons';

interface MultiSelectActionsProps {
  selectedSongs: Song[];
  userPlaylists: UserPlaylist[];
  onPlayNext: (songs: Song[]) => void;
  onAddToQueue: (songs: Song[]) => void;
  onAddSongsToFavorites: (songs: Song[]) => void;
  onAddSongsToPlaylist: (playlistId: string, songs: Song[]) => void;
  onClearSelection: () => void;
  onCreatePlaylist: () => void;
}

const MultiSelectActions: React.FC<MultiSelectActionsProps> = ({
  selectedSongs, userPlaylists, onPlayNext, onAddToQueue, onAddSongsToFavorites, onAddSongsToPlaylist, onClearSelection, onCreatePlaylist
}) => {
    const [isPlaylistSubMenuOpen, setIsPlaylistSubMenuOpen] = useState(false);
    
    const handleAction = (action: (songs: Song[]) => void) => {
        action(selectedSongs);
        onClearSelection();
    };

    const handleCreatePlaylist = () => {
        onCreatePlaylist();
        setIsPlaylistSubMenuOpen(false);
        // onClearSelection is handled after modal save
    };
    
    return (
        <div className="multi-select-bar flex items-center gap-2 p-2 bg-[var(--surface-color)]/80 backdrop-blur-md border border-[var(--surface-active-color)] rounded-full shadow-2xl">
            <span className="text-sm font-bold text-[var(--text-primary)] px-3">{selectedSongs.length} selected</span>
            
            <div className="h-6 w-px bg-[var(--surface-active-color)]"></div>

            <button onClick={() => handleAction(onPlayNext)} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-colors" aria-label="Play Next">
                <PlayNextIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleAction(onAddToQueue)} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-colors" aria-label="Add to Queue">
                <QueueListIcon className="w-5 h-5" />
            </button>
            <button onClick={() => handleAction(onAddSongsToFavorites)} className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--heart-hover-color)] transition-colors" aria-label="Add to Favorites">
                <HeartIcon className="w-5 h-5" />
            </button>

            {/* Add to Playlist Dropdown */}
            <div className="relative" onMouseEnter={() => setIsPlaylistSubMenuOpen(true)} onMouseLeave={() => setIsPlaylistSubMenuOpen(false)}>
                 <button className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-colors" aria-label="Add to Playlist">
                    <PlusIcon className="w-5 h-5" />
                </button>
                {isPlaylistSubMenuOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[var(--surface-color)]/80 backdrop-blur-md border border-[var(--surface-active-color)] rounded-lg shadow-2xl animate-fade-in-sm">
                        <ul className="p-1 max-h-48 overflow-y-auto">
                            <li>
                                <button onClick={handleCreatePlaylist} className="w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] transition-colors">
                                    <PlusIcon className="w-5 h-5" />
                                    <span>New Playlist</span>
                                </button>
                            </li>
                            <div className="h-[1px] bg-[var(--surface-active-color)] my-1"></div>
                            {userPlaylists.map(p => (
                                <li key={p.id}>
                                    <button
                                        onClick={() => { onAddSongsToPlaylist(p.id, selectedSongs); onClearSelection(); }}
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
            </div>

            <div className="h-6 w-px bg-[var(--surface-active-color)]"></div>

            <button onClick={onClearSelection} className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-colors" aria-label="Clear selection">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

export default MultiSelectActions;
