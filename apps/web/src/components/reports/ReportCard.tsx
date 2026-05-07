/**
 * Report Card Component
 *
 * Reusable card for displaying report preview in library grid
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Calendar, TrendingUp } from 'lucide-react';

interface ReportCardProps {
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
  viewCount: number;
  featured?: boolean;
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

export const ReportCard: React.FC<ReportCardProps> = ({
  title,
  slug,
  reportType,
  sector,
  summary,
  publishedAt,
  viewCount,
  featured = false,
}) => {
  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const truncatedSummary = summary.length > (featured ? 200 : 100)
    ? `${summary.substring(0, featured ? 200 : 100)}...`
    : summary;

  const sectorColor = sector ? SECTOR_COLORS[sector.name] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30' : '';

  if (featured) {
    return (
      <Link
        to={`/reports/${slug}`}
        className="block group lg:col-span-3 bg-bg-secondary border-l-4 border-accent-blue rounded-lg overflow-hidden hover:bg-bg-tertiary transition-all duration-200"
      >
        <div className="p-6">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-accent-blue/20 text-accent-blue rounded-full text-xs font-semibold border border-accent-blue/30">
              MACRO WEEKLY
            </span>
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Eye className="w-3 h-3" />
              {viewCount.toLocaleString()} views
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-text-primary mb-3 group-hover:text-accent-blue transition-colors">
            {title}
          </h3>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>

          {/* Summary */}
          <p className="text-text-secondary leading-relaxed mb-4">
            {truncatedSummary}
          </p>

          {/* CTA */}
          <div className="flex items-center gap-2 text-accent-blue font-medium text-sm">
            <span>Read Full Report</span>
            <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/reports/${slug}`}
      className="block group bg-bg-secondary border border-border-default rounded-lg overflow-hidden hover:border-border-hover hover:bg-bg-tertiary transition-all duration-200"
    >
      <div className="p-5">
        {/* Badge and Views */}
        <div className="flex items-center justify-between mb-3">
          {reportType === 'SECTOR' && sector ? (
            <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${sectorColor}`}>
              {sector.name}
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-accent-blue/20 text-accent-blue rounded text-xs font-semibold border border-accent-blue/30">
              MACRO
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Eye className="w-3 h-3" />
            {viewCount}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-accent-blue transition-colors">
          {title}
        </h3>

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-3">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>

        {/* Summary */}
        <p className="text-sm text-text-secondary leading-relaxed mb-4 line-clamp-2">
          {truncatedSummary}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-accent-blue font-medium text-sm">
          <span>Read</span>
          <TrendingUp className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
