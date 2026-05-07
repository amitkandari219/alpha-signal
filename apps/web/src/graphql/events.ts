/**
 * GraphQL Queries for Company Events
 */

import { gql } from '@apollo/client';

export const SEARCH_EVENTS_ACROSS_COMPANIES = gql`
  query SearchEventsAcrossCompanies($query: String!, $pagination: Pagination) {
    searchEventsAcrossCompanies(query: $query, pagination: $pagination) {
      results {
        id
        companyId
        company {
          id
          symbol
          name
        }
        eventType
        eventTitle
        eventDate
        description
        snippet
        matchedText
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_COMPANY_EVENTS = gql`
  query GetCompanyEvents($companyId: String!, $filters: EventFilters, $pagination: Pagination) {
    companyEvents(companyId: $companyId, filters: $filters, pagination: $pagination) {
      id
      eventType
      eventTitle
      eventDate
      description
      sourceUrl
      createdAt
      updatedAt
    }
  }
`;

export const GET_EVENT_DETAIL = gql`
  query GetEventDetail($id: String!) {
    event(id: $id) {
      id
      companyId
      company {
        id
        symbol
        name
        sector {
          id
          name
        }
      }
      eventType
      eventTitle
      eventDate
      description
      sourceUrl
      attachments
      createdAt
      updatedAt
    }
  }
`;

export const GET_UPCOMING_EVENTS = gql`
  query GetUpcomingEvents($limit: Int!, $eventTypes: [EventType!]) {
    upcomingEvents(limit: $limit, eventTypes: $eventTypes) {
      id
      companyId
      company {
        id
        symbol
        name
      }
      eventType
      eventTitle
      eventDate
      description
    }
  }
`;

export const GET_EVENTS_BY_TYPE = gql`
  query GetEventsByType($eventType: EventType!, $pagination: Pagination) {
    eventsByType(eventType: $eventType, pagination: $pagination) {
      id
      companyId
      company {
        id
        symbol
        name
      }
      eventTitle
      eventDate
      description
    }
  }
`;
