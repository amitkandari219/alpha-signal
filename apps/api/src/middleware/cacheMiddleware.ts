/**
 * GraphQL Cache Middleware
 *
 * Intercepts GraphQL queries and checks Redis cache before executing resolvers
 * Adds X-Cache header (HIT or MISS) to responses
 */

import { GraphQLRequestContext } from '@apollo/server';
import { getCacheService, CACHE_KEYS, CACHE_TTL } from '../services/cache';
import crypto from 'crypto';

const cacheService = getCacheService();

/**
 * Generate cache key from GraphQL operation
 */
function generateCacheKey(
  operationName: string | null | undefined,
  variables: Record<string, any>
): string {
  // Create hash of variables for consistent cache keys
  const variablesHash = crypto
    .createHash('md5')
    .update(JSON.stringify(variables || {}))
    .digest('hex')
    .substring(0, 8);

  return `graphql:${operationName || 'unknown'}:${variablesHash}`;
}

/**
 * Get appropriate TTL based on operation name
 */
function getTTLForOperation(operationName: string | null | undefined): number {
  if (!operationName) return CACHE_TTL.STOCK_DETAIL;

  const opName = operationName.toLowerCase();

  // Map operation names to TTLs
  if (opName.includes('price') || opName.includes('liveprice')) {
    return CACHE_TTL.STOCK_PRICE;
  }
  if (opName.includes('score')) {
    return CACHE_TTL.STOCK_SCORES;
  }
  if (opName.includes('ai') || opName.includes('summary')) {
    return CACHE_TTL.AI_SUMMARY;
  }
  if (opName.includes('technical')) {
    return CACHE_TTL.TECHNICALS;
  }
  if (opName.includes('news') || opName.includes('sentiment')) {
    return CACHE_TTL.NEWS;
  }
  if (opName.includes('screener')) {
    return CACHE_TTL.SCREENER;
  }
  if (opName.includes('sector')) {
    return CACHE_TTL.SECTOR_OVERVIEW;
  }
  if (opName.includes('market') || opName.includes('indices')) {
    return CACHE_TTL.MARKET_OVERVIEW;
  }
  if (opName.includes('trending')) {
    return CACHE_TTL.TRENDING;
  }
  if (opName.includes('report')) {
    return CACHE_TTL.REPORTS;
  }

  // Default TTL for stock detail
  return CACHE_TTL.STOCK_DETAIL;
}

/**
 * Determine if operation should be cached
 */
function shouldCacheOperation(
  operationName: string | null | undefined,
  operation: string | null | undefined
): boolean {
  // Don't cache mutations
  if (operation && operation.includes('mutation')) {
    return false;
  }

  // Don't cache introspection queries
  if (operationName && operationName.startsWith('IntrospectionQuery')) {
    return false;
  }

  // Don't cache user-specific sensitive data
  const sensitiveOps = ['login', 'register', 'updateprofile', 'payment'];
  if (operationName && sensitiveOps.some(op => operationName.toLowerCase().includes(op))) {
    return false;
  }

  return true;
}

/**
 * GraphQL Cache Plugin
 */
export const cachePlugin = {
  async requestDidStart(requestContext: GraphQLRequestContext<any>) {
    const { request, contextValue } = requestContext;
    const operationName = request.operationName;
    const variables = request.variables || {};
    const operation = request.query;

    // Check if this operation should be cached
    if (!shouldCacheOperation(operationName, operation)) {
      return {
        async willSendResponse({ response }: any) {
          // Add X-Cache: SKIP header
          if (response.http) {
            response.http.headers.set('X-Cache', 'SKIP');
          }
        },
      };
    }

    // Generate cache key
    const cacheKey = generateCacheKey(operationName, variables);
    let cacheHit = false;

    return {
      async executionDidStart() {
        return {
          async executionDidEnd() {
            // This is called after execution completes
          },
        };
      },

      async willSendResponse({ response }: any) {
        const ttl = getTTLForOperation(operationName);

        if (cacheHit) {
          // Cache hit - add header
          if (response.http) {
            response.http.headers.set('X-Cache', 'HIT');
          }
          console.log(`✅ Cache HIT: ${operationName} (${cacheKey})`);
        } else {
          // Cache miss - store result and add header
          if (response.http) {
            response.http.headers.set('X-Cache', 'MISS');
          }

          // Cache the response data if no errors
          if (response.data && !response.errors) {
            await cacheService.set(cacheKey, response.data, ttl);
            console.log(`💾 Cached: ${operationName} (TTL: ${ttl}s)`);
          }
        }

        // Log cache statistics periodically
        const stats = cacheService.getStats();
        if ((stats.hits + stats.misses) % 100 === 0) {
          console.log(`📊 Cache Stats - Hits: ${stats.hits}, Misses: ${stats.misses}, Hit Rate: ${stats.hitRate}`);
        }
      },
    };
  },

  async responseForOperation(requestContext: GraphQLRequestContext<any>) {
    const { request } = requestContext;
    const operationName = request.operationName;
    const variables = request.variables || {};
    const operation = request.query;

    // Check if this operation should be cached
    if (!shouldCacheOperation(operationName, operation)) {
      return null; // Continue with normal execution
    }

    // Generate cache key
    const cacheKey = generateCacheKey(operationName, variables);

    // Try to get from cache
    const cachedData = await cacheService.get(cacheKey);

    if (cachedData) {
      // Cache hit - return cached response
      console.log(`✅ Cache HIT: ${operationName} (${cacheKey})`);

      return {
        http: {
          headers: new Map([['X-Cache', 'HIT']]),
        },
        body: {
          kind: 'single',
          singleResult: {
            data: cachedData,
          },
        },
      } as any;
    }

    // Cache miss - continue with normal execution
    return null;
  },
};

/**
 * Helper function to invalidate cache for a specific operation
 */
export async function invalidateOperationCache(
  operationName: string,
  variables?: Record<string, any>
): Promise<void> {
  const cacheKey = generateCacheKey(operationName, variables || {});
  await cacheService.delete(cacheKey);
}

/**
 * Helper function to invalidate all cache entries matching a pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  await cacheService.deletePattern(pattern);
}

export default cachePlugin;
