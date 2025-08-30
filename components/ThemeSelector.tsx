import React, { useState, useRef, useEffect } from 'react';
import { PaletteIcon } from './Icons';

interface Theme {
  key: string;
  name: string;
  locked: boolean;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedTheme: string;
  onChangeTheme: (theme: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, selectedTheme, onChangeTheme }) => {
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
  }, [wrapperRef]);

  const handleThemeChange = (themeKey: string) => {
    onChangeTheme(themeKey);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--accent-color)]"
        aria-label="Select Theme"
      >
        <PaletteIcon className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--surface-color)] border border-[var(--surface-active-color)] rounded-lg shadow-2xl z-20 origin-top-right animate-fade-in-sm">
          <ul className="p-1">
            {themes.map((theme) => {
              const isSelected = selectedTheme === theme.key;
              const isBlingUnlocked = theme.key === 'bling' && !theme.locked;
              
              return (
                <li key={theme.key}>
                  <button
                    onClick={() => handleThemeChange(theme.key)}
                    disabled={theme.locked}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors duration-150 relative ${
                      isSelected
                        ? 'bg-[var(--accent-color)] text-[var(--accent-text-color)] font-semibold'
                        : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover-color)]'
                    } ${theme.locked ? 'theme-item-locked' : ''} ${isBlingUnlocked ? 'theme-item-bling-unlocked' : ''}`}
                  >
                    {theme.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;