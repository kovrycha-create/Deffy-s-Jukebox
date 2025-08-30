
import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ data, width = 100, height = 30, className }) => {
  if (!data || data.length < 2) {
    return <div className={className} style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="text-xs text-[var(--text-muted)]">Not enough data</span></div>;
  }

  const maxVal = Math.max(...data, 1); // Ensure maxVal is at least 1 to avoid division by zero
  const minVal = 0;
  const range = maxVal - minVal;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (range > 0 ? ((d - minVal) / range) * (height - 4) : height / 2) - 2; // -2 for padding
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');
  
  const lastPoint = points.split(' ').pop()?.split(',');
  const lastX = lastPoint ? parseFloat(lastPoint[0]) : 0;
  const lastY = lastPoint ? parseFloat(lastPoint[1]) : 0;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke="var(--accent-highlight)"
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="2" fill="var(--accent-highlight)" />
    </svg>
  );
};

export default Sparkline;