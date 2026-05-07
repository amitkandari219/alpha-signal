/**
 * Market Position Matrix Infographic
 *
 * Shows company's competitive position using 2x2 grid (BCG Matrix style):
 * - X-axis: Market Growth Rate (Low → High)
 * - Y-axis: Market Share (Low → High)
 * - 4 Quadrants: Leaders, Cash Cows, Challengers, Laggards
 * - Bubble chart with competitors
 * - Peer comparison table
 *
 * Visual: Interactive matrix with bubbles and detailed insights
 */

import React, { useState } from 'react';
import {
  Star,
  DollarSign,
  HelpCircle,
  TrendingDown,
  Info,
  Target,
  Award,
  AlertCircle,
} from 'lucide-react';

interface Competitor {
  name: string;
  marketShare: number; // %
  growthRate: number; // %
  revenue: number; // ₹ Cr
  profitMargin: number; // %
  isOurCompany?: boolean;
}

interface MarketPositionMatrixProps {
  data: {
    ourCompany: Competitor;
    competitors: Competitor[];
    industryGrowth: number; // Average industry growth %
  };
  companyName: string;
}

export const MarketPositionMatrix: React.FC<MarketPositionMatrixProps> = ({
  data,
  companyName,
}) => {
  const [hoveredCompetitor, setHoveredCompetitor] = useState<string | null>(null);
  const [showQuadrantInfo, setShowQuadrantInfo] = useState(false);

  // Calculate thresholds (median values)
  const allCompanies = [data.ourCompany, ...data.competitors];
  const medianGrowth = calculateMedian(allCompanies.map((c) => c.growthRate));
  const medianShare = calculateMedian(allCompanies.map((c) => c.marketShare));

  // Determine our company's position
  const ourPosition = getQuadrantPosition(
    data.ourCompany.marketShare,
    data.ourCompany.growthRate,
    medianShare,
    medianGrowth
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Market Position Matrix
        </h3>
        <p className="text-text-secondary">
          Where {companyName} stands vs competitors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: 2x2 Matrix (2 columns) */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-border-default rounded-xl p-8 shadow-lg">
            {/* Matrix SVG */}
            <div className="relative" style={{ paddingBottom: '100%' }}>
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Grid Lines */}
                <line x1="250" y1="50" x2="250" y2="450" stroke="#374151" strokeWidth="2" />
                <line x1="50" y1="250" x2="450" y2="250" stroke="#374151" strokeWidth="2" />

                {/* Quadrant Labels (Faded) */}
                <QuadrantLabel x={150} y={150} label="Cash Cows 🐄" />
                <QuadrantLabel x={350} y={150} label="Stars ⭐" />
                <QuadrantLabel x={150} y={350} label="Dogs 🐕" />
                <QuadrantLabel x={350} y={350} label="Question Marks ❓" />

                {/* Axis Labels */}
                <text x="250" y="30" textAnchor="middle" className="fill-text-secondary text-xs">
                  High Market Share
                </text>
                <text x="250" y="480" textAnchor="middle" className="fill-text-secondary text-xs">
                  Low Market Share
                </text>
                <text
                  x="30"
                  y="250"
                  textAnchor="middle"
                  transform="rotate(-90 30 250)"
                  className="fill-text-secondary text-xs"
                >
                  Low Growth
                </text>
                <text
                  x="470"
                  y="250"
                  textAnchor="middle"
                  transform="rotate(-90 470 250)"
                  className="fill-text-secondary text-xs"
                >
                  High Growth
                </text>

                {/* Plot Companies as Bubbles */}
                {allCompanies.map((company, index) => {
                  const x = mapToCoordinate(company.growthRate, medianGrowth, 'x');
                  const y = mapToCoordinate(company.marketShare, medianShare, 'y');
                  const radius = Math.sqrt(company.revenue) / 3; // Size by revenue
                  const color = getColorByMargin(company.profitMargin, company.isOurCompany);
                  const isHovered = hoveredCompetitor === company.name;

                  return (
                    <g
                      key={company.name}
                      onMouseEnter={() => setHoveredCompetitor(company.name)}
                      onMouseLeave={() => setHoveredCompetitor(null)}
                      className="cursor-pointer transition-all"
                    >
                      {/* Bubble */}
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? radius * 1.2 : radius}
                        fill={color}
                        fillOpacity={company.isOurCompany ? 0.9 : 0.6}
                        stroke={company.isOurCompany ? '#3B82F6' : 'none'}
                        strokeWidth={company.isOurCompany ? 4 : 0}
                        className="transition-all"
                      />

                      {/* Label */}
                      <text
                        x={x}
                        y={y + 5}
                        textAnchor="middle"
                        className="fill-white text-xs font-semibold pointer-events-none"
                        style={{ fontSize: company.isOurCompany ? '14px' : '12px' }}
                      >
                        {company.isOurCompany ? 'US!' : company.name}
                      </text>

                      {/* Hover Tooltip */}
                      {isHovered && (
                        <g>
                          <rect
                            x={x + radius + 10}
                            y={y - 30}
                            width="160"
                            height="60"
                            fill="#1F2937"
                            stroke="#374151"
                            strokeWidth="1"
                            rx="4"
                          />
                          <text
                            x={x + radius + 15}
                            y={y - 15}
                            className="fill-white text-xs font-semibold"
                          >
                            {company.name}
                          </text>
                          <text
                            x={x + radius + 15}
                            y={y}
                            className="fill-text-secondary text-xs"
                          >
                            Share: {company.marketShare}%
                          </text>
                          <text
                            x={x + radius + 15}
                            y={y + 15}
                            className="fill-text-secondary text-xs"
                          >
                            Growth: {company.growthRate}%
                          </text>
                          <text
                            x={x + radius + 15}
                            y={y + 30}
                            className="fill-text-secondary text-xs"
                          >
                            Revenue: ₹{company.revenue}Cr
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-between text-xs text-text-secondary">
              <div>Bubble size = Revenue</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-signal-green" />
                  <span>&gt;15% margin</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-signal-yellow" />
                  <span>8-15% margin</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-signal-red" />
                  <span>&lt;8% margin</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Our Position Card */}
        <div>
          <div className="bg-gradient-to-br from-accent-blue/20 to-purple-900/20 border-2 border-accent-blue rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              {ourPosition.icon}
              <h4 className="text-xl font-bold">{companyName}</h4>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-text-secondary mb-1">Position:</div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {ourPosition.name}
                  <span className="text-3xl">{ourPosition.emoji}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Market Share:</span>
                  <span className="font-semibold">{data.ourCompany.marketShare}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Growth Rate:</span>
                  <span className="font-semibold text-signal-green">
                    {data.ourCompany.growthRate}%/year
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Revenue:</span>
                  <span className="font-semibold">₹{data.ourCompany.revenue} Cr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Profit Margin:</span>
                  <span className="font-semibold">{data.ourCompany.profitMargin}%</span>
                </div>
              </div>

              <div className="bg-bg-secondary p-3 rounded border-l-4 border-accent-blue">
                <div className="font-medium mb-1">What this means:</div>
                <div className="text-sm text-text-secondary">{ourPosition.description}</div>
              </div>

              {ourPosition.nextGoal && (
                <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                  <div className="font-medium mb-1 flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    Next Goal:
                  </div>
                  <div className="text-sm text-text-secondary">{ourPosition.nextGoal}</div>
                </div>
              )}
            </div>
          </div>

          {/* Quadrant Explanation Button */}
          <button
            onClick={() => setShowQuadrantInfo(!showQuadrantInfo)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default rounded-lg hover:bg-bg-tertiary transition-colors text-sm"
          >
            <Info className="w-4 h-4" />
            Explain Quadrants
          </button>
        </div>
      </div>

      {/* Quadrant Explanations (Expanded) */}
      {showQuadrantInfo && (
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <h4 className="font-bold text-lg mb-4">Understanding the 4 Quadrants</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUADRANT_EXPLANATIONS.map((quad, index) => (
              <QuadrantExplanationCard key={index} {...quad} />
            ))}
          </div>
        </div>
      )}

      {/* Peer Comparison Table */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h4 className="font-bold text-lg mb-4">Competitive Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2 font-semibold">Competitor</th>
                <th className="text-center py-2 font-semibold">Market Share</th>
                <th className="text-center py-2 font-semibold">Growth Rate</th>
                <th className="text-center py-2 font-semibold">Profit Margin</th>
                <th className="text-left py-2 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody>
              {[data.ourCompany, ...data.competitors]
                .sort((a, b) => b.marketShare - a.marketShare)
                .map((company, index) => {
                  const position = getQuadrantPosition(
                    company.marketShare,
                    company.growthRate,
                    medianShare,
                    medianGrowth
                  );

                  return (
                    <tr
                      key={company.name}
                      className={`border-b border-border-default ${
                        company.isOurCompany ? 'bg-accent-blue/10' : ''
                      }`}
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {company.isOurCompany && (
                            <Award className="w-4 h-4 text-accent-blue" />
                          )}
                          <span className={company.isOurCompany ? 'font-semibold' : ''}>
                            {company.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3">
                        {company.marketShare}%
                        {index === 0 && <span className="ml-1 text-xs text-signal-green">↑</span>}
                      </td>
                      <td className="text-center py-3">
                        <span
                          className={
                            company.growthRate > medianGrowth
                              ? 'text-signal-green'
                              : 'text-signal-yellow'
                          }
                        >
                          {company.growthRate}%
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span
                          className={
                            company.profitMargin > 15
                              ? 'text-signal-green'
                              : company.profitMargin > 8
                              ? 'text-signal-yellow'
                              : 'text-signal-red'
                          }
                        >
                          {company.profitMargin}%
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span>{position.name}</span>
                          <span>{position.emoji}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUADRANT LABEL (SVG TEXT)
// ═══════════════════════════════════════════════════════════════

const QuadrantLabel: React.FC<{ x: number; y: number; label: string }> = ({ x, y, label }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    className="fill-text-secondary text-sm opacity-30"
    style={{ fontSize: '16px', fontWeight: 'bold' }}
  >
    {label}
  </text>
);

// ═══════════════════════════════════════════════════════════════
// QUADRANT EXPLANATION CARD
// ═══════════════════════════════════════════════════════════════

interface QuadrantExplanation {
  name: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
  example: string;
  color: string;
}

const QuadrantExplanationCard: React.FC<QuadrantExplanation> = ({
  name,
  emoji,
  icon,
  description,
  example,
  color,
}) => (
  <div className={`p-4 rounded-lg border ${color}`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <h5 className="font-semibold">{name}</h5>
      <span className="text-2xl">{emoji}</span>
    </div>
    <p className="text-sm text-text-secondary mb-2">{description}</p>
    <div className="text-xs text-text-secondary italic">{example}</div>
  </div>
);

const QUADRANT_EXPLANATIONS: QuadrantExplanation[] = [
  {
    name: 'Leaders (Stars)',
    emoji: '⭐',
    icon: <Star className="w-4 h-4 text-signal-green" />,
    description: 'High market share + High growth = Best position!',
    example: 'Example: Apple in smartphones',
    color: 'bg-signal-green/10 border-signal-green/30',
  },
  {
    name: 'Established (Cash Cows)',
    emoji: '🐄',
    icon: <DollarSign className="w-4 h-4 text-accent-blue" />,
    description: 'High market share + Low growth = Mature but profitable',
    example: 'Example: Coca-Cola in soft drinks',
    color: 'bg-accent-blue/10 border-accent-blue/30',
  },
  {
    name: 'Challengers (Question Marks)',
    emoji: '❓',
    icon: <HelpCircle className="w-4 h-4 text-signal-yellow" />,
    description: 'Low market share + High growth = High risk, high reward',
    example: 'Example: New EV companies',
    color: 'bg-signal-yellow/10 border-signal-yellow/30',
  },
  {
    name: 'Laggards (Dogs)',
    emoji: '🐕',
    icon: <TrendingDown className="w-4 h-4 text-signal-red" />,
    description: 'Low market share + Low growth = Struggling',
    example: 'Example: Avoid these businesses',
    color: 'bg-signal-red/10 border-signal-red/30',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculateMedian(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function mapToCoordinate(value: number, median: number, axis: 'x' | 'y'): number {
  // Map to 50-450 range (leaving margins)
  // For x-axis: low growth = left (50), high growth = right (450)
  // For y-axis: high share = top (50), low share = bottom (450)

  const normalized = value / (median * 2); // Normalize around median
  const clamped = Math.max(0, Math.min(1, normalized));

  if (axis === 'x') {
    return 50 + clamped * 400;
  } else {
    return 450 - clamped * 400; // Invert for y-axis
  }
}

function getColorByMargin(margin: number, isOurCompany?: boolean): string {
  if (isOurCompany) {
    return '#3B82F6'; // Accent blue for our company
  }

  if (margin > 15) {
    return '#10B981'; // Green
  } else if (margin > 8) {
    return '#F59E0B'; // Yellow
  } else {
    return '#EF4444'; // Red
  }
}

interface QuadrantPosition {
  name: string;
  emoji: string;
  icon: React.ReactNode;
  description: string;
  nextGoal?: string;
}

function getQuadrantPosition(
  marketShare: number,
  growthRate: number,
  medianShare: number,
  medianGrowth: number
): QuadrantPosition {
  const highShare = marketShare >= medianShare;
  const highGrowth = growthRate >= medianGrowth;

  if (highShare && highGrowth) {
    return {
      name: 'Leader (Star)',
      emoji: '⭐',
      icon: <Star className="w-5 h-5 text-signal-green" />,
      description:
        'Company is in a great position - growing fast market with strong market share. Good for long-term growth.',
      nextGoal: 'Defend position from competitors who are catching up fast.',
    };
  } else if (highShare && !highGrowth) {
    return {
      name: 'Established (Cash Cow)',
      emoji: '🐄',
      icon: <DollarSign className="w-5 h-5 text-accent-blue" />,
      description:
        'Mature business with strong market share. Generates good profits but limited growth potential.',
      nextGoal: 'Find new growth opportunities or return cash to shareholders.',
    };
  } else if (!highShare && highGrowth) {
    return {
      name: 'Challenger (Question Mark)',
      emoji: '❓',
      icon: <HelpCircle className="w-5 h-5 text-signal-yellow" />,
      description:
        'Fast-growing market but low market share. High potential but also high risk. Needs investment to grow.',
      nextGoal: 'Invest heavily to gain market share or exit the business.',
    };
  } else {
    return {
      name: 'Laggard (Dog)',
      emoji: '🐕',
      icon: <AlertCircle className="w-5 h-5 text-signal-red" />,
      description:
        'Slow growth and low market share. Struggling position. May need restructuring or exit.',
      nextGoal: 'Turn around the business or consider exiting this market.',
    };
  }
}
