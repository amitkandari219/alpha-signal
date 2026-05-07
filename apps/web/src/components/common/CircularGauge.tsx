/**
 * Circular Gauge Component
 *
 * Semi-circle gauge visualization with color zones
 */

import React from 'react';

interface CircularGaugeProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit?: string;
  thresholds: {
    red: [number, number];
    yellow: [number, number];
    green: [number, number];
  };
  size?: number;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  min,
  max,
  label,
  unit = '',
  thresholds,
  size = 120,
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const normalizedValue = Math.min(Math.max(value, min), max);
  const percentage = ((normalizedValue - min) / (max - min)) * 100;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on value and thresholds
  const getColor = () => {
    if (value >= thresholds.green[0] && value <= thresholds.green[1]) {
      return '#26A69A'; // signal-green
    } else if (value >= thresholds.yellow[0] && value <= thresholds.yellow[1]) {
      return '#FFC107'; // signal-yellow
    } else {
      return '#EF5350'; // signal-red
    }
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#30363D"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
            transformOrigin: 'center',
          }}
        />
        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          className="text-2xl font-bold fill-text-primary font-data"
        >
          {value.toFixed(value < 10 ? 2 : 1)}
          {unit}
        </text>
      </svg>
      <div className="text-xs text-text-muted text-center mt-1">{label}</div>
    </div>
  );
};
