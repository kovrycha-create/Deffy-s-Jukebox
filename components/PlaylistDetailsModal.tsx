import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CloseIcon, QueueListIcon, PencilIcon } from './Icons';
import type { UserPlaylist } from '../types';

interface PlaylistDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { id?: string; name: string; description: string }) => void;
  playlistToEdit?: UserPlaylist;
}

const PlaylistDetailsModal: React.FC<PlaylistDetailsModalProps> = ({ isOpen, onClose, onSave, playlistToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const isEditMode = !!playlistToEdit;

  useEffect(() => {
    if (isOpen) {
      setName(isEditMode ? playlistToEdit.name : '');
      setDescription(isEditMode ? playlistToEdit.description || '' : '');
      setTimeout(() => nameInputRef.current?.focus(), 100);
      
      if (modalRef.current && position === null) {
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = modalRef.current;
        setPosition({
          x: (innerWidth - offsetWidth) / 2,
          y: (innerHeight - offsetHeight) / 2,
        });
      }
    } else {
        setPosition(null);
    }
  }, [isOpen, isEditMode, playlistToEdit, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    setPosition({ x: newX, y: newY });
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
    dragOffsetRef.current = {
      x: e.clientX - modalRect.left,
      y: e.clientY - modalRect.top,
    };
    headerRef.current?.classList.add('grabbing');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ id: playlistToEdit?.id, name: name.trim(), description: description.trim() });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="playlist-modal-title">
      <div
        ref={modalRef}
        style={position ? { top: `${position.y}px`, left: `${position.x}px`, transform: 'none' } : { visibility: 'hidden' }}
        className="modal-content w-full max-w-md rounded-lg shadow-2xl flex flex-col animate-fade-in-sm"
        onClick={e => e.stopPropagation()}
      >
        <div
          ref={headerRef}
          onMouseDown={handleMouseDown}
          className="modal-header flex items-center justify-between p-4 border-b border-[var(--surface-active-color)]"
        >
          <h2 id="playlist-modal-title" className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            {isEditMode ? <PencilIcon className="w-6 h-6 text-[var(--accent-highlight)]" /> : <QueueListIcon className="w-6 h-6 text-[var(--accent-highlight)]" />}
            {isEditMode ? 'Edit Playlist Details' : 'Create New Playlist'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-muted)] hover:bg-[var(--surface-hover-color)]"><CloseIcon className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
                <label htmlFor="playlist-name" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Playlist Name</label>
                <input
                  ref={nameInputRef}
                  id="playlist-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Chill Vibes"
                  className="w-full bg-[var(--bg-color)] text-[var(--text-primary)] p-2 border border-[var(--surface-active-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
                  required
                />
            </div>
             <div>
                <label htmlFor="playlist-description" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Description (Optional)</label>
                <textarea
                  id="playlist-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A short description for your playlist..."
                  rows={3}
                  className="w-full bg-[var(--bg-color)] text-[var(--text-primary)] p-2 border border-[var(--surface-active-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all resize-none"
                />
            </div>
          </div>
          <div className="p-4 border-t border-[var(--surface-active-color)] flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover-color)] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="bg-[var(--accent-color)] text-[var(--accent-text-color)] px-6 py-2 rounded-lg font-semibold hover:bg-[var(--accent-hover-color)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode ? 'Save Changes' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlaylistDetailsModal;