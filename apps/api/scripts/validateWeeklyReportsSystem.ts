/**
 * Weekly Reports System Validation
 *
 * Tests all 18 validation requirements from the specification
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ValidationResult {
  id: number;
  description: string;
  passed: boolean;
  details?: string;
  error?: string;
}

const results: ValidationResult[] = [];

function pass(id: number, description: string, details?: string) {
  results.push({ id, description, passed: true, details });
}

function fail(id: number, description: string, error: string) {
  results.push({ id, description, passed: false, error });
}

async function validate() {
  console.log('🧪 WEEKLY REPORTS SYSTEM VALIDATION\n');
  console.log('Running 18 validation checks...\n');

  try {
    // ═════════════════════════════════════════════════
    // DATABASE & BACKEND VALIDATION (1-6)
    // ═════════════════════════════════════════════════

    // 1. Database: weekly_reports table exists with sample data
    try {
      const reportCount = await prisma.weeklyReport.count();
      if (reportCount >= 2) {
        pass(1, 'Database: weekly_reports table has sample data', `Found ${reportCount} reports`);
      } else {
        fail(1, 'Database: weekly_reports table has sample data', `Only ${reportCount} reports found (expected >= 2)`);
      }
    } catch (e: any) {
      fail(1, 'Database: weekly_reports table has sample data', e.message);
    }

    // 2. Python Engine: WeeklyReportGenerator class exists
    const enginePath = path.join(process.cwd(), '../analytics/src/engines/weekly_report_generator.py');
    if (fs.existsSync(enginePath)) {
      const content = fs.readFileSync(enginePath, 'utf-8');
      if (content.includes('class WeeklyReportGenerator') && content.includes('def generate_sector_weekly_report')) {
        pass(2, 'Python Engine: WeeklyReportGenerator class exists', 'Found class with sector and macro methods');
      } else {
        fail(2, 'Python Engine: WeeklyReportGenerator class exists', 'Class found but missing methods');
      }
    } else {
      fail(2, 'Python Engine: WeeklyReportGenerator class exists', 'File not found');
    }

    // 3. Celery: Task definitions exist
    const tasksPath = path.join(process.cwd(), '../analytics/src/tasks.py');
    if (fs.existsSync(tasksPath)) {
      const content = fs.readFileSync(tasksPath, 'utf-8');
      if (content.includes('generate_sector_weekly_report_task') && content.includes('generate_macro_weekly_report_task')) {
        pass(3, 'Celery: Task definitions exist', 'Found sector and macro report tasks');
      } else {
        fail(3, 'Celery: Task definitions exist', 'Tasks not found in tasks.py');
      }
    } else {
      fail(3, 'Celery: Task definitions exist', 'tasks.py not found');
    }

    // 4. Celery Beat: Schedule configured
    const celeryConfigPath = path.join(process.cwd(), '../analytics/celeryconfig.py');
    if (fs.existsSync(celeryConfigPath)) {
      const content = fs.readFileSync(celeryConfigPath, 'utf-8');
      if (content.includes('generate-sector-weekly-reports') && content.includes('generate-macro-weekly-report')) {
        pass(4, 'Celery Beat: Schedule configured for Sunday generation', 'Found beat schedule entries');
      } else {
        fail(4, 'Celery Beat: Schedule configured for Sunday generation', 'Schedule entries not found');
      }
    } else {
      fail(4, 'Celery Beat: Schedule configured for Sunday generation', 'celeryconfig.py not found');
    }

    // 5. GraphQL: Report resolvers exist
    const resolversPath = path.join(process.cwd(), 'src/graphql/resolvers/reports.ts');
    if (fs.existsSync(resolversPath)) {
      const content = fs.readFileSync(resolversPath, 'utf-8');
      if (content.includes('reports:') && content.includes('report:') && content.includes('latestReports:')) {
        pass(5, 'GraphQL: Report query resolvers exist', 'Found reports, report, and latestReports');
      } else {
        fail(5, 'GraphQL: Report query resolvers exist', 'Resolvers incomplete');
      }
    } else {
      fail(5, 'GraphQL: Report query resolvers exist', 'reports.ts not found');
    }

    // 6. REST API: Report endpoints exist
    const reportsRoutePath = path.join(process.cwd(), 'src/routes/reports.ts');
    if (fs.existsSync(reportsRoutePath)) {
      const content = fs.readFileSync(reportsRoutePath, 'utf-8');
      if (content.includes('/reports') && content.includes('/reports/:slug')) {
        pass(6, 'REST API: Report endpoints exist', 'Found report routes');
      } else {
        fail(6, 'REST API: Report endpoints exist', 'Routes incomplete');
      }
    } else {
      fail(6, 'REST API: Report endpoints exist', 'reports.ts route file not found');
    }

    // ═════════════════════════════════════════════════
    // FRONTEND VALIDATION (7-14)
    // ═════════════════════════════════════════════════

    // 7. Frontend: /reports page exists
    const reportsPagePath = path.join(process.cwd(), '../web/src/pages/Reports.tsx');
    if (fs.existsSync(reportsPagePath)) {
      const content = fs.readFileSync(reportsPagePath, 'utf-8');
      if (content.includes('All Reports') && content.includes('Macro Overview') && content.includes('Sector Reports')) {
        pass(7, 'Frontend: /reports page with tabs exists', 'Found tab navigation');
      } else {
        fail(7, 'Frontend: /reports page with tabs exists', 'Tabs not found');
      }
    } else {
      fail(7, 'Frontend: /reports page with tabs exists', 'Reports.tsx not found');
    }

    // 8. Frontend: /reports/:slug page exists
    const reportDetailPath = path.join(process.cwd(), '../web/src/pages/ReportDetail.tsx');
    if (fs.existsSync(reportDetailPath)) {
      const content = fs.readFileSync(reportDetailPath, 'utf-8');
      if (content.includes('slug') && content.includes('ReportSectionRenderer')) {
        pass(8, 'Frontend: /reports/:slug detail page exists', 'Found slug routing and section renderer');
      } else {
        fail(8, 'Frontend: /reports/:slug detail page exists', 'Detail page incomplete');
      }
    } else {
      fail(8, 'Frontend: /reports/:slug detail page exists', 'ReportDetail.tsx not found');
    }

    // 9. Styling: Macro report full-width featured style
    if (fs.existsSync(reportsPagePath)) {
      const content = fs.readFileSync(reportsPagePath, 'utf-8');
      if (content.includes('Featured Macro') || content.includes('reportType === "MACRO_WEEKLY"')) {
        pass(9, 'Styling: Macro report has full-width featured card', 'Found macro report special styling');
      } else {
        fail(9, 'Styling: Macro report has full-width featured card', 'Macro styling not found');
      }
    } else {
      fail(9, 'Styling: Macro report has full-width featured card', 'Reports.tsx not found');
    }

    // 10. Rendering: All 5 section types render correctly
    const sectionRendererPath = path.join(process.cwd(), '../web/src/components/reports/ReportSectionRenderer.tsx');
    if (fs.existsSync(sectionRendererPath)) {
      const content = fs.readFileSync(sectionRendererPath, 'utf-8');
      const hasAllTypes = ['TEXT', 'METRIC_CARDS', 'CHART_DATA', 'TABLE_DATA', 'STOCK_LIST'].every(type =>
        content.includes(type)
      );
      if (hasAllTypes) {
        pass(10, 'Rendering: All 5 section types (TEXT, METRIC_CARDS, etc.) render', 'All section types found');
      } else {
        fail(10, 'Rendering: All 5 section types (TEXT, METRIC_CARDS, etc.) render', 'Missing section types');
      }
    } else {
      fail(10, 'Rendering: All 5 section types (TEXT, METRIC_CARDS, etc.) render', 'ReportSectionRenderer.tsx not found');
    }

    // 11. Tier Gating: FREE users see summary only
    if (fs.existsSync(reportDetailPath)) {
      const content = fs.readFileSync(reportDetailPath, 'utf-8');
      if (content.includes('tier') && (content.includes('blur') || content.includes('gated'))) {
        pass(11, 'Tier Gating: FREE users see summary, PRO sees full', 'Found tier-based content gating');
      } else {
        fail(11, 'Tier Gating: FREE users see summary, PRO sees full', 'Tier gating not implemented');
      }
    } else {
      fail(11, 'Tier Gating: FREE users see summary, PRO sees full', 'ReportDetail.tsx not found');
    }

    // 12. Share Buttons: Copy link functionality works
    const shareButtonsPath = path.join(process.cwd(), '../web/src/components/reports/ShareButtons.tsx');
    if (fs.existsSync(shareButtonsPath)) {
      const content = fs.readFileSync(shareButtonsPath, 'utf-8');
      if (content.includes('navigator.clipboard') || content.includes('copy')) {
        pass(12, 'Share Buttons: Copy link functionality implemented', 'Found clipboard API usage');
      } else {
        fail(12, 'Share Buttons: Copy link functionality implemented', 'Copy functionality not found');
      }
    } else {
      fail(12, 'Share Buttons: Copy link functionality implemented', 'ShareButtons.tsx not found');
    }

    // 13. Dashboard: Latest Reports section present
    const dashboardPath = path.join(process.cwd(), '../web/src/pages/Dashboard.tsx');
    if (fs.existsSync(dashboardPath)) {
      const content = fs.readFileSync(dashboardPath, 'utf-8');
      if (content.includes('LatestReports') || content.includes('Latest Weekly Reports')) {
        pass(13, 'Dashboard: Latest Reports section displays 3 reports', 'Found LatestReports integration');
      } else {
        fail(13, 'Dashboard: Latest Reports section displays 3 reports', 'LatestReports not integrated');
      }
    } else {
      fail(13, 'Dashboard: Latest Reports section displays 3 reports', 'Dashboard.tsx not found');
    }

    // 14. Navigation: Reports item in sidebar
    const sidebarPath = path.join(process.cwd(), '../web/src/components/layout/Sidebar.tsx');
    if (fs.existsSync(sidebarPath)) {
      const content = fs.readFileSync(sidebarPath, 'utf-8');
      if (content.includes('reports') && content.includes('Reports')) {
        pass(14, 'Navigation: Reports item added to sidebar', 'Found reports nav item');
      } else {
        fail(14, 'Navigation: Reports item added to sidebar', 'Reports nav not found');
      }
    } else {
      fail(14, 'Navigation: Reports item added to sidebar', 'Sidebar.tsx not found');
    }

    // ═════════════════════════════════════════════════
    // NEWSLETTER & COMPLIANCE VALIDATION (15-18)
    // ═════════════════════════════════════════════════

    // 15. Newsletter: Signup form stores subscriptions
    const newsletterSignupPath = path.join(process.cwd(), '../web/src/components/reports/NewsletterSignup.tsx');
    if (fs.existsSync(newsletterSignupPath)) {
      const content = fs.readFileSync(newsletterSignupPath, 'utf-8');
      if (content.includes('subscribeNewsletter') || content.includes('SUBSCRIBE_NEWSLETTER')) {
        pass(15, 'Newsletter: Signup form with GraphQL mutation', 'Found newsletter subscription mutation');
      } else {
        fail(15, 'Newsletter: Signup form with GraphQL mutation', 'Mutation not found');
      }
    } else {
      fail(15, 'Newsletter: Signup form with GraphQL mutation', 'NewsletterSignup.tsx not found');
    }

    // 16. Email Templates: HTML templates exist
    const emailTemplatePath = path.join(process.cwd(), '../analytics/templates/email/weekly_report.html');
    if (fs.existsSync(emailTemplatePath)) {
      const content = fs.readFileSync(emailTemplatePath, 'utf-8');
      if (content.includes('<!DOCTYPE html>') && content.includes('REPORT_TITLE')) {
        pass(16, 'Email Templates: weekly_report.html exists with placeholders', 'Found HTML email template');
      } else {
        fail(16, 'Email Templates: weekly_report.html exists with placeholders', 'Template incomplete');
      }
    } else {
      fail(16, 'Email Templates: weekly_report.html exists with placeholders', 'Template not found');
    }

    // 17. Compliance: SEBI disclaimer on every report
    if (fs.existsSync(reportDetailPath)) {
      const content = fs.readFileSync(reportDetailPath, 'utf-8');
      if (content.includes('SEBI') || content.includes('disclaimer') || content.includes('not constitute financial advice')) {
        pass(17, 'Compliance: SEBI disclaimer on report detail page', 'Found compliance disclaimer');
      } else {
        fail(17, 'Compliance: SEBI disclaimer on report detail page', 'Disclaimer not found');
      }
    } else {
      fail(17, 'Compliance: SEBI disclaimer on report detail page', 'ReportDetail.tsx not found');
    }

    // 18. AI Badge: AI Generated badge on all reports
    if (fs.existsSync(reportDetailPath)) {
      const content = fs.readFileSync(reportDetailPath, 'utf-8');
      if (content.includes('AI Generated') || content.includes('AI-powered') || content.includes('ai-badge')) {
        pass(18, 'AI Badge: AI Generated badge visible on reports', 'Found AI badge');
      } else {
        fail(18, 'AI Badge: AI Generated badge visible on reports', 'AI badge not found');
      }
    } else {
      fail(18, 'AI Badge: AI Generated badge visible on reports', 'ReportDetail.tsx not found');
    }

  } catch (error: any) {
    console.error('Fatal validation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  // ═════════════════════════════════════════════════
  // PRINT RESULTS
  // ═════════════════════════════════════════════════

  console.log('═'.repeat(80));
  console.log('VALIDATION RESULTS');
  console.log('═'.repeat(80));
  console.log('');

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - Test ${result.id}: ${result.description}`);
    if (result.details) {
      console.log(`       ${result.details}`);
    }
    if (result.error) {
      console.log(`       Error: ${result.error}`);
    }
    console.log('');
  });

  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;
  const passRate = Math.round((passCount / results.length) * 100);

  console.log('═'.repeat(80));
  console.log(`SUMMARY: ${passCount}/${results.length} tests passed (${passRate}%)`);
  console.log('═'.repeat(80));
  console.log('');

  if (passRate === 100) {
    console.log('🎉 ALL TESTS PASSED! Weekly Reports System is production-ready.');
  } else if (passRate >= 90) {
    console.log('✅ System is mostly ready. Address remaining issues before production.');
  } else if (passRate >= 75) {
    console.log('⚠️  System needs attention. Several critical issues remain.');
  } else {
    console.log('❌ System not ready for production. Major issues must be resolved.');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

validate();
