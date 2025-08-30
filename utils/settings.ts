import type { PlayerSettings } from '../types';

const SETTINGS_KEY = 'deffy-jukebox-settings';

export const EQ_BANDS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const defaultSettings: PlayerSettings = {
  volume: 1,
  isMuted: false,
  repeatMode: 'all',
  isShuffled: false,
  isAutoplayEnabled: true,
  viewMode: 'list',
  crossfadeEnabled: false,
  crossfadeDuration: 4, // seconds
  visualizerEnabled: true,
  defaultVisualizerStyle: 'bars',
  volumeControlStyle: 'horizontal',
  reduceMotion: false,
  equalizer: {
    enabled: false,
    preamp: 0,
    bands: new Array(EQ_BANDS.length).fill(0),
    preset: 'flat',
  },
  isSidebarCompact: false,
  playbackRate: 1,
  isPlaylistsCollapsed: false,
  isLibraryCollapsed: false,
};

export const getSettings = (): PlayerSettings => {
  try {
    const settingsJson = localStorage.getItem(SETTINGS_KEY);
    const loadedSettings = settingsJson ? JSON.parse(settingsJson) : {};
     // Merge loaded settings with defaults to ensure new settings are applied
    return { ...defaultSettings, ...loadedSettings };
  } catch (e) {
    console.error('Could not load settings from local storage', e);
    return defaultSettings;
  }
};

export const saveSettings = (settings: PlayerSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Could not save settings to local storage', e);
  }
};