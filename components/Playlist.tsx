
import React, { useRef, useState, useMemo, useEffect } from 'react';
import type { Song, SortMode, UserPlaylist, VoteData } from '../types';
import { MusicNoteIcon, PlayingIcon, HeartIcon, HeartFilledIcon, PlayIcon, CloseIcon, ViewGridIcon, ViewListIcon, DragHandleIcon, FunnelIcon, ChevronUpIcon, ThumbUpIcon, ThumbDownIcon, FireIcon, StarIcon, UsersIcon } from './Icons';
import { formatTime } from '../utils/parser';
import { getDominantColor } from '../utils/colorExtractor';
import { getArtFromCache } from '../utils/albumArt';
import SortMenu from './SortMenu';
import AlbumArt from './AlbumArt';
import SimpleTooltip from './SimpleTooltip';

interface FilterPopoverProps {
  availableStyles: string[];
  styleFilter: string[];
  onStyleFilterChange: (styles: string[]) => void;
  bpmFilter: [number, number];
  onBpmFilterChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ availableStyles, styleFilter, onStyleFilterChange, bpmFilter, onBpmFilterChange, onClearFilters }) => {
    const handleStyleToggle = (style: string) => {
        const newStyles = styleFilter.includes(style)
            ? styleFilter.filter(s => s !== style)
            : [...styleFilter, style];
        onStyleFilterChange(newStyles);
    };

    return (
      <div className="filter-popover animate-fade-in-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-[var(--text-primary)]">Filters</h3>
          <button onClick={onClearFilters} className="text-xs font-semibold text-[var(--accent-highlight)] hover:underline">Clear All</button>
        </div>

        {/* Style Filter */}
        <div className="mb-4">
          <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Style</p>
          <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
            {availableStyles.map(style => (
              <label key={style} className="filter-popover-checkbox-label">
                <input
                  type="checkbox"
                  className="filter-popover-checkbox"
                  checked={styleFilter.includes(style)}
                  onChange={() => handleStyleToggle(style)}
                />
                <span className="text-sm text-[var(--text-primary)] truncate">{style}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* BPM Filter */}
        <div>
           <p className="text-sm font-semibold text-[var(--text-secondary)] mb-2">BPM: {bpmFilter[0]} - {bpmFilter[1]}</p>
           <input
                type="range"
                min="0"
                max="250"
                value={bpmFilter[1]}
                onChange={e => onBpmFilterChange([bpmFilter[0], Number(e.target.value)])}
                className="w-full h-2 bg-[var(--surface-active-color)] rounded-lg appearance-none cursor-pointer"
            />
        </div>
      </div>
    );
};

const HighestRatedFilters: React.FC<{ activeFilter: string, onFilterChange: (filter: string) => void }> = ({ activeFilter, onFilterChange }) => (
    <div className="flex items-center gap-2 bg-[var(--surface-active-color)] p-1 rounded-md">
        {(['All-Time', 'This Week', 'Today']).map(filter => (
            <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={`px-3 py-1 text-sm font-semibold rounded transition-colors duration-200 ${
                    activeFilter === filter
                        ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)]'
                }`}
            >
                {filter}
            </button>
        ))}
    </div>
);


interface PlaylistProps {
  songs: Song[];
  sourceSongs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  isUserPlaylist: boolean;
  onSongSelect: (song: Song) => void;
  onToggleFavorite: (songUrl: string) => void;
  onPlayNext: (song: Song) => void;
  onAddToQueue: (song: Song) => void;
  onRemoveFromPlaylist: (songUrl: string) => void;
  onReorderPlaylist: (dragIndex: number, hoverIndex: number) => void;
  onPlayAll: (songs: Song[]) => void;
  sortMode: SortMode;
  onSortChange: (mode: SortMode) => void;
  isShuffled: boolean;
  artCacheVersion?: number;
  onContextMenu: (e: React.MouseEvent, song: Song) => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
  setDraggedSongs: (songs: Song[] | null) => void;
  isFeaturedActive?: boolean;
  isHighestRatedActive?: boolean;
  isTrendingActive?: boolean;
  isMostPopularActive?: boolean;
  isNowPlayingActive?: boolean;
  selectedSongUrls: Set<string>;
  onSelectionChange: (index: number, song: Song, isCtrl: boolean, isShift: boolean) => void;
  playlistName: string;
  playlistDescription?: string;
  styleFilter: string[];
  onStyleFilterChange: (styles: string[]) => void;
  bpmFilter: [number, number];
  onBpmFilterChange: (range: [number, number]) => void;
  votes: Record<string, VoteData>;
  onVote: (songUrl: string, voteType: 'up' | 'down') => void;
  highestRatedTimeFilter: string;
  onHighestRatedTimeFilterChange: (filter: string) => void;
}

const formatTotalTime = (songs: Song[]): string => {
  const totalSeconds = songs.reduce((acc, song) => acc + (song.duration && song.duration > 0 ? song.duration : 0), 0);
  if (totalSeconds === 0) return '';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  let parts = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  
  return parts.length > 0 ? ` • about ${parts.join(' ')}` : '';
};


const Playlist: React.FC<PlaylistProps> = ({ 
  songs, sourceSongs, currentSong, isPlaying, isUserPlaylist, onSongSelect, 
  onToggleFavorite, onAddToQueue, onRemoveFromPlaylist, onReorderPlaylist, onPlayAll,
  sortMode, onSortChange, isShuffled,
  artCacheVersion, onContextMenu,
  viewMode, onViewModeChange, setDraggedSongs, isFeaturedActive, isHighestRatedActive, isTrendingActive, isMostPopularActive, isNowPlayingActive,
  selectedSongUrls, onSelectionChange,
  playlistName, playlistDescription,
  styleFilter, onStyleFilterChange, bpmFilter, onBpmFilterChange,
  votes, onVote, highestRatedTimeFilter, onHighestRatedTimeFilterChange
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ index: number; position: 'top' | 'bottom' } | null>(null);
  const [headerBg, setHeaderBg] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLDivElement>(null);
  const [isCurrentSongVisible, setIsCurrentSongVisible] = useState(true);
  const songRowRefs = useRef(new Map<string, HTMLLIElement>());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const playlistArtSong = sourceSongs.find(s => s.coverArtUrl || (getArtFromCache(s.url) && getArtFromCache(s.url) !== 'error')) || sourceSongs[0] || null;

  useEffect(() => {
    const fetchColor = async () => {
        if (playlistArtSong) {
            const artUrl = playlistArtSong.coverArtUrl || getArtFromCache(playlistArtSong.url);
            if (artUrl && artUrl !== 'error') {
                const color = await getDominantColor(artUrl);
                if(color) {
                    setHeaderBg(`linear-gradient(to bottom, ${color}33, var(--surface-color))`);
                } else {
                    setHeaderBg('');
                }
            } else {
                setHeaderBg('');
            }
        } else {
            setHeaderBg('');
        }
    };
    fetchColor();
  }, [playlistArtSong]);
  
  const isCurrentSongInPlaylist = useMemo(() => {
    if (!currentSong) return false;
    return songs.some(s => s.url === currentSong.url);
  }, [songs, currentSong]);
  
  useEffect(() => {
    if (!isCurrentSongInPlaylist) {
        setIsCurrentSongVisible(false);
        return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCurrentSongVisible(entry.isIntersecting);
      },
      { root: scrollContainerRef.current, threshold: 0.5 }
    );

    const currentSongElement = currentSong ? songRowRefs.current.get(currentSong.url) : null;

    if (currentSongElement) {
      observer.observe(currentSongElement);
    }

    return () => {
      if (currentSongElement) {
        observer.unobserve(currentSongElement);
      }
    };
  }, [currentSong, songs, isCurrentSongInPlaylist]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen && !filterButtonRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  const availableStyles = useMemo(() => {
    const styles = new Set(sourceSongs.map(s => s.style).filter(Boolean));
    return Array.from(styles).sort();
  }, [sourceSongs]);

  const gridTemplate = useMemo(() => {
    const baseList = ['32px', '56px', '6fr', '2fr', '3fr', '2fr']; // play, art, title, bpm, style, duration
    if (isUserPlaylist) baseList.splice(1, 0, '24px'); // add drag handle
    
    if (isNowPlayingActive) {
      baseList.push('3fr'); // Listeners
    } else {
      baseList.push('2fr'); // Play Count
      baseList.push('3fr'); // Rating/Score
    }
    baseList.push('auto'); // Actions
    return `grid-cols-[${baseList.join('_')}]`;
  }, [isUserPlaylist, isNowPlayingActive]);
    
  const handleDragStart = (e: React.DragEvent, index: number, song: Song) => {
    if (isUserPlaylist) dragItem.current = index;
    
    const isDraggingSelection = selectedSongUrls.has(song.url) && selectedSongUrls.size > 1;
    const dragPayload = isDraggingSelection ? songs.filter(s => selectedSongUrls.has(s.url)) : [song];
    setDraggedSongs(dragPayload);
    e.dataTransfer.effectAllowed = 'copyMove';

    const dragPreview = document.createElement('div');
    dragPreview.className = 'drag-preview';
    const count = dragPayload.length;
    dragPreview.innerHTML = `
      <div class="icon">
        <svg viewBox="0 0 20 20" fill="currentColor" width="24" height="24">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      </div>
      <span>${count} ${count > 1 ? 'songs' : 'song'}</span>
    `;
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 20, 20);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };
  
  const handleDragEnd = () => {
    if (isUserPlaylist && dragItem.current !== null && dragOverItem.current !== null) {
        let targetIndex = dragOverItem.current;
        if (dropIndicator?.position === 'bottom') {
            targetIndex += 1;
            if(dragItem.current < targetIndex) targetIndex -= 1;
        }
        if (dragItem.current !== targetIndex) {
            onReorderPlaylist(dragItem.current, targetIndex);
        }
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedSongs(null);
    setDropIndicator(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!isUserPlaylist) return;
    dragOverItem.current = index;
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY > midY ? 'bottom' : 'top';
    setDropIndicator({ index, position });
  };


  const handleRowClick = (e: React.MouseEvent, index: number, song: Song) => {
    if ((e.target as HTMLElement).closest('button, .drag-handle, .vote-buttons')) return;
    onSelectionChange(index, song, e.ctrlKey || e.metaKey, e.shiftKey);
  };
  
  const handleJumpToCurrent = () => {
    if (currentSong) {
      songRowRefs.current.get(currentSong.url)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const effectiveViewMode = isFeaturedActive ? 'grid' : viewMode;

  const gridLayoutClass = isFeaturedActive
    ? "grid grid-cols-1 md:grid-cols-3 gap-6"
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4";

  const clearFilters = () => {
    onStyleFilterChange([]);
    onBpmFilterChange([0, 250]);
  };

  const hasActiveFilters = styleFilter.length > 0 || bpmFilter[0] > 0 || bpmFilter[1] < 250;

  return (
    <div className="flex flex-col h-full">
      <div className="playlist-header-gradient flex-shrink-0 p-6 flex items-end gap-6" style={{ background: headerBg }}>
        <div className="w-32 h-32 md:w-48 md:h-48 flex-shrink-0 rounded-lg shadow-2xl shadow-black/40 bg-[var(--surface-active-color)]">
            <AlbumArt song={playlistArtSong} cacheVersion={artCacheVersion} className="rounded-lg" />
        </div>
        <div className="flex-grow flex flex-col justify-end gap-2">
            <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] [text-shadow:0_2px_8px_var(--shadow-color)]">{playlistName}</h2>
            {playlistDescription && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{playlistDescription}</p>}
            <p className="text-sm font-semibold text-[var(--text-muted)] mt-1">
                {sourceSongs.length} songs{formatTotalTime(sourceSongs)}
            </p>
            <div className="mt-4 flex items-center gap-4">
                <button
                onClick={() => onPlayAll(songs)}
                className="p-3 rounded-full bg-[var(--accent-color)] text-[var(--accent-text-color)] hover:bg-[var(--accent-hover-color)] transition-transform transform hover:scale-105 disabled:bg-[var(--text-muted)]"
                disabled={songs.length === 0}
                aria-label="Play all songs in this list"
                >
                    <PlayIcon className="w-6 h-6"/>
                </button>
                <div className="flex items-center gap-2">
                    {isHighestRatedActive && (
                        <HighestRatedFilters activeFilter={highestRatedTimeFilter} onFilterChange={onHighestRatedTimeFilterChange} />
                    )}
                    {!isFeaturedActive && (
                    <div className="flex items-center bg-[var(--surface-active-color)] p-0.5 rounded-md">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            aria-label="List View"
                        >
                            <ViewListIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            aria-label="Grid View"
                        >
                            <ViewGridIcon className="w-5 h-5" />
                        </button>
                    </div>
                    )}
                    <div ref={filterButtonRef} className="relative">
                    <button
                        onClick={() => setIsFilterOpen(prev => !prev)}
                        className={`p-2 rounded-md transition-colors relative bg-[var(--surface-active-color)] ${isFilterOpen ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                        aria-label="Open filters"
                    >
                        <FunnelIcon className="w-5 h-5" />
                        {hasActiveFilters && <span className="absolute -top-1 -right-1 block w-2.5 h-2.5 bg-[var(--heart-color)] rounded-full border-2 border-[var(--surface-color)]"></span>}
                    </button>
                    {isFilterOpen && (
                        <FilterPopover 
                            availableStyles={availableStyles} 
                            styleFilter={styleFilter} 
                            onStyleFilterChange={onStyleFilterChange} 
                            bpmFilter={bpmFilter}
                            onBpmFilterChange={onBpmFilterChange}
                            onClearFilters={clearFilters}
                        />
                    )}
                    </div>
                    <SortMenu
                    currentSort={sortMode}
                    onSortChange={onSortChange}
                    disabled={isShuffled}
                    />
                </div>
            </div>
        </div>
      </div>
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 relative" onDragLeave={() => setDropIndicator(null)}>
          {songs.length > 0 ? (
            effectiveViewMode === 'list' ? (
              <ul className="space-y-1">
              {songs.map((song, index) => {
                const isActive = currentSong?.url === song.url;
                const isSelected = selectedSongUrls.has(song.url);
                const durationText = formatTime(song.duration);
                const isDropTargetTop = dropIndicator?.index === index && dropIndicator.position === 'top';
                const isDropTargetBottom = dropIndicator?.index === index && dropIndicator.position === 'bottom';
                const songVote = votes[song.url] || { up: [], down: [] };
                const score = isHighestRatedActive || isMostPopularActive
                    ? Math.round(song.score ?? 0)
                    : (songVote.up.length - songVote.down.length);

                return (
                  <li 
                      key={`${song.url}-${index}`}
                      ref={(el) => { if (el) songRowRefs.current.set(song.url, el); }}
                      className={`song-row grid ${gridTemplate} gap-x-4 items-center group rounded-md transition-colors duration-200 cursor-pointer ${
                        isSelected ? 'selected' : (isActive ? 'bg-[var(--accent-color)]/20' : 'hover:bg-[var(--surface-hover-color)]')
                      } ${dragItem.current === index ? 'opacity-40' : 'opacity-100'} ${isDropTargetTop ? 'playlist-drop-indicator-top' : ''} ${isDropTargetBottom ? 'playlist-drop-indicator-bottom' : ''}`}
                      onClick={(e) => handleRowClick(e, index, song)}
                      onContextMenu={(e) => onContextMenu(e, song)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index, song)}
                      aria-selected={isSelected}
                  >
                    <div className="flex items-center justify-center text-[var(--text-muted)] h-full" onClick={(e) => { e.stopPropagation(); onSongSelect(song); }}>
                        {isActive && isPlaying ? (
                            <PlayingIcon className="w-4 h-4 text-[var(--accent-hover-color)]" />
                        ) : (
                            <>
                                <span className="text-xs w-4 text-center group-hover:hidden">{index + 1}</span>
                                <div className="hidden group-hover:flex items-center justify-center">
                                    <PlayIcon className="w-5 h-5 text-[var(--text-primary)]" />
                                </div>
                            </>
                        )}
                    </div>
                    
                    {isUserPlaylist && (
                        <div className="drag-handle flex items-center justify-center text-[var(--text-muted)] h-full cursor-grab touch-none" aria-label="Drag to reorder">
                            <DragHandleIcon className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}

                    <div className={`w-10 h-10 rounded overflow-hidden relative shadow-md transition-all ${isActive ? 'ring-2 ring-offset-2 ring-offset-[var(--surface-hover-color)] ring-[var(--accent-color)]' : ''}`}>
                       <AlbumArt song={song} cacheVersion={artCacheVersion} />
                    </div>
                    
                    <div className={`truncate flex items-center gap-2 ${isActive ? 'text-[var(--accent-highlight)] font-semibold' : 'text-[var(--text-primary)]'}`}>
                      {isTrendingActive && <FireIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />}
                      {song.title}
                    </div>

                    <div className="text-sm text-[var(--text-muted)] truncate text-center">
                      <SimpleTooltip label="BPM">{song.bpm || '—'}</SimpleTooltip>
                    </div>
                    
                    <div className="text-sm text-[var(--text-muted)] truncate">
                      <SimpleTooltip label="Style">{song.style || '—'}</SimpleTooltip>
                    </div>
                    
                    <div className="text-sm text-[var(--text-muted)] font-mono text-right">
                      <SimpleTooltip label="Duration">{durationText}</SimpleTooltip>
                    </div>
                    
                    {isNowPlayingActive ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-primary)] font-semibold">
                            <UsersIcon className="w-4 h-4 text-[var(--text-muted)]" />
                            <SimpleTooltip label="Current Listeners">
                            {song.listeners?.toLocaleString() || '0'}
                            </SimpleTooltip>
                        </div>
                    ) : (<>
                        <div className="text-sm text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
                        <PlayIcon className="w-3 h-3" />
                        <SimpleTooltip label="Play Count">{song.playCount || 0}</SimpleTooltip>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
                            {isHighestRatedActive && song.voteCount !== undefined && (
                                <SimpleTooltip label={`Rated by ${song.voteCount} listener${song.voteCount === 1 ? '' : 's'}`}>
                                    <span className="font-semibold w-8 text-center tabular-nums">({song.voteCount})</span>
                                </SimpleTooltip>
                            )}
                            <SimpleTooltip label={isMostPopularActive ? "Popularity Score" : "Rating"}>
                            <span className="font-semibold w-6 text-center">{score}</span>
                            </SimpleTooltip>
                            {!isMostPopularActive && (
                            <div className="vote-buttons flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onVote(song.url, 'up')} className={`p-1 rounded-full ${songVote.userVote === 'up' ? 'text-green-400' : 'hover:text-green-400'}`}><ThumbUpIcon className="w-4 h-4" /></button>
                                <button onClick={() => onVote(song.url, 'down')} className={`p-1 rounded-full ${songVote.userVote === 'down' ? 'text-red-400' : 'hover:text-red-400'}`}><ThumbDownIcon className="w-4 h-4" /></button>
                            </div>
                            )}
                        </div>
                    </>)}


                    <div className="flex items-center justify-end pr-2" onClick={e => e.stopPropagation()}>
                      {isUserPlaylist && (
                        <button
                          onClick={() => onRemoveFromPlaylist(song.url)}
                          className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-color)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          aria-label="Remove from playlist"
                        >
                          <CloseIcon className="w-5 h-5 hover:text-[var(--text-primary)]" />
                        </button>
                      )}
                      <button
                        onClick={() => onToggleFavorite(song.url)}
                        className={`p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-color)] transition-colors ${isActive || song.isFavorite || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'}`}
                        aria-label={song.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {song.isFavorite ? 
                          <HeartFilledIcon className="w-5 h-5 text-[var(--heart-color)]" /> : 
                          <HeartIcon className="w-5 h-5 hover:text-[var(--heart-hover-color)]" />
                        }
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            ) : (
              <ul className={gridLayoutClass}>
                {songs.map((song, index) => {
                    const isActive = currentSong?.url === song.url;
                    return (
                        <li
                            key={`${song.url}-${index}`}
                            className="group relative rounded-md overflow-hidden cursor-pointer"
                            onClick={(e) => handleRowClick(e, index, song)}
                            onDoubleClick={() => onSongSelect(song)}
                            onContextMenu={(e) => onContextMenu(e, song)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index, song)}
                            onDragEnd={handleDragEnd}
                        >
                            <div className={`aspect-square w-full bg-[var(--surface-active-color)] rounded-md overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2 ring-offset-[var(--surface-color)] ring-[var(--accent-color)]' : 'group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-offset-[var(--surface-color)] group-hover:white/50'}`}>
                                <AlbumArt song={song} cacheVersion={artCacheVersion} />
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                {isActive && isPlaying ? (
                                    <PlayingIcon className="w-10 h-10 text-white drop-shadow-lg" />
                                ) : (
                                    <PlayIcon className="w-12 h-12 text-white drop-shadow-lg transform transition-transform group-hover:scale-110" />
                                )}
                            </div>
                             <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                <p className={`text-sm font-semibold truncate ${isActive ? 'text-[var(--accent-highlight)]' : 'text-white'}`}>
                                    {song.title}
                                </p>
                            </div>
                        </li>
                    )
                })}
              </ul>
            )
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-center px-4">
                  {isHighestRatedActive && !hasActiveFilters ? (
                    <>
                      <StarIcon className="w-16 h-16 text-[var(--surface-active-color)] mb-4" />
                      <p className="font-bold text-lg text-[var(--text-primary)]">Not Enough Ratings Yet</p>
                      <p className="text-sm">Songs need at least 3 votes in the selected time period to appear here. Keep on voting!</p>
                    </>
                  ) : (
                    <>
                      <FunnelIcon className="w-16 h-16 text-[var(--surface-active-color)] mb-4" />
                      <p className="font-bold text-lg text-[var(--text-primary)]">No Songs Found</p>
                      <p className="text-sm">Try adjusting your search or filter settings.</p>
                      {hasActiveFilters && (
                          <button onClick={clearFilters} className="mt-4 px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--surface-active-color)] hover:bg-[var(--accent-hover-color)] hover:text-black transition-colors">
                            Clear Filters
                          </button>
                      )}
                    </>
                  )}
              </div>
          )}
          {currentSong && isCurrentSongInPlaylist && !isCurrentSongVisible && (
            <button 
                onClick={handleJumpToCurrent}
                className="go-to-current-song-btn flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--accent-color)] text-[var(--accent-text-color)] shadow-lg hover:bg-[var(--accent-hover-color)] transition-all"
            >
                <ChevronUpIcon className="w-4 h-4" />
                <span className="text-sm font-semibold">Jump to Current Song</span>
            </button>
          )}
      </div>
    </div>
  );
};

export default Playlist;