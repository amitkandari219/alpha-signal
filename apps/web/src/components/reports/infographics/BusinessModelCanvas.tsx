/**
 * Business Model Canvas Infographic
 *
 * Explains company's business model in simple terms for beginners
 *
 * Uses card-based layout with:
 * - Value Proposition (problem they solve)
 * - Customer Segments (who they serve)
 * - Revenue Streams (how they make money)
 * - Distribution Channels (how they reach customers)
 * - Key Resources (what they own/have)
 */

import React, { useState } from 'react';
import {
  Target,
  Users,
  DollarSign,
  Truck,
  Briefcase,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Building2,
  Package,
  Globe,
  Store,
  Smartphone,
  Factory,
  Lightbulb,
  Award,
} from 'lucide-react';

interface BusinessModelData {
  description?: string;
  products?: any;
  competitivePosition?: any;
  company?: {
    name: string;
    sector?: string;
    industry?: string;
  };
  financials?: {
    summary?: {
      revenueGrowth?: number;
    };
  };
}

interface BusinessModelCanvasProps {
  data: BusinessModelData;
}

interface CardData {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  analogy: string;
  tooltip: string;
}

export const BusinessModelCanvas: React.FC<BusinessModelCanvasProps> = ({ data }) => {
  const [expandedCard, setExpandedCard] = useState<number | null>(0); // Start with first card expanded
  const [showTooltip, setShowTooltip] = useState<number | null>(null);

  const companyName = data.company?.name || 'This company';
  const sector = data.company?.sector || 'their sector';
  const industry = data.company?.industry || 'their industry';

  // Card 1: Value Proposition
  const valuePropCard: CardData = {
    title: 'Value Proposition',
    subtitle: 'What problem does this company solve?',
    icon: <Target className="w-6 h-6" />,
    content: (
      <div className="space-y-3">
        <p className="text-text-primary leading-relaxed">
          {data.description || `${companyName} operates in the ${sector} sector, focusing on ${industry}.`}
        </p>

        <div className="bg-bg-tertiary p-4 rounded-lg border-l-4 border-accent-blue">
          <h5 className="font-semibold text-accent-blue mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Why customers choose them:
          </h5>
          <ul className="space-y-2 text-sm text-text-secondary">
            {data.competitivePosition ? (
              <li>• {simplifyCompetitivePosition(data.competitivePosition)}</li>
            ) : (
              <>
                <li>• Trusted brand with proven track record</li>
                <li>• Quality products/services in {industry}</li>
                <li>• Strong market presence in {sector}</li>
              </>
            )}
          </ul>
        </div>
      </div>
    ),
    analogy: `Like how Netflix solved "I want to watch movies without leaving home" - ${companyName} solves specific customer problems in ${sector}.`,
    tooltip: 'The unique value a company provides to customers - what makes them choose this company over others',
  };

  // Card 2: Customer Segments
  const getCustomerSegments = () => {
    const segments: Array<{ name: string; percentage: number; icon: React.ReactNode; color: string }> = [];

    // Industry-based heuristics for customer segments
    if (industry?.toLowerCase().includes('bank') || industry?.toLowerCase().includes('insurance')) {
      segments.push(
        { name: 'Individual Customers', percentage: 60, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
        { name: 'Small Businesses', percentage: 25, icon: <Store className="w-5 h-5" />, color: 'bg-green-500' },
        { name: 'Corporations', percentage: 15, icon: <Building2 className="w-5 h-5" />, color: 'bg-purple-500' }
      );
    } else if (industry?.toLowerCase().includes('fmcg') || industry?.toLowerCase().includes('consumer')) {
      segments.push(
        { name: 'Direct Consumers', percentage: 70, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
        { name: 'Retailers', percentage: 20, icon: <Store className="w-5 h-5" />, color: 'bg-green-500' },
        { name: 'Distributors', percentage: 10, icon: <Truck className="w-5 h-5" />, color: 'bg-orange-500' }
      );
    } else if (industry?.toLowerCase().includes('it') || industry?.toLowerCase().includes('software')) {
      segments.push(
        { name: 'Enterprise Clients', percentage: 50, icon: <Building2 className="w-5 h-5" />, color: 'bg-purple-500' },
        { name: 'SMBs', percentage: 30, icon: <Store className="w-5 h-5" />, color: 'bg-green-500' },
        { name: 'Individual Users', percentage: 20, icon: <Smartphone className="w-5 h-5" />, color: 'bg-blue-500' }
      );
    } else if (industry?.toLowerCase().includes('pharma') || industry?.toLowerCase().includes('healthcare')) {
      segments.push(
        { name: 'Hospitals', percentage: 40, icon: <Building2 className="w-5 h-5" />, color: 'bg-red-500' },
        { name: 'Pharmacies', percentage: 35, icon: <Store className="w-5 h-5" />, color: 'bg-green-500' },
        { name: 'Patients', percentage: 25, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' }
      );
    } else {
      // Default B2B segments
      segments.push(
        { name: 'Business Customers', percentage: 55, icon: <Building2 className="w-5 h-5" />, color: 'bg-purple-500' },
        { name: 'Individual Customers', percentage: 30, icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
        { name: 'Government', percentage: 15, icon: <Globe className="w-5 h-5" />, color: 'bg-orange-500' }
      );
    }

    return segments;
  };

  const customerSegments = getCustomerSegments();

  const customerCard: CardData = {
    title: 'Customer Segments',
    subtitle: 'Who do they serve?',
    icon: <Users className="w-6 h-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {companyName} serves different types of customers:
        </p>

        {/* Pie Chart Visualization */}
        <div className="flex items-center justify-center gap-8">
          {/* Simple Donut Chart */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {customerSegments.reduce((acc, segment, index) => {
                const prevSegments = customerSegments.slice(0, index);
                const startAngle = prevSegments.reduce((sum, s) => sum + (s.percentage * 3.6), 0);
                const endAngle = startAngle + (segment.percentage * 3.6);

                // Calculate arc path
                const startX = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                const startY = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                const endX = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                const endY = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                const largeArc = segment.percentage > 50 ? 1 : 0;

                acc.push(
                  <path
                    key={index}
                    d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                    className={segment.color}
                    opacity={0.8}
                  />
                );
                return acc;
              }, [] as JSX.Element[])}

              {/* Center circle for donut effect */}
              <circle cx="50" cy="50" r="25" className="fill-bg-secondary" />
            </svg>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            {customerSegments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${segment.color}`} />
                <div className="flex items-center gap-2">
                  {segment.icon}
                  <div>
                    <div className="text-sm font-medium">{segment.name}</div>
                    <div className="text-xs text-text-secondary">{segment.percentage}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    analogy: `Like how a restaurant serves different customers (families, business lunches, takeaway) - ${companyName} serves different customer types with different needs.`,
    tooltip: 'The different groups of people or businesses that buy from this company',
  };

  // Card 3: Revenue Streams
  const getRevenueStreams = () => {
    const streams: Array<{ name: string; percentage: number; color: string; trend: 'up' | 'down' | 'stable' }> = [];

    // Industry-based revenue stream heuristics
    if (industry?.toLowerCase().includes('bank')) {
      streams.push(
        { name: 'Interest Income', percentage: 65, color: 'bg-blue-500', trend: 'up' },
        { name: 'Fee-based Income', percentage: 25, color: 'bg-green-500', trend: 'up' },
        { name: 'Trading & Other', percentage: 10, color: 'bg-purple-500', trend: 'stable' }
      );
    } else if (industry?.toLowerCase().includes('software') || industry?.toLowerCase().includes('it')) {
      streams.push(
        { name: 'Subscription Revenue', percentage: 50, color: 'bg-purple-500', trend: 'up' },
        { name: 'Project Services', percentage: 35, color: 'bg-blue-500', trend: 'stable' },
        { name: 'Maintenance & Support', percentage: 15, color: 'bg-green-500', trend: 'up' }
      );
    } else if (industry?.toLowerCase().includes('telecom')) {
      streams.push(
        { name: 'Monthly Subscriptions', percentage: 70, color: 'bg-blue-500', trend: 'stable' },
        { name: 'Data Services', percentage: 20, color: 'bg-green-500', trend: 'up' },
        { name: 'Enterprise Solutions', percentage: 10, color: 'bg-purple-500', trend: 'up' }
      );
    } else {
      // Default product/service mix
      streams.push(
        { name: 'Product Sales', percentage: 60, color: 'bg-blue-500', trend: 'up' },
        { name: 'Services', percentage: 30, color: 'bg-green-500', trend: 'stable' },
        { name: 'Licensing & Other', percentage: 10, color: 'bg-purple-500', trend: 'stable' }
      );
    }

    return streams;
  };

  const revenueStreams = getRevenueStreams();
  const maxRevenue = Math.max(...revenueStreams.map(s => s.percentage));

  const revenueCard: CardData = {
    title: 'Revenue Streams',
    subtitle: 'How do they make money?',
    icon: <DollarSign className="w-6 h-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {companyName} makes money through:
        </p>

        {/* Stacked Bar Chart */}
        <div className="space-y-3">
          {revenueStreams.map((stream, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stream.name}</span>
                  {stream.trend === 'up' && <TrendingUp className="w-3 h-3 text-signal-green" />}
                  {stream.trend === 'down' && <TrendingUp className="w-3 h-3 text-signal-red transform rotate-180" />}
                </div>
                <span className="text-text-secondary">{stream.percentage}%</span>
              </div>
              <div className="w-full bg-bg-tertiary rounded-full h-6 overflow-hidden">
                <div
                  className={`${stream.color} h-full rounded-full transition-all duration-500 flex items-center justify-center text-xs font-semibold text-white`}
                  style={{ width: `${(stream.percentage / maxRevenue) * 100}%` }}
                >
                  {stream.percentage > 15 && `${stream.percentage}%`}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-accent-blue/10 border border-accent-blue/30 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 text-accent-blue mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">Revenue Growth</span>
          </div>
          <p className="text-text-secondary">
            {data.financials?.summary?.revenueGrowth !== undefined
              ? `Growing at ${data.financials.summary.revenueGrowth.toFixed(1)}% year-over-year`
              : 'Revenue trends depend on market conditions and demand'}
          </p>
        </div>
      </div>
    ),
    analogy: `Like how a gym makes money from memberships (recurring) + personal training (service) + protein shake sales (products) - multiple income sources are safer than one.`,
    tooltip: 'The different ways a company earns money from its customers',
  };

  // Card 4: Distribution Channels
  const getDistributionChannels = () => {
    const channels: Array<{ name: string; icon: React.ReactNode; description: string }> = [];

    if (industry?.toLowerCase().includes('fmcg') || industry?.toLowerCase().includes('consumer')) {
      channels.push(
        { name: 'Retail Stores', icon: <Store className="w-5 h-5" />, description: 'Supermarkets, grocery stores' },
        { name: 'Distributors', icon: <Truck className="w-5 h-5" />, description: 'Wholesale network' },
        { name: 'E-commerce', icon: <Smartphone className="w-5 h-5" />, description: 'Online platforms' }
      );
    } else if (industry?.toLowerCase().includes('it') || industry?.toLowerCase().includes('software')) {
      channels.push(
        { name: 'Direct Sales', icon: <Briefcase className="w-5 h-5" />, description: 'Sales team to enterprises' },
        { name: 'Online Platform', icon: <Globe className="w-5 h-5" />, description: 'Website, app stores' },
        { name: 'Partners', icon: <Building2 className="w-5 h-5" />, description: 'Resellers, integrators' }
      );
    } else if (industry?.toLowerCase().includes('bank') || industry?.toLowerCase().includes('insurance')) {
      channels.push(
        { name: 'Branch Network', icon: <Building2 className="w-5 h-5" />, description: 'Physical branches' },
        { name: 'Digital Banking', icon: <Smartphone className="w-5 h-5" />, description: 'Mobile app, website' },
        { name: 'Agents', icon: <Users className="w-5 h-5" />, description: 'Insurance agents, brokers' }
      );
    } else {
      channels.push(
        { name: 'Direct Sales', icon: <Briefcase className="w-5 h-5" />, description: 'Company sales force' },
        { name: 'Dealers/Retailers', icon: <Store className="w-5 h-5" />, description: 'Partner stores' },
        { name: 'Online', icon: <Globe className="w-5 h-5" />, description: 'Website and digital' }
      );
    }

    return channels;
  };

  const distributionChannels = getDistributionChannels();

  const distributionCard: CardData = {
    title: 'Distribution Channels',
    subtitle: 'How do they reach customers?',
    icon: <Truck className="w-6 h-6" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          {companyName} reaches customers through:
        </p>

        {/* Simple Flowchart */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent-blue/20 border-2 border-accent-blue">
            <Factory className="w-8 h-8 text-accent-blue" />
          </div>

          {distributionChannels.map((channel, index) => (
            <React.Fragment key={index}>
              <div className="flex-1 h-0.5 bg-border-default" />
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-bg-tertiary border border-border-default hover:border-accent-blue transition-colors">
                  {channel.icon}
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium">{channel.name}</div>
                  <div className="text-xs text-text-secondary">{channel.description}</div>
                </div>
              </div>
            </React.Fragment>
          ))}

          <div className="flex-1 h-0.5 bg-border-default" />
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-signal-green/20 border-2 border-signal-green">
            <Users className="w-8 h-8 text-signal-green" />
          </div>
        </div>

        <div className="text-xs text-text-secondary text-center">
          <span className="text-accent-blue font-medium">Company</span> → Distribution → <span className="text-signal-green font-medium">Customers</span>
        </div>
      </div>
    ),
    analogy: `Like how Coca-Cola reaches you through supermarkets, restaurants, vending machines - multiple paths to reach customers means more sales opportunities.`,
    tooltip: 'The ways a company delivers its products or services to customers',
  };

  // Card 5: Key Resources
  const getKeyResources = () => {
    const resources: Array<{ category: string; items: string[]; icon: React.ReactNode }> = [];

    if (industry?.toLowerCase().includes('it') || industry?.toLowerCase().includes('software')) {
      resources.push(
        { category: 'People', items: ['Engineers', 'Developers', 'Tech talent'], icon: <Users className="w-5 h-5 text-blue-400" /> },
        { category: 'Technology', items: ['Software platforms', 'Cloud infrastructure', 'IP & patents'], icon: <Smartphone className="w-5 h-5 text-purple-400" /> },
        { category: 'Brand', items: ['Company reputation', 'Customer trust', 'Market position'], icon: <Award className="w-5 h-5 text-yellow-400" /> }
      );
    } else if (industry?.toLowerCase().includes('bank')) {
      resources.push(
        { category: 'Financial', items: ['Capital reserves', 'Deposits', 'Credit rating'], icon: <DollarSign className="w-5 h-5 text-green-400" /> },
        { category: 'Network', items: ['Branch network', 'ATMs', 'Digital infrastructure'], icon: <Building2 className="w-5 h-5 text-blue-400" /> },
        { category: 'Brand', items: ['Trust', 'Customer relationships', 'Reputation'], icon: <Award className="w-5 h-5 text-yellow-400" /> }
      );
    } else if (industry?.toLowerCase().includes('manufacturing') || industry?.toLowerCase().includes('auto')) {
      resources.push(
        { category: 'Physical', items: ['Factories', 'Machinery', 'Supply chain'], icon: <Factory className="w-5 h-5 text-orange-400" /> },
        { category: 'People', items: ['Engineers', 'Workers', 'Management'], icon: <Users className="w-5 h-5 text-blue-400" /> },
        { category: 'Brand', items: ['Brand value', 'Dealer network', 'Customer loyalty'], icon: <Award className="w-5 h-5 text-yellow-400" /> }
      );
    } else {
      resources.push(
        { category: 'People', items: ['Employees', 'Management', 'Expertise'], icon: <Users className="w-5 h-5 text-blue-400" /> },
        { category: 'Assets', items: ['Infrastructure', 'Technology', 'Inventory'], icon: <Package className="w-5 h-5 text-purple-400" /> },
        { category: 'Brand', items: ['Reputation', 'Customer base', 'Market position'], icon: <Award className="w-5 h-5 text-yellow-400" /> }
      );
    }

    return resources;
  };

  const keyResources = getKeyResources();

  const resourcesCard: CardData = {
    title: 'Key Resources',
    subtitle: 'What do they own/have?',
    icon: <Briefcase className="w-6 h-6" />,
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-secondary">
          {companyName}'s most valuable assets:
        </p>

        {/* Icon Grid */}
        <div className="grid grid-cols-1 gap-3">
          {keyResources.map((resource, index) => (
            <div key={index} className="bg-bg-tertiary rounded-lg p-4 border border-border-default hover:border-accent-blue transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {resource.icon}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold mb-2 text-sm">{resource.category}</h5>
                  <ul className="space-y-1">
                    {resource.items.map((item, idx) => (
                      <li key={idx} className="text-xs text-text-secondary flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-accent-blue" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    analogy: `Like how a taxi company needs cars + drivers + booking app - ${companyName} needs specific assets to run their business successfully.`,
    tooltip: 'The most important assets a company needs to make their business work',
  };

  const cards: CardData[] = [
    valuePropCard,
    customerCard,
    revenueCard,
    distributionCard,
    resourcesCard,
  ];

  const toggleCard = (index: number) => {
    setExpandedCard(expandedCard === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Business Model Canvas
          </h3>
          <p className="text-text-secondary">
            Understanding how {companyName} creates and delivers value
          </p>
        </div>
        <div className="relative">
          <button
            onMouseEnter={() => setShowTooltip(-1)}
            onMouseLeave={() => setShowTooltip(null)}
            className="p-2 rounded-lg bg-bg-tertiary border border-border-default hover:border-accent-blue transition-colors"
          >
            <HelpCircle className="w-5 h-5 text-accent-blue" />
          </button>
          {showTooltip === -1 && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-bg-secondary border border-border-default rounded-lg p-4 shadow-xl z-10">
              <h5 className="font-semibold mb-2">What is a Business Model?</h5>
              <p className="text-sm text-text-secondary">
                A business model describes how a company creates value for customers and makes money.
                Think of it as the company's "game plan" for success.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card, index) => {
          const gradients = [
            'from-blue-900/20 to-purple-900/10',
            'from-green-900/20 to-blue-900/10',
            'from-purple-900/20 to-pink-900/10',
            'from-orange-900/20 to-red-900/10',
            'from-yellow-900/20 to-green-900/10',
          ];

          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${gradients[index]} border-2 border-border-default rounded-xl overflow-hidden transition-all shadow-md hover:shadow-xl hover:border-accent-blue/50 ${
                expandedCard === index ? 'md:col-span-2' : ''
              }`}
            >
              {/* Card Header */}
              <button
                onClick={() => toggleCard(index)}
                className="w-full p-5 flex items-center justify-between hover:bg-bg-tertiary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent-blue to-purple-500 text-white shadow-lg">
                    {card.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-lg text-text-primary">{card.title}</h4>
                    <p className="text-sm text-text-secondary">{card.subtitle}</p>
                  </div>
                </div>
              <div className="flex items-center gap-2">
                <div
                  onMouseEnter={(e) => {
                    e.stopPropagation();
                    setShowTooltip(index);
                  }}
                  onMouseLeave={(e) => {
                    e.stopPropagation();
                    setShowTooltip(null);
                  }}
                  className="p-1 rounded hover:bg-bg-primary transition-colors relative cursor-help"
                  onClick={(e) => e.stopPropagation()}
                >
                  <HelpCircle className="w-4 h-4 text-text-secondary" />
                  {showTooltip === index && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-bg-secondary border border-border-default rounded-lg p-3 shadow-xl z-10 text-xs text-text-secondary text-left">
                      {card.tooltip}
                    </div>
                  )}
                </div>
                {expandedCard === index ? (
                  <ChevronUp className="w-5 h-5 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-text-secondary" />
                )}
              </div>
            </button>

            {/* Card Content */}
            {expandedCard === index && (
              <div className="p-6 border-t border-border-default space-y-4 bg-bg-primary/20">
                {card.content}

                {/* Analogy Section */}
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border-2 border-purple-500/40 rounded-xl p-5 shadow-md">
                  <h5 className="font-semibold mb-3 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                    Simple Analogy
                  </h5>
                  <p className="text-sm text-text-secondary italic leading-relaxed">
                    {card.analogy}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
        })}
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10 border-2 border-blue-500/40 rounded-xl p-6 shadow-lg">
        <h4 className="font-bold text-xl mb-4 flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          <Target className="w-6 h-6 text-blue-400" />
          Business Model Summary
        </h4>
        <p className="text-text-secondary leading-relaxed text-base">
          {companyName} creates value by serving customers in {sector}. They make money through {revenueStreams[0].name.toLowerCase()}
          and other streams, reaching customers via multiple channels. Their key strengths include their {keyResources[0].category.toLowerCase()}
          and strong market position in {industry}.
        </p>
      </div>
    </div>
  );
};

// Helper function to simplify competitive position text
function simplifyCompetitivePosition(position: any): string {
  if (typeof position === 'string') {
    return position
      .replace(/market leader/gi, 'one of the top companies')
      .replace(/competitive advantage/gi, 'strong edge over competitors')
      .replace(/differentiation/gi, 'unique offering')
      .replace(/value proposition/gi, 'customer value');
  }
  return 'Strong position in their market';
}
