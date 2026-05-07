/**
 * GatedContent Component
 *
 * Wraps tier-gated content with blur preview and upgrade prompt overlay
 */

import { ReactNode } from 'react';
import { useFeatureGate, FeatureKey } from '../../hooks/useFeatureGate';
import { UpgradePrompt } from './UpgradePrompt';

interface GatedContentProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showPreview?: boolean; // Show blurred preview of content
  upgradeVariant?: 'inline' | 'modal';
}

export function GatedContent({
  feature,
  children,
  fallback,
  showPreview = true,
  upgradeVariant = 'inline',
}: GatedContentProps) {
  const { hasAccess, requiredTier, showUpgrade } = useFeatureGate(feature);

  // User has access - render content normally
  if (hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (!showUpgrade) {
    return <>{children}</>;
  }

  // Show blur preview with upgrade prompt overlay
  if (showPreview) {
    return (
      <div className="relative">
        {/* Blurred content preview */}
        <div
          className="pointer-events-none select-none"
          style={{
            filter: 'blur(8px)',
            opacity: 0.5,
          }}
          aria-hidden="true"
        >
          {children}
        </div>

        {/* Upgrade prompt overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-2xl px-4">
            <UpgradePrompt
              feature={feature}
              variant={upgradeVariant}
              requiredTier={requiredTier as 'PRO' | 'PREMIUM'}
            />
          </div>
        </div>
      </div>
    );
  }

  // No preview - show upgrade prompt or fallback
  return (
    <>
      {fallback || (
        <UpgradePrompt
          feature={feature}
          variant={upgradeVariant}
          requiredTier={requiredTier as 'PRO' | 'PREMIUM'}
        />
      )}
    </>
  );
}
