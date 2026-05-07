/**
 * Panel Grid Component
 *
 * Layout system for arranging panels on the stock detail page
 */

import React, { ReactNode } from 'react';

interface PanelGridProps {
  children: ReactNode;
  className?: string;
}

interface PanelRowProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

interface PanelColProps {
  children: ReactNode;
  span?: 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Main grid container
 * Applies consistent spacing between panels
 */
export const PanelGrid: React.FC<PanelGridProps> = ({ children, className = '' }) => {
  return <div className={`space-y-4 ${className}`}>{children}</div>;
};

/**
 * Grid row for arranging panels horizontally on desktop
 * Single column on mobile, specified columns on desktop
 */
export const PanelRow: React.FC<PanelRowProps> = ({
  children,
  columns = 1,
  className = '',
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 lg:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1';
    }
  };

  return <div className={`grid ${getGridCols()} gap-4 ${className}`}>{children}</div>;
};

/**
 * Grid column for controlling panel width within a row
 */
export const PanelCol: React.FC<PanelColProps> = ({ children, span = 1, className = '' }) => {
  const getColSpan = () => {
    switch (span) {
      case 1:
        return 'lg:col-span-1';
      case 2:
        return 'lg:col-span-2';
      case 3:
        return 'lg:col-span-3';
      case 4:
        return 'lg:col-span-4';
      default:
        return 'lg:col-span-1';
    }
  };

  return <div className={`${getColSpan()} ${className}`}>{children}</div>;
};

/**
 * Specialized layouts for common patterns
 */

// 2-column layout for side-by-side panels (e.g., Bull/Bear cases)
export const TwoColumnLayout: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <PanelRow columns={2} className={className}>{children}</PanelRow>;
};

// 3-column layout for metric grids
export const ThreeColumnLayout: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <PanelRow columns={3} className={className}>{children}</PanelRow>;
};

// Full-width single panel
export const FullWidthPanel: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`w-full ${className}`}>{children}</div>;
};

export default PanelGrid;
