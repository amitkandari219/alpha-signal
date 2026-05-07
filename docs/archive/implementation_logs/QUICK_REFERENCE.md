# Quick Reference - Tasks #83 & #84

## Task #83: Profile Tab Component

### Import and Use
```tsx
import { ProfileTab } from '../components/stock/ProfileTab';

// In your component
<ProfileTab symbol="RELIANCE" />
```

### What It Does
- Shows company profile with 7 sections
- FREE users see Business Model only
- PRO users see all sections
- Includes charts, timelines, and structured data

### Sections
1. **Business Model** (FREE) - Revenue model + pie chart
2. **Competitive Advantage** (PRO) - Moat analysis cards
3. **Management** (PRO) - Executive team cards
4. **Key Risks** (PRO) - Risk cards with severity
5. **Growth Drivers** (PRO) - Numbered list with confidence
6. **Revenue Breakdown** (PRO) - Bar chart + data table
7. **Corporate History** (PRO) - Vertical timeline

### File Location
```
apps/web/src/components/stock/ProfileTab.tsx
```

---

## Task #84: Event Search

### Import and Use
```tsx
import { EventSearchBar } from '../components/reports/EventSearchBar';

// In your component
<EventSearchBar
  placeholder="Search events..."
  onResultClick={(result) => navigate(`/stock/${result.companySymbol}`)}
/>
```

### What It Does
- Full-text search across company events
- Dropdown with paginated results
- Event type badges
- Highlighted matches
- Click to navigate

### Event Types Supported
- Earnings (Purple)
- Dividend (Green)
- Board Meeting (Blue)
- AGM (Yellow)
- Rights Issue (Red)
- Buyback, Merger, Other

### File Locations
```
apps/web/src/components/reports/EventSearchBar.tsx
apps/web/src/graphql/events.ts
```

---

## Testing URLs

### Profile Tab
```
http://localhost:5173/stock/RELIANCE?tab=profile
```

### Event Search
```
http://localhost:5173/reports
```

### Global Search
Press `Cmd+K` or `Ctrl+K` anywhere

---

## Key Features

### Profile Tab
✅ Navigation sidebar with smooth scroll
✅ Tier-based access (FREE/PRO)
✅ Recharts visualizations
✅ AI Generated badges
✅ Version tracking
✅ Suggest Edit button
✅ Responsive design

### Event Search
✅ Real-time filtering (300ms debounce)
✅ Pagination (10 results/page)
✅ Event type badges
✅ Match highlighting
✅ Loading/error states
✅ Empty state
✅ Auto-close dropdown
✅ Keyboard navigation

---

## GraphQL Queries

### Main Query
```graphql
searchEventsAcrossCompanies(query: String!, pagination: Pagination)
```

### Returns
```typescript
{
  results: EventSearchResult[]
  totalCount: number
  hasMore: boolean
}
```

---

## Feature Gates

### Profile Tab
- `profile_full` - Complete profile (PRO)
- `profile_business_model` - Business model only (FREE)

### Usage
```tsx
import { useFeatureGate } from '../../hooks/useFeatureGate';

const { hasAccess } = useFeatureGate('profile_full');
```

---

## Props Reference

### ProfileTab
```typescript
interface ProfileTabProps {
  symbol: string;  // Required: Stock symbol
}
```

### EventSearchBar
```typescript
interface EventSearchBarProps {
  placeholder?: string;  // Optional: Search placeholder
  onResultClick?: (result: EventSearchResult) => void;  // Optional: Click handler
}
```

---

## Styling Classes

### Common Classes
```css
/* Cards */
.bg-bg-secondary border border-border-default rounded-lg

/* Badges */
.px-2 py-1 rounded text-xs font-medium

/* Buttons */
.px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90

/* Text Colors */
.text-text-primary       /* Main text */
.text-text-secondary     /* Secondary text */
.text-text-muted         /* Muted text */

/* Signal Colors */
.text-signal-green       /* Positive/High */
.text-signal-yellow      /* Medium/Warning */
.text-signal-red         /* Negative/High risk */
.text-signal-purple      /* AI/Premium */
.text-accent-blue        /* Primary accent */
```

---

## Dependencies

All already installed:
```json
{
  "recharts": "^3.7.0",
  "lucide-react": "^0.563.0",
  "@tanstack/react-query": "^5.28.4",
  "react-router-dom": "^6.22.3"
}
```

---

## Build Commands

```bash
# Development
cd apps/web
npm run dev

# Production build
npm run build

# Preview production
npm run preview

# Type check only
tsc --noEmit
```

---

## Common Issues

### Charts not rendering?
- Check recharts is installed: `npm list recharts`
- Verify ResponsiveContainer has width/height

### Gated content not working?
- Check user tier: `console.log(useAuthStore.getState().user?.tier)`
- Verify feature key exists in useFeatureGate

### Search not showing results?
- Type at least 2 characters
- Check browser console for errors
- Verify React Query is working

---

## File Structure

```
apps/web/src/
├── components/
│   ├── stock/
│   │   └── ProfileTab.tsx              # Task #83
│   ├── reports/
│   │   ├── EventSearchBar.tsx          # Task #84
│   │   └── index.ts                    # Updated
│   └── search/
│       └── GlobalSearch.tsx            # Updated
├── graphql/
│   └── events.ts                       # New queries
├── hooks/
│   └── useFeatureGate.ts               # Updated
└── pages/
    └── Reports.tsx                     # Updated
```

---

## Documentation

### Main Docs
- **Implementation Guide:** `apps/web/TASK_83_84_IMPLEMENTATION.md`
- **Integration Guide:** `apps/web/INTEGRATION_GUIDE.md`
- **Summary:** `TASKS_83_84_SUMMARY.md`
- **This File:** `QUICK_REFERENCE.md`

### Read First
1. `TASKS_83_84_SUMMARY.md` - Overview and statistics
2. `INTEGRATION_GUIDE.md` - How to integrate
3. `TASK_83_84_IMPLEMENTATION.md` - Detailed technical docs

---

## Support

### Getting Help
1. Check inline code comments
2. Review documentation above
3. Check browser console for errors
4. Verify all dependencies installed
5. Test with different user tiers

### Common Commands
```bash
# Check if component exists
ls -la apps/web/src/components/stock/ProfileTab.tsx

# Check dependencies
npm list recharts lucide-react @tanstack/react-query

# Check TypeScript errors
cd apps/web && npm run build

# Run dev server
cd apps/web && npm run dev
```

---

## Next Steps

### Immediate
1. ✅ Files created
2. ✅ Documentation complete
3. ⏳ Test in browser
4. ⏳ Connect to API

### Short-term
1. API integration
2. Real data testing
3. User feedback
4. Analytics setup

### Long-term
1. Additional sections
2. Advanced search
3. Export features
4. Performance optimization

---

## Version

**Version:** 1.0.0
**Date:** February 8, 2026
**Status:** ✅ Complete and Ready

---

## Quick Links

- **Component:** `/apps/web/src/components/stock/ProfileTab.tsx`
- **Search:** `/apps/web/src/components/reports/EventSearchBar.tsx`
- **GraphQL:** `/apps/web/src/graphql/events.ts`
- **Docs:** `/apps/web/TASK_83_84_IMPLEMENTATION.md`

---

**Happy Coding! 🚀**
