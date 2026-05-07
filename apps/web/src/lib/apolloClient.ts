/**
 * Apollo Client Setup
 *
 * GraphQL client with authentication and error handling
 */

import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// HTTP connection to the API
const httpLink = createHttpLink({
  uri: `${API_URL}/graphql`,
});

// Middleware to add auth token to requests
const authLink = setContext((_, { headers }) => {
  const token = useAuthStore.getState().accessToken;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // Handle authentication errors
      if (extensions?.code === 'UNAUTHENTICATED') {
        // Try to refresh token
        const { refreshAccessToken, clearAuth } = useAuthStore.getState();
        refreshAccessToken()
          .then((newToken) => {
            if (newToken) {
              // Retry the operation with new token
              return forward(operation);
            } else {
              clearAuth();
              window.location.href = '/login';
            }
          })
          .catch(() => {
            clearAuth();
            window.location.href = '/login';
          });
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Create Apollo Client
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reports: {
            keyArgs: ['filters'],
            merge(existing, incoming, { args }) {
              // Handle pagination
              if (!args?.pagination?.offset) {
                return incoming;
              }
              return existing ? [...existing, ...incoming] : incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
