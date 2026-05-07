/**
 * Report Detail Page
 *
 * Full reading experience for individual weekly reports
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useMutation as useApolloMutation } from '@apollo/client';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Eye,
  Clock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ReportSectionRenderer } from '../components/reports/ReportSectionRenderer';
import { ShareButtons } from '../components/reports/ShareButtons';
import { NewsletterSignup } from '../components/reports/NewsletterSignup';
import { UpgradePrompt } from '../components/common/UpgradePrompt';
import { SEO } from '../components/SEO';
import { getReportBySlug } from '../data/mockReportsData';
import { useAuthStore } from '../store/useAuthStore';
import { INCREMENT_REPORT_VIEW } from '../graphql/reports';

interface ReportSection {
  id: string;
  sectionOrder: number;
  sectionTitle: string;
  sectionType: 'TEXT' | 'METRIC_CARDS' | 'CHART_DATA' | 'TABLE_DATA' | 'STOCK_LIST';
  content: string;
}

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
  fullContent: string;
  publishedAt: string;
  fiscalWeek: number;
  fiscalYear: number;
  viewCount: number;
  reportSections: ReportSection[];
}

const SECTOR_COLORS: Record<string, string> = {
  Technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Finance: 'bg-green-500/20 text-green-400 border-green-500/30',
  Healthcare: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Energy: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Consumer: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  Industrial: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Materials: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  Utilities: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'Real Estate': 'bg-red-500/20 text-red-400 border-red-500/30',
  Telecommunications: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export const ReportDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const [viewIncremented, setViewIncremented] = useState(false);

  const userTier = user?.tier || 'FREE';
  const hasFullAccess = userTier === 'PRO' || userTier === 'PREMIUM';

  // Fetch report
  const { data: report, isLoading, error } = useQuery<Report | null>({
    queryKey: ['report', slug],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use mock data for development
      const mockReport = getReportBySlug(slug || '');
      return mockReport as Report | null;
    },
    enabled: !!slug,
  });

  // Increment view count with GraphQL
  const [incrementReportView] = useApolloMutation(INCREMENT_REPORT_VIEW);

  useEffect(() => {
    if (report && !viewIncremented && slug) {
      // Check if already viewed in this session
      const viewedReports = JSON.parse(localStorage.getItem('viewedReports') || '[]');

      if (!viewedReports.includes(slug)) {
        // Increment view count (fire and forget)
        incrementReportView({ variables: { slug } })
          .then(() => {
            // Mark as viewed in localStorage
            viewedReports.push(slug);
            localStorage.setItem('viewedReports', JSON.stringify(viewedReports));
            setViewIncremented(true);
          })
          .catch(err => {
            console.error('Failed to track view:', err);
          });
      } else {
        setViewIncremented(true);
      }
    }
  }, [report, viewIncremented, slug, incrementReportView]);

  // Calculate reading time (average 200 words per minute)
  const calculateReadingTime = (content: string): number => {
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / 200);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-signal-red mx-auto mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Report Not Found</h2>
          <p className="text-text-secondary mb-6">
            The report you're looking for doesn't exist or has been removed.
          </p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(report.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const readingTime = calculateReadingTime(report.fullContent);
  const sectorColor = report.sector
    ? SECTOR_COLORS[report.sector.name] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30'
    : '';

  const currentUrl = window.location.href;

  // Sort sections by order
  const sortedSections = [...report.reportSections].sort(
    (a, b) => a.sectionOrder - b.sectionOrder
  );

  // For FREE users, show blur overlay after first section
  const shouldShowBlur = !hasFullAccess && sortedSections.length > 1;

  return (
    <>
      <SEO
        title={`${report.title} - Alpha Signal`}
        description={report.summary}
        canonical={`/reports/${report.slug}`}
        image="/images/report-preview.jpg"
      />

      <div className="animate-fade-in">
        {/* Back Button */}
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-blue transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Reports</span>
        </Link>

        {/* Article Container */}
        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 pb-8 border-b border-border-default">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
              {report.title}
            </h1>

            {/* Metadata Row */}
            <div className="flex items-center gap-4 flex-wrap mb-6">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>

              {report.reportType === 'SECTOR' && report.sector && (
                <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${sectorColor}`}>
                  {report.sector.name}
                </span>
              )}

              {report.reportType === 'MACRO' && (
                <span className="px-2.5 py-1 bg-accent-blue/20 text-accent-blue rounded text-xs font-semibold border border-accent-blue/30">
                  MACRO WEEKLY
                </span>
              )}

              <span className="px-2.5 py-1 bg-signal-purple/20 text-signal-purple rounded text-xs font-semibold border border-signal-purple/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>

              <div className="flex items-center gap-1 text-sm text-text-muted">
                <Eye className="w-4 h-4" />
                <span>{report.viewCount.toLocaleString()} views</span>
              </div>
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-2 text-sm text-text-muted mb-6">
              <Clock className="w-4 h-4" />
              <span>{readingTime} min read</span>
            </div>

            {/* Share Buttons */}
            <ShareButtons
              title={report.title}
              url={currentUrl}
              description={report.summary}
            />
          </header>

          {/* Summary */}
          <div className="bg-gradient-to-r from-accent-blue/10 to-signal-purple/10 border-l-4 border-accent-blue rounded-lg p-6 mb-8">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-2">
              Executive Summary
            </h2>
            <p className="text-text-primary leading-relaxed">{report.summary}</p>
          </div>

          {/* Report Sections */}
          <div className="relative">
            {sortedSections.map((section, index) => (
              <div key={section.id} className={shouldShowBlur && index > 0 ? 'blur-sm' : ''}>
                <ReportSectionRenderer section={section} />
              </div>
            ))}

            {/* Upgrade Overlay for FREE users */}
            {shouldShowBlur && (
              <div className="absolute inset-0 top-[400px] bg-gradient-to-b from-transparent via-bg-primary/80 to-bg-primary flex items-center justify-center pt-20">
                <div className="max-w-md">
                  <UpgradePrompt
                    feature="ai_summary_full"
                    variant="inline"
                    requiredTier="PRO"
                    message="Upgrade to PRO to read the full report and access exclusive market insights"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-12">
            <NewsletterSignup variant="card" />
          </div>

          {/* Footer Disclaimers */}
          <footer className="mt-12 pt-8 border-t border-border-default">
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
                Important Disclaimers
              </h3>
              <div className="space-y-3 text-sm text-text-muted">
                <p>
                  <strong className="text-text-secondary">AI-Generated Content:</strong> This
                  report is generated using artificial intelligence and should not be considered as
                  investment advice. Always conduct your own research and consult with a qualified
                  financial advisor before making investment decisions.
                </p>
                <p>
                  <strong className="text-text-secondary">SEBI Disclaimer:</strong> Alpha Signal
                  is not a SEBI registered investment advisor. The information provided is for
                  educational purposes only and does not constitute financial advice, investment
                  recommendation, or an offer to buy or sell securities.
                </p>
                <p>
                  <strong className="text-text-secondary">Past Performance:</strong> Past
                  performance is not indicative of future results. Stock market investments are
                  subject to market risks. Please read all scheme-related documents carefully
                  before investing.
                </p>
                <p>
                  <strong className="text-text-secondary">Data Accuracy:</strong> While we strive
                  for accuracy, we do not guarantee the completeness or accuracy of the information
                  provided. Market conditions can change rapidly, and data may be delayed or
                  outdated.
                </p>
              </div>
            </div>

            {/* Back to Reports */}
            <div className="mt-6 text-center">
              <Link
                to="/reports"
                className="inline-flex items-center gap-2 px-6 py-3 bg-bg-secondary border border-border-default hover:bg-bg-tertiary hover:border-border-hover text-text-primary font-medium rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                View More Reports
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
};

export default ReportDetail;
