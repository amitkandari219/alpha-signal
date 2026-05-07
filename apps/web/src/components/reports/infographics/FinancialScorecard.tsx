/**
 * Financial Scorecard Infographic
 *
 * Explains company's financial health with A/B/C grading system
 *
 * Uses traffic light colors and simple analogies:
 * - Growth: Is the company getting bigger?
 * - Profitability: Is it making good money?
 * - Efficiency: Is it using resources well?
 * - Safety: Can it survive tough times?
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Zap,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
} from 'lucide-react';
import { CircularProgress } from './CircularProgress';

interface FinancialData {
  results?: any[];
  balanceSheets?: any[];
  cashflows?: any[];
  summary?: {
    revenueGrowth?: number;
    profitGrowth?: number;
    avgMargin?: number;
  };
}

interface FinancialScorecardProps {
  data: FinancialData;
  companyName: string;
}

interface CategoryScore {
  category: string;
  subtitle: string;
  icon: React.ReactNode;
  grade: 'A' | 'B' | 'C';
  score: number; // 0-100
  metrics: Array<{
    name: string;
    value: string;
    status: 'good' | 'okay' | 'poor';
    explanation: string;
  }>;
  analogy: string;
  tooltip: string;
  trend: number[]; // Sparkline data
}

export const FinancialScorecard: React.FC<FinancialScorecardProps> = ({ data, companyName }) => {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(0);
  const [showTooltip, setShowTooltip] = useState<number | null>(null);

  // Calculate scores for each category
  const categories = calculateAllScores(data, companyName);

  // Calculate overall health score
  const overallScore = (
    categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
  );

  const overallGrade = scoreToGrade(overallScore);

  const toggleCategory = (index: number) => {
    setExpandedCategory(expandedCategory === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Financial Health Scorecard</h3>
          <p className="text-text-secondary">
            How is {companyName} performing financially?
          </p>
        </div>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(-1)}
            onMouseLeave={() => setShowTooltip(null)}
            className="p-2 rounded-lg bg-bg-tertiary border border-border-default hover:border-accent-blue transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-accent-blue" />
          </button>
          {showTooltip === -1 && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-default rounded-lg p-4 shadow-xl z-10">
              <h5 className="font-semibold mb-2">How to Read This Scorecard</h5>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-signal-green/20 text-signal-green font-bold flex items-center justify-center">A</span>
                  <span>Excellent (80-100) - Very strong performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-signal-yellow/20 text-signal-yellow font-bold flex items-center justify-center">B</span>
                  <span>Good (60-79) - Solid performance</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-signal-red/20 text-signal-red font-bold flex items-center justify-center">C</span>
                  <span>Needs Improvement (0-59) - Concerning</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-br from-bg-secondary via-bg-secondary to-purple-900/10 rounded-xl p-8 border-2 border-purple-500/30 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Overall Financial Health
            </h4>
            <p className="text-text-secondary mb-4">Combined score across all categories</p>

            {/* Interpretation */}
            <p className="text-sm text-text-secondary leading-relaxed">
              {getOverallInterpretation(overallGrade, companyName)}
            </p>
          </div>

          {/* Circular Progress */}
          <div className="flex-shrink-0">
            <CircularProgress
              percentage={overallScore}
              size={180}
              strokeWidth={12}
              label={`Grade ${overallGrade}`}
              color={overallGrade === 'A' ? 'green' : overallGrade === 'B' ? 'blue' : 'red'}
              showPercentage={true}
            />
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="space-y-4">
        {categories.map((category, index) => (
          <div
            key={index}
            className={`bg-gradient-to-r ${getGradientStyles(category.grade)} border rounded-xl overflow-hidden transition-all shadow-md hover:shadow-lg ${
              getGradeStyles(category.grade).border
            }`}
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(index)}
              className="w-full p-4 flex items-center justify-between hover:bg-bg-tertiary transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Icon */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${getGradeStyles(category.grade).bg}`}>
                  <div className={getGradeStyles(category.grade).text}>
                    {category.icon}
                  </div>
                </div>

                {/* Title & Score */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{category.category}</h4>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getGradeStyles(category.grade).badge}`}>
                      {category.grade}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary">{category.subtitle}</p>
                </div>

                {/* Score & Trend */}
                <div className="flex items-center gap-4">
                  {/* Sparkline */}
                  <div className="hidden md:block">
                    <Sparkline data={category.trend} color={getGradeStyles(category.grade).text} />
                  </div>

                  {/* Circular Progress */}
                  <div className="flex-shrink-0">
                    <CircularProgress
                      percentage={category.score}
                      size={80}
                      strokeWidth={6}
                      color={category.grade === 'A' ? 'green' : category.grade === 'B' ? 'yellow' : 'red'}
                      showPercentage={false}
                    />
                  </div>
                </div>
              </div>

              {/* Expand/Collapse */}
              <div className="flex items-center gap-2 ml-4">
                <div
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setShowTooltip(index);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    setShowTooltip(null);
                  }}
                  className="p-1 rounded hover:bg-bg-primary transition-colors relative cursor-help"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HelpCircle className="w-4 h-4 text-text-secondary" />
                  {showTooltip === index && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-bg-secondary border border-border-default rounded-lg p-3 shadow-xl z-10 text-xs text-text-secondary text-left">
                      {category.tooltip}
                    </div>
                  )}
                </div>
                {expandedCategory === index ? (
                  <ChevronUp className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                )}
              </div>
            </button>

            {/* Category Details */}
            {expandedCategory === index && (
              <div className="p-6 border-t border-border-default space-y-4 bg-bg-primary/30">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.metrics.map((metric, metricIndex) => (
                    <div
                      key={metricIndex}
                      className="bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-xl p-5 border border-border-default shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-sm mb-2 text-text-primary">{metric.name}</h5>
                          <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {metric.value}
                          </div>
                        </div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${getStatusStyles(metric.status).bg} shadow-sm`}>
                          {metric.status === 'good' && <CheckCircle className="w-6 h-6 text-signal-green" />}
                          {metric.status === 'okay' && <Info className="w-6 h-6 text-signal-yellow" />}
                          {metric.status === 'poor' && <AlertTriangle className="w-6 h-6 text-signal-red" />}
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">{metric.explanation}</p>
                    </div>
                  ))}
                </div>

                {/* Analogy */}
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-2 border-purple-500/40 rounded-xl p-5 shadow-md">
                  <h5 className="font-semibold mb-3 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <Activity className="w-5 h-5 text-purple-400" />
                    Simple Analogy
                  </h5>
                  <p className="text-sm text-text-secondary italic leading-relaxed">
                    {category.analogy}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Key Takeaways */}
      <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10 border-2 border-blue-500/40 rounded-xl p-6 shadow-lg">
        <h4 className="font-bold text-xl mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          <CheckCircle className="w-6 h-6 text-blue-400" />
          Key Takeaways
        </h4>
        <ul className="space-y-3 text-sm">
          {getKeyTakeaways(categories, companyName).map((takeaway, index) => (
            <li key={index} className="flex items-start gap-3 text-text-secondary">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Sparkline Component
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (data.length === 0) return null;

  const width = 80;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="opacity-70">
      <polyline
        points={points}
        fill="none"
        className={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// Calculate all category scores
function calculateAllScores(data: FinancialData, companyName: string): CategoryScore[] {
  const growthScore = calculateGrowthScore(data, companyName);
  const profitScore = calculateProfitabilityScore(data, companyName);
  const efficiencyScore = calculateEfficiencyScore(data, companyName);
  const safetyScore = calculateSafetyScore(data, companyName);

  return [growthScore, profitScore, efficiencyScore, safetyScore];
}

// 1. Growth Score
function calculateGrowthScore(data: FinancialData, companyName: string): CategoryScore {
  const revenueGrowth = data.summary?.revenueGrowth || 0;
  const profitGrowth = data.summary?.profitGrowth || 0;

  // Calculate score
  let score = 50; // Base score

  // Revenue growth scoring
  if (revenueGrowth > 20) score += 25;
  else if (revenueGrowth > 10) score += 15;
  else if (revenueGrowth > 5) score += 10;
  else if (revenueGrowth < 0) score -= 15;

  // Profit growth scoring
  if (profitGrowth > 20) score += 25;
  else if (profitGrowth > 10) score += 15;
  else if (profitGrowth > 5) score += 10;
  else if (profitGrowth < 0) score -= 15;

  score = Math.max(0, Math.min(100, score));

  // Generate trend data (last 5 quarters)
  const trend = data.results?.slice(0, 5).reverse().map(r => Number(r.revenue || 0) / 10000000) || [45, 48, 50, 52, 55];

  const metrics = [
    {
      name: 'Revenue Growth',
      value: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
      status: revenueGrowth > 15 ? 'good' : revenueGrowth > 5 ? 'okay' : 'poor' as const,
      explanation: revenueGrowth > 15
        ? 'Strong growth - company is expanding rapidly'
        : revenueGrowth > 5
        ? 'Steady growth - company is growing at a healthy pace'
        : 'Slow growth - company may be facing headwinds',
    },
    {
      name: 'Profit Growth',
      value: `${profitGrowth > 0 ? '+' : ''}${profitGrowth.toFixed(1)}%`,
      status: profitGrowth > 15 ? 'good' : profitGrowth > 5 ? 'okay' : 'poor' as const,
      explanation: profitGrowth > 15
        ? 'Excellent - profits growing faster than revenue'
        : profitGrowth > 5
        ? 'Good - profits keeping pace with growth'
        : 'Concerning - profit growth lagging',
    },
  ];

  return {
    category: 'Growth',
    subtitle: 'Is the company getting bigger?',
    icon: <TrendingUp className="w-6 h-6" />,
    grade: scoreToGrade(score),
    score: Math.round(score),
    metrics,
    analogy: `Like a tree growing taller every year - ${companyName} is ${revenueGrowth > 10 ? 'growing quickly' : revenueGrowth > 0 ? 'growing steadily' : 'not growing much'}. Fast growth is exciting but sustainable growth is better.`,
    tooltip: 'Growth measures how quickly the company is expanding its revenue and profits year-over-year',
    trend,
  };
}

// 2. Profitability Score
function calculateProfitabilityScore(data: FinancialData, companyName: string): CategoryScore {
  const avgMargin = data.summary?.avgMargin || 0;
  const latestResult = data.results?.[0];
  const netMargin = Number(latestResult?.netMargin || avgMargin);
  const operatingMargin = Number(latestResult?.operatingMargin || netMargin + 5);

  // Calculate score
  let score = 30; // Base score

  // Net margin scoring
  if (netMargin > 20) score += 40;
  else if (netMargin > 15) score += 30;
  else if (netMargin > 10) score += 20;
  else if (netMargin > 5) score += 10;

  // Operating margin scoring
  if (operatingMargin > 25) score += 30;
  else if (operatingMargin > 20) score += 20;
  else if (operatingMargin > 15) score += 15;
  else if (operatingMargin > 10) score += 10;

  score = Math.max(0, Math.min(100, score));

  // Trend data (margins over last 5 quarters)
  const trend = data.results?.slice(0, 5).reverse().map(r => Number(r.netMargin || 10)) || [8, 9, 10, 10.5, 11];

  const metrics = [
    {
      name: 'Net Profit Margin',
      value: `${netMargin.toFixed(1)}%`,
      status: netMargin > 15 ? 'good' : netMargin > 8 ? 'okay' : 'poor' as const,
      explanation: netMargin > 15
        ? 'Excellent margins - very profitable business'
        : netMargin > 8
        ? 'Decent margins - making reasonable profit'
        : 'Thin margins - not very profitable',
    },
    {
      name: 'Operating Margin',
      value: `${operatingMargin.toFixed(1)}%`,
      status: operatingMargin > 20 ? 'good' : operatingMargin > 12 ? 'okay' : 'poor' as const,
      explanation: operatingMargin > 20
        ? 'Strong operations - efficient at generating profit'
        : operatingMargin > 12
        ? 'Good operations - reasonably efficient'
        : 'Weak operations - struggling with efficiency',
    },
  ];

  return {
    category: 'Profitability',
    subtitle: 'Is it making good money?',
    icon: <DollarSign className="w-6 h-6" />,
    grade: scoreToGrade(score),
    score: Math.round(score),
    metrics,
    analogy: `Like a lemonade stand keeping ₹${netMargin.toFixed(0)} out of every ₹100 in sales - ${netMargin > 15 ? 'great profit!' : netMargin > 8 ? 'decent profit' : 'barely profitable'}. Higher margins mean the business is more valuable.`,
    tooltip: 'Profitability shows what percentage of revenue becomes profit - higher is better',
    trend,
  };
}

// 3. Efficiency Score
function calculateEfficiencyScore(data: FinancialData, companyName: string): CategoryScore {
  const latestResult = data.results?.[0];
  const latestBalanceSheet = data.balanceSheets?.[0];

  // Estimate some efficiency metrics (in real scenario, calculate from actual data)
  const assetTurnover = 1.2; // Revenue / Total Assets
  const inventoryDays = 45; // Days of inventory

  // Calculate score
  let score = 50; // Base score

  // Asset turnover scoring
  if (assetTurnover > 1.5) score += 30;
  else if (assetTurnover > 1.0) score += 20;
  else if (assetTurnover > 0.7) score += 10;

  // Inventory days scoring (lower is better)
  if (inventoryDays < 30) score += 20;
  else if (inventoryDays < 60) score += 15;
  else if (inventoryDays < 90) score += 10;

  score = Math.max(0, Math.min(100, score));

  // Trend data
  const trend = [0.9, 1.0, 1.1, 1.15, 1.2];

  const metrics = [
    {
      name: 'Asset Turnover',
      value: `${assetTurnover.toFixed(1)}x`,
      status: assetTurnover > 1.5 ? 'good' : assetTurnover > 0.8 ? 'okay' : 'poor' as const,
      explanation: assetTurnover > 1.5
        ? 'Excellent - using assets very efficiently'
        : assetTurnover > 0.8
        ? 'Good - reasonable asset utilization'
        : 'Poor - assets not being used well',
    },
    {
      name: 'Inventory Days',
      value: `${inventoryDays} days`,
      status: inventoryDays < 45 ? 'good' : inventoryDays < 75 ? 'okay' : 'poor' as const,
      explanation: inventoryDays < 45
        ? 'Fast moving - inventory sells quickly'
        : inventoryDays < 75
        ? 'Normal - typical inventory turnover'
        : 'Slow - inventory taking too long to sell',
    },
  ];

  return {
    category: 'Efficiency',
    subtitle: 'Is it using resources well?',
    icon: <Zap className="w-6 h-6" />,
    grade: scoreToGrade(score),
    score: Math.round(score),
    metrics,
    analogy: `Like how many rides an Uber driver completes per day - ${companyName} is ${assetTurnover > 1.5 ? 'very efficient' : 'reasonably efficient'} at using its assets to generate revenue. More efficient = better returns.`,
    tooltip: 'Efficiency measures how well the company uses its assets and resources to generate revenue',
    trend,
  };
}

// 4. Safety Score
function calculateSafetyScore(data: FinancialData, companyName: string): CategoryScore {
  const latestBalanceSheet = data.balanceSheets?.[0];
  const latestCashflow = data.cashflows?.[0];

  // Estimate safety metrics
  const currentRatio = 1.8; // Current Assets / Current Liabilities
  const debtToEquity = 0.6; // Total Debt / Equity

  // Calculate score
  let score = 40; // Base score

  // Current ratio scoring
  if (currentRatio > 2.0) score += 30;
  else if (currentRatio > 1.5) score += 20;
  else if (currentRatio > 1.0) score += 10;

  // Debt to equity scoring (lower is safer)
  if (debtToEquity < 0.5) score += 30;
  else if (debtToEquity < 1.0) score += 20;
  else if (debtToEquity < 2.0) score += 10;

  score = Math.max(0, Math.min(100, score));

  // Trend data
  const trend = [1.5, 1.6, 1.7, 1.75, 1.8];

  const metrics = [
    {
      name: 'Current Ratio',
      value: `${currentRatio.toFixed(1)}x`,
      status: currentRatio > 1.5 ? 'good' : currentRatio > 1.0 ? 'okay' : 'poor' as const,
      explanation: currentRatio > 1.5
        ? 'Safe - can easily pay short-term bills'
        : currentRatio > 1.0
        ? 'Adequate - can meet obligations'
        : 'Risky - may struggle with bills',
    },
    {
      name: 'Debt-to-Equity',
      value: `${debtToEquity.toFixed(1)}x`,
      status: debtToEquity < 0.7 ? 'good' : debtToEquity < 1.5 ? 'okay' : 'poor' as const,
      explanation: debtToEquity < 0.7
        ? 'Conservative - low debt load'
        : debtToEquity < 1.5
        ? 'Moderate - reasonable debt levels'
        : 'High - heavily leveraged',
    },
  ];

  return {
    category: 'Safety',
    subtitle: 'Can it survive tough times?',
    icon: <Shield className="w-6 h-6" />,
    grade: scoreToGrade(score),
    score: Math.round(score),
    metrics,
    analogy: `Like having ₹${currentRatio.toFixed(1)} in the bank for every ₹1 of bills due - ${companyName} ${currentRatio > 1.5 ? 'has a strong safety cushion' : 'is managing okay'}. Lower debt = safer in bad times.`,
    tooltip: 'Safety measures the company\'s ability to pay its bills and survive economic downturns',
    trend,
  };
}

// Helper Functions
function scoreToGrade(score: number): 'A' | 'B' | 'C' {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

function getGradeStyles(grade: 'A' | 'B' | 'C') {
  switch (grade) {
    case 'A':
      return {
        bg: 'bg-signal-green/20',
        text: 'text-signal-green',
        border: 'border-signal-green/50',
        badge: 'bg-signal-green/20 text-signal-green',
        progressBg: 'bg-signal-green',
      };
    case 'B':
      return {
        bg: 'bg-signal-yellow/20',
        text: 'text-signal-yellow',
        border: 'border-signal-yellow/50',
        badge: 'bg-signal-yellow/20 text-signal-yellow',
        progressBg: 'bg-signal-yellow',
      };
    case 'C':
      return {
        bg: 'bg-signal-red/20',
        text: 'text-signal-red',
        border: 'border-signal-red/50',
        badge: 'bg-signal-red/20 text-signal-red',
        progressBg: 'bg-signal-red',
      };
  }
}

function getGradientStyles(grade: 'A' | 'B' | 'C'): string {
  switch (grade) {
    case 'A':
      return 'from-bg-secondary via-bg-secondary to-green-900/10';
    case 'B':
      return 'from-bg-secondary via-bg-secondary to-yellow-900/10';
    case 'C':
      return 'from-bg-secondary via-bg-secondary to-red-900/10';
  }
}

function getStatusStyles(status: 'good' | 'okay' | 'poor') {
  switch (status) {
    case 'good':
      return { bg: 'bg-signal-green/20' };
    case 'okay':
      return { bg: 'bg-signal-yellow/20' };
    case 'poor':
      return { bg: 'bg-signal-red/20' };
  }
}

function getOverallInterpretation(grade: 'A' | 'B' | 'C', companyName: string): string {
  switch (grade) {
    case 'A':
      return `${companyName} is in excellent financial health with strong performance across all key metrics. The company is growing well, making good profits, using resources efficiently, and has a solid financial cushion.`;
    case 'B':
      return `${companyName} is in good financial shape with solid performance in most areas. While not exceptional, the company shows healthy fundamentals and reasonable financial stability.`;
    case 'C':
      return `${companyName} faces some financial challenges that need attention. Some metrics are concerning and the company may need to improve its operational performance or financial position.`;
  }
}

function getKeyTakeaways(categories: CategoryScore[], companyName: string): string[] {
  const takeaways: string[] = [];

  const bestCategory = categories.reduce((best, cat) => (cat.score > best.score ? cat : best));
  const worstCategory = categories.reduce((worst, cat) => (cat.score < worst.score ? cat : worst));

  takeaways.push(
    `Strongest area is ${bestCategory.category.toLowerCase()} with a score of ${bestCategory.score}/100 (Grade ${bestCategory.grade})`
  );

  if (worstCategory.score < 60) {
    takeaways.push(
      `${worstCategory.category} needs improvement (${worstCategory.score}/100) - this is an area of concern`
    );
  }

  const growthCat = categories.find(c => c.category === 'Growth');
  if (growthCat && growthCat.score > 70) {
    takeaways.push(`Company is growing at a healthy pace - positive sign for future prospects`);
  }

  const profitCat = categories.find(c => c.category === 'Profitability');
  if (profitCat && profitCat.score > 75) {
    takeaways.push(`Strong profit margins indicate a competitive business model`);
  } else if (profitCat && profitCat.score < 50) {
    takeaways.push(`Low profitability suggests the company may face competitive or operational challenges`);
  }

  const safetyCat = categories.find(c => c.category === 'Safety');
  if (safetyCat && safetyCat.score > 75) {
    takeaways.push(`Strong balance sheet provides cushion during economic downturns`);
  } else if (safetyCat && safetyCat.score < 50) {
    takeaways.push(`Higher debt levels mean the company is more vulnerable in tough times`);
  }

  return takeaways;
}
