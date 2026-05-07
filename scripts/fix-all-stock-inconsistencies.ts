#!/usr/bin/env tsx
/**
 * Fix ALL Stock Data Inconsistencies
 *
 * This script validates and fixes all stock references across the frontend
 * to ensure only Nifty 50 stocks are referenced and data is consistent.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Official Nifty 50 stocks - Single Source of Truth
const NIFTY_50_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR',
  'ICICIBANK', 'KOTAKBANK', 'SBIN', 'BHARTIARTL', 'BAJFINANCE',
  'ITC', 'ASIANPAINT', 'AXISBANK', 'LT', 'MARUTI',
  'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'WIPRO',
  'HCLTECH', 'TECHM', 'POWERGRID', 'NTPC', 'ONGC',
  'TATAMOTORS', 'COALINDIA', 'BAJAJFINSV', 'M&M', 'ADANIPORTS',
  'TATASTEEL', 'INDUSINDBK', 'DIVISLAB', 'DRREDDY', 'CIPLA',
  'GRASIM', 'EICHERMOT', 'HINDALCO', 'HEROMOTOCO', 'UPL',
  'JSWSTEEL', 'BRITANNIA', 'APOLLOHOSP', 'TATACONSUM', 'SBILIFE',
  'ADANIENT', 'BAJAJ-AUTO', 'HDFCLIFE', 'BPCL', 'LTIM',
];

// Stocks to replace (non-Nifty 50)
const STOCKS_TO_REPLACE: Record<string, string> = {
  'PERSISTENT': 'TCS',
  'CLEAN': 'HDFCBANK',
  'DIXON': 'TITAN',
  'ASTRAL': 'ASIANPAINT',
  'POLYCAB': 'RELIANCE',
  'COFORGE': 'INFY',
  'LAURUSLABS': 'DIVISLAB',
  'DEEPAKNTR': 'HINDALCO',
  'DEEPAKNI': 'HINDALCO',
  'PIDILITIND': 'ASIANPAINT',
  'NAVINFLUOR': 'TATASTEEL',
  'AARTI': 'UPL',
  'BIOCON': 'APOLLOHOSP',
  'HAPPSTMNDS': 'WIPRO',
  'ROUTE': 'HCLTECH',
  'LTTS': 'LTIM',
  'MPHASIS': 'TECHM',
  'MINDTREE': 'LTIM',
};

async function fixAllInconsistencies() {
  console.log('🔧 Fixing ALL stock data inconsistencies...\n');

  const webDataDir = path.join(process.cwd(), 'apps/web/src/data');
  const files = await glob('**/*.ts', { cwd: webDataDir, absolute: true });

  let totalReplacements = 0;
  const issuesFound: string[] = [];

  for (const file of files) {
    if (file.includes('.bak')) continue;

    let content = fs.readFileSync(file, 'utf-8');
    let fileChanged = false;
    let fileReplacements = 0;

    // Replace each non-Nifty stock with its Nifty equivalent
    for (const [oldSymbol, newSymbol] of Object.entries(STOCKS_TO_REPLACE)) {
      // Pattern 1: symbol: 'OLD'
      const pattern1 = new RegExp(`symbol: '${oldSymbol}'`, 'g');
      if (pattern1.test(content)) {
        content = content.replace(pattern1, `symbol: '${newSymbol}'`);
        fileChanged = true;
        fileReplacements++;
      }

      // Pattern 2: 'OLD' as standalone string
      const pattern2 = new RegExp(`'${oldSymbol}'`, 'g');
      const matches = content.match(pattern2);
      if (matches && matches.length > 0) {
        content = content.replace(pattern2, `'${newSymbol}'`);
        fileChanged = true;
        fileReplacements += matches.length;
      }

      // Pattern 3: "OLD" with double quotes
      const pattern3 = new RegExp(`"${oldSymbol}"`, 'g');
      const matches3 = content.match(pattern3);
      if (matches3 && matches3.length > 0) {
        content = content.replace(pattern3, `"${newSymbol}"`);
        fileChanged = true;
        fileReplacements += matches3.length;
      }

      // Pattern 4: In text like "SYMBOL +2.5%"
      const pattern4 = new RegExp(`${oldSymbol} [+-]`, 'g');
      if (pattern4.test(content)) {
        content = content.replace(pattern4, `${newSymbol} ${content.match(pattern4)?.[0].slice(-2) || ''}`);
        fileChanged = true;
        fileReplacements++;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(file, content, 'utf-8');
      const fileName = path.relative(webDataDir, file);
      console.log(`✅ Fixed ${fileName} (${fileReplacements} replacements)`);
      totalReplacements += fileReplacements;
    }

    // Validate: Check for any remaining non-Nifty stocks
    const remainingIssues = Object.keys(STOCKS_TO_REPLACE).filter(symbol => {
      return content.includes(`'${symbol}'`) || content.includes(`"${symbol}"`);
    });

    if (remainingIssues.length > 0) {
      const fileName = path.relative(webDataDir, file);
      issuesFound.push(`${fileName}: ${remainingIssues.join(', ')}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Fixed ${totalReplacements} inconsistencies across ${files.length} files`);

  if (issuesFound.length > 0) {
    console.log('\n⚠️  Remaining issues that need manual review:');
    issuesFound.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n🎉 All stock references are now consistent!');
  }
  console.log('='.repeat(60));
}

fixAllInconsistencies()
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
