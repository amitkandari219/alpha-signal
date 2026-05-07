/**
 * LockBadge Component
 *
 * Shows a small lock icon with "PRO" or "PREMIUM" badge for locked features
 */

import React from 'react';
import { Lock } from 'lucide-react';

interface LockBadgeProps {
  tier?: 'PRO' | 'PREMIUM';
  size?: 'sm' | 'md';
  className?: string;
}

export const LockBadge: React.FC<LockBadgeProps> = ({
  tier = 'PRO',
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] gap-0.5' : 'text-xs gap-1';
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <span
      className={`
        inline-flex items-center ${sizeClasses}
        text-signal-purple font-medium
        ${className}
      `}
      title={`${tier} feature`}
    >
      <Lock className={iconSize} />
      <span>{tier}</span>
    </span>
  );
};
