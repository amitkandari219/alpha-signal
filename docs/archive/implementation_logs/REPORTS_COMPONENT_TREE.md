# Weekly Reports - Component Hierarchy

## Visual Component Tree

```
App.tsx
├── Routes
    ├── /reports
    │   └── Reports.tsx (Reports Library Page)
    │       ├── SEO
    │       ├── Header Section
    │       │   ├── Title & Subtitle
    │       │   ├── Description
    │       │   └── Total Reports Count Badge
    │       ├── Tab Navigation
    │       │   ├── All Reports Tab
    │       │   ├── Macro Overview Tab
    │       │   └── Sector Reports Tab
    │       ├── Sort Dropdown
    │       │   ├── Latest First
    │       │   └── Most Viewed
    │       ├── Loading State
    │       │   └── Loader2 Icon (spinning)
    │       ├── Error State
    │       │   └── Error Message Card
    │       ├── Reports Grid
    │       │   └── ReportCard[] (mapped from reports data)
    │       │       ├── ReportCard (featured variant for first macro)
    │       │       │   ├── Badge (MACRO WEEKLY)
    │       │       │   ├── View Count
    │       │       │   ├── Title (text-2xl)
    │       │       │   ├── Published Date
    │       │       │   ├── Summary (200 chars)
    │       │       │   └── "Read Full Report" CTA
    │       │       └── ReportCard (standard)
    │       │           ├── Badge (Sector or MACRO)
    │       │           ├── View Count
    │       │           ├── Title (text-lg)
    │       │           ├── Published Date
    │       │           ├── Summary (100 chars)
    │       │           └── "Read" CTA
    │       ├── Pagination
    │       │   ├── Results Count Display
    │       │   ├── Previous Button
    │       │   ├── Page Number Buttons (1-5)
    │       │   └── Next Button
    │       ├── Empty State
    │       │   ├── TrendingUp Icon
    │       │   ├── "No reports found" Message
    │       │   └── Helpful Text
    │       └── NewsletterSignup
    │           ├── Header with Mail Icon
    │           ├── Email Input Field
    │           ├── Sector Selection Buttons (10 sectors)
    │           ├── Frequency Selection (Weekly/Daily)
    │           ├── Submit Button
    │           └── Success State
    │
    └── /reports/:slug
        └── ReportDetail.tsx (Individual Report Page)
            ├── SEO (with Open Graph tags)
            ├── Back Button
            │   └── Link to /reports
            ├── Article Container (max-w-4xl)
                ├── Header Section
                │   ├── Title (text-3xl)
                │   ├── Metadata Row
                │   │   ├── Published Date with Calendar Icon
                │   │   ├── Sector Badge (if sector report)
                │   │   ├── Report Type Badge (MACRO/SECTOR)
                │   │   ├── AI Generated Badge
                │   │   └── View Count with Eye Icon
                │   ├── Reading Time with Clock Icon
                │   └── ShareButtons
                │       ├── Twitter Share Button
                │       ├── LinkedIn Share Button
                │       └── Copy Link Button
                ├── Executive Summary
                │   └── Highlighted Summary Text
                ├── Report Sections Container
                │   └── ReportSectionRenderer[] (mapped from sections)
                │       ├── TEXT Section
                │       │   ├── Section Title (optional)
                │       │   └── Prose Paragraphs
                │       ├── METRIC_CARDS Section
                │       │   ├── Section Title
                │       │   └── MetricCard Grid (2-4 cols)
                │       │       └── MetricCard
                │       │           ├── Label
                │       │           ├── Value (text-2xl)
                │       │           ├── Change Indicator
                │       │           └── Sparkline (optional)
                │       ├── CHART_DATA Section
                │       │   ├── Section Title
                │       │   └── Recharts Container
                │       │       ├── BarChart (if type=bar)
                │       │       │   ├── CartesianGrid
                │       │       │   ├── XAxis
                │       │       │   ├── YAxis
                │       │       │   ├── Tooltip
                │       │       │   ├── Legend
                │       │       │   └── Bar
                │       │       └── LineChart (if type=line)
                │       │           ├── CartesianGrid
                │       │           ├── XAxis
                │       │           ├── YAxis
                │       │           ├── Tooltip
                │       │           ├── Legend
                │       │           └── Line
                │       ├── TABLE_DATA Section
                │       │   ├── Section Title
                │       │   └── Table
                │       │       ├── thead
                │       │       │   └── th[] (headers)
                │       │       └── tbody
                │       │           └── tr[] (rows)
                │       │               └── td[] (cells)
                │       └── STOCK_LIST Section
                │           ├── Section Title
                │           └── Stock Cards Grid (2-3 cols)
                │               └── Link to /stock/:symbol
                │                   ├── Stock Symbol & Name
                │                   ├── Scores Grid (Alpha, Quality, Value)
                │                   └── Price & Return
                ├── Tier Gating (FREE users)
                │   ├── Blur Overlay (on sections 2+)
                │   └── UpgradePrompt
                │       ├── Feature Key
                │       ├── Required Tier Badge
                │       ├── Benefits List
                │       └── "Upgrade to PRO" Button
                └── Footer Section
                    ├── Disclaimers Card
                    │   ├── AI-Generated Content Disclaimer
                    │   ├── SEBI Disclaimer
                    │   ├── Past Performance Disclaimer
                    │   └── Data Accuracy Disclaimer
                    └── Back to Reports Button
```

## Component Props Flow

### Reports.tsx → ReportCard

```typescript
<ReportCard
  id={report.id}
  title={report.title}
  slug={report.slug}
  reportType={report.reportType}
  sector={report.sector}
  summary={report.summary}
  publishedAt={report.publishedAt}
  viewCount={report.viewCount}
  featured={isFeatured}
/>
```

### ReportDetail.tsx → ReportSectionRenderer

```typescript
<ReportSectionRenderer
  section={{
    id: section.id,
    sectionOrder: section.sectionOrder,
    sectionTitle: section.sectionTitle,
    sectionType: section.sectionType,
    content: section.content
  }}
/>
```

### ReportDetail.tsx → ShareButtons

```typescript
<ShareButtons
  title={report.title}
  url={window.location.href}
  description={report.summary}
/>
```

### ReportDetail.tsx → UpgradePrompt

```typescript
<UpgradePrompt
  feature="ai_summary_full"
  variant="inline"
  requiredTier="PRO"
  message="Upgrade to PRO to read the full report..."
/>
```

### Reports.tsx → NewsletterSignup

```typescript
<NewsletterSignup
  variant="card"
  onSuccess={() => console.log('Subscribed!')}
/>
```

## State Management Flow

```
User Action → Component State → React Query → API/Mock Data → Component Re-render
     ↓
Tab Click → setActiveTab('macro') → Trigger refetch → GET_REPORTS with filter → Update reports[]
     ↓
Sort Change → setSortBy('popular') → Trigger refetch → Sort by viewCount → Update reports[]
     ↓
Page Change → setCurrentPage(2) → Trigger refetch → GET_REPORTS with offset → Update reports[]
     ↓
Report Click → Navigate to /reports/:slug → GET_REPORT_DETAIL → Render sections
     ↓
Share Click → Open share dialog / Copy to clipboard → Show toast notification
     ↓
Newsletter Submit → POST subscription → Show success state
```

## Data Flow Diagram

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ├─ Navigate to /reports
         │
         ▼
┌─────────────────────────┐
│   Reports.tsx (Page)    │
│   ┌─────────────────┐   │
│   │ React Query     │   │
│   │ useQuery()      │   │
│   └────────┬────────┘   │
└────────────┼────────────┘
             │
             ├─ API Call: GET_REPORTS
             │
             ▼
┌──────────────────────────┐
│  Mock Data / GraphQL API │
│  getMockReportsData()    │
│  or Apollo Client        │
└──────────┬───────────────┘
           │
           ├─ Returns: { reports[], totalCount }
           │
           ▼
┌──────────────────────────┐
│   Reports.tsx            │
│   ┌──────────────────┐   │
│   │ reports.map()    │   │
│   │   ↓              │   │
│   │ <ReportCard />   │◄──┼─ Props: report data
│   └──────────────────┘   │
└──────────────────────────┘
           │
           ├─ User clicks report card
           │
           ▼
┌──────────────────────────┐
│  Navigate to             │
│  /reports/slug           │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  ReportDetail.tsx        │
│  ┌──────────────────┐    │
│  │ React Query      │    │
│  │ useQuery()       │    │
│  └────────┬─────────┘    │
└───────────┼──────────────┘
            │
            ├─ API Call: GET_REPORT_DETAIL
            │
            ▼
┌───────────────────────────┐
│  Mock Data / GraphQL API  │
│  getReportBySlug()        │
└───────────┬───────────────┘
            │
            ├─ Returns: Report with sections[]
            │
            ▼
┌───────────────────────────┐
│  ReportDetail.tsx         │
│  ┌─────────────────────┐  │
│  │ sections.map()      │  │
│  │   ↓                 │  │
│  │ <ReportSection     │◄─┼─ Props: section data
│  │  Renderer />        │  │
│  └─────────────────────┘  │
└───────────────────────────┘
```

## Event Handlers

### Reports Page

```typescript
// Tab navigation
handleTabClick(tab: 'all' | 'macro' | 'sector') → setActiveTab(tab)

// Sort selection
handleSortChange(sort: 'latest' | 'popular') → setSortBy(sort)

// Pagination
handlePreviousPage() → setCurrentPage(page - 1)
handleNextPage() → setCurrentPage(page + 1)
handlePageClick(pageNum: number) → setCurrentPage(pageNum)

// Report card click
handleReportClick(slug: string) → navigate(`/reports/${slug}`)
```

### Report Detail Page

```typescript
// Share buttons
handleTwitterShare() → window.open(twitterUrl)
handleLinkedInShare() → window.open(linkedInUrl)
handleCopyLink() → navigator.clipboard.writeText(url)

// View tracking
useEffect(() → incrementReportView(slug))

// Back navigation
handleBackClick() → navigate('/reports')
```

### Newsletter Signup

```typescript
// Form submission
handleSubmit(e) → subscribeNewsletter({ email, sectors, frequency })

// Email validation
handleEmailChange(e) → validateEmail(value) → setEmailError()

// Sector toggle
handleSectorToggle(sectorId) → toggleSector(sectorId)

// Frequency selection
handleFrequencyChange(freq) → setFrequency(freq)
```

## Responsive Behavior

```
Desktop (≥1024px)
├── Sidebar: Full width (260px), expanded
├── Reports Grid: 3 columns
├── Stock Cards: 3 columns
└── Metric Cards: 4 columns

Tablet (768px-1023px)
├── Sidebar: Icon only (64px), collapsed
├── Reports Grid: 2 columns
├── Stock Cards: 2 columns
└── Metric Cards: 2 columns

Mobile (<768px)
├── Sidebar: Hidden (bottom tab bar)
├── Reports Grid: 1 column
├── Stock Cards: 1 column
└── Metric Cards: 2 columns
```

## Loading States

```
Initial Load
├── Reports Page: Show ReportCardSkeleton (6 cards)
└── Report Detail: Show Loader2 spinner

Data Fetching
├── Show loading skeletons
├── Disable interaction
└── Fade in content when ready

Pagination
├── Keep existing content visible
├── Show loading indicator
└── Smooth transition to new content
```

## Error States

```
Network Error
├── Show error card
├── Display error message
├── Provide "Retry" button
└── Log error to console

Not Found
├── Show 404 message
├── Provide helpful text
├── Link back to reports library
└── Suggest alternatives

Validation Error
├── Show inline error message
├── Highlight invalid fields
└── Prevent form submission
```

---

**Component Count Summary:**
- Pages: 2
- Shared Components: 5
- Total Files: 11
- Lines of Code: ~2000+
