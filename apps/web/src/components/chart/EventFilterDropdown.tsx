/**
 * EventFilterDropdown Component
 *
 * Dropdown for filtering event types on the chart
 * Grouped by category with tier gating (FREE users only see QUARTERLY_RESULT)
 */

import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';
import { useChartStore, useEnabledEventFiltersCount } from '@/store/useChartStore';
import {
  EVENT_CATEGORIES,
  EVENT_TYPE_CONFIG,
  type EventType,
  type EventCategory,
} from '@/constants/eventTypes';
import { useFeatureGate, type SubscriptionTier } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';

interface EventFilterDropdownProps {
  companyId?: string;
  eventCounts?: Record<EventType, number>; // Optional: show count next to each event type
}

/**
 * EventFilterDropdown component for filtering chart events
 */
export const EventFilterDropdown: React.FC<EventFilterDropdownProps> = ({
  companyId,
  eventCounts,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const eventFilters = useChartStore((state) => state.eventFilters);
  const toggleEventFilter = useChartStore((state) => state.toggleEventFilter);
  const setAllEventFilters = useChartStore((state) => state.setAllEventFilters);
  const enabledCount = useEnabledEventFiltersCount();

  // Feature gate check (FREE users only get verified events)
  const { hasAccess, userTier } = useFeatureGate('fundamentals_full'); // Reuse existing gate
  const isFreeUser = userTier === 'FREE';

  // Event types allowed for FREE users
  const FREE_EVENT_TYPES: EventType[] = ['QUARTERLY_RESULT'];

  const handleToggle = (eventType: EventType) => {
    // Check if locked for FREE users
    if (isFreeUser && !FREE_EVENT_TYPES.includes(eventType)) {
      setShowUpgradeModal(true);
      return;
    }

    toggleEventFilter(eventType);
  };

  const handleShowAll = () => {
    if (isFreeUser) {
      // FREE users: only enable allowed types
      setAllEventFilters(false);
      FREE_EVENT_TYPES.forEach((type) => {
        if (!eventFilters[type]) {
          toggleEventFilter(type);
        }
      });
    } else {
      setAllEventFilters(true);
    }
  };

  const handleHideAll = () => {
    setAllEventFilters(false);
  };

  return (
    <>
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors
            ${
              isOpen
                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700/50'
            }
          `}
        >
          Events
          {enabledCount > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
              {enabledCount}
            </span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <div className="absolute top-full left-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-100">Event Filters</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShowAll}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Show All
                  </button>
                  <span className="text-gray-600">|</span>
                  <button
                    onClick={handleHideAll}
                    className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                  >
                    Hide All
                  </button>
                </div>
              </div>

              {/* Category Groups */}
              <div className="py-2">
                {Object.entries(EVENT_CATEGORIES).map(([category, { label, types }]) => (
                  <div key={category} className="mb-2">
                    {/* Category Header */}
                    <div className="px-3 py-1.5 bg-gray-900/50">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                        {label}
                      </h4>
                    </div>

                    {/* Event Type Checkboxes */}
                    <div className="py-1">
                      {types.map((eventType) => {
                        const config = EVENT_TYPE_CONFIG[eventType];
                        const Icon = config.icon;
                        const isEnabled = eventFilters[eventType];
                        const isLocked = isFreeUser && !FREE_EVENT_TYPES.includes(eventType);
                        const count = eventCounts?.[eventType] || 0;

                        return (
                          <button
                            key={eventType}
                            onClick={() => handleToggle(eventType)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700/50 cursor-pointer'}
                              ${isEnabled && !isLocked ? 'bg-gray-700/30' : ''}
                            `}
                            disabled={isLocked && !showUpgradeModal}
                          >
                            {/* Checkbox */}
                            <div
                              className={`
                                flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                                ${
                                  isEnabled && !isLocked
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-gray-600'
                                }
                              `}
                            >
                              {isEnabled && !isLocked && <Check className="w-3 h-3 text-white" />}
                              {isLocked && <Lock className="w-2.5 h-2.5 text-gray-500" />}
                            </div>

                            {/* Icon */}
                            <div
                              className={`
                                flex-shrink-0 w-6 h-6 rounded flex items-center justify-center
                                ${config.color === 'blue' ? 'bg-blue-500/20' : ''}
                                ${config.color === 'green' ? 'bg-green-500/20' : ''}
                                ${config.color === 'red' ? 'bg-red-500/20' : ''}
                                ${config.color === 'purple' ? 'bg-purple-500/20' : ''}
                                ${config.color === 'orange' ? 'bg-orange-500/20' : ''}
                                ${config.color === 'gray' ? 'bg-gray-500/20' : ''}
                              `}
                            >
                              <Icon
                                className={`
                                  w-3.5 h-3.5
                                  ${config.color === 'blue' ? 'text-blue-400' : ''}
                                  ${config.color === 'green' ? 'text-green-400' : ''}
                                  ${config.color === 'red' ? 'text-red-400' : ''}
                                  ${config.color === 'purple' ? 'text-purple-400' : ''}
                                  ${config.color === 'orange' ? 'text-orange-400' : ''}
                                  ${config.color === 'gray' ? 'text-gray-400' : ''}
                                `}
                              />
                            </div>

                            {/* Label */}
                            <span className="flex-1 text-left text-gray-300">{config.label}</span>

                            {/* Count Badge */}
                            {count > 0 && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 text-xs">
                                {count}
                              </span>
                            )}

                            {/* Lock Icon */}
                            {isLocked && (
                              <Lock className="flex-shrink-0 w-3.5 h-3.5 text-yellow-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer with tier info */}
              {isFreeUser && (
                <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-3">
                  <button
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Upgrade to unlock all events
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="chart_events"
          variant="modal"
          requiredTier="PRO"
          message="Unlock all event types on your charts"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};
