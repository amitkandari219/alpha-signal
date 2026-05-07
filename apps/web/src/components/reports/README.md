# Weekly Reports Feature

## Overview

The Weekly Reports feature provides AI-powered market intelligence reports including macro market overviews and sector-specific analysis. Reports are published weekly and include comprehensive insights, metrics, charts, and stock recommendations.

## Components

### 1. ReportCard.tsx
Reusable card component for displaying report previews in the library grid.

**Props:**
- `id`: Report unique identifier
- `title`: Report title
- `slug`: URL-friendly slug
- `reportType`: 'MACRO' | 'SECTOR'
- `sector`: Optional sector information
- `summary`: Brief report summary
- `publishedAt`: Publication date (ISO string)
- `viewCount`: Number of views
- `featured`: Boolean to display as featured card (full-width with enhanced styling)

**Features:**
- Responsive design (3 columns desktop, 2 tablet, 1 mobile)
- Sector-specific color coding
- Featured macro reports with prominent styling
- View count display
- Hover effects and smooth transitions

### 2. ReportSectionRenderer.tsx
Dynamically renders different types of report sections based on content type.

**Supported Section Types:**
- `TEXT`: Formatted paragraphs with proper typography
- `METRIC_CARDS`: Grid of metric cards with values, changes, and trends
- `CHART_DATA`: Interactive charts (bar/line) using Recharts
- `TABLE_DATA`: Responsive data tables with sortable columns
- `STOCK_LIST`: Grid of clickable stock cards with scores and prices

**Props:**
- `section`: ReportSection object containing type and content

### 3. ShareButtons.tsx
Social media sharing buttons for reports.

**Features:**
- Twitter sharing with pre-filled text
- LinkedIn sharing
- Copy link to clipboard with toast notification
- Hover effects and animations

**Props:**
- `title`: Report title for sharing
- `url`: Full URL to share
- `description`: Optional description

### 4. NewsletterSignup.tsx
Email subscription form for weekly reports newsletter.

**Features:**
- Email validation
- Sector selection (multi-select)
- Frequency options (weekly/daily)
- Success state with confirmation message
- GraphQL mutation integration
- Loading states and error handling

**Props:**
- `variant`: 'card' | 'banner' | 'modal'
- `onDismiss`: Optional dismiss callback
- `onSuccess`: Optional success callback

### 5. ReportCardSkeleton.tsx
Loading skeleton for report cards during data fetch.

## Pages

### Reports.tsx (Library Page)

Main reports library with filtering, sorting, and pagination.

**Features:**
- Tab navigation (All Reports, Macro Overview, Sector Reports)
- Sort options (Latest First, Most Viewed)
- Pagination (10 reports per page)
- Featured macro report (full-width first card)
- Responsive grid layout
- Empty states and error handling
- Newsletter signup section
- Loading skeletons
- SEO optimization

**URL:** `/reports`

### ReportDetail.tsx (Individual Report)

Full reading experience for individual reports.

**Features:**
- Clean typography optimized for reading (max-width: 800px)
- Header with metadata (date, sector, badges, view count)
- Reading time estimate
- Share buttons (Twitter, LinkedIn, Copy Link)
- Executive summary section (highlighted)
- Dynamic section rendering based on content type
- Tier-based gating (FREE users see first section, rest blurred)
- Upgrade prompt for gated content
- SEBI and AI disclaimers
- Back navigation
- SEO optimization with Open Graph tags

**URL:** `/reports/:slug`

## GraphQL Queries/Mutations

### Queries

1. `GET_REPORTS` - Fetch paginated list of reports with filters
2. `GET_REPORT_DETAIL` - Fetch single report with all sections
3. `LATEST_REPORTS` - Fetch N most recent reports
4. `GET_REPORTS_COUNT` - Get total report count with filters
5. `GET_NEWSLETTER_PREFERENCES` - Fetch user's newsletter preferences

### Mutations

1. `INCREMENT_REPORT_VIEW` - Increment view count when report is opened
2. `SUBSCRIBE_NEWSLETTER` - Subscribe to newsletter with preferences
3. `UNSUBSCRIBE_NEWSLETTER` - Unsubscribe from newsletter
4. `UPDATE_NEWSLETTER_PREFERENCES` - Update sector/frequency preferences

## Data Types

### Report
```typescript
interface Report {
  id: string;
  title: string;
  slug: string;
  reportType: 'MACRO' | 'SECTOR';
  sector?: { id: string; name: string } | null;
  summary: string;
  fullContent: string;
  publishedAt: string;
  fiscalWeek: number;
  fiscalYear: number;
  viewCount: number;
  reportSections: ReportSection[];
}
```

### ReportSection
```typescript
interface ReportSection {
  id: string;
  sectionOrder: number;
  sectionTitle: string;
  sectionType: 'TEXT' | 'METRIC_CARDS' | 'CHART_DATA' | 'TABLE_DATA' | 'STOCK_LIST';
  content: string; // JSON string for structured types
}
```

## Tier Gating

**FREE Tier:**
- View report title, summary, and first section
- Remaining content is blurred with upgrade prompt
- Must upgrade to PRO for full access

**PRO/PREMIUM Tier:**
- Full access to all reports
- No content restrictions

## Navigation Integration

Reports navigation item added to sidebar between "Market Trends" and "Portfolio":
- Icon: Newspaper (lucide-react)
- Route: `/reports`
- Desktop: Full label visible
- Tablet: Icon only (collapsed sidebar)
- Mobile: Bottom tab bar (5 primary items including Reports)

## Mock Data

For development, mock data is provided in `src/data/mockReportsData.ts`:
- `mockReports`: Array of 6 sample reports (mix of macro and sector)
- `mockReportDetail`: Detailed report with all section types
- `getMockReportsData()`: Simulates API with filtering and pagination
- `getReportBySlug()`: Fetch single report by slug

## Styling Guidelines

**Color Scheme:**
- Macro reports: Accent blue (#58A6FF)
- Sector reports: Color-coded by sector
- AI badge: Signal purple
- Success states: Signal green
- Error states: Signal red

**Typography:**
- Page titles: text-3xl font-bold
- Section titles: text-2xl font-bold
- Card titles: text-lg font-bold
- Body text: text-sm/text-base with relaxed leading
- Metadata: text-xs text-text-muted

**Spacing:**
- Section gaps: mb-8
- Card gaps: gap-6
- Internal padding: p-4 to p-8 depending on component

## Responsive Breakpoints

- Mobile: < 768px (1 column, bottom tab bar)
- Tablet: 768px - 1024px (2 columns, icon-only sidebar)
- Desktop: > 1024px (3 columns, full sidebar)

## Performance Optimizations

1. **Lazy Loading**: Reports and ReportDetail pages are lazy-loaded
2. **Pagination**: Only 10 reports loaded per page
3. **React Query**: Caching and automatic refetch on window focus
4. **Skeletons**: Loading skeletons prevent layout shifts
5. **Suspense Boundaries**: Graceful loading states with fallbacks

## SEO Optimization

- Unique page titles and meta descriptions
- Canonical URLs
- Open Graph tags for social sharing
- Semantic HTML structure
- Image alt texts (when implemented)

## Future Enhancements

1. **Search & Filters**: Add search bar and advanced filters (date range, sectors)
2. **Bookmarks**: Allow users to bookmark favorite reports
3. **Email Delivery**: Automated email delivery of reports
4. **PDF Export**: Export reports as PDF (PRO/PREMIUM feature)
5. **Comments**: User comments and discussions on reports
6. **Related Reports**: Show related reports at bottom
7. **Analytics**: Track user engagement and popular sections
8. **Push Notifications**: Notify users when new reports are published

## Testing

To test the feature:

1. Navigate to `/reports` to view the library
2. Use tab filters (All, Macro, Sector)
3. Toggle sort options (Latest, Popular)
4. Click pagination buttons
5. Click on any report card to view details
6. Test share buttons (Twitter, LinkedIn, Copy Link)
7. Subscribe to newsletter with different preferences
8. Test as FREE user to see gating behavior
9. Test responsiveness on mobile, tablet, desktop

## Dependencies

- React Router (navigation)
- TanStack React Query (data fetching)
- Recharts (charts)
- Lucide React (icons)
- React Hot Toast (notifications)
- Zustand (user state management)

## File Structure

```
src/
├── components/
│   └── reports/
│       ├── ReportCard.tsx
│       ├── ReportSectionRenderer.tsx
│       ├── ShareButtons.tsx
│       ├── NewsletterSignup.tsx
│       ├── ReportCardSkeleton.tsx
│       ├── index.ts
│       └── README.md (this file)
├── pages/
│   ├── Reports.tsx
│   └── ReportDetail.tsx
├── graphql/
│   └── reports.ts
└── data/
    └── mockReportsData.ts
```
