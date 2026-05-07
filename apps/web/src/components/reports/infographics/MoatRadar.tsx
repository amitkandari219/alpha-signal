/**
 * Moat Radar Component
 *
 * Visual pentagon radar chart explaining competitive advantages
 * Uses SIMPLE language that beginner investors can understand
 */

import React, { useState } from 'react';
import {
  Shield,
  Users,
  Award,
  DollarSign,
  Lock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from 'lucide-react';
import { CircularProgress } from './CircularProgress';

export interface MoatDimension {
  name: string;
  score: number; // 0-10
  explanation: string;
  evidence: string[];
  analogy: string;
  icon: React.ReactNode;
}

export interface MoatAnalysis {
  overallScore: number; // 0-10
  dimensions: {
    networkEffects: MoatDimension;
    brandPower: MoatDimension;
    costAdvantage: MoatDimension;
    switchingCosts: MoatDimension;
    scaleEconomies: MoatDimension;
  };
  interpretation: string;
  summary: string;
}

interface MoatRadarProps {
  analysis: MoatAnalysis;
  companyName: string;
}

export const MoatRadar: React.FC<MoatRadarProps> = ({
  analysis,
  companyName,
}) => {
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const dimensions = [
    analysis.dimensions.networkEffects,
    analysis.dimensions.brandPower,
    analysis.dimensions.costAdvantage,
    analysis.dimensions.switchingCosts,
    analysis.dimensions.scaleEconomies,
  ];

  // Calculate pentagon points for radar chart
  const calculatePentagonPoints = (scores: number[]) => {
    const centerX = 150;
    const centerY = 150;
    const maxRadius = 120;
    const angleStep = (2 * Math.PI) / 5;
    const startAngle = -Math.PI / 2; // Start at top

    return scores.map((score, index) => {
      const angle = startAngle + index * angleStep;
      const radius = (score / 10) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    });
  };

  // Get background pentagon (10/10 reference)
  const maxPoints = calculatePentagonPoints([10, 10, 10, 10, 10]);
  const maxPath = maxPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Get actual score pentagon
  const actualPoints = calculatePentagonPoints(dimensions.map(d => d.score));
  const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Get grid lines (2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-signal-green';
    if (score >= 7) return 'text-chart-up';
    if (score >= 5) return 'text-signal-yellow';
    if (score >= 3) return 'text-signal-red';
    return 'text-text-muted';
  };

  const getScoreBg = (score: number) => {
    if (score >= 9) return 'bg-signal-green/20 border-signal-green';
    if (score >= 7) return 'bg-chart-up/20 border-chart-up';
    if (score >= 5) return 'bg-signal-yellow/20 border-signal-yellow';
    if (score >= 3) return 'bg-signal-red/20 border-signal-red';
    return 'bg-text-muted/20 border-text-muted';
  };

  const getStrengthLabel = (score: number) => {
    if (score >= 9) return 'Exceptional';
    if (score >= 7) return 'Strong';
    if (score >= 5) return 'Moderate';
    if (score >= 3) return 'Weak';
    return 'No Moat';
  };

  const getInterpretation = (score: number) => {
    if (score >= 9) return 'Warren Buffett would love this company. Nearly impossible for competitors to take market share.';
    if (score >= 7) return 'Strong competitive advantages. Good long-term investment protection.';
    if (score >= 5) return 'Average protection. Some competitive advantages but not exceptional.';
    if (score >= 3) return 'Vulnerable to competition. Competitors can easily challenge this business.';
    return 'Commodity business. No real competitive advantages. Customers buy based on price alone.';
  };

  return (
    <div className="space-y-6">
      {/* What is a Moat? Explainer */}
      <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10 border-2 border-blue-500/40 rounded-xl p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              What is a "Moat"?
              <button
                onMouseEnter={() => setShowTooltip('moat')}
                onMouseLeave={() => setShowTooltip(null)}
                className="relative"
              >
                <HelpCircle className="w-5 h-5 text-text-muted hover:text-blue-400 transition-colors" />
                {showTooltip === 'moat' && (
                  <div className="absolute left-0 top-6 w-64 bg-bg-tertiary border border-border-default rounded-lg p-3 text-xs text-text-secondary z-10 shadow-xl">
                    Term coined by Warren Buffett. Companies with strong moats can maintain high profits for many years.
                  </div>
                )}
              </button>
            </h3>
            <p className="text-text-secondary leading-relaxed">
              A moat is like a castle's protective water barrier - it keeps competitors away.
              Companies with strong moats can charge higher prices and maintain market share
              even when new competitors try to enter the market.
            </p>
          </div>
        </div>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-bg-secondary via-bg-secondary to-purple-900/10 border-2 border-purple-500/30 rounded-xl p-8 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="text-sm text-text-muted uppercase tracking-wide mb-2 font-semibold">
              Competitive Moat Strength
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-data">
                {analysis.overallScore.toFixed(1)}
              </span>
              <span className="text-2xl text-text-secondary">/10</span>
              <span className={`text-xl font-semibold px-3 py-1 rounded-lg ${getScoreBg(analysis.overallScore)}`}>
                {getStrengthLabel(analysis.overallScore)}
              </span>
            </div>
            <div className="bg-bg-primary/50 rounded-xl p-5 border border-border-default">
              <div className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                What this means:
              </div>
              <p className="text-sm text-text-secondary leading-relaxed italic">
                "{getInterpretation(analysis.overallScore)}"
              </p>
            </div>
          </div>

          {/* Circular Progress */}
          <div className="flex-shrink-0 flex justify-center">
            <CircularProgress
              percentage={analysis.overallScore * 10}
              size={160}
              strokeWidth={12}
              label={getStrengthLabel(analysis.overallScore)}
              color={
                analysis.overallScore >= 7 ? 'green' :
                analysis.overallScore >= 5 ? 'blue' :
                analysis.overallScore >= 3 ? 'yellow' : 'red'
              }
              showPercentage={false}
            />
          </div>
        </div>
      </div>

      {/* Pentagon Radar Chart */}
      <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-border-default rounded-xl p-8 shadow-md">
        <h3 className="text-2xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          5 Dimensions of Competitive Advantage
        </h3>

        <div className="flex flex-col items-center">
          {/* SVG Radar Chart */}
          <svg
            width="100%"
            height="400"
            viewBox="0 0 300 300"
            className="max-w-lg mx-auto"
          >
            {/* Grid lines (background pentagons) */}
            {gridLevels.map((level, idx) => {
              const points = calculatePentagonPoints([level, level, level, level, level]);
              const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
              return (
                <path
                  key={level}
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-border-default"
                  opacity={0.3}
                />
              );
            })}

            {/* Axis lines from center to each point */}
            {maxPoints.map((point, idx) => (
              <line
                key={idx}
                x1="150"
                y1="150"
                x2={point.x}
                y2={point.y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-border-default"
                opacity={0.5}
              />
            ))}

            {/* Max pentagon (reference) */}
            <path
              d={maxPath}
              fill="currentColor"
              stroke="none"
              className="text-text-muted"
              opacity={0.05}
            />

            {/* Actual score pentagon */}
            <path
              d={actualPath}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="2"
              className="text-accent-blue"
              opacity={0.3}
            />
            <path
              d={actualPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-accent-blue"
            />

            {/* Score points */}
            {actualPoints.map((point, idx) => (
              <circle
                key={idx}
                cx={point.x}
                cy={point.y}
                r="6"
                fill="currentColor"
                className="text-accent-blue cursor-pointer hover:text-signal-green transition-colors"
                onClick={() => setExpandedDimension(expandedDimension === dimensions[idx].name ? null : dimensions[idx].name)}
              />
            ))}

            {/* Labels */}
            {maxPoints.map((point, idx) => {
              const dimension = dimensions[idx];
              const labelOffset = 25;
              let textX = point.x;
              let textY = point.y;

              // Adjust label position based on angle
              if (idx === 0) textY -= labelOffset; // Top
              if (idx === 1) textX += labelOffset; // Top-right
              if (idx === 2) textX += labelOffset; // Bottom-right
              if (idx === 3) textX -= labelOffset; // Bottom-left
              if (idx === 4) textX -= labelOffset; // Top-left

              return (
                <text
                  key={idx}
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-current text-text-primary"
                  style={{ pointerEvents: 'none' }}
                >
                  <tspan x={textX} dy="0">{dimension.name.split(' ')[0]}</tspan>
                  <tspan x={textX} dy="12">{dimension.name.split(' ').slice(1).join(' ')}</tspan>
                  <tspan x={textX} dy="14" className={getScoreColor(dimension.score)}>
                    ({dimension.score}/10)
                  </tspan>
                </text>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-signal-green" />
              <span className="text-text-secondary">Exceptional (9-10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-up" />
              <span className="text-text-secondary">Strong (7-8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-signal-yellow" />
              <span className="text-text-secondary">Moderate (5-6)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-signal-red" />
              <span className="text-text-secondary">Weak (0-4)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Dimension Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-primary">
          Understanding Each Dimension
        </h3>

        {dimensions.map((dimension, idx) => {
          const isExpanded = expandedDimension === dimension.name;
          const colorClass = getScoreColor(dimension.score);
          const bgClass = getScoreBg(dimension.score);

          return (
            <div
              key={idx}
              className={`border-2 rounded-lg transition-all duration-300 ${
                isExpanded ? bgClass : 'border-border-default bg-bg-secondary'
              }`}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedDimension(isExpanded ? null : dimension.name)}
                className="w-full p-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`${colorClass}`}>
                    {dimension.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-text-primary">
                      {dimension.name}
                    </div>
                    <div className="text-sm text-text-secondary">
                      {dimension.explanation}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${colorClass}`}>
                    {dimension.score}/10
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  {/* Why this matters */}
                  <div>
                    <h5 className="text-sm font-semibold text-text-primary mb-2">
                      Why this matters:
                    </h5>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {dimension.explanation}
                    </p>
                  </div>

                  {/* Evidence */}
                  {dimension.evidence.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-text-primary mb-2">
                        Evidence from {companyName}:
                      </h5>
                      <ul className="space-y-2">
                        {dimension.evidence.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                            <span className={`${colorClass} mt-1`}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Real-world analogy */}
                  <div className="bg-bg-tertiary/50 rounded-lg p-3">
                    <h5 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                      <span>💡</span>
                      Real-world analogy:
                    </h5>
                    <p className="text-sm text-text-secondary italic leading-relaxed">
                      "{dimension.analogy}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interpretation Guide */}
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-6">
        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
          How to Interpret Moat Scores
          <button
            onMouseEnter={() => setShowTooltip('interpret')}
            onMouseLeave={() => setShowTooltip(null)}
            className="relative"
          >
            <HelpCircle className="w-4 h-4 text-text-muted hover:text-accent-blue transition-colors" />
            {showTooltip === 'interpret' && (
              <div className="absolute left-0 top-6 w-80 bg-bg-secondary border border-border-default rounded-lg p-4 text-xs text-text-secondary z-10 shadow-xl">
                <p className="mb-2">
                  <strong>Higher scores = Better investment protection</strong>
                </p>
                <p>
                  Companies with strong moats (7+) can maintain high returns on capital
                  for many years. They're Warren Buffett's favorite type of investment.
                </p>
              </div>
            )}
          </button>
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 text-signal-green font-bold">9-10</div>
            <div className="text-sm text-text-secondary">
              <strong className="text-text-primary">Exceptional moat</strong> - Warren Buffett would love this.
              Nearly impossible for competitors to challenge.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 text-chart-up font-bold">7-8</div>
            <div className="text-sm text-text-secondary">
              <strong className="text-text-primary">Strong moat</strong> - Good long-term investment.
              Company has sustainable competitive advantages.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 text-signal-yellow font-bold">5-6</div>
            <div className="text-sm text-text-secondary">
              <strong className="text-text-primary">Moderate moat</strong> - Average protection.
              Some advantages but not exceptional.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 text-signal-red font-bold">3-4</div>
            <div className="text-sm text-text-secondary">
              <strong className="text-text-primary">Weak moat</strong> - Vulnerable to competition.
              Competitors can easily challenge the business.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-16 text-text-muted font-bold">0-2</div>
            <div className="text-sm text-text-secondary">
              <strong className="text-text-primary">No moat</strong> - Commodity business.
              Customers buy based on price alone.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoatRadar;
