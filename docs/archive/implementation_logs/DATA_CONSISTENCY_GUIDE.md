# Data Consistency Guide

## 🎯 Problem: Data Duplication & Inconsistency

Currently, stock data is scattered across **7+ different files**, leading to:
- ❌ Inconsistent stock lists across different pages
- ❌ Difficult to update (need to change 7 files)
- ❌ Higher chance of bugs and outdated data
- ❌ Maintenance nightmare

## ✅ Solution: Single Source of Truth

### Central Data File
**File:** `apps/web/src/data/centralStockData.ts`

This file contains:
- Master list of all Nifty 50 stocks
- Stock metadata (name, sector, market cap, exchange)
- Helper functions to query stocks

### How to Use Central Data

**Before (BAD - Data Duplication):**
```typescript
// In mockDashboardData.ts
export const watchlistStocks = [
  { symbol: 'TCS', name: 'Tata Consultancy Services', ... },
  { symbol: 'INFY', name: 'Infosys Limited', ... },
];

// In mockScreenerData.ts
export const screenerStocks = [
  { symbol: 'TCS', companyName: 'Tata Consultancy Services', ... },
  { symbol: 'INFY', companyName: 'Infosys Limited', ... },
];
```

**After (GOOD - Single Source):**
```typescript
// Import from central data
import { NIFTY_50_STOCKS, getStockBySymbol } from './centralStockData';

// Use centralized data
export const watchlistStocks = ['TCS', 'INFY', 'WIPRO'].map(symbol => {
  const stock = getStockBySymbol(symbol);
  return {
    symbol,
    name: stock?.companyName,
    // ... other fields
  };
});
```

## 📋 Migration Plan

### Phase 1: Immediate (Done ✅)
1. Created `centralStockData.ts` with all Nifty 50 stocks
2. Replaced all non-Nifty stocks across all data files

### Phase 2: Refactor Data Files (Recommended)
1. Update `mockDashboardData.ts` to import from central data
2. Update `mockWatchlistData.ts` to import from central data
3. Update `mockScreenerData.ts` to import from central data
4. Update `mockSectorData.ts` to import from central data
5. Update `mockMarketTrendsData.ts` to import from central data

### Phase 3: Long-term Architecture (Ideal)

```
┌─────────────────────────────────────────┐
│         PostgreSQL Database              │
│  (Real source of truth with Nifty 50)   │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│          GraphQL API                     │
│  (Serves stock data from database)       │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│     React Query Cache (Frontend)        │
│  (Fetches and caches stock data)        │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       Dashboard / Screener / etc.        │
│  (All pages use the same cached data)   │
└─────────────────────────────────────────┘
```

## 🚀 Quick Wins

### 1. Update Stock Generator Scripts

**Screener Data Generator:**
```typescript
// scripts/generate-screener-data.ts
import { NIFTY_50_STOCKS } from '../apps/web/src/data/centralStockData';

// Use NIFTY_50_STOCKS instead of querying database
const screenerStocks = NIFTY_50_STOCKS.map(stock => ({
  symbol: stock.symbol,
  companyName: stock.companyName,
  sector: stock.sector,
  // ... fetch price data from database
}));
```

### 2. Use GraphQL for Live Data

**Instead of mock data:**
```typescript
// Before (mock data)
import { watchlistStocks } from '../data/mockDashboardData';

// After (real data from API)
const { data } = useQuery(GET_WATCHLIST_STOCKS, {
  variables: { symbols: ['TCS', 'INFY', 'WIPRO'] }
});
```

## 🔧 Helper Scripts

### Sync Central Data from Database
```bash
# Generate centralStockData.ts from database
npx tsx scripts/sync-stock-data-from-db.ts
```

### Validate All Mock Data
```bash
# Check if all mock data files reference only Nifty 50 stocks
npx tsx scripts/validate-stock-references.ts
```

## 📝 Best Practices

### ✅ DO:
- Import stock metadata from `centralStockData.ts`
- Use helper functions like `getStockBySymbol()`
- Keep mock data minimal (only add fields specific to that view)
- Sync central data when Nifty 50 composition changes

### ❌ DON'T:
- Hard-code stock names or company names
- Create duplicate stock lists
- Add stocks not in Nifty 50 without updating central data first
- Modify company names directly in view-specific data files

## 🎯 Next Steps

1. **Short-term:** Use `centralStockData.ts` for all new features
2. **Medium-term:** Refactor existing mock data files to use central data
3. **Long-term:** Replace mock data with GraphQL API calls to database

## 📊 Impact

| Metric | Before | After |
|--------|--------|-------|
| Stock data files | 7+ files | 1 central file |
| Update effort | Change 7 files | Change 1 file |
| Inconsistency risk | High | Low |
| Maintainability | Poor | Good |
| Source of truth | Scattered | Centralized |

---

**Questions?** Check the central data file: `apps/web/src/data/centralStockData.ts`
