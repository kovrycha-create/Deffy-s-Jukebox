import React, { useState, useEffect } from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string;
  onRemove: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({ message, onRemove, className }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, 2500); // Start exit animation before removal

    return () => clearTimeout(timer);
  }, []);

  const handleAnimationEnd = () => {
    if (isExiting) {
      onRemove();
    }
  };

  return (
    <div
      onAnimationEnd={handleAnimationEnd}
      className={`flex items-center gap-3 py-2 px-4 rounded-full bg-[var(--surface-color)] text-[var(--text-primary)] shadow-lg shadow-[var(--shadow-color)] border border-[var(--surface-active-color)] ${isExiting ? 'toast-anim-out' : 'toast-anim-in'} ${className || ''}`}
      role="status"
      aria-live="polite"
    >
      <CheckIcon className="w-5 h-5 text-[var(--accent-highlight)]" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

export default Toast;