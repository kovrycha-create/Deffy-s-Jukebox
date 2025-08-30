
import React, { useState, useRef, useEffect } from 'react';
import type { SortMode } from '../types';
import { BarsArrowDownIcon, ChevronDownIcon } from './Icons';

interface SortMenuProps {
  currentSort: SortMode;
  onSortChange: (mode: SortMode) => void;
  disabled: boolean;
}

const SORT_OPTIONS: { [key in SortMode]: string } = {
  'default': 'Default Order',
  'title-asc': 'Title (A-Z)',
  'title-desc': 'Title (Z-A)',
  'duration-asc': 'Duration (Shortest)',
  'duration-desc': 'Duration (Longest)',
  'bpm-asc': 'BPM (Lowest)',
  'bpm-desc': 'BPM (Highest)',
  'style-asc': 'Style (A-Z)',
  'style-desc': 'Style (Z-A)',
  'play-count-asc': 'Play Count (Lowest)',
  'play-count-desc': 'Play Count (Highest)',
  'rating-desc': 'Rating (Highest)',
};

const SortMenu: React.FC<SortMenuProps> = ({ currentSort, onSortChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortChange = (mode: SortMode) => {
    onSortChange(mode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--surface-color)] focus:ring-[var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Sort playlist"
        aria-haspopup="true"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <BarsArrowDownIcon className="w-5 h-5" />
        <span className="text-sm font-medium">{SORT_OPTIONS[currentSort]}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--surface-color)] border border-[var(--surface-active-color)] rounded-lg shadow-2xl z-20 origin-top-right animate-fade-in-sm">
          <ul className="p-1" role="menu">
            {Object.entries(SORT_OPTIONS).map(([key, name]) => (
              <li key={key}>
                <button
                  onClick={() => handleSortChange(key as SortMode)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 ${
                    currentSort === key
                      ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] font-semibold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)]'
                  }`}
                  role="menuitem"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SortMenu;