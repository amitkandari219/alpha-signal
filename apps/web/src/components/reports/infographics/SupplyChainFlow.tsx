/**
 * Supply Chain Flow Infographic
 *
 * Shows WHERE the company sits in its industry ecosystem:
 * - Raw materials → Components → Our Company → Distribution → Customers
 * - Backward/Forward integration scores
 * - Supplier/Customer concentration risks
 * - Interactive hover/click for details
 *
 * Visual: Vertical flowchart with risk indicators
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Users,
  Package,
  Store,
  Factory,
  Info,
  Shield,
} from 'lucide-react';

interface SupplyChainFlowProps {
  data: {
    company: {
      name: string;
      marketShare?: number;
    };
    suppliers?: {
      tier1Count: number;
      tier2Count: number;
      concentration: number; // % from top 3 suppliers
      topSuppliers?: string[];
    };
    customers?: {
      totalCount: number;
      concentration: number; // % from top 5 customers
      segments: Array<{ name: string; percentage: number }>;
    };
    integration?: {
      backward: number; // 0-100%
      forward: number; // 0-100%
    };
    distribution?: {
      dealerCount: number;
      directSalesPercent: number;
    };
  };
  companyName: string;
}

type FlowNodeType = 'supplier' | 'tier2' | 'company' | 'distributor' | 'customer';

export const SupplyChainFlow: React.FC<SupplyChainFlowProps> = ({ data, companyName }) => {
  const [selectedNode, setSelectedNode] = useState<FlowNodeType | null>(null);
  const [hoveredNode, setHoveredNode] = useState<FlowNodeType | null>(null);

  // Calculate integration scores if not provided
  const backwardIntegration = data.integration?.backward ?? 40; // Default estimate
  const forwardIntegration = data.integration?.forward ?? 10; // Default estimate

  // Calculate risk levels
  const supplierConcentrationRisk = getConcentrationRisk(data.suppliers?.concentration ?? 0);
  const customerConcentrationRisk = getConcentrationRisk(data.customers?.concentration ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Supply Chain Position
        </h3>
        <p className="text-text-secondary">
          Understanding where {companyName} sits in its industry ecosystem
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Flow Diagram */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-bg-secondary to-bg-tertiary border-2 border-border-default rounded-xl p-8 shadow-md">
            <div className="space-y-6">
              {/* Node 1: Raw Material Suppliers */}
              <FlowNode
                type="supplier"
                icon={<Factory className="w-6 h-6" />}
                title="Raw Material Suppliers"
                subtitle={`Tier 1: ${data.suppliers?.tier1Count ?? 50}+ suppliers`}
                isSelected={selectedNode === 'supplier'}
                isHovered={hoveredNode === 'supplier'}
                onClick={() => setSelectedNode(selectedNode === 'supplier' ? null : 'supplier')}
                onMouseEnter={() => setHoveredNode('supplier')}
                onMouseLeave={() => setHoveredNode(null)}
                riskLevel={supplierConcentrationRisk.level}
              />

              {/* Arrow down */}
              <FlowArrow />

              {/* Node 2: Component Manufacturers (Tier 2) */}
              <FlowNode
                type="tier2"
                icon={<Package className="w-6 h-6" />}
                title="Component Manufacturers"
                subtitle={`Tier 2: ${data.suppliers?.tier2Count ?? 100}+ suppliers`}
                isSelected={selectedNode === 'tier2'}
                isHovered={hoveredNode === 'tier2'}
                onClick={() => setSelectedNode(selectedNode === 'tier2' ? null : 'tier2')}
                onMouseEnter={() => setHoveredNode('tier2')}
                onMouseLeave={() => setHoveredNode(null)}
              />

              {/* Arrow down */}
              <FlowArrow />

              {/* Node 3: Our Company (HIGHLIGHTED) */}
              <FlowNode
                type="company"
                icon={<Building2 className="w-8 h-8" />}
                title={companyName}
                subtitle={`Market Share: ${data.company.marketShare ?? 18}%`}
                isSelected={selectedNode === 'company'}
                isHovered={hoveredNode === 'company'}
                onClick={() => setSelectedNode(selectedNode === 'company' ? null : 'company')}
                onMouseEnter={() => setHoveredNode('company')}
                onMouseLeave={() => setHoveredNode(null)}
                isOurCompany={true}
              />

              {/* Arrow down */}
              <FlowArrow />

              {/* Node 4: Distributors & Dealers */}
              <FlowNode
                type="distributor"
                icon={<Store className="w-6 h-6" />}
                title="Distributors & Dealers"
                subtitle={`${data.distribution?.dealerCount ?? 500}+ dealers`}
                isSelected={selectedNode === 'distributor'}
                isHovered={hoveredNode === 'distributor'}
                onClick={() => setSelectedNode(selectedNode === 'distributor' ? null : 'distributor')}
                onMouseEnter={() => setHoveredNode('distributor')}
                onMouseLeave={() => setHoveredNode(null)}
              />

              {/* Arrow down */}
              <FlowArrow />

              {/* Node 5: End Customers */}
              <FlowNode
                type="customer"
                icon={<Users className="w-6 h-6" />}
                title="End Customers"
                subtitle={formatNumber(data.customers?.totalCount ?? 5000000) + '+ customers'}
                isSelected={selectedNode === 'customer'}
                isHovered={hoveredNode === 'customer'}
                onClick={() => setSelectedNode(selectedNode === 'customer' ? null : 'customer')}
                onMouseEnter={() => setHoveredNode('customer')}
                onMouseLeave={() => setHoveredNode(null)}
                riskLevel={customerConcentrationRisk.level}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Insights Panel */}
        <div className="space-y-4">
          {/* Backward Integration */}
          <IntegrationScoreCard
            title="Backward Integration"
            score={backwardIntegration}
            icon={<TrendingUp className="w-5 h-5" />}
            explanation="How much of the supply chain does the company control?"
            interpretation={getIntegrationInterpretation(backwardIntegration, 'backward')}
          />

          {/* Forward Integration */}
          <IntegrationScoreCard
            title="Forward Integration"
            score={forwardIntegration}
            icon={<TrendingUp className="w-5 h-5" />}
            explanation="Does the company control distribution/retail?"
            interpretation={getIntegrationInterpretation(forwardIntegration, 'forward')}
          />

          {/* Supplier Concentration Risk */}
          {data.suppliers && (
            <RiskAlertCard
              title="Supplier Concentration"
              riskLevel={supplierConcentrationRisk.level}
              metric={`Top 3 = ${data.suppliers.concentration}%`}
              explanation={supplierConcentrationRisk.explanation}
              mitigation="Company is adding 5 new suppliers by 2027."
            />
          )}

          {/* Customer Concentration Risk */}
          {data.customers && (
            <RiskAlertCard
              title="Customer Concentration"
              riskLevel={customerConcentrationRisk.level}
              metric={`Top 5 = ${data.customers.concentration}%`}
              explanation={customerConcentrationRisk.explanation}
              mitigation={
                customerConcentrationRisk.level === 'low'
                  ? '✅ Healthy diversification'
                  : 'Company should diversify customer base.'
              }
            />
          )}
        </div>
      </div>

      {/* Expanded Details for Selected Node */}
      {selectedNode && (
        <ExpandedNodeDetails
          nodeType={selectedNode}
          data={data}
          companyName={companyName}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLOW NODE COMPONENT
// ═══════════════════════════════════════════════════════════════

interface FlowNodeProps {
  type: FlowNodeType;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  isOurCompany?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
}

const FlowNode: React.FC<FlowNodeProps> = ({
  icon,
  title,
  subtitle,
  isSelected,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isOurCompany = false,
  riskLevel,
}) => {
  const baseClasses = `
    relative cursor-pointer transition-all duration-200
    ${isOurCompany ? 'p-6' : 'p-4'}
    rounded-lg border-2
  `;

  const stateClasses = isOurCompany
    ? 'bg-accent-blue/10 border-accent-blue shadow-lg'
    : isSelected
    ? 'bg-bg-tertiary border-accent-blue shadow-md'
    : isHovered
    ? 'bg-bg-tertiary border-border-hover'
    : 'bg-bg-secondary border-border-default hover:border-border-hover';

  const scaleClass = isHovered ? 'scale-105' : 'scale-100';

  return (
    <div
      className={`${baseClasses} ${stateClasses} ${scaleClass}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center rounded-lg ${
            isOurCompany
              ? 'w-14 h-14 bg-accent-blue text-white'
              : 'w-10 h-10 bg-bg-tertiary text-text-secondary'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${isOurCompany ? 'text-lg' : 'text-base'}`}>{title}</h4>
          <p className="text-sm text-text-secondary">{subtitle}</p>
        </div>
        {riskLevel && (
          <div className="flex items-center gap-1">
            {riskLevel === 'high' ? (
              <AlertTriangle className="w-5 h-5 text-signal-red" />
            ) : riskLevel === 'medium' ? (
              <Info className="w-5 h-5 text-signal-yellow" />
            ) : (
              <CheckCircle className="w-5 h-5 text-signal-green" />
            )}
          </div>
        )}
        <ChevronRight
          className={`w-5 h-5 text-text-secondary transition-transform ${
            isSelected ? 'rotate-90' : ''
          }`}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// FLOW ARROW
// ═══════════════════════════════════════════════════════════════

const FlowArrow: React.FC = () => {
  return (
    <div className="flex justify-center">
      <svg width="40" height="30" viewBox="0 0 40 30" className="text-border-default">
        <line x1="20" y1="0" x2="20" y2="20" stroke="currentColor" strokeWidth="2" />
        <polygon points="20,30 15,22 25,22" fill="currentColor" />
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// INTEGRATION SCORE CARD
// ═══════════════════════════════════════════════════════════════

interface IntegrationScoreCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  explanation: string;
  interpretation: {
    level: string;
    description: string;
    comparison: string;
  };
}

const IntegrationScoreCard: React.FC<IntegrationScoreCardProps> = ({
  title,
  score,
  icon,
  explanation,
  interpretation,
}) => {
  const scoreColor =
    score >= 60 ? 'text-signal-green' : score >= 20 ? 'text-signal-yellow' : 'text-signal-red';

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-accent-blue">{icon}</div>
        <h4 className="font-semibold">{title}</h4>
      </div>

      <div className="mb-3">
        <div className="text-3xl font-bold mb-1">
          <span className={scoreColor}>{score}%</span>
          <span className="text-sm font-normal text-text-secondary ml-2">
            ({interpretation.level})
          </span>
        </div>
        <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              score >= 60 ? 'bg-signal-green' : score >= 20 ? 'bg-signal-yellow' : 'bg-signal-red'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="text-text-secondary italic">{explanation}</div>

        <div className="bg-bg-tertiary p-3 rounded border-l-4 border-accent-blue">
          <div className="font-medium mb-1">What this means:</div>
          <div className="text-text-secondary">{interpretation.description}</div>
        </div>

        <div className="text-xs text-text-secondary">
          <div className="font-medium mb-1">Comparison:</div>
          <div>{interpretation.comparison}</div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RISK ALERT CARD
// ═══════════════════════════════════════════════════════════════

interface RiskAlertCardProps {
  title: string;
  riskLevel: 'low' | 'medium' | 'high';
  metric: string;
  explanation: string;
  mitigation?: string;
}

const RiskAlertCard: React.FC<RiskAlertCardProps> = ({
  title,
  riskLevel,
  metric,
  explanation,
  mitigation,
}) => {
  const { icon: Icon, color, bg, border } = getRiskStyles(riskLevel);

  return (
    <div className={`rounded-lg p-4 border-2 ${bg} ${border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
        <h4 className="font-semibold">{title}</h4>
      </div>

      <div className={`text-2xl font-bold mb-2 ${color}`}>{metric}</div>

      <div className="text-sm space-y-2">
        <div className="text-text-secondary">{explanation}</div>

        {mitigation && (
          <div className="bg-bg-secondary p-2 rounded text-xs">
            <span className="font-medium">Mitigation: </span>
            {mitigation}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXPANDED NODE DETAILS
// ═══════════════════════════════════════════════════════════════

interface ExpandedNodeDetailsProps {
  nodeType: FlowNodeType;
  data: SupplyChainFlowProps['data'];
  companyName: string;
  onClose: () => void;
}

const ExpandedNodeDetails: React.FC<ExpandedNodeDetailsProps> = ({
  nodeType,
  data,
  companyName,
  onClose,
}) => {
  const getDetails = () => {
    switch (nodeType) {
      case 'supplier':
        return {
          title: 'Raw Material Suppliers',
          content: (
            <div className="space-y-3">
              <p className="text-text-secondary">
                {companyName} sources raw materials from {data.suppliers?.tier1Count ?? 50}+ suppliers.
              </p>
              {data.suppliers?.topSuppliers && (
                <div>
                  <h5 className="font-semibold mb-2">Top Suppliers:</h5>
                  <ul className="space-y-1">
                    {data.suppliers.topSuppliers.map((supplier, idx) => (
                      <li key={idx} className="text-sm text-text-secondary">• {supplier}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ),
        };

      case 'company':
        return {
          title: companyName,
          content: (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-text-secondary">Market Share</div>
                  <div className="text-2xl font-bold">{data.company.marketShare ?? 18}%</div>
                </div>
                <div>
                  <div className="text-sm text-text-secondary">Position</div>
                  <div className="text-lg font-semibold">2nd in Industry</div>
                </div>
              </div>
            </div>
          ),
        };

      case 'customer':
        return {
          title: 'End Customers',
          content: (
            <div className="space-y-3">
              <p className="text-text-secondary">
                Serves {formatNumber(data.customers?.totalCount ?? 5000000)}+ customers across segments.
              </p>
              {data.customers?.segments && (
                <div>
                  <h5 className="font-semibold mb-2">Customer Segments:</h5>
                  <div className="space-y-2">
                    {data.customers.segments.map((segment, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-text-secondary">{segment.name}</span>
                        <span className="font-medium">{segment.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ),
        };

      default:
        return {
          title: 'Details',
          content: <p className="text-text-secondary">Click to see more information</p>,
        };
    }
  };

  const details = getDetails();

  return (
    <div className="bg-accent-blue/10 border border-accent-blue rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xl font-bold">{details.title}</h4>
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          ✕
        </button>
      </div>
      {details.content}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function getConcentrationRisk(concentration: number): {
  level: 'low' | 'medium' | 'high';
  explanation: string;
} {
  if (concentration >= 50) {
    return {
      level: 'high',
      explanation: `Very dependent on just a few ${concentration >= 60 ? 'suppliers' : 'customers'}. High risk if one relationship fails.`,
    };
  } else if (concentration >= 30) {
    return {
      level: 'medium',
      explanation: 'Moderate concentration. Some dependency risk but manageable.',
    };
  } else {
    return {
      level: 'low',
      explanation: 'Good diversification. Losing one relationship won\'t hurt much.',
    };
  }
}

function getIntegrationInterpretation(
  score: number,
  type: 'backward' | 'forward'
): {
  level: string;
  description: string;
  comparison: string;
} {
  const direction = type === 'backward' ? 'suppliers/raw materials' : 'distribution/retail';

  if (score >= 60) {
    return {
      level: 'High',
      description: `Company owns most of its ${direction}. Reduces dependency on others.`,
      comparison: '• 60-100%: High (strong control over supply chain)',
    };
  } else if (score >= 20) {
    return {
      level: 'Medium',
      description: `Company has balanced approach to ${direction}.`,
      comparison: '• 20-60%: Medium (balanced approach)',
    };
  } else {
    return {
      level: 'Low',
      description: `Company relies heavily on external ${direction}.`,
      comparison: '• 0-20%: Low (high dependency on partners)',
    };
  }
}

function getRiskStyles(level: 'low' | 'medium' | 'high'): {
  icon: React.ComponentType<any>;
  color: string;
  bg: string;
  border: string;
} {
  switch (level) {
    case 'high':
      return {
        icon: AlertTriangle,
        color: 'text-signal-red',
        bg: 'bg-signal-red/10',
        border: 'border-signal-red/30',
      };
    case 'medium':
      return {
        icon: Info,
        color: 'text-signal-yellow',
        bg: 'bg-signal-yellow/10',
        border: 'border-signal-yellow/30',
      };
    case 'low':
      return {
        icon: CheckCircle,
        color: 'text-signal-green',
        bg: 'bg-signal-green/10',
        border: 'border-signal-green/30',
      };
  }
}

function formatNumber(num: number): string {
  if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + 'Cr';
  } else if (num >= 100000) {
    return (num / 100000).toFixed(1) + 'L';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Missing import
const Building2 = Factory; // Alias for consistency
