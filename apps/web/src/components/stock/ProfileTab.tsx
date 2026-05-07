/**
 * Profile Tab Component
 *
 * Company profile with navigation sidebar and 7 sections:
 * - Business Model
 * - Competitive Advantage
 * - Management
 * - Key Risks
 * - Growth Drivers
 * - Revenue Breakdown
 * - Corporate History
 *
 * FREE users see Business Model only, rest behind blur + upgrade prompt
 */

import React, { useState } from 'react';
import {
  Building2,
  Shield,
  Users,
  AlertTriangle,
  TrendingUp,
  PieChart,
  History,
  Edit3,
  Sparkles,
  Clock,
} from 'lucide-react';
import {
  PieChart as RechartsPI,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { GatedContent } from '../common/GatedContent';

interface ProfileTabProps {
  symbol: string;
}

type SectionId =
  | 'business-model'
  | 'competitive-advantage'
  | 'management'
  | 'key-risks'
  | 'growth-drivers'
  | 'revenue-breakdown'
  | 'corporate-history';

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'business-model', label: 'Business Model', icon: Building2 },
  { id: 'competitive-advantage', label: 'Competitive Advantage', icon: Shield },
  { id: 'management', label: 'Management', icon: Users },
  { id: 'key-risks', label: 'Key Risks', icon: AlertTriangle },
  { id: 'growth-drivers', label: 'Growth Drivers', icon: TrendingUp },
  { id: 'revenue-breakdown', label: 'Revenue Breakdown', icon: PieChart },
  { id: 'corporate-history', label: 'Corporate History', icon: History },
];

export const ProfileTab: React.FC<ProfileTabProps> = ({ symbol }) => {
  const [activeSection, setActiveSection] = useState<SectionId>('business-model');

  const scrollToSection = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar Navigation */}
      <aside className="lg:w-64 flex-shrink-0">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-4 sticky top-20">
          <h3 className="text-sm font-semibold text-text-muted uppercase mb-3">
            Sections
          </h3>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-accent-blue text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Business Model Section - FREE ACCESS */}
        <Section
          id="business-model"
          title="Business Model"
          icon={Building2}
          lastUpdated="Feb 5, 2026"
          version="v2"
        >
          <BusinessModelContent symbol={symbol} />
        </Section>

        {/* Competitive Advantage Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="competitive-advantage"
            title="Competitive Advantage"
            icon={Shield}
            lastUpdated="Feb 5, 2026"
            version="v1"
          >
            <CompetitiveAdvantageContent symbol={symbol} />
          </Section>
        </GatedContent>

        {/* Management Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="management"
            title="Management"
            icon={Users}
            lastUpdated="Feb 3, 2026"
            version="v1"
          >
            <ManagementContent symbol={symbol} />
          </Section>
        </GatedContent>

        {/* Key Risks Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="key-risks"
            title="Key Risks"
            icon={AlertTriangle}
            lastUpdated="Feb 5, 2026"
            version="v2"
          >
            <KeyRisksContent symbol={symbol} />
          </Section>
        </GatedContent>

        {/* Growth Drivers Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="growth-drivers"
            title="Growth Drivers"
            icon={TrendingUp}
            lastUpdated="Feb 4, 2026"
            version="v1"
          >
            <GrowthDriversContent symbol={symbol} />
          </Section>
        </GatedContent>

        {/* Revenue Breakdown Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="revenue-breakdown"
            title="Revenue Breakdown"
            icon={PieChart}
            lastUpdated="Feb 5, 2026"
            version="v1"
          >
            <RevenueBreakdownContent symbol={symbol} />
          </Section>
        </GatedContent>

        {/* Corporate History Section - GATED */}
        <GatedContent feature="ai_summary_full" showPreview={true}>
          <Section
            id="corporate-history"
            title="Corporate History"
            icon={History}
            lastUpdated="Jan 28, 2026"
            version="v1"
          >
            <CorporateHistoryContent symbol={symbol} />
          </Section>
        </GatedContent>
      </div>
    </div>
  );
};

// Section Wrapper Component
interface SectionProps {
  id: string;
  title: string;
  icon: React.ElementType;
  lastUpdated: string;
  version: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  id,
  title,
  icon: Icon,
  lastUpdated,
  version,
  children,
}) => {
  return (
    <section
      id={id}
      className="bg-bg-secondary border border-border-default rounded-lg p-6 scroll-mt-24"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-accent-blue" />
          <h2 className="text-2xl font-bold text-text-primary">{title}</h2>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-1.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors"
          onClick={() => console.log('Suggest Edit:', id)}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Suggest Edit
        </button>
      </div>

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-6 text-sm text-text-muted">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Last updated: {lastUpdated}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-signal-purple/20 text-signal-purple rounded">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="font-medium">AI Generated</span>
        </div>
        <span className="px-2 py-0.5 bg-bg-tertiary border border-border-default rounded text-text-secondary font-mono text-xs">
          {version}
        </span>
      </div>

      {/* Section Content */}
      {children}
    </section>
  );
};

// Business Model Content
const BusinessModelContent: React.FC<{ symbol: string }> = () => {
  // Mock revenue breakdown data
  const revenueData = [
    { name: 'Product Sales', value: 65, color: '#58A6FF' },
    { name: 'Services', value: 25, color: '#A371F7' },
    { name: 'Licensing', value: 10, color: '#F778BA' },
  ];

  return (
    <div className="space-y-6">
      {/* Prose Description */}
      <div className="prose prose-invert max-w-none">
        <p className="text-text-secondary leading-relaxed">
          The company operates a diversified business model focused on three primary revenue
          streams: product manufacturing and sales, professional services, and intellectual
          property licensing. Their integrated approach combines vertical integration in key
          production areas with strategic partnerships for distribution.
        </p>
        <p className="text-text-secondary leading-relaxed mt-4">
          The core business centers on developing and manufacturing specialized industrial
          components and systems. They serve both B2B customers in manufacturing and infrastructure
          sectors, as well as B2C channels through authorized distributors. Their competitive
          positioning relies on technical expertise, quality standards, and long-term customer
          relationships.
        </p>
        <p className="text-text-secondary leading-relaxed mt-4">
          Revenue generation follows a hybrid model: 65% from direct product sales with healthy
          margins (20-25% EBITDA), 25% from recurring service contracts and maintenance agreements
          (30%+ margins), and 10% from IP licensing to international partners. This diversification
          provides revenue stability and reduces cyclical exposure.
        </p>
      </div>

      {/* Revenue Breakdown Pie Chart */}
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          Revenue Mix (FY 2025)
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-64 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPI>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value }) => `${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '6px',
                  }}
                />
              </RechartsPI>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-3">
            {revenueData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-text-secondary text-sm">{item.name}</span>
                </div>
                <span className="text-text-primary font-semibold font-data">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Competitive Advantage Content
const CompetitiveAdvantageContent: React.FC<{ symbol: string }> = () => {
  const moats = [
    {
      type: 'Brand Power',
      strength: 'High',
      color: 'signal-green',
      description:
        'Established brand with 40+ years of market presence and trusted reputation in industrial segments.',
    },
    {
      type: 'Cost Leadership',
      strength: 'Medium',
      color: 'signal-yellow',
      description:
        'Economies of scale and vertical integration provide 10-15% cost advantage over smaller competitors.',
    },
    {
      type: 'Network Effects',
      strength: 'Low',
      color: 'signal-red',
      description:
        'Limited network effects in B2B industrial markets. Value proposition is product-centric.',
    },
    {
      type: 'Switching Costs',
      strength: 'High',
      color: 'signal-green',
      description:
        'High switching costs due to technical integration, training requirements, and certification processes.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {moats.map((moat, index) => (
        <div
          key={index}
          className="bg-bg-tertiary border border-border-default rounded-lg p-4"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary">{moat.type}</h3>
            <span
              className={`px-2 py-1 rounded text-xs font-medium bg-${moat.color}/20 text-${moat.color}`}
            >
              {moat.strength}
            </span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{moat.description}</p>
        </div>
      ))}
    </div>
  );
};

// Management Content
const ManagementContent: React.FC<{ symbol: string }> = () => {
  const team = [
    {
      name: 'Rajesh Kumar',
      role: 'CEO & Managing Director',
      tenure: '12 years',
      bio: 'Former VP at Tata Steel. Led company through digital transformation and 3x revenue growth.',
    },
    {
      name: 'Priya Sharma',
      role: 'CFO',
      tenure: '6 years',
      bio: 'Ex-PwC partner. Strengthened balance sheet and improved ROE from 12% to 22%.',
    },
    {
      name: 'Amit Patel',
      role: 'CTO',
      tenure: '8 years',
      bio: 'PhD from IIT Bombay. Holds 15+ patents. Driving R&D and product innovation.',
    },
    {
      name: 'Sunita Rao',
      role: 'Head of Operations',
      tenure: '10 years',
      bio: 'Six Sigma Black Belt. Reduced manufacturing costs by 18% through lean initiatives.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {team.map((person, index) => (
        <div
          key={index}
          className="bg-bg-tertiary border border-border-default rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-blue to-signal-purple flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {person.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-text-primary">{person.name}</h3>
              <p className="text-sm text-accent-blue">{person.role}</p>
              <p className="text-xs text-text-muted mt-1">Tenure: {person.tenure}</p>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">{person.bio}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Key Risks Content
const KeyRisksContent: React.FC<{ symbol: string }> = () => {
  const risks = [
    {
      title: 'Supply Chain Concentration',
      severity: 'high',
      description:
        'Heavy dependence on Chinese suppliers (60% of raw materials). Geopolitical tensions could disrupt operations.',
    },
    {
      title: 'Regulatory Changes',
      severity: 'medium',
      description:
        'Upcoming environmental compliance standards may require ₹200Cr capex over next 2 years.',
    },
    {
      title: 'Customer Concentration',
      severity: 'medium',
      description: 'Top 5 customers account for 45% of revenue. Loss of any major client would impact growth.',
    },
    {
      title: 'Currency Fluctuation',
      severity: 'low',
      description:
        '25% of revenue from exports. INR depreciation benefits margins but creates pricing pressure.',
    },
    {
      title: 'Technology Disruption',
      severity: 'low',
      description:
        'Emerging technologies could disrupt traditional product lines. Current R&D spend at 3% of revenue.',
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return { bg: 'bg-signal-red/20', text: 'text-signal-red', border: 'border-signal-red/30' };
      case 'medium':
        return {
          bg: 'bg-signal-yellow/20',
          text: 'text-signal-yellow',
          border: 'border-signal-yellow/30',
        };
      case 'low':
        return {
          bg: 'bg-signal-green/20',
          text: 'text-signal-green',
          border: 'border-signal-green/30',
        };
      default:
        return { bg: 'bg-text-muted/20', text: 'text-text-muted', border: 'border-border-default' };
    }
  };

  return (
    <div className="space-y-3">
      {risks.map((risk, index) => {
        const colors = getSeverityColor(risk.severity);
        return (
          <div
            key={index}
            className={`bg-bg-tertiary border ${colors.border} rounded-lg p-4`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-text-primary">{risk.title}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium uppercase ${colors.bg} ${colors.text}`}
              >
                {risk.severity}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{risk.description}</p>
          </div>
        );
      })}
    </div>
  );
};

// Growth Drivers Content
const GrowthDriversContent: React.FC<{ symbol: string }> = () => {
  const drivers = [
    {
      title: 'Infrastructure Spending',
      confidence: 'high',
      description:
        'Government infrastructure push (₹10L Cr allocated) driving 20-25% annual demand growth for industrial components.',
    },
    {
      title: 'Export Market Expansion',
      confidence: 'high',
      description:
        'New certifications enable entry into European markets. Export revenue projected to grow from 25% to 40% by FY27.',
    },
    {
      title: 'Product Line Extension',
      confidence: 'medium',
      description:
        'Launching 3 new product categories in Q2 FY26. Addresses ₹5,000 Cr TAM with 15% market share target.',
    },
    {
      title: 'Digital Transformation',
      confidence: 'medium',
      description:
        'AI-driven production optimization and predictive maintenance could reduce costs by 8-10% over 3 years.',
    },
    {
      title: 'Strategic Acquisitions',
      confidence: 'low',
      description:
        'Evaluating 2-3 targets in complementary segments. Could accelerate market share gain but execution risk remains.',
    },
  ];

  const getConfidenceIndicator = (confidence: string) => {
    const count = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full ${
              i < count ? 'bg-signal-green' : 'bg-bg-tertiary border border-border-default'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {drivers.map((driver, index) => (
        <div
          key={index}
          className="bg-bg-tertiary border border-border-default rounded-lg p-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center flex-shrink-0">
              <span className="text-accent-blue font-bold">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-semibold text-text-primary">{driver.title}</h3>
                <div className="flex items-center gap-2">
                  {getConfidenceIndicator(driver.confidence)}
                  <span className="text-xs text-text-muted">{driver.confidence}</span>
                </div>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{driver.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Revenue Breakdown Content
const RevenueBreakdownContent: React.FC<{ symbol: string }> = () => {
  const chartData = [
    { segment: 'Industrial', FY23: 450, FY24: 520, FY25: 610 },
    { segment: 'Infrastructure', FY23: 280, FY24: 340, FY25: 420 },
    { segment: 'Services', FY23: 180, FY24: 210, FY25: 250 },
    { segment: 'Exports', FY23: 220, FY24: 290, FY25: 380 },
  ];

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
        <h3 className="text-base font-semibold text-text-primary mb-4">
          Revenue by Segment (₹ Cr)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="segment" stroke="#8B949E" />
            <YAxis stroke="#8B949E" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#161B22',
                border: '1px solid #30363D',
                borderRadius: '6px',
              }}
            />
            <Legend />
            <Bar dataKey="FY23" fill="#58A6FF" name="FY 2023" />
            <Bar dataKey="FY24" fill="#A371F7" name="FY 2024" />
            <Bar dataKey="FY25" fill="#F778BA" name="FY 2025" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="bg-bg-tertiary border border-border-default rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-secondary">
            <tr>
              <th className="text-left p-3 text-text-muted font-medium">Segment</th>
              <th className="text-right p-3 text-text-muted font-medium">FY 2023</th>
              <th className="text-right p-3 text-text-muted font-medium">FY 2024</th>
              <th className="text-right p-3 text-text-muted font-medium">FY 2025</th>
              <th className="text-right p-3 text-text-muted font-medium">Growth (CAGR)</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((row, index) => {
              const cagr = (((row.FY25 / row.FY23) ** (1 / 2) - 1) * 100).toFixed(1);
              return (
                <tr key={index} className="border-t border-border-default">
                  <td className="p-3 text-text-primary font-medium">{row.segment}</td>
                  <td className="p-3 text-right text-text-secondary font-data">
                    ₹{row.FY23}
                  </td>
                  <td className="p-3 text-right text-text-secondary font-data">
                    ₹{row.FY24}
                  </td>
                  <td className="p-3 text-right text-text-secondary font-data">
                    ₹{row.FY25}
                  </td>
                  <td className="p-3 text-right text-signal-green font-data">{cagr}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Corporate History Content
const CorporateHistoryContent: React.FC<{ symbol: string }> = () => {
  const timeline = [
    { year: '1982', event: 'Company founded by Mr. Sharma in Mumbai with ₹50L capital' },
    { year: '1995', event: 'IPO listing on BSE. Raised ₹15 Cr for capacity expansion' },
    { year: '2005', event: 'Acquired competitor "ABC Industries" for ₹120 Cr' },
    { year: '2012', event: 'Established first international subsidiary in UAE' },
    { year: '2018', event: 'Listed on NSE. Received ISO 9001 and ISO 14001 certifications' },
    { year: '2021', event: 'Launched digital initiative. Invested ₹80 Cr in automation' },
    { year: '2024', event: 'Crossed ₹2,000 Cr annual revenue milestone' },
  ];

  return (
    <div className="relative">
      {/* Vertical Timeline */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border-default" />

      <div className="space-y-6">
        {timeline.map((item, index) => (
          <div key={index} className="relative pl-16">
            {/* Timeline Dot */}
            <div className="absolute left-6 top-1.5 w-5 h-5 rounded-full bg-accent-blue border-4 border-bg-secondary" />

            {/* Timeline Content */}
            <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-accent-blue/20 text-accent-blue rounded text-sm font-bold font-mono">
                  {item.year}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{item.event}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileTab;
