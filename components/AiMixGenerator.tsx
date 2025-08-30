import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Song } from '../types';
import { CloseIcon, WandSparklesIcon } from './Icons';

interface AiMixGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onMixGenerated: (mix: Song[], prompt: string) => void;
}

const SUGGESTIONS = [
    "Upbeat Pop",
    "Focus Music",
    "Workout Energy",
    "Late Night Vibes",
    "Indie Chill",
    "Heavy Metal",
];

const AiMixGenerator: React.FC<AiMixGeneratorProps> = ({ isOpen, onClose, songs, onMixGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && modalRef.current && position === null) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = modalRef.current;
      setPosition({ x: (innerWidth - offsetWidth) / 2, y: (innerHeight - offsetHeight) / 2 });
    } else if (!isOpen) {
        setPosition(null);
    }
  }, [isOpen, position]);

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
    if (!prompt.trim()) {
      setError("Please enter a description for your mix.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Simulate async operation for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
        const lowerCasePrompt = prompt.toLowerCase();
        let filtered = [...songs];

        const keywords: Record<string, (s: Song) => boolean | undefined> = {
            'rock': (s) => s.style?.toLowerCase().includes('rock') || s.style?.toLowerCase().includes('metal') || s.style?.toLowerCase().includes('punk'),
            'pop': (s) => s.style?.toLowerCase().includes('pop'),
            'electronic': (s) => ['electronic', 'edm', 'house', 'trance', 'dance'].some(term => s.style?.toLowerCase().includes(term)),
            'hip-hop': (s) => s.style?.toLowerCase().includes('hip-hop') || s.style?.toLowerCase().includes('rap'),
            'rap': (s) => s.style?.toLowerCase().includes('hip-hop') || s.style?.toLowerCase().includes('rap'),
            'indie': (s) => s.style?.toLowerCase().includes('indie'),
            'metal': (s) => s.style?.toLowerCase().includes('metal'),
            'country': (s) => s.style?.toLowerCase().includes('country'),
            'fast': (s) => s.bpm != null && s.bpm >= 140,
            'upbeat': (s) => s.bpm != null && s.bpm >= 120,
            'energetic': (s) => s.bpm != null && s.bpm >= 130,
            'slow': (s) => s.bpm != null && s.bpm < 90,
            'chill': (s) => s.bpm != null && s.bpm <= 110,
            'relaxing': (s) => s.bpm != null && s.bpm < 100,
            'workout': (s) => s.bpm != null && s.bpm >= 135,
            'focus': (s) => s.bpm != null && s.bpm >= 70 && s.bpm <= 100 && (s.style?.toLowerCase().includes('ambient') || s.style?.toLowerCase().includes('instrumental')),
        };

        const appliedFilters: ((s: Song) => boolean | undefined)[] = [];
        for (const [key, filterFn] of Object.entries(keywords)) {
            if (lowerCasePrompt.includes(key)) {
                appliedFilters.push(filterFn);
            }
        }

        if (appliedFilters.length > 0) {
            filtered = filtered.filter(song => appliedFilters.some(filterFn => filterFn(song)));
        }

        if (filtered.length === 0) {
             setError("Couldn't find any matching songs. Please try a different prompt!");
             setIsLoading(false);
             return;
        }

        const mix = filtered.sort(() => 0.5 - Math.random()).slice(0, 20);
        onMixGenerated(mix, prompt);
        setPrompt('');

    } catch (e) {
        console.error("Local Mix generation failed:", e);
        setError("Sorry, something went wrong while generating the mix. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ai-mix-title">
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
          <h2 id="ai-mix-title" className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <WandSparklesIcon className="w-6 h-6 text-[var(--accent-highlight)]" />
            Create an Instant Mix
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          <p className="text-[var(--text-secondary)] mb-4">
            Describe the kind of music you want to hear. A custom playlist will be generated for you from the jukebox library.
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Energetic rock songs for a workout..."
            className="w-full h-24 bg-[var(--bg-color)] text-[var(--text-primary)] p-3 border border-[var(--surface-active-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
            aria-label="Describe your desired music mix"
            disabled={isLoading}
          />

          <div className="my-4">
            <p className="text-sm text-[var(--text-muted)] mb-2">Or try one of these ideas:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-[var(--surface-hover-color)] text-sm text-[var(--text-secondary)] rounded-full hover:bg-[var(--surface-active-color)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          {error && <p className="text-red-400 text-sm my-4">{error}</p>}

        </div>
        <div className="p-4 border-t border-[var(--surface-active-color)] flex justify-end gap-4">
            <button
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-2 rounded-lg font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-all disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                onClick={handleGenerate}
                disabled={isLoading || !prompt.trim()}
                className="bg-[var(--accent-color)] text-[var(--accent-text-color)] px-6 py-2 rounded-lg font-semibold hover:bg-[var(--accent-hover-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed w-40 text-center"
            >
                {isLoading ? (
                    <div className="flex justify-center items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        <span>Generating...</span>
                    </div>
                ) : 'Generate Mix'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AiMixGenerator;