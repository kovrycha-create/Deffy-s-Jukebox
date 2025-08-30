
import React from 'react';
import type { CrowdMarker } from '../types';

interface ProgressBarHeatmapProps {
  duration: number;
  markers: CrowdMarker[];
}

const ProgressBarHeatmap: React.FC<ProgressBarHeatmapProps> = ({ duration, markers }) => {
  if (!markers || markers.length === 0 || !duration) {
    return null;
  }

  const segmentCount = 100; // Divide the timeline into 100 segments
  const segmentDuration = duration / segmentCount;
  const segments = new Array(segmentCount).fill(0);

  markers.forEach(marker => {
    const segmentIndex = Math.floor(marker.timestamp / segmentDuration);
    if (segmentIndex >= 0 && segmentIndex < segmentCount) {
      segments[segmentIndex]++;
    }
  });

  const maxMarkersInSegment = Math.max(...segments, 1);

  return (
    <div className="absolute inset-0 h-full flex pointer-events-none rounded-lg overflow-hidden" aria-hidden="true">
      {segments.map((count, index) => {
        const intensity = count > 0 ? Math.min(count / maxMarkersInSegment, 1) : 0;
        if (intensity === 0) return null;
        
        return (
          <div
            key={index}
            className="h-full"
            style={{
              width: `${100 / segmentCount}%`,
              backgroundColor: `var(--accent-highlight)`,
              opacity: 0.05 + intensity * 0.25, // Opacity from 5% to 30%
            }}
          />
        );
      })}
    </div>
  );
};

export default ProgressBarHeatmap;