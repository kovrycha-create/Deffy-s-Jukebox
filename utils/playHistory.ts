
import type { PlayRecord } from '../types';

const PLAY_HISTORY_KEY = 'deffy-jukebox-play-history';
const MAX_HISTORY_ITEMS = 1000; // Limit to the last 1000 plays to prevent unbounded storage growth.

export const getPlayHistory = (): PlayRecord[] => {
  try {
    const historyJson = localStorage.getItem(PLAY_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (e) {
    console.error('Could not load play history from local storage', e);
    return [];
  }
};

export const addPlayHistory = (songUrl: string): PlayRecord[] => {
  let history = getPlayHistory();
  
  const newRecord: PlayRecord = {
    url: songUrl,
    timestamp: Date.now(),
  };

  history.push(newRecord);

  // Trim old records if history gets too large
  if (history.length > MAX_HISTORY_ITEMS) {
    history = history.slice(history.length - MAX_HISTORY_ITEMS);
  }

  try {
    localStorage.setItem(PLAY_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Could not save play history to local storage', e);
  }

  return history;
};