/**
 * Loading Skeleton Component
 *
 * Pulsing dark rectangles for loading states
 */

import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'default' | 'card' | 'text' | 'circle' | 'table';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'default',
  count = 1,
  className = '',
}) => {
  const baseClasses = 'bg-bg-tertiary animate-pulse rounded';

  const variantClasses = {
    default: 'h-4 w-full',
    card: 'h-64 w-full rounded-lg',
    text: 'h-4',
    circle: 'rounded-full',
    table: 'h-12 w-full',
  };

  const renderSkeleton = () => {
    const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
    return <div className={classes} />;
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

// Preset loading components for common use cases
export const LoadingCard: React.FC = () => (
  <div className="bg-bg-secondary border border-border-default rounded-lg p-6 space-y-4">
    <LoadingSkeleton variant="text" className="w-1/3" />
    <LoadingSkeleton variant="text" className="w-2/3" />
    <LoadingSkeleton variant="default" className="h-32" />
  </div>
);

export const LoadingTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
    {/* Header */}
    <div className="border-b border-border-default p-4">
      <LoadingSkeleton variant="text" className="w-1/4" />
    </div>
    {/* Rows */}
    <div className="divide-y divide-border-default">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="p-4">
          <LoadingSkeleton variant="table" />
        </div>
      ))}
    </div>
  </div>
);

export const LoadingList: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div
        key={index}
        className="bg-bg-secondary border border-border-default rounded-lg p-4 flex items-center gap-4"
      >
        <LoadingSkeleton variant="circle" className="w-12 h-12 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" className="w-1/3" />
          <LoadingSkeleton variant="text" className="w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export const LoadingStats: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {Array.from({ length: 3 }).map((_, index) => (
      <div
        key={index}
        className="bg-bg-secondary border border-border-default rounded-lg p-6 space-y-3"
      >
        <LoadingSkeleton variant="text" className="w-1/2" />
        <LoadingSkeleton variant="text" className="w-3/4 h-8" />
        <LoadingSkeleton variant="text" className="w-1/3" />
      </div>
    ))}
  </div>
);

export const LoadingPage: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Header */}
    <div className="space-y-2">
      <LoadingSkeleton variant="text" className="w-1/3 h-8" />
      <LoadingSkeleton variant="text" className="w-1/2" />
    </div>

    {/* Stats */}
    <LoadingStats />

    {/* Main Content */}
    <div className="space-y-4">
      <LoadingSkeleton variant="card" />
      <LoadingSkeleton variant="card" />
    </div>
  </div>
);
