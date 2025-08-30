
import React from 'react';

interface TooltipProps {
  label: string;
  hotkey: string;
  children: React.ReactElement;
}

const Tooltip: React.FC<TooltipProps> = ({ label, hotkey, children }) => {
  return (
    <div className="relative group flex items-center justify-center">
      {children}
      <div className="tooltip-container" role="tooltip">
        {label}
        <kbd>{hotkey}</kbd>
      </div>
    </div>
  );
};

export default Tooltip;