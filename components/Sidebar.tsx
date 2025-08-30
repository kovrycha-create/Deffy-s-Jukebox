import React, { useRef } from 'react';
import type { Song, UserPlaylist } from '../types';
import Queue from './Queue';
import { PlusIcon, QueueListIcon, TrashIcon, DragHandleIcon, ClockIcon, TrendingUpIcon, HeartIcon, StarIcon, PodiumIcon, UsersIcon, WandSparklesIcon, ChevronDownIcon, ChevronLeftIcon, PaletteIcon, MusicNoteIcon, SparklesIcon, FireIcon } from './Icons';

type SidebarProps = {
    isMobile: boolean;
    isOpen: boolean;
    onClose: () => void;
    topTabs: {id: string, icon: React.FC<{className?: string}>}[];
    featuredSparkleKey: number;
    activeTab: string;
    handleTabClick: (tabId: string) => void;
    animateFavorites: boolean;
    setAnimateFavorites: (animate: boolean) => void;
    favorites: Set<string>;
    mostPopularTab: string;
    nowPlayingTab: string;
    highestRatedTab: string;
    topPlayedTab: string;
    recentlyPlayedTab: string;
    favoritesTab: string;
    playerSettings: any;
    updatePlayerSettings: (settings: any) => void;
    setIsAiMixOpen: (isOpen: boolean) => void;
    setPlaylistModalState: (state: any) => void;
    userPlaylists: UserPlaylist[];
    draggedPlaylistId: React.MutableRefObject<string | null>;
    dragOverPlaylistId: React.MutableRefObject<string | null>;
    handleReorderUserPlaylists: (dragIndex: number, hoverIndex: number) => void;
    handlePlaylistContextMenu: (e: React.MouseEvent, playlist: UserPlaylist) => void;
    dropTargetId: string | null;
    draggedSongs: Song[] | null;
    dragLeaveTimeoutRef: React.MutableRefObject<number | null>;
    setDropTargetId: (id: string | null) => void;
    handleAddSongsToPlaylist: (playlistId: string, songs: Song[]) => void;
    isOriginalTopTab: (tab: string) => boolean;
    activeSubTab: string | null;
    playlistsData: any;
    handleSubTabClick: (subTab: any) => void;
    upNextWithDurations: (Song & { duration?: number })[];
    currentSongWithMeta: (Song & { duration?: number, playCount?: number }) | null;
    isPlaying: boolean;
    handleSongSelect: (song: Song) => void;
    handleReorderQueue: (dragIndex: number, hoverIndex: number) => void;
    handleRemoveFromQueue: (song: Song) => void;
    handleClearQueue: () => void;
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const {
        isMobile, isOpen, onClose, topTabs, featuredSparkleKey, activeTab, handleTabClick, animateFavorites, setAnimateFavorites,
        favorites, mostPopularTab, nowPlayingTab, highestRatedTab, topPlayedTab, recentlyPlayedTab, favoritesTab, playerSettings, updatePlayerSettings,
        setIsAiMixOpen, setPlaylistModalState, userPlaylists, draggedPlaylistId, dragOverPlaylistId, handleReorderUserPlaylists, handlePlaylistContextMenu,
        dropTargetId, draggedSongs, dragLeaveTimeoutRef, setDropTargetId, handleAddSongsToPlaylist, isOriginalTopTab, activeSubTab, playlistsData, handleSubTabClick,
        upNextWithDurations, currentSongWithMeta, isPlaying, handleSongSelect, handleReorderQueue, handleRemoveFromQueue, handleClearQueue
    } = props;
    const { isPlaylistsCollapsed, isLibraryCollapsed, isSidebarCompact } = playerSettings;

    return (
        <div className={`sidebar-container-wrapper ${isMobile ? 'is-mobile' : ''} ${isOpen ? 'open' : ''}`}>
            <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
            <aside className={`sidebar ${isSidebarCompact ? 'compact' : ''} h-full md:w-72 flex-shrink-0 flex flex-col gap-4 relative md:static`} data-tutorial-id="sidebar">
                <div className="glass-surface rounded-lg p-2 shadow-md">
                    <nav className="flex flex-col gap-1">
                    {topTabs.map(({id: tab, icon: Icon}) => {
                        const isFeatured = tab.includes('Featured');
                        return (
                        <button
                            key={isFeatured ? `featured-tab-${featuredSparkleKey}` : tab}
                            onClick={() => { handleTabClick(tab); onClose(); }}
                            className={`sidebar-button flex items-center gap-3 w-full text-left rounded-md transition-all duration-200 text-lg p-3 ${
                            activeTab === tab
                                ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-lg font-bold'
                                : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-semibold'
                            } ${isFeatured ? 'animate-sparkle-glow' : ''}`}
                        >
                            <Icon className="w-6 h-6 flex-shrink-0" />
                            <span className="sidebar-label">{tab}</span>
                        </button>
                        )
                    })}
                    </nav>
                    <div className="my-2 border-t border-[var(--surface-active-color)]"></div>
                    <div className='px-1 pb-1'>
                        <div className='sidebar-section-header flex items-center justify-between mb-1'>
                            <h2 className='sidebar-label text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider px-2'>Library</h2>
                            <div className="flex items-center">
                                <button onClick={() => updatePlayerSettings({ isLibraryCollapsed: !isLibraryCollapsed })} className='p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]' aria-label="Toggle library visibility">
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isLibraryCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {!isLibraryCollapsed && (
                            <nav className="flex flex-col gap-1 animate-fade-in-sm">
                                <button onClick={() => { handleTabClick(favoritesTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === favoritesTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'} ${animateFavorites ? 'animate-pink-sparkle' : ''}`} onAnimationEnd={() => setAnimateFavorites(false)}>
                                    <HeartIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{favoritesTab}</span>
                                    <span className="sidebar-item-count text-xs opacity-70">{favorites.size}</span>
                                </button>
                                <button onClick={() => { handleTabClick(mostPopularTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === mostPopularTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'}`}>
                                    <PodiumIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{mostPopularTab}</span>
                                </button>
                                <button onClick={() => { handleTabClick(nowPlayingTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === nowPlayingTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'}`}>
                                    <UsersIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{nowPlayingTab}</span>
                                </button>
                                <button onClick={() => { handleTabClick(highestRatedTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === highestRatedTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'}`}>
                                    <StarIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{highestRatedTab}</span>
                                </button>
                                <button onClick={() => { handleTabClick(topPlayedTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === topPlayedTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'}`}>
                                    <TrendingUpIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{topPlayedTab}</span>
                                </button>
                                <button onClick={() => { handleTabClick(recentlyPlayedTab); onClose(); }} className={`sidebar-button group relative flex items-center gap-3 w-full text-left py-2 pl-3 pr-2 rounded-md transition-all duration-200 text-base ${activeTab === recentlyPlayedTab ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold' : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] font-medium'}`}>
                                    <ClockIcon className="w-5 h-5 flex-shrink-0" />
                                    <span className="sidebar-label truncate flex-grow">{recentlyPlayedTab}</span>
                                </button>
                            </nav>
                        )}
                    </div>
                    <div className="my-2 border-t border-[var(--surface-active-color)]"></div>
                    <div className='px-1 pb-1'>
                        <div className='sidebar-section-header flex items-center justify-between mb-1'>
                            <h2 className='sidebar-label text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider px-2'>My Playlists</h2>
                            <div className="flex items-center">
                                <button onClick={() => setIsAiMixOpen(true)} className='p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]' aria-label="Create an Instant Mix">
                                    <WandSparklesIcon className='w-5 h-5' />
                                </button>
                                <button onClick={() => setPlaylistModalState({ mode: 'create' })} className='p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]' aria-label="Create new playlist">
                                    <PlusIcon className='w-5 h-5' />
                                </button>
                                <button onClick={() => updatePlayerSettings({ isPlaylistsCollapsed: !isPlaylistsCollapsed })} className='p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]' aria-label="Toggle playlists visibility">
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${isPlaylistsCollapsed ? '-rotate-90' : ''}`} />
                                </button>
                            </div>
                        </div>
                        {!isPlaylistsCollapsed && (
                        <nav className="flex flex-col gap-1 animate-fade-in-sm">
                            {userPlaylists.length > 0 ? userPlaylists.map((playlist, index) => (
                                <div 
                                    key={playlist.id}
                                    draggable
                                    onDragStart={() => (draggedPlaylistId.current = playlist.id)}
                                    onDragEnter={() => (dragOverPlaylistId.current = playlist.id)}
                                    onDragEnd={() => {
                                        const dragId = draggedPlaylistId.current;
                                        const hoverId = dragOverPlaylistId.current;
                                        if (dragId && hoverId && dragId !== hoverId) {
                                            const dragIndex = userPlaylists.findIndex(p => p.id === dragId);
                                            const hoverIndex = userPlaylists.findIndex(p => p.id === hoverId);
                                            handleReorderUserPlaylists(dragIndex, hoverIndex);
                                        }
                                        draggedPlaylistId.current = null;
                                        dragOverPlaylistId.current = null;
                                        setDropTargetId(null);
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onContextMenu={(e) => handlePlaylistContextMenu(e, playlist)} 
                                    className={`sidebar-playlist-item group relative flex items-center gap-1 rounded-md transition-all duration-150 playlist-drop-target ${dropTargetId === playlist.id ? 'bg-[var(--accent-hover-color)] shadow-lg shadow-[var(--accent-color)]/50' : ''} ${draggedPlaylistId.current === playlist.id ? 'dragging' : ''}`}
                                >
                                    <div className="cursor-grab touch-none p-2 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DragHandleIcon className="w-4 h-4" />
                                    </div>
                                    <button
                                    onClick={() => { handleTabClick(playlist.id); onClose(); }}
                                    className={`sidebar-button w-full text-left py-2 pl-1 pr-2 rounded-md transition-all duration-200 text-base flex items-center gap-3 ${
                                        activeTab === playlist.id
                                        ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-[var(--accent-color)]/30 shadow-md font-bold'
                                        : 'text-[var(--text-primary)] group-hover:bg-[var(--surface-hover-color)] group-hover:text-[var(--text-primary)] font-medium'
                                    }`}
                                    >
                                        <QueueListIcon className="w-5 h-5 flex-shrink-0" />
                                        <span className="sidebar-label truncate flex-grow">{playlist.name}</span>
                                        <span className="sidebar-item-count text-xs opacity-70">{playlist.songUrls.length}</span>
                                    </button>
                                    {draggedSongs && (
                                        <div
                                            className="absolute inset-0 rounded-md"
                                            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                                            onDragEnter={(e) => { e.preventDefault(); if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current); setDropTargetId(playlist.id); }}
                                            onDragLeave={(e) => { e.preventDefault(); dragLeaveTimeoutRef.current = window.setTimeout(() => setDropTargetId(null), 100); }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
                                                if (draggedSongs) {
                                                    handleAddSongsToPlaylist(playlist.id, draggedSongs);
                                                }
                                                setDropTargetId(null);
                                            }}
                                        />
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-4 px-2">
                                    <p className="sidebar-label text-sm text-[var(--text-muted)] mb-3">Your custom playlists will appear here.</p>
                                    <button onClick={() => setPlaylistModalState({ mode: 'create' })} className='flex items-center justify-center gap-2 w-full px-3 py-2 rounded-md bg-[var(--surface-hover-color)] text-[var(--text-secondary)] hover:bg-[var(--surface-active-color)] hover:text-[var(--text-primary)] transition-colors'>
                                        <PlusIcon className='w-5 h-5' />
                                        <span className="sidebar-label text-sm font-semibold">Create New Playlist</span>
                                    </button>
                                </div>
                            )}
                        </nav>
                        )}
                    </div>
                </div>

                {isOriginalTopTab(activeTab) && (
                    <div className="glass-surface rounded-lg p-2 shadow-md">
                        <nav className="flex flex-col gap-1">
                        {(Object.keys(playlistsData[activeTab]) as any[]).map(subTab => (
                            <button
                            key={subTab}
                            onClick={() => { handleSubTabClick(subTab); onClose(); }}
                            className={`sidebar-button w-full text-left py-2.5 pl-5 pr-2.5 rounded-md transition-all duration-200 relative ${
                                activeSubTab === subTab
                                ? 'bg-[var(--surface-active-color)] text-[var(--accent-highlight)] font-semibold'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]'
                            }`}
                            >
                            {activeSubTab === subTab && (
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-[var(--accent-hover-color)] rounded-full"></span>
                                )}
                                <span className="sidebar-label">{subTab}</span>
                            </button>
                        ))}
                        </nav>
                    </div>
                )}
                
                <div className="glass-surface rounded-lg shadow-md flex-grow overflow-hidden flex flex-col">
                    <Queue
                    upNextQueue={upNextWithDurations}
                    currentSong={currentSongWithMeta}
                    isPlaying={isPlaying}
                    onSongSelect={handleSongSelect}
                    onReorder={handleReorderQueue}
                    onRemove={handleRemoveFromQueue}
                    onClearQueue={handleClearQueue}
                    />
                </div>
                <button 
                        onClick={() => updatePlayerSettings({ isSidebarCompact: !isSidebarCompact })}
                        className="absolute bottom-4 left-4 z-20 bg-[var(--surface-color)] p-1.5 rounded-full border border-[var(--surface-active-color)] shadow-lg hover:bg-[var(--accent-color)] hover:text-[var(--accent-text-color)] transition-all text-[var(--text-secondary)] md:flex hidden"
                        aria-label={isSidebarCompact ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronLeftIcon className={`w-5 h-5 transition-transform ${isSidebarCompact ? 'rotate-180' : ''}`} />
                    </button>
            </aside>
        </div>
    );
}

export default Sidebar;