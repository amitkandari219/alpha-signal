/**
 * Event Types Constants
 *
 * Maps event types to icons, colors, and categories for chart rendering
 */

import {
  TrendingUp,
  TrendingDown,
  FileText,
  DollarSign,
  Users,
  Building,
  Award,
  AlertCircle,
  Calendar,
  CheckCircle,
  XCircle,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  Repeat,
  Gift,
  UserPlus,
  UserMinus,
  Scale,
  Gavel,
  Shield,
  Bell,
  Briefcase,
  PieChart,
  TrendingUpDown,
  Percent,
  Coins,
  Vote,
  type LucideIcon,
} from 'lucide-react';

export type EventType =
  | 'QUARTERLY_RESULT'
  | 'ANNUAL_RESULT'
  | 'DIVIDEND_ANNOUNCEMENT'
  | 'BONUS_ANNOUNCEMENT'
  | 'STOCK_SPLIT'
  | 'RIGHTS_ISSUE'
  | 'BUYBACK_ANNOUNCEMENT'
  | 'MERGER_ANNOUNCEMENT'
  | 'ACQUISITION_ANNOUNCEMENT'
  | 'DEMERGER_ANNOUNCEMENT'
  | 'BOARD_MEETING'
  | 'AGM'
  | 'EGM'
  | 'MANAGEMENT_CHANGE'
  | 'AUDITOR_CHANGE'
  | 'CREDIT_RATING_CHANGE'
  | 'INSIDER_TRADING'
  | 'BLOCK_DEAL'
  | 'BULK_DEAL'
  | 'PROMOTER_PLEDGE'
  | 'FII_DII_ACTIVITY'
  | 'NEW_PRODUCT_LAUNCH'
  | 'CONTRACT_WIN'
  | 'CAPEX_ANNOUNCEMENT'
  | 'PLANT_EXPANSION'
  | 'REGULATORY_APPROVAL'
  | 'REGULATORY_ACTION'
  | 'LITIGATION'
  | 'CREDIT_DEFAULT'
  | 'DELISTING'
  | 'OTHER';

export type EventCategory =
  | 'FINANCIAL_RESULTS'
  | 'CORPORATE_ACTIONS'
  | 'GOVERNANCE'
  | 'SHAREHOLDING'
  | 'BUSINESS_DEVELOPMENT'
  | 'REGULATORY'
  | 'OTHER';

export interface EventTypeConfig {
  icon: LucideIcon;
  color: string;
  category: EventCategory;
  label: string;
  description: string;
}

/**
 * Event type to icon mapping
 */
export const EVENT_ICON_MAP: Record<EventType, LucideIcon> = {
  QUARTERLY_RESULT: FileText,
  ANNUAL_RESULT: FileText,
  DIVIDEND_ANNOUNCEMENT: DollarSign,
  BONUS_ANNOUNCEMENT: Gift,
  STOCK_SPLIT: Split,
  RIGHTS_ISSUE: Percent,
  BUYBACK_ANNOUNCEMENT: Repeat,
  MERGER_ANNOUNCEMENT: Building,
  ACQUISITION_ANNOUNCEMENT: Building,
  DEMERGER_ANNOUNCEMENT: TrendingUpDown,
  BOARD_MEETING: Calendar,
  AGM: Users,
  EGM: Users,
  MANAGEMENT_CHANGE: UserPlus,
  AUDITOR_CHANGE: UserMinus,
  CREDIT_RATING_CHANGE: Award,
  INSIDER_TRADING: AlertCircle,
  BLOCK_DEAL: Briefcase,
  BULK_DEAL: Briefcase,
  PROMOTER_PLEDGE: Shield,
  FII_DII_ACTIVITY: TrendingUp,
  NEW_PRODUCT_LAUNCH: Bell,
  CONTRACT_WIN: CheckCircle,
  CAPEX_ANNOUNCEMENT: Coins,
  PLANT_EXPANSION: Building,
  REGULATORY_APPROVAL: CheckCircle,
  REGULATORY_ACTION: Gavel,
  LITIGATION: Scale,
  CREDIT_DEFAULT: XCircle,
  DELISTING: XCircle,
  OTHER: Info,
};

/**
 * Event type to color mapping (Tailwind classes for HTML, actual colors for SVG)
 */
export const EVENT_COLOR_MAP: Record<EventType, { bg: string; text: string; border: string; svgFill: string; svgStroke: string }> = {
  QUARTERLY_RESULT: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500', svgFill: 'rgba(59, 130, 246, 0.3)', svgStroke: '#3b82f6' },
  ANNUAL_RESULT: { bg: 'bg-blue-600/20', text: 'text-blue-500', border: 'border-blue-600', svgFill: 'rgba(37, 99, 235, 0.3)', svgStroke: '#2563eb' },
  DIVIDEND_ANNOUNCEMENT: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500', svgFill: 'rgba(34, 197, 94, 0.3)', svgStroke: '#22c55e' },
  BONUS_ANNOUNCEMENT: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500', svgFill: 'rgba(16, 185, 129, 0.3)', svgStroke: '#10b981' },
  STOCK_SPLIT: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500', svgFill: 'rgba(20, 184, 166, 0.3)', svgStroke: '#14b8a6' },
  RIGHTS_ISSUE: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500', svgFill: 'rgba(6, 182, 212, 0.3)', svgStroke: '#06b6d4' },
  BUYBACK_ANNOUNCEMENT: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500', svgFill: 'rgba(99, 102, 241, 0.3)', svgStroke: '#6366f1' },
  MERGER_ANNOUNCEMENT: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500', svgFill: 'rgba(168, 85, 247, 0.3)', svgStroke: '#a855f7' },
  ACQUISITION_ANNOUNCEMENT: { bg: 'bg-purple-600/20', text: 'text-purple-500', border: 'border-purple-600', svgFill: 'rgba(147, 51, 234, 0.3)', svgStroke: '#9333ea' },
  DEMERGER_ANNOUNCEMENT: { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500', svgFill: 'rgba(139, 92, 246, 0.3)', svgStroke: '#8b5cf6' },
  BOARD_MEETING: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500', svgFill: 'rgba(100, 116, 139, 0.3)', svgStroke: '#64748b' },
  AGM: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500', svgFill: 'rgba(107, 114, 128, 0.3)', svgStroke: '#6b7280' },
  EGM: { bg: 'bg-gray-600/20', text: 'text-gray-500', border: 'border-gray-600', svgFill: 'rgba(75, 85, 99, 0.3)', svgStroke: '#4b5563' },
  MANAGEMENT_CHANGE: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500', svgFill: 'rgba(249, 115, 22, 0.3)', svgStroke: '#f97316' },
  AUDITOR_CHANGE: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500', svgFill: 'rgba(245, 158, 11, 0.3)', svgStroke: '#f59e0b' },
  CREDIT_RATING_CHANGE: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500', svgFill: 'rgba(234, 179, 8, 0.3)', svgStroke: '#eab308' },
  INSIDER_TRADING: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500', svgFill: 'rgba(239, 68, 68, 0.3)', svgStroke: '#ef4444' },
  BLOCK_DEAL: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500', svgFill: 'rgba(236, 72, 153, 0.3)', svgStroke: '#ec4899' },
  BULK_DEAL: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500', svgFill: 'rgba(244, 63, 94, 0.3)', svgStroke: '#f43f5e' },
  PROMOTER_PLEDGE: { bg: 'bg-red-600/20', text: 'text-red-500', border: 'border-red-600', svgFill: 'rgba(220, 38, 38, 0.3)', svgStroke: '#dc2626' },
  FII_DII_ACTIVITY: { bg: 'bg-green-600/20', text: 'text-green-500', border: 'border-green-600', svgFill: 'rgba(22, 163, 74, 0.3)', svgStroke: '#16a34a' },
  NEW_PRODUCT_LAUNCH: { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500', svgFill: 'rgba(14, 165, 233, 0.3)', svgStroke: '#0ea5e9' },
  CONTRACT_WIN: { bg: 'bg-lime-500/20', text: 'text-lime-400', border: 'border-lime-500', svgFill: 'rgba(132, 204, 22, 0.3)', svgStroke: '#84cc16' },
  CAPEX_ANNOUNCEMENT: { bg: 'bg-emerald-600/20', text: 'text-emerald-500', border: 'border-emerald-600', svgFill: 'rgba(5, 150, 105, 0.3)', svgStroke: '#059669' },
  PLANT_EXPANSION: { bg: 'bg-teal-600/20', text: 'text-teal-500', border: 'border-teal-600', svgFill: 'rgba(13, 148, 136, 0.3)', svgStroke: '#0d9488' },
  REGULATORY_APPROVAL: { bg: 'bg-green-700/20', text: 'text-green-600', border: 'border-green-700', svgFill: 'rgba(21, 128, 61, 0.3)', svgStroke: '#15803d' },
  REGULATORY_ACTION: { bg: 'bg-orange-600/20', text: 'text-orange-500', border: 'border-orange-600', svgFill: 'rgba(234, 88, 12, 0.3)', svgStroke: '#ea580c' },
  LITIGATION: { bg: 'bg-red-700/20', text: 'text-red-600', border: 'border-red-700', svgFill: 'rgba(185, 28, 28, 0.3)', svgStroke: '#b91c1c' },
  CREDIT_DEFAULT: { bg: 'bg-red-800/20', text: 'text-red-700', border: 'border-red-800', svgFill: 'rgba(153, 27, 27, 0.3)', svgStroke: '#991b1b' },
  DELISTING: { bg: 'bg-gray-700/20', text: 'text-gray-600', border: 'border-gray-700', svgFill: 'rgba(55, 65, 81, 0.3)', svgStroke: '#374151' },
  OTHER: { bg: 'bg-slate-600/20', text: 'text-slate-500', border: 'border-slate-600', svgFill: 'rgba(71, 85, 105, 0.3)', svgStroke: '#475569' },
};

/**
 * Full event type configuration
 */
export const EVENT_TYPE_CONFIG: Record<EventType, EventTypeConfig> = {
  QUARTERLY_RESULT: {
    icon: FileText,
    color: 'blue',
    category: 'FINANCIAL_RESULTS',
    label: 'Quarterly Result',
    description: 'Company quarterly financial results announcement',
  },
  ANNUAL_RESULT: {
    icon: FileText,
    color: 'blue',
    category: 'FINANCIAL_RESULTS',
    label: 'Annual Result',
    description: 'Company annual financial results announcement',
  },
  DIVIDEND_ANNOUNCEMENT: {
    icon: DollarSign,
    color: 'green',
    category: 'CORPORATE_ACTIONS',
    label: 'Dividend',
    description: 'Dividend declaration announcement',
  },
  BONUS_ANNOUNCEMENT: {
    icon: Gift,
    color: 'emerald',
    category: 'CORPORATE_ACTIONS',
    label: 'Bonus',
    description: 'Bonus shares announcement',
  },
  STOCK_SPLIT: {
    icon: Split,
    color: 'teal',
    category: 'CORPORATE_ACTIONS',
    label: 'Stock Split',
    description: 'Stock split announcement',
  },
  RIGHTS_ISSUE: {
    icon: Percent,
    color: 'cyan',
    category: 'CORPORATE_ACTIONS',
    label: 'Rights Issue',
    description: 'Rights issue announcement',
  },
  BUYBACK_ANNOUNCEMENT: {
    icon: Repeat,
    color: 'indigo',
    category: 'CORPORATE_ACTIONS',
    label: 'Buyback',
    description: 'Share buyback announcement',
  },
  MERGER_ANNOUNCEMENT: {
    icon: Building,
    color: 'purple',
    category: 'CORPORATE_ACTIONS',
    label: 'Merger',
    description: 'Merger announcement',
  },
  ACQUISITION_ANNOUNCEMENT: {
    icon: Building,
    color: 'purple',
    category: 'CORPORATE_ACTIONS',
    label: 'Acquisition',
    description: 'Acquisition announcement',
  },
  DEMERGER_ANNOUNCEMENT: {
    icon: TrendingUpDown,
    color: 'violet',
    category: 'CORPORATE_ACTIONS',
    label: 'Demerger',
    description: 'Demerger announcement',
  },
  BOARD_MEETING: {
    icon: Calendar,
    color: 'slate',
    category: 'GOVERNANCE',
    label: 'Board Meeting',
    description: 'Board meeting scheduled',
  },
  AGM: {
    icon: Users,
    color: 'gray',
    category: 'GOVERNANCE',
    label: 'AGM',
    description: 'Annual General Meeting',
  },
  EGM: {
    icon: Users,
    color: 'gray',
    category: 'GOVERNANCE',
    label: 'EGM',
    description: 'Extraordinary General Meeting',
  },
  MANAGEMENT_CHANGE: {
    icon: UserPlus,
    color: 'orange',
    category: 'GOVERNANCE',
    label: 'Management Change',
    description: 'Change in company management',
  },
  AUDITOR_CHANGE: {
    icon: UserMinus,
    color: 'amber',
    category: 'GOVERNANCE',
    label: 'Auditor Change',
    description: 'Change in company auditor',
  },
  CREDIT_RATING_CHANGE: {
    icon: Award,
    color: 'yellow',
    category: 'GOVERNANCE',
    label: 'Credit Rating',
    description: 'Credit rating change',
  },
  INSIDER_TRADING: {
    icon: AlertCircle,
    color: 'red',
    category: 'SHAREHOLDING',
    label: 'Insider Trading',
    description: 'Insider trading activity',
  },
  BLOCK_DEAL: {
    icon: Briefcase,
    color: 'pink',
    category: 'SHAREHOLDING',
    label: 'Block Deal',
    description: 'Block deal transaction',
  },
  BULK_DEAL: {
    icon: Briefcase,
    color: 'rose',
    category: 'SHAREHOLDING',
    label: 'Bulk Deal',
    description: 'Bulk deal transaction',
  },
  PROMOTER_PLEDGE: {
    icon: Shield,
    color: 'red',
    category: 'SHAREHOLDING',
    label: 'Promoter Pledge',
    description: 'Promoter shareholding pledge',
  },
  FII_DII_ACTIVITY: {
    icon: TrendingUp,
    color: 'green',
    category: 'SHAREHOLDING',
    label: 'FII/DII Activity',
    description: 'Foreign and domestic institutional investor activity',
  },
  NEW_PRODUCT_LAUNCH: {
    icon: Bell,
    color: 'sky',
    category: 'BUSINESS_DEVELOPMENT',
    label: 'Product Launch',
    description: 'New product or service launch',
  },
  CONTRACT_WIN: {
    icon: CheckCircle,
    color: 'lime',
    category: 'BUSINESS_DEVELOPMENT',
    label: 'Contract Win',
    description: 'New contract or order win',
  },
  CAPEX_ANNOUNCEMENT: {
    icon: Coins,
    color: 'emerald',
    category: 'BUSINESS_DEVELOPMENT',
    label: 'CapEx',
    description: 'Capital expenditure announcement',
  },
  PLANT_EXPANSION: {
    icon: Building,
    color: 'teal',
    category: 'BUSINESS_DEVELOPMENT',
    label: 'Plant Expansion',
    description: 'Manufacturing plant expansion',
  },
  REGULATORY_APPROVAL: {
    icon: CheckCircle,
    color: 'green',
    category: 'REGULATORY',
    label: 'Regulatory Approval',
    description: 'Regulatory approval received',
  },
  REGULATORY_ACTION: {
    icon: Gavel,
    color: 'orange',
    category: 'REGULATORY',
    label: 'Regulatory Action',
    description: 'Regulatory action taken',
  },
  LITIGATION: {
    icon: Scale,
    color: 'red',
    category: 'REGULATORY',
    label: 'Litigation',
    description: 'Legal proceedings or litigation',
  },
  CREDIT_DEFAULT: {
    icon: XCircle,
    color: 'red',
    category: 'REGULATORY',
    label: 'Credit Default',
    description: 'Credit default or payment failure',
  },
  DELISTING: {
    icon: XCircle,
    color: 'gray',
    category: 'OTHER',
    label: 'Delisting',
    description: 'Stock delisting announcement',
  },
  OTHER: {
    icon: Info,
    color: 'slate',
    category: 'OTHER',
    label: 'Other',
    description: 'Other corporate event',
  },
};

/**
 * Category groupings for filter dropdown
 */
export const EVENT_CATEGORIES: Record<EventCategory, { label: string; types: EventType[] }> = {
  FINANCIAL_RESULTS: {
    label: 'Financial Results',
    types: ['QUARTERLY_RESULT', 'ANNUAL_RESULT'],
  },
  CORPORATE_ACTIONS: {
    label: 'Corporate Actions',
    types: [
      'DIVIDEND_ANNOUNCEMENT',
      'BONUS_ANNOUNCEMENT',
      'STOCK_SPLIT',
      'RIGHTS_ISSUE',
      'BUYBACK_ANNOUNCEMENT',
      'MERGER_ANNOUNCEMENT',
      'ACQUISITION_ANNOUNCEMENT',
      'DEMERGER_ANNOUNCEMENT',
    ],
  },
  GOVERNANCE: {
    label: 'Governance',
    types: [
      'BOARD_MEETING',
      'AGM',
      'EGM',
      'MANAGEMENT_CHANGE',
      'AUDITOR_CHANGE',
      'CREDIT_RATING_CHANGE',
    ],
  },
  SHAREHOLDING: {
    label: 'Shareholding Changes',
    types: [
      'INSIDER_TRADING',
      'BLOCK_DEAL',
      'BULK_DEAL',
      'PROMOTER_PLEDGE',
      'FII_DII_ACTIVITY',
    ],
  },
  BUSINESS_DEVELOPMENT: {
    label: 'Business Development',
    types: [
      'NEW_PRODUCT_LAUNCH',
      'CONTRACT_WIN',
      'CAPEX_ANNOUNCEMENT',
      'PLANT_EXPANSION',
    ],
  },
  REGULATORY: {
    label: 'Regulatory & Legal',
    types: [
      'REGULATORY_APPROVAL',
      'REGULATORY_ACTION',
      'LITIGATION',
      'CREDIT_DEFAULT',
    ],
  },
  OTHER: {
    label: 'Other Events',
    types: ['DELISTING', 'OTHER'],
  },
};

/**
 * Impact assessment types
 */
export type ImpactAssessment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';

/**
 * Get impact icon and color
 */
export const getImpactDisplay = (
  impact: ImpactAssessment
): { icon: string; color: string; label: string } => {
  switch (impact) {
    case 'POSITIVE':
      return { icon: '↑', color: 'text-green-500', label: 'Positive' };
    case 'NEGATIVE':
      return { icon: '↓', color: 'text-red-500', label: 'Negative' };
    case 'NEUTRAL':
      return { icon: '→', color: 'text-gray-400', label: 'Neutral' };
  }
};
