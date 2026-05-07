#!/usr/bin/env node

/**
 * Design System Validation Test
 * Tests the implementation against the original requirements
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

let totalTests = 0;
let passedTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${COLORS.green}✓${COLORS.reset} ${name}`);
    if (details) console.log(`  ${COLORS.blue}→${COLORS.reset} ${details}`);
  } else {
    console.log(`${COLORS.red}✗${COLORS.reset} ${name}`);
    if (details) console.log(`  ${COLORS.red}→${COLORS.reset} ${details}`);
  }
}

function section(title) {
  console.log(`\n${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}`);
  console.log(`${COLORS.blue}${title}${COLORS.reset}`);
  console.log(`${COLORS.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

console.log(`\n${COLORS.blue}╔════════════════════════════════════════════════╗${COLORS.reset}`);
console.log(`${COLORS.blue}║   Alpha Signal Design System Validation Test  ║${COLORS.reset}`);
console.log(`${COLORS.blue}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);

// Read files
const tailwindConfig = fs.readFileSync('apps/web/tailwind.config.js', 'utf8');
const globalsCSS = fs.readFileSync('apps/web/src/styles/globals.css', 'utf8');
const designDoc = fs.readFileSync('apps/web/DESIGN_SYSTEM.md', 'utf8');
const demoComponent = fs.readFileSync('apps/web/src/components/DesignSystemDemo.tsx', 'utf8');
const indexHTML = fs.readFileSync('apps/web/index.html', 'utf8');

// 1. COLOR PALETTE VALIDATION
section('1. COLOR PALETTE');

test('Background Primary (#0D1117)',
  tailwindConfig.includes('#0D1117'),
  'Main app background color'
);
test('Background Secondary (#161B22)',
  tailwindConfig.includes('#161B22'),
  'Card and panel background'
);
test('Background Tertiary (#21262D)',
  tailwindConfig.includes('#21262D'),
  'Elevated surfaces'
);
test('Border Default (#30363D)',
  tailwindConfig.includes('#30363D'),
  'Card borders and dividers'
);
test('Text Primary (#E6EDF3)',
  tailwindConfig.includes('#E6EDF3'),
  'Headlines and primary content'
);
test('Text Secondary (#8B949E)',
  tailwindConfig.includes('#8B949E'),
  'Labels and captions'
);
test('Text Muted (#484F58)',
  tailwindConfig.includes('#484F58'),
  'Disabled and placeholders'
);
test('Accent Blue (#58A6FF)',
  tailwindConfig.includes('#58A6FF'),
  'Links and interactive elements'
);
test('Signal Green (#3FB950)',
  tailwindConfig.includes('#3FB950'),
  'Positive metrics, bullish'
);
test('Signal Red (#F85149)',
  tailwindConfig.includes('#F85149'),
  'Negative metrics, bearish'
);
test('Signal Yellow (#D29922)',
  tailwindConfig.includes('#D29922'),
  'Warnings and neutral states'
);
test('Signal Purple (#A371F7)',
  tailwindConfig.includes('#A371F7'),
  'AI-generated content indicator'
);
test('Chart Up (#26A69A)',
  tailwindConfig.includes('#26A69A'),
  'Candlestick up candles'
);
test('Chart Down (#EF5350)',
  tailwindConfig.includes('#EF5350'),
  'Candlestick down candles'
);

// 2. TYPOGRAPHY
section('2. TYPOGRAPHY');

test('Plus Jakarta Sans Font Family',
  tailwindConfig.includes('Plus Jakarta Sans') && indexHTML.includes('Plus+Jakarta+Sans'),
  'Headings and body text font'
);
test('JetBrains Mono Font Family',
  tailwindConfig.includes('JetBrains Mono') && indexHTML.includes('JetBrains+Mono'),
  'Data and numbers font'
);
test('Font weights configured',
  indexHTML.includes('wght@300;400;500;600;700;800') && indexHTML.includes('wght@400;500;600;700'),
  'All required font weights loaded'
);
test('font-heading utility',
  tailwindConfig.includes('heading:') && tailwindConfig.includes('Plus Jakarta Sans'),
  'Heading font utility class'
);
test('font-data utility',
  tailwindConfig.includes('data:') && tailwindConfig.includes('JetBrains Mono'),
  'Data font utility class'
);
test('text-data-xs (11px)',
  tailwindConfig.includes("'data-xs'") && tailwindConfig.includes('0.6875rem'),
  'Extra small data text size'
);
test('text-data-sm (12px)',
  tailwindConfig.includes("'data-sm'") && tailwindConfig.includes('0.75rem'),
  'Small data text size'
);
test('text-data-base (14px)',
  tailwindConfig.includes("'data-base'") && tailwindConfig.includes('0.875rem'),
  'Base data text size'
);
test('text-data-lg (16px)',
  tailwindConfig.includes("'data-lg'") && tailwindConfig.includes('1rem'),
  'Large data text size'
);
test('text-data-xl (18px)',
  tailwindConfig.includes("'data-xl'") && tailwindConfig.includes('1.125rem'),
  'Extra large data text size'
);

// 3. UTILITY CLASSES
section('3. UTILITY CLASSES');

test('data-card class',
  globalsCSS.includes('.data-card') && globalsCSS.includes('bg-bg-secondary'),
  'Basic data card component'
);
test('data-card-elevated class',
  globalsCSS.includes('.data-card-elevated') && globalsCSS.includes('bg-bg-tertiary'),
  'Elevated data card with higher prominence'
);
test('metric-positive class',
  globalsCSS.includes('.metric-positive') && globalsCSS.includes('text-signal-green'),
  'Positive metric styling (green)'
);
test('metric-negative class',
  globalsCSS.includes('.metric-negative') && globalsCSS.includes('text-signal-red'),
  'Negative metric styling (red)'
);
test('metric-neutral class',
  globalsCSS.includes('.metric-neutral') && globalsCSS.includes('text-signal-yellow'),
  'Neutral metric styling (yellow)'
);
test('score-badge-high class',
  globalsCSS.includes('.score-badge-high') && globalsCSS.includes('signal-green'),
  'High score badge (A+, A)'
);
test('score-badge-medium class',
  globalsCSS.includes('.score-badge-medium') && globalsCSS.includes('signal-yellow'),
  'Medium score badge (B, C)'
);
test('score-badge-low class',
  globalsCSS.includes('.score-badge-low') && globalsCSS.includes('signal-red'),
  'Low score badge (D, F)'
);
test('ai-badge class',
  globalsCSS.includes('.ai-badge') && globalsCSS.includes('signal-purple'),
  'AI-generated content badge'
);
test('terminal-panel class',
  globalsCSS.includes('.terminal-panel') && globalsCSS.includes('bg-bg-secondary'),
  'Terminal-inspired panel'
);
test('terminal-header class',
  globalsCSS.includes('.terminal-header'),
  'Terminal panel header with dots'
);
test('terminal-dot class',
  globalsCSS.includes('.terminal-dot'),
  'Terminal traffic light indicators'
);
test('data-table class',
  globalsCSS.includes('.data-table'),
  'Data table styling'
);
test('btn-primary class',
  globalsCSS.includes('.btn-primary') && globalsCSS.includes('accent-blue'),
  'Primary button component'
);
test('btn-secondary class',
  globalsCSS.includes('.btn-secondary'),
  'Secondary button component'
);
test('btn-ghost class',
  globalsCSS.includes('.btn-ghost'),
  'Ghost button component'
);
test('card-header class',
  globalsCSS.includes('.card-header'),
  'Card header layout'
);
test('card-title class',
  globalsCSS.includes('.card-title'),
  'Card title styling'
);
test('stats-grid class',
  globalsCSS.includes('.stats-grid'),
  'Statistics grid layout'
);
test('text-gradient class',
  globalsCSS.includes('.text-gradient'),
  'Gradient text effect'
);

// 4. COMPONENT SHOWCASE
section('4. COMPONENT SHOWCASE');

test('DesignSystemDemo component exists',
  demoComponent.length > 0,
  'Main demo component file'
);
test('Color palette showcase',
  demoComponent.includes('Color Palette') && demoComponent.includes('bg-signal-green'),
  'Visual color palette demonstration'
);
test('Typography showcase',
  demoComponent.includes('Typography') && demoComponent.includes('font-data'),
  'Font family examples'
);
test('Stock card examples',
  demoComponent.includes('RELIANCE') && demoComponent.includes('TCS'),
  'Real stock card examples'
);
test('Metric display examples',
  demoComponent.includes('metric-positive') && demoComponent.includes('metric-negative'),
  'Positive and negative metrics'
);
test('Score badges showcase',
  demoComponent.includes('score-badge-high') && demoComponent.includes('score-badge-medium'),
  'All score badge variants'
);
test('AI badge example',
  demoComponent.includes('ai-badge') && demoComponent.includes('AI'),
  'AI-generated content indicator'
);
test('Terminal panel showcase',
  demoComponent.includes('terminal-panel') && demoComponent.includes('terminal-dot'),
  'Terminal-inspired panel with traffic lights'
);
test('Data table example',
  demoComponent.includes('data-table') && demoComponent.includes('Top Movers'),
  'Financial data table'
);
test('Button variants',
  demoComponent.includes('btn-primary') && demoComponent.includes('btn-secondary'),
  'All button styles'
);
test('Stats grid showcase',
  demoComponent.includes('stats-grid') && demoComponent.includes('Market Cap'),
  'Statistics grid layout'
);

// 5. DOCUMENTATION
section('5. DOCUMENTATION');

test('DESIGN_SYSTEM.md exists',
  designDoc.length > 0,
  'Design system documentation file'
);
test('Design philosophy documented',
  designDoc.includes('Design Philosophy') && designDoc.includes('Dark-mode first'),
  'Core design principles'
);
test('Color palette documented',
  designDoc.includes('Colors') && designDoc.includes('#0D1117'),
  'Complete color reference'
);
test('Typography guidelines',
  designDoc.includes('Typography') && designDoc.includes('JetBrains Mono'),
  'Font usage instructions'
);
test('Component classes documented',
  designDoc.includes('Component Classes') && designDoc.includes('data-card'),
  'Utility class reference'
);
test('Usage examples provided',
  designDoc.includes('Usage') && designDoc.includes('tsx'),
  'Code examples for components'
);
test('Accessibility guidelines',
  designDoc.includes('Accessibility') && designDoc.includes('WCAG'),
  'A11y standards and requirements'
);
test('Responsive design notes',
  designDoc.includes('Responsive') && designDoc.includes('mobile-first'),
  'Mobile-first responsive approach'
);

// 6. CONFIGURATION
section('6. CONFIGURATION');

test('Dark mode enabled by default',
  indexHTML.includes('class="dark"'),
  'Body has dark class'
);
test('Fonts preconnected',
  indexHTML.includes('preconnect') && indexHTML.includes('fonts.googleapis.com'),
  'Font loading optimization'
);
test('Tailwind CSS configured',
  tailwindConfig.includes('darkMode:') && tailwindConfig.includes("'class'"),
  'Dark mode class strategy'
);
test('Custom border radius',
  tailwindConfig.includes("'card':") && tailwindConfig.includes("'panel':"),
  'Custom border radius tokens'
);
test('Shadow utilities',
  tailwindConfig.includes('shadow-card') || globalsCSS.includes('shadow'),
  'Card shadow utilities'
);

// RESULTS SUMMARY
section('TEST RESULTS SUMMARY');

const percentage = ((passedTests / totalTests) * 100).toFixed(1);
const color = percentage >= 95 ? COLORS.green : percentage >= 80 ? COLORS.yellow : COLORS.red;

console.log(`${color}Passed: ${passedTests}/${totalTests} tests (${percentage}%)${COLORS.reset}\n`);

if (passedTests === totalTests) {
  console.log(`${COLORS.green}╔════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.green}║  ✓ ALL TESTS PASSED - DESIGN SYSTEM COMPLETE  ║${COLORS.reset}`);
  console.log(`${COLORS.green}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(0);
} else {
  console.log(`${COLORS.yellow}╔════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.yellow}║  ⚠ SOME TESTS FAILED - REVIEW IMPLEMENTATION  ║${COLORS.reset}`);
  console.log(`${COLORS.yellow}╚════════════════════════════════════════════════╝${COLORS.reset}\n`);
  process.exit(1);
}
