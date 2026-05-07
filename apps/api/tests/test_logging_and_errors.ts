/**
 * Test script for logging and error tracking
 * Run with: npx tsx tests/test_logging_and_errors.ts
 */

import { logger, logHttpRequest, logGraphQLQuery, logCacheOperation, logPaymentEvent, logAISummaryGeneration, logError } from '../src/services/logger.js';
import { trackError, getErrorStats, clearErrorLogs } from '../src/services/errorTracker.js';

// Mock request/reply for testing
const mockRequest = {
  method: 'GET',
  url: '/api/test',
  headers: {
    'x-request-id': 'test-request-123',
    'user-agent': 'Test Agent/1.0',
  },
  ip: '127.0.0.1',
  user: { id: 'test-user-123' },
} as any;

const mockReply = {
  statusCode: 200,
} as any;

async function testLogging() {
  console.log('\n=== Testing Structured Logging ===\n');

  // Test 1: Basic logger
  logger.info('Test info message', { test: true });
  logger.warn('Test warning message', { warning: true });
  logger.error('Test error message', { error: true });

  // Test 2: HTTP request logging
  console.log('\n--- HTTP Request Logging ---');
  logHttpRequest(mockRequest, mockReply, 125);

  // Test 3: GraphQL query logging
  console.log('\n--- GraphQL Query Logging ---');
  logGraphQLQuery('GetStock', { symbol: 'RELIANCE' }, 250, 'user-123');

  // Test 4: Cache operations
  console.log('\n--- Cache Operations ---');
  logCacheOperation('hit', 'stock:RELIANCE', 5);
  logCacheOperation('miss', 'stock:TATA', 3);

  // Test 5: Payment events
  console.log('\n--- Payment Events ---');
  logPaymentEvent('subscription.created', 'user-123', 99900, 'pay_123');

  // Test 6: AI Summary generation
  console.log('\n--- AI Summary Generation ---');
  logAISummaryGeneration(
    'company-123',
    'BUSINESS_OVERVIEW',
    'claude-sonnet-4',
    3500,
    1250
  );

  // Test 7: Error logging
  console.log('\n--- Error Logging ---');
  const testError = new Error('Test error for logging');
  logError(testError, {
    requestId: 'test-req-456',
    userId: 'user-456',
    route: '/api/test',
    metadata: { test: true },
  });

  console.log('\n✅ Logging tests completed\n');
}

async function testErrorTracking() {
  console.log('\n=== Testing Error Tracking ===\n');

  // Clear previous errors
  await clearErrorLogs();
  console.log('Cleared previous error logs');

  // Test 1: Track a simple error
  console.log('\n--- Tracking Simple Error ---');
  const simpleError = new Error('Test simple error');
  trackError(simpleError, {
    route: '/api/test',
    metadata: { test: true },
  });

  // Wait a bit for async processing
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test 2: Track an error with full context
  console.log('\n--- Tracking Error with Context ---');
  const contextError = new Error('Test error with full context');
  trackError(contextError, {
    requestId: 'req-789',
    userId: 'user-789',
    route: 'POST /api/stocks',
    metadata: {
      symbol: 'RELIANCE',
      action: 'create',
      data: { test: true },
    },
  });

  await new Promise(resolve => setTimeout(resolve, 100));

  // Test 3: Track multiple errors of different types
  console.log('\n--- Tracking Multiple Error Types ---');
  const validationError = new Error('Validation failed');
  validationError.name = 'ValidationError';
  trackError(validationError, { route: '/api/validate' });

  const authError = new Error('Unauthorized access');
  authError.name = 'AuthenticationError';
  trackError(authError, { route: '/api/protected', userId: 'user-999' });

  const dbError = new Error('Database connection failed');
  dbError.name = 'DatabaseError';
  trackError(dbError, { route: '/api/query' });

  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 4: Get error statistics
  console.log('\n--- Error Statistics ---');
  const stats = await getErrorStats(24);
  console.log('Error Stats:', JSON.stringify(stats, null, 2));

  // Test 5: Verify auto-pruning (would need 10,000+ errors)
  console.log('\n--- Testing Auto-Pruning (creating 10 sample errors) ---');
  for (let i = 0; i < 10; i++) {
    const error = new Error(`Test error ${i}`);
    trackError(error, { route: `/api/test/${i}` });
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  const finalStats = await getErrorStats(24);
  console.log('Final Error Count:', finalStats.total);

  // Clean up
  console.log('\n--- Cleanup ---');
  const deletedCount = await clearErrorLogs();
  console.log(`Deleted ${deletedCount} error logs`);

  console.log('\n✅ Error tracking tests completed\n');
}

async function testSanitization() {
  console.log('\n=== Testing Data Sanitization ===\n');

  // Test sanitization of sensitive data
  logGraphQLQuery(
    'Login',
    {
      email: 'test@example.com',
      password: 'super-secret-password',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
    150,
    'user-123'
  );

  console.log('✅ Sensitive data should be [REDACTED] in logs above\n');
}

async function main() {
  try {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Logging & Error Tracking Tests      ║');
    console.log('╚════════════════════════════════════════╝');

    await testLogging();
    await testSanitization();
    await testErrorTracking();

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   All Tests Completed Successfully!   ║');
    console.log('╚════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
