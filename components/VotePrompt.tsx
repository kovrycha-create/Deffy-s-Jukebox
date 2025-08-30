
import React from 'react';
import type { Song, VoteData } from '../types';
import { ThumbUpIcon, ThumbDownIcon, CloseIcon, ThumbUpFilledIcon, ThumbDownFilledIcon } from './Icons';

interface VotePromptProps {
  song: Song;
  votes: Record<string, VoteData>;
  onVote: (songUrl: string, voteType: 'up' | 'down') => void;
  onClose: () => void;
}

const VotePrompt: React.FC<VotePromptProps> = ({ song, votes, onVote, onClose }) => {
  const songVoteData = votes[song.url] || { up: 0, down: 0, userVote: null };

  const handleVote = (type: 'up' | 'down') => {
    onVote(song.url, type);
    // Optional: close prompt after voting
    setTimeout(onClose, 500);
  };

  return (
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center animate-fade-in-sm">
      <div className="bg-[var(--surface-color)] p-4 rounded-lg shadow-2xl flex items-center gap-4 border border-[var(--surface-active-color)]">
        <div className="text-center">
            <p className="font-bold text-lg text-[var(--text-primary)]">Did this hit?</p>
            <p className="text-sm text-[var(--text-muted)] truncate max-w-[150px]">{song.title}</p>
        </div>
        <button
          onClick={() => handleVote('up')}
          className={`p-3 rounded-full transition-colors ${songVoteData.userVote === 'up' ? 'bg-green-500/20 text-green-400' : 'hover:bg-green-500/20'}`}
          aria-label="Upvote song"
        >
          {songVoteData.userVote === 'up' ? <ThumbUpFilledIcon className="w-7 h-7" /> : <ThumbUpIcon className="w-7 h-7" />}
        </button>
        <button
          onClick={() => handleVote('down')}
          className={`p-3 rounded-full transition-colors ${songVoteData.userVote === 'down' ? 'bg-red-500/20 text-red-400' : 'hover:bg-red-500/20'}`}
          aria-label="Downvote song"
        >
          {songVoteData.userVote === 'down' ? <ThumbDownFilledIcon className="w-7 h-7" /> : <ThumbDownIcon className="w-7 h-7" />}
        </button>
         <div className="h-8 w-px bg-[var(--surface-active-color)] mx-2"></div>
         <button onClick={onClose} className="p-2 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]" aria-label="Close prompt">
            <CloseIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default VotePrompt;