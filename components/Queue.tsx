
import React, { useRef, useState } from 'react';
import type { Song } from '../types';
import { MusicNoteIcon, CloseIcon, DragHandleIcon, QueueListIcon, TrashIcon } from './Icons';
import { formatTime } from '../utils/parser';

interface QueueProps {
  upNextQueue: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSongSelect: (song: Song) => void;
  onReorder: (dragIndex: number, hoverIndex: number) => void;
  onRemove: (song: Song) => void;
  onClearQueue: () => void;
}

const Queue: React.FC<QueueProps> = ({ upNextQueue, onSongSelect, onReorder, onRemove, onClearQueue }) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [removingSongs, setRemovingSongs] = useState<Set<string>>(new Set());
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };
  
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
        onReorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleStartRemove = (song: Song) => {
    setRemovingSongs(prev => new Set(prev).add(song.url));
  };

  const hasVisibleContent = upNextQueue.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-2 relative">
          {hasVisibleContent ? (
            <>
              <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={onClearQueue}
                    className="p-1.5 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)] hover:text-[var(--accent-hover-color)] transition-colors duration-200"
                    aria-label="Clear the Up Next queue"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
              </div>
              <ul className="space-y-1 mt-8">
              {upNextQueue.map((song, i) => {
                const durationText = formatTime(song.duration);
                return (
                  <li 
                      key={`${song.url}-${i}`}
                      className={`flex items-center group rounded-md transition-colors duration-200 hover:bg-[var(--surface-hover-color)] ${
                          dragItem.current === i ? 'opacity-40' : 'opacity-100'
                      } ${removingSongs.has(song.url) ? 'animate-slide-out' : ''}`}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      onAnimationEnd={() => {
                          if (removingSongs.has(song.url)) {
                              onRemove(song);
                              setRemovingSongs(prev => {
                                  const next = new Set(prev);
                                  next.delete(song.url);
                                  return next;
                              });
                          }
                      }}
                  >
                    <div
                      className="text-[var(--text-muted)] cursor-grab touch-none w-8 h-full flex items-center justify-center flex-shrink-0"
                      aria-label="Drag to reorder"
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                    >
                        <DragHandleIcon className="w-5 h-5"/>
                    </div>
                    <div className="relative flex-grow h-full flex items-center overflow-hidden">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartRemove(song);
                            }}
                            aria-label="Remove from queue"
                            className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center bg-[var(--heart-color)] text-white transition-opacity duration-300 ease-in-out opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-l-md"
                        >
                            <CloseIcon className="w-5 h-5" />
                        </button>
                        <div
                          onClick={() => onSongSelect(song)}
                          className="w-full text-left py-2 pl-3 pr-2 flex items-center gap-3 transition-transform duration-300 ease-in-out group-hover:translate-x-10 cursor-pointer text-[var(--text-secondary)]"
                          role="button"
                          tabIndex={0}
                        >
                          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                              <MusicNoteIcon className="w-4 h-4 text-[var(--text-muted)]" />
                          </div>
                          <div className="flex-1 truncate flex justify-between items-baseline text-sm">
                            <span className="truncate group-hover:text-[var(--text-primary)] transition-colors">{song.title}</span>
                            {durationText && (
                                <span className="ml-1.5 text-xs text-[var(--text-muted)] font-mono flex-shrink-0">
                                    ({durationText})
                                </span>
                            )}
                          </div>
                        </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] text-center px-4">
                  <QueueListIcon className="w-12 h-12 mb-4 text-[var(--surface-active-color)]"/>
                  <p className="font-semibold text-base text-[var(--text-secondary)]">Your queue is empty</p>
                  <p className="text-sm">Use a song's context menu to add it to the queue.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default Queue;
