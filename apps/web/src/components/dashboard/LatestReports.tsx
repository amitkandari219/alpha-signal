/**
 * Latest Reports Component
 *
 * Displays the 3 most recent published reports on the dashboard
 * Features: NEW badge for reports < 48 hours old, responsive cards
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, TrendingUp } from 'lucide-react';
import { useQuery } from '@apollo/client';
import { LATEST_REPORTS } from '../../graphql/reports';

interface Report {
  id: string;
  title: string;
  slug: string;
  reportType: 'SECTOR_WEEKLY' | 'MACRO_WEEKLY';
  sector?: {
    id: string;
    name: string;
  };
  summary: string;
  publishedAt: string;
  viewCount: number;
}

export const LatestReports: React.FC = () => {
  const { data, loading, error } = useQuery(LATEST_REPORTS, {
    variables: { limit: 3 },
  });

  // Check if report is new (< 48 hours old)
  const isNewReport = (publishedAt: string) => {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
    return diffHours < 48;
  };

  // Format relative date
  const getRelativeDate = (publishedAt: string) => {
    const published = new Date(publishedAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Get report badge
  const getReportBadge = (report: Report) => {
    if (report.reportType === 'MACRO_WEEKLY') {
      return { label: 'MACRO', color: 'signal-purple' };
    }
    return { label: report.sector?.name || 'SECTOR', color: 'signal-blue' };
  };

  // Empty state
  if (!loading && (!data?.latestReports || data.latestReports.length === 0)) {
    return (
      <div className="bg-bg-secondary border border-border-default rounded-lg p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Reports Yet
          </h3>
          <p className="text-text-secondary mb-4">
            Weekly reports will appear here once published.
          </p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 text-signal-blue hover:text-signal-blue/80 font-medium"
          >
            Explore Reports
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-1">Latest Weekly Reports</h2>
          <p className="text-text-secondary">AI-powered market analysis</p>
        </div>
        <Link
          to="/reports"
          className="flex items-center gap-2 text-signal-blue hover:text-signal-blue/80 font-medium transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-bg-tertiary" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-bg-tertiary rounded w-3/4" />
                <div className="h-3 bg-bg-tertiary rounded w-full" />
                <div className="h-3 bg-bg-tertiary rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-4">
          <p className="text-signal-red">Failed to load reports. Please try again.</p>
        </div>
      )}

      {/* Report Cards */}
      {!loading && !error && data?.latestReports && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.latestReports.map((report: Report) => {
            const badge = getReportBadge(report);
            const isNew = isNewReport(report.publishedAt);

            return (
              <Link
                key={report.id}
                to={`/reports/${report.slug}`}
                className="group bg-bg-secondary border border-border-default rounded-lg overflow-hidden hover:border-signal-blue/50 transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Card Image/Header */}
                <div className="relative h-48 bg-gradient-to-br from-signal-blue/20 to-signal-purple/20 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-signal-blue/50" />

                  {/* NEW Badge */}
                  {isNew && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-signal-green rounded-full text-xs font-bold text-white animate-pulse">
                      NEW
                    </div>
                  )}

                  {/* Report Type Badge */}
                  <div className={`absolute bottom-3 left-3 px-3 py-1 bg-${badge.color}/20 border border-${badge.color}/50 rounded-full text-xs font-semibold text-${badge.color}`}>
                    {badge.label}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  {/* Title */}
                  <h3 className="text-lg font-bold text-text-primary line-clamp-2 group-hover:text-signal-blue transition-colors">
                    {report.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {report.summary.substring(0, 80)}...
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-default">
                    <span className="text-xs text-text-muted">
                      {getRelativeDate(report.publishedAt)}
                    </span>
                    <span className="text-sm font-medium text-signal-blue flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
