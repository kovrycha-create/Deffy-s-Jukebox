import type { PlaybackStat } from '../types';

const STATS_KEY = 'deffy-jukebox-playback-stats';

export const getPlaybackStats = (): Record<string, PlaybackStat> => {
  try {
    const statsJson = localStorage.getItem(STATS_KEY);
    return statsJson ? JSON.parse(statsJson) : {};
  } catch (e) {
    console.error('Could not load playback stats', e);
    return {};
  }
};

export const savePlaybackStats = (stats: Record<string, PlaybackStat>): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Could not save playback stats', e);
  }
};
