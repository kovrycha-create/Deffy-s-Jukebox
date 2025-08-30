import type { UserPlaylist } from '../types';

const USER_PLAYLISTS_KEY = 'deffy-jukebox-user-playlists';

export const getUserPlaylists = (): UserPlaylist[] => {
  try {
    const playlistsJson = localStorage.getItem(USER_PLAYLISTS_KEY);
    return playlistsJson ? JSON.parse(playlistsJson) : [];
  } catch (e) {
    console.error('Could not load user playlists from local storage', e);
    return [];
  }
};

export const saveUserPlaylists = (playlists: UserPlaylist[]): void => {
  try {
    localStorage.setItem(USER_PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch (e) {
    console.error('Could not save user playlists to local storage', e);
  }
};
