/**
 * Report Card Skeleton
 *
 * Loading skeleton for report cards
 */

import React from 'react';

export const ReportCardSkeleton: React.FC = () => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden animate-pulse">
      <div className="p-5">
        {/* Badge and Views */}
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 w-20 bg-bg-tertiary rounded"></div>
          <div className="h-4 w-16 bg-bg-tertiary rounded"></div>
        </div>

        {/* Title */}
        <div className="space-y-2 mb-3">
          <div className="h-5 w-full bg-bg-tertiary rounded"></div>
          <div className="h-5 w-3/4 bg-bg-tertiary rounded"></div>
        </div>

        {/* Date */}
        <div className="h-4 w-32 bg-bg-tertiary rounded mb-3"></div>

        {/* Summary */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-bg-tertiary rounded"></div>
          <div className="h-4 w-5/6 bg-bg-tertiary rounded"></div>
        </div>

        {/* CTA */}
        <div className="h-4 w-16 bg-bg-tertiary rounded"></div>
      </div>
    </div>
  );
};
