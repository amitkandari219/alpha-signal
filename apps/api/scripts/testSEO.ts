/**
 * Test Script for SEO Endpoints
 *
 * Tests /sitemap.xml and /robots.txt endpoints
 * Run with: npx tsx scripts/testSEO.ts
 */

import { parseStringPromise } from 'xml2js';

const API_URL = process.env.API_URL || 'http://localhost:4000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testSitemapXml(): Promise<boolean> {
  log('\n📄 Testing /sitemap.xml endpoint...', colors.cyan);

  try {
    const response = await fetch(`${API_URL}/sitemap.xml`);

    // Check status code
    if (response.status !== 200) {
      log(`❌ Failed: Expected status 200, got ${response.status}`, colors.red);
      return false;
    }
    log(`✅ Status: ${response.status}`, colors.green);

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/xml')) {
      log(`❌ Failed: Expected content-type 'application/xml', got '${contentType}'`, colors.red);
      return false;
    }
    log(`✅ Content-Type: ${contentType}`, colors.green);

    // Get response text
    const xmlContent = await response.text();

    // Check if response is not empty
    if (!xmlContent || xmlContent.trim().length === 0) {
      log('❌ Failed: Empty response', colors.red);
      return false;
    }
    log(`✅ Content length: ${xmlContent.length} bytes`, colors.green);

    // Validate XML structure
    try {
      const parsed = await parseStringPromise(xmlContent);

      if (!parsed.urlset) {
        log('❌ Failed: Missing <urlset> root element', colors.red);
        return false;
      }

      if (!parsed.urlset.url || !Array.isArray(parsed.urlset.url)) {
        log('❌ Failed: No <url> entries found', colors.red);
        return false;
      }

      const urlCount = parsed.urlset.url.length;
      log(`✅ Valid XML structure with ${urlCount} URLs`, colors.green);

      // Validate some URL entries
      const urls = parsed.urlset.url;
      let validUrls = 0;
      let hasHomepage = false;
      let hasPricing = false;
      let hasScreener = false;
      let hasStockPage = false;

      for (const url of urls) {
        if (!url.loc || !url.priority || !url.changefreq) {
          log(`⚠️  Warning: URL entry missing required fields`, colors.yellow);
          continue;
        }

        const loc = url.loc[0];

        if (loc.includes('/pricing')) hasPricing = true;
        if (loc.includes('/screener')) hasScreener = true;
        if (loc.includes('/stock/')) hasStockPage = true;
        if (loc.endsWith('/') || !loc.includes('/', 8)) hasHomepage = true;

        validUrls++;
      }

      log(`✅ ${validUrls}/${urlCount} URLs have valid structure`, colors.green);

      // Check for key pages
      if (hasHomepage) log('✅ Homepage found in sitemap', colors.green);
      else log('⚠️  Warning: Homepage not found in sitemap', colors.yellow);

      if (hasPricing) log('✅ Pricing page found in sitemap', colors.green);
      else log('⚠️  Warning: Pricing page not found in sitemap', colors.yellow);

      if (hasScreener) log('✅ Screener page found in sitemap', colors.green);
      else log('⚠️  Warning: Screener page not found in sitemap', colors.yellow);

      if (hasStockPage) log('✅ Stock pages found in sitemap', colors.green);
      else log('⚠️  Warning: No stock pages found in sitemap', colors.yellow);

      // Sample output
      log('\n📋 Sample URLs from sitemap:', colors.blue);
      urls.slice(0, 5).forEach((url: any) => {
        const loc = url.loc[0];
        const priority = url.priority[0];
        const changefreq = url.changefreq[0];
        console.log(`  ${loc} (priority: ${priority}, changefreq: ${changefreq})`);
      });

      return true;
    } catch (xmlError) {
      log(`❌ Failed: Invalid XML - ${xmlError}`, colors.red);
      log('\nFirst 500 characters of response:', colors.yellow);
      console.log(xmlContent.substring(0, 500));
      return false;
    }
  } catch (error) {
    log(`❌ Failed: ${error}`, colors.red);
    return false;
  }
}

async function testRobotsTxt(): Promise<boolean> {
  log('\n🤖 Testing /robots.txt endpoint...', colors.cyan);

  try {
    const response = await fetch(`${API_URL}/robots.txt`);

    // Check status code
    if (response.status !== 200) {
      log(`❌ Failed: Expected status 200, got ${response.status}`, colors.red);
      return false;
    }
    log(`✅ Status: ${response.status}`, colors.green);

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('text/plain')) {
      log(`❌ Failed: Expected content-type 'text/plain', got '${contentType}'`, colors.red);
      return false;
    }
    log(`✅ Content-Type: ${contentType}`, colors.green);

    // Get response text
    const robotsContent = await response.text();

    // Check if response is not empty
    if (!robotsContent || robotsContent.trim().length === 0) {
      log('❌ Failed: Empty response', colors.red);
      return false;
    }
    log(`✅ Content length: ${robotsContent.length} bytes`, colors.green);

    // Validate robots.txt structure
    const hasUserAgent = robotsContent.includes('User-agent:');
    const hasAllow = robotsContent.includes('Allow:');
    const hasDisallow = robotsContent.includes('Disallow:');
    const hasSitemap = robotsContent.includes('Sitemap:');

    if (!hasUserAgent) {
      log('❌ Failed: Missing User-agent directive', colors.red);
      return false;
    }
    log('✅ Has User-agent directive', colors.green);

    if (!hasAllow && !hasDisallow) {
      log('⚠️  Warning: No Allow or Disallow directives found', colors.yellow);
    } else {
      if (hasAllow) log('✅ Has Allow directives', colors.green);
      if (hasDisallow) log('✅ Has Disallow directives', colors.green);
    }

    if (!hasSitemap) {
      log('⚠️  Warning: No Sitemap directive found', colors.yellow);
    } else {
      log('✅ Has Sitemap directive', colors.green);
    }

    // Check for expected allowed paths
    const allowedPaths = ['/pricing', '/screener', '/stock/', '/sectors/'];
    const disallowedPaths = ['/dashboard', '/api/', '/graphql'];

    log('\n🔍 Checking specific paths:', colors.blue);
    for (const path of allowedPaths) {
      if (robotsContent.includes(`Allow: ${path}`)) {
        log(`  ✅ ${path} is allowed`, colors.green);
      } else {
        log(`  ⚠️  ${path} not explicitly allowed`, colors.yellow);
      }
    }

    for (const path of disallowedPaths) {
      if (robotsContent.includes(`Disallow: ${path}`)) {
        log(`  ✅ ${path} is disallowed`, colors.green);
      } else {
        log(`  ⚠️  ${path} not explicitly disallowed`, colors.yellow);
      }
    }

    // Display content
    log('\n📋 robots.txt content:', colors.blue);
    console.log(robotsContent);

    return true;
  } catch (error) {
    log(`❌ Failed: ${error}`, colors.red);
    return false;
  }
}

async function main() {
  log('════════════════════════════════════════', colors.cyan);
  log('   SEO Endpoints Test Suite', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);
  log(`API URL: ${API_URL}\n`, colors.blue);

  const results = {
    sitemap: false,
    robots: false,
  };

  // Test sitemap.xml
  results.sitemap = await testSitemapXml();

  // Test robots.txt
  results.robots = await testRobotsTxt();

  // Summary
  log('\n════════════════════════════════════════', colors.cyan);
  log('   Test Results Summary', colors.cyan);
  log('════════════════════════════════════════', colors.cyan);

  const sitemapStatus = results.sitemap ? '✅ PASSED' : '❌ FAILED';
  const robotsStatus = results.robots ? '✅ PASSED' : '❌ FAILED';

  log(`Sitemap Test: ${sitemapStatus}`, results.sitemap ? colors.green : colors.red);
  log(`Robots Test: ${robotsStatus}`, results.robots ? colors.green : colors.red);

  const allPassed = results.sitemap && results.robots;

  if (allPassed) {
    log('\n🎉 All tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Please check the output above.', colors.red);
    process.exit(1);
  }
}

// Run tests
main().catch((error) => {
  log(`\n❌ Unexpected error: ${error}`, colors.red);
  process.exit(1);
});
