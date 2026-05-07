/**
 * Circular Score Gauge Component
 *
 * SVG-based circular gauge with animated arc
 * Color-coded by score: 0-30 red, 31-60 yellow, 61-100 green
 * Optional methodology tooltip for SEBI compliance
 */

import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CircularScoreGaugeProps {
  score: number; // 0-100
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showMethodologyLink?: boolean; // Show info icon with methodology link
  methodologySection?: string; // Optional section anchor (e.g., "quality-score")
}

export const CircularScoreGauge: React.FC<CircularScoreGaugeProps> = ({
  score,
  label,
  size = 'md',
  showMethodologyLink = false,
  methodologySection,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { diameter: 80, strokeWidth: 8, fontSize: '1.5rem', labelSize: 'text-xs' },
    md: { diameter: 120, strokeWidth: 12, fontSize: '2rem', labelSize: 'text-sm' },
    lg: { diameter: 160, strokeWidth: 16, fontSize: '2.5rem', labelSize: 'text-base' },
  };

  const config = sizeConfig[size];
  const radius = (config.diameter - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = config.diameter / 2;

  // Animate score on mount
  useEffect(() => {
    const duration = 600; // ms
    const steps = 60;
    const increment = score / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedScore(Math.min(currentStep * increment, score));

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // Color based on score
  const getScoreColor = (value: number) => {
    if (value <= 30) return '#F85149'; // signal-red
    if (value <= 60) return '#FBB80E'; // signal-yellow
    return '#3CD280'; // signal-green
  };

  const strokeColor = getScoreColor(score);

  // Calculate arc offset for animation
  const progress = (animatedScore / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center">
      <svg width={config.diameter} height={config.diameter} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={config.strokeWidth}
        />

        {/* Foreground arc (animated) */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 600ms ease-out',
          }}
        />

        {/* Score text in center (rotate back to normal) */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text-primary font-bold transform rotate-90"
          style={{
            fontSize: config.fontSize,
            transformOrigin: `${center}px ${center}px`,
          }}
        >
          {Math.round(animatedScore)}
        </text>
      </svg>

      {/* Label below gauge */}
      <div className="flex items-center gap-1 mt-2">
        <span className={`${config.labelSize} text-text-secondary text-center`}>
          {label}
        </span>

        {/* Methodology Link Icon - SEBI Compliance */}
        {showMethodologyLink && (
          <div className="relative">
            <Link
              to={methodologySection ? `/methodology#${methodologySection}` : '/methodology'}
              className="inline-flex items-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <Info className="w-3.5 h-3.5 text-text-muted hover:text-signal-blue transition-colors cursor-pointer" />
            </Link>

            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg shadow-lg whitespace-nowrap z-50">
                <p className="text-xs text-text-primary">
                  Learn about our scoring methodology
                </p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-bg-tertiary border-r border-b border-border-primary transform rotate-45"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CircularScoreGauge;
