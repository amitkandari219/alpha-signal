/**
 * Reports Library Page
 *
 * Browse and filter weekly intelligence reports
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, TrendingUp, FileText } from 'lucide-react';
import { ReportCard } from '../components/reports/ReportCard';
import { NewsletterSignup } from '../components/reports/NewsletterSignup';
import { EventSearchBar } from '../components/reports/EventSearchBar';
import { SEO } from '../components/SEO';
import { getMockReportsData } from '../data/mockReportsData';

type TabType = 'all' | 'macro' | 'sector';
type SortType = 'latest' | 'popular';

interface Report {
  id: string;
  title: string;
  slug: string;
  reportType: 'MACRO' | 'SECTOR';
  sector?: {
    id: string;
    name: string;
  } | null;
  summary: string;
  publishedAt: string;
  fiscalWeek: number;
  fiscalYear: number;
  viewCount: number;
}

const REPORTS_PER_PAGE = 10;

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortBy, setSortBy] = useState<SortType>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  // Fetch reports
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', activeTab, sortBy, currentPage],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const filters: any = {};

      if (activeTab === 'macro') {
        filters.reportType = 'MACRO';
      } else if (activeTab === 'sector') {
        filters.reportType = 'SECTOR';
      }

      // Use mock data for development
      const result = getMockReportsData(filters, currentPage, REPORTS_PER_PAGE);

      // Sort by view count if popular
      if (sortBy === 'popular') {
        result.reports.sort((a, b) => b.viewCount - a.viewCount);
      }

      return result;
    },
  });

  const reports: Report[] = data?.reports || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / REPORTS_PER_PAGE);
  const latestReport = reports.find(r => r.reportType === 'MACRO');

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, sortBy]);

  return (
    <>
      <SEO
        title="Weekly Intelligence Reports - Alpha Signal"
        description="AI-powered market analysis and sector insights delivered weekly. Stay ahead with comprehensive market intelligence reports."
        canonical="/reports"
      />

      <div className="space-y-6 animate-fade-in">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Weekly Intelligence Reports
              </h1>
              {latestReport && (
                <p className="text-text-secondary">
                  Latest report published on{' '}
                  <span className="text-accent-blue font-medium">
                    {new Date(latestReport.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center gap-2 bg-bg-secondary border border-border-default rounded-lg px-4 py-2">
              <FileText className="w-5 h-5 text-accent-blue" />
              <div>
                <div className="text-xs text-text-muted">Total Reports</div>
                <div className="text-lg font-bold text-text-primary">{totalCount}</div>
              </div>
            </div>
          </div>
          <p className="text-text-secondary max-w-3xl">
            AI-powered market analysis and sector insights delivered weekly. Get comprehensive
            reports on macro trends, sector performance, and stock opportunities.
          </p>
        </div>

        {/* Event Search Bar */}
        <div className="mb-6">
          <EventSearchBar
            placeholder="Search across all company events..."
            onResultClick={(result) => {
              // Navigate to stock detail page
              navigate(`/stock/${result.companySymbol}`);
            }}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-bg-secondary border border-border-default rounded-lg p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'all'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setActiveTab('macro')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'macro'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Macro Overview
            </button>
            <button
              onClick={() => setActiveTab('sector')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                activeTab === 'sector'
                  ? 'bg-accent-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Sector Reports
            </button>
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
          >
            <option value="latest">Latest First</option>
            <option value="popular">Most Viewed</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-6 text-center">
            <p className="text-signal-red font-medium mb-2">Failed to load reports</p>
            <p className="text-text-secondary text-sm">
              Please try again later or contact support if the problem persists.
            </p>
          </div>
        )}

        {/* Reports Grid */}
        {!isLoading && !error && reports.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {reports.map((report, index) => (
                <ReportCard
                  key={report.id}
                  {...report}
                  featured={index === 0 && report.reportType === 'MACRO' && currentPage === 1}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-border-default">
                <div className="text-sm text-text-secondary">
                  Showing {(currentPage - 1) * REPORTS_PER_PAGE + 1} -{' '}
                  {Math.min(currentPage * REPORTS_PER_PAGE, totalCount)} of {totalCount} reports
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary font-medium hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all ${
                            currentPage === pageNum
                              ? 'bg-accent-blue text-white'
                              : 'bg-bg-secondary border border-border-default text-text-primary hover:bg-bg-tertiary'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-bg-secondary border border-border-default rounded-lg text-text-primary font-medium hover:bg-bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && reports.length === 0 && (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-12 text-center">
            <TrendingUp className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No reports found</h3>
            <p className="text-text-secondary">
              {activeTab === 'all'
                ? 'No reports have been published yet. Check back soon!'
                : `No ${activeTab} reports available. Try another category.`}
            </p>
          </div>
        )}

        {/* Newsletter Signup */}
        <div className="pt-8">
          <NewsletterSignup />
        </div>
      </div>
    </>
  );
};

export default Reports;
