
import React from 'react';
import { StarFilledIcon } from './Icons';
import { formatTime } from '../utils/parser';

interface TopMomentsProps {
  moments: { time: number; count: number }[];
  onSeek: (time: number) => void;
}

const TopMoments: React.FC<TopMomentsProps> = ({ moments, onSeek }) => {
  if (moments.length === 0) {
    return null;
  }

  return (
    <div className="bg-black/20 p-4 rounded-lg border border-white/10 mt-4">
      <h3 className="text-lg font-bold text-white/90 mb-3 flex items-center gap-2">
        <StarFilledIcon className="w-5 h-5 text-[var(--accent-highlight)]" />
        Top Moments
      </h3>
      <ul className="space-y-2">
        {moments.map(({ time, count }) => (
          <li key={time}>
            <button
              onClick={() => onSeek(time)}
              className="flex items-center justify-between w-full text-left p-2 rounded-md hover:bg-white/10 transition-colors"
            >
              <span className="font-semibold text-white/80">{formatTime(time)}</span>
              <div className="flex items-center gap-1 text-sm text-yellow-400">
                <StarFilledIcon className="w-4 h-4" />
                <span>{count}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopMoments;