/**
 * EventMarkers Component
 *
 * Renders event markers on the chart as ReferenceDot with icons, colors, and impact arrows.
 * Stacks multiple events on the same date with vertical offset.
 */

import React, { useMemo } from 'react';
import { ReferenceDot } from 'recharts';
import { EVENT_ICON_MAP, EVENT_COLOR_MAP, getImpactDisplay } from '@/constants/eventTypes';
import type { ChartEvent } from '@/hooks/useChartEvents';
import type { ChartDataPoint } from '@/utils/chartCoordinates';

interface EventMarkersProps {
  events: ChartEvent[];
  chartData: ChartDataPoint[];
  onEventClick?: (event: ChartEvent) => void;
  yAxisDomain: [number, number]; // [min, max] price
}

/**
 * EventMarkers component for rendering events on the chart
 */
export const EventMarkers: React.FC<EventMarkersProps> = ({
  events,
  chartData,
  onEventClick,
  yAxisDomain,
}) => {
  // Group events by date for stacking
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ChartEvent[]> = {};

    events.forEach((event) => {
      const date = event.eventDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  }, [events]);

  // Create map of date to price for positioning
  const dateToPrice = useMemo(() => {
    const map: Record<string, number> = {};

    chartData.forEach((point) => {
      map[point.rawTime] = point.high; // Use high price for marker placement
    });

    return map;
  }, [chartData]);

  // Calculate price range for offset percentage
  const priceRange = yAxisDomain[1] - yAxisDomain[0];

  // Render markers
  return (
    <>
      {Object.entries(eventsByDate).map(([date, dateEvents]) => {
        const basePrice = dateToPrice[date];

        // Skip if date not found in chart data
        if (!basePrice) return null;

        // Render each event with stacking offset
        return dateEvents.map((event, stackIndex) => {
          const Icon = EVENT_ICON_MAP[event.eventType];
          const colors = EVENT_COLOR_MAP[event.eventType];

          // Calculate vertical offset for stacking (2% per event)
          const offsetPercent = stackIndex * 0.02;
          const offsetPrice = priceRange * offsetPercent;
          const yValue = basePrice + offsetPrice;

          // Impact display
          const impact = event.impactAssessment
            ? getImpactDisplay(event.impactAssessment)
            : null;

          return (
            <ReferenceDot
              key={`${event.id}-${stackIndex}`}
              x={date}
              y={yValue}
              r={8}
              fill={colors.svgFill}
              stroke={colors.svgStroke}
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              onClick={() => onEventClick?.(event)}
              // Custom shape with icon and impact arrow
              shape={(props: any) => {
                const { cx, cy } = props;

                return (
                  <g>
                    {/* Connecting line for stacked events */}
                    {stackIndex > 0 && (
                      <line
                        x1={cx}
                        y1={cy - 10}
                        x2={cx}
                        y2={cy - offsetPrice * 0.8}
                        stroke={colors.svgStroke}
                        strokeWidth={1}
                        strokeDasharray="2,2"
                        opacity={0.5}
                      />
                    )}

                    {/* Event marker circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={10}
                      fill={colors.svgFill}
                      stroke={colors.svgStroke}
                      strokeWidth={2}
                      className="transition-all duration-200 hover:r-12 hover:stroke-width-3"
                    />

                    {/* Event icon (using Lucide icon as foreignObject) */}
                    <foreignObject
                      x={cx - 8}
                      y={cy - 8}
                      width={16}
                      height={16}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div className="flex items-center justify-center">
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                    </foreignObject>

                    {/* Impact arrow */}
                    {impact && (
                      <text
                        x={cx + 12}
                        y={cy + 4}
                        fontSize={12}
                        fontWeight="bold"
                        fill={impact.color}
                        className="pointer-events-none"
                      >
                        {impact.icon}
                      </text>
                    )}

                    {/* Stack count badge for multiple events */}
                    {stackIndex === dateEvents.length - 1 && dateEvents.length > 1 && (
                      <g>
                        <circle cx={cx + 10} cy={cy - 10} r={8} fill="#3b82f6" />
                        <text
                          x={cx + 10}
                          y={cy - 10}
                          fontSize={10}
                          fontWeight="bold"
                          fill="white"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {dateEvents.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              }}
            />
          );
        });
      })}
    </>
  );
};

/**
 * Helper component for event marker with hover tooltip
 * (Alternative simpler implementation using just dots)
 */
export const SimpleEventMarker: React.FC<{
  event: ChartEvent;
  x: string;
  y: number;
  onEventClick?: (event: ChartEvent) => void;
}> = ({ event, x, y, onEventClick }) => {
  const colors = EVENT_COLOR_MAP[event.eventType];

  return (
    <ReferenceDot
      x={x}
      y={y}
      r={6}
      fill={colors.bg}
      stroke={colors.border}
      strokeWidth={2}
      style={{ cursor: 'pointer' }}
      onClick={() => onEventClick?.(event)}
    />
  );
};
