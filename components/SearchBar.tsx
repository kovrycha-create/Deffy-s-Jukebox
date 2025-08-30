
import React from 'react';
import { SearchIcon } from './Icons';

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onQueryChange }) => {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <SearchIcon className="w-5 h-5 text-[var(--text-muted)]" />
      </span>
      <input
        type="text"
        placeholder="Filter by title..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full pl-11 pr-4 py-2 bg-[var(--surface-color)] text-[var(--text-primary)] border border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
        aria-label="Filter songs by title"
      />
    </div>
  );
};

export default SearchBar;
