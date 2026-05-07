/**
 * Timeline Infographic Component
 *
 * Beautiful horizontal scrollable timeline showing company's journey
 * Subway map style with color-coded events
 */

import React, { useRef, useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  Award,
  AlertTriangle,
  Users,
  DollarSign,
  ShoppingCart,
  Zap,
  Globe,
  Flag,
  Star,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TimelineEvent {
  date: string; // ISO date string
  title: string;
  description?: string;
  type: EventType;
  impact?: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: EventCategory;
}

type EventType =
  | 'POSITIVE'    // 🟢 Green - Achievements, growth
  | 'NEUTRAL'     // 🔵 Blue - Milestones, changes
  | 'IMPORTANT'   // 🟡 Yellow - Major events
  | 'CHALLENGE';  // 🔴 Red - Difficulties

type EventCategory =
  | 'FOUNDING'
  | 'IPO'
  | 'EXPANSION'
  | 'PRODUCT_LAUNCH'
  | 'ACQUISITION'
  | 'LEADERSHIP'
  | 'ACHIEVEMENT'
  | 'FINANCIAL'
  | 'CHALLENGE'
  | 'REGULATORY'
  | 'MILESTONE';

interface TimelineInfographicProps {
  events: TimelineEvent[];
  companyName: string;
  foundedYear?: number;
}

export const TimelineInfographic: React.FC<TimelineInfographicProps> = ({
  events,
  companyName,
  foundedYear,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Update scroll button states
  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollButtons();
    container.addEventListener('scroll', updateScrollButtons);
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [events]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 400;
    const newScrollLeft = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'POSITIVE':
        return {
          bg: 'bg-signal-green/20',
          border: 'border-signal-green',
          text: 'text-signal-green',
          glow: 'shadow-signal-green/50',
        };
      case 'NEUTRAL':
        return {
          bg: 'bg-accent-blue/20',
          border: 'border-accent-blue',
          text: 'text-accent-blue',
          glow: 'shadow-accent-blue/50',
        };
      case 'IMPORTANT':
        return {
          bg: 'bg-signal-yellow/20',
          border: 'border-signal-yellow',
          text: 'text-signal-yellow',
          glow: 'shadow-signal-yellow/50',
        };
      case 'CHALLENGE':
        return {
          bg: 'bg-signal-red/20',
          border: 'border-signal-red',
          text: 'text-signal-red',
          glow: 'shadow-signal-red/50',
        };
    }
  };

  const getEventIcon = (category?: EventCategory) => {
    const iconClass = 'w-4 h-4';
    switch (category) {
      case 'FOUNDING':
      case 'MILESTONE':
        return <Flag className={iconClass} />;
      case 'IPO':
      case 'FINANCIAL':
        return <DollarSign className={iconClass} />;
      case 'EXPANSION':
        return <Globe className={iconClass} />;
      case 'PRODUCT_LAUNCH':
        return <ShoppingCart className={iconClass} />;
      case 'ACQUISITION':
        return <Target className={iconClass} />;
      case 'LEADERSHIP':
        return <Users className={iconClass} />;
      case 'ACHIEVEMENT':
        return <Award className={iconClass} />;
      case 'CHALLENGE':
        return <AlertTriangle className={iconClass} />;
      case 'REGULATORY':
        return <Building2 className={iconClass} />;
      default:
        return <Star className={iconClass} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-12">
        <Flag className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">No timeline events available</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          {companyName}'s Journey
        </h3>
        <p className="text-text-secondary">
          {foundedYear && `Founded ${foundedYear} • `}
          {sortedEvents.length} key milestone{sortedEvents.length !== 1 ? 's' : ''} in company history
        </p>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-blue-400 rounded-full p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-purple-400 rounded-full p-3 shadow-xl hover:shadow-2xl hover:scale-110 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Scrollable Timeline */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-border-default scrollbar-track-bg-tertiary pb-4"
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="relative inline-flex items-center min-w-full px-8 py-12">
            {/* Timeline Line */}
            <div className="absolute left-0 right-0 h-1 top-1/2 -translate-y-1/2">
              <div className="h-full bg-gradient-to-r from-blue-900/30 via-purple-500/60 to-pink-900/30 rounded-full shadow-lg" />
            </div>

            {/* Events */}
            <div className="relative flex items-center gap-4 min-w-max">
              {sortedEvents.map((event, index) => {
                const colors = getEventColor(event.type);
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={index}
                    className="relative flex flex-col items-center"
                    style={{ minWidth: '180px', maxWidth: '200px' }}
                  >
                    {/* Event Circle */}
                    <div
                      className="relative z-10 cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {/* Outer Glow Ring (on hover) */}
                      {isHovered && (
                        <div
                          className={`absolute inset-0 -m-3 rounded-full ${colors.bg} ${colors.glow} blur-xl animate-pulse`}
                        />
                      )}

                      {/* Circle */}
                      <div
                        className={`
                          relative w-16 h-16 rounded-full border-4 ${colors.border} ${colors.bg}
                          flex items-center justify-center transition-all duration-300
                          ${isHovered ? 'scale-125 shadow-2xl' : 'scale-100 shadow-lg'}
                        `}
                      >
                        <div className={colors.text}>
                          {getEventIcon(event.category)}
                        </div>
                      </div>

                      {/* Connection Line to Text */}
                      <div
                        className={`absolute top-full left-1/2 -translate-x-1/2 w-0.5 ${colors.border} transition-all duration-300`}
                        style={{ height: isHovered ? '60px' : '40px' }}
                      />
                    </div>

                    {/* Event Card */}
                    <div
                      className={`
                        relative mt-12 w-full bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 rounded-xl p-4
                        transition-all duration-300
                        ${isHovered
                          ? `${colors.border} ${colors.glow} shadow-2xl scale-105 -translate-y-2`
                          : 'border-border-default shadow-md'
                        }
                      `}
                    >
                      {/* Date Badge */}
                      <div
                        className={`
                          absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold
                          ${colors.bg} ${colors.border} ${colors.text} border whitespace-nowrap
                        `}
                      >
                        {formatDate(event.date)}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-text-primary mb-2 line-clamp-2 mt-2">
                        {event.title}
                      </h4>

                      {/* Description (on hover) */}
                      {isHovered && event.description && (
                        <p className="text-xs text-text-secondary line-clamp-3 animate-fade-in">
                          {event.description}
                        </p>
                      )}

                      {/* Impact Badge */}
                      {event.impact && (
                        <div className="mt-2 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-signal-yellow" />
                          <span className="text-xs text-text-muted">
                            {event.impact} Impact
                          </span>
                        </div>
                      )}

                      {/* Type Indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${colors.border} ${colors.bg} border-2`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 bg-gradient-to-r from-bg-secondary to-bg-tertiary border-2 border-border-default rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <span className="text-text-primary font-semibold">Legend:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-signal-green/30 border-2 border-signal-green shadow-sm" />
            <span className="text-text-secondary font-medium">Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-accent-blue/30 border-2 border-accent-blue shadow-sm" />
            <span className="text-text-secondary font-medium">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-signal-yellow/30 border-2 border-signal-yellow shadow-sm" />
            <span className="text-text-secondary font-medium">Important</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-signal-red/30 border-2 border-signal-red shadow-sm" />
            <span className="text-text-secondary font-medium">Challenge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to categorize events automatically
export function categorizeTimelineEvent(
  eventType: string,
  title: string,
  description?: string
): { type: EventType; category: EventCategory } {
  const titleLower = title.toLowerCase();
  const descLower = description?.toLowerCase() || '';
  const combined = titleLower + ' ' + descLower;

  // Founding
  if (combined.includes('found') || combined.includes('establish') || combined.includes('inception')) {
    return { type: 'POSITIVE', category: 'FOUNDING' };
  }

  // IPO
  if (combined.includes('ipo') || combined.includes('list') || combined.includes('public offering')) {
    return { type: 'IMPORTANT', category: 'IPO' };
  }

  // Expansion
  if (combined.includes('expand') || combined.includes('new office') || combined.includes('new facility')) {
    return { type: 'POSITIVE', category: 'EXPANSION' };
  }

  // Product Launch
  if (combined.includes('launch') || combined.includes('release') || combined.includes('new product')) {
    return { type: 'IMPORTANT', category: 'PRODUCT_LAUNCH' };
  }

  // Acquisition
  if (combined.includes('acqui') || combined.includes('merge') || combined.includes('takeover')) {
    return { type: 'IMPORTANT', category: 'ACQUISITION' };
  }

  // Leadership
  if (combined.includes('ceo') || combined.includes('chairman') || combined.includes('director') || combined.includes('appoint')) {
    return { type: 'NEUTRAL', category: 'LEADERSHIP' };
  }

  // Achievement
  if (combined.includes('award') || combined.includes('recognition') || combined.includes('milestone')) {
    return { type: 'POSITIVE', category: 'ACHIEVEMENT' };
  }

  // Challenge
  if (combined.includes('loss') || combined.includes('controversy') || combined.includes('scandal') || combined.includes('crisis')) {
    return { type: 'CHALLENGE', category: 'CHALLENGE' };
  }

  // Regulatory
  if (combined.includes('sebi') || combined.includes('regulation') || combined.includes('compliance')) {
    return { type: 'NEUTRAL', category: 'REGULATORY' };
  }

  // Financial (positive or negative based on keywords)
  if (combined.includes('profit') || combined.includes('revenue') || combined.includes('earnings')) {
    if (combined.includes('loss') || combined.includes('decline') || combined.includes('down')) {
      return { type: 'CHALLENGE', category: 'FINANCIAL' };
    }
    return { type: 'POSITIVE', category: 'FINANCIAL' };
  }

  // Default
  return { type: 'NEUTRAL', category: 'MILESTONE' };
}

export default TimelineInfographic;

// Add to your global CSS or Tailwind config for smooth animations
// @keyframes fade-in {
//   from { opacity: 0; transform: translateY(10px); }
//   to { opacity: 1; transform: translateY(0); }
// }
// .animate-fade-in { animation: fade-in 0.3s ease-out; }
