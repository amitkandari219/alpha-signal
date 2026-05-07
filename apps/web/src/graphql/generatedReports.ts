/**
 * GraphQL Queries for Generated Stock Reports
 */

import { gql } from '@apollo/client';

export const GENERATE_REPORT = gql`
  query GenerateReport($symbol: String!) {
    generateReport(symbol: $symbol) {
      id
      symbol
      companyId
      reportType
      title

      # Report sections
      timeline
      businessModel
      financials
      moat
      supplyChain
      catalysts
      govtImpact
      globalTrade
      risks
      aiSummary

      # Metadata
      metadata
      generationMetrics

      # Analytics
      viewCount
      downloadCount

      # Lifecycle
      status
      generatedAt
      expiresAt
      lastAccessedAt

      # Upgrade prompt fields (for FREE users)
      upgradeRequired
      requiredTier
      message
    }
  }
`;

export const GET_REPORT = gql`
  query GetReport($symbol: String!) {
    getReport(symbol: $symbol) {
      id
      symbol
      companyId
      reportType
      title

      # Report sections
      timeline
      businessModel
      financials
      moat
      supplyChain
      catalysts
      govtImpact
      globalTrade
      risks
      aiSummary

      # Metadata
      metadata
      generationMetrics

      # Analytics
      viewCount
      downloadCount

      # Lifecycle
      status
      generatedAt
      expiresAt
      lastAccessedAt
    }
  }
`;

export const TRACK_REPORT_DOWNLOAD = gql`
  mutation TrackReportDownload($reportId: ID!) {
    trackReportDownload(reportId: $reportId) {
      success
      message
    }
  }
`;
