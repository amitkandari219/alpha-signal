/**
 * GraphQL Queries for Weekly Reports
 */

import { gql } from '@apollo/client';

export const GET_REPORTS = gql`
  query GetReports($filters: ReportFilters, $pagination: Pagination) {
    reports(filters: $filters, pagination: $pagination) {
      id
      title
      slug
      reportType
      sector {
        id
        name
      }
      summary
      publishedAt
      fiscalWeek
      fiscalYear
      viewCount
    }
  }
`;

export const GET_REPORT_DETAIL = gql`
  query GetReportDetail($slug: String!) {
    report(slug: $slug) {
      id
      title
      slug
      reportType
      sector {
        id
        name
      }
      summary
      fullContent
      publishedAt
      fiscalWeek
      fiscalYear
      viewCount
      reportSections {
        id
        sectionOrder
        sectionTitle
        sectionType
        content
      }
    }
  }
`;

export const INCREMENT_REPORT_VIEW = gql`
  mutation IncrementReportView($slug: String!) {
    incrementReportView(slug: $slug) {
      id
      viewCount
    }
  }
`;

export const LATEST_REPORTS = gql`
  query LatestReports($limit: Int!) {
    latestReports(limit: $limit) {
      id
      title
      slug
      reportType
      sector {
        id
        name
      }
      publishedAt
      viewCount
    }
  }
`;

export const GET_REPORTS_COUNT = gql`
  query GetReportsCount($filters: ReportFilters) {
    reportsCount(filters: $filters)
  }
`;

// Newsletter Mutations and Queries
export const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!, $subscribedSectors: [String!]!, $frequency: NewsletterFrequency!) {
    subscribeNewsletter(email: $email, subscribedSectors: $subscribedSectors, frequency: $frequency) {
      id
      email
      isActive
    }
  }
`;

export const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeNewsletter($email: String!) {
    unsubscribeNewsletter(email: $email) {
      success
      message
    }
  }
`;

export const GET_NEWSLETTER_PREFERENCES = gql`
  query GetNewsletterPreferences {
    myNewsletterPreferences {
      id
      email
      subscribedSectors
      frequency
      isActive
      subscribedAt
    }
  }
`;

export const UPDATE_NEWSLETTER_PREFERENCES = gql`
  mutation UpdateNewsletterPreferences($subscribedSectors: [String!]!, $frequency: NewsletterFrequency!) {
    updateNewsletterPreferences(subscribedSectors: $subscribedSectors, frequency: $frequency) {
      id
      subscribedSectors
      frequency
      isActive
    }
  }
`;
