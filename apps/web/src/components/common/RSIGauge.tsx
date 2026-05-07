/**
 * RSI Gauge Component
 *
 * Semi-circular gauge with overbought/oversold zones
 */

import React from 'react';

interface RSIGaugeProps {
  value: number;
  size?: number;
}

export const RSIGauge: React.FC<RSIGaugeProps> = ({ value, size = 160 }) => {
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const percentage = value;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on RSI zones
  const getColor = (rsi: number) => {
    if (rsi < 30) return '#26A69A'; // Oversold (green - buying opportunity)
    if (rsi > 70) return '#EF5350'; // Overbought (red - selling pressure)
    return '#FFC107'; // Neutral (yellow)
  };

  const color = getColor(value);
  const zoneLabel =
    value < 30 ? 'Oversold' : value > 70 ? 'Overbought' : 'Neutral';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 20} className="overflow-visible">
        {/* Background zones */}
        <defs>
          <linearGradient id="rsiZones" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#26A69A" /> {/* 0-30 Oversold */}
            <stop offset="30%" stopColor="#26A69A" />
            <stop offset="30%" stopColor="#FFC107" /> {/* 30-70 Neutral */}
            <stop offset="70%" stopColor="#FFC107" />
            <stop offset="70%" stopColor="#EF5350" /> {/* 70-100 Overbought */}
            <stop offset="100%" stopColor="#EF5350" />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
            size - strokeWidth / 2
          } ${size / 2}`}
          fill="none"
          stroke="#30363D"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored arc with zones */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
            size - strokeWidth / 2
          } ${size / 2}`}
          fill="none"
          stroke="url(#rsiZones)"
          strokeWidth={strokeWidth - 4}
          strokeLinecap="round"
          opacity={0.3}
        />

        {/* Value arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
            size - strokeWidth / 2
          } ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
          }}
        />

        {/* Center text */}
        <text
          x={size / 2}
          y={size / 2 - 8}
          textAnchor="middle"
          className="text-3xl font-bold fill-text-primary font-data"
        >
          {value.toFixed(1)}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          className="text-xs fill-text-muted"
        >
          RSI-14
        </text>
      </svg>

      {/* Zone labels */}
      <div className="flex justify-between w-full px-2 mt-2 text-xs text-text-muted">
        <span>0</span>
        <span className="text-signal-green">30</span>
        <span className="text-signal-yellow">50</span>
        <span className="text-signal-red">70</span>
        <span>100</span>
      </div>

      {/* Status badge */}
      <div
        className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
          value < 30
            ? 'bg-signal-green/20 text-signal-green'
            : value > 70
            ? 'bg-signal-red/20 text-signal-red'
            : 'bg-signal-yellow/20 text-signal-yellow'
        }`}
      >
        {zoneLabel}
      </div>
    </div>
  );
};
