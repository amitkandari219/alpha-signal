/**
 * Timeline Tab Component
 *
 * Displays stock events in a vertical timeline with filters, search, and period summaries
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Award,
  DollarSign,
  Users,
  FileText,
  AlertTriangle,
  Building,
  Briefcase,
  Package,
  Scale,
  Newspaper,
  MessageSquare,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { UpgradePrompt } from '../common/UpgradePrompt';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Event type definitions (28 types from schema)
const EVENT_TYPES = [
  { value: 'QUARTERLY_RESULT', label: 'Quarterly Result', icon: FileText },
  { value: 'ANNUAL_RESULT', label: 'Annual Result', icon: FileText },
  { value: 'MANAGEMENT_CHANGE', label: 'Management Change', icon: Users },
  { value: 'DIVIDEND', label: 'Dividend', icon: DollarSign },
  { value: 'STOCK_SPLIT', label: 'Stock Split', icon: TrendingUp },
  { value: 'BONUS', label: 'Bonus', icon: Award },
  { value: 'RIGHTS_ISSUE', label: 'Rights Issue', icon: FileText },
  { value: 'ACQUISITION', label: 'Acquisition', icon: Building },
  { value: 'DIVESTITURE', label: 'Divestiture', icon: Building },
  { value: 'CAPEX_ANNOUNCEMENT', label: 'Capex Announcement', icon: DollarSign },
  { value: 'ORDER_WIN', label: 'Order Win', icon: Award },
  { value: 'ORDER_LOSS', label: 'Order Loss', icon: AlertTriangle },
  { value: 'PRODUCT_LAUNCH', label: 'Product Launch', icon: Package },
  { value: 'PLANT_EXPANSION', label: 'Plant Expansion', icon: Building },
  { value: 'REGULATORY_ACTION', label: 'Regulatory Action', icon: Scale },
  { value: 'SEBI_NOTICE', label: 'SEBI Notice', icon: AlertTriangle },
  { value: 'CREDIT_RATING_CHANGE', label: 'Credit Rating Change', icon: TrendingUp },
  { value: 'AUDITOR_CHANGE', label: 'Auditor Change', icon: Users },
  { value: 'PROMOTER_CHANGE', label: 'Promoter Change', icon: Users },
  { value: 'BULK_DEAL', label: 'Bulk Deal', icon: DollarSign },
  { value: 'BLOCK_DEAL', label: 'Block Deal', icon: DollarSign },
  { value: 'PLEDGE_CHANGE', label: 'Pledge Change', icon: AlertTriangle },
  { value: 'SECTOR_POLICY', label: 'Sector Policy', icon: Briefcase },
  { value: 'GOVERNMENT_ORDER', label: 'Government Order', icon: Scale },
  { value: 'CONCALL_HIGHLIGHT', label: 'Concall Highlight', icon: MessageSquare },
  { value: 'ANALYST_ACTION', label: 'Analyst Action', icon: TrendingUp },
  { value: 'MEDIA_COVERAGE', label: 'Media Coverage', icon: Newspaper },
  { value: 'LITIGATION_UPDATE', label: 'Litigation Update', icon: Scale },
  { value: 'AGM_EGM', label: 'AGM/EGM', icon: Users },
  { value: 'BOARD_MEETING', label: 'Board Meeting', icon: Users },
  { value: 'OTHER', label: 'Other', icon: FileText },
] as const;

type EventType = typeof EVENT_TYPES[number]['value'];
type ImpactType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

interface TimelineEvent {
  id: string;
  eventType: EventType;
  eventDate: string;
  title: string;
  summary: string;
  impactAssessment: 'VERY_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'VERY_NEGATIVE';
  impactAreas: string[];
  sourceUrls: string[];
  sourceNames: string[];
  tags: string[];
  fiscalYear?: number;
  fiscalQuarter?: number;
  detailedContent?: any;
}

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'MAJOR_ACHIEVEMENT' | 'SIGNIFICANT_SETBACK' | 'STRATEGIC_SHIFT' | 'MARKET_MILESTONE' | 'OPERATIONAL_MILESTONE';
}

interface PeriodSummary {
  period: string;
  summary: string;
  eventCount: number;
  avgSentiment: number;
  scoreChanges: {
    quality: number;
    growth: number;
    momentum: number;
  };
}

interface TimelineTabProps {
  symbol: string;
}

const TimelineTab: React.FC<TimelineTabProps> = ({ symbol }) => {
  const { user } = useAuthStore();
  const userTier = user?.tier || 'FREE';

  // Filter states
  const [selectedEventTypes, setSelectedEventTypes] = useState<EventType[]>([]);
  const [impactFilter, setImpactFilter] = useState<'ALL' | ImpactType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);

  // Mock data - Replace with actual API call
  const mockEvents: TimelineEvent[] = useMemo(() => generateMockEvents(symbol), [symbol]);
  const mockMilestones: Milestone[] = useMemo(() => generateMockMilestones(symbol), [symbol]);
  const mockPeriodSummary: PeriodSummary = useMemo(() => generateMockPeriodSummary(), []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = mockEvents;

    // Event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter((e) => selectedEventTypes.includes(e.eventType));
    }

    // Impact filter
    if (impactFilter !== 'ALL') {
      filtered = filtered.filter((e) => {
        const impact = e.impactAssessment;
        if (impactFilter === 'POSITIVE') {
          return impact === 'VERY_POSITIVE' || impact === 'POSITIVE';
        } else if (impactFilter === 'NEGATIVE') {
          return impact === 'VERY_NEGATIVE' || impact === 'NEGATIVE';
        } else {
          return impact === 'NEUTRAL';
        }
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(query) ||
          e.summary.toLowerCase().includes(query) ||
          e.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((e) => new Date(e.eventDate) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      filtered = filtered.filter((e) => new Date(e.eventDate) <= new Date(dateRange.to));
    }

    return filtered;
  }, [mockEvents, selectedEventTypes, impactFilter, searchQuery, dateRange]);

  // Tier gating - FREE users see only 5 events
  const displayEvents = userTier === 'FREE' ? filteredEvents.slice(0, 5) : filteredEvents.slice(0, visibleCount);
  const hasMore = filteredEvents.length > visibleCount;

  // Toggle event expansion
  const toggleEventExpansion = useCallback((eventId: string) => {
    setExpandedEvents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  }, []);

  // Toggle event type selection
  const toggleEventType = (type: EventType) => {
    setSelectedEventTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // Get impact badge style
  const getImpactBadgeStyle = (impact: string) => {
    switch (impact) {
      case 'VERY_POSITIVE':
        return 'bg-signal-green/20 text-signal-green border-signal-green';
      case 'POSITIVE':
        return 'bg-chart-up/20 text-chart-up border-chart-up';
      case 'NEGATIVE':
        return 'bg-chart-down/20 text-chart-down border-chart-down';
      case 'VERY_NEGATIVE':
        return 'bg-signal-red/20 text-signal-red border-signal-red';
      default:
        return 'bg-text-muted/20 text-text-muted border-text-muted';
    }
  };

  // Get impact icon
  const getImpactIcon = (impact: string) => {
    if (impact.includes('POSITIVE')) return TrendingUp;
    if (impact.includes('NEGATIVE')) return TrendingDown;
    return Minus;
  };

  // Get event icon
  const getEventIcon = (eventType: EventType) => {
    const eventConfig = EVENT_TYPES.find((t) => t.value === eventType);
    return eventConfig?.icon || FileText;
  };

  // Set default date range (last 1 year)
  React.useEffect(() => {
    if (!dateRange.from && !dateRange.to) {
      const today = new Date();
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      setDateRange({
        from: lastYear.toISOString().split('T')[0],
        to: today.toISOString().split('T')[0],
      });
    }
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Period Summary Card */}
      <div className="bg-gradient-to-br from-accent-blue/10 to-signal-purple/10 border border-border-default rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Q3 FY26 Summary</h2>
            <p className="text-sm text-text-muted">{mockPeriodSummary.period}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-text-primary">{mockPeriodSummary.eventCount}</div>
              <div className="text-text-muted">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-signal-green">
                {mockPeriodSummary.avgSentiment > 0 ? '+' : ''}
                {mockPeriodSummary.avgSentiment}%
              </div>
              <div className="text-text-muted">Sentiment</div>
            </div>
          </div>
        </div>
        <p className="text-text-secondary leading-relaxed">{mockPeriodSummary.summary}</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-sm text-text-muted mb-1">Quality Score</div>
            <div className={`text-lg font-bold ${mockPeriodSummary.scoreChanges.quality >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
              {mockPeriodSummary.scoreChanges.quality >= 0 ? '+' : ''}
              {mockPeriodSummary.scoreChanges.quality}
            </div>
          </div>
          <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-sm text-text-muted mb-1">Growth Score</div>
            <div className={`text-lg font-bold ${mockPeriodSummary.scoreChanges.growth >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
              {mockPeriodSummary.scoreChanges.growth >= 0 ? '+' : ''}
              {mockPeriodSummary.scoreChanges.growth}
            </div>
          </div>
          <div className="bg-bg-secondary/50 rounded-lg p-3 text-center">
            <div className="text-sm text-text-muted mb-1">Momentum Score</div>
            <div className={`text-lg font-bold ${mockPeriodSummary.scoreChanges.momentum >= 0 ? 'text-signal-green' : 'text-signal-red'}`}>
              {mockPeriodSummary.scoreChanges.momentum >= 0 ? '+' : ''}
              {mockPeriodSummary.scoreChanges.momentum}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search events, titles, summaries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          {/* Impact Filter */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value as any)}
            className="px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue"
          >
            <option value="ALL">All Impact</option>
            <option value="POSITIVE">Positive</option>
            <option value="NEGATIVE">Negative</option>
            <option value="NEUTRAL">Neutral</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
            <span className="text-text-muted">to</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          {/* Event Type Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-text-primary hover:bg-bg-secondary transition-colors"
          >
            <Filter className="w-4 h-4" />
            Event Types
            {selectedEventTypes.length > 0 && (
              <span className="px-2 py-0.5 bg-accent-blue text-white text-xs rounded-full">
                {selectedEventTypes.length}
              </span>
            )}
          </button>
        </div>

        {/* Event Type Multi-Select */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => toggleEventType(type.value)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedEventTypes.includes(type.value)
                      ? 'bg-accent-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border-default'
                  }`}
                >
                  <type.icon className="w-3 h-3" />
                  {type.label}
                </button>
              ))}
            </div>
            {selectedEventTypes.length > 0 && (
              <button
                onClick={() => setSelectedEventTypes([])}
                className="mt-3 text-sm text-accent-blue hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">
          Showing {displayEvents.length} of {filteredEvents.length} events
        </p>
      </div>

      {/* Timeline View */}
      <div className="relative">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border-default hidden lg:block" />

        {/* Events */}
        <div className="space-y-8">
          {displayEvents.map((event, index) => {
            const isExpanded = expandedEvents.has(event.id);
            const EventIcon = getEventIcon(event.eventType);
            const ImpactIcon = getImpactIcon(event.impactAssessment);
            const isLeft = index % 2 === 0;

            // Check if this event has a milestone
            const milestone = mockMilestones.find((m) => m.date === event.eventDate);

            return (
              <div key={event.id} className="relative">
                {/* Milestone marker */}
                {milestone && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 hidden lg:block">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-signal-yellow to-signal-yellow/60 border-4 border-bg-primary flex items-center justify-center shadow-lg">
                        <Star className="w-6 h-6 text-white fill-current" />
                      </div>
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-64 bg-signal-yellow/10 border border-signal-yellow/30 rounded-lg p-3 text-center">
                        <div className="text-xs font-bold text-signal-yellow mb-1">MILESTONE</div>
                        <div className="text-sm text-text-primary font-semibold">{milestone.title}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Desktop: alternating left/right */}
                <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8">
                  {isLeft ? (
                    <>
                      {/* Left card */}
                      <EventCard
                        event={event}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleEventExpansion(event.id)}
                        EventIcon={EventIcon}
                        ImpactIcon={ImpactIcon}
                        impactBadgeStyle={getImpactBadgeStyle(event.impactAssessment)}
                      />
                      {/* Right empty */}
                      <div />
                    </>
                  ) : (
                    <>
                      {/* Left empty */}
                      <div />
                      {/* Right card */}
                      <EventCard
                        event={event}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleEventExpansion(event.id)}
                        EventIcon={EventIcon}
                        ImpactIcon={ImpactIcon}
                        impactBadgeStyle={getImpactBadgeStyle(event.impactAssessment)}
                      />
                    </>
                  )}

                  {/* Timeline node */}
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-accent-blue border-4 border-bg-primary z-10" />
                </div>

                {/* Mobile: single column */}
                <div className="lg:hidden">
                  <EventCard
                    event={event}
                    isExpanded={isExpanded}
                    onToggleExpand={() => toggleEventExpansion(event.id)}
                    EventIcon={EventIcon}
                    ImpactIcon={ImpactIcon}
                    impactBadgeStyle={getImpactBadgeStyle(event.impactAssessment)}
                  />
                </div>

                {/* Year/Quarter markers */}
                {index > 0 &&
                  event.fiscalYear !== displayEvents[index - 1].fiscalYear &&
                  event.fiscalYear && (
                    <div className="absolute left-1/2 -translate-x-1/2 -top-8 bg-bg-tertiary border border-border-default rounded-full px-4 py-1 text-xs font-bold text-text-primary z-20">
                      FY{event.fiscalYear}
                    </div>
                  )}
              </div>
            );
          })}
        </div>

        {/* Load More / Upgrade Prompt */}
        <div className="mt-8">
          {userTier === 'FREE' && filteredEvents.length > 5 ? (
            <UpgradePrompt
              feature="ai_summary_full"
              variant="inline"
              requiredTier="PRO"
              message="Unlock the complete timeline with all events and advanced filters"
            />
          ) : hasMore ? (
            <button
              onClick={() => setVisibleCount((prev) => prev + 20)}
              className="w-full py-3 bg-bg-secondary border border-border-default rounded-lg text-text-primary hover:bg-bg-tertiary transition-colors font-medium"
            >
              Load More Events
            </button>
          ) : (
            <p className="text-center text-text-muted">No more events to load</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Event Card Component
interface EventCardProps {
  event: TimelineEvent;
  isExpanded: boolean;
  onToggleExpand: () => void;
  EventIcon: any;
  ImpactIcon: any;
  impactBadgeStyle: string;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  isExpanded,
  onToggleExpand,
  EventIcon,
  ImpactIcon,
  impactBadgeStyle,
}) => {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-blue/20 flex items-center justify-center">
          <EventIcon className="w-5 h-5 text-accent-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${impactBadgeStyle}`}>
              <ImpactIcon className="w-3 h-3 inline mr-1" />
              {event.impactAssessment.replace('_', ' ')}
            </span>
            <span className="text-xs text-text-muted">
              {new Date(event.eventDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-1">{event.title}</h3>
          <p className="text-sm text-text-secondary line-clamp-2">{event.summary}</p>
        </div>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {event.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-bg-tertiary border border-border-default rounded text-xs text-text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Sources */}
      {event.sourceUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {event.sourceNames.map((source, idx) => (
            <a
              key={idx}
              href={event.sourceUrls[idx]}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
            >
              {source}
              <ExternalLink className="w-3 h-3" />
            </a>
          ))}
        </div>
      )}

      {/* Expand button */}
      <button
        onClick={onToggleExpand}
        className="flex items-center gap-2 text-sm text-accent-blue hover:underline font-medium"
      >
        {isExpanded ? (
          <>
            Show Less <ChevronUp className="w-4 h-4" />
          </>
        ) : (
          <>
            Expand for Details <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && <ExpandedEventContent event={event} />}
    </div>
  );
};

// Expanded Event Content Component
const ExpandedEventContent: React.FC<{ event: TimelineEvent }> = ({ event }) => {
  // Render different content based on event type
  if (event.eventType === 'QUARTERLY_RESULT' || event.eventType === 'ANNUAL_RESULT') {
    return (
      <div className="mt-4 pt-4 border-t border-border-default space-y-4">
        <h4 className="text-sm font-bold text-text-primary mb-2">Financial Highlights</h4>

        {/* Revenue Table */}
        <div className="bg-bg-tertiary rounded-lg p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left py-2 text-text-muted">Metric</th>
                <th className="text-right py-2 text-text-muted">Value</th>
                <th className="text-right py-2 text-text-muted">YoY Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-default">
                <td className="py-2 text-text-secondary">Revenue</td>
                <td className="py-2 text-right text-text-primary font-data">₹2,450 Cr</td>
                <td className="py-2 text-right text-signal-green font-data">+18.5%</td>
              </tr>
              <tr className="border-b border-border-default">
                <td className="py-2 text-text-secondary">Net Profit</td>
                <td className="py-2 text-right text-text-primary font-data">₹340 Cr</td>
                <td className="py-2 text-right text-signal-green font-data">+22.3%</td>
              </tr>
              <tr>
                <td className="py-2 text-text-secondary">EBITDA Margin</td>
                <td className="py-2 text-right text-text-primary font-data">21.2%</td>
                <td className="py-2 text-right text-signal-green font-data">+1.8pp</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Margin Chart */}
        <div className="bg-bg-tertiary rounded-lg p-4">
          <h5 className="text-xs font-semibold text-text-muted mb-3">Margin Trend (Last 4 Quarters)</h5>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={[
              { quarter: 'Q1', ebitda: 18.5, net: 12.3 },
              { quarter: 'Q2', ebitda: 19.2, net: 13.1 },
              { quarter: 'Q3', ebitda: 20.1, net: 13.8 },
              { quarter: 'Q4', ebitda: 21.2, net: 14.5 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="quarter" stroke="#a0aec0" style={{ fontSize: '12px' }} />
              <YAxis stroke="#a0aec0" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a202c',
                  border: '1px solid #2d3748',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="ebitda" stroke="#3b82f6" name="EBITDA %" />
              <Line type="monotone" dataKey="net" stroke="#10b981" name="Net Margin %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Highlights */}
        <div className="space-y-2">
          <h5 className="text-xs font-semibold text-text-muted">Key Highlights</h5>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-signal-green mt-2" />
              Revenue grew 18.5% YoY driven by strong volume growth and pricing power
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-signal-green mt-2" />
              EBITDA margin expanded 180 bps to 21.2% due to operating leverage
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-signal-green mt-2" />
              Management guided for continued double-digit growth in FY26
            </li>
          </ul>
        </div>
      </div>
    );
  }

  if (event.eventType === 'MANAGEMENT_CHANGE') {
    return (
      <div className="mt-4 pt-4 border-t border-border-default space-y-4">
        <h4 className="text-sm font-bold text-text-primary mb-2">Management Change Details</h4>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-tertiary rounded-lg p-4">
            <div className="text-xs text-text-muted mb-1">Outgoing</div>
            <div className="text-base font-semibold text-text-primary">John Smith</div>
            <div className="text-xs text-text-secondary mt-1">CEO (5 years)</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4">
            <div className="text-xs text-text-muted mb-1">Incoming</div>
            <div className="text-base font-semibold text-text-primary">Sarah Johnson</div>
            <div className="text-xs text-text-secondary mt-1">Previously CFO</div>
          </div>
        </div>

        <div className="bg-bg-tertiary rounded-lg p-4">
          <h5 className="text-xs font-semibold text-text-muted mb-2">Market Reaction</h5>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Stock Price Impact</span>
            <span className="text-base font-bold text-signal-green">+3.2%</span>
          </div>
          <p className="text-xs text-text-secondary mt-2">
            Stock rallied on announcement as Sarah Johnson is widely respected and known for operational excellence
          </p>
        </div>
      </div>
    );
  }

  if (event.eventType === 'ORDER_WIN') {
    return (
      <div className="mt-4 pt-4 border-t border-border-default space-y-4">
        <h4 className="text-sm font-bold text-text-primary mb-2">Order Win Details</h4>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-bg-tertiary rounded-lg p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Order Value</div>
            <div className="text-xl font-bold text-text-primary">₹1,200 Cr</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Customer</div>
            <div className="text-base font-semibold text-text-primary">Tata Steel</div>
          </div>
          <div className="bg-bg-tertiary rounded-lg p-4 text-center">
            <div className="text-xs text-text-muted mb-1">Timeline</div>
            <div className="text-base font-semibold text-text-primary">24 months</div>
          </div>
        </div>

        <div className="bg-bg-tertiary rounded-lg p-4">
          <p className="text-sm text-text-secondary">
            This order represents approximately 8% of FY26 revenue guidance and validates the company's
            technology leadership in the steel sector. Execution begins Q2 FY26.
          </p>
        </div>
      </div>
    );
  }

  // Default expanded content for other event types
  return (
    <div className="mt-4 pt-4 border-t border-border-default">
      <p className="text-sm text-text-secondary">
        Detailed analysis for this event type is being prepared. Check back soon for more insights.
      </p>
    </div>
  );
};

// Mock data generators
function generateMockEvents(symbol: string): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: '1',
      eventType: 'QUARTERLY_RESULT',
      eventDate: '2025-11-15',
      title: 'Q3 FY26 Results: Strong Revenue Growth, Margin Expansion',
      summary: 'Company reported 18.5% YoY revenue growth to ₹2,450 Cr with EBITDA margin expansion of 180 bps to 21.2%. Net profit grew 22.3% to ₹340 Cr.',
      impactAssessment: 'VERY_POSITIVE',
      impactAreas: ['Revenue', 'Profitability', 'Margins'],
      sourceUrls: ['https://example.com/results'],
      sourceNames: ['BSE', 'NSE'],
      tags: ['Earnings', 'Growth', 'Margins'],
      fiscalYear: 2026,
      fiscalQuarter: 3,
    },
    {
      id: '2',
      eventType: 'ORDER_WIN',
      eventDate: '2025-10-22',
      title: '₹1,200 Cr Order Win from Tata Steel',
      summary: 'Secured major contract worth ₹1,200 Cr from Tata Steel for supply of industrial equipment over 24 months.',
      impactAssessment: 'POSITIVE',
      impactAreas: ['Revenue', 'Order Book'],
      sourceUrls: ['https://example.com/order'],
      sourceNames: ['ET Now'],
      tags: ['Order Win', 'Revenue Visibility'],
      fiscalYear: 2026,
      fiscalQuarter: 3,
    },
    {
      id: '3',
      eventType: 'MANAGEMENT_CHANGE',
      eventDate: '2025-09-10',
      title: 'CEO Transition: Sarah Johnson Appointed New CEO',
      summary: 'Board announced the appointment of Sarah Johnson as new CEO, effective November 1. She was previously serving as CFO.',
      impactAssessment: 'POSITIVE',
      impactAreas: ['Leadership', 'Strategy'],
      sourceUrls: ['https://example.com/ceo'],
      sourceNames: ['Moneycontrol'],
      tags: ['Leadership', 'Management'],
      fiscalYear: 2026,
      fiscalQuarter: 2,
    },
    {
      id: '4',
      eventType: 'DIVIDEND',
      eventDate: '2025-08-20',
      title: 'Interim Dividend of ₹12 Per Share Declared',
      summary: 'Board declared interim dividend of ₹12 per share, marking 30% increase over last year. Record date set for September 5.',
      impactAssessment: 'POSITIVE',
      impactAreas: ['Shareholder Returns'],
      sourceUrls: ['https://example.com/dividend'],
      sourceNames: ['BSE'],
      tags: ['Dividend', 'Shareholder Returns'],
      fiscalYear: 2026,
      fiscalQuarter: 2,
    },
    {
      id: '5',
      eventType: 'PLANT_EXPANSION',
      eventDate: '2025-07-15',
      title: 'New Manufacturing Plant Announced in Gujarat',
      summary: 'Company announced plans to set up new manufacturing facility in Gujarat with investment of ₹500 Cr. Expected to be operational by Q4 FY27.',
      impactAssessment: 'POSITIVE',
      impactAreas: ['Capacity', 'Growth'],
      sourceUrls: ['https://example.com/expansion'],
      sourceNames: ['Economic Times'],
      tags: ['Capex', 'Expansion', 'Gujarat'],
      fiscalYear: 2026,
      fiscalQuarter: 2,
    },
    {
      id: '6',
      eventType: 'CREDIT_RATING_CHANGE',
      eventDate: '2025-06-28',
      title: 'CRISIL Upgrades Rating to AA+ with Stable Outlook',
      summary: 'CRISIL upgraded company rating from AA to AA+ citing improved financial profile, strong cash flows, and reduced leverage.',
      impactAssessment: 'POSITIVE',
      impactAreas: ['Credit Profile', 'Cost of Borrowing'],
      sourceUrls: ['https://example.com/rating'],
      sourceNames: ['CRISIL'],
      tags: ['Credit Rating', 'Financial Health'],
      fiscalYear: 2026,
      fiscalQuarter: 1,
    },
  ];

  return events;
}

function generateMockMilestones(symbol: string): Milestone[] {
  return [
    {
      id: 'm1',
      date: '2025-10-15',
      title: 'Crossed ₹10,000 Cr Market Cap',
      description: 'Company market capitalization crossed ₹10,000 Cr milestone for the first time',
      type: 'MARKET_MILESTONE',
    },
  ];
}

function generateMockPeriodSummary(): PeriodSummary {
  return {
    period: 'Oct 2025 - Dec 2025',
    summary:
      'Q3 FY26 was a transformative quarter marked by robust operational performance and strategic wins. The company reported strong revenue growth of 18.5% YoY, driven by healthy volume growth across all segments and pricing power in key markets. Management successfully expanded EBITDA margins by 180 bps to 21.2% through operational efficiencies and favorable product mix. The major order win from Tata Steel worth ₹1,200 Cr provides strong revenue visibility for the next 24 months. The CEO transition to Sarah Johnson was well-received by markets, with her track record of operational excellence expected to drive the next phase of growth. Overall, the quarter reinforced the company\'s strong competitive position and growth trajectory.',
    eventCount: 15,
    avgSentiment: 8.5,
    scoreChanges: {
      quality: 3,
      growth: 5,
      momentum: 7,
    },
  };
}

export default TimelineTab;
