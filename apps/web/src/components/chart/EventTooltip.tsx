/**
 * EventTooltip Component
 *
 * Floating card that appears on event marker hover, showing event details
 * with click-to-pin functionality
 */

import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { EVENT_ICON_MAP, EVENT_TYPE_CONFIG, getImpactDisplay } from '@/constants/eventTypes';
import type { ChartEvent } from '@/hooks/useChartEvents';
import { format } from 'date-fns';

interface EventTooltipProps {
  event: ChartEvent | null;
  position?: { x: number; y: number };
  isPinned?: boolean;
  onClose?: () => void;
  onViewInTimeline?: (eventId: string) => void;
}

/**
 * EventTooltip component for displaying event details
 */
export const EventTooltip: React.FC<EventTooltipProps> = ({
  event,
  position,
  isPinned = false,
  onClose,
  onViewInTimeline,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [event]);

  if (!event || !isVisible) return null;

  const Icon = EVENT_ICON_MAP[event.eventType];
  const config = EVENT_TYPE_CONFIG[event.eventType];
  const impact = event.impactAssessment ? getImpactDisplay(event.impactAssessment) : null;

  // Format date
  const formattedDate = format(new Date(event.eventDate), 'dd MMM yyyy');

  // Calculate tooltip position (avoid going off-screen)
  const tooltipStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: Math.min(position.x + 10, window.innerWidth - 320),
        top: Math.min(position.y + 10, window.innerHeight - 300),
        zIndex: 1000,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      };

  return (
    <>
      {/* Backdrop for pinned mode */}
      {isPinned && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
          onClick={onClose}
        />
      )}

      {/* Tooltip card */}
      <div
        style={tooltipStyle}
        className={`
          w-80 rounded-lg shadow-xl border
          bg-white dark:bg-gray-800
          border-gray-200 dark:border-gray-700
          ${isPinned ? 'z-[1000]' : 'z-50'}
          ${isPinned ? 'animate-in fade-in zoom-in-95' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div
            className={`
              flex items-center justify-center w-10 h-10 rounded-lg
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
                w-5 h-5
                ${config.color === 'blue' ? 'text-blue-500' : ''}
                ${config.color === 'green' ? 'text-green-500' : ''}
                ${config.color === 'red' ? 'text-red-500' : ''}
                ${config.color === 'purple' ? 'text-purple-500' : ''}
                ${config.color === 'orange' ? 'text-orange-500' : ''}
                ${config.color === 'gray' ? 'text-gray-500' : ''}
              `}
            />
          </div>

          {/* Title and close button */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
              {event.eventTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formattedDate}
            </p>
          </div>

          {/* Close button (only in pinned mode) */}
          {isPinned && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Event type badge */}
          <div className="flex items-center gap-2">
            <span
              className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${config.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                ${config.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                ${config.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                ${config.color === 'purple' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : ''}
                ${config.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : ''}
                ${config.color === 'gray' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
              `}
            >
              {config.label}
            </span>

            {/* Impact badge */}
            {impact && (
              <span
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${impact.label === 'Positive' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  ${impact.label === 'Negative' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                  ${impact.label === 'Neutral' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' : ''}
                `}
              >
                {impact.icon} {impact.label}
              </span>
            )}

            {/* Verified badge */}
            {event.isVerified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
              {event.description}
            </p>
          )}

          {/* Source URL */}
          {event.sourceUrl && (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View Source
            </a>
          )}
        </div>

        {/* Footer - View in Timeline */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewInTimeline?.(event.id)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            View in Timeline
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
};

/**
 * Hook to manage event tooltip state
 */
export function useEventTooltip() {
  const [hoveredEvent, setHoveredEvent] = useState<ChartEvent | null>(null);
  const [pinnedEvent, setPinnedEvent] = useState<ChartEvent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | undefined>();

  const handleEventHover = (event: ChartEvent | null, position?: { x: number; y: number }) => {
    if (!pinnedEvent) {
      setHoveredEvent(event);
      setTooltipPosition(position);
    }
  };

  const handleEventClick = (event: ChartEvent) => {
    setPinnedEvent(event);
    setHoveredEvent(null);
  };

  const handleClose = () => {
    setPinnedEvent(null);
    setHoveredEvent(null);
  };

  const activeEvent = pinnedEvent || hoveredEvent;
  const isPinned = !!pinnedEvent;

  return {
    activeEvent,
    isPinned,
    tooltipPosition,
    handleEventHover,
    handleEventClick,
    handleClose,
  };
}
