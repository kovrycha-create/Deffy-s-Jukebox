import React from 'react';
import type { Song } from '../types';
import SearchBar from './SearchBar';
import ThemeSelector from './ThemeSelector';
import { Cog6ToothIcon, QuestionMarkCircleIcon, Bars3Icon } from './Icons';

interface Theme {
  key: string;
  name: string;
  locked: boolean;
}

interface HeaderProps {
    searchQuery: string;
    onQueryChange: (query: string) => void;
    themes: Theme[];
    userThemeSelection: string;
    onChangeTheme: (theme: string) => void;
    onOpenSettings: () => void;
    onStartTutorial: () => void;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
    searchQuery, onQueryChange, themes, userThemeSelection, onChangeTheme, onOpenSettings, onStartTutorial, onToggleSidebar
}) => {
    return (
        <header className="p-2 md:p-4 bg-[var(--surface-color)]/80 backdrop-blur-sm sticky top-0 z-20 shadow-lg shadow-black/20 flex items-center justify-between gap-4">
            <div className="header-desktop-w-1/3 flex items-center gap-2 header-mobile-flex-1">
                <button
                    onClick={onToggleSidebar}
                    className="mobile-only p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-all duration-200"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <div className="header-search-container">
                    <SearchBar query={searchQuery} onQueryChange={onQueryChange} />
                </div>
            </div>
            <div className="header-desktop-w-1/3 flex justify-center header-center-logo">
                <img src="https://deffy.me/media/deffysjukebox.png" alt="Deffy's Jukebox Logo" className="h-10 object-contain" />
            </div>
            <div className="header-desktop-w-1/3 flex justify-end items-center gap-1 md:gap-2" data-tutorial-id="header-actions">
                <ThemeSelector
                    themes={themes}
                    selectedTheme={userThemeSelection}
                    onChangeTheme={onChangeTheme}
                />
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--accent-color)]"
                    aria-label="Open Settings"
                >
                    <Cog6ToothIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={onStartTutorial}
                    className="p-2 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--text-primary)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-color)] focus:ring-[var(--accent-color)]"
                    aria-label="Replay Tutorial"
                >
                    <QuestionMarkCircleIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};

export default Header;