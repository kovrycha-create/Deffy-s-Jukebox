
import type { Song } from '../types';
import { getFavorites } from './favorites';
import { songMetadata as mainSongMetadata } from '../song-data';
import { songMetadata as classicsSongMetadata } from '../classics-song-data';
import { lyricsData } from '../lyrics-data';
import { playlistsData } from '../data';

const combinedSongMetadata = { ...mainSongMetadata, ...classicsSongMetadata };

export const parsePlaylist = (text: string, isSpecialPlaylist: boolean = false, parseAll: boolean = false): Song[] => {
  const songs: Song[] = [];
  const favorites = getFavorites();

  const processText = (playlistText: string, isSpecial: boolean) => {
    const lines = playlistText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        const url = lines[i + 1];
        const metadata = combinedSongMetadata[url];
        const lyrics = lyricsData[url];
        songs.push({
          title: lines[i],
          url: url,
          isFavorite: favorites.has(url),
          bpm: metadata?.bpm,
          style: metadata?.style,
          coverArtUrl: metadata?.coverArtUrl,
          description: metadata?.description,
          disableAlbumArtGeneration: isSpecial,
          lyrics: lyrics,
        });
      }
    }
  };

  if (parseAll) {
    // This mode is used to get a list of all unique songs
    Object.entries(playlistsData).forEach(([topTab, topTabContent]) => {
      Object.entries(topTabContent).forEach(([subTab, playlistData]) => {
        const isSpecial = topTab === 'Deffy Sings~' && subTab === 'Classics';
        processText(playlistData as string, isSpecial);
      });
    });
    // Deduplicate songs
    const uniqueSongs = new Map<string, Song>();
    songs.forEach(song => {
        if (!uniqueSongs.has(song.url)) {
            uniqueSongs.set(song.url, song);
        }
    });
    return Array.from(uniqueSongs.values());
  } else {
    processText(text, isSpecialPlaylist);
    return songs;
  }
};

export const formatTime = (time: number | undefined): string => {
  if (time === undefined || isNaN(time) || time < 0) return '';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};