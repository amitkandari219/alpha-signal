# Testing AI Pattern Detection - Complete Guide

## Quick Start

### Step 1: Add Test Component to Chart Page

Temporarily add the test component to your stock chart page:

```tsx
import { AIPatternTest } from '@/components/chart/AIPatternTest';

// In your chart component, add:
<AIPatternTest data={chartData} symbol={symbol} />
```

This will show a floating panel with real-time pattern detection results.

### Step 2: Open Browser Console

Press `F12` or `Cmd+Option+I` to open DevTools. The test component logs detailed pattern data to console.

---

## Testing Each Pattern Type

### 1. 📊 Support & Resistance Lines

**What it detects:** Key price levels where stock repeatedly bounces

**Requirements:**
- At least 50+ data points
- 3+ touches at similar price levels (within 2% tolerance)

**How to test:**
1. Open a stock chart with 6M or 1Y period
2. Enable "Support & Resistance" in AI Patterns dropdown
3. Look for horizontal dashed lines at key levels

**Expected behavior:**
- Green lines = Support (price bounces up from these levels)
- Red lines = Resistance (price bounces down from these levels)
- Label shows price level and touch count

**Console output:**
```
[AI Pattern Test] supportResistance: 3 patterns found
[AI Pattern Test] supportResistance details: [
  {
    type: 'supportResistance',
    level: 450.25,
    touchPoints: [...],
    isSupport: true,
    confidence: 0.8
  }
]
```

**Good test stocks:**
- RELIANCE (clear support/resistance)
- TCS (multiple levels)
- INFY (strong resistance zones)

---

### 2. 📈 Trend Channel

**What it detects:** Parallel upper and lower trend lines (ascending/descending channel)

**Requirements:**
- At least 60 data points
- R² > 0.7 for both upper and lower lines
- Slopes within 20% of each other (parallel)

**How to test:**
1. Use 6M or 1Y period
2. Enable "Trend Channel" in AI Patterns dropdown
3. Look for parallel lines with shaded area between

**Expected behavior:**
- Two parallel diagonal lines
- Shaded fill between them
- Label shows direction (▲/▼) and R² value

**Console output:**
```
[AI Pattern Test] trendChannel: 1 patterns found
{
  type: 'trendChannel',
  direction: 'up',
  rSquared: 0.85,
  upperSlope: 0.5,
  lowerSlope: 0.48
}
```

**Good test stocks:**
- HDFCBANK (clean uptrend)
- TATASTEEL (trending periods)
- BAJFINANCE (strong channels)

---

### 3. ⭐ Golden/Death Cross (MA Crossover)

**What it detects:** SMA50 crossing above/below SMA200

**Requirements:**
- At least 200+ data points
- SMA50 crosses SMA200

**How to test:**
1. Use 1Y or 5Y period
2. Enable "Golden/Death Cross" in AI Patterns dropdown
3. Look for star ⭐ or skull 💀 marker

**Expected behavior:**
- ⭐ Golden Cross = SMA50 crosses ABOVE SMA200 (bullish)
- 💀 Death Cross = SMA50 crosses BELOW SMA200 (bearish)
- Shows % performance since crossover

**Console output:**
```
[AI Pattern Test] maCrossover: 1 patterns found
{
  type: 'maCrossover',
  isGolden: true,
  crossoverDate: '2024-06-15',
  performanceSinceCross: 12.5
}
```

**Good test stocks:**
- Any stock with 1Y+ data
- Look for periods with trend changes

---

### 4. 📉 RSI Divergence

**What it detects:** Price and RSI moving in opposite directions (bullish/bearish divergence)

**Requirements:**
- At least 30+ recent data points
- Bullish: price lower low + RSI higher low (RSI < 40)
- Bearish: price higher high + RSI lower high (RSI > 60)

**How to test:**
1. Use 3M or 6M period
2. Enable "RSI Divergence" in AI Patterns dropdown
3. Also enable RSI indicator to see the divergence
4. Look for diagonal dashed lines connecting divergence points

**Expected behavior:**
- Green line = Bullish divergence (potential reversal up)
- Red line = Bearish divergence (potential reversal down)
- Lines on both price chart and RSI panel

**Console output:**
```
[AI Pattern Test] rsiDivergence: 1 patterns found
{
  type: 'rsiDivergence',
  isBullish: true,
  pricePoints: [{date: '...', price: 450}, {date: '...', price: 445}],
  rsiPoints: [{date: '...', value: 35}, {date: '...', value: 38}]
}
```

**Good test stocks:**
- Volatile stocks with RSI extremes
- Stocks near oversold/overbought levels

---

### 5. 🔊 Volume Climax

**What it detects:** Unusual volume spikes (3× or more than 20-day average)

**Requirements:**
- Volume > 3× the 20-day average

**How to test:**
1. Use any period (1M, 3M works well)
2. Enable "Volume Climax" in AI Patterns dropdown
3. Look for yellow circular markers on high volume bars

**Expected behavior:**
- Yellow highlight on volume bar
- Label shows volume multiplier (e.g., "3.5× avg volume")
- Often occurs at trend changes or news events

**Console output:**
```
[AI Pattern Test] volumeClimax: 4 patterns found
{
  type: 'volumeClimax',
  date: '2024-05-20',
  volumeRatio: 4.2,
  volume: 25000000,
  priceChange: 5.3
}
```

**Good test stocks:**
- Any stock during earnings/results
- Stocks with recent news events
- TATAPOWER, SUZLON (high volume activity)

---

### 6. ↕️ Price Gaps

**What it detects:** Gap ups/downs > 1% between consecutive candles

**Requirements:**
- Gap up: current low > previous high
- Gap down: current high < previous low
- Gap size > 1%

**How to test:**
1. Use 1M or 3M period
2. Enable "Price Gaps" in AI Patterns dropdown
3. Look for semi-transparent rectangles between candles

**Expected behavior:**
- Green rectangle = Gap up
- Red rectangle = Gap down
- Shows gap % and if gap was filled
- Dashed border if gap was filled later

**Console output:**
```
[AI Pattern Test] gaps: 2 patterns found
{
  type: 'gaps',
  gapType: 'up',
  gapSize: 2.5,
  isFilled: false,
  gapDate: '2024-07-10'
}
```

**Good test stocks:**
- Stocks with news-driven moves
- Post-earnings gaps
- ADANIPORTS, ADANIENT (frequent gaps)

---

### 7. 📦 Consolidation & Breakout

**What it detects:** Tight trading ranges (≤5% for 15+ days) and subsequent breakouts

**Requirements:**
- Price range ≤5% for 15+ consecutive days
- Optional: breakout above/below range

**How to test:**
1. Use 3M or 6M period
2. Enable "Consolidation & Breakout" in AI Patterns dropdown
3. Look for dashed rectangles showing consolidation zones

**Expected behavior:**
- Purple/Blue dashed rectangle around consolidation zone
- Arrow showing breakout direction (if broken out)
- Label shows range % and duration

**Console output:**
```
[AI Pattern Test] consolidationBreakout: 1 patterns found
{
  type: 'consolidationBreakout',
  consolidationRange: 3.2,
  breakoutDirection: 'up',
  consolidationStart: '2024-06-01',
  consolidationEnd: '2024-06-20'
}
```

**Good test stocks:**
- Stocks after correction periods
- Stocks building bases

---

## Complete Testing Checklist

### ✅ Basic Functionality

1. **Pattern Detection**
   - [ ] Open a stock chart with 1Y data
   - [ ] Click AI Patterns dropdown (purple sparkle icon)
   - [ ] Enable "Support & Resistance"
   - [ ] See horizontal lines appear on chart
   - [ ] Check console for detection logs

2. **Pattern Toggles**
   - [ ] Enable/disable each pattern individually
   - [ ] Patterns appear/disappear immediately
   - [ ] "Enable All" button works
   - [ ] "Disable All" button works

3. **Visual Rendering**
   - [ ] Patterns render correctly over chart
   - [ ] Purple "AI" badge visible on patterns
   - [ ] No performance lag
   - [ ] Patterns stay aligned when resizing window

4. **Tier Gating (if applicable)**
   - [ ] FREE users only see Support/Resistance
   - [ ] Other patterns show lock icon
   - [ ] Upgrade modal appears when clicking locked patterns
   - [ ] PRO users see all 7 patterns

---

## Debugging Tips

### Pattern Not Detected?

**Check data requirements:**
```typescript
// Add to console
console.log('Chart data length:', chartData.length);
console.log('Date range:', chartData[0]?.time, 'to', chartData[chartData.length-1]?.time);
console.log('Price range:', Math.min(...chartData.map(d => d.low)), 'to', Math.max(...chartData.map(d => d.high)));
```

**Common issues:**

1. **Support/Resistance not showing:**
   - Need 50+ data points
   - Need 3+ touches at same level
   - Solution: Use 6M or 1Y period

2. **Trend Channel not showing:**
   - R² threshold too high (current: 0.7)
   - Lower in chartPatterns.ts: `rSquaredThreshold: 0.6`

3. **Golden Cross not showing:**
   - Need 200+ data points for SMA200
   - Solution: Use 1Y, 5Y, or MAX period

4. **RSI Divergence not showing:**
   - Need clear extremes (RSI < 40 or > 60)
   - Solution: Look at volatile stocks during corrections

5. **Volume Climax not showing:**
   - Volume threshold too high (current: 3×)
   - Lower in chartPatterns.ts: `multiplier: 2`

---

## Test with Mock Data

If you want to test without real stock data, create mock data:

```typescript
// Create mock data with known patterns
const mockDataWithSupport = Array.from({ length: 100 }, (_, i) => ({
  time: new Date(Date.now() - (100 - i) * 24 * 60 * 60 * 1000).toISOString(),
  open: 450 + Math.random() * 10,
  high: 460 + Math.random() * 10,
  low: 445 + Math.random() * 5, // Bounces at ~445 (support)
  close: 450 + Math.random() * 10,
  volume: 1000000 + Math.random() * 500000,
}));

// Test pattern detection
import { detectSupportResistance } from '@/utils/chartPatterns';
const patterns = detectSupportResistance(mockDataWithSupport);
console.log('Detected patterns:', patterns);
```

---

## Performance Testing

Monitor performance with large datasets:

```typescript
// Add timing to detection
console.time('Pattern Detection');
const patterns = detectAllPatterns(chartData);
console.timeEnd('Pattern Detection');

// Should be < 100ms for 500 data points
// Should be < 500ms for 1000 data points
```

---

## Expected Results by Stock & Period

| Stock | Period | Expected Patterns |
|-------|--------|------------------|
| RELIANCE | 1Y | Support (2-3), Resistance (2-3), Trend Channel |
| TCS | 6M | Support (2), MA Crossover, Volume Climax (2-3) |
| INFY | 1Y | Golden Cross, Consolidation, Gaps (3-4) |
| TATASTEEL | 6M | Trend Channel, Volume Climax (4-5) |
| HDFCBANK | 1Y | All patterns visible |

---

## Next Steps

1. **Enable patterns on real chart:**
   - Remove test component
   - Use AIPatternDropdown in toolbar
   - Patterns auto-detect on data change

2. **Customize detection:**
   - Edit `chartPatterns.ts` parameters
   - Adjust confidence thresholds
   - Add new pattern types

3. **Monitor in production:**
   - Track which patterns users enable most
   - Measure detection performance
   - Collect feedback on accuracy

---

## Need Help?

**Pattern not working as expected?**
1. Check console for error messages
2. Verify data has enough points
3. Try different stocks/periods
4. Lower detection thresholds

**Performance issues?**
1. Use Web Worker for detection (future enhancement)
2. Debounce pattern recalculation
3. Limit to most recent 500 points

**Want to add new patterns?**
1. Add algorithm to `chartPatterns.ts`
2. Add renderer to `AIAnnotations.tsx`
3. Add to `AIPatternDropdown.tsx`
4. Update tests
