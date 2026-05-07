# Weekly Reports Feature - Quick Start Guide

## 🚀 Getting Started

### 1. View the Feature

**Reports Library:**
```
Navigate to: http://localhost:5173/reports
```

**Individual Report:**
```
Navigate to: http://localhost:5173/reports/market-weekly-tech-rally-continues-amid-fed-optimism
```

### 2. Test Different User Tiers

**As FREE User:**
- Can view report library
- Can view first section of reports
- Remaining content is blurred
- See upgrade prompt

**As PRO/PREMIUM User:**
- Full access to all reports
- No content restrictions
- Change user tier in `src/store/useAuthStore.ts` or through login

### 3. Test Filters and Sorting

**Tab Filters:**
- All Reports (shows both macro and sector)
- Macro Overview (shows only macro reports)
- Sector Reports (shows only sector reports)

**Sort Options:**
- Latest First (default - by publishedAt DESC)
- Most Viewed (by viewCount DESC)

**Pagination:**
- 10 reports per page
- Previous/Next buttons
- Page number buttons (shows 5 at a time)

## 📁 Key Files Reference

### Components
```
src/components/reports/
├── ReportCard.tsx              # Report preview card
├── ReportSectionRenderer.tsx   # Dynamic section renderer
├── ShareButtons.tsx            # Social share buttons
├── NewsletterSignup.tsx        # Email subscription form
├── ReportCardSkeleton.tsx      # Loading skeleton
├── index.ts                    # Exports
└── README.md                   # Full documentation
```

### Pages
```
src/pages/
├── Reports.tsx                 # Reports library page
└── ReportDetail.tsx           # Individual report page
```

### Data & API
```
src/
├── graphql/reports.ts          # GraphQL queries/mutations
└── data/mockReportsData.ts     # Mock data for testing
```

## 🎨 Customization Guide

### Adding New Section Types

**1. Update ReportSectionRenderer.tsx:**
```typescript
if (sectionType === 'YOUR_NEW_TYPE') {
  // Your rendering logic
  return (
    <section className="mb-8">
      {/* Your content */}
    </section>
  );
}
```

**2. Update TypeScript interface:**
```typescript
sectionType: 'TEXT' | 'METRIC_CARDS' | 'CHART_DATA' | 'TABLE_DATA' | 'STOCK_LIST' | 'YOUR_NEW_TYPE';
```

### Customizing Report Card Colors

Edit `SECTOR_COLORS` in `ReportCard.tsx`:
```typescript
const SECTOR_COLORS: Record<string, string> = {
  YourSector: 'bg-your-color-500/20 text-your-color-400 border-your-color-500/30',
};
```

### Changing Pagination Limit

In `Reports.tsx`:
```typescript
const REPORTS_PER_PAGE = 10; // Change this value
```

## 🔌 Backend Integration

### Switch from Mock Data to Real API

**In Reports.tsx:**
```typescript
// Remove:
import { getMockReportsData } from '../data/mockReportsData';

// Add:
import { useQuery } from '@apollo/client';
import { GET_REPORTS } from '../graphql/reports';

// Update query:
const { data, isLoading, error } = useQuery(GET_REPORTS, {
  variables: {
    filters: { reportType: activeTab === 'macro' ? 'MACRO' : activeTab === 'sector' ? 'SECTOR' : null },
    pagination: { limit: REPORTS_PER_PAGE, offset: (currentPage - 1) * REPORTS_PER_PAGE },
  },
});
```

**In ReportDetail.tsx:**
```typescript
// Remove:
import { getReportBySlug } from '../data/mockReportsData';

// Add:
import { useQuery } from '@apollo/client';
import { GET_REPORT_DETAIL } from '../graphql/reports';

// Update query:
const { data: report, isLoading, error } = useQuery(GET_REPORT_DETAIL, {
  variables: { slug },
  skip: !slug,
});
```

## 🧪 Testing Scenarios

### 1. Basic Navigation
- ✅ Click "Reports" in sidebar
- ✅ View reports library
- ✅ Click on a report card
- ✅ View report detail
- ✅ Click "Back to Reports"

### 2. Filters & Sorting
- ✅ Click "All Reports" tab
- ✅ Click "Macro Overview" tab
- ✅ Click "Sector Reports" tab
- ✅ Change sort to "Most Viewed"
- ✅ Change sort back to "Latest First"

### 3. Pagination
- ✅ Click "Next" button
- ✅ Click page number
- ✅ Click "Previous" button
- ✅ Verify correct reports shown

### 4. Share Functionality
- ✅ Click Twitter share button
- ✅ Click LinkedIn share button
- ✅ Click "Copy link" button
- ✅ Verify toast notification

### 5. Newsletter Signup
- ✅ Enter email address
- ✅ Select sectors
- ✅ Choose frequency
- ✅ Click "Subscribe"
- ✅ View success message

### 6. Tier Gating
- ✅ Login as FREE user
- ✅ View report (first section visible, rest blurred)
- ✅ See upgrade prompt
- ✅ Login as PRO user
- ✅ View full report (no blur)

### 7. Responsive Design
- ✅ Desktop view (3 columns)
- ✅ Tablet view (2 columns, icon sidebar)
- ✅ Mobile view (1 column, bottom tab bar)
- ✅ Verify horizontal scroll for tables on mobile

### 8. Loading & Error States
- ✅ Verify loading skeletons
- ✅ Verify empty state (filter with no results)
- ✅ Verify error state (disconnect API)

## 🐛 Troubleshooting

### Reports not loading
1. Check browser console for errors
2. Verify mock data is imported correctly
3. Check React Query dev tools (if installed)

### Navigation not working
1. Verify routes in App.tsx
2. Check React Router setup
3. Verify lazy loading imports

### Sidebar item not showing
1. Clear browser cache
2. Verify navItems array in Sidebar.tsx
3. Check icon import from lucide-react

### Styling issues
1. Verify Tailwind CSS classes
2. Check dark theme compatibility
3. Verify responsive breakpoints

### GraphQL errors (when using real API)
1. Check Apollo Client configuration
2. Verify GraphQL endpoint URL
3. Check authentication token
4. Verify query/mutation syntax

## 📚 Additional Resources

### Documentation
- Component README: `src/components/reports/README.md`
- Full Summary: `REPORTS_FEATURE_SUMMARY.md`

### Mock Data
- Report samples: `src/data/mockReportsData.ts`
- Add more samples by copying existing format

### GraphQL Schema
- Queries and mutations: `src/graphql/reports.ts`
- Backend schema: `apps/api/prisma/schema.prisma`

### Design System
- Colors: Check Tailwind config
- Typography: See existing pages for consistency
- Spacing: Follow 4px/8px grid system

## 💡 Pro Tips

1. **Use React Query Dev Tools** for debugging data fetching
2. **Check localStorage** for viewed reports tracking
3. **Test with different viewport sizes** using browser dev tools
4. **Use Network tab** to monitor API calls
5. **Test keyboard navigation** for accessibility

## 🎯 Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
tsc --noEmit
```

## 📞 Need Help?

1. Check component README: `src/components/reports/README.md`
2. Review mock data structure: `src/data/mockReportsData.ts`
3. Inspect existing components for patterns
4. Review GraphQL schema documentation

---

**Happy Coding!** 🚀
