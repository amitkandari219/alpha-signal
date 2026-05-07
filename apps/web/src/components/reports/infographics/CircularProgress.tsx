/**
 * Circular Progress Component
 *
 * Beautiful circular progress indicator with gradient colors
 * Similar to the monsoon infographic style
 */

import React from 'react';

interface CircularProgressProps {
  percentage: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple' | 'gradient';
  showPercentage?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  sublabel,
  color = 'blue',
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const center = size / 2;

  // Color mapping with gradients
  const colorMap = {
    green: {
      stroke: 'url(#gradient-green)',
      bg: '#10b981',
      light: '#d1fae5',
    },
    yellow: {
      stroke: 'url(#gradient-yellow)',
      bg: '#f59e0b',
      light: '#fef3c7',
    },
    red: {
      stroke: 'url(#gradient-red)',
      bg: '#ef4444',
      light: '#fee2e2',
    },
    blue: {
      stroke: 'url(#gradient-blue)',
      bg: '#3b82f6',
      light: '#dbeafe',
    },
    purple: {
      stroke: 'url(#gradient-purple)',
      bg: '#a855f7',
      light: '#f3e8ff',
    },
    gradient: {
      stroke: 'url(#gradient-multi)',
      bg: '#6366f1',
      light: '#e0e7ff',
    },
  };

  const colors = colorMap[color];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Define gradients */}
          <defs>
            <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
            <linearGradient id="gradient-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="gradient-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
            <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <linearGradient id="gradient-multi" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border-default opacity-20"
          />

          {/* Progress circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.3))',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage && (
            <div className="text-3xl font-bold" style={{ color: colors.bg }}>
              {Math.round(percentage)}
            </div>
          )}
          {label && (
            <div className="text-xs font-medium text-text-secondary mt-1 text-center px-2">
              {label}
            </div>
          )}
        </div>
      </div>

      {/* Sublabel */}
      {sublabel && (
        <div className="text-sm text-text-muted mt-2 text-center">{sublabel}</div>
      )}
    </div>
  );
};

/**
 * Circular Score Card - Combines multiple circular progress indicators
 */
interface CircularScoreCardProps {
  scores: Array<{
    label: string;
    value: number;
    color: 'green' | 'yellow' | 'red' | 'blue' | 'purple';
    icon?: React.ReactNode;
  }>;
  title?: string;
}

export const CircularScoreCard: React.FC<CircularScoreCardProps> = ({ scores, title }) => {
  return (
    <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl p-6 border border-border-default">
      {title && (
        <h4 className="text-lg font-bold mb-6 text-center">{title}</h4>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {scores.map((score, idx) => (
          <div key={idx} className="flex flex-col items-center">
            <CircularProgress
              percentage={score.value}
              size={100}
              strokeWidth={6}
              label={score.label}
              color={score.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
