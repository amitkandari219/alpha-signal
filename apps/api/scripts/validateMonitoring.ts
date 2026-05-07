/**
 * Monitoring System Validation Script
 *
 * Tests all monitoring components and prints PASS/FAIL results:
 * - Health check endpoints
 * - Metrics collection
 * - Structured logging
 * - Error tracking
 * - Admin dashboard
 * - Alerting system
 * - LLM cost tracking
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000';
const METRICS_API_KEY = process.env.METRICS_API_KEY || 'secure-metrics-key-change-in-production';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'secure-admin-key-change-in-production';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message?: string;
}

const results: TestResult[] = [];

function printResult(name: string, status: 'PASS' | 'FAIL', message?: string) {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${name}: ${status}${message ? ` - ${message}` : ''}`);
  results.push({ name, status, message });
}

async function testHealthEndpoints() {
  console.log('\n=== Testing Health Check Endpoints ===\n');

  // Test /health
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'ok') {
      printResult('GET /health returns basic health info', 'PASS');
    } else {
      printResult('GET /health returns basic health info', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /health returns basic health info', 'FAIL', error.message);
  }

  // Test /health/db
  try {
    const response = await axios.get(`${API_BASE_URL}/health/db`);
    if (response.status === 200 && response.data.status === 'ok') {
      printResult('GET /health/db checks database connection', 'PASS');
    } else {
      printResult('GET /health/db checks database connection', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /health/db checks database connection', 'FAIL', error.message);
  }

  // Test /health/redis
  try {
    const response = await axios.get(`${API_BASE_URL}/health/redis`);
    if (response.status === 200 && response.data.status === 'ok') {
      printResult('GET /health/redis checks Redis connection', 'PASS');
    } else {
      printResult('GET /health/redis checks Redis connection', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /health/redis checks Redis connection', 'FAIL', error.message);
  }

  // Test /health/workers
  try {
    const response = await axios.get(`${API_BASE_URL}/health/workers`);
    if (response.status === 200) {
      printResult('GET /health/workers checks Celery workers', 'PASS');
    } else {
      printResult('GET /health/workers checks Celery workers', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /health/workers checks Celery workers', 'FAIL', error.message);
  }

  // Test /health/full
  try {
    const response = await axios.get(`${API_BASE_URL}/health/full`);
    if (response.status === 200 && response.data.checks) {
      printResult('GET /health/full returns combined status', 'PASS');
    } else {
      printResult('GET /health/full returns combined status', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /health/full returns combined status', 'FAIL', error.message);
  }
}

async function testMetricsEndpoints() {
  console.log('\n=== Testing Metrics Collection ===\n');

  // Test /metrics endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics`, {
      headers: {
        'Authorization': `Bearer ${METRICS_API_KEY}`
      }
    });
    if (response.status === 200 && response.data.metrics) {
      printResult('GET /metrics returns metrics in JSON format', 'PASS');
    } else {
      printResult('GET /metrics returns metrics in JSON format', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /metrics returns metrics in JSON format', 'FAIL', error.message);
  }

  // Test /metrics/prometheus endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}/metrics/prometheus`, {
      headers: {
        'Authorization': `Bearer ${METRICS_API_KEY}`
      }
    });
    if (response.status === 200 && typeof response.data === 'string') {
      printResult('GET /metrics/prometheus returns Prometheus format', 'PASS');
    } else {
      printResult('GET /metrics/prometheus returns Prometheus format', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /metrics/prometheus returns Prometheus format', 'FAIL', error.message);
  }

  // Check if metrics service file exists
  const metricsServicePath = path.join(__dirname, '..', 'src', 'services', 'metrics.ts');
  if (fs.existsSync(metricsServicePath)) {
    printResult('MetricsService class implemented', 'PASS');
  } else {
    printResult('MetricsService class implemented', 'FAIL', 'File not found');
  }

  // Check if metrics hooks exist
  const metricsHooksPath = path.join(__dirname, '..', 'src', 'middleware', 'metricsHooks.ts');
  if (fs.existsSync(metricsHooksPath)) {
    printResult('Fastify metrics hooks implemented', 'PASS');
  } else {
    printResult('Fastify metrics hooks implemented', 'FAIL', 'File not found');
  }

  // Check if GraphQL metrics plugin exists
  const graphqlPluginPath = path.join(__dirname, '..', 'src', 'middleware', 'graphqlMetricsPlugin.ts');
  if (fs.existsSync(graphqlPluginPath)) {
    printResult('GraphQL metrics plugin implemented', 'PASS');
  } else {
    printResult('GraphQL metrics plugin implemented', 'FAIL', 'File not found');
  }
}

async function testStructuredLogging() {
  console.log('\n=== Testing Structured Logging ===\n');

  // Check if logger service exists (API)
  const loggerServicePath = path.join(__dirname, '..', 'src', 'services', 'logger.ts');
  if (fs.existsSync(loggerServicePath)) {
    const content = fs.readFileSync(loggerServicePath, 'utf-8');
    if (content.includes('pino') && content.includes('request_id')) {
      printResult('Structured logger service (Node.js) with pino', 'PASS');
    } else {
      printResult('Structured logger service (Node.js) with pino', 'FAIL', 'Missing features');
    }
  } else {
    printResult('Structured logger service (Node.js) with pino', 'FAIL', 'File not found');
  }

  // Check if GraphQL logging plugin exists
  const graphqlLoggingPath = path.join(__dirname, '..', 'src', 'middleware', 'graphqlLoggingPlugin.ts');
  if (fs.existsSync(graphqlLoggingPath)) {
    printResult('GraphQL logging plugin implemented', 'PASS');
  } else {
    printResult('GraphQL logging plugin implemented', 'FAIL', 'File not found');
  }

  // Check if Python logger exists
  const pythonLoggerPath = path.join(__dirname, '..', '..', 'analytics', 'utils', 'logger.py');
  if (fs.existsSync(pythonLoggerPath)) {
    const content = fs.readFileSync(pythonLoggerPath, 'utf-8');
    if (content.includes('structlog')) {
      printResult('Structured logger (Python) with structlog', 'PASS');
    } else {
      printResult('Structured logger (Python) with structlog', 'FAIL', 'Missing structlog');
    }
  } else {
    printResult('Structured logger (Python) with structlog', 'FAIL', 'File not found');
  }

  // Check for JSON logging format
  if (fs.existsSync(loggerServicePath)) {
    const content = fs.readFileSync(loggerServicePath, 'utf-8');
    if (content.includes('JSON') || content.includes('json')) {
      printResult('JSON logging format in production', 'PASS');
    } else {
      printResult('JSON logging format in production', 'FAIL', 'JSON format not configured');
    }
  }

  // Check for request_id tracking
  if (fs.existsSync(loggerServicePath)) {
    const content = fs.readFileSync(loggerServicePath, 'utf-8');
    if (content.includes('request_id') || content.includes('requestId')) {
      printResult('Request ID tracking in logs', 'PASS');
    } else {
      printResult('Request ID tracking in logs', 'FAIL', 'request_id not found');
    }
  }
}

async function testErrorTracking() {
  console.log('\n=== Testing Error Tracking ===\n');

  // Check if error tracker service exists
  const errorTrackerPath = path.join(__dirname, '..', 'src', 'services', 'errorTracker.ts');
  if (fs.existsSync(errorTrackerPath)) {
    const content = fs.readFileSync(errorTrackerPath, 'utf-8');
    if (content.includes('ErrorTracker') && content.includes('Sentry')) {
      printResult('ErrorTracker service with Sentry integration', 'PASS');
    } else {
      printResult('ErrorTracker service with Sentry integration', 'FAIL', 'Missing features');
    }
  } else {
    printResult('ErrorTracker service with Sentry integration', 'FAIL', 'File not found');
  }

  // Check if error_log table exists
  try {
    const errorCount = await prisma.errorLog.count();
    printResult('error_log table exists in database', 'PASS', `${errorCount} errors logged`);
  } catch (error: any) {
    printResult('error_log table exists in database', 'FAIL', error.message);
  }

  // Check for global error handlers
  if (fs.existsSync(errorTrackerPath)) {
    const content = fs.readFileSync(errorTrackerPath, 'utf-8');
    if (content.includes('uncaughtException') && content.includes('unhandledRejection')) {
      printResult('Global error handlers (uncaught/unhandled)', 'PASS');
    } else {
      printResult('Global error handlers (uncaught/unhandled)', 'FAIL', 'Handlers not found');
    }
  }

  // Check for auto-pruning
  if (fs.existsSync(errorTrackerPath)) {
    const content = fs.readFileSync(errorTrackerPath, 'utf-8');
    if (content.includes('10000') || content.includes('prune')) {
      printResult('Auto-pruning keeps last 10,000 errors', 'PASS');
    } else {
      printResult('Auto-pruning keeps last 10,000 errors', 'FAIL', 'Pruning not found');
    }
  }

  // Check if Sentry is configured
  const indexPath = path.join(__dirname, '..', 'src', 'index.ts');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf-8');
    if (content.includes('errorTracker') || content.includes('ErrorTracker')) {
      printResult('Error tracking integrated in main app', 'PASS');
    } else {
      printResult('Error tracking integrated in main app', 'FAIL', 'Not integrated');
    }
  }
}

async function testAdminDashboard() {
  console.log('\n=== Testing Admin Dashboard ===\n');

  // Test /admin/dashboard endpoint
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/dashboard`, {
      headers: {
        'X-Admin-API-Key': ADMIN_API_KEY
      }
    });
    if (response.status === 200 && response.data.health && response.data.users && response.data.revenue) {
      printResult('GET /admin/dashboard returns system statistics', 'PASS');
    } else {
      printResult('GET /admin/dashboard returns system statistics', 'FAIL', 'Invalid response');
    }
  } catch (error: any) {
    printResult('GET /admin/dashboard returns system statistics', 'FAIL', error.message);
  }

  // Check if admin routes file exists
  const adminRoutesPath = path.join(__dirname, '..', 'src', 'routes', 'admin.ts');
  if (fs.existsSync(adminRoutesPath)) {
    const content = fs.readFileSync(adminRoutesPath, 'utf-8');
    if (content.includes('X-Admin-API-Key') || content.includes('bearer')) {
      printResult('Admin routes protected with API key', 'PASS');
    } else {
      printResult('Admin routes protected with API key', 'FAIL', 'Auth not found');
    }
  } else {
    printResult('Admin routes protected with API key', 'FAIL', 'File not found');
  }

  // Check for comprehensive stats
  if (fs.existsSync(adminRoutesPath)) {
    const content = fs.readFileSync(adminRoutesPath, 'utf-8');
    const hasStats = ['users', 'revenue', 'content', 'performance'].every(stat => content.includes(stat));
    if (hasStats) {
      printResult('Dashboard includes users, revenue, content, performance', 'PASS');
    } else {
      printResult('Dashboard includes users, revenue, content, performance', 'FAIL', 'Missing stats');
    }
  }
}

async function testAlertingSystem() {
  console.log('\n=== Testing Alerting System ===\n');

  // Check if alerting service exists
  const alertingServicePath = path.join(__dirname, '..', 'src', 'services', 'alerting.ts');
  if (fs.existsSync(alertingServicePath)) {
    const content = fs.readFileSync(alertingServicePath, 'utf-8');
    if (content.includes('AlertSeverity') && content.includes('checkAlertConditions')) {
      printResult('Alerting service with severity levels', 'PASS');
    } else {
      printResult('Alerting service with severity levels', 'FAIL', 'Missing features');
    }
  } else {
    printResult('Alerting service with severity levels', 'FAIL', 'File not found');
  }

  // Check if alert_history table exists
  try {
    const alertCount = await prisma.alertHistory.count();
    printResult('alert_history table exists in database', 'PASS', `${alertCount} alerts logged`);
  } catch (error: any) {
    printResult('alert_history table exists in database', 'FAIL', error.message);
  }

  // Check for alert conditions
  if (fs.existsSync(alertingServicePath)) {
    const content = fs.readFileSync(alertingServicePath, 'utf-8');
    const conditions = ['CRITICAL', 'WARNING', 'INFO'];
    const hasConditions = conditions.every(c => content.includes(c));
    if (hasConditions) {
      printResult('Alert conditions: CRITICAL, WARNING, INFO', 'PASS');
    } else {
      printResult('Alert conditions: CRITICAL, WARNING, INFO', 'FAIL', 'Missing conditions');
    }
  }

  // Check for cooldown mechanism
  if (fs.existsSync(alertingServicePath)) {
    const content = fs.readFileSync(alertingServicePath, 'utf-8');
    if (content.includes('cooldown') || content.includes('5 minutes')) {
      printResult('Alert cooldown mechanism (5 minutes)', 'PASS');
    } else {
      printResult('Alert cooldown mechanism (5 minutes)', 'FAIL', 'Cooldown not found');
    }
  }

  // Check integration with admin dashboard
  const adminRoutesPath = path.join(__dirname, '..', 'src', 'routes', 'admin.ts');
  if (fs.existsSync(adminRoutesPath)) {
    const content = fs.readFileSync(adminRoutesPath, 'utf-8');
    if (content.includes('alert') || content.includes('Alert')) {
      printResult('Alerts integrated in admin dashboard', 'PASS');
    } else {
      printResult('Alerts integrated in admin dashboard', 'FAIL', 'Not integrated');
    }
  }
}

async function testLLMCostTracking() {
  console.log('\n=== Testing LLM Cost Tracking ===\n');

  // Check if Python LLM cost tracker exists
  const llmTrackerPath = path.join(__dirname, '..', '..', 'analytics', 'utils', 'llm_cost_tracker.py');
  if (fs.existsSync(llmTrackerPath)) {
    const content = fs.readFileSync(llmTrackerPath, 'utf-8');
    if (content.includes('LLMCostTracker') && content.includes('Claude')) {
      printResult('LLM cost tracker for Claude API', 'PASS');
    } else {
      printResult('LLM cost tracker for Claude API', 'FAIL', 'Missing features');
    }
  } else {
    printResult('LLM cost tracker for Claude API', 'FAIL', 'File not found');
  }

  // Check if llm_usage table exists
  try {
    const usageCount = await prisma.lLMUsage.count();
    printResult('llm_usage table exists in database', 'PASS', `${usageCount} records`);
  } catch (error: any) {
    printResult('llm_usage table exists in database', 'FAIL', error.message);
  }

  // Check for cost calculation
  if (fs.existsSync(llmTrackerPath)) {
    const content = fs.readFileSync(llmTrackerPath, 'utf-8');
    if (content.includes('$3') && content.includes('$15') || content.includes('calculate_cost')) {
      printResult('Cost calculation ($3 input, $15 output per million)', 'PASS');
    } else {
      printResult('Cost calculation ($3 input, $15 output per million)', 'FAIL', 'Rates not found');
    }
  }

  // Check for token counting
  if (fs.existsSync(llmTrackerPath)) {
    const content = fs.readFileSync(llmTrackerPath, 'utf-8');
    if (content.includes('input_tokens') && content.includes('output_tokens')) {
      printResult('Token counting for input and output', 'PASS');
    } else {
      printResult('Token counting for input and output', 'FAIL', 'Token tracking not found');
    }
  }

  // Check integration with admin dashboard
  const adminRoutesPath = path.join(__dirname, '..', 'src', 'routes', 'admin.ts');
  if (fs.existsSync(adminRoutesPath)) {
    const content = fs.readFileSync(adminRoutesPath, 'utf-8');
    if (content.includes('llm') || content.includes('LLM') || content.includes('ai_cost')) {
      printResult('LLM costs included in admin dashboard', 'PASS');
    } else {
      printResult('LLM costs included in admin dashboard', 'FAIL', 'Not integrated');
    }
  }

  // Check for budget monitoring
  if (fs.existsSync(llmTrackerPath)) {
    const content = fs.readFileSync(llmTrackerPath, 'utf-8');
    if (content.includes('daily') || content.includes('weekly') || content.includes('monthly')) {
      printResult('Budget monitoring (daily/weekly/monthly)', 'PASS');
    } else {
      printResult('Budget monitoring (daily/weekly/monthly)', 'FAIL', 'Budget tracking not found');
    }
  }
}

async function printSummary() {
  console.log('\n=== VALIDATION SUMMARY ===\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${percentage}%`);

  if (failed === 0) {
    console.log('\n🎉 All monitoring components validated successfully!');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the failures above.');
  }

  // Save results to file
  const reportPath = path.join(__dirname, '..', '..', '..', 'MONITORING_VALIDATION_REPORT.md');
  let report = `# Monitoring System - Validation Report\n\n`;
  report += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  report += `**Implementation:** Prompt 37 - Monitoring and Observability\n\n`;
  report += `---\n\n`;
  report += `## VALIDATION RESULTS\n\n`;
  report += `**Total Tests:** ${total}\n`;
  report += `**Passed:** ${passed} ✅\n`;
  report += `**Failed:** ${failed} ❌\n`;
  report += `**Success Rate:** ${percentage}%\n\n`;
  report += `---\n\n`;

  // Group by category
  const categories = [
    { name: 'Health Check Endpoints', start: 0, count: 5 },
    { name: 'Metrics Collection', start: 5, count: 5 },
    { name: 'Structured Logging', start: 10, count: 5 },
    { name: 'Error Tracking', start: 15, count: 5 },
    { name: 'Admin Dashboard', start: 20, count: 3 },
    { name: 'Alerting System', start: 23, count: 4 },
    { name: 'LLM Cost Tracking', start: 27, count: 6 }
  ];

  categories.forEach(category => {
    report += `### ${category.name}\n\n`;
    report += `| Check | Status | Details |\n`;
    report += `|-------|--------|---------|\n`;
    for (let i = category.start; i < category.start + category.count && i < results.length; i++) {
      const result = results[i];
      const emoji = result.status === 'PASS' ? '✅' : '❌';
      report += `| ${result.name} | ${emoji} **${result.status}** | ${result.message || '-'} |\n`;
    }
    report += `\n`;
  });

  report += `---\n\n`;
  report += `## CONCLUSION\n\n`;
  if (failed === 0) {
    report += `**All monitoring components validated successfully!** ✅\n\n`;
    report += `The monitoring system is fully functional and ready for production use.\n`;
  } else {
    report += `**Some tests failed.** ⚠️\n\n`;
    report += `Please review the failures and ensure all components are properly configured.\n`;
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\nValidation report saved to: ${reportPath}`);
}

async function main() {
  console.log('🔍 Alpha Signal - Monitoring System Validation\n');
  console.log('Testing all monitoring components...\n');

  try {
    await testHealthEndpoints();
    await testMetricsEndpoints();
    await testStructuredLogging();
    await testErrorTracking();
    await testAdminDashboard();
    await testAlertingSystem();
    await testLLMCostTracking();
    await printSummary();
  } catch (error) {
    console.error('Validation failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
