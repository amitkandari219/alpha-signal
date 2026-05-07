# Integration Guide for Tasks #83 & #84

## Quick Start

### Task #83: Adding Profile Tab to Stock Detail Page

The ProfileTab component is already lazy-loaded in `StockDetailPage.tsx`. To enable it:

#### 1. Update StockDetailPage.tsx Tab System

The code already includes the lazy import:
```tsx
// Already exists in StockDetailPage.tsx (line 25)
const ProfileTab = lazy(() => import('../components/stock/ProfileTab'));
```

#### 2. Add Tab Navigation UI

Add this to your StockDetailPage render method (after the StockHeader):

```tsx
{/* Tab Navigation */}
<div className="bg-bg-secondary border border-border-default rounded-lg p-1 inline-flex gap-1">
  <button
    onClick={() => handleTabChange('analysis')}
    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
      activeTab === 'analysis'
        ? 'bg-accent-blue text-white'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
    }`}
  >
    Analysis
  </button>
  <button
    onClick={() => handleTabChange('timeline')}
    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
      activeTab === 'timeline'
        ? 'bg-accent-blue text-white'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
    }`}
  >
    Timeline
  </button>
  <button
    onClick={() => handleTabChange('profile')}
    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
      activeTab === 'profile'
        ? 'bg-accent-blue text-white'
        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
    }`}
  >
    Profile
  </button>
</div>

{/* Tab Content */}
<Suspense fallback={<LoadingPage />}>
  {activeTab === 'analysis' && (
    <div className="space-y-4">
      {/* Existing panels */}
      <AIIntelligencePanel symbol={symbol || 'RELIANCE'} defaultExpanded={true} />
      <FundamentalAnalysisPanel symbol={symbol || 'RELIANCE'} defaultExpanded={false} />
      {/* ... other panels ... */}
    </div>
  )}

  {activeTab === 'timeline' && (
    <TimelineTab symbol={symbol || 'RELIANCE'} />
  )}

  {activeTab === 'profile' && (
    <ProfileTab symbol={symbol || 'RELIANCE'} />
  )}
</Suspense>
```

#### 3. Test the Profile Tab

Navigate to any stock page:
```
http://localhost:5173/stock/RELIANCE?tab=profile
```

You should see:
- Left sidebar with 7 section links
- Business Model section (visible to all)
- Other sections blurred with upgrade prompt (FREE users)
- Charts and formatted content

---

### Task #84: Event Search Integration

#### 1. Reports Page (Already Done)

The EventSearchBar is already integrated in `Reports.tsx`. No additional changes needed.

#### 2. Test Event Search

Navigate to Reports page:
```
http://localhost:5173/reports
```

You should see:
- Search bar at the top
- Type "earnings" or "dividend" to see results
- Click any result to navigate to stock page

#### 3. Test Global Search Integration

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows) anywhere on the site:
- Search for "earnings", "dividend", or any event type
- Event results appear with calendar icon
- Shows event date and type
- Click to navigate

---

## Component Props Reference

### ProfileTab Props

```tsx
interface ProfileTabProps {
  symbol: string;  // Stock symbol (e.g., "RELIANCE")
}
```

**Example:**
```tsx
<ProfileTab symbol="TCS" />
```

### EventSearchBar Props

```tsx
interface EventSearchBarProps {
  placeholder?: string;  // Search input placeholder
  onResultClick?: (result: EventSearchResult) => void;  // Callback when result clicked
}
```

**Example:**
```tsx
<EventSearchBar
  placeholder="Search company events..."
  onResultClick={(result) => {
    console.log('Clicked event:', result);
    navigate(`/stock/${result.companySymbol}`);
  }}
/>
```

---

## Customization Examples

### 1. Change Profile Tab Colors

Edit `ProfileTab.tsx`, find the section badges:

```tsx
// Current: Purple AI badge
<div className="flex items-center gap-1.5 px-2 py-0.5 bg-signal-purple/20 text-signal-purple rounded">

// Change to blue:
<div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent-blue/20 text-accent-blue rounded">
```

### 2. Adjust Event Search Results Per Page

Edit `EventSearchBar.tsx`, line 47:

```tsx
// Current: 10 results per page
const RESULTS_PER_PAGE = 10;

// Change to 20:
const RESULTS_PER_PAGE = 20;
```

### 3. Add Custom Event Type

Edit `EventSearchBar.tsx`, add to interface:

```tsx
interface EventSearchResult {
  eventType:
    | 'EARNINGS'
    | 'DIVIDEND'
    | 'YOUR_NEW_TYPE'  // Add here
    | ...
}

// Then add badge styling:
const badges = {
  YOUR_NEW_TYPE: { text: 'Custom', color: 'bg-your-color/20 text-your-color' },
  ...
}
```

### 4. Change Section Order in Profile Tab

Edit `ProfileTab.tsx`, reorder the `NAV_ITEMS` array:

```tsx
const NAV_ITEMS: NavItem[] = [
  { id: 'corporate-history', label: 'Corporate History', icon: History },  // Move to top
  { id: 'business-model', label: 'Business Model', icon: Building2 },
  // ... rest of items
];
```

---

## Connecting to Real API

### Profile Tab API Integration

Replace mock data in each content component:

```tsx
// Example: Business Model Content
const BusinessModelContent: React.FC<{ symbol: string }> = ({ symbol }) => {
  // Add React Query hook
  const { data, isLoading } = useQuery({
    queryKey: ['companyProfile', symbol],
    queryFn: async () => {
      const response = await fetch(`/api/company/${symbol}/profile`);
      return response.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="prose prose-invert max-w-none">
        <p>{data.businessModelDescription}</p>
      </div>
      {/* Use real data for charts */}
      <RevenueChart data={data.revenueBreakdown} />
    </div>
  );
};
```

### Event Search API Integration

Update `EventSearchBar.tsx` query function:

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['eventSearch', query, currentPage],
  queryFn: async () => {
    if (!query || query.trim().length < 2) {
      return { results: [], totalCount: 0 };
    }

    // Replace with real GraphQL query
    const response = await apolloClient.query({
      query: SEARCH_EVENTS_ACROSS_COMPANIES,
      variables: {
        query,
        pagination: {
          page: currentPage,
          limit: RESULTS_PER_PAGE,
        },
      },
    });

    return {
      results: response.data.searchEventsAcrossCompanies.results,
      totalCount: response.data.searchEventsAcrossCompanies.totalCount,
    };
  },
  enabled: query.trim().length >= 2,
});
```

---

## Troubleshooting

### Issue: Profile Tab Sections Not Gating Properly

**Solution:** Check user tier in browser console:
```javascript
// Open browser console
const { user } = useAuthStore.getState();
console.log('User tier:', user?.tier);
```

If tier is FREE and you want to test PRO features:
1. Open `src/lib/mockUser.ts`
2. Change `tier: 'FREE'` to `tier: 'PRO'`
3. Refresh page

### Issue: Event Search Not Showing Results

**Solution:** Verify minimum query length:
```tsx
// EventSearchBar requires 2+ characters
if (query.trim().length < 2) {
  // Search won't trigger
}
```

Type at least 2 characters to see results.

### Issue: Charts Not Rendering

**Solution:** Check Recharts is installed:
```bash
npm list recharts
# Should show: recharts@3.7.0
```

If missing:
```bash
npm install recharts@^3.7.0
```

### Issue: Blur Effect Not Working on Gated Content

**Solution:** Check CSS filters are supported:
```css
/* This should work in ProfileTab.tsx */
filter: blur(8px);
opacity: 0.5;
```

If not working, check for CSS conflicts in global styles.

---

## Performance Optimization

### 1. Lazy Load Heavy Sections

```tsx
// Split ProfileTab into smaller chunks
const ManagementSection = lazy(() => import('./sections/ManagementSection'));
const RisksSection = lazy(() => import('./sections/RisksSection'));

// Use Suspense
<Suspense fallback={<Skeleton />}>
  <ManagementSection symbol={symbol} />
</Suspense>
```

### 2. Debounce Event Search

Already implemented (300ms delay):
```tsx
// In EventSearchBar.tsx
await new Promise((resolve) => setTimeout(resolve, 300));
```

To adjust:
```tsx
await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay
```

### 3. Memoize Chart Data

```tsx
import { useMemo } from 'react';

const chartData = useMemo(() => {
  return processRevenueData(rawData);
}, [rawData]);
```

---

## Analytics Integration

Track user interactions:

### Profile Tab Analytics

```tsx
// Add to ProfileTab.tsx
import { analytics } from '../../services/analytics';

const scrollToSection = (sectionId: SectionId) => {
  // Track section view
  analytics.track('profile_section_viewed', {
    symbol,
    section: sectionId,
    userTier: user?.tier,
  });

  setActiveSection(sectionId);
  // ... rest of function
};
```

### Event Search Analytics

```tsx
// Add to EventSearchBar.tsx
const handleResultClick = (result: EventSearchResult) => {
  // Track search click
  analytics.track('event_search_result_clicked', {
    query,
    companySymbol: result.companySymbol,
    eventType: result.eventType,
  });

  if (onResultClick) {
    onResultClick(result);
  }
  // ... rest of function
};
```

---

## Testing Checklist

Before deploying to production:

### Profile Tab
- [ ] All 7 sections render correctly
- [ ] Navigation sidebar works
- [ ] Smooth scrolling to sections
- [ ] FREE users see only Business Model
- [ ] PRO users see all sections
- [ ] Charts load and display data
- [ ] Responsive on mobile devices
- [ ] Print view works
- [ ] Browser back button works with tabs

### Event Search
- [ ] Search triggers at 2+ characters
- [ ] Results filter correctly
- [ ] Pagination works
- [ ] Highlighting shows matched text
- [ ] Click navigates to correct page
- [ ] Loading state appears
- [ ] Error state handles failures
- [ ] Empty state shows helpful message
- [ ] Global search includes events
- [ ] Cmd+K/Ctrl+K opens search
- [ ] ESC closes dropdown
- [ ] Click outside closes dropdown

---

## Deployment

### Production Build

```bash
# From apps/web directory
npm run build

# Check build size
du -sh dist/

# Preview production build
npm run preview
```

### Environment Variables

No new environment variables required for these features.

### CDN Optimization

Consider hosting Recharts from CDN in production:

```html
<!-- In index.html -->
<script src="https://cdn.jsdelivr.net/npm/recharts@3.7.0/dist/Recharts.min.js"></script>
```

---

## Additional Resources

- **Recharts Documentation:** https://recharts.org/en-US/
- **Lucide Icons:** https://lucide.dev/
- **React Query:** https://tanstack.com/query/latest
- **Tailwind CSS:** https://tailwindcss.com/docs

---

## Support

For issues or questions:
1. Check inline code comments in source files
2. Review this integration guide
3. Check browser console for errors
4. Verify all dependencies are installed
5. Test with mock user of different tiers

---

## Next Steps

After integrating these components:

1. **Connect to Real API**
   - Implement GraphQL resolvers
   - Add database queries
   - Handle loading/error states

2. **Add More Event Types**
   - Stock splits
   - Bonus issues
   - Demergers
   - Quarterly updates

3. **Enhance Profile Tab**
   - Add edit history
   - Enable user comments
   - Add comparison mode
   - Export to PDF

4. **Improve Search**
   - Add filters (date, type, company)
   - Save recent searches
   - Add autocomplete
   - Enable advanced search syntax

5. **Analytics**
   - Track popular sections
   - Monitor search queries
   - Measure engagement
   - A/B test layouts

---

## Version History

- **v1.0.0** (2026-02-08) - Initial implementation and integration guide
