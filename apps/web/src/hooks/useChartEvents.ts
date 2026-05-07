/**
 * useChartEvents Hook
 *
 * Fetches company events for chart rendering with date range filtering
 */

import { useQuery, gql } from '@apollo/client';
import type { EventType } from '@/constants/eventTypes';
import type { ImpactAssessment } from '@/constants/eventTypes';

// GraphQL query for chart events
const GET_COMPANY_EVENTS_FOR_CHART = gql`
  query GetCompanyEventsForChart(
    $symbol: String!
    $startDate: String
    $endDate: String
    $isVerified: Boolean
  ) {
    companyEvents(
      symbol: $symbol
      startDate: $startDate
      endDate: $endDate
      isVerified: $isVerified
    ) {
      id
      eventType
      title
      eventDate
      summary
      impactAssessment
      isVerified
      fiscalYear
      fiscalQuarter
      sourceUrls
      createdAt
    }
  }
`;

export interface ChartEvent {
  id: string;
  eventType: EventType;
  title: string;
  eventDate: string; // ISO date string
  summary: string;
  impactAssessment: ImpactAssessment | null;
  isVerified: boolean;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  sourceUrls: string[];
  createdAt: string;
}

interface UseChartEventsOptions {
  symbol: string; // Stock symbol (e.g., "TCS", "RELIANCE")
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  isVerifiedOnly?: boolean; // For FREE tier users
  enabled?: boolean; // Enable/disable query
}

interface UseChartEventsResult {
  events: ChartEvent[];
  loading: boolean;
  error: Error | undefined;
  refetch: () => void;
}

/**
 * Hook to fetch company events for chart rendering
 *
 * @param options - Query options including companyId, date range, and verification filter
 * @returns Events array, loading state, error, and refetch function
 *
 * @example
 * const { events, loading } = useChartEvents({
 *   symbol: 'TCS',
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31',
 *   isVerifiedOnly: true, // FREE tier
 * });
 */
export function useChartEvents({
  symbol,
  startDate,
  endDate,
  isVerifiedOnly = false,
  enabled = true,
}: UseChartEventsOptions): UseChartEventsResult {
  const { data, loading, error, refetch } = useQuery(GET_COMPANY_EVENTS_FOR_CHART, {
    variables: {
      symbol,
      startDate,
      endDate,
      isVerified: isVerifiedOnly ? true : undefined,
    },
    skip: !enabled || !symbol,
    // Cache for 5 minutes
    fetchPolicy: 'cache-first',
    nextFetchPolicy: 'cache-first',
    // Refetch every 5 minutes
    pollInterval: 5 * 60 * 1000,
  });

  return {
    events: data?.companyEvents || [],
    loading,
    error,
    refetch,
  };
}

/**
 * Helper to group events by date for stacking on chart
 */
export function groupEventsByDate(events: ChartEvent[]): Record<string, ChartEvent[]> {
  return events.reduce(
    (acc, event) => {
      const date = event.eventDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    },
    {} as Record<string, ChartEvent[]>
  );
}

/**
 * Helper to filter events by active event filters
 */
export function filterEventsByType(
  events: ChartEvent[],
  eventFilters: Record<EventType, boolean>
): ChartEvent[] {
  return events.filter((event) => eventFilters[event.eventType] === true);
}
