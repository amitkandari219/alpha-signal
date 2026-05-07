# CollapsiblePanel & PanelGrid Usage Guide

## Overview

Two new reusable components for consistent panel layout and behavior across the stock detail page:

1. **CollapsiblePanel** - Wrapper component for all analysis panels
2. **PanelGrid** - Layout system for arranging panels responsively

---

## CollapsiblePanel Component

### Props

```typescript
interface CollapsiblePanelProps {
  title: string;                    // Panel title
  icon: LucideIcon;                 // Icon component from lucide-react
  badge?: {                         // Optional badge (e.g., "AI" badge)
    text: string;
    color: 'purple' | 'green' | 'yellow' | 'red';
  };
  defaultExpanded?: boolean;        // Default: true
  isLoading?: boolean;              // Shows skeleton state
  error?: Error;                    // Shows error state with retry button
  headerRight?: ReactNode;          // Extra controls in header (toggles, filters, etc.)
  lastUpdated?: Date;               // Shows "Updated Xh ago" timestamp
  onRetry?: () => void;             // Retry handler for error state
  children: ReactNode;              // Panel content
}
```

### Features

✅ **Consistent Styling**
- Dark card with `bg-bg-secondary` background
- `border-border-default` border
- `rounded-lg` corners
- Hover effect on header

✅ **Header Components**
- Icon (5x5, text-secondary)
- Title (lg, semibold, text-primary)
- Optional badge (purple/green/yellow/red)
- Optional "Updated Xh ago" timestamp (hidden on mobile)
- Optional header right content (custom controls)
- Expand/collapse chevron (rotates on toggle)

✅ **Smooth Animation**
- CSS max-height transition (200ms ease-in-out)
- Opacity fade (0 to 100%)
- Smooth height animation without layout shift

✅ **Loading State**
- Replaces children with skeleton grid
- 3 rows of pulsing rectangles (bg-tertiary)
- Animate-pulse effect

✅ **Error State**
- Red-tinted card (border-signal-red/50, bg-signal-red/5)
- Error icon with message
- "Retry" button (if onRetry provided)
- Centered layout with clear messaging

✅ **Responsive**
- Timestamp hidden on mobile
- Header right content stops click propagation
- Truncated title with ellipsis
- Flex layout with proper shrinking

---

## PanelGrid Components

### PanelGrid (Main Container)

```typescript
<PanelGrid>
  {/* Panels with consistent 16px spacing */}
</PanelGrid>
```

Applies `space-y-4` (16px gap) between all panels.

### PanelRow (Responsive Grid)

```typescript
<PanelRow columns={2}>
  <Panel1 />
  <Panel2 />
</PanelRow>
```

**Props:**
- `columns?: 1 | 2 | 3 | 4` - Number of columns on desktop
- Automatically single column on mobile
- 16px gap between panels

**Breakpoints:**
- `columns={1}`: Always single column
- `columns={2}`: 1 col mobile → 2 cols lg (1024px+)
- `columns={3}`: 1 col mobile → 2 cols md (768px+) → 3 cols lg (1024px+)
- `columns={4}`: 1 col mobile → 2 cols md → 4 cols lg

### PanelCol (Column Span)

```typescript
<PanelRow columns={4}>
  <PanelCol span={2}>
    <WidePanel />
  </PanelCol>
  <PanelCol span={1}>
    <NarrowPanel1 />
  </PanelCol>
  <PanelCol span={1}>
    <NarrowPanel2 />
  </PanelCol>
</PanelRow>
```

Controls width within a row (uses lg:col-span-X).

### Specialized Layouts

```typescript
// 2-column (e.g., Bull/Bear cases side-by-side)
<TwoColumnLayout>
  <BullCasePanel />
  <BearCasePanel />
</TwoColumnLayout>

// 3-column (e.g., metric cards)
<ThreeColumnLayout>
  <MetricCard1 />
  <MetricCard2 />
  <MetricCard3 />
</ThreeColumnLayout>

// Full-width (default, but explicit)
<FullWidthPanel>
  <AIIntelligencePanel />
</FullWidthPanel>
```

---

## Usage Examples

### Basic Panel

```typescript
import { CollapsiblePanel } from '@/components/common/CollapsiblePanel';
import { TrendingUp } from 'lucide-react';

<CollapsiblePanel
  title="Technical Analysis"
  icon={TrendingUp}
  defaultExpanded={false}
>
  {/* Panel content */}
  <div>Technical analysis charts and data...</div>
</CollapsiblePanel>
```

### Panel with AI Badge

```typescript
import { Sparkles } from 'lucide-react';

<CollapsiblePanel
  title="AI Intelligence"
  icon={Sparkles}
  badge={{ text: 'AI Powered', color: 'purple' }}
  defaultExpanded={true}
>
  {/* AI-generated content */}
</CollapsiblePanel>
```

### Panel with Loading State

```typescript
import { useQuery } from '@tanstack/react-query';

const MyPanel = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['panelData'],
    queryFn: fetchPanelData,
  });

  return (
    <CollapsiblePanel
      title="Data Panel"
      icon={BarChart}
      isLoading={isLoading}
      error={error}
      onRetry={() => refetch()}
      lastUpdated={data?.timestamp}
    >
      {data && <DataDisplay data={data} />}
    </CollapsiblePanel>
  );
};
```

### Panel with Header Controls

```typescript
<CollapsiblePanel
  title="Performance Chart"
  icon={LineChart}
  headerRight={
    <div className="flex items-center gap-2">
      {['1D', '1W', '1M', '1Y'].map((period) => (
        <button
          key={period}
          onClick={() => setPeriod(period)}
          className={`px-3 py-1 text-xs font-medium rounded ${
            selectedPeriod === period
              ? 'bg-signal-blue text-white'
              : 'bg-bg-secondary text-text-muted hover:text-text-secondary'
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  }
>
  <Chart data={data} period={selectedPeriod} />
</CollapsiblePanel>
```

---

## Layout Examples

### Single Column Layout (Default)

```typescript
<PanelGrid>
  <AIIntelligencePanel />
  <FundamentalAnalysisPanel />
  <TechnicalAnalysisPanel />
  <NewsSentimentPanel />
</PanelGrid>
```

### Two-Column Layout (Side-by-Side)

```typescript
<PanelGrid>
  <AIIntelligencePanel />  {/* Full width */}

  <PanelRow columns={2}>
    <BullCasePanel />
    <BearCasePanel />
  </PanelRow>

  <TechnicalAnalysisPanel />  {/* Full width */}
</PanelGrid>
```

### Mixed Layout (Complex)

```typescript
<PanelGrid>
  {/* Full width hero panel */}
  <AIIntelligencePanel />

  {/* 2-column fundamental metrics */}
  <PanelRow columns={2}>
    <ValuationMetrics />
    <ProfitabilityMetrics />
  </PanelRow>

  {/* 3-column metric cards */}
  <PanelRow columns={3}>
    <ROECard />
    <ROCECard />
    <PECard />
  </PanelRow>

  {/* Full width technical */}
  <TechnicalAnalysisPanel />

  {/* Asymmetric 2-column with span control */}
  <PanelRow columns={3}>
    <PanelCol span={2}>
      <NewsFeed />
    </PanelCol>
    <PanelCol span={1}>
      <KeyMetrics />
    </PanelCol>
  </PanelRow>
</PanelGrid>
```

---

## Refactoring Existing Panels

### Before (Current Implementation)

```typescript
export const TechnicalAnalysisPanel: React.FC<Props> = ({ symbol }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const data = getTechnicalData(symbol);

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
      {/* Panel Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-signal-blue" />
          <h2 className="text-lg font-semibold text-text-primary">Technical Analysis</h2>
        </div>
        <button className="text-text-muted hover:text-text-secondary transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Panel Content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 space-y-6 border-t border-border-primary">
          {/* Content here */}
        </div>
      </div>
    </div>
  );
};
```

### After (Using CollapsiblePanel)

```typescript
import { CollapsiblePanel } from '@/components/common/CollapsiblePanel';
import { TrendingUp } from 'lucide-react';

export const TechnicalAnalysisPanel: React.FC<Props> = ({ symbol, defaultExpanded }) => {
  const data = getTechnicalData(symbol);

  return (
    <CollapsiblePanel
      title="Technical Analysis"
      icon={TrendingUp}
      defaultExpanded={defaultExpanded}
    >
      <div className="space-y-6">
        {/* Content here - no need for wrapper padding/border */}
      </div>
    </CollapsiblePanel>
  );
};
```

**Benefits:**
- ✅ 50+ lines of boilerplate removed
- ✅ Consistent behavior across all panels
- ✅ Automatic loading/error states
- ✅ Accessible (aria-label on button)
- ✅ Single source of truth for styling
- ✅ Easy to add features globally (e.g., pin panel, export panel)

---

## Advanced Use Cases

### Nested Sections (Sub-Panels)

```typescript
<CollapsiblePanel title="Fundamental Analysis" icon={BarChart}>
  <div className="space-y-4">
    <SubSection title="Valuation Metrics">
      <ValuationTable />
    </SubSection>

    <SubSection title="Growth Metrics">
      <GrowthChart />
    </SubSection>
  </div>
</CollapsiblePanel>

// SubSection is a lighter-weight collapsible without the full panel styling
```

### Conditional Panel

```typescript
{hasData && (
  <CollapsiblePanel
    title="Insider Trading"
    icon={Users}
    badge={insiderActivity > 0 ? { text: 'Active', color: 'yellow' } : undefined}
  >
    <InsiderTradingData />
  </CollapsiblePanel>
)}
```

### Panel with Action Buttons

```typescript
<CollapsiblePanel
  title="Report"
  icon={FileText}
  headerRight={
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="text-xs text-signal-blue hover:underline"
      >
        Export PDF
      </button>
      <button
        onClick={handleShare}
        className="text-xs text-signal-blue hover:underline"
      >
        Share
      </button>
    </div>
  }
>
  <ReportContent />
</CollapsiblePanel>
```

---

## Styling Customization

### Custom Panel Styles

The CollapsiblePanel uses standard Tailwind classes. You can wrap it in a div for custom styling:

```typescript
<div className="shadow-lg">
  <CollapsiblePanel title="Premium Feature" icon={Star}>
    {/* Content */}
  </CollapsiblePanel>
</div>
```

### Custom Badge Colors

Currently supports 4 colors. To add more:

```typescript
// In CollapsiblePanel.tsx, update getBadgeColor():
case 'blue':
  return 'bg-signal-blue text-white';
case 'orange':
  return 'bg-signal-orange text-white';
```

---

## Best Practices

### ✅ Do's

- Use `defaultExpanded={true}` for most important panel (e.g., AI Intelligence)
- Set `defaultExpanded={false}` for secondary panels to reduce initial page height
- Provide meaningful error messages in error state
- Use `headerRight` for panel-specific controls (period toggles, filters)
- Use `lastUpdated` for data that refreshes (prices, news)
- Keep panel content self-contained (no absolute positioning that breaks on collapse)

### ❌ Don'ts

- Don't nest CollapsiblePanel inside CollapsiblePanel (use SubSection instead)
- Don't put navigation elements in `headerRight` (should be panel-specific controls only)
- Don't exceed 3-4 columns in PanelRow (readability on desktop)
- Don't use CollapsiblePanel for small inline sections (overkill)

---

## Migration Checklist

To migrate existing panels to use CollapsiblePanel:

1. **Remove boilerplate:**
   - [ ] Delete `isExpanded` state management
   - [ ] Delete header JSX (icon, title, chevron, click handler)
   - [ ] Delete animation wrapper div
   - [ ] Delete border/padding from content wrapper

2. **Add CollapsiblePanel:**
   - [ ] Import `CollapsiblePanel` and icon from `lucide-react`
   - [ ] Wrap content in `<CollapsiblePanel>`
   - [ ] Pass `title` and `icon` props
   - [ ] Pass `defaultExpanded` prop (default is true)
   - [ ] Move any header controls to `headerRight` prop

3. **Update content:**
   - [ ] Remove padding/spacing wrapper (CollapsiblePanel provides `p-6`)
   - [ ] Keep only the actual content
   - [ ] Test expand/collapse animation

4. **Optional enhancements:**
   - [ ] Add loading state with `isLoading` prop
   - [ ] Add error handling with `error` and `onRetry` props
   - [ ] Add timestamp with `lastUpdated` prop
   - [ ] Add badge if appropriate (e.g., AI badge)

---

## Component Files

- **CollapsiblePanel:** `apps/web/src/components/common/CollapsiblePanel.tsx`
- **PanelGrid:** `apps/web/src/components/common/PanelGrid.tsx`

Both components are fully typed with TypeScript and follow the existing design system tokens.
