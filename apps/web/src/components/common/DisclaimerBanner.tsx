/**
 * Global Disclaimer Banner - SEBI Compliance
 *
 * Displays mandatory legal disclaimer on every page
 * Dismissible per session (stored in sessionStorage)
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const DISCLAIMER_KEY = 'alpha_signal_disclaimer_dismissed';

export function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner in this session
    const isDismissed = sessionStorage.getItem(DISCLAIMER_KEY) === 'true';
    setIsVisible(!isDismissed);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem(DISCLAIMER_KEY, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed">
              <span className="font-semibold text-white">Legal Disclaimer:</span>{' '}
              Alpha Signal provides AI-generated informational content for educational purposes only.
              This is <span className="font-semibold text-amber-400">NOT investment advice</span> or a
              recommendation to buy, sell, or hold any security. Past performance does not guarantee
              future results. Always consult a SEBI-registered financial advisor before making investment decisions.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
            aria-label="Dismiss disclaimer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
