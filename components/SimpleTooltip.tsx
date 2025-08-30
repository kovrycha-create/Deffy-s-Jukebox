import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SimpleTooltipProps {
  label: string;
  children: React.ReactNode;
}

const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ label, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const timeoutId = useRef<number | null>(null);
  const spanRef = useRef<HTMLSpanElement>(null);

  const handleMouseEnter = () => {
    // Clear any existing timeout to prevent multiple tooltips from appearing on fast hovers
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
    }

    timeoutId.current = window.setTimeout(() => {
      if (spanRef.current) {
        const rect = spanRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top, // Use rect.top which is relative to viewport
          left: rect.left + rect.width / 2,
        });
        setIsVisible(true);
      }
    }, 1500); // 1.5s delay
  };

  const handleMouseLeave = () => {
    if (timeoutId.current) {
      window.clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
    setIsVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        window.clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const TooltipPortal = () => {
    if (!isVisible || !coords) return null;
    
    const tooltipStyle: React.CSSProperties = {
      position: 'fixed',
      top: `${coords.top}px`,
      left: `${coords.left}px`,
      transform: 'translate(-50%, -100%) translateY(-8px)', // Position above and centered
      pointerEvents: 'none',
      zIndex: 9999, // Ensure it's on top
    };

    return createPortal(
      <div 
        style={tooltipStyle}
        className="px-2 py-1 bg-[var(--surface-color)] text-[var(--text-primary)] text-xs font-semibold rounded-md shadow-lg whitespace-nowrap border border-[var(--surface-active-color)] animate-fade-in-sm"
        role="tooltip"
      >
        {label}
      </div>,
      document.body
    );
  };

  return (
    <span 
      ref={spanRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <TooltipPortal />
    </span>
  );
};

export default SimpleTooltip;
