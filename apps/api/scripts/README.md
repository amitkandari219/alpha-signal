# API Test Scripts

This directory contains test scripts for various API endpoints.

## SEO Endpoints Test

The `testSEO.ts` script tests the SEO endpoints (`/sitemap.xml` and `/robots.txt`).

### Prerequisites

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Make sure the API server is running:
   ```bash
   npm run dev
   ```

### Running the Test

From the `apps/api` directory, run:

```bash
npx tsx scripts/testSEO.ts
```

Or with a custom API URL:

```bash
API_URL=http://localhost:4000 npx tsx scripts/testSEO.ts
```

### What it Tests

#### Sitemap.xml Tests:
- ✅ Returns HTTP 200 status
- ✅ Returns correct `application/xml` content type
- ✅ Response is not empty
- ✅ Valid XML structure with `<urlset>` root element
- ✅ Contains `<url>` entries with required fields (loc, priority, changefreq)
- ✅ Includes key pages (homepage, pricing, screener, stock pages, etc.)
- ✅ Displays sample URLs from the sitemap

#### Robots.txt Tests:
- ✅ Returns HTTP 200 status
- ✅ Returns correct `text/plain` content type
- ✅ Response is not empty
- ✅ Contains required directives (User-agent, Allow, Disallow, Sitemap)
- ✅ Allows public pages (/pricing, /screener, /stock/, /sectors/)
- ✅ Disallows private pages (/dashboard, /api/, /graphql)
- ✅ Displays full robots.txt content

### Expected Output

The script will display color-coded output:
- 🟢 Green: Tests passed
- 🔴 Red: Tests failed
- 🟡 Yellow: Warnings (non-critical issues)

### Troubleshooting

**API Server Not Running:**
```
❌ Failed: fetch failed
```
Solution: Start the API server with `npm run dev`

**Empty Database:**
```
⚠️ Warning: No stock pages found in sitemap
```
Solution: Run the database seed script: `npm run prisma:db:seed` or `npx tsx prisma/seed.ts`

**Invalid XML:**
```
❌ Failed: Invalid XML
```
Solution: Check the API logs for errors in sitemap generation
