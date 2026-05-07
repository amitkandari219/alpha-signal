# Quick Test Reference - PDF Export

## 🚀 Fast Track Testing (5 minutes)

### Step 1: Setup Test User (30 seconds)
```bash
# Open Prisma Studio
cd apps/api
npx prisma studio
```
- Navigate to `User` model
- Find your test user
- Change `tier` field to `PRO`
- Save

### Step 2: Test PDF Export (3 minutes)

1. **Open browser:**
   ```
   http://localhost:3000/stock/RELIANCE/report
   ```

2. **Login** with PRO user credentials

3. **Click "Download PDF"** button (blue button in header)

4. **Watch the loading progress** (30-60 seconds):
   - ✓ Preparing report data
   - ✓ Fetching financial data
   - ✓ Running AI analysis
   - ✓ Rendering infographics
   - ✓ Generating PDF
   - ✓ Finalizing document

5. **PDF downloads automatically** → Check Downloads folder

### Step 3: Verify PDF (1 minute)

**Open the PDF and check:**
- [ ] Has watermark "Alpha Signal PRO" (diagonal, semi-transparent)
- [ ] Header: "RELIANCE - Comprehensive Report"
- [ ] Footer: "Page X of Y | Generated: {date}"
- [ ] All sections visible (Timeline, Moat Radar, Business Model, Financials)
- [ ] Charts are clear and not pixelated
- [ ] No buttons or navbar visible
- [ ] White background (not dark theme)

### ✅ Success!
If all the above checks pass, the PDF export is working correctly.

---

## 🐛 Quick Troubleshooting

### Issue: Button says "PDF (PRO)" and is disabled
**Solution:** User tier is FREE. Change to PRO in Prisma Studio.

### Issue: "Module not found: puppeteer"
**Solution:**
```bash
cd apps/api
npm install puppeteer pdf-lib
```

### Issue: PDF generation takes >2 minutes
**Check backend logs:**
```bash
# Look for errors in terminal running npm run dev
# Should see: "🎨 Generating PDF for RELIANCE..."
```

### Issue: PDF is blank
**Solution:** Increase wait time in `pdfExporter.ts` line 104:
```typescript
await page.waitForTimeout(5000); // Was 3000
```

---

## 📊 Test All 3 Tiers (10 minutes)

### FREE User Test:
1. Set user `tier` = `FREE` in Prisma Studio
2. Click "Download PDF"
3. **Expected:** Upgrade modal appears

### PRO User Test:
1. Set user `tier` = `PRO` in Prisma Studio
2. Click "Download PDF"
3. **Expected:** Watermarked PDF downloads

### PREMIUM User Test:
1. Set user `tier` = `PREMIUM` in Prisma Studio
2. Click "Download PDF"
3. **Expected:** Clean PDF (no watermark) downloads

---

## 🔍 Verify Backend

**Check generated file:**
```bash
ls -lh apps/api/uploads/reports/
# Should see: RELIANCE_report_*.pdf (2-5 MB)

open apps/api/uploads/reports/RELIANCE_report_*.pdf
# Opens PDF in Preview
```

**Check database:**
```sql
-- In Prisma Studio, open "generated_reports" table
-- Should see new record with:
-- - symbol: RELIANCE
-- - status: COMPLETED
-- - downloadCount: 1
```

---

## 📝 Quick Checklist

Before marking as "Ready for Production":

- [ ] FREE user sees upgrade modal
- [ ] PRO user gets watermarked PDF in 30-60s
- [ ] PREMIUM user gets clean PDF in 30-60s
- [ ] PDF has proper headers/footers
- [ ] All infographics render correctly
- [ ] No console errors
- [ ] File size is reasonable (<10 MB)
- [ ] Share button copies link
- [ ] Refresh button works

---

## 🆘 Need Help?

**Read full guide:**
```
PDF_EXPORT_TESTING_GUIDE.md
```

**Check implementation:**
```
PROMPT_7_PDF_EXPORT_COMPLETE.md
```

**View code:**
```
apps/api/src/services/pdfExporter.ts
apps/web/src/components/reports/LoadingProgress.tsx
```
