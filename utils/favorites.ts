import type { Song } from '../types';

const FAVORITES_KEY = 'deffy-jukebox-favorites';
const DURATION_CACHE_KEY = 'deffy-jukebox-durations';
const UP_NEXT_QUEUE_KEY = 'deffy-jukebox-up-next';
const PLAY_COUNTS_KEY = 'deffy-jukebox-play-counts';
const RECENTLY_PLAYED_KEY = 'deffy-jukebox-recently-played';
const MAX_RECENTLY_PLAYED = 50;

export const getFavorites = (): Set<string> => {
  try {
    const favoritesJson = localStorage.getItem(FAVORITES_KEY);
    return favoritesJson ? new Set(JSON.parse(favoritesJson)) : new Set();
  } catch (e) {
    console.error('Could not load favorites from local storage', e);
    return new Set();
  }
};

export const toggleFavorite = (songUrl: string): Set<string> => {
  const favorites = getFavorites();
  if (favorites.has(songUrl)) {
    favorites.delete(songUrl);
  } else {
    favorites.add(songUrl);
  }
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (e) {
    console.error('Could not save favorites to local storage', e);
  }
  return new Set(favorites); // Return a new set to ensure state updates
};

export const getDurationCache = (): Record<string, number> => {
  try {
    const durationsJson = localStorage.getItem(DURATION_CACHE_KEY);
    return durationsJson ? JSON.parse(durationsJson) : {};
  } catch (e) {
    console.error('Could not load duration cache from local storage', e);
    return {};
  }
};

export const saveDurationCache = (durations: Record<string, number>): void => {
  try {
    localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(durations));
  } catch (e) {
    console.error('Could not save duration cache to local storage', e);
  }
};

export const getUpNextQueue = (): Song[] => {
  try {
    const queueJson = localStorage.getItem(UP_NEXT_QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (e) {
    console.error('Could not load Up Next queue from local storage', e);
    return [];
  }
};

export const saveUpNextQueue = (queue: Song[]): void => {
  try {
    localStorage.setItem(UP_NEXT_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Could not save Up Next queue to local storage', e);
  }
};

export const getPlayCounts = (): Record<string, number> => {
  try {
    const countsJson = localStorage.getItem(PLAY_COUNTS_KEY);
    return countsJson ? JSON.parse(countsJson) : {};
  } catch (e) {
    console.error('Could not load play counts from local storage', e);
    return {};
  }
};

export const savePlayCounts = (counts: Record<string, number>): void => {
  try {
    localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
  } catch (e) {
    console.error('Could not save play counts to local storage', e);
  }
};

export const resetPlayCounts = (): void => {
    localStorage.removeItem(PLAY_COUNTS_KEY);
};

export const getRecentlyPlayed = (): string[] => {
    try {
        const recentlyPlayedJson = localStorage.getItem(RECENTLY_PLAYED_KEY);
        return recentlyPlayedJson ? JSON.parse(recentlyPlayedJson) : [];
    } catch (e) {
        console.error('Could not load recently played from local storage', e);
        return [];
    }
}

export const addRecentlyPlayed = (songUrl: string): string[] => {
    let recentlyPlayed = getRecentlyPlayed();
    // Remove existing instance of the song to move it to the top
    recentlyPlayed = recentlyPlayed.filter(url => url !== songUrl);
    // Add to the front
    recentlyPlayed.unshift(songUrl);
    // Trim to max length
    if (recentlyPlayed.length > MAX_RECENTLY_PLAYED) {
        recentlyPlayed = recentlyPlayed.slice(0, MAX_RECENTLY_PLAYED);
    }
    try {
        localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(recentlyPlayed));
    } catch (e) {
        console.error('Could not save recently played to local storage', e);
    }
    return recentlyPlayed;
}
