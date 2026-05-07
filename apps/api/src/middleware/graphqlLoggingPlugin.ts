import type { ApolloServerPlugin } from '@apollo/server';
import { logGraphQLQuery } from '../services/logger.js';

/**
 * Apollo Server plugin for logging GraphQL operations
 */
export const graphqlLoggingPlugin: ApolloServerPlugin = {
  async requestDidStart() {
    const startTime = Date.now();
    let operationName: string | undefined;
    let variables: Record<string, any> = {};
    let userId: string | undefined;

    return {
      async didResolveOperation(requestContext) {
        operationName = requestContext.operationName || 'anonymous';
        variables = requestContext.request.variables || {};
        userId = (requestContext.contextValue as any)?.user?.id;
      },

      async willSendResponse(requestContext) {
        const duration = Date.now() - startTime;
        const hasErrors = requestContext.errors && requestContext.errors.length > 0;

        if (operationName) {
          logGraphQLQuery(
            operationName,
            variables,
            duration,
            userId,
            hasErrors ? requestContext.errors![0] : undefined
          );
        }
      },

      async didEncounterErrors(requestContext) {
        const duration = Date.now() - startTime;
        const error = requestContext.errors[0];

        if (operationName) {
          logGraphQLQuery(
            operationName,
            variables,
            duration,
            userId,
            error as Error
          );
        }
      },
    };
  },
};

export default graphqlLoggingPlugin;
