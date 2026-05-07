# AI Patterns - Quick Start Guide 🚀

## Option 1: Browser Console Test (No UI Required) ⚡

**Fastest way to verify AI patterns work:**

1. **Open any page in your app**
2. **Press F12** (or Cmd+Option+I on Mac)
3. **Go to Console tab**
4. **Copy and paste this:**

```javascript
// Copy entire chartPatterns.test.ts content and paste it
// OR if already bundled, just run:
runBrowserTest();
```

**Expected output:**
```
🤖 Starting AI Pattern Detection Tests...

📊 Test 1: Support & Resistance
  Found 3 patterns
  - Support at 450.25 (5 touches)
  - Resistance at 475.50 (4 touches)

📈 Test 2: Trend Channel
  Found 1 patterns
  - up channel, R²=0.85

🔊 Test 3: Volume Climax
  Found 1 patterns
  - 4.5× volume spike

✅ All tests completed!
```

If you see this output, **AI detection is working!** ✅

---

## Option 2: Visual Test Component 👁️

**See patterns detected in real-time on your chart:**

### Step 1: Add Test Component

In your stock chart page (e.g., `pages/stock/[symbol].tsx`):

```tsx
import { AIPatternTest } from '@/components/chart/AIPatternTest';

// Inside your component:
<AIPatternTest data={chartData} symbol={symbol} />
```

### Step 2: View Results

You'll see a floating panel in bottom-left corner:

```
🤖 AI Pattern Detection Test          [5 found]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Support & Resistance             [3] ▶
📈 Trend Channel                    [1] ▶
⭐ Golden/Death Cross               [0]
📉 RSI Divergence                   [0]
🔊 Volume Climax                    [2] ▶
↕️ Price Gaps                       [1] ▶
📦 Consolidation/Breakout           [1] ▶
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Open browser console for detailed data
```

Click rows to expand and see details!

---

## Option 3: Full UI Integration 🎨

**Enable AI patterns in production UI:**

### Step 1: Open Stock Chart

Navigate to any stock page (e.g., `/stock/RELIANCE`)

### Step 2: Click AI Patterns Button

Look for this button in chart toolbar:
```
[✨ AI Patterns ▼]
```

### Step 3: Enable Patterns

You'll see dropdown:
```
✨ AI Pattern Detection
[Enable All] | [Disable All]

☑️ Support & Resistance (FREE)
□ Trend Channel (PRO 🔒)
□ Golden/Death Cross (PRO 🔒)
□ RSI Divergence (PRO 🔒)
□ Volume Climax (PRO 🔒)
□ Price Gaps (PRO 🔒)
□ Consolidation & Breakout (PRO 🔒)
```

### Step 4: See Patterns on Chart

Patterns will appear as:
- Horizontal lines (Support/Resistance)
- Shaded channels (Trend Channel)
- Icons (Golden/Death Cross)
- Highlights (Volume Climax)
- Rectangles (Gaps, Consolidation)

Each has purple "✨ AI" badge!

---

## Quick Verification Checklist ✅

Test each feature:

### ✅ Detection Working
- [ ] Console shows pattern detection logs
- [ ] Patterns appear on chart
- [ ] Pattern count is > 0 for some types

### ✅ UI Controls Working
- [ ] AI Patterns dropdown opens
- [ ] Toggling patterns shows/hides them
- [ ] Enable/Disable All works

### ✅ Tier Gating Working
- [ ] FREE users only see Support/Resistance enabled
- [ ] Other patterns show lock icon 🔒
- [ ] Clicking locked pattern shows upgrade modal

### ✅ Visual Rendering Working
- [ ] Patterns aligned with chart
- [ ] Purple AI badge visible
- [ ] No performance lag
- [ ] Patterns update when changing stock/period

---

## Test with These Stocks 📈

**Best stocks for testing each pattern:**

| Pattern | Stock | Period | What to Look For |
|---------|-------|--------|------------------|
| Support/Resistance | RELIANCE | 1Y | Multiple horizontal lines |
| Trend Channel | HDFCBANK | 6M | Parallel diagonal lines |
| Golden Cross | Any | 1Y+ | ⭐ icon at crossover point |
| RSI Divergence | TCS | 3M | Diagonal lines (enable RSI) |
| Volume Climax | TATAPOWER | 1M | Yellow highlights on volume |
| Gaps | ADANIPORTS | 3M | Rectangles between candles |
| Consolidation | Any | 6M | Dashed rectangle zones |

---

## Troubleshooting 🔧

### "No patterns detected"

**Check:**
1. ✅ Enough data points (need 50+ for most patterns)
2. ✅ Right period selected (try 6M or 1Y)
3. ✅ Pattern is enabled in dropdown
4. ✅ Console shows detection running

**Solution:** Try RELIANCE with 1Y period

### "Patterns not visible"

**Check:**
1. ✅ Pattern toggle is ON
2. ✅ Not scrolled past pattern location
3. ✅ Pattern confidence > 0.5
4. ✅ Console shows pattern was detected

**Solution:** Check console: `patterns.supportResistance`

### "Locked patterns won't enable"

**Check:**
1. ✅ User tier is FREE
2. ✅ Upgrade modal appears on click
3. ✅ Only Support/Resistance works for FREE

**Solution:** This is correct behavior! Working as intended.

### "Performance is slow"

**Check:**
1. ✅ Data points count (should be < 1000)
2. ✅ Browser console shows timing
3. ✅ Multiple patterns enabled at once

**Solution:** Detection should be < 500ms for 1000 points

---

## Advanced Testing 🧪

### Test Detection Thresholds

Edit `chartPatterns.ts` to adjust sensitivity:

```typescript
// Make Support/Resistance more sensitive
detectSupportResistance(data, 5, 0.03, 2);
//                       ↑      ↑     ↑
//                    window tolerance minTouches

// Make Trend Channel less strict
detectTrendChannel(data, 20, 0.6);
//                       ↑    ↑
//                   minPoints R²threshold
```

### Test with Custom Data

Create mock data for specific scenarios:

```typescript
// Data with clear support at 450
const testData = Array.from({ length: 100 }, (_, i) => ({
  time: new Date(Date.now() - i * 86400000).toISOString(),
  open: 450 + Math.random() * 10,
  high: 460 + Math.random() * 5,
  low: 445 + Math.random() * 3, // Bounces at ~445
  close: 450 + Math.random() * 10,
  volume: 1000000,
}));

// Test detection
import { detectSupportResistance } from '@/utils/chartPatterns';
const patterns = detectSupportResistance(testData);
console.log('Patterns found:', patterns);
```

### Measure Performance

```typescript
console.time('AI Detection');
const patterns = detectAllPatterns(chartData);
console.timeEnd('AI Detection');

// Target: < 100ms for 500 points
```

---

## What Success Looks Like ✨

After testing, you should see:

1. **Console Logs:**
```
[AI Pattern Test] Running detection on 365 data points
[AI Pattern Test] supportResistance: 3 patterns found
[AI Pattern Test] trendChannel: 1 patterns found
[AI Pattern Test] volumeClimax: 4 patterns found
```

2. **Visual Patterns:**
- Purple AI badges visible
- Lines, channels, and markers on chart
- Patterns aligned with price action
- Smooth animations and interactions

3. **Working Controls:**
- Dropdown opens/closes smoothly
- Toggles work instantly
- Tier gating shows lock icons
- Upgrade modal appears correctly

4. **Performance:**
- No lag when enabling patterns
- Chart responsive when resizing
- Pattern detection < 500ms

---

## Next Steps 🎯

1. **Remove test component** once verified working
2. **Test on production data** with real users
3. **Monitor performance** with analytics
4. **Collect feedback** on pattern accuracy
5. **Tune thresholds** based on user feedback

---

## Need More Help? 📚

- **Full guide:** See `TESTING_AI_PATTERNS.md`
- **Test file:** Run `chartPatterns.test.ts`
- **Source code:** Check `chartPatterns.ts`

**Questions?**
- Check console for error messages
- Verify data requirements met
- Try different stocks/periods
- Lower detection thresholds if needed

---

## Summary Checklist 📋

Quick verification:

- [ ] Browser console test passes ✅
- [ ] Visual test component shows patterns ✅
- [ ] UI dropdown works ✅
- [ ] Patterns render on chart ✅
- [ ] Tier gating works ✅
- [ ] No performance issues ✅
- [ ] Tested on 3+ stocks ✅
- [ ] All 7 pattern types verified ✅

**If all checked, you're ready to ship!** 🚀
