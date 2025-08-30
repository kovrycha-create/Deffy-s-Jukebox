import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Song, PlayerSettings, VoteData, Comment, CrowdMarker } from '../types';
import { PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon, VolumeUpIcon, VolumeOffIcon, ShuffleIcon, RepeatIcon, RepeatOneIcon, PlayPauseIcon, PlaySlashIcon, ChevronDownIcon, ThumbUpIcon, ThumbDownIcon, ThumbUpFilledIcon, ThumbDownFilledIcon, ChatBubbleIcon, MusicNoteIcon, StarFilledIcon } from './Icons';
import { formatTime as formatTimeUtil } from '../utils/parser';
import AlbumArt from './AlbumArt';
import { getArtFromCache } from '../utils/albumArt';
import Tooltip from './Tooltip';
import Visualizer from './Visualizer';
import FidgetSpinner from './FidgetSpinner';
import { getDominantColor } from '../utils/colorExtractor';
import Comments from './Comments';
import TopMoments from './TopMoments';
import { getTopMoments } from '../utils/social';

interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
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
  spinCount: number;
  onSpinCountChange: (count: number) => void;
  onBlingUnlock: () => void;
  isBlingUnlocked: boolean;
  analyserNode: AnalyserNode | null;
  defaultView: 'lyrics' | 'comments';
  votes: Record<string, VoteData>;
  onVote: (songUrl: string, voteType: 'up' | 'down') => void;
  comments: Comment[];
  onAddComment: (songUrl: string, comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  crowdMarkers: CrowdMarker[];
  onAddCrowdMarker: (songUrl: string, timestamp: number) => void;
  reportedComments: Set<string>;
  onReportComment: (commentId: string) => void;
}

type LyricLine = { time: number; text: string; };
type ActiveView = 'lyrics' | 'comments' | 'moments';


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
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            style={{
                background: `linear-gradient(to right, var(--accent-highlight) ${progressPercentage}%, hsla(0,0%,100%,.2) ${progressPercentage}%)`
            }}
            {...props}
        />
    )
}

const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  isOpen, onClose, song, isPlaying, onPlayPause, onNext, onPrev, audioRef,
  playerSettings, onUpdateSettings, onToggleShuffle, onCycleRepeatMode, artCacheVersion,
  spinCount, onSpinCountChange, onBlingUnlock, isBlingUnlocked, analyserNode, defaultView,
  votes, onVote, comments, onAddComment, crowdMarkers, onAddCrowdMarker,
  reportedComments, onReportComment
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { isShuffled, repeatMode, isAutoplayEnabled, volume, isMuted, playbackRate } = playerSettings;
  
  const [parsedLyrics, setParsedLyrics] = useState<(LyricLine | { text: string })[] | null>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const [bgColor, setBgColor] = useState('rgba(0,0,0,0.4)');
  const [activeView, setActiveView] = useState<ActiveView>(defaultView);
  const [isRatePopoverOpen, setIsRatePopoverOpen] = useState(false);
  const ratePopoverRef = useRef<HTMLDivElement>(null);
  
  const bgImageUrl = song?.coverArtUrl || (song?.url ? getArtFromCache(song.url) : null);
  const songVote = song ? votes[song.url] : undefined;

  const topMoments = useMemo(() => {
      if (song && crowdMarkers && duration > 0) {
          return getTopMoments(crowdMarkers, duration);
      }
      return [];
  }, [crowdMarkers, duration, song]);

  useEffect(() => {
    if (isOpen) {
      setActiveView(defaultView);
    }
  }, [isOpen, defaultView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ratePopoverRef.current && !ratePopoverRef.current.contains(event.target as Node)) {
        setIsRatePopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (bgImageUrl && bgImageUrl !== 'error') {
        getDominantColor(bgImageUrl).then(color => {
            if (color) {
                const colorParts = color.match(/(\d+)/g);
                if (colorParts) {
                    const [r, g, b] = colorParts;
                    setBgColor(`radial-gradient(circle at 70% 30%, rgba(${r},${g},${b},0.6) 0%, rgba(0,0,0,0.4) 70%)`);
                }
            } else {
                setBgColor('rgba(0,0,0,0.4)');
            }
        });
    } else {
        setBgColor('rgba(0,0,0,0.4)');
    }
  }, [bgImageUrl]);
  
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
  
  const handleClose = () => setIsClosing(true);
  const onAnimationEnd = () => {
    if (isClosing) {
      setIsClosing(false);
      onClose();
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && handleClose();
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
      if (!song?.lyrics) {
          setParsedLyrics(null);
          return;
      }
      
      const lines = song.lyrics.trim().split('\n');
      const timestampRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
      
      let hasTimestamps = false;
      const processedLyrics = lines.map(line => {
          const match = line.match(timestampRegex);
          if (match) {
              hasTimestamps = true;
              const minutes = parseInt(match[1], 10);
              const seconds = parseInt(match[2], 10);
              const milliseconds = parseInt(match[3], 10);
              const time = minutes * 60 + seconds + milliseconds / 1000;
              const text = line.replace(timestampRegex, '').trim();
              return { time, text };
          }
          return { text: line };
      }).filter(line => line.text.trim() !== '' || ('time' in line));
      
      if (hasTimestamps) {
          setParsedLyrics(processedLyrics as LyricLine[]);
      } else {
          setParsedLyrics(lines.map(line => ({ text: line || '\u00A0' })));
      }
      setActiveLyricIndex(-1);
  }, [song?.lyrics]);

  useEffect(() => {
      if (!parsedLyrics || parsedLyrics.length === 0 || !('time' in parsedLyrics[0])) {
          return;
      }
      
      const timedLyrics = parsedLyrics as LyricLine[];
      let newIndex = -1;
      for (let i = 0; i < timedLyrics.length; i++) {
          if (currentTime >= timedLyrics[i].time) {
              newIndex = i;
          } else {
              break;
          }
      }
      
      if (newIndex !== activeLyricIndex) {
          setActiveLyricIndex(newIndex);
      }

      if (activeLineRef.current && newIndex > -1) {
        const currentLine = timedLyrics[newIndex];
        const nextLine = timedLyrics[newIndex + 1];
        const lineStartTime = currentLine.time;
        const lineEndTime = nextLine ? nextLine.time : duration;
        const lineDuration = lineEndTime - lineStartTime;
        
        let progress = 0;
        if (lineDuration > 0.1) {
            const progressInLine = (currentTime - lineStartTime) / lineDuration;
            progress = Math.max(0, Math.min(1, progressInLine));
        } else if (currentTime >= lineStartTime) {
            progress = 1;
        }

        activeLineRef.current.style.setProperty('--lyric-progress', `${progress * 100}%`);
      }

  }, [currentTime, parsedLyrics, activeLyricIndex, duration]);

  useEffect(() => {
      if (activeLineRef.current) {
          activeLineRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
          });
      }
  }, [activeLyricIndex]);

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = Number(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    onUpdateSettings({ volume: newVolume, isMuted: newVolume === 0 });
  };
  
  const handleSeek = (time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
    }
  };

  const handleRateChange = (rate: number) => {
    onUpdateSettings({ playbackRate: rate });
    setIsRatePopoverOpen(false);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      onAnimationEnd={onAnimationEnd}
      className={`fixed inset-0 z-50 flex flex-col p-8 text-white bg-[var(--bg-color)] overflow-hidden ${isClosing ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="now-playing-title"
    >
        {bgImageUrl && bgImageUrl !== 'error' && (
            <div className="absolute inset-0 w-full h-full bg-cover bg-center [transform:scale(1.1)]" style={{backgroundImage: `url(${bgImageUrl})`, filter: 'blur(30px) brightness(0.5)'}}></div>
        )}
        <div className="absolute inset-0 transition-all duration-1000" style={{background: bgColor}}></div>
        
        <div className="relative flex-shrink-0 flex items-center justify-between">
             <button onClick={handleClose} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors z-10" aria-label="Close">
                <ChevronDownIcon className="w-8 h-8"/>
            </button>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold uppercase tracking-widest text-white/50">Now Playing</span>
            </div>
        </div>

        <div className="relative flex-grow grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 pb-4 overflow-hidden">
            <div className="md:col-span-1 flex flex-col justify-between items-center gap-4 h-full">
                <div className="w-64 h-64 md:w-full md:max-w-xs aspect-square flex-shrink-0 my-4">
                    <div className={`w-full h-full rounded-lg shadow-2xl shadow-black/50 overflow-hidden transition-transform duration-500 ${isPlaying ? 'now-playing-art playing' : 'now-playing-art'}`}>
                        <AlbumArt song={song} cacheVersion={artCacheVersion} />
                    </div>
                </div>
                 <div className="w-full text-center">
                    <h1 id="now-playing-title" className="text-3xl md:text-4xl font-bold">{song?.title || 'No Song'}</h1>
                    <div className="text-lg md:text-xl mt-2 text-white/70 h-8 flex items-center justify-center gap-4">
                        {(song?.bpm || song?.style) && (
                            <>
                                {song.style && <span>{song.style}</span>}
                                {(song.bpm && song.style) && <span className="opacity-50">•</span>}
                                {song.bpm && <span>{song.bpm} BPM</span>}
                            </>
                        )}
                    </div>
                 </div>
                <div className="w-full flex-1 flex items-center justify-center">
                    <div style={{ transform: 'scale(0.8)' }}>
                        <FidgetSpinner 
                          song={song} 
                          isPlaying={isPlaying}
                          spinCount={spinCount}
                          onSpinCountChange={onSpinCountChange}
                          onBlingUnlock={onBlingUnlock}
                          isBlingUnlocked={isBlingUnlocked}
                        />
                    </div>
                </div>
            </div>

            <div className="md:col-span-2 flex flex-col text-center md:text-left overflow-hidden">
                 <div className="flex-shrink-0">
                    {song && (
                        <div className="mb-4 flex items-center justify-center md:justify-start gap-4 text-white/80">
                            <button onClick={() => onVote(song.url, 'up')} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${songVote?.userVote === 'up' ? 'text-green-400 bg-green-400/10' : 'hover:bg-white/10'}`}>
                                {songVote?.userVote === 'up' ? <ThumbUpFilledIcon className="w-5 h-5"/> : <ThumbUpIcon className="w-5 h-5"/>}
                                <span className="font-semibold">{songVote?.up.length || 0}</span>
                            </button>
                            <button onClick={() => onVote(song.url, 'down')} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${songVote?.userVote === 'down' ? 'text-red-400 bg-red-400/10' : 'hover:bg-white/10'}`}>
                                {songVote?.userVote === 'down' ? <ThumbDownFilledIcon className="w-5 h-5"/> : <ThumbDownIcon className="w-5 h-5"/>}
                                <span className="font-semibold">{songVote?.down.length || 0}</span>
                            </button>
                        </div>
                    )}
                     <div className="border-b border-white/10 flex items-center justify-center md:justify-start">
                        <button onClick={() => setActiveView('lyrics')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${activeView === 'lyrics' ? 'text-white border-b-2 border-[var(--accent-highlight)]' : 'text-white/50 hover:text-white'}`}><MusicNoteIcon className="w-5 h-5" /> Lyrics</button>
                        <button onClick={() => setActiveView('comments')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${activeView === 'comments' ? 'text-white border-b-2 border-[var(--accent-highlight)]' : 'text-white/50 hover:text-white'}`}><ChatBubbleIcon className="w-5 h-5" /> Comments ({comments.length})</button>
                        <button onClick={() => setActiveView('moments')} className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-2 ${activeView === 'moments' ? 'text-white border-b-2 border-[var(--accent-highlight)]' : 'text-white/50 hover:text-white'}`}><StarFilledIcon className="w-5 h-5" /> Top Moments</button>
                    </div>
                </div>
                <div className="flex-grow mt-2 flex flex-col relative overflow-hidden">
                    {activeView === 'lyrics' && (<>
                        {parsedLyrics ? (
                            <div className="lyrics-container w-full h-full overflow-y-auto text-2xl font-semibold text-white/80 leading-relaxed pr-4 text-center md:text-left">
                                {parsedLyrics.map((line, index) => {
                                    const isTimed = 'time' in line;
                                    const isActive = isTimed && index === activeLyricIndex;
                                    const isPast = isTimed && index < activeLyricIndex;

                                    return (
                                        <p 
                                            key={index}
                                            ref={isActive ? activeLineRef : null}
                                            className={`${isActive ? 'active' : ''} ${isPast ? 'past' : ''} ${isTimed ? 'clickable' : ''}`}
                                            onClick={() => isTimed && handleSeek((line as LyricLine).time)}
                                        >
                                            {line.text || '\u00A0'}
                                        </p>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center relative">
                                <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} type={playerSettings.defaultVisualizerStyle} />
                                <p className="absolute bottom-1/4 italic text-white/50">Lyrics not available for this song.</p>
                            </div>
                        )}
                    </>)}
                    {activeView === 'comments' && song && (
                        <div className="w-full h-full p-2">
                            <Comments
                                songUrl={song.url}
                                comments={comments}
                                currentTime={currentTime}
                                onAddComment={onAddComment}
                                onSeek={handleSeek}
                                reportedComments={reportedComments}
                                onReportComment={onReportComment}
                            />
                        </div>
                    )}
                    {activeView === 'moments' && (
                        <div className="w-full h-full p-2 overflow-y-auto">
                            <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                                 <h3 className="text-lg font-bold text-white/90 mb-2">About this track</h3>
                                 <p className="text-sm text-white/70 leading-relaxed">
                                     {song?.description || 'No details available for this song.'}
                                 </p>
                            </div>
                            <TopMoments moments={topMoments} onSeek={handleSeek} />
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="relative flex-shrink-0 flex flex-col items-center gap-2 pt-4">
          <div className="w-full max-w-2xl">
            <div className="w-full flex items-center gap-3">
              <span className="text-xs text-white/70 w-12 text-right">{formatTime(currentTime)}</span>
                  <RangeInput 
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleProgressChange}
                      disabled={!song}
                      aria-label="Song progress"
                  />
              <span className="text-xs text-white/70 w-12 text-left">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Tooltip label="Shuffle" hotkey="S">
                <button onClick={onToggleShuffle} className={`p-2 transition-colors duration-200 disabled:opacity-30 ${isShuffled ? 'text-[var(--accent-highlight)]' : 'text-white/70 hover:text-white'}`} disabled={!song} aria-label="Toggle shuffle" aria-pressed={isShuffled}>
                  <ShuffleIcon className="w-6 h-6" />
                </button>
            </Tooltip>
            <Tooltip label="Previous" hotkey="←">
              <button onClick={onPrev} className="p-2 text-white/70 hover:text-white transition-colors duration-200 disabled:opacity-30" disabled={!song} aria-label="Previous song">
                <SkipPreviousIcon className="w-8 h-8" />
              </button>
            </Tooltip>
            <Tooltip label={isPlaying ? 'Pause' : 'Play'} hotkey="Space">
              <button
                onClick={onPlayPause}
                className="bg-white text-black rounded-full p-4 shadow-lg hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:shadow-none disabled:scale-100"
                disabled={!song}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10" />}
              </button>
            </Tooltip>
            <Tooltip label="Next" hotkey="→">
              <button onClick={onNext} className="p-2 text-white/70 hover:text-white transition-colors duration-200 disabled:opacity-30" disabled={!song} aria-label="Next song">
                <SkipNextIcon className="w-8 h-8" />
              </button>
            </Tooltip>
            <Tooltip label="Repeat" hotkey="R">
              <button onClick={onCycleRepeatMode} className={`p-2 transition-colors duration-200 disabled:opacity-30 ${repeatMode !== 'off' ? 'text-[var(--accent-highlight)]' : 'text-white/70 hover:text-white'}`} disabled={!song} aria-label="Cycle repeat mode" aria-live="polite">
                {repeatMode === 'one' ? <RepeatOneIcon className="w-6 h-6" /> : <RepeatIcon className="w-6 h-6" />}
              </button>
            </Tooltip>
          </div>
          <div className="absolute left-0 bottom-0 flex items-center gap-2">
            <div className="relative" ref={ratePopoverRef}>
                 <button 
                    onClick={() => setIsRatePopoverOpen(prev => !prev)}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors tabular-nums ${isRatePopoverOpen ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                 >
                    {playbackRate.toFixed(2)}x
                 </button>
                 {isRatePopoverOpen && (
                    <div className="playback-rate-popover animate-fade-in-sm">
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                            <button
                                key={rate}
                                onClick={() => handleRateChange(rate)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md w-full text-left ${playbackRate === rate ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-white/10 text-white/80'}`}
                            >
                                {rate.toFixed(2)}x
                            </button>
                        ))}
                    </div>
                 )}
            </div>
          </div>
          <div className="absolute right-0 bottom-0 flex items-center justify-end gap-3">
            <Tooltip label="Autoplay" hotkey="A">
                <button onClick={() => onUpdateSettings({ isAutoplayEnabled: !isAutoplayEnabled })} className={`transition-colors duration-200 disabled:opacity-50 ${isAutoplayEnabled ? 'text-[var(--accent-highlight)]' : 'text-white/70 hover:text-white'}`} disabled={!song} aria-label="Toggle autoplay" aria-pressed={isAutoplayEnabled}>
                    {isAutoplayEnabled ? <PlayPauseIcon className="w-5 h-5" /> : <PlaySlashIcon className="w-5 h-5" />}
                </button>
            </Tooltip>
            <Tooltip label="Mute" hotkey="M">
                <button onClick={() => onUpdateSettings({isMuted: !isMuted})} className="text-white/70 hover:text-white transition-colors duration-200" aria-label="Mute volume" aria-pressed={isMuted}>
                  {isMuted || volume === 0 ? <VolumeOffIcon className="w-5 h-5" /> : <VolumeUpIcon className="w-5 h-5" />}
                </button>
            </Tooltip>
            <div className="w-24">
               <RangeInput 
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  aria-label="Volume control"
              />
            </div>
          </div>
        </div>
    </div>
  );
};

export default NowPlayingView;