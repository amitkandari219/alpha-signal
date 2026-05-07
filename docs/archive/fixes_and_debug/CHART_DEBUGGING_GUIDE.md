# Chart Debugging Guide

## Changes Made

1. **Added debug logging** to see what data is being generated
2. **Added fallback message** when no chart data available
3. **Cleared Vite cache** to ensure fresh build
4. **Restarted web server** with new changes

## How to Debug

### Step 1: Open Browser Console

1. Open http://localhost:3000/stock/ADANIPORTS in your browser
2. Press **F12** (or Cmd+Option+I on Mac) to open Developer Tools
3. Go to the **Console** tab

### Step 2: Check Console Logs

You should see logs like:
```
[StockHeader] Symbol: ADANIPORTS, Period: 1D, Data points: 2 [...]
[StockChart] Rendering with data points: 2 Period: 1D
```

**If you see "Data points: 0":**
- The `getOHLCVData` function is not working correctly
- Check if the function is being called

**If you see "Data points: 2" (or more):**
- Data generation works
- Problem is with chart rendering

**If you see "No container ref":**
- The chart container div is not mounted
- React rendering issue

### Step 3: Check Network Tab

1. Go to **Network** tab in Developer Tools
2. Reload the page
3. Look for failed requests (red)
4. Check if `lightweight-charts` library loads

### Step 4: Check Elements Tab

1. Go to **Elements** tab
2. Search for `<canvas>` tag
3. The chart should render as a canvas element
4. If no canvas, chart is not rendering

## What Should Happen

### Success Indicators:
✅ Console shows: `Data points: X` where X > 0
✅ Console shows: `Rendering with data points`
✅ Canvas element appears in DOM
✅ Chart is visible on screen

### Failure Indicators:
❌ Console shows: `Data points: 0`
❌ Console shows: `No data - cannot render chart`
❌ Error messages in console
❌ Message: "No chart data available"

## Common Issues & Fixes

### Issue 1: "Data points: 0"

**Cause:** `getOHLCVData` function not working

**Fix:**
```bash
# Check if function exists
grep -n "export function getOHLCVData" apps/web/src/data/mockStockData.ts

# Verify import
grep -n "getOHLCVData" apps/web/src/components/stock/StockHeader.tsx
```

### Issue 2: Chart container not found

**Cause:** React component not mounting properly

**Fix:** Check if StockDetailPage is loading correctly

### Issue 3: lightweight-charts error

**Cause:** Library not installed or version mismatch

**Fix:**
```bash
cd apps/web
npm install lightweight-charts@5.1.0
```

### Issue 4: Vite not picking up changes

**Cause:** Cache or build issue

**Fix:**
```bash
rm -rf node_modules/.vite
rm -rf dist
lsof -ti:3000 | xargs kill
npm run dev
```

## Manual Test

Create a test file to verify data generation:

```typescript
// apps/web/test-manual.ts
import { getOHLCVData } from './src/data/mockStockData';

const data = getOHLCVData('ADANIPORTS', '1D');
console.log('Generated data points:', data.length);
console.log('First point:', data[0]);
console.log('Last point:', data[data.length - 1]);
```

Run:
```bash
cd apps/web
npx tsx test-manual.ts
```

Expected output:
```
Generated data points: 2
First point: { time: '2026-02-08', open: 1000, ... }
Last point: { time: '2026-02-09', open: 1005, ... }
```

## Next Steps

1. **Open the browser** at http://localhost:3000/stock/ADANIPORTS
2. **Open Console** (F12)
3. **Share the console output** with me
4. Look for:
   - Any error messages (red text)
   - The debug logs I added
   - Data points count

This will help me pinpoint exactly where the issue is!

## Quick Check Commands

```bash
# Is server running?
curl -s http://localhost:3000 > /dev/null && echo "✅ Running" || echo "❌ Not running"

# Check if getOHLCVData exists
grep "export function getOHLCVData" apps/web/src/data/mockStockData.ts

# Check latest server logs
tail -50 /tmp/web-debug.log

# Test data generation
node apps/web/test-chart-data.js
```
