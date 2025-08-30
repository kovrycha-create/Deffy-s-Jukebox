import React, { useState, useEffect } from 'react';
import type { Song, PlayerSettings, VoteData, CrowdMarker, Comment } from '../types';
import { PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon, VolumeUpIcon, VolumeMediumIcon, VolumeLowIcon, VolumeOffIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon, PlayPauseIcon, PlaySlashIcon, ChevronUpIcon, ChevronDownIcon, StarIcon, StarFilledIcon, ChatBubbleIcon } from './Icons';
import { formatTime as formatTimeUtil } from '../utils/parser';
import AlbumArt from './AlbumArt';
import Visualizer from './Visualizer';
import Tooltip from './Tooltip';
import VotePrompt from './VotePrompt';
import ProgressBarHeatmap from './ProgressBarHeatmap';

interface MusicPlayerProps {
  song: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  playerSettings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
  onToggleShuffle: () => void;
  onCycleRepeatMode: () => void;
  artCacheVersion?: number;
  onOpenNowPlaying: (defaultView?: 'lyrics' | 'comments') => void;
  onCollapse: () => void;
  nowPlayingTriggerId?: string;
  analyserNode: AnalyserNode | null;
  songForVotePrompt: Song | null;
  setSongForVotePrompt: (song: Song | null) => void;
  votes: Record<string, VoteData>;
  onVote: (songUrl: string, voteType: 'up' | 'down') => void;
  comments: Record<string, Comment[]>;
  crowdMarkers: CrowdMarker[];
  onAddCrowdMarker: (songUrl: string, timestamp: number) => void;
  playerGlowColor: string | null;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const formatted = formatTimeUtil(time);
  return formatted === '' ? '00:00' : formatted;
};

const RangeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => {
    const valueAsNumber = Number(props.value) || 0;
    const max = Number(props.max) || 1;
    const progressPercentage = max > 0 ? (valueAsNumber / max) * 100 : 0;

    return (
         <input
            type="range"
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer range-lg"
            style={{
                '--progress-percentage': `${progressPercentage}%`,
                background: `linear-gradient(to right, var(--accent-hover-color) ${progressPercentage}%, var(--surface-active-color) ${progressPercentage}%)`
            } as React.CSSProperties}
            {...props}
        />
    )
}

const MusicPlayer: React.FC<MusicPlayerProps> = ({ 
  song, isPlaying, onPlayPause, onNext, onPrev, audioRef,
  playerSettings, onUpdateSettings, onToggleShuffle, onCycleRepeatMode,
  artCacheVersion, onOpenNowPlaying, onCollapse, nowPlayingTriggerId,
  analyserNode, songForVotePrompt, setSongForVotePrompt, votes, onVote,
  comments, crowdMarkers, onAddCrowdMarker, playerGlowColor
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isShuffled, repeatMode, isAutoplayEnabled, volume, isMuted, visualizerEnabled, volumeControlStyle, playbackRate } = playerSettings;
  
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showStarConfirmation, setShowStarConfirmation] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = playbackRate;
    }
  }, [playbackRate, audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
    };
  }, [audioRef]);
  
  const toggleMute = () => {
    onUpdateSettings({ isMuted: !isMuted });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'Escape') {
          const modal = document.querySelector('[role="dialog"]');
          if (modal) return;
      }

      if (!song) return;

      switch(e.key) {
        case ' ':
          e.preventDefault();
          onPlayPause();
          break;
        case 'ArrowRight':
          onNext();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
        case 's':
        case 'S':
          onToggleShuffle();
          break;
        case 'r':
        case 'R':
          onCycleRepeatMode();
          break;
        case 'a':
        case 'A':
          onUpdateSettings({ isAutoplayEnabled: !isAutoplayEnabled });
          break;
        case 'ArrowUp':
          e.preventDefault();
          onUpdateSettings({ volume: Math.min(volume + 0.05, 1) });
          break;
        case 'ArrowDown':
          e.preventDefault();
          onUpdateSettings({ volume: Math.max(volume - 0.05, 0) });
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [song, onPlayPause, onNext, onPrev, onToggleShuffle, onCycleRepeatMode, onUpdateSettings, volume, isAutoplayEnabled]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    const newMutedState = newVolume === 0;
    onUpdateSettings({ volume: newVolume, isMuted: newMutedState });
  };
  
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!song || !isFinite(duration) || duration === 0) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    setHoverTime(percentage * duration);
    setHoverPosition(x);
  };
  
  const handleStarClick = () => {
    if (song) {
      onAddCrowdMarker(song.url, currentTime);
      setShowStarConfirmation(true);
      setTimeout(() => setShowStarConfirmation(false), 1000);
    }
  };

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeOffIcon className="w-6 h-6" />;
    if (volume < 0.33) return <VolumeLowIcon className="w-6 h-6" />;
    if (volume < 0.66) return <VolumeMediumIcon className="w-6 h-6" />;
    return <VolumeUpIcon className="w-6 h-6" />;
  };
  
  const commentCount = (song && comments && comments[song.url]?.length) || 0;
  const playerStyle: React.CSSProperties = playerGlowColor ? { '--ambilight-glow-color': playerGlowColor } as React.CSSProperties : {};

  return (
    <div className="ambilight-glow" style={playerStyle}>
      <div className="relative glass-surface p-4 text-[var(--text-primary)]">
        <div className="flex items-center gap-4">
          {/* Song Info & Album Art */}
          <div className="w-1/4 flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 shadow-lg shadow-[var(--shadow-color)] relative group cursor-pointer" onClick={() => onOpenNowPlaying('lyrics')} data-tutorial-id={nowPlayingTriggerId}>
                <AlbumArt song={song} cacheVersion={artCacheVersion} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <ChevronUpIcon className="w-8 h-8 text-white"/>
                </div>
              </div>
              <div className="truncate flex-grow relative overflow-hidden h-16 flex justify-center">
                  {visualizerEnabled && (
                      <div className="absolute inset-0 z-0 opacity-25">
                          <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />
                      </div>
                  )}
                  <div className="relative z-10 flex items-center gap-1">
                      <div className="flex-grow truncate">
                          <p className="font-bold text-lg truncate">{song?.title || 'No Song Selected'}</p>
                          <div className="text-xs text-[var(--text-secondary)] h-4 mt-1">
                              {(song?.bpm || song?.style) && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                      {song.bpm && <span className="px-1.5 py-0.5 bg-[var(--surface-active-color)]/80 rounded-full">{song.bpm} BPM</span>}
                                      {song.style && <span className="px-1.5 py-0.5 bg-[var(--surface-active-color)]/80 rounded-full truncate">{song.style}</span>}
                                  </div>
                              )}
                          </div>
                      </div>
                      <button onClick={handleStarClick} disabled={!song} className="p-2 text-yellow-400 disabled:opacity-50">
                          {showStarConfirmation ? <StarFilledIcon className="w-5 h-5 animate-ping-once" /> : <StarIcon className="w-5 h-5"/>}
                      </button>
                      <button
                        onClick={() => onOpenNowPlaying('comments')}
                        disabled={!song}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 disabled:opacity-50"
                        aria-label="View comments"
                      >
                        <ChatBubbleIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold tabular-nums">{commentCount}</span>
                      </button>
                  </div>
              </div>
          </div>


          {/* Player Controls */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-4 w-full">
               <div className="flex items-center gap-4 w-24 justify-end">
                  <Tooltip label="Shuffle" hotkey="S">
                      <button onClick={onToggleShuffle} className={`p-1 transition-colors duration-200 disabled:opacity-50 ${isShuffled ? 'text-[var(--accent-hover-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} disabled={!song} aria-label="Toggle shuffle" aria-pressed={isShuffled}>
                      <ShuffleIcon className="w-5 h-5" />
                      </button>
                  </Tooltip>
                  <Tooltip label="Repeat" hotkey="R">
                  <button onClick={onCycleRepeatMode} className={`p-1 transition-colors duration-200 disabled:opacity-50 ${repeatMode !== 'off' ? 'text-[var(--accent-hover-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} disabled={!song} aria-label="Cycle repeat mode" aria-live="polite">
                      {repeatMode === 'one' ? <RepeatOneIcon className="w-5 h-5" /> : <RepeatIcon className="w-5 h-5" />}
                  </button>
                  </Tooltip>
               </div>

              <div className="flex items-center gap-4">
              <Tooltip label="Previous" hotkey="←">
                <button onClick={onPrev} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 disabled:opacity-50" disabled={!song} aria-label="Previous song">
                  <SkipPreviousIcon className="w-8 h-8" />
                </button>
              </Tooltip>
              <Tooltip label={isPlaying ? 'Pause' : 'Play'} hotkey="Space">
                <button
                  onClick={onPlayPause}
                  className="bg-[var(--accent-color)] text-[var(--accent-text-color)] rounded-full p-3 shadow-lg shadow-[var(--accent-color)]/30 hover:bg-[var(--accent-hover-color)] transition-all duration-200 transform hover:scale-105 disabled:bg-[var(--text-muted)] disabled:shadow-none disabled:scale-100"
                  disabled={!song && !songForVotePrompt}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  aria-pressed={isPlaying}
                >
                  {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                </button>
              </Tooltip>
              <Tooltip label="Next" hotkey="→">
                <button onClick={onNext} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 disabled:opacity-50" disabled={!song} aria-label="Next song">
                  <SkipNextIcon className="w-8 h-8" />
                </button>
              </Tooltip>
              </div>

              <div className="flex items-center gap-4 w-24 justify-start">
                  <Tooltip label="Autoplay" hotkey="A">
                  <button onClick={() => onUpdateSettings({ isAutoplayEnabled: !isAutoplayEnabled })} className={`p-1 transition-colors duration-200 disabled:opacity-50 ${isAutoplayEnabled ? 'text-[var(--accent-hover-color)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} disabled={!song} aria-label="Toggle autoplay" aria-pressed={isAutoplayEnabled}>
                  {isAutoplayEnabled ? <PlayPauseIcon className="w-5 h-5" /> : <PlaySlashIcon className="w-5 h-5" />}
                  </button>
                  </Tooltip>
              </div>
            </div>
            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-[var(--text-secondary)] w-12 text-right">{formatTime(currentTime)}</span>
                <div
                  className="w-full relative py-2 progress-bar-container"
                  onMouseMove={handleProgressHover}
                  onMouseLeave={() => setHoverTime(null)}
                >
                  <ProgressBarHeatmap duration={duration} markers={crowdMarkers} />
                  {hoverTime !== null && (
                    <div className="progress-bar-tooltip" style={{ left: `${hoverPosition}px` }}>
                      {formatTime(hoverTime)}
                    </div>
                  )}
                  <RangeInput 
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleProgressChange}
                      disabled={!song}
                      aria-label="Song progress"
                  />
                </div>
              <span className="text-xs text-[var(--text-secondary)] w-12 text-left">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Other Controls */}
          <div className="w-1/4 flex items-center justify-end gap-3">
            <div className="flex items-center justify-end">
              {volumeControlStyle === 'horizontal' ? (
                <div className="flex items-center gap-2 w-40">
                  <button onClick={toggleMute} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200" aria-label="Mute volume" aria-pressed={isMuted}>
                      <VolumeIcon />
                  </button>
                  <RangeInput
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      aria-label="Volume control"
                  />
                </div>
              ) : (
                  <div className="relative volume-popup-parent">
                      <button onClick={toggleMute} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200" aria-label="Mute volume" aria-pressed={isMuted}>
                          <VolumeIcon />
                      </button>
                      <div className="volume-popup-container">
                      <input
                          type="range"
                          className="volume-slider-vertical"
                          min="0"
                          max="1"
                          step="0.01"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          aria-label="Volume control"
                      />
                      </div>
                  </div>
              )}
            </div>
            <Tooltip label="Collapse Player" hotkey="">
              <button onClick={onCollapse} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200 p-2" aria-label="Collapse player">
                <ChevronDownIcon className="w-6 h-6" />
              </button>
            </Tooltip>
          </div>
        </div>
        {songForVotePrompt && (
          <VotePrompt
            song={songForVotePrompt}
            votes={votes}
            onVote={onVote}
            onClose={() => setSongForVotePrompt(null)}
          />
        )}
      </div>
    </div>
  );
};

export default MusicPlayer;