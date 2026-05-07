/**
 * Company Logo Component
 *
 * Displays company logo with multiple fallback sources
 * Falls back to styled initial if logo not available
 */

import React, { useState } from 'react';
import clsx from 'clsx';

interface CompanyLogoProps {
  symbol: string;
  companyName: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  symbol,
  companyName,
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const [currentSource, setCurrentSource] = useState(0);

  // Multiple logo sources to try in order
  const logoSources = [
    // 1. Logo.dev (free, good coverage)
    `https://img.logo.dev/${symbol.toLowerCase()}.com?token=pk_X-VqOyraQ2GNHYJXkBmMw`,
    // 2. Clearbit (good coverage for Indian companies)
    `https://logo.clearbit.com/${symbol.toLowerCase()}.com`,
    // 3. Google S2 favicon (decent fallback)
    `https://www.google.com/s2/favicons?domain=${symbol.toLowerCase()}.com&sz=128`,
  ];

  const sizeClasses = {
    sm: 'w-10 h-10 text-base',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
    xl: 'w-24 h-24 text-4xl',
  };

  // Get logo color based on first letter
  const getLogoColor = (name: string) => {
    const colors = [
      'from-signal-purple to-accent-blue',
      'from-signal-green to-chart-up',
      'from-signal-yellow to-chart-down',
      'from-accent-blue to-signal-purple',
      'from-signal-red to-signal-purple',
      'from-chart-up to-signal-green',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleImageError = () => {
    if (currentSource < logoSources.length - 1) {
      // Try next source
      setCurrentSource(currentSource + 1);
    } else {
      // All sources failed, show fallback
      setImageError(true);
    }
  };

  // Fallback: Styled initial letter
  if (imageError || !symbol) {
    return (
      <div
        className={clsx(
          'rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0',
          getLogoColor(companyName),
          sizeClasses[size],
          className
        )}
      >
        <span className="text-white font-bold">
          {companyName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  // Try to load company logo
  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center flex-shrink-0 bg-white overflow-hidden border border-border-default',
        sizeClasses[size],
        className
      )}
    >
      <img
        src={logoSources[currentSource]}
        alt={`${companyName} logo`}
        className="w-full h-full object-contain p-1"
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

// Compact version for tables/lists
export const CompanyLogoCompact: React.FC<{
  symbol: string;
  companyName: string;
  className?: string;
}> = ({ symbol, companyName, className }) => {
  return (
    <CompanyLogo
      symbol={symbol}
      companyName={companyName}
      size="sm"
      className={className}
    />
  );
};
