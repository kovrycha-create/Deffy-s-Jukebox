



import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { Song, RepeatMode, SortMode, PlayerSettings, UserPlaylist, VoteData, Comment, PlaybackStat, CrowdMarker, PlayRecord, SocialEvent, SocialEventType } from './types';
import { playlistsData, FEATURED_TAB } from './data';
import { parsePlaylist } from './utils/parser';
import { getFavorites, toggleFavorite, getDurationCache, saveDurationCache, getUpNextQueue, saveUpNextQueue, getPlayCounts, savePlayCounts, resetPlayCounts, getRecentlyPlayed, addRecentlyPlayed } from './utils/favorites';
import { getSettings, saveSettings, EQ_BANDS } from './utils/settings';
import { getUserPlaylists, saveUserPlaylists } from './utils/userPlaylists';
import { getVotes, getComments, handleVote as updateVote, addComment as addNewComment, getAllCrowdMarkers, addCrowdMarker, getReportedComments, reportComment } from './utils/social';
import { getUnlockState, saveUnlockState, getSpinCount, saveSpinCount } from './utils/unlocks';
import { hasSeenTutorial, setHasSeenTutorial } from './utils/tutorial';
import { getPlaybackStats, savePlaybackStats } from './utils/playbackStats';
import { getPlayHistory, addPlayHistory } from './utils/playHistory';
import { getSocialEvents, logSocialEvent } from './utils/events';
import { updateLiveListeners, getLiveListeners } from './utils/liveListeners';
// FIX: Import getArtFromCache and getDominantColor to resolve missing prop error for MusicPlayer.
import { getArtFromCache } from './utils/albumArt';
import { getDominantColor } from './utils/colorExtractor';
import Playlist from './components/Playlist';
import MusicPlayer from './components/MusicPlayer';
import MiniPlayer from './components/MiniPlayer';
import NowPlayingBar from './components/NowPlayingBar';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import SharedSongModal from './components/SharedSongModal';
import NowPlayingView from './components/NowPlayingView';
import SongActionsMenu from './components/SongActionsMenu';
import PlaylistActionsMenu from './components/PlaylistActionsMenu';
import Toast from './components/Toast';
import PlaylistDetailsModal from './components/PlaylistDetailsModal';
import SettingsModal from './components/SettingsModal';
import MultiSelectActions from './components/MultiSelectActions';
import Tutorial from './components/Tutorial';
import AiMixGenerator from './components/AiMixGenerator';
import AlbumArtGenerator from './components/AlbumArtGenerator';
import MetadataGenerator from './components/MetadataGenerator';
import SongStatsModal from './components/SongStatsModal';
import { CloseIcon, TrashIcon, PaletteIcon, MusicNoteIcon, SparklesIcon, FireIcon, StarIcon, UsersIcon } from './components/Icons';

const FAVORITES_TAB = 'Favorites';
const TOP_PLAYED_TAB = 'Top 25 Played';
const RECENTLY_PLAYED_TAB = 'Recently Played';
const HIGHEST_RATED_TAB = 'Highest Rated';
const MOST_POPULAR_TAB = 'Most Popular';
const NOW_PLAYING_TAB = 'Now Playing';
type OriginalTopTab = keyof typeof playlistsData;
type TopTab = OriginalTopTab | typeof FAVORITES_TAB | typeof TOP_PLAYED_TAB | typeof RECENTLY_PLAYED_TAB | typeof HIGHEST_RATED_TAB | typeof MOST_POPULAR_TAB | typeof NOW_PLAYING_TAB;
type SubTabs<T extends OriginalTopTab> = keyof (typeof playlistsData)[T];

type SongContextMenuData = { x: number; y: number; songs: Song[] };
type PlaylistContextMenuData = { x: number; y: number; playlist: UserPlaylist };
type ToastData = { id: number; message: string; className?: string };
type PlaylistModalState = { mode: 'create' } | { mode: 'edit', playlist: UserPlaylist } | null;

const ALL_THEME_NAMES: { [key: string]: string } = {
  auto: "Auto Vibe",
  bling: "𝔅ling",
  slate: "Slate (Default)",
  obsidian: "Obsidian",
  'defty-sings': "Deffy's Stage",
  suno: "Sunset",
  'luna-aether': "Luna's Glam",
  jext: "JexT's Edge",
  favorites: "Favorites",
  'poprock': "Poprock",
  'lava-burst': "Lava Burst",
  'synthwave-grid': "Synthwave Grid",
};

const THEME_ORDER = ['auto', 'bling', 'slate', 'obsidian', 'defty-sings', 'suno', 'luna-aether', 'jext', 'favorites', 'poprock', 'lava-burst', 'synthwave-grid'];

const isOriginalTopTab = (tab: string): tab is OriginalTopTab => tab in playlistsData;

const tutorialSteps = [
    {
      title: "Welcome to Deffy's Jukebox!",
      content: "This short tour will guide you through the key features of the app. You can skip at any time or replay it later.",
      position: 'center',
    },
    {
      selector: '[data-tutorial-id="sidebar"]',
      title: 'Your Music Hub',
      content: 'This sidebar is your command center. Browse curated playlists, access your favorites, manage your own custom playlists, and see what song is up next in the queue.',
      position: 'right',
    },
    {
      selector: '[data-tutorial-id="playlist-view"]',
      title: 'The Playlist',
      content: 'Songs from your selected playlist appear here. Click a song to play it, or right-click for more actions like adding to queue or favorites. You can also sort and filter your view.',
      position: 'top',
    },
    {
      selector: '[data-tutorial-id="player"]',
      title: 'Playback Controls',
      content: "All your main controls are here. Play, pause, skip tracks, and manage shuffle and repeat modes. There are also keyboard shortcuts for power users!",
      position: 'top',
    },
    {
      selector: '[data-tutorial-id="now-playing-trigger"]',
      title: 'Now Playing View',
      content: "Click the currently playing song's info to open a fullscreen 'Now Playing' view with lyrics, an audio visualizer, and other fun features.",
      position: 'top',
    },
    {
      selector: '[data-tutorial-id="header-actions"]',
      title: "That's Everything!",
      content: "You can tweak your experience in Settings, or replay this tour anytime using the question mark button. Enjoy the music!",
      position: 'bottom',
    }
] as const;


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(Object.keys(playlistsData)[0]);
  
  const initialSubTabs = Object.keys( playlistsData ).reduce( ( acc, topTab ) => {
    acc[topTab as OriginalTopTab] = Object.keys(playlistsData[topTab as OriginalTopTab])[0] as SubTabs<OriginalTopTab>;
    return acc;
  }, {} as { [K in OriginalTopTab]: SubTabs<K> } );

  const [activeSubTabs, setActiveSubTabs] = useState(initialSubTabs);
  const [favorites, setFavorites] = useState<Set<string>>(() => getFavorites());
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>(() => getUserPlaylists());
  
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [songDurations, setSongDurations] = useState<Record<string, number>>(getDurationCache);
  const [userThemeSelection, setUserThemeSelection] = useState('auto');
  const [activeTheme, setActiveTheme] = useState('slate');
  
  // Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [styleFilter, setStyleFilter] = useState<string[]>([]);
  const [bpmFilter, setBpmFilter] = useState<[number, number]>([0, 250]);

  const [sortMode, setSortMode] = useState<SortMode>('default');
  const [upNextQueue, setUpNextQueue] = useState<Song[]>(getUpNextQueue);
  const [mainPlaylist, setMainPlaylist] = useState<Song[]>([]);
  
  const [playlistModalState, setPlaylistModalState] = useState<PlaylistModalState>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumArtGeneratorOpen, setIsAlbumArtGeneratorOpen] = useState(false);
  const [isMetadataGeneratorOpen, setIsMetadataGeneratorOpen] = useState(false);
  const [artCacheVersion, setArtCacheVersion] = useState(0);

  const [sharedSong, setSharedSong] = useState<Song | null>(null);
  const [sharedSongStartTime, setSharedSongStartTime] = useState<number | null>(null);
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [nowPlayingDefaultView, setNowPlayingDefaultView] = useState<'lyrics' | 'comments'>('lyrics');

  const [songContextMenu, setSongContextMenu] = useState<SongContextMenuData | null>(null);
  const [playlistContextMenu, setPlaylistContextMenu] = useState<PlaylistContextMenuData | null>(null);
  const [playlistToDelete, setPlaylistToDelete] = useState<UserPlaylist | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [playerSettings, setPlayerSettings] = useState<PlayerSettings>(getSettings);
  const { repeatMode, isShuffled, isAutoplayEnabled, volume, isMuted, viewMode, crossfadeEnabled, crossfadeDuration, reduceMotion } = playerSettings;
  
  const [draggedSongs, setDraggedSongs] = useState<Song[] | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dragLeaveTimeoutRef = useRef<number | null>(null);

  const [animateFavorites, setAnimateFavorites] = useState(false);
  const prevFavoritesCount = useRef(favorites.size);
  const [featuredSparkleKey, setFeaturedSparkleKey] = useState(0);
  
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const fadeIntervalRef = useRef<number | null>(null);
  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => getPlayCounts());
  const [recentlyPlayedUrls, setRecentlyPlayedUrls] = useState<string[]>(() => getRecentlyPlayed());

  const [selectedSongUrls, setSelectedSongUrls] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);

  const draggedPlaylistId = useRef<string | null>(null);
  const dragOverPlaylistId = useRef<string | null>(null);

  // Social & Stats Features State
  const [votes, setVotes] = useState<Record<string, VoteData>>(() => getVotes());
  const [comments, setComments] = useState<Record<string, Comment[]>>(() => getComments());
  const [playbackStats, setPlaybackStats] = useState<Record<string, PlaybackStat>>(() => getPlaybackStats());
  const [crowdMarkers, setCrowdMarkers] = useState<Record<string, CrowdMarker[]>>(() => getAllCrowdMarkers());
  const [songForStats, setSongForStats] = useState<Song | null>(null);
  const [songForVotePrompt, setSongForVotePrompt] = useState<Song | null>(null);
  const sessionStatsRef = useRef({ url: '', timePlayed: 0, lastTime: 0 });
  const [highestRatedTimeFilter, setHighestRatedTimeFilter] = useState('All-Time');
  const [reportedComments, setReportedComments] = useState<Set<string>>(() => getReportedComments());
  const [playHistory, setPlayHistory] = useState<PlayRecord[]>(() => getPlayHistory());
  const [socialEvents, setSocialEvents] = useState<SocialEvent[]>(() => getSocialEvents());
  const [lastFinishedSong, setLastFinishedSong] = useState<{ url: string; timestamp: number } | null>(null);
  const [liveListeners, setLiveListeners] = useState<Record<string, number>>(() => getLiveListeners());
  // FIX: Add state for player glow color.
  const [playerGlowColor, setPlayerGlowColor] = useState<string | null>(null);

  // AI Mix Generator State
  const [isAiMixOpen, setIsAiMixOpen] = useState(false);

  // Unlockables state
  const [unlocks, setUnlocks] = useState(() => getUnlockState());
  const [spinCount, setSpinCount] = useState(() => getSpinCount());
  
  // Tutorial State
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Draggable Confirmation Modal State
  const confirmModalRef = useRef<HTMLDivElement>(null);
  const confirmModalHeaderRef = useRef<HTMLDivElement>(null);
  const [confirmModalPosition, setConfirmModalPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingConfirmModal = useRef(false);
  const dragConfirmModalOffset = useRef({ x: 0, y: 0 });
  
  // Audio Graph Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const preampNodeRef = useRef<GainNode | null>(null);
  const eqNodesRef = useRef<BiquadFilterNode[]>([]);
  const isAudioGraphSetup = useRef(false);
  
  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      // Adding the 'loaded' class triggers the fade-out animation.
      // We can do this as soon as React hydrates. A small timeout can sometimes smooth it out.
      const timer = setTimeout(() => {
        preloader.classList.add('loaded');
      }, 100);

      // Optional: completely remove the preloader from the DOM after the transition.
      const transitionEndHandler = () => {
        preloader.remove();
      };
      preloader.addEventListener('transitionend', transitionEndHandler);

      return () => {
        clearTimeout(timer);
        preloader.removeEventListener('transitionend', transitionEndHandler);
      };
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth <= 768;
        setIsMobile(mobile);
        if (!mobile) {
            setIsSidebarOpen(false); // Close sidebar when switching to desktop
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
  
  const setupAudioGraph = useCallback(() => {
    if (isAudioGraphSetup.current || !audioRef.current) return;
    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = context.createMediaElementSource(audioRef.current);
        const analyser = context.createAnalyser();
        analyser.fftSize = 128;

        const preamp = context.createGain();

        const eqNodes = EQ_BANDS.map(frequency => {
            const filter = context.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = frequency;
            filter.Q.value = 1.41;
            filter.gain.value = 0;
            return filter;
        });

        source.connect(preamp);
        eqNodes.reduce((prev, curr) => {
            prev.connect(curr);
            return curr;
        }, preamp).connect(analyser);
        analyser.connect(context.destination);

        audioContextRef.current = context;
        sourceNodeRef.current = source;
        analyserNodeRef.current = analyser;
        preampNodeRef.current = preamp;
        eqNodesRef.current = eqNodes;
        isAudioGraphSetup.current = true;
    } catch (e) {
        console.error("Failed to setup audio graph", e);
    }
  }, []);

  useEffect(() => {
    if (!isAudioGraphSetup.current || !preampNodeRef.current || eqNodesRef.current.length === 0) return;

    const { enabled, preamp, bands } = playerSettings.equalizer;

    preampNodeRef.current.gain.value = Math.pow(10, preamp / 20);

    eqNodesRef.current.forEach((node, i) => {
        node.gain.value = enabled ? bands[i] : 0;
    });
  }, [playerSettings.equalizer]);

  useEffect(() => {
    if (playlistToDelete && confirmModalRef.current && confirmModalPosition === null) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = confirmModalRef.current;
      setConfirmModalPosition({
        x: (innerWidth - offsetWidth) / 2,
        y: (innerHeight - offsetHeight) / 2,
      });
    } else if (!playlistToDelete) {
        setConfirmModalPosition(null);
    }
  }, [playlistToDelete, confirmModalPosition]);

  const handleConfirmModalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingConfirmModal.current) return;
    const newX = e.clientX - dragConfirmModalOffset.current.x;
    const newY = e.clientY - dragConfirmModalOffset.current.y;
    setConfirmModalPosition({ x: newX, y: newY });
  }, []);

  const handleConfirmModalMouseUp = useCallback(() => {
    isDraggingConfirmModal.current = false;
    confirmModalHeaderRef.current?.classList.remove('grabbing');
    document.removeEventListener('mousemove', handleConfirmModalMouseMove);
    document.removeEventListener('mouseup', handleConfirmModalMouseUp);
  }, [handleConfirmModalMouseMove]);
  
  const handleConfirmModalMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!confirmModalRef.current) return;
    isDraggingConfirmModal.current = true;
    const modalRect = confirmModalRef.current.getBoundingClientRect();
    dragConfirmModalOffset.current = {
      x: e.clientX - modalRect.left,
      y: e.clientY - modalRect.top,
    };
    confirmModalHeaderRef.current?.classList.add('grabbing');
    document.addEventListener('mousemove', handleConfirmModalMouseMove);
    document.addEventListener('mouseup', handleConfirmModalMouseUp);
  }, [handleConfirmModalMouseMove, handleConfirmModalMouseUp]);


  useEffect(() => {
    if (!hasSeenTutorial()) {
      setIsTutorialActive(true);
    }
  }, []);

  const handleStartTutorial = () => {
    setIsTutorialActive(true);
    setTutorialStep(0);
  };

  const handleNextStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(s => s + 1);
    } else {
      handleCloseTutorial();
    }
  };

  const handlePrevStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(s => s - 1);
    }
  };

  const handleCloseTutorial = () => {
    setIsTutorialActive(false);
    setTutorialStep(0);
    setHasSeenTutorial();
  };

  const handleOpenNowPlaying = useCallback((defaultView: 'lyrics' | 'comments' = 'lyrics') => {
      setNowPlayingDefaultView(defaultView);
      setIsNowPlayingOpen(true);
  }, []);

  useEffect(() => {
    if (favorites.size > prevFavoritesCount.current) {
        setAnimateFavorites(true);
    }
    prevFavoritesCount.current = favorites.size;
  }, [favorites]);

  useEffect(() => {
      const sparkle = () => setFeaturedSparkleKey(k => k + 1);
      
      sparkle(); // Initial sparkle

      const timeouts: ReturnType<typeof setTimeout>[] = [];
      timeouts.push(setTimeout(sparkle, 1 * 60 * 1000));
      timeouts.push(setTimeout(sparkle, (1 + 3) * 60 * 1000));
      timeouts.push(setTimeout(sparkle, (1 + 3 + 5) * 60 * 1000));
      
      let interval: ReturnType<typeof setTimeout>;
      const intervalTimeout = setTimeout(() => {
          const scheduleNextRandom = () => {
              const randomDelay = (4 + Math.random() * 2) * 60 * 1000; // 4 to 6 minutes
              sparkle();
              interval = setTimeout(scheduleNextRandom, randomDelay);
              timeouts.push(interval);
          };
          scheduleNextRandom();
      }, (1 + 3 + 5) * 60 * 1000);
      timeouts.push(intervalTimeout);

      return () => {
          timeouts.forEach(clearTimeout);
      };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSongUrls(new Set());
    setLastSelectedIndex(null);
  }, []);

  const updatePlayerSettings = useCallback((newSettings: Partial<PlayerSettings>) => {
    setPlayerSettings(prev => {
        const updated = { ...prev, ...newSettings };
        saveSettings(updated);
        return updated;
    });
  }, []);

  const addToast = useCallback((message: string, className?: string) => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-4), { id, message, className }]); // Keep max 5 toasts
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const handleBlingUnlock = useCallback(() => {
       if (unlocks.bling) return; // Already unlocked

       const newUnlocks = { ...unlocks, bling: true };
       setUnlocks(newUnlocks);
       saveUnlockState(newUnlocks);
       addToast("✨ New Theme Unlocked: 𝔅ling! ✨", "toast-bling");
   }, [unlocks, addToast]);
   
  const structuredThemes = useMemo(() => {
    return THEME_ORDER.map(key => ({
      key,
      name: ALL_THEME_NAMES[key],
      locked: key === 'bling' && !unlocks.bling,
    }));
  }, [unlocks.bling]);

  const handleArtGenerated = () => setArtCacheVersion(v => v + 1);
  
  const handleClearArtCache = () => {
    localStorage.removeItem('deffy-jukebox-album-art');
    handleArtGenerated(); // Force re-render of album art components
    addToast("Album art cache cleared!");
  };

  const handleExportData = () => {
    const data = {
        favorites: Array.from(favorites),
        userPlaylists,
        settings: playerSettings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deffys-jukebox-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("User data exported!");
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target?.result as string);
            if (data.favorites && Array.isArray(data.favorites)) {
                setFavorites(new Set(data.favorites));
                localStorage.setItem('deffy-jukebox-favorites', JSON.stringify(data.favorites));
            }
            if (data.userPlaylists && Array.isArray(data.userPlaylists)) {
                setUserPlaylists(data.userPlaylists);
                saveUserPlaylists(data.userPlaylists);
            }
            if (data.settings) {
                updatePlayerSettings(data.settings);
            }
            addToast("Data imported successfully!");
        } catch (err) {
            console.error("Failed to import data:", err);
            addToast("Error: Invalid backup file.");
        }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  useEffect(() => {
    saveUpNextQueue(upNextQueue);
  }, [upNextQueue]);
  
  useEffect(() => {
    savePlayCounts(playCounts);
  }, [playCounts]);
  
  useEffect(() => {
    savePlaybackStats(playbackStats);
  }, [playbackStats]);


  const activeSubTab = isOriginalTopTab(activeTab) ? activeSubTabs[activeTab] : null;

  useEffect(() => {
    if (userThemeSelection !== 'auto') {
        setActiveTheme(userThemeSelection);
        return;
    }

    // Auto Vibe Logic
    let autoTheme = 'obsidian'; // default
    const userPlaylist = userPlaylists.find(p => p.id === activeTab);
    if (userPlaylist) {
        autoTheme = 'obsidian';
    } else if (activeTab === FEATURED_TAB) {
        autoTheme = 'featured';
    } else if (activeTab === FAVORITES_TAB) {
        autoTheme = 'favorites';
    } else if (activeTab === 'Suno') {
        autoTheme = 'suno';
    } else if (activeTab === 'Luna Æther') {
        autoTheme = 'luna-aether';
    } else if (activeTab === 'LxJ') {
        autoTheme = 'synthwave-grid';
    } else if (activeTab === 'JexT') {
        switch (activeSubTab) {
            case 'I: REALLY HIM.exe': autoTheme = 'jext-1'; break;
            case 'II: Read Receipts': autoTheme = 'jext-2'; break;
            case 'III: Machine Heart': autoTheme = 'jext-3'; break;
            case 'IV: Soft Reboot': autoTheme = 'jext-4'; break;
            default: autoTheme = 'jext';
        }
    } else if (activeTab === 'Ðeffy Sings~') {
        autoTheme = 'defty-sings';
    } else {
        autoTheme = 'slate';
    }
    setActiveTheme(autoTheme);
  }, [activeTab, activeSubTab, userThemeSelection, userPlaylists]);

  const allUniqueSongs = useMemo(() => {
    return parsePlaylist('', true, true); // Use parser to get all songs
  }, []);
  
  const allSongsByUrl = useMemo(() => {
    return new Map(allUniqueSongs.map(s => [s.url, s]));
  }, [allUniqueSongs]);

  useEffect(() => {
    if (allUniqueSongs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const songUrl = params.get('song');
    if (songUrl) {
      const songToPlay = allUniqueSongs.find(s => s.url === songUrl);
      if (songToPlay) {
        setSharedSong(songToPlay);
        const startTime = params.get('t');
        if (startTime) {
            const time = parseInt(startTime, 10);
            if (!isNaN(time) && time > 0) {
                setSharedSongStartTime(time);
            }
        }
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [allUniqueSongs]);

  useEffect(() => {
    const allUrls = allUniqueSongs.map(s => s.url);
    if (allUrls.length === 0) return;

    const intervalId = setInterval(() => {
        setLiveListeners(prev => updateLiveListeners(allUrls, prev));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId);
  }, [allUniqueSongs]);

  // FIX: Add effect for player glow color.
  useEffect(() => {
    const fetchColor = async () => {
      if (currentSong) {
        const artUrl = currentSong.coverArtUrl || getArtFromCache(currentSong.url);
        if (artUrl && artUrl !== 'error') {
          const color = await getDominantColor(artUrl);
          setPlayerGlowColor(color);
        } else {
          setPlayerGlowColor(null);
        }
      } else {
        setPlayerGlowColor(null);
      }
    };
    fetchColor();
  }, [currentSong]);

  const logEvent = useCallback((type: SocialEventType, url: string) => {
    logSocialEvent(type, url);
    setSocialEvents(getSocialEvents());
  }, []);

  const songScores = useMemo(() => {
    const scores: Record<string, number> = {};
    const now = Date.now();
    const DECAY_RATE = 0.05; // half-life of ~14 days

    const weights: Record<SocialEventType, number> = {
        play: 1,
        finish: 3,
        replay: 5,
        save_favorite: 10,
        save_playlist: 8,
    };

    socialEvents.forEach(event => {
        const ageInDays = (now - event.timestamp) / (1000 * 60 * 60 * 24);
        const weight = weights[event.type] || 0;
        const decayFactor = Math.exp(-DECAY_RATE * ageInDays);
        const scoreIncrement = weight * decayFactor;

        if (!scores[event.url]) {
            scores[event.url] = 0;
        }
        scores[event.url] += scoreIncrement;
    });

    return scores;
  }, [socialEvents]);

  const sourcePlaylist = useMemo(() => {
    const getSongsFromUrls = (urls: string[]) => urls
        .map(url => allSongsByUrl.get(url))
        .filter((song): song is Song => !!song)
        .map(song => ({ ...song, isFavorite: favorites.has(song.url) }));

    if (activeTab === FAVORITES_TAB) {
        return allUniqueSongs
            .filter(song => favorites.has(song.url))
            .map(song => ({ ...song, isFavorite: true }));
    }
    if (activeTab === RECENTLY_PLAYED_TAB) {
        return getSongsFromUrls(recentlyPlayedUrls);
    }
    if (activeTab === TOP_PLAYED_TAB) {
        const topSongs = Object.entries(playCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 25)
            .map(([url]) => url);
        return getSongsFromUrls(topSongs);
    }
    if (activeTab === HIGHEST_RATED_TAB) {
        const now = Date.now();
        let startTime = 0;
        if (highestRatedTimeFilter === 'This Week') {
            startTime = now - 7 * 24 * 60 * 60 * 1000;
        } else if (highestRatedTimeFilter === 'Today') {
            startTime = now - 24 * 60 * 60 * 1000;
        }
        
        return allUniqueSongs
            .map(song => {
                const songVotes = votes[song.url] || { up: [], down: [] };
                const upVotes = songVotes.up.filter(ts => ts >= startTime).length;
                const downVotes = songVotes.down.filter(ts => ts >= startTime).length;
                return {
                    ...song,
                    score: upVotes - downVotes,
                    voteCount: upVotes + downVotes
                };
            })
            .filter(song => (song.voteCount ?? 0) >= 3)
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    if (activeTab === MOST_POPULAR_TAB) {
        return allUniqueSongs
            .map(song => ({
                ...song,
                score: songScores[song.url] || 0
            }))
            .filter(song => (song.score ?? 0) > 0.1) // Don't show songs with negligible scores
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    if (activeTab === NOW_PLAYING_TAB) {
        return allUniqueSongs
            .map(song => ({
                ...song,
                listeners: liveListeners[song.url] || 0,
            }))
            .filter(song => (song.listeners ?? 0) > 0)
            .sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0));
    }
    
    const userPlaylist = userPlaylists.find(p => p.id === activeTab);
    if (userPlaylist) {
        return getSongsFromUrls(userPlaylist.songUrls);
    }
    
    if (isOriginalTopTab(activeTab) && activeSubTab) {
        const data = (playlistsData[activeTab] as Record<string, string>)[activeSubTab];
        const isSpecial = activeTab === 'Ðeffy Sings~' && activeSubTab === 'Classics';
        return parsePlaylist(data, isSpecial);
    }

    return [];
  }, [activeTab, activeSubTab, favorites, allUniqueSongs, allSongsByUrl, userPlaylists, recentlyPlayedUrls, playCounts, votes, highestRatedTimeFilter, songScores, liveListeners]);

  const filteredPlaylist = useMemo(() => {
    return sourcePlaylist.filter(song => {
      const titleMatch = song.title.toLowerCase().includes(searchQuery.toLowerCase());
      const styleMatch = styleFilter.length === 0 || (song.style && styleFilter.includes(song.style));
      const bpmMatch = !song.bpm || (song.bpm >= bpmFilter[0] && song.bpm <= bpmFilter[1]);
      return titleMatch && styleMatch && bpmMatch;
    });
  }, [sourcePlaylist, searchQuery, styleFilter, bpmFilter]);

  const sortedPlaylist = useMemo(() => {
    if (sortMode === 'default' && activeTab !== TOP_PLAYED_TAB && activeTab !== HIGHEST_RATED_TAB) return filteredPlaylist;
    const playlistToSort = [...filteredPlaylist];
    switch(sortMode) {
      case 'title-asc':
        return playlistToSort.sort((a, b) => a.title.localeCompare(b.title));
      case 'title-desc':
        return playlistToSort.sort((a, b) => b.title.localeCompare(a.title));
      case 'duration-asc':
        return playlistToSort.sort((a, b) => (a.duration ?? Infinity) - (b.duration ?? Infinity));
      case 'duration-desc':
        return playlistToSort.sort((a, b) => (b.duration ?? Infinity) - (a.duration ?? Infinity));
      case 'bpm-asc':
        return playlistToSort.sort((a, b) => (a.bpm ?? Infinity) - (b.bpm ?? Infinity));
      case 'bpm-desc':
        return playlistToSort.sort((a, b) => (b.bpm ?? -Infinity) - (a.bpm ?? -Infinity));
      case 'style-asc':
        return playlistToSort.sort((a, b) => (a.style ?? '\uffff').localeCompare(b.style ?? '\uffff'));
      case 'style-desc':
        return playlistToSort.sort((a, b) => (b.style ?? '\uffff').localeCompare(a.style ?? '\uffff'));
      case 'play-count-asc':
        return playlistToSort.sort((a, b) => (playCounts[a.url] || 0) - (playCounts[b.url] || 0));
      case 'play-count-desc':
        return playlistToSort.sort((a, b) => (playCounts[b.url] || 0) - (a.playCount || 0));
      case 'rating-desc':
        return playlistToSort.sort((a, b) => ((votes[b.url]?.up.length || 0) - (votes[b.url]?.down.length || 0)) - ((votes[a.url]?.up.length || 0) - (votes[a.url]?.down.length || 0)));
      default:
        return filteredPlaylist;
    }
  }, [filteredPlaylist, sortMode, playCounts, activeTab, votes]);
  
  useEffect(() => {
    const playlist = [...sortedPlaylist];
    if (isShuffled) {
      for (let i = playlist.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlist[i], playlist[j]] = [playlist[j], playlist[i]];
      }
    }
    setMainPlaylist(playlist);
  }, [sortedPlaylist, isShuffled]);

  // Audio Volume & Crossfade Logic
  const setAudioVolume = useCallback((targetVolume: number, duration: number = 0) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    if (duration === 0) {
      audio.volume = targetVolume;
      return;
    }

    const startVolume = audio.volume;
    const step = (targetVolume - startVolume) / (duration / 50);

    fadeIntervalRef.current = window.setInterval(() => {
      const newVolume = audio.volume + step;
      if ((step > 0 && newVolume >= targetVolume) || (step < 0 && newVolume <= targetVolume)) {
        audio.volume = targetVolume;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      } else {
        audio.volume = newVolume;
      }
    }, 50);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const targetVolume = isMuted ? 0 : volume;
    setAudioVolume(targetVolume, 200);
  }, [volume, isMuted, setAudioVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !crossfadeEnabled || !isPlaying) return;

    const handleTimeUpdate = () => {
        const timeLeft = audio.duration - audio.currentTime;
        if (isFinite(audio.duration) && timeLeft <= crossfadeDuration) {
            const fadeProgress = Math.max(0, timeLeft / crossfadeDuration);
            audio.volume = (isMuted ? 0 : volume) * fadeProgress;
        }
    };
    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [crossfadeEnabled, crossfadeDuration, isPlaying, volume, isMuted]);
  
  const handleIncrementPlayCount = useCallback((songUrl: string) => {
    setPlayCounts(prev => ({
        ...prev,
        [songUrl]: (prev[songUrl] || 0) + 1
    }));
    setPlayHistory(addPlayHistory(songUrl));
  }, []);
  
  const flushSessionStats = useCallback(() => {
    const { url, timePlayed } = sessionStatsRef.current;
    if (url && timePlayed > 0) {
        setPlaybackStats(prev => {
            const existing = prev[url] || { totalTimePlayed: 0, completions: 0 };
            return {
                ...prev,
                [url]: { ...existing, totalTimePlayed: existing.totalTimePlayed + timePlayed }
            };
        });
    }
    sessionStatsRef.current = { url: '', timePlayed: 0, lastTime: 0 };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const handleTimeUpdate = () => {
        if (audio && !audio.paused && sessionStatsRef.current.url === currentSong?.url) {
            const currentTime = audio.currentTime;
            const lastTime = sessionStatsRef.current.lastTime;
            const diff = currentTime - lastTime;
            if (diff > 0 && diff < 2) { // diff < 2 to handle seeking
                sessionStatsRef.current.timePlayed += diff;
            }
            sessionStatsRef.current.lastTime = currentTime;
        }
    }
    audio?.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio?.removeEventListener('timeupdate', handleTimeUpdate);
  }, [currentSong?.url]);

  useEffect(() => {
      // Flush stats on component unmount
      return () => {
          flushSessionStats();
      };
  }, [flushSessionStats]);

  const playSong = useCallback((song: Song | null, isAutoPlayNext: boolean = false) => {
    flushSessionStats();
    setSongForVotePrompt(null);
    if (song) {
        if (song.url !== currentSong?.url) {
          handleIncrementPlayCount(song.url);
          setRecentlyPlayedUrls(addRecentlyPlayed(song.url));

          if (lastFinishedSong && lastFinishedSong.url === song.url && Date.now() - lastFinishedSong.timestamp < 120000) { // 2 minute window for replay
              logEvent('replay', song.url);
          } else {
              logEvent('play', song.url);
          }
        }
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
    
    setCurrentSong(song);
    const audio = audioRef.current;

    if (song && audio) {
      sessionStatsRef.current = { url: song.url, timePlayed: 0, lastTime: 0 };
      if (!isAudioGraphSetup.current) {
        setupAudioGraph();
      }
      setIsPlaying(true);
      audio.src = song.url;
      const targetVolume = isMuted ? 0 : volume;
      
      if (crossfadeEnabled && isAutoPlayNext) {
        audio.volume = 0;
        audio.play().catch(error => console.error("Playback failed:", error));
        setAudioVolume(targetVolume, crossfadeDuration * 1000);
      } else {
        audio.volume = targetVolume;
        audio.play().catch(error => console.error("Playback failed:", error));
      }
    } else {
      setIsPlaying(false);
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    }
  }, [currentSong, crossfadeEnabled, crossfadeDuration, isMuted, volume, setAudioVolume, handleIncrementPlayCount, setupAudioGraph, flushSessionStats, lastFinishedSong, logEvent]);
  
  useEffect(() => {
    const audioElements: HTMLAudioElement[] = [];
    const fetchDurations = () => {
      const songsToFetch = sourcePlaylist.filter(song => songDurations[song.url] === undefined);
      if (songsToFetch.length === 0) return;

      const promises = songsToFetch.map(song => new Promise<[string, number] | null>(resolve => {
        const audio = new Audio();
        audioElements.push(audio);
        audio.src = song.url;

        const cleanupAndResolve = (result: [string, number] | null) => {
          audio.onloadedmetadata = null;
          audio.onerror = null;
          resolve(result);
        };

        audio.onloadedmetadata = () => cleanupAndResolve(isFinite(audio.duration) ? [song.url, audio.duration] : [song.url, -1]);
        audio.onerror = () => cleanupAndResolve([song.url, -1]);
        setTimeout(() => { if (audio.readyState < 1) cleanupAndResolve([song.url, -1]); }, 10000);
      }));

      Promise.all(promises).then(results => {
        const newDurations = Object.fromEntries(results.filter(Boolean) as [string, number][]);
        if (Object.keys(newDurations).length > 0) {
          setSongDurations(prev => {
            const updatedCache = { ...prev, ...newDurations };
            saveDurationCache(updatedCache);
            return updatedCache;
          });
        }
      });
    };

    fetchDurations();

    return () => {
      audioElements.forEach(audio => {
        audio.src = '';
        audio.onloadedmetadata = null;
        audio.onerror = null;
      });
    };
  }, [sourcePlaylist, songDurations]);

  const playlistWithMeta = useMemo(() => {
    return mainPlaylist.map(song => ({
      ...song,
      duration: songDurations[song.url],
      playCount: playCounts[song.url] || 0,
    }));
  }, [mainPlaylist, songDurations, playCounts]);

  const upNextWithDurations = upNextQueue
    .map(song => ({
      ...song,
      duration: songDurations[song.url],
    }));

  const handleSongSelect = useCallback((song: Song) => {
    setUpNextQueue(prev => prev.filter(s => s.url !== song.url));
    playSong(song);
  }, [playSong]);

  const handlePlayPause = useCallback(() => {
    if (songForVotePrompt) {
        setSongForVotePrompt(null);
    }
    if (!currentSong && mainPlaylist.length > 0) {
      playSong(mainPlaylist[0]);
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(error => console.error("Playback failed:", error));
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentSong, mainPlaylist, playSong, songForVotePrompt]);

  const playNextFromMainPlaylist = useCallback(() => {
    if (mainPlaylist.length === 0) return;
    const currentIndex = currentSong ? mainPlaylist.findIndex(s => s.url === currentSong.url) : -1;
    let nextIndex = 0;
    if (currentIndex !== -1) {
        nextIndex = (currentIndex + 1) % mainPlaylist.length;
    }
    playSong(mainPlaylist[nextIndex], true);
  }, [mainPlaylist, currentSong, playSong]);
  
  const playPrevFromMainPlaylist = useCallback(() => {
    if (mainPlaylist.length === 0) return;
    const currentIndex = currentSong ? mainPlaylist.findIndex(s => s.url === currentSong.url) : -1;
    let prevIndex = mainPlaylist.length - 1;
    if (currentIndex !== -1) {
        prevIndex = (currentIndex - 1 + mainPlaylist.length) % mainPlaylist.length;
    }
    playSong(mainPlaylist[prevIndex]);
  }, [mainPlaylist, currentSong, playSong]);

  const handleSongEnd = useCallback(() => {
    if (currentSong) {
      setPlaybackStats(prev => {
        const existing = prev[currentSong.url] || { totalTimePlayed: 0, completions: 0 };
        return {
          ...prev,
          [currentSong.url]: { ...existing, completions: existing.completions + 1 }
        };
      });
      logEvent('finish', currentSong.url);
      setLastFinishedSong({ url: currentSong.url, timestamp: Date.now() });
    }

    if (repeatMode === 'one' && currentSong) {
      playSong(currentSong);
      return;
    }

    setSongForVotePrompt(currentSong);

    if (!isAutoplayEnabled) {
      setIsPlaying(false);
      return;
    }
    
    if (upNextQueue.length > 0) {
      const nextSong = upNextQueue[0];
      setUpNextQueue(prev => prev.slice(1));
      playSong(nextSong, true);
      return;
    }
    
    const currentIndex = currentSong ? mainPlaylist.findIndex(s => s.url === currentSong.url) : -1;

    if (repeatMode === 'all') {
        playNextFromMainPlaylist();
    } else { // 'off'
      if (currentIndex !== -1 && currentIndex < mainPlaylist.length - 1) {
        playNextFromMainPlaylist();
      } else {
        setIsPlaying(false);
      }
    }
  }, [repeatMode, currentSong, playSong, playNextFromMainPlaylist, mainPlaylist, upNextQueue, isAutoplayEnabled, logEvent]);

  // FIX: Add seek handler for NowPlayingBar.
  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
        audioRef.current.currentTime = time;
    }
  }, []);

  const handleToggleFavorite = useCallback((songUrl: string) => {
    const newFavorites = toggleFavorite(songUrl);
    const isFavorite = newFavorites.has(songUrl);
    addToast(isFavorite ? 'Added to Favorites' : 'Removed from Favorites');
    if (isFavorite) {
      logEvent('save_favorite', songUrl);
    }
    setFavorites(newFavorites);
    const updateSong = (song: Song | null) => {
      if (song?.url === songUrl) return { ...song, isFavorite: isFavorite };
      return song;
    };
    setCurrentSong(updateSong);
    setUpNextQueue(queue => queue.map(s => updateSong(s) as Song));
  }, [addToast, logEvent]);

  const handleToggleShuffle = useCallback(() => {
    const newShuffleState = !isShuffled;
    updatePlayerSettings({ isShuffled: newShuffleState });
    addToast(newShuffleState ? 'Shuffle On' : 'Shuffle Off');
  }, [isShuffled, updatePlayerSettings, addToast]);

  const handleCycleRepeatMode = useCallback(() => {
    const newMode: RepeatMode = repeatMode === 'all' ? 'one' : repeatMode === 'one' ? 'off' : 'all';
    updatePlayerSettings({ repeatMode: newMode });
    addToast(`Repeat: ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`);
  }, [repeatMode, updatePlayerSettings, addToast]);
  
  const handleSortChange = useCallback((mode: SortMode) => {
    setSortMode(mode);
    if (isShuffled) updatePlayerSettings({ isShuffled: false });
    clearSelection();
  }, [isShuffled, updatePlayerSettings, clearSelection]);

  const handlePlayNext = useCallback((songs: Song[]) => {
    setUpNextQueue(prev => [...songs, ...prev.filter(s => !songs.find(sel => sel.url === s.url))]);
    addToast(songs.length > 1 ? `${songs.length} songs will play next` : `"${songs[0].title}" will play next`);
  }, [addToast]);

  const handleAddToQueue = useCallback((songs: Song[]) => {
    setUpNextQueue(prev => [...prev.filter(s => !songs.find(sel => sel.url === s.url)), ...songs]);
    addToast(songs.length > 1 ? `${songs.length} songs added to queue` : `"${songs[0].title}" added to queue`);
  }, [addToast]);

  const handleRemoveFromQueue = useCallback((song: Song) => {
    setUpNextQueue(prev => prev.filter(s => s.url !== song.url));
  }, []);

  const handleReorderQueue = useCallback((dragIndex: number, hoverIndex: number) => {
    setUpNextQueue(prev => {
      const reordered = [...prev];
      const [movedItem] = reordered.splice(dragIndex, 1);
      reordered.splice(hoverIndex, 0, movedItem);
      return reordered;
    });
  }, []);

  const handleClearQueue = useCallback(() => {
    setUpNextQueue([]);
  }, []);
  
  const handleVote = useCallback((songUrl: string, voteType: 'up' | 'down') => {
      const newVotes = updateVote(songUrl, voteType);
      setVotes(newVotes);
  }, []);

  const handleAddComment = useCallback((songUrl: string, comment: Omit<Comment, 'id' | 'timestamp'>) => {
      const newComments = addNewComment(songUrl, comment);
      setComments(newComments);
  }, []);
  
  const handleAddCrowdMarker = useCallback((songUrl: string, timestamp: number) => {
    const newMarkers = addCrowdMarker(songUrl, timestamp);
    setCrowdMarkers(newMarkers);
  }, []);

  const handleShowStats = useCallback((songs: Song[]) => {
      if (songs.length === 1) {
          setSongForStats(songs[0]);
      } else {
          addToast("Please select only one song to view its stats.");
      }
  }, [addToast]);

  const handleShareFromCurrentTime = useCallback((song: Song) => {
    if (currentSong?.url !== song.url || !audioRef.current) {
      addToast("Can only share timestamp for the currently playing song.", "toast-error");
      return;
    }
    const currentTime = Math.floor(audioRef.current.currentTime);
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
    const timeString = `${minutes}:${seconds}`;

    const shareUrl = `${window.location.origin}${window.location.pathname}?song=${encodeURIComponent(song.url)}&t=${currentTime}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      addToast(`Link to "${song.title}" at ${timeString} copied!`);
    }, (err) => {
      console.error('Could not copy link: ', err);
      addToast('Failed to copy link.');
    });
  }, [addToast, currentSong]);

  const handleReportComment = useCallback((commentId: string) => {
    const newReported = reportComment(commentId);
    setReportedComments(newReported);
    addToast("Comment reported and hidden.");
  }, [addToast]);


  const currentSongWithMeta = currentSong ? {
    ...currentSong,
    duration: songDurations[currentSong.url],
    playCount: playCounts[currentSong.url] || 0,
  } : null;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === HIGHEST_RATED_TAB) {
        setSortMode('rating-desc');
    } else if (tabId === MOST_POPULAR_TAB || tabId === NOW_PLAYING_TAB) {
        setSortMode('default');
    } else {
        setSortMode('default');
    }
    if (tabId !== TOP_PLAYED_TAB && tabId !== RECENTLY_PLAYED_TAB) {
      updatePlayerSettings({ isShuffled: false });
    }
    clearSelection();
  };
  
  const handleSubTabClick = (subTab: SubTabs<OriginalTopTab>) => {
    setActiveSubTabs(prev => ({...prev, [activeTab as OriginalTopTab]: subTab}));
    setSortMode('default');
    updatePlayerSettings({ isShuffled: false });
    clearSelection();
  };

  const handleSharedSongConfirm = () => {
    if (sharedSong) {
      playSong(sharedSong);
       if (sharedSongStartTime && audioRef.current) {
        const audio = audioRef.current;
        const seekOnReady = () => {
          if (audio.duration && sharedSongStartTime < audio.duration) {
            audio.currentTime = sharedSongStartTime;
          }
          audio.removeEventListener('loadeddata', seekOnReady);
        };
        audio.addEventListener('loadeddata', seekOnReady);
      }
    }
    setSharedSong(null);
    setSharedSongStartTime(null);
  };

  const selectedSongs = useMemo(() => playlistWithMeta.filter(s => selectedSongUrls.has(s.url)), [playlistWithMeta, selectedSongUrls]);
  
  const handleSongContextMenu = useCallback((e: React.MouseEvent, song: Song) => {
      e.preventDefault();
      const isSongSelected = selectedSongUrls.has(song.url);
      if (isSongSelected && selectedSongs.length > 1) {
        setSongContextMenu({ x: e.clientX, y: e.clientY, songs: selectedSongs });
      } else {
        setSongContextMenu({ x: e.clientX, y: e.clientY, songs: [song] });
      }
  }, [selectedSongUrls, selectedSongs]);

  const closeSongContextMenu = useCallback(() => {
    setSongContextMenu(null);
  }, []);
  
  const handlePlaylistContextMenu = useCallback((e: React.MouseEvent, playlist: UserPlaylist) => {
    e.preventDefault();
    setPlaylistContextMenu({ x: e.clientX, y: e.clientY, playlist });
  }, []);
  
  const closePlaylistContextMenu = useCallback(() => {
    setPlaylistContextMenu(null);
  }, []);
  
  useEffect(() => {
    const closeAllContextMenus = () => {
      closeSongContextMenu();
      closePlaylistContextMenu();
    }
    const handleGlobalClick = (e: MouseEvent) => {
        closeAllContextMenus();
        // Clear selection if clicking outside playlist area
        if (!(e.target as HTMLElement).closest('.playlist-container, [role="menu"]')) {
             clearSelection();
        }
    }
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('scroll', closeAllContextMenus, true);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', closeAllContextMenus, true);
    };
  }, [closeSongContextMenu, closePlaylistContextMenu, clearSelection]);

  const handlePlayAll = useCallback((playlist: Song[]) => {
    if (playlist.length === 0) return;
    let playlistToPlay = [...playlist];
    if (isShuffled) {
      for (let i = playlistToPlay.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playlistToPlay[i], playlistToPlay[j]] = [playlistToPlay[j], playlistToPlay[i]];
      }
    }
    setMainPlaylist(playlistToPlay);
    setUpNextQueue([]);
    playSong(playlistToPlay[0]);
    addToast(`Now playing ${playlist.length} songs`);
  }, [isShuffled, playSong, addToast]);
  
  const handleSavePlaylistDetails = (details: { id?: string; name: string; description: string }) => {
    const { id, name, description } = details;
    if (id) { // Edit mode
        const updatedPlaylists = userPlaylists.map(p => 
            p.id === id ? { ...p, name, description } : p
        );
        setUserPlaylists(updatedPlaylists);
        addToast(`Playlist "${name}" updated`);
    } else { // Create mode
        const newPlaylist: UserPlaylist = {
            id: `user-playlist-${Date.now()}`,
            name: name,
            songUrls: selectedSongs.map(s => s.url),
            description: description,
        };
        selectedSongs.forEach(song => logEvent('save_playlist', song.url));
        const updatedPlaylists = [...userPlaylists, newPlaylist];
        setUserPlaylists(updatedPlaylists);
        addToast(`Playlist "${name}" created`);
        setActiveTab(newPlaylist.id);
    }
    saveUserPlaylists(userPlaylists);
  };
  
  const handleAddSongsToPlaylist = (playlistId: string, songs: Song[]) => {
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const songsToAdd = songs.filter(s => !playlist.songUrls.includes(s.url));
    if (songsToAdd.length === 0) {
        addToast(`All selected songs already in "${playlist.name}"`);
        return;
    }
    songsToAdd.forEach(song => logEvent('save_playlist', song.url));

    const updatedPlaylists = userPlaylists.map(p => {
        if (p.id === playlistId) {
            return { ...p, songUrls: [...p.songUrls, ...songsToAdd.map(s => s.url)] };
        }
        return p;
    });
    setUserPlaylists(updatedPlaylists);
    saveUserPlaylists(updatedPlaylists);
    addToast(`${songsToAdd.length} songs added to "${playlist.name}"`);
  };

  const handleRemoveSongFromPlaylist = useCallback((songUrl: string) => {
    const playlistId = activeTab;
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;

    const updatedPlaylists = userPlaylists.map(p => {
        if (p.id === playlistId) {
            const updatedUrls = p.songUrls.filter(url => url !== songUrl);
            return { ...p, songUrls: updatedUrls };
        }
        return p;
    });
    setUserPlaylists(updatedPlaylists);
    saveUserPlaylists(updatedPlaylists);
    addToast(`Song removed from "${playlist.name}"`);
  }, [activeTab, userPlaylists, addToast]);
  
  const handleReorderUserSongPlaylist = useCallback((dragIndex: number, hoverIndex: number) => {
    const playlistId = activeTab;
    const playlist = userPlaylists.find(p => p.id === playlistId);
    if (!playlist) return;

    setUserPlaylists(prevPlaylists => {
        return prevPlaylists.map(p => {
            if (p.id === playlistId) {
                const reorderedUrls = [...p.songUrls];
                const [movedItem] = reorderedUrls.splice(dragIndex, 1);
                reorderedUrls.splice(hoverIndex, 0, movedItem);
                return { ...p, songUrls: reorderedUrls };
            }
            return p;
        });
    });
  }, [activeTab]);
  
  const handleReorderUserPlaylists = useCallback((dragIndex: number, hoverIndex: number) => {
      setUserPlaylists(prev => {
          const reordered = [...prev];
          const [movedItem] = reordered.splice(dragIndex, 1);
          reordered.splice(hoverIndex, 0, movedItem);
          return reordered;
      });
  }, []);

  useEffect(() => {
    saveUserPlaylists(userPlaylists);
  }, [userPlaylists]);


  const handleRequestDeletePlaylist = useCallback((playlist: UserPlaylist) => {
    setPlaylistToDelete(playlist);
  }, []);

  const handleConfirmDeletePlaylist = useCallback(() => {
    if (!playlistToDelete) return;
    const updatedPlaylists = userPlaylists.filter(p => p.id !== playlistToDelete.id);
    setUserPlaylists(updatedPlaylists);
    saveUserPlaylists(updatedPlaylists);
    addToast(`Playlist "${playlistToDelete.name}" deleted`);

    if (activeTab === playlistToDelete.id) {
        setActiveTab(Object.keys(playlistsData)[0]);
    }
    setPlaylistToDelete(null);
  }, [playlistToDelete, userPlaylists, activeTab, addToast]);

  const handleRequestEditPlaylist = useCallback((playlist: UserPlaylist) => {
    setPlaylistModalState({ mode: 'edit', playlist });
  }, []);
  
  const handleResetPlayCounts = () => {
    setPlayCounts({});
    resetPlayCounts();
    addToast("All song play counts have been reset.");
  };

  const handleAiMixGenerated = useCallback((mix: Song[], prompt: string) => {
    const newPlaylist: UserPlaylist = {
        id: `user-playlist-ai-${Date.now()}`,
        name: `Mix: "${prompt}"`,
        songUrls: mix.map(s => s.url),
        description: `Generated from the prompt: "${prompt}"`,
    };
    const updatedPlaylists = [...userPlaylists, newPlaylist];
    setUserPlaylists(updatedPlaylists);
    saveUserPlaylists(updatedPlaylists);
    addToast(`Instant Mix "${prompt}" created!`);
    setIsAiMixOpen(false);
    setActiveTab(newPlaylist.id);
  }, [userPlaylists, addToast]);
  
  const isUserPlaylistActive = useMemo(() => userPlaylists.some(p => p.id === activeTab), [userPlaylists, activeTab]);
  
  const isDynamicPlaylistActive = activeTab === RECENTLY_PLAYED_TAB || activeTab === TOP_PLAYED_TAB;

  const topTabsToRender: {id: string, icon: React.FC<{className?: string}>}[] = [
      { id: FEATURED_TAB, icon: StarIcon },
      { id: 'Suno', icon: SparklesIcon },
      { id: 'Luna Æther', icon: PaletteIcon },
      { id: 'LxJ', icon: UsersIcon },
      { id: 'JexT', icon: FireIcon },
      { id: 'Ðeffy Sings~', icon: MusicNoteIcon },
  ];

  const handleSelectionChange = useCallback((clickedIndex: number, song: Song, isCtrl: boolean, isShift: boolean) => {
    const newSelected = new Set(selectedSongUrls);
    
    if (isShift && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      for (let i = start; i <= end; i++) {
        newSelected.add(playlistWithMeta[i].url);
      }
    } else if (isCtrl) {
      if (newSelected.has(song.url)) {
        newSelected.delete(song.url);
      } else {
        newSelected.add(song.url);
      }
      setLastSelectedIndex(clickedIndex);
    } else {
      if (newSelected.has(song.url) && newSelected.size === 1) {
        newSelected.clear();
        setLastSelectedIndex(null);
      } else {
        newSelected.clear();
        newSelected.add(song.url);
        setLastSelectedIndex(clickedIndex);
      }
    }
    setSelectedSongUrls(newSelected);
  }, [selectedSongUrls, lastSelectedIndex, playlistWithMeta]);

  // Multi-select action handlers
  const handleMultiAddSongsToFavorites = (songs: Song[]) => {
    let newFavorites = getFavorites();
    let newCount = 0;
    songs.forEach(s => {
        if (!newFavorites.has(s.url)) {
            newFavorites.add(s.url)
            logEvent('save_favorite', s.url);
            newCount++;
        }
    });
    localStorage.setItem('deffy-jukebox-favorites', JSON.stringify(Array.from(newFavorites)));
    setFavorites(new Set(newFavorites));
    if (newCount > 0) {
      addToast(`${newCount} ${newCount > 1 ? 'songs' : 'song'} added to Favorites`);
    }
  };
  
  const activePlaylistForHeader = useMemo(() => {
    if (isUserPlaylistActive) return userPlaylists.find(p => p.id === activeTab);
    return null;
  }, [isUserPlaylistActive, userPlaylists, activeTab]);

  return (
    <div data-theme={activeTheme} className={`min-h-screen flex flex-col font-sans theme-container ${reduceMotion ? 'reduce-motion' : ''}`}>
      <audio ref={audioRef} onEnded={handleSongEnd} crossOrigin="anonymous" />
        <Header
            searchQuery={searchQuery}
            onQueryChange={setSearchQuery}
            themes={structuredThemes}
            userThemeSelection={userThemeSelection}
            onChangeTheme={setUserThemeSelection}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onStartTutorial={handleStartTutorial}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      
      <main className={`main-layout flex-grow flex p-4 gap-4 overflow-hidden`}>
        {/* FIX: Pass playerSettings object instead of individual props to resolve type error. */}
        <Sidebar
            isMobile={isMobile}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            topTabs={topTabsToRender}
            featuredSparkleKey={featuredSparkleKey}
            activeTab={activeTab}
            handleTabClick={handleTabClick}
            animateFavorites={animateFavorites}
            setAnimateFavorites={setAnimateFavorites}
            favorites={favorites}
            mostPopularTab={MOST_POPULAR_TAB}
            nowPlayingTab={NOW_PLAYING_TAB}
            highestRatedTab={HIGHEST_RATED_TAB}
            topPlayedTab={TOP_PLAYED_TAB}
            recentlyPlayedTab={RECENTLY_PLAYED_TAB}
            favoritesTab={FAVORITES_TAB}
            playerSettings={playerSettings}
            updatePlayerSettings={updatePlayerSettings}
            setIsAiMixOpen={setIsAiMixOpen}
            setPlaylistModalState={setPlaylistModalState}
            userPlaylists={userPlaylists}
            draggedPlaylistId={draggedPlaylistId}
            dragOverPlaylistId={dragOverPlaylistId}
            handleReorderUserPlaylists={handleReorderUserPlaylists}
            handlePlaylistContextMenu={handlePlaylistContextMenu}
            dropTargetId={dropTargetId}
            draggedSongs={draggedSongs}
            dragLeaveTimeoutRef={dragLeaveTimeoutRef}
            setDropTargetId={setDropTargetId}
            handleAddSongsToPlaylist={handleAddSongsToPlaylist}
            isOriginalTopTab={() => isOriginalTopTab(activeTab)}
            activeSubTab={activeSubTab}
            playlistsData={playlistsData}
            handleSubTabClick={handleSubTabClick}
            upNextWithDurations={upNextWithDurations}
            currentSongWithMeta={currentSongWithMeta}
            isPlaying={isPlaying}
            handleSongSelect={handleSongSelect}
            handleReorderQueue={handleReorderQueue}
            handleRemoveFromQueue={handleRemoveFromQueue}
            handleClearQueue={handleClearQueue}
        />

        <div key={`${activeTab}-${activeSubTab}`} className="playlist-container flex-grow bg-[var(--surface-color)] rounded-lg shadow-inner flex flex-col animate-fade-in-slide relative" data-tutorial-id="playlist-view">
          <Playlist
            songs={playlistWithMeta}
            sourceSongs={sourcePlaylist}
            currentSong={currentSongWithMeta}
            isPlaying={isPlaying}
            isUserPlaylist={isUserPlaylistActive}
            onSongSelect={handleSongSelect}
            onToggleFavorite={handleToggleFavorite}
            onPlayNext={(song) => handlePlayNext([song])}
            onAddToQueue={(song) => handleAddToQueue([song])}
            onRemoveFromPlaylist={handleRemoveSongFromPlaylist}
            onReorderPlaylist={handleReorderUserSongPlaylist}
            onPlayAll={handlePlayAll}
            sortMode={sortMode}
            onSortChange={handleSortChange}
            isShuffled={isShuffled}
            artCacheVersion={artCacheVersion}
            onContextMenu={handleSongContextMenu}
            viewMode={viewMode}
            onViewModeChange={(mode) => updatePlayerSettings({ viewMode: mode })}
            setDraggedSongs={setDraggedSongs}
            isFeaturedActive={activeTab === FEATURED_TAB}
            isHighestRatedActive={activeTab === HIGHEST_RATED_TAB}
            isMostPopularActive={activeTab === MOST_POPULAR_TAB}
            isNowPlayingActive={activeTab === NOW_PLAYING_TAB}
            selectedSongUrls={selectedSongUrls}
            onSelectionChange={handleSelectionChange}
            playlistName={activePlaylistForHeader?.name || activeTab}
            playlistDescription={activePlaylistForHeader?.description}
            styleFilter={styleFilter}
            onStyleFilterChange={setStyleFilter}
            bpmFilter={bpmFilter}
            onBpmFilterChange={setBpmFilter}
            votes={votes}
            onVote={handleVote}
            highestRatedTimeFilter={highestRatedTimeFilter}
            onHighestRatedTimeFilterChange={setHighestRatedTimeFilter}
          />
          {selectedSongs.length > 0 && (
             <MultiSelectActions
                selectedSongs={selectedSongs}
                userPlaylists={userPlaylists}
                onPlayNext={handlePlayNext}
                onAddToQueue={handleAddToQueue}
                onAddSongsToFavorites={handleMultiAddSongsToFavorites}
                onAddSongsToPlaylist={handleAddSongsToPlaylist}
                onCreatePlaylist={() => setPlaylistModalState({ mode: 'create' })}
                onClearSelection={clearSelection}
             />
          )}
        </div>
      </main>

      {isMiniPlayer ? (
        <MiniPlayer
          song={currentSongWithMeta}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onExpand={() => setIsMiniPlayer(false)}
          artCacheVersion={artCacheVersion}
        />
      ) : (isMobile ? (
        // FIX: Pass the required onSeek prop to NowPlayingBar.
        <NowPlayingBar
            song={currentSongWithMeta}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onOpenNowPlaying={() => handleOpenNowPlaying()}
            artCacheVersion={artCacheVersion}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
        />
      ) : (
        <footer className="desktop-footer sticky bottom-0 z-10 animate-slide-in-up" data-tutorial-id="player">
          {/* FIX: Pass the required playerGlowColor prop to MusicPlayer. */}
          <MusicPlayer
            song={currentSongWithMeta}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onNext={playNextFromMainPlaylist}
            onPrev={playPrevFromMainPlaylist}
            audioRef={audioRef}
            playerSettings={playerSettings}
            onUpdateSettings={updatePlayerSettings}
            onToggleShuffle={handleToggleShuffle}
            onCycleRepeatMode={handleCycleRepeatMode}
            artCacheVersion={artCacheVersion}
            onOpenNowPlaying={handleOpenNowPlaying}
            onCollapse={() => setIsMiniPlayer(true)}
            nowPlayingTriggerId="now-playing-trigger"
            analyserNode={analyserNodeRef.current}
            songForVotePrompt={songForVotePrompt}
            setSongForVotePrompt={setSongForVotePrompt}
            votes={votes}
            onVote={handleVote}
            comments={comments}
            crowdMarkers={crowdMarkers[currentSong?.url || ''] || []}
            onAddCrowdMarker={handleAddCrowdMarker}
            playerGlowColor={playerGlowColor}
          />
        </footer>
      ))}
      
      {/* Modals and Overlays */}
      <NowPlayingView
        isOpen={isNowPlayingOpen}
        onClose={() => setIsNowPlayingOpen(false)}
        song={currentSongWithMeta}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={playNextFromMainPlaylist}
        onPrev={playPrevFromMainPlaylist}
        audioRef={audioRef}
        playerSettings={playerSettings}
        onUpdateSettings={updatePlayerSettings}
        onToggleShuffle={handleToggleShuffle}
        onCycleRepeatMode={handleCycleRepeatMode}
        artCacheVersion={artCacheVersion}
        spinCount={spinCount}
        onSpinCountChange={setSpinCount}
        onBlingUnlock={handleBlingUnlock}
        isBlingUnlocked={unlocks.bling}
        analyserNode={analyserNodeRef.current}
        defaultView={nowPlayingDefaultView}
        votes={votes}
        onVote={handleVote}
        comments={comments[currentSong?.url || ''] || []}
        onAddComment={handleAddComment}
        crowdMarkers={crowdMarkers[currentSong?.url || ''] || []}
        onAddCrowdMarker={handleAddCrowdMarker}
        reportedComments={reportedComments}
        onReportComment={handleReportComment}
      />
      <PlaylistDetailsModal
        isOpen={!!playlistModalState}
        onClose={() => setPlaylistModalState(null)}
        onSave={handleSavePlaylistDetails}
        playlistToEdit={playlistModalState?.mode === 'edit' ? playlistModalState.playlist : undefined}
      />
       <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={playerSettings}
        onUpdateSettings={updatePlayerSettings}
        onClearArtCache={handleClearArtCache}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetPlayCounts={handleResetPlayCounts}
        onOpenAlbumArtGenerator={() => setIsAlbumArtGeneratorOpen(true)}
        onOpenMetadataGenerator={() => setIsMetadataGeneratorOpen(true)}
      />
       <SongStatsModal 
        isOpen={!!songForStats}
        onClose={() => setSongForStats(null)}
        song={songForStats}
        stats={songForStats ? playbackStats[songForStats.url] : null}
        playHistory={playHistory}
      />
      {sharedSong && (
        <SharedSongModal song={sharedSong} onConfirm={handleSharedSongConfirm} />
      )}
      {songContextMenu && (
          <SongActionsMenu
              x={songContextMenu.x}
              y={songContextMenu.y}
              songs={songContextMenu.songs}
              onClose={closeSongContextMenu}
              onPlayNext={handlePlayNext}
              onAddToQueue={handleAddToQueue}
              onToggleFavorite={handleToggleFavorite}
              onAddSongsToFavorites={handleMultiAddSongsToFavorites}
              onAddSongsToPlaylist={handleAddSongsToPlaylist}
              onCreatePlaylist={(songs) => {
                  setSelectedSongUrls(new Set(songs.map(s => s.url)));
                  setLastSelectedIndex(null);
                  setPlaylistModalState({ mode: 'create' });
              }}
              userPlaylists={userPlaylists}
              isUserPlaylist={isUserPlaylistActive || isDynamicPlaylistActive}
              onRemoveFromCurrentPlaylist={handleRemoveSongFromPlaylist}
              onShowStats={handleShowStats}
              onShareFromCurrentTime={handleShareFromCurrentTime}
              addToast={addToast}
          />
      )}
      {playlistContextMenu && (
          <PlaylistActionsMenu
              x={playlistContextMenu.x}
              y={playlistContextMenu.y}
              playlist={playlistContextMenu.playlist}
              onClose={closePlaylistContextMenu}
              onEditDetails={handleRequestEditPlaylist}
              onDelete={handleRequestDeletePlaylist}
          />
      )}
      {playlistToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setPlaylistToDelete(null)}>
          <div
            ref={confirmModalRef}
            style={confirmModalPosition ? { top: `${confirmModalPosition.y}px`, left: `${confirmModalPosition.x}px`, transform: 'none' } : { visibility: 'hidden' }}
            className="bg-[var(--surface-color)] w-full max-w-sm rounded-lg shadow-2xl animate-fade-in-sm fixed"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-playlist-title"
            onClick={e => e.stopPropagation()}
          >
            <div
              ref={confirmModalHeaderRef}
              onMouseDown={handleConfirmModalMouseDown}
              className="modal-header p-4 flex items-center gap-2 border-b border-black/20"
            >
              <TrashIcon className="w-6 h-6 text-[var(--heart-color)] flex-shrink-0" />
              <h2 id="delete-playlist-title" className="text-xl font-bold text-[var(--text-primary)]">
                Delete Playlist
              </h2>
            </div>
            <div className="p-6">
                <p className="text-[var(--text-secondary)] my-4">Are you sure you want to delete the playlist "{playlistToDelete.name}"? This action cannot be undone.</p>
                <div className="flex justify-end gap-4 mt-6">
                  <button onClick={() => setPlaylistToDelete(null)} className="px-5 py-2 rounded-lg font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleConfirmDeletePlaylist} className="px-5 py-2 rounded-lg font-semibold bg-[var(--heart-color)] text-white hover:bg-[var(--heart-hover-color)] transition-colors">
                    Delete
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-4 md:bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          {toasts.map(toast => (
              <Toast key={toast.id} message={toast.message} onRemove={() => setToasts(p => p.filter(t => t.id !== toast.id))} className={toast.className} />
          ))}
      </div>
      <AiMixGenerator
        isOpen={isAiMixOpen}
        onClose={() => setIsAiMixOpen(false)}
        songs={allUniqueSongs}
        onMixGenerated={handleAiMixGenerated}
      />
      <AlbumArtGenerator
        isOpen={isAlbumArtGeneratorOpen}
        onClose={() => setIsAlbumArtGeneratorOpen(false)}
        songs={allUniqueSongs}
        onArtGenerated={handleArtGenerated}
      />
      <MetadataGenerator
        isOpen={isMetadataGeneratorOpen}
        onClose={() => setIsMetadataGeneratorOpen(false)}
        songs={allUniqueSongs}
      />
      {isTutorialActive && (
        <Tutorial
            steps={tutorialSteps}
            stepIndex={tutorialStep}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            onClose={handleCloseTutorial}
        />
      )}
    </div>
  );
};

export default App;