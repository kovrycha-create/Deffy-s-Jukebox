
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Song } from '../types';
import { songMetadata as existingSongMetadata } from '../song-data';
import { CloseIcon } from './Icons';

interface MetadataGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
}

const MetadataGenerator: React.FC<MetadataGeneratorProps> = ({ isOpen, onClose, songs }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const [generatedData, setGeneratedData] = useState('');
  const [songsToProcess, setSongsToProcess] = useState<Song[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      const missing = songs.filter(song => {
        if (song.url.includes('/classics/')) return false;
        const meta = existingSongMetadata[song.url];
        return !meta || meta.bpm === null || meta.style === null;
      });
      setSongsToProcess(missing);
      setTotalToProcess(missing.length);
      setProcessedCount(0);
      setGeneratedData('');
      setIsProcessing(false);
      
      if (modalRef.current && position === null) {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = modalRef.current;
        setPosition({ x: (innerWidth - offsetWidth) / 2, y: (innerHeight - offsetHeight) / 2 });
      }
    } else {
        setPosition(null);
    }
  }, [isOpen, songs, position]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPosition({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    headerRef.current?.classList.remove('grabbing');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!modalRef.current) return;
    isDraggingRef.current = true;
    const modalRect = modalRef.current.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - modalRect.left, y: e.clientY - modalRect.top };
    headerRef.current?.classList.add('grabbing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);


  const handleGenerate = async () => {
    if (songsToProcess.length === 0) {
      alert("No songs with missing metadata found!");
      return;
    }

    setIsProcessing(true);
    setGeneratedData('');

    // @ts-ignore
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const updatedMetadata = { ...existingSongMetadata };

    for (const song of songsToProcess) {
      try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Analyze the song title "${song.title}" and provide its estimated BPM (beats per minute) and musical style. Respond in JSON format. If a value cannot be determined, use null.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        bpm: { type: Type.INTEGER, description: 'The estimated beats per minute.', nullable: true },
                        style: { type: Type.STRING, description: 'The musical style or genre.', nullable: true }
                    },
                },
            },
        });
        const jsonText = response.text.trim();
        const data = JSON.parse(jsonText) as { bpm?: number | null; style?: string | null };
        const existingMeta = updatedMetadata[song.url];

        updatedMetadata[song.url] = {
            ...(existingMeta || {}),
            bpm: ('bpm' in data) ? data.bpm : (existingMeta?.bpm ?? null),
            style: ('style' in data) ? data.style : (existingMeta?.style ?? null),
        };
      } catch (error) {
        console.error(`Failed to process song: ${song.title}`, error);
        if (!updatedMetadata[song.url]) {
          updatedMetadata[song.url] = { bpm: null, style: null };
        }
      }
      setProcessedCount(prev => prev + 1);
    }

    for (const song of songs) {
        if (!song.url.includes('/classics/') && !updatedMetadata[song.url]) {
            updatedMetadata[song.url] = { bpm: null, style: null };
        }
    }

    let output = `type SongMetadata = {\n  bpm: number | null;\n  style: string | null;\n  coverArtUrl?: string;\n  description?: string;\n};\n\nexport const songMetadata: Record<string, SongMetadata> = {\n`;
    const sortedUrls = Object.keys(updatedMetadata).sort();
    for (const url of sortedUrls) {
      const meta = updatedMetadata[url];
      
      const parts = [];
      parts.push(`"bpm": ${meta.bpm === null ? 'null' : meta.bpm}`);
      parts.push(`"style": ${meta.style === null ? 'null' : `"${meta.style.replace(/"/g, '\\"')}"`}`);
      if (meta.coverArtUrl) {
        parts.push(`"coverArtUrl": "${meta.coverArtUrl}"`);
      }
      if (meta.description) {
        parts.push(`"description": ${JSON.stringify(meta.description)}`);
      }

      output += `  "${url}": { ${parts.join(', ')} },\n`;
    }
    output += `};`;
    setGeneratedData(output);
    setIsProcessing(false);
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(generatedData).then(() => {
        alert('Copied to clipboard!');
    }, (err) => {
        console.error('Could not copy text: ', err);
        alert('Failed to copy to clipboard.');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        ref={modalRef}
        style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none', position: 'fixed' } : { visibility: 'hidden' }}
        className="bg-[var(--surface-color)] w-full max-w-2xl max-h-[90vh] rounded-lg shadow-2xl flex flex-col animate-fade-in-sm"
        onClick={e => e.stopPropagation()}
      >
        <div
          ref={headerRef}
          onMouseDown={handleMouseDown}
          className="modal-header flex items-center justify-between p-4 border-b border-[var(--surface-active-color)]"
        >
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Fill Missing Song Data</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-[var(--text-secondary)] mb-4">
            This tool will find songs (excluding the "Classics" collection) with missing BPM or Style information and use AI to fill them in.
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Found <span className="font-bold text-[var(--accent-highlight)]">{totalToProcess}</span> songs that need metadata.
          </p>

          {!generatedData && (
            <div className="flex flex-col items-center">
              <button
                onClick={handleGenerate}
                disabled={isProcessing || totalToProcess === 0}
                className="bg-[var(--accent-color)] text-[var(--accent-text-color)] px-6 py-2 rounded-lg font-semibold hover:bg-[var(--accent-hover-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Start Generating'}
              </button>
              {isProcessing && (
                <div className="w-full mt-4 text-center">
                  <div className="w-full bg-[var(--surface-active-color)] rounded-full h-2.5">
                    <div className="bg-[var(--accent-color)] h-2.5 rounded-full" style={{ width: `${(processedCount / totalToProcess) * 100}%` }}></div>
                  </div>
                  <p className="text-sm mt-2 text-[var(--text-muted)]">{processedCount} / {totalToProcess} songs processed</p>
                </div>
              )}
            </div>
          )}
          
          {generatedData && (
            <div>
                <p className="text-[var(--text-secondary)] mb-2">Generation complete! Copy the text below and replace the entire content of your <code className="bg-[var(--surface-active-color)] px-1 py-0.5 rounded text-sm text-[var(--accent-highlight)]">song-data.ts</code> file.</p>
                <textarea
                    readOnly
                    value={generatedData}
                    className="w-full h-64 bg-[var(--bg-color)] text-[var(--text-secondary)] font-mono text-xs p-2 border border-[var(--surface-active-color)] rounded-md"
                    aria-label="Generated song data"
                />
                <button
                    onClick={handleCopyToClipboard}
                    className="mt-4 bg-[var(--accent-color)] text-[var(--accent-text-color)] px-6 py-2 rounded-lg font-semibold hover:bg-[var(--accent-hover-color)] transition-all"
                >
                    Copy to Clipboard
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetadataGenerator;