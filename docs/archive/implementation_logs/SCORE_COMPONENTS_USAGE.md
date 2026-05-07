# Score Visualization Components Usage Guide

## Overview

6 reusable score visualization components for displaying metrics, trends, and analysis across Alpha Signal panels.

**Location:** `apps/web/src/components/scores/`

**Components:**
1. **CircularScoreGauge** - Animated circular gauge for scores (0-100)
2. **ScoreFactorBreakdown** - Horizontal bar chart with expandable factor details
3. **MiniSparkline** - Tiny trend line charts
4. **MetricCard** - Compact metric display with change indicator
5. **TrendIndicator** - 5-segment bar showing trend direction/strength
6. **SeverityBadge** - Color-coded severity pills

---

## 1. CircularScoreGauge

### Props

```typescript
interface CircularScoreGaugeProps {
  score: number;              // 0-100
  label: string;              // Label below gauge
  size?: 'sm' | 'md' | 'lg';  // Default: 'md'
}
```

### Features

- ✅ SVG-based circular gauge
- ✅ Color-coded arc: 0-30 red, 31-60 yellow, 61-100 green
- ✅ Animated from 0 to value on mount (600ms ease-out)
- ✅ Score number centered in gauge
- ✅ Responsive sizes: sm = 80px, md = 120px, lg = 160px

### Usage

```typescript
import { CircularScoreGauge } from '@/components/scores';

<CircularScoreGauge score={85} label="Earnings Quality" size="md" />
```

### Use Cases

- Overall risk scores
- Quality scores (earnings, governance)
- Composite metrics (0-100 scale)
- Dashboard summary cards

---

## 2. ScoreFactorBreakdown

### Props

```typescript
interface ScoreFactor {
  name: string;
  weight: number;        // percentage (e.g., 15 = 15%)
  value: number;         // 0-100
  contribution: number;  // points contributed to total
  explanation?: string;  // optional detail (shown on expand)
}

interface ScoreFactorBreakdownProps {
  factors: ScoreFactor[];
}
```

### Features

- ✅ Horizontal bars colored by value (red/yellow/green)
- ✅ Shows factor name, weight, value, contribution
- ✅ Expandable rows (if explanation provided)
- ✅ Bar width proportional to contribution
- ✅ Smooth transitions on expand/collapse

### Usage

```typescript
import { ScoreFactorBreakdown, ScoreFactor } from '@/components/scores';

const factors: ScoreFactor[] = [
  {
    name: 'DSRI',
    weight: 12.5,
    value: 85,
    contribution: 10.6,
    explanation: 'Days Sales in Receivables Index: Low value indicates healthy receivables',
  },
  // ... more factors
];

<ScoreFactorBreakdown factors={factors} />
```

### Use Cases

- Earnings quality factor breakdown (Beneish M-Score)
- Governance risk factors
- Credit rating components
- Any multi-factor composite score

---

## 3. MiniSparkline

### Props

```typescript
interface MiniSparklineProps {
  data: number[];
  width?: number;         // Default: 80
  height?: number;        // Default: 24
  color?: string;         // Default: '#3B82F6' (blue)
  showLastValue?: boolean; // Default: false
}
```

### Features

- ✅ Tiny SVG line chart (no axes or labels)
- ✅ Auto-scales to data range
- ✅ Optional dot on last value
- ✅ Customizable color
- ✅ Shows trend direction at a glance

### Usage

```typescript
import { MiniSparkline } from '@/components/scores';

<MiniSparkline
  data={[12, 14, 13, 15, 17, 16, 18, 20]}
  width={100}
  height={24}
  color="#3CD280"
  showLastValue
/>
```

### Use Cases

- Quick trend visualization in tables
- Inline charts next to metrics
- Historical value trends
- Price/volume mini-charts

---

## 4. MetricCard

### Props

```typescript
interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;           // percentage change (e.g., 5.2 = +5.2%)
  changeLabel?: string;      // e.g., "vs last quarter", "YoY"
  sparklineData?: number[];  // optional trend line
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'default';
}
```

### Features

- ✅ Compact card with label, value, change indicator
- ✅ Arrow icon for positive/negative change
- ✅ Optional sparkline at bottom
- ✅ Color-coded value and sparkline
- ✅ Hover effect (border color change)

### Usage

```typescript
import { MetricCard } from '@/components/scores';

<MetricCard
  label="Return on Equity"
  value="16.8%"
  change={5.2}
  changeLabel="YoY"
  sparklineData={[12, 13, 14, 15, 16, 17, 18, 17]}
  color="green"
/>
```

### Use Cases

- Key financial metrics (ROE, ROCE, PE Ratio)
- Performance indicators
- Growth metrics
- Comparison values

---

## 5. TrendIndicator

### Props

```typescript
type TrendType = 'strong_downtrend' | 'downtrend' | 'sideways' | 'uptrend' | 'strong_uptrend';

interface TrendIndicatorProps {
  trend: TrendType;
}
```

### Features

- ✅ 5-segment horizontal bar (red → orange → yellow → light green → dark green)
- ✅ Current segment highlighted and enlarged
- ✅ Arrow pointer below bar (up/down/sideways icon)
- ✅ Text label showing trend name
- ✅ Smooth transitions when trend changes

### Usage

```typescript
import { TrendIndicator } from '@/components/scores';

<TrendIndicator trend="strong_uptrend" />
```

### Use Cases

- Price action trends
- Sentiment indicators
- Momentum visualization
- Technical analysis signals

---

## 6. SeverityBadge

### Props

```typescript
type SeverityLevel = 'high' | 'medium' | 'low' | 'clear';

interface SeverityBadgeProps {
  severity: SeverityLevel;
  label?: string;        // optional custom label (defaults to severity in caps)
  size?: 'sm' | 'md';    // Default: 'md'
}
```

### Features

- ✅ Color-coded pill badge
- ✅ HIGH = red bg, MEDIUM = yellow bg, LOW = gray bg, CLEAR = green bg
- ✅ Customizable label text
- ✅ Two sizes (sm, md)

### Usage

```typescript
import { SeverityBadge } from '@/components/scores';

<SeverityBadge severity="high" />
<SeverityBadge severity="medium" label="WARNING" size="sm" />
```

### Use Cases

- Risk flags
- News impact ratings
- Alert levels
- Status indicators

---

## Combined Examples

### Example 1: Risk Dashboard Summary

```typescript
import {
  CircularScoreGauge,
  MiniSparkline,
  SeverityBadge,
  TrendIndicator
} from '@/components/scores';

<div className="bg-bg-secondary p-6 rounded-lg">
  {/* Overall score */}
  <CircularScoreGauge score={72} label="Risk Score" size="lg" />

  {/* Individual risk metrics */}
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <span>Earnings Quality</span>
      <div className="flex items-center gap-2">
        <MiniSparkline data={[65, 68, 72, 75, 78]} width={60} height={20} />
        <SeverityBadge severity="clear" size="sm" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <span>Debt Levels</span>
      <div className="flex items-center gap-2">
        <MiniSparkline data={[80, 75, 70, 65, 60]} width={60} height={20} />
        <SeverityBadge severity="medium" size="sm" />
      </div>
    </div>
  </div>

  {/* Trend */}
  <TrendIndicator trend="uptrend" />
</div>
```

### Example 2: Financial Metrics Grid

```typescript
import { MetricCard } from '@/components/scores';

<div className="grid grid-cols-3 gap-4">
  <MetricCard
    label="ROE"
    value="16.8%"
    change={5.2}
    changeLabel="YoY"
    sparklineData={[12, 13, 15, 16, 17]}
    color="green"
  />
  <MetricCard
    label="ROCE"
    value="14.2%"
    change={3.1}
    changeLabel="YoY"
    sparklineData={[11, 12, 13, 14, 14]}
    color="green"
  />
  <MetricCard
    label="PE Ratio"
    value="24.5"
    change={-2.1}
    sparklineData={[28, 27, 26, 25, 24]}
    color="blue"
  />
</div>
```

### Example 3: Quality Score with Factor Breakdown

```typescript
import { CircularScoreGauge, ScoreFactorBreakdown } from '@/components/scores';

const factors = [
  { name: 'DSRI', weight: 12.5, value: 85, contribution: 10.6, explanation: '...' },
  { name: 'GMI', weight: 12.5, value: 72, contribution: 9.0, explanation: '...' },
  // ... more factors
];

<div className="space-y-6">
  <CircularScoreGauge score={75} label="Earnings Quality Score" size="lg" />
  <ScoreFactorBreakdown factors={factors} />
</div>
```

---

## Integration with Existing Panels

### Fundamental Analysis Panel

**Replace:** Manual metric displays
**With:** `MetricCard` components

```typescript
// Before
<div className="p-4">
  <div className="text-xs">ROE</div>
  <div className="text-2xl">16.8%</div>
  <div className="text-green">+5.2%</div>
</div>

// After
<MetricCard label="ROE" value="16.8%" change={5.2} color="green" />
```

### Risk Dashboard Panel

**Replace:** Custom circular gauge
**With:** `CircularScoreGauge`

```typescript
// Before
<svg>
  {/* 50+ lines of SVG code */}
</svg>

// After
<CircularScoreGauge score={72} label="Governance Risk" size="md" />
```

**Replace:** Risk flag indicators
**With:** `SeverityBadge`

```typescript
// Before
<span className="px-2 py-1 bg-signal-red text-white">HIGH</span>

// After
<SeverityBadge severity="high" />
```

### Technical Analysis Panel

**Replace:** Trend text labels
**With:** `TrendIndicator`

```typescript
// Before
<span className="text-signal-green">Strong Uptrend</span>

// After
<TrendIndicator trend="strong_uptrend" />
```

---

## Best Practices

### ✅ Do's

- Use `CircularScoreGauge` for 0-100 scores (quality, risk, sentiment)
- Use `MetricCard` for financial metrics (ROE, PE, margins)
- Use `MiniSparkline` for quick trends in tables
- Use `SeverityBadge` for categorical severity levels
- Use `TrendIndicator` for directional trends (momentum, sentiment)
- Use `ScoreFactorBreakdown` for composite scores with components

### ❌ Don'ts

- Don't use `CircularScoreGauge` for values outside 0-100 range
- Don't use `MiniSparkline` for large datasets (use full chart instead)
- Don't nest interactive components (e.g., clickable cards with expandable rows)
- Don't override color schemes (use provided color props)

---

## Color Reference

### Score Colors (CircularScoreGauge, ScoreFactorBreakdown)

- **0-30**: `#F85149` (signal-red) - Poor/High risk
- **31-60**: `#FBB80E` (signal-yellow) - Moderate
- **61-100**: `#3CD280` (signal-green) - Good/Low risk

### Severity Colors (SeverityBadge)

- **High**: `bg-signal-red` - Critical issues
- **Medium**: `bg-signal-yellow` - Warnings
- **Low**: `bg-gray-600` - Minor concerns
- **Clear**: `bg-signal-green` - All clear

### Metric Colors (MetricCard)

- **Green**: `#3CD280` - Positive metrics (ROE, growth)
- **Red**: `#F85149` - Negative metrics (debt, losses)
- **Blue**: `#3B82F6` - Neutral metrics (PE, valuations)
- **Yellow**: `#FBB80E` - Caution metrics (volatility)

---

## Component Files

```
apps/web/src/components/scores/
├── CircularScoreGauge.tsx
├── ScoreFactorBreakdown.tsx
├── MiniSparkline.tsx
├── MetricCard.tsx
├── TrendIndicator.tsx
├── SeverityBadge.tsx
├── ScoreComponentsDemo.tsx  (example usage)
└── index.ts                 (exports)
```

**Import from:** `@/components/scores` or `../components/scores/`

---

## Migration Checklist

To migrate existing panels to use score components:

1. **Identify score visualizations:**
   - [ ] Circular gauges (governance, quality, risk scores)
   - [ ] Metric displays (ROE, ROCE, PE Ratio)
   - [ ] Trend indicators (price action, sentiment)
   - [ ] Severity badges (risk flags, impact levels)

2. **Replace with reusable components:**
   - [ ] Import from `@/components/scores`
   - [ ] Pass appropriate props (score, label, size, etc.)
   - [ ] Remove old custom implementation

3. **Test animations:**
   - [ ] CircularScoreGauge animates on mount
   - [ ] ScoreFactorBreakdown rows expand/collapse
   - [ ] TrendIndicator transitions smoothly

4. **Verify dark theme compatibility:**
   - [ ] All components use design system tokens
   - [ ] Text readable on dark backgrounds
   - [ ] Colors consistent with theme

---

## Demo

Run the demo to see all components in action:

```typescript
import { ScoreComponentsDemo } from '@/components/scores/ScoreComponentsDemo';

<ScoreComponentsDemo />
```

The demo includes examples of all 6 components with realistic data and combined usage patterns.
