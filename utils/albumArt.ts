import { GoogleGenAI } from "@google/genai";
import type { Song } from '../types';

const ALBUM_ART_CACHE_KEY = 'deffy-jukebox-album-art';

// Function to get the entire cache from localStorage
const getAlbumArtCache = (): Record<string, string> => {
  try {
    const cacheJson = localStorage.getItem(ALBUM_ART_CACHE_KEY);
    return cacheJson ? JSON.parse(cacheJson) : {};
  } catch (e) {
    console.error('Could not load album art cache from local storage', e);
    return {};
  }
};

// Function to save the entire cache to localStorage
const saveAlbumArtCache = (cache: Record<string, string>): void => {
  try {
    localStorage.setItem(ALBUM_ART_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Could not save album art cache to local storage', e);
  }
};

// Get a specific piece of art from the cache
export const getArtFromCache = (songUrl: string): string | undefined => {
  const cache = getAlbumArtCache();
  return cache[songUrl];
};

// Save a new piece of art to the cache
const saveArtToCache = (songUrl:string, artData: string): void => {
    const cache = getAlbumArtCache();
    cache[songUrl] = artData;
    saveAlbumArtCache(cache);
};

// FIX: Implement and export the missing generateAlbumArt function.
export const generateAlbumArt = async (song: Song): Promise<void> => {
  try {
    // @ts-ignore
    if (!process.env.API_KEY) {
      throw new Error("API key is not configured.");
    }
    
    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `Album cover for a song titled "${song.title}". Style: ${song.style || 'unspecified'}. The art should be vibrant, abstract, and visually interesting. Avoid text.`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      saveArtToCache(song.url, imageUrl);
    } else {
      throw new Error('No image was generated.');
    }
  } catch (error) {
    console.error(`Error generating album art for "${song.title}":`, error);
    saveArtToCache(song.url, 'error'); // Cache error to prevent retries
    throw error; // Re-throw to be caught by the component
  }
};
