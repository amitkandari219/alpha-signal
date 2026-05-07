/**
 * GraphQL Metrics Plugin
 *
 * Apollo Server plugin to track GraphQL resolver durations and errors
 * Records execution time for each resolver and tracks errors
 */

import { ApolloServerPlugin } from '@apollo/server';
import { getMetricsService } from '../services/metrics.js';

const metricsService = getMetricsService();

/**
 * GraphQL Metrics Plugin for Apollo Server
 */
export const graphqlMetricsPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const startTime = Date.now();
    let operationName = 'unknown';
    let hasError = false;

    return {
      async didResolveOperation(requestContext) {
        operationName = requestContext.operationName || 'anonymous';
      },

      async executionDidStart() {
        return {
          willResolveField({ info }) {
            const fieldStartTime = Date.now();
            const resolverName = `${info.parentType.name}.${info.fieldName}`;

            return () => {
              const resolverDuration = Date.now() - fieldStartTime;

              // Track resolver metrics
              metricsService.trackGraphQLResolver(resolverName, resolverDuration, false);
            };
          },
        };
      },

      async didEncounterErrors(requestContext) {
        hasError = true;
        const errors = requestContext.errors || [];

        // Track each error
        errors.forEach(() => {
          const resolverName = operationName;
          metricsService.trackGraphQLResolver(resolverName, 0, true);
        });
      },

      async willSendResponse() {
        const totalDuration = Date.now() - startTime;

        // Track overall GraphQL request
        metricsService.trackGraphQLResolver(`operation.${operationName}`, totalDuration, hasError);
      },
    };
  },
};
