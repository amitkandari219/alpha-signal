/**
 * Mini Sparkline Component
 *
 * Tiny SVG line chart showing trend at a glance
 * No axes or labels, just the line
 */

import React from 'react';

export interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showLastValue?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = '#3B82F6', // signal-blue
  showLastValue = false,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-bg-tertiary rounded" />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  // Generate SVG path
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  // Last point for optional dot
  const lastX = width;
  const lastY = height - ((data[data.length - 1] - min) / range) * height;

  return (
    <svg width={width} height={height} className="inline-block">
      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Last value dot */}
      {showLastValue && (
        <circle cx={lastX} cy={lastY} r="3" fill={color} />
      )}
    </svg>
  );
};

export default MiniSparkline;
