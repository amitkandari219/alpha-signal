/**
 * Bundle Size Analyzer
 *
 * Analyzes the production build output and prints bundle sizes
 * Run after: npm run build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FileInfo {
  name: string;
  size: number;
  path: string;
}

// Convert bytes to human-readable format
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Get all files recursively
function getAllFiles(dirPath: string, arrayOfFiles: FileInfo[] = []): FileInfo[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push({
        name: file,
        size: stat.size,
        path: filePath.replace(path.join(__dirname, '../dist/'), ''),
      });
    }
  });

  return arrayOfFiles;
}

// Main analysis
function analyzeBundle() {
  const distPath = path.join(__dirname, '../dist');

  if (!fs.existsSync(distPath)) {
    console.error('❌ Build output not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('\n📊 Bundle Size Analysis\n');
  console.log('═'.repeat(80));

  const allFiles = getAllFiles(distPath);

  // Group files by type
  const jsFiles = allFiles.filter((f) => f.name.endsWith('.js'));
  const cssFiles = allFiles.filter((f) => f.name.endsWith('.css'));
  const assetFiles = allFiles.filter(
    (f) => !f.name.endsWith('.js') && !f.name.endsWith('.css') && !f.name.endsWith('.html')
  );

  // Calculate totals
  const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
  const jsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  const cssSize = cssFiles.reduce((sum, f) => sum + f.size, 0);
  const assetSize = assetFiles.reduce((sum, f) => sum + f.size, 0);

  // Print summary
  console.log('\n📦 Total Bundle Size:');
  console.log(`   ${formatBytes(totalSize)} (${allFiles.length} files)\n`);

  console.log('📈 Breakdown:');
  console.log(`   JavaScript: ${formatBytes(jsSize)} (${jsFiles.length} files)`);
  console.log(`   CSS:        ${formatBytes(cssSize)} (${cssFiles.length} files)`);
  console.log(`   Assets:     ${formatBytes(assetSize)} (${assetFiles.length} files)\n`);

  // Print largest JavaScript files
  const largestJs = jsFiles.sort((a, b) => b.size - a.size).slice(0, 10);
  console.log('📄 Largest JavaScript Files:');
  console.log('─'.repeat(80));
  largestJs.forEach((file, index) => {
    const size = formatBytes(file.size).padEnd(12);
    console.log(`   ${(index + 1).toString().padStart(2)}. ${size} ${file.path}`);
  });

  // Print largest CSS files
  if (cssFiles.length > 0) {
    const largestCss = cssFiles.sort((a, b) => b.size - a.size).slice(0, 5);
    console.log('\n🎨 Largest CSS Files:');
    console.log('─'.repeat(80));
    largestCss.forEach((file, index) => {
      const size = formatBytes(file.size).padEnd(12);
      console.log(`   ${(index + 1).toString().padStart(2)}. ${size} ${file.path}`);
    });
  }

  // Performance warnings
  console.log('\n⚠️  Performance Warnings:');
  console.log('─'.repeat(80));
  const largeFiles = jsFiles.filter((f) => f.size > 500 * 1024); // > 500KB
  if (largeFiles.length > 0) {
    console.log(`   ${largeFiles.length} JavaScript files exceed 500KB:`);
    largeFiles.forEach((file) => {
      console.log(`   - ${formatBytes(file.size)} ${file.path}`);
    });
  } else {
    console.log('   ✓ No JavaScript files exceed 500KB');
  }

  // Check if stats.html exists
  const statsPath = path.join(distPath, 'stats.html');
  if (fs.existsSync(statsPath)) {
    console.log('\n📊 Visual Bundle Analysis:');
    console.log('─'.repeat(80));
    console.log(`   Open: dist/stats.html`);
    console.log(`   Full path: ${statsPath}`);
  }

  console.log('\n' + '═'.repeat(80) + '\n');

  // Exit code based on bundle size
  const maxBundleSize = 5 * 1024 * 1024; // 5MB
  if (totalSize > maxBundleSize) {
    console.log(`⚠️  Warning: Total bundle size (${formatBytes(totalSize)}) exceeds ${formatBytes(maxBundleSize)}\n`);
    return 1;
  }

  console.log('✅ Bundle size is within acceptable limits\n');
  return 0;
}

// Run analysis
try {
  const exitCode = analyzeBundle();
  process.exit(exitCode);
} catch (error) {
  console.error('❌ Error analyzing bundle:', error);
  process.exit(1);
}
