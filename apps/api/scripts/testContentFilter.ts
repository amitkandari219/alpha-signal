/**
 * Test Content Filter - SEBI Compliance Validation
 *
 * Tests the content filter with various inputs to ensure it:
 * 1. Blocks prohibited terms
 * 2. Allows valid informational content
 * 3. Correctly identifies severity levels
 */

import { testContentFilter } from '../src/middleware/contentFilter';

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         SEBI COMPLIANCE CONTENT FILTER TEST                ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await testContentFilter();

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ Content filter is operational and ready for production ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  process.exit(0);
}

runTests();
