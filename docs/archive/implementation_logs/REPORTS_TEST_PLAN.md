# Weekly Reports Feature - Test Plan

## Test Environment Setup

### Prerequisites
- Development server running on `http://localhost:5173`
- Mock data enabled (default for development)
- Browser: Chrome, Firefox, Safari, Edge
- Screen sizes: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

### Test User Accounts

**FREE Tier User:**
- Email: free@test.com
- Tier: FREE
- Expected: Limited access, gating on full reports

**PRO Tier User:**
- Email: pro@test.com
- Tier: PRO
- Expected: Full access to all reports

**PREMIUM Tier User:**
- Email: premium@test.com
- Tier: PREMIUM
- Expected: Full access to all reports

## Functional Tests

### 1. Reports Library Page

#### TC-001: Page Load
**Steps:**
1. Navigate to `/reports`
2. Wait for page to load

**Expected:**
- Page loads without errors
- Header displays "Weekly Intelligence Reports"
- Latest report date shown in subtitle
- Total reports count badge displayed
- Tab navigation visible (All Reports, Macro Overview, Sector Reports)
- Sort dropdown visible (Latest First, Most Viewed)
- Reports grid displayed with cards
- Newsletter signup section at bottom

**Status:** ☐ Pass ☐ Fail

---

#### TC-002: Tab Navigation - All Reports
**Steps:**
1. Navigate to `/reports`
2. Click "All Reports" tab (default)
3. Observe displayed reports

**Expected:**
- Tab is active (blue background)
- Both MACRO and SECTOR reports displayed
- Reports sorted by latest first (default)
- Pagination shows correct count

**Status:** ☐ Pass ☐ Fail

---

#### TC-003: Tab Navigation - Macro Overview
**Steps:**
1. Navigate to `/reports`
2. Click "Macro Overview" tab
3. Observe displayed reports

**Expected:**
- Tab is active (blue background)
- Only MACRO reports displayed
- Sector reports filtered out
- URL updates or query params change
- Pagination resets to page 1

**Status:** ☐ Pass ☐ Fail

---

#### TC-004: Tab Navigation - Sector Reports
**Steps:**
1. Navigate to `/reports`
2. Click "Sector Reports" tab
3. Observe displayed reports

**Expected:**
- Tab is active (blue background)
- Only SECTOR reports displayed
- Each card shows sector badge with color coding
- MACRO reports filtered out
- Pagination resets to page 1

**Status:** ☐ Pass ☐ Fail

---

#### TC-005: Sort - Latest First
**Steps:**
1. Navigate to `/reports`
2. Select "Latest First" from dropdown
3. Observe report order

**Expected:**
- Reports ordered by publishedAt DESC
- Most recent report appears first
- Date ordering is correct

**Status:** ☐ Pass ☐ Fail

---

#### TC-006: Sort - Most Viewed
**Steps:**
1. Navigate to `/reports`
2. Select "Most Viewed" from dropdown
3. Observe report order

**Expected:**
- Reports ordered by viewCount DESC
- Report with highest view count appears first
- View count ordering is correct

**Status:** ☐ Pass ☐ Fail

---

#### TC-007: Featured Report Display
**Steps:**
1. Navigate to `/reports`
2. Ensure first report is MACRO type
3. Observe first report card

**Expected:**
- First MACRO report spans full width (3 columns)
- Has accent blue left border (4px)
- Displays "MACRO WEEKLY" badge
- Shows longer summary (200 chars)
- Has "Read Full Report" CTA
- View count displayed

**Status:** ☐ Pass ☐ Fail

---

#### TC-008: Standard Report Cards
**Steps:**
1. Navigate to `/reports`
2. Observe non-featured report cards

**Expected:**
- Cards span 1 column width
- Sector badge (if sector report) or MACRO badge
- Title displayed (text-lg)
- Published date shown with calendar icon
- Summary truncated to 100 chars
- View count with eye icon
- "Read" CTA button
- Hover effect (border color change, background change)

**Status:** ☐ Pass ☐ Fail

---

#### TC-009: Pagination - Next Page
**Steps:**
1. Navigate to `/reports`
2. Click "Next" button
3. Observe results

**Expected:**
- Page increments by 1
- New set of reports loaded
- Previous button becomes enabled
- Page number buttons update
- Results count updates (showing 11-20 of X)
- Smooth transition without page reload

**Status:** ☐ Pass ☐ Fail

---

#### TC-010: Pagination - Previous Page
**Steps:**
1. Navigate to page 2 or higher
2. Click "Previous" button
3. Observe results

**Expected:**
- Page decrements by 1
- Previous set of reports loaded
- Page number buttons update
- Results count updates
- If page 1, Previous button becomes disabled

**Status:** ☐ Pass ☐ Fail

---

#### TC-011: Pagination - Page Number Click
**Steps:**
1. Navigate to `/reports`
2. Click on page number button (e.g., "3")
3. Observe results

**Expected:**
- Jump to clicked page
- Correct reports loaded
- Page number button highlighted
- Results count updates

**Status:** ☐ Pass ☐ Fail

---

#### TC-012: Empty State
**Steps:**
1. Navigate to `/reports`
2. Filter to category with no reports (mock data may not have this)
3. Observe empty state

**Expected:**
- Empty state card displayed
- TrendingUp icon shown
- Message: "No reports found"
- Helpful text explaining no reports in this category

**Status:** ☐ Pass ☐ Fail

---

#### TC-013: Loading State
**Steps:**
1. Navigate to `/reports`
2. Observe initial load (may need slow network throttling)

**Expected:**
- Loading spinner (Loader2 icon) displayed
- Spinner is centered on page
- Spinner animates (spinning)
- Content appears after load

**Status:** ☐ Pass ☐ Fail

---

#### TC-014: Error State
**Steps:**
1. Simulate network error (disable API or mock data)
2. Navigate to `/reports`
3. Observe error state

**Expected:**
- Error card displayed
- Red background/border
- Error message shown
- Helpful text about trying again

**Status:** ☐ Pass ☐ Fail

---

### 2. Report Detail Page

#### TC-015: Page Load
**Steps:**
1. Navigate to `/reports/market-weekly-tech-rally-continues-amid-fed-optimism`
2. Wait for page to load

**Expected:**
- Page loads without errors
- Back button visible at top
- Report title displayed (text-3xl)
- Metadata row shows: date, badges, view count
- Reading time displayed
- Share buttons row visible
- Executive summary section highlighted
- Report sections rendered
- Footer with disclaimers
- "View More Reports" button at bottom

**Status:** ☐ Pass ☐ Fail

---

#### TC-016: Back Navigation
**Steps:**
1. Navigate to any report detail page
2. Click "Back to Reports" button at top
3. Observe navigation

**Expected:**
- Navigate back to `/reports`
- Reports library page loads
- Previous filter/sort/page state preserved (if possible)

**Status:** ☐ Pass ☐ Fail

---

#### TC-017: Report Metadata Display
**Steps:**
1. Navigate to any report detail page
2. Observe metadata section

**Expected:**
- Published date formatted correctly (e.g., "March 15, 2024")
- Calendar icon displayed
- Sector badge visible (if sector report) with correct color
- Report type badge displayed (MACRO or sector)
- AI Generated badge with sparkles icon
- View count with eye icon
- All metadata properly aligned

**Status:** ☐ Pass ☐ Fail

---

#### TC-018: Reading Time Calculation
**Steps:**
1. Navigate to any report detail page
2. Observe reading time

**Expected:**
- Reading time displayed with clock icon
- Time calculated based on word count (200 words/min)
- Reasonable estimate (e.g., "5 min read" for ~1000 words)

**Status:** ☐ Pass ☐ Fail

---

#### TC-019: Share - Twitter
**Steps:**
1. Navigate to any report detail page
2. Click Twitter share button
3. Observe behavior

**Expected:**
- Twitter share dialog opens in new window (550x420)
- Pre-filled text includes report title
- URL included in tweet
- Window closes after share/cancel

**Status:** ☐ Pass ☐ Fail

---

#### TC-020: Share - LinkedIn
**Steps:**
1. Navigate to any report detail page
2. Click LinkedIn share button
3. Observe behavior

**Expected:**
- LinkedIn share dialog opens in new window (550x420)
- URL included
- Window closes after share/cancel

**Status:** ☐ Pass ☐ Fail

---

#### TC-021: Share - Copy Link
**Steps:**
1. Navigate to any report detail page
2. Click "Copy link" button
3. Observe behavior

**Expected:**
- Link copied to clipboard
- Toast notification appears: "Link copied to clipboard!"
- Button icon changes to checkmark briefly (2 seconds)
- Icon returns to link icon after 2 seconds

**Status:** ☐ Pass ☐ Fail

---

#### TC-022: Executive Summary Display
**Steps:**
1. Navigate to any report detail page
2. Observe executive summary section

**Expected:**
- Section has blue/purple gradient background
- Blue left border (4px)
- "EXECUTIVE SUMMARY" label (uppercase, small text)
- Summary text displayed
- Proper padding and spacing

**Status:** ☐ Pass ☐ Fail

---

#### TC-023: TEXT Section Rendering
**Steps:**
1. Navigate to report with TEXT sections
2. Observe TEXT section rendering

**Expected:**
- Section title displayed (if present)
- Paragraphs properly formatted
- Line breaks preserved (\\n\\n separates paragraphs)
- Readable typography (prose styling)
- Proper spacing between paragraphs

**Status:** ☐ Pass ☐ Fail

---

#### TC-024: METRIC_CARDS Section Rendering
**Steps:**
1. Navigate to report with METRIC_CARDS sections
2. Observe metric cards

**Expected:**
- Section title displayed
- Metric cards in grid (2-4 columns based on count)
- Each card shows:
  - Label (small text)
  - Value (large bold text)
  - Change percentage with arrow icon
  - Change label (e.g., "WoW")
  - Sparkline (if data provided)
- Cards have hover effect

**Status:** ☐ Pass ☐ Fail

---

#### TC-025: CHART_DATA Section - Bar Chart
**Steps:**
1. Navigate to report with bar chart section
2. Observe chart rendering

**Expected:**
- Section title displayed
- Chart container with proper dimensions (350px height)
- Bar chart renders correctly
- X and Y axes labeled
- Grid lines visible
- Bars colored (accent blue)
- Tooltip appears on hover
- Legend displayed
- Chart responsive to container width

**Status:** ☐ Pass ☐ Fail

---

#### TC-026: CHART_DATA Section - Line Chart
**Steps:**
1. Navigate to report with line chart section
2. Observe chart rendering

**Expected:**
- Section title displayed
- Line chart renders correctly
- X and Y axes labeled
- Grid lines visible
- Line colored (accent blue)
- Data points visible
- Tooltip appears on hover
- Legend displayed
- Chart responsive to container width

**Status:** ☐ Pass ☐ Fail

---

#### TC-027: TABLE_DATA Section Rendering
**Steps:**
1. Navigate to report with table section
2. Observe table rendering

**Expected:**
- Section title displayed
- Table headers displayed (uppercase, small text)
- Rows properly formatted
- Alternating row colors for readability
- Hover effect on rows
- Horizontal scroll on mobile if needed
- Proper cell padding and alignment

**Status:** ☐ Pass ☐ Fail

---

#### TC-028: STOCK_LIST Section Rendering
**Steps:**
1. Navigate to report with stock list section
2. Observe stock cards

**Expected:**
- Section title displayed
- Stock cards in grid (2-3 columns)
- Each card shows:
  - Stock symbol (bold, large)
  - Company name (small, muted)
  - Scores grid (Alpha, Quality, Value)
  - Price with rupee symbol
  - Return percentage with trend arrow
- Cards are clickable links
- Arrow icon on right side
- Hover effect (border color, background, arrow moves)

**Status:** ☐ Pass ☐ Fail

---

#### TC-029: Stock Card Click
**Steps:**
1. Navigate to report with stock list section
2. Click on any stock card
3. Observe navigation

**Expected:**
- Navigate to `/stock/:symbol`
- Stock detail page loads
- Correct stock displayed

**Status:** ☐ Pass ☐ Fail

---

#### TC-030: Tier Gating - FREE User
**Steps:**
1. Login as FREE user
2. Navigate to any report detail page
3. Observe content visibility

**Expected:**
- First section visible and clear
- Remaining sections blurred
- Blur overlay appears after first section
- Upgrade prompt displayed in overlay
- Prompt shows:
  - Lock icon
  - "Upgrade to PRO" message
  - Benefits list
  - Pricing information
  - "Upgrade to PRO" button

**Status:** ☐ Pass ☐ Fail

---

#### TC-031: Tier Gating - PRO User
**Steps:**
1. Login as PRO user
2. Navigate to any report detail page
3. Observe content visibility

**Expected:**
- All sections visible and clear
- No blur overlay
- No upgrade prompt
- Full report accessible

**Status:** ☐ Pass ☐ Fail

---

#### TC-032: View Count Increment
**Steps:**
1. Navigate to any report detail page
2. Check localStorage for `viewedReports`
3. Observe view count behavior

**Expected:**
- View count incremented on first view
- Report slug added to localStorage `viewedReports` array
- Subsequent views don't increment count
- GraphQL mutation called (check network tab)

**Status:** ☐ Pass ☐ Fail

---

#### TC-033: Disclaimers Display
**Steps:**
1. Navigate to any report detail page
2. Scroll to footer
3. Observe disclaimers section

**Expected:**
- Disclaimers card displayed
- "IMPORTANT DISCLAIMERS" heading
- Four disclaimers shown:
  - AI-Generated Content
  - SEBI Disclaimer
  - Past Performance
  - Data Accuracy
- Proper formatting and readability
- All text visible without truncation

**Status:** ☐ Pass ☐ Fail

---

#### TC-034: Report Not Found
**Steps:**
1. Navigate to `/reports/invalid-slug-that-does-not-exist`
2. Observe error page

**Expected:**
- 404 error card displayed
- Alert icon shown
- "Report Not Found" heading
- Helpful error message
- "Back to Reports" button
- Button navigates to `/reports`

**Status:** ☐ Pass ☐ Fail

---

### 3. Newsletter Signup

#### TC-035: Newsletter Form Display
**Steps:**
1. Navigate to `/reports`
2. Scroll to bottom
3. Observe newsletter signup section

**Expected:**
- Newsletter card displayed
- Mail icon shown
- Heading: "Get Weekly Market Intelligence in Your Inbox"
- Subtitle with subscriber count
- Email input field
- Sector selection buttons (10 sectors)
- Frequency selection (Weekly/Daily)
- Subscribe button
- Disclaimer text

**Status:** ☐ Pass ☐ Fail

---

#### TC-036: Email Validation
**Steps:**
1. Navigate to `/reports`
2. Click on email input
3. Enter invalid email (e.g., "test" or "test@")
4. Tab away or submit

**Expected:**
- Error message appears: "Please enter a valid email address"
- Email field has red border
- Alert icon displayed
- Submit button remains disabled

**Status:** ☐ Pass ☐ Fail

---

#### TC-037: Sector Selection
**Steps:**
1. Navigate to `/reports`
2. Click sector buttons to select
3. Observe selection behavior

**Expected:**
- Clicked sectors have blue background and border
- Unselected sectors have gray background
- Selected sectors appear as badges below buttons
- Can remove sectors by clicking X on badge
- Minimum 1 sector required (validation)

**Status:** ☐ Pass ☐ Fail

---

#### TC-038: Frequency Selection
**Steps:**
1. Navigate to `/reports`
2. Click frequency buttons
3. Observe selection behavior

**Expected:**
- One frequency selected at a time (radio behavior)
- Selected frequency has green background and border
- Unselected frequency has gray background
- Default is "Weekly"

**Status:** ☐ Pass ☐ Fail

---

#### TC-039: Newsletter Submission
**Steps:**
1. Navigate to `/reports`
2. Enter valid email
3. Select at least one sector
4. Choose frequency
5. Click "Subscribe to Newsletter"
6. Observe behavior

**Expected:**
- Submit button shows loading state (spinner, "Subscribing...")
- GraphQL mutation called
- Success message appears after ~2 seconds
- Form replaced with success card
- Success card shows:
  - Green checkmark icon
  - "Welcome to Alpha Signal Intelligence!" heading
  - Confirmation message
  - Frequency mentioned

**Status:** ☐ Pass ☐ Fail

---

#### TC-040: Newsletter Validation - No Email
**Steps:**
1. Navigate to `/reports`
2. Leave email field empty
3. Try to submit

**Expected:**
- Submit button disabled
- Cannot submit form
- No error message (button just disabled)

**Status:** ☐ Pass ☐ Fail

---

#### TC-041: Newsletter Validation - No Sectors
**Steps:**
1. Navigate to `/reports`
2. Enter valid email
3. Deselect all sectors
4. Try to submit

**Expected:**
- Error message appears: "Please select at least one sector"
- Submit button disabled
- Cannot submit form

**Status:** ☐ Pass ☐ Fail

---

### 4. Responsive Design

#### TC-042: Desktop Layout (≥1024px)
**Steps:**
1. Open browser at 1920x1080
2. Navigate to `/reports`
3. Observe layout

**Expected:**
- Sidebar fully expanded (260px)
- Reports grid: 3 columns
- Featured report spans all 3 columns
- Metric cards: 4 columns
- Stock cards: 3 columns
- Tables not scrolling (fit width)
- All content properly aligned

**Status:** ☐ Pass ☐ Fail

---

#### TC-043: Tablet Layout (768px-1023px)
**Steps:**
1. Resize browser to 768x1024
2. Navigate to `/reports`
3. Observe layout

**Expected:**
- Sidebar collapsed to icon-only (64px)
- Reports grid: 2 columns
- Featured report spans both columns
- Metric cards: 2-3 columns
- Stock cards: 2 columns
- Tables may scroll horizontally
- Content adjusts smoothly

**Status:** ☐ Pass ☐ Fail

---

#### TC-044: Mobile Layout (<768px)
**Steps:**
1. Resize browser to 375x667
2. Navigate to `/reports`
3. Observe layout

**Expected:**
- Sidebar hidden
- Bottom tab bar visible with 5 items
- Reports grid: 1 column
- Featured report: full width
- Metric cards: 2 columns
- Stock cards: 1 column
- Tables scroll horizontally
- Proper padding on all sides
- Touch-friendly tap targets (min 44x44px)

**Status:** ☐ Pass ☐ Fail

---

#### TC-045: Report Detail - Mobile
**Steps:**
1. Resize browser to 375x667
2. Navigate to any report detail page
3. Observe layout

**Expected:**
- Content max-width respected
- Horizontal padding on all sections
- Charts responsive (fit width)
- Tables scroll horizontally
- Share buttons stack or wrap properly
- Text readable (no tiny font sizes)
- Proper spacing maintained

**Status:** ☐ Pass ☐ Fail

---

### 5. Performance

#### TC-046: Page Load Time - Reports Library
**Steps:**
1. Open DevTools Network tab
2. Navigate to `/reports`
3. Measure load time

**Expected:**
- Initial page load: < 2 seconds
- First contentful paint: < 1 second
- Time to interactive: < 3 seconds
- No excessive re-renders

**Status:** ☐ Pass ☐ Fail

---

#### TC-047: Page Load Time - Report Detail
**Steps:**
1. Open DevTools Network tab
2. Navigate to report detail page
3. Measure load time

**Expected:**
- Initial page load: < 2 seconds
- First contentful paint: < 1 second
- Time to interactive: < 3 seconds

**Status:** ☐ Pass ☐ Fail

---

#### TC-048: Lazy Loading
**Steps:**
1. Navigate to `/`
2. Observe network requests
3. Click "Reports" in sidebar
4. Observe additional requests

**Expected:**
- Reports page not loaded until clicked
- Separate chunk loaded on navigation
- No unnecessary preloading

**Status:** ☐ Pass ☐ Fail

---

#### TC-049: React Query Caching
**Steps:**
1. Navigate to `/reports`
2. Wait for data to load
3. Click on a report
4. Click "Back to Reports"
5. Observe behavior

**Expected:**
- Reports list shows immediately (from cache)
- Background refetch happens
- No loading spinner on return
- Smooth user experience

**Status:** ☐ Pass ☐ Fail

---

### 6. SEO

#### TC-050: Reports Library - Meta Tags
**Steps:**
1. Navigate to `/reports`
2. View page source
3. Check meta tags

**Expected:**
- Title: "Weekly Intelligence Reports - Alpha Signal"
- Meta description present
- Canonical URL: `/reports`
- Open Graph tags present
- No index issues

**Status:** ☐ Pass ☐ Fail

---

#### TC-051: Report Detail - Meta Tags
**Steps:**
1. Navigate to any report detail page
2. View page source
3. Check meta tags

**Expected:**
- Title: "{Report Title} - Alpha Signal"
- Meta description from report summary
- Canonical URL: `/reports/{slug}`
- Open Graph tags present
- og:title, og:description, og:url set
- No index issues

**Status:** ☐ Pass ☐ Fail

---

### 7. Accessibility

#### TC-052: Keyboard Navigation
**Steps:**
1. Navigate to `/reports`
2. Use Tab key to navigate
3. Use Enter/Space to activate buttons

**Expected:**
- All interactive elements focusable
- Focus indicator visible
- Logical tab order
- Can navigate entire page with keyboard
- Can activate all buttons and links

**Status:** ☐ Pass ☐ Fail

---

#### TC-053: Screen Reader Compatibility
**Steps:**
1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Navigate to `/reports`
3. Navigate page with screen reader

**Expected:**
- Page title announced
- Landmarks properly identified
- Links announce destination
- Buttons announce action
- Images have alt text
- Form labels associated with inputs

**Status:** ☐ Pass ☐ Fail

---

#### TC-054: Color Contrast
**Steps:**
1. Use browser color contrast checker
2. Check all text elements
3. Verify contrast ratios

**Expected:**
- All text meets WCAG AA standards (4.5:1)
- Interactive elements meet contrast requirements
- Focus indicators visible

**Status:** ☐ Pass ☐ Fail

---

### 8. Cross-Browser Compatibility

#### TC-055: Chrome
**Steps:**
1. Open Chrome browser
2. Navigate to reports feature
3. Test all functionality

**Expected:**
- All features work correctly
- Layout renders properly
- No console errors

**Status:** ☐ Pass ☐ Fail

---

#### TC-056: Firefox
**Steps:**
1. Open Firefox browser
2. Navigate to reports feature
3. Test all functionality

**Expected:**
- All features work correctly
- Layout renders properly
- No console errors

**Status:** ☐ Pass ☐ Fail

---

#### TC-057: Safari
**Steps:**
1. Open Safari browser
2. Navigate to reports feature
3. Test all functionality

**Expected:**
- All features work correctly
- Layout renders properly
- No console errors
- Clipboard API works

**Status:** ☐ Pass ☐ Fail

---

#### TC-058: Edge
**Steps:**
1. Open Edge browser
2. Navigate to reports feature
3. Test all functionality

**Expected:**
- All features work correctly
- Layout renders properly
- No console errors

**Status:** ☐ Pass ☐ Fail

---

## Test Summary

**Total Test Cases:** 58

**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Not Executed:** ___

## Bug Tracking

| Bug ID | Test Case | Severity | Description | Status |
|--------|-----------|----------|-------------|--------|
|        |           |          |             |        |

## Severity Levels

- **Critical:** Blocks core functionality, no workaround
- **High:** Major feature not working, workaround exists
- **Medium:** Feature partially working or visual issues
- **Low:** Minor issues, cosmetic problems

---

**Test Executed By:** _______________
**Date:** _______________
**Environment:** _______________
**Build/Version:** _______________
