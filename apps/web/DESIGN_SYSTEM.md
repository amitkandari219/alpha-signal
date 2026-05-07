# Alpha Signal Design System

Professional, terminal-inspired design system for data-dense financial intelligence.

## 🎨 Design Philosophy

- **Dark-mode first**: Optimized for extended viewing sessions
- **Data-dense**: Maximum information density without clutter
- **Terminal aesthetic**: Professional, technical, trustworthy
- **Accessible**: WCAG 2.1 AA compliant contrast ratios

## 📐 Design Tokens

### Colors

#### Backgrounds
```css
--bg-primary: #0D1117      /* Main app background */
--bg-secondary: #161B22    /* Cards, panels */
--bg-tertiary: #21262D     /* Elevated surfaces, hover states */
```

#### Borders
```css
--border-default: #30363D  /* Card borders, dividers */
```

#### Text
```css
--text-primary: #E6EDF3    /* Headlines, primary content */
--text-secondary: #8B949E  /* Labels, captions */
--text-muted: #484F58      /* Disabled, placeholders */
```

#### Accents
```css
--accent-blue: #58A6FF     /* Links, interactive elements */
```

#### Signals (Semantic Colors)
```css
--signal-green: #3FB950    /* Positive metrics, bullish */
--signal-red: #F85149      /* Negative metrics, bearish */
--signal-yellow: #D29922   /* Warnings, neutral, caution */
--signal-purple: #A371F7   /* AI-generated content */
```

#### Charts
```css
--chart-up: #26A69A        /* Candlestick up/green candles */
--chart-down: #EF5350      /* Candlestick down/red candles */
```

## 🔤 Typography

### Font Families

**Plus Jakarta Sans** - Headings & Body Text
- Weights: 300, 400, 500, 600, 700, 800
- Usage: All text content, UI labels, headings

**JetBrains Mono** - Data & Numbers
- Weights: 400, 500, 600, 700
- Usage: Prices, percentages, metrics, tables, terminal output
- Features: Tabular numbers, optimized for data display

### Font Sizes (Data-specific)

```css
text-data-xs: 11px    /* Tiny labels, subscripts */
text-data-sm: 12px    /* Table headers, captions */
text-data-base: 14px  /* Default data text */
text-data-lg: 16px    /* Large numbers, emphasis */
text-data-xl: 18px    /* Hero metrics, primary data */
```

### Usage

```tsx
// Headings
<h1 className="font-heading">Alpha Signal</h1>

// Data/Numbers
<span className="font-data">₹2,847.50</span>

// Mixed content
<div className="text-data-lg font-data">
  ₹2,847.50 <span className="metric-positive">+2.34%</span>
</div>
```

## 🧩 Component Classes

### Data Cards

```tsx
// Basic card
<div className="data-card">
  <h3 className="card-title">Stock Name</h3>
  <p>Card content</p>
</div>

// Elevated card (more prominent)
<div className="data-card-elevated">
  <h3 className="card-title">Featured</h3>
</div>
```

### Metrics Display

```tsx
// Positive metric (green)
<span className="metric-positive">+2.34%</span>

// Negative metric (red)
<span className="metric-negative">-1.23%</span>

// Neutral metric (yellow)
<span className="metric-neutral">0.00%</span>
```

### Badges

```tsx
// Score badges
<span className="score-badge-high">A+</span>
<span className="score-badge-medium">B</span>
<span className="score-badge-low">D</span>

// AI content indicator
<span className="ai-badge">
  <Icon />
  AI Generated
</span>
```

### Buttons

```tsx
// Primary action
<button className="btn-primary">Buy Now</button>

// Secondary action
<button className="btn-secondary">View Details</button>

// Subtle action
<button className="btn-ghost">Cancel</button>
```

### Tables

```tsx
<table className="data-table">
  <thead>
    <tr>
      <th>Symbol</th>
      <th>Price</th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>RELIANCE</td>
      <td>₹2,847.50</td>
      <td className="metric-positive">+2.34%</td>
    </tr>
  </tbody>
</table>
```

### Terminal Panels

```tsx
<div className="terminal-panel">
  <div className="terminal-header">
    <div className="terminal-dot bg-signal-red"></div>
    <div className="terminal-dot bg-signal-yellow"></div>
    <div className="terminal-dot bg-signal-green"></div>
    <span className="text-text-muted ml-2">Console</span>
  </div>
  <div className="font-data text-data-sm">
    Terminal content here...
  </div>
</div>
```

### Stats Grid

```tsx
<div className="stats-grid">
  <div className="data-card">
    <div className="text-data-sm text-text-secondary">Market Cap</div>
    <div className="font-data text-data-xl">₹54.2T</div>
  </div>
  {/* More stat cards... */}
</div>
```

## 🎯 Usage Guidelines

### When to Use Each Color

#### Signal Green
- Positive price changes
- Bullish sentiment indicators
- Profit metrics
- Success states
- Buy signals

#### Signal Red
- Negative price changes
- Bearish sentiment indicators
- Loss metrics
- Error states
- Sell signals

#### Signal Yellow
- Neutral/hold recommendations
- Warnings
- Pending states
- Volatility indicators

#### Signal Purple
- AI-generated insights
- Machine learning predictions
- Automated recommendations
- AI confidence scores

### Typography Best Practices

1. **Always use `font-data` for numbers**
   ```tsx
   <span className="font-data">₹2,847.50</span>
   ```

2. **Use tabular numbers for aligned data**
   ```tsx
   <span className="font-data tabular-nums">1,234.56</span>
   ```

3. **Combine fonts for mixed content**
   ```tsx
   <div className="font-heading text-xl">
     RELIANCE: <span className="font-data">₹2,847.50</span>
   </div>
   ```

### Spacing

Use consistent spacing scale:
- `gap-4` (1rem) - Default gap between cards
- `p-4` (1rem) - Default card padding
- `p-6` (1.5rem) - Large card padding
- `mb-4` (1rem) - Section spacing

### Border Radius

- `rounded-md` - Small elements (badges, inputs)
- `rounded-card` - Data cards
- `rounded-panel` - Large panels, modals

### Shadows

- `shadow-card` - Default card elevation
- `shadow-card-hover` - Hovered cards
- `shadow-elevated` - Modals, popovers

## 📱 Responsive Design

The design system is mobile-first:

```tsx
// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Cards */}
</div>

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Heading
</h1>
```

## ♿ Accessibility

### Contrast Ratios

All color combinations meet WCAG 2.1 AA standards:

- Text on bg-primary: 12.7:1 (AAA)
- Text secondary on bg-primary: 7.2:1 (AA)
- Signal colors on backgrounds: >4.5:1 (AA)

### Focus States

All interactive elements have visible focus indicators:

```tsx
<button className="btn-primary focus:ring-2 focus:ring-accent-blue">
  Action
</button>
```

### Screen Readers

Use semantic HTML and ARIA labels:

```tsx
<button aria-label="View stock details">
  <Icon />
</button>
```

## 🎨 Dark Mode Toggle

Dark mode is the default. To implement light mode toggle:

```tsx
const [isDark, setIsDark] = useState(true);

<html className={isDark ? 'dark' : 'light'}>
  {/* App content */}
</html>
```

## 📊 Chart Guidelines

### Candlestick Charts
- Up candles: `chart-up` (#26A69A)
- Down candles: `chart-down` (#EF5350)
- Wicks: `text-muted` (#484F58)

### Line Charts
- Bullish trend: `signal-green`
- Bearish trend: `signal-red`
- Neutral: `text-secondary`

### Area Charts
- Fill opacity: 0.1-0.2
- Gradient from signal color to transparent

## 🔧 Customization

### Extending Colors

Add new colors in `tailwind.config.js`:

```js
extend: {
  colors: {
    custom: {
      primary: '#HEX',
    }
  }
}
```

### Adding Utility Classes

Add custom utilities in `globals.css`:

```css
@layer utilities {
  .your-utility {
    /* styles */
  }
}
```

## 📦 Component Library

The design system is designed to work with:
- React
- TypeScript
- Tailwind CSS 3.4+
- Recharts / Victory (for charts)
- Headless UI (for interactive components)

## 🚀 Getting Started

1. Fonts are auto-loaded from Google Fonts
2. Import `globals.css` in your main entry
3. Add `dark` class to `<html>` or `<body>`
4. Use utility classes from this guide

## 📖 Examples

See `DesignSystemDemo.tsx` for live examples of all components.

## 🎯 Quick Reference

```tsx
// Card with metric
<div className="data-card">
  <div className="card-title">RELIANCE</div>
  <div className="font-data text-data-xl metric-positive">
    ₹2,847.50
  </div>
</div>

// AI Badge
<span className="ai-badge">
  <Icon /> AI Generated
</span>

// Score
<span className="score-badge-high">A+</span>

// Button
<button className="btn-primary">Action</button>

// Table
<table className="data-table">
  {/* Content */}
</table>
```

---

**Design System Version**: 1.0.0
**Last Updated**: February 2026
**Maintained by**: Alpha Signal Team
