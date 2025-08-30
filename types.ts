

export interface Song {
  title: string;
  url: string;
  isFavorite?: boolean;
  duration?: number;
  bpm?: number;
  style?: string;
  coverArtUrl?: string;
  disableAlbumArtGeneration?: boolean;
  lyrics?: string;
  description?: string;
  playCount?: number;
  score?: number;
  voteCount?: number;
  listeners?: number;
}

export interface UserPlaylist {
  id: string;
  name: string;
  songUrls: string[];
  description?: string;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type SortMode = 'default' | 'title-asc' | 'title-desc' | 'duration-asc' | 'duration-desc' | 'bpm-asc' | 'bpm-desc' | 'style-asc' | 'style-desc' | 'play-count-asc' | 'play-count-desc' | 'rating-desc';

export interface EqualizerSettings {
  enabled: boolean;
  preamp: number; // -12 to 12 dB
  bands: number[]; // 10 bands, -12 to 12 dB
  preset: string;
}

export interface PlayerSettings {
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isAutoplayEnabled: boolean;
  viewMode: 'list' | 'grid';
  crossfadeEnabled: boolean;
  crossfadeDuration: number; // in seconds
  visualizerEnabled: boolean;
  defaultVisualizerStyle: 'bars' | 'circle' | 'waveform';
  volumeControlStyle: 'popup' | 'horizontal';
  reduceMotion: boolean;
  equalizer: EqualizerSettings;
  isSidebarCompact: boolean;
  playbackRate: number;
  isPlaylistsCollapsed: boolean;
  isLibraryCollapsed: boolean;
}

// New types for social features
export interface VoteData {
  up: number[]; // Array of timestamps
  down: number[]; // Array of timestamps
  userVote?: 'up' | 'down' | null;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: number; // creation timestamp (Date.now())
  songTimestamp?: number; // time in song, in seconds
}

export interface PlaybackStat {
  totalTimePlayed: number; // in seconds
  completions: number;
}

export interface CrowdMarker {
  timestamp: number; // in seconds
}

export interface PlayRecord {
  url: string;
  timestamp: number; // Date.now()
}

export type SocialEventType = 'play' | 'finish' | 'replay' | 'save_favorite' | 'save_playlist';

export interface SocialEvent {
  type: SocialEventType;
  url: string;
  timestamp: number; // Date.now()
}