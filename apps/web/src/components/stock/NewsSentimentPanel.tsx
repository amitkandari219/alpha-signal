/**
 * News Sentiment Panel Component
 *
 * AI-powered news analysis with sentiment timeline and risk alerts
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { AIDisclaimer } from '../common/AIDisclaimer';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getNewsSentimentData, SentimentType, ImpactRating } from '../../data/mockNewsSentimentData';
import { GatedContent } from '../common/GatedContent';

interface NewsSentimentPanelProps {
  symbol: string;
  defaultExpanded?: boolean;
}

export const NewsSentimentPanel: React.FC<NewsSentimentPanelProps> = ({
  symbol,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [timelineRange, setTimelineRange] = useState<'30D' | '90D' | '180D'>('30D');

  const data = getNewsSentimentData(symbol);

  const handleFeedback = (type: 'up' | 'down') => {
    console.log(`News sentiment feedback: ${type} for ${symbol}`);
    // TODO: Send feedback to API
  };

  const toggleCluster = (clusterId: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(clusterId)) {
      newExpanded.delete(clusterId);
    } else {
      newExpanded.add(clusterId);
    }
    setExpandedClusters(newExpanded);
  };

  const getSentimentColor = (sentiment: SentimentType) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'bg-signal-green/20 text-signal-green border-signal-green/30';
      case 'NEGATIVE':
        return 'bg-signal-red/20 text-signal-red border-signal-red/30';
      case 'NEUTRAL':
        return 'bg-bg-tertiary text-text-muted border-border-primary';
    }
  };

  const getImpactBorder = (impact: ImpactRating) => {
    switch (impact) {
      case 'HIGH':
        return 'border-signal-red';
      case 'MEDIUM':
        return 'border-signal-yellow';
      case 'LOW':
        return 'border-border-primary';
    }
  };

  const getRiskCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      REGULATORY: 'bg-signal-red/20 text-signal-red',
      FINANCIAL: 'bg-signal-yellow/20 text-signal-yellow',
      MANAGEMENT: 'bg-signal-purple/20 text-signal-purple',
      OPERATIONAL: 'bg-signal-blue/20 text-signal-blue',
      LITIGATION: 'bg-signal-red/20 text-signal-red',
    };
    return colors[category] || 'bg-bg-tertiary text-text-muted';
  };

  const timelineData =
    timelineRange === '30D'
      ? data.sentimentTimeline30D
      : timelineRange === '90D'
      ? data.sentimentTimeline90D
      : data.sentimentTimeline180D;

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
      {/* Panel Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-bg-tertiary transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold text-text-primary">News & Sentiment Analysis</h2>
        <button className="text-text-muted hover:text-text-secondary transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Panel Content */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-6 space-y-6 border-t border-border-primary">
          {/* 1. AI News Digest */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#A371F7]" />
              <h3 className="text-base font-semibold text-text-primary">AI News Digest</h3>
              <span className="px-2 py-1 bg-[#A371F7] text-white text-xs font-medium rounded">
                AI Summarized
              </span>
            </div>

            <div className="space-y-4">
              {data.newsDigest.length > 0 ? (
                data.newsDigest.map((cluster) => (
                  <div
                    key={cluster.id}
                    className={`bg-bg-secondary border-2 ${getImpactBorder(
                      cluster.impact
                    )} rounded-lg p-4`}
                  >
                    {/* Topic and Badges */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="font-bold text-text-primary flex-1">{cluster.topic}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getSentimentColor(
                            cluster.sentiment
                          )}`}
                        >
                          {cluster.sentiment}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded border ${getImpactBorder(
                            cluster.impact
                          )} border-current`}
                        >
                          {cluster.impact} Impact
                        </span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                      {cluster.summary}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                      <span>From {cluster.sourceCount} sources</span>
                      <span>•</span>
                      <span>{cluster.dateRange}</span>
                    </div>

                    {/* View Sources Toggle */}
                    <button
                      onClick={() => toggleCluster(cluster.id)}
                      className="flex items-center gap-1 text-sm text-signal-blue hover:underline"
                    >
                      {expandedClusters.has(cluster.id) ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide sources
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          View sources ({cluster.sources.length})
                        </>
                      )}
                    </button>

                    {/* Sources List */}
                    {expandedClusters.has(cluster.id) && (
                      <div className="mt-3 space-y-2 pl-4 border-l-2 border-signal-blue/30">
                        {cluster.sources.map((source, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <ExternalLink className="w-3 h-3 text-text-muted flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <a
                                href={source.url}
                                className="text-xs text-signal-blue hover:underline"
                                onClick={(e) => e.preventDefault()}
                              >
                                {source.title}
                              </a>
                              <div className="text-xs text-text-muted mt-0.5">
                                {source.source} • {source.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <p className="text-sm">No news clusters available for this stock.</p>
                </div>
              )}
            </div>
          </div>

          {/* Gate AI sentiment features for FREE users */}
          <GatedContent feature="news_sentiment_full" showPreview={true}>
          {/* 2. Sentiment Timeline */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-text-primary">
                Sentiment vs Price Timeline
              </h3>
              <div className="flex items-center gap-2">
                {(['30D', '90D', '180D'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimelineRange(range)}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      timelineRange === range
                        ? 'bg-signal-blue text-white'
                        : 'bg-bg-secondary text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                  <XAxis dataKey="date" stroke="#8B949E" tick={false} />
                  <YAxis
                    yAxisId="left"
                    domain={[-1, 1]}
                    stroke="#8B949E"
                    label={{ value: 'Sentiment', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#8B949E"
                    label={{ value: 'Price', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#161B22',
                      border: '1px solid #30363D',
                      borderRadius: '6px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'sentiment') {
                        return [value.toFixed(2), 'Sentiment'];
                      }
                      return [`₹${value.toFixed(2)}`, 'Price'];
                    }}
                  />
                  <Legend />
                  <ReferenceLine yAxisId="left" y={0} stroke="#8B949E" strokeDasharray="3 3" />

                  {/* Sentiment as area chart */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="sentiment"
                    stroke="#58A6FF"
                    fill={(entry: any) => (entry.sentiment > 0 ? '#26A69A' : '#EF5350')}
                    fillOpacity={0.3}
                  />

                  {/* Price as line */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="price"
                    stroke="#A371F7"
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <p className="text-sm">No timeline data available.</p>
              </div>
            )}
          </div>

          {/* 3. Risk Alert Feed */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">Risk Alerts</h3>

            {data.riskAlerts.length > 0 ? (
              <div className="space-y-3">
                {data.riskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="bg-bg-secondary border-l-4 border-signal-red rounded p-3"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <AlertTriangle className="w-4 h-4 text-signal-red flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-text-primary text-sm">
                            {alert.headline}
                          </h4>
                          <p className="text-xs text-text-muted mt-1">{alert.timestamp}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getRiskCategoryColor(
                          alert.category
                        )}`}
                      >
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary pl-6">{alert.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="w-12 h-12 text-signal-green mb-3" />
                <p className="text-sm text-text-primary font-medium">
                  No risk alerts in the last 30 days
                </p>
                <p className="text-xs text-text-muted mt-1">Clean risk profile</p>
              </div>
            )}
          </div>

          {/* 4. Sector News Correlation */}
          <div className="bg-bg-tertiary border border-border-primary rounded-lg p-4">
            <h3 className="text-base font-semibold text-text-primary mb-4">
              Sector News Correlation
            </h3>

            <p className="text-sm text-text-secondary leading-relaxed mb-4">
              {data.sectorCorrelation.text}
            </p>

            {data.sectorCorrelation.articles.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-muted mb-2">
                  Related Sector News:
                </div>
                {data.sectorCorrelation.articles.map((article, idx) => (
                  <div key={idx} className="flex items-start gap-2 pl-3">
                    <ExternalLink className="w-3 h-3 text-signal-blue flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <a
                        href={article.url}
                        className="text-xs text-signal-blue hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        {article.title}
                      </a>
                      <div className="text-xs text-text-muted mt-0.5">{article.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Disclaimer - SEBI Compliance */}
          <div className="mt-6">
            <AIDisclaimer
              modelVersion="GPT-4 Turbo + News API"
              generatedAt="Updated 2 hours ago"
              onFeedback={handleFeedback}
            />
          </div>
          </GatedContent>
        </div>
      </div>
    </div>
  );
};
