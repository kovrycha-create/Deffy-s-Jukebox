

import React, { useState, useEffect } from 'react';
import type { Song } from '../types';
import { getArtFromCache } from '../utils/albumArt';
import { MusicNoteIcon } from './Icons';

interface AlbumArtProps {
  song: Song | null;
  className?: string;
  cacheVersion?: number;
}

const AlbumArt: React.FC<AlbumArtProps> = ({ song, className, cacheVersion }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  
  useEffect(() => {
    setImageUrl(null);
    setError(false);
    
    if (!song) {
      return;
    }

    // Prioritize pre-defined cover art
    if (song.coverArtUrl) {
      setImageUrl(song.coverArtUrl);
      return;
    }

    // Do not show generated art if generation is disabled
    if (song.disableAlbumArtGeneration) {
      return;
    }

    const cachedArt = getArtFromCache(song.url);

    if (cachedArt) {
      if (cachedArt === 'error') {
        setError(true);
      } else {
        setImageUrl(cachedArt);
      }
    }
  }, [song?.url, song?.coverArtUrl, song?.disableAlbumArtGeneration, cacheVersion]);

  const baseClasses = "w-full h-full bg-[var(--surface-active-color)] flex items-center justify-center";

  if (error) {
    // Maybe show an error icon in the future
    return (
      <div className={`${baseClasses} ${className}`}>
        <MusicNoteIcon className="w-1/2 h-1/2 text-[var(--text-muted)]" />
      </div>
    )
  }

  if (imageUrl) {
    return (
        <img src={imageUrl} alt={`Album art for ${song?.title}`} className={`w-full h-full object-cover ${className}`} />
    );
  }

  return (
    <div className={`${baseClasses} ${className}`}>
        <MusicNoteIcon className="w-1/2 h-1/2 text-[var(--text-muted)]" />
    </div>
  );
};

export default AlbumArt;