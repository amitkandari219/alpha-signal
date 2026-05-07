/**
 * Chart Preferences Store
 *
 * Manages chart type, moving averages, indicators, comparison settings,
 * event filters, and AI patterns with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EventType } from '@/constants/eventTypes';

// Chart type options
export type ChartType = 'line' | 'candle' | 'area' | 'heikinAshi';

// Available moving averages
export type MAType = 'sma20' | 'sma50' | 'sma100' | 'sma200' | 'ema20' | 'vwap' | 'bb';

// Available indicators
export type IndicatorType = 'rsi' | 'macd' | 'stochastic' | 'adx' | 'obv' | 'atr';

// Available AI pattern types
export type AIPatternType =
  | 'supportResistance'
  | 'trendChannel'
  | 'maCrossover'
  | 'rsiDivergence'
  | 'volumeClimax'
  | 'gaps'
  | 'consolidationBreakout';

// Comparison symbol
export interface ComparisonSymbol {
  symbol: string;
  name: string;
}

// Active MA configuration
export interface ActiveMAs {
  sma20: boolean;
  sma50: boolean;
  sma100: boolean;
  sma200: boolean;
  ema20: boolean;
  vwap: boolean;
  bb: boolean; // Bollinger Bands
}

interface ChartState {
  // Chart type
  chartType: ChartType;

  // Moving averages
  activeMAs: ActiveMAs;

  // Indicators (max 3 active)
  activeIndicators: IndicatorType[];

  // Comparison symbols (max 3)
  comparisons: ComparisonSymbol[];

  // Event filters (per event type)
  eventFilters: Record<EventType, boolean>;

  // AI pattern toggles
  aiPatterns: Record<AIPatternType, boolean>;

  // Actions
  setChartType: (type: ChartType) => void;
  toggleMA: (ma: MAType) => void;
  toggleIndicator: (indicator: IndicatorType) => boolean; // Returns false if max reached
  addComparison: (symbol: string, name: string) => boolean; // Returns false if max reached
  removeComparison: (symbol: string) => void;
  clearComparisons: () => void;
  toggleEventFilter: (eventType: EventType) => void;
  setAllEventFilters: (enabled: boolean) => void;
  toggleAIPattern: (pattern: AIPatternType) => void;
  setAllAIPatterns: (enabled: boolean) => void;
  resetToDefaults: () => void;
}

// Default state
const defaultState = {
  chartType: 'candle' as ChartType,
  activeMAs: {
    sma20: false,
    sma50: false,
    sma100: false,
    sma200: false,
    ema20: false,
    vwap: false,
    bb: false,
  },
  activeIndicators: [] as IndicatorType[],
  comparisons: [] as ComparisonSymbol[],
  eventFilters: {
    QUARTERLY_RESULT: true,
    ANNUAL_RESULT: true,
    DIVIDEND_ANNOUNCEMENT: true,
    BONUS_ANNOUNCEMENT: true,
    STOCK_SPLIT: true,
    RIGHTS_ISSUE: true,
    BUYBACK_ANNOUNCEMENT: true,
    MERGER_ANNOUNCEMENT: true,
    ACQUISITION_ANNOUNCEMENT: true,
    DEMERGER_ANNOUNCEMENT: true,
    BOARD_MEETING: false,
    AGM: false,
    EGM: false,
    MANAGEMENT_CHANGE: true,
    AUDITOR_CHANGE: false,
    CREDIT_RATING_CHANGE: true,
    INSIDER_TRADING: true,
    BLOCK_DEAL: false,
    BULK_DEAL: false,
    PROMOTER_PLEDGE: true,
    FII_DII_ACTIVITY: false,
    NEW_PRODUCT_LAUNCH: true,
    CONTRACT_WIN: true,
    CAPEX_ANNOUNCEMENT: true,
    PLANT_EXPANSION: true,
    REGULATORY_APPROVAL: true,
    REGULATORY_ACTION: true,
    LITIGATION: true,
    CREDIT_DEFAULT: true,
    DELISTING: true,
    OTHER: false,
  } as Record<EventType, boolean>,
  aiPatterns: {
    supportResistance: true,
    trendChannel: false,
    maCrossover: false,
    rsiDivergence: false,
    volumeClimax: false,
    gaps: false,
    consolidationBreakout: false,
  } as Record<AIPatternType, boolean>,
};

export const useChartStore = create<ChartState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setChartType: (type: ChartType) => {
        set({ chartType: type });
        console.log('[ChartStore] Chart type changed to:', type);
      },

      toggleMA: (ma: MAType) => {
        set((state) => {
          const newActiveMAs = {
            ...state.activeMAs,
            [ma]: !state.activeMAs[ma],
          };
          console.log('[ChartStore] Toggled MA:', ma, 'to', newActiveMAs[ma]);
          return { activeMAs: newActiveMAs };
        });
      },

      toggleIndicator: (indicator: IndicatorType) => {
        const state = get();
        const isActive = state.activeIndicators.includes(indicator);

        if (isActive) {
          // Remove indicator
          set({
            activeIndicators: state.activeIndicators.filter((i) => i !== indicator),
          });
          console.log('[ChartStore] Removed indicator:', indicator);
          return true;
        } else {
          // Add indicator (max 3)
          if (state.activeIndicators.length >= 3) {
            console.warn('[ChartStore] Max 3 indicators allowed');
            return false;
          }

          set({
            activeIndicators: [...state.activeIndicators, indicator],
          });
          console.log('[ChartStore] Added indicator:', indicator);
          return true;
        }
      },

      addComparison: (symbol: string, name: string) => {
        const state = get();

        // Check if already exists
        if (state.comparisons.some((c) => c.symbol === symbol)) {
          console.warn('[ChartStore] Comparison already exists:', symbol);
          return false;
        }

        // Check max limit
        if (state.comparisons.length >= 3) {
          console.warn('[ChartStore] Max 3 comparisons allowed');
          return false;
        }

        set({
          comparisons: [...state.comparisons, { symbol, name }],
        });
        console.log('[ChartStore] Added comparison:', symbol, name);
        return true;
      },

      removeComparison: (symbol: string) => {
        set((state) => ({
          comparisons: state.comparisons.filter((c) => c.symbol !== symbol),
        }));
        console.log('[ChartStore] Removed comparison:', symbol);
      },

      clearComparisons: () => {
        set({ comparisons: [] });
        console.log('[ChartStore] Cleared all comparisons');
      },

      toggleEventFilter: (eventType: EventType) => {
        set((state) => ({
          eventFilters: {
            ...state.eventFilters,
            [eventType]: !state.eventFilters[eventType],
          },
        }));
        console.log('[ChartStore] Toggled event filter:', eventType);
      },

      setAllEventFilters: (enabled: boolean) => {
        set((state) => {
          const newFilters = { ...state.eventFilters };
          Object.keys(newFilters).forEach((key) => {
            newFilters[key as EventType] = enabled;
          });
          return { eventFilters: newFilters };
        });
        console.log('[ChartStore] Set all event filters to:', enabled);
      },

      toggleAIPattern: (pattern: AIPatternType) => {
        set((state) => ({
          aiPatterns: {
            ...state.aiPatterns,
            [pattern]: !state.aiPatterns[pattern],
          },
        }));
        console.log('[ChartStore] Toggled AI pattern:', pattern);
      },

      setAllAIPatterns: (enabled: boolean) => {
        set((state) => {
          const newPatterns = { ...state.aiPatterns };
          Object.keys(newPatterns).forEach((key) => {
            newPatterns[key as AIPatternType] = enabled;
          });
          return { aiPatterns: newPatterns };
        });
        console.log('[ChartStore] Set all AI patterns to:', enabled);
      },

      resetToDefaults: () => {
        set(defaultState);
        console.log('[ChartStore] Reset to defaults');
      },
    }),
    {
      name: 'alpha-signal-chart-preferences', // localStorage key
    }
  )
);

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get number of active MAs
 */
export function useActiveMAsCount(): number {
  const activeMAs = useChartStore((state) => state.activeMAs);
  return Object.values(activeMAs).filter(Boolean).length;
}

/**
 * Hook to check if a specific MA is active
 */
export function useIsMAActive(ma: MAType): boolean {
  return useChartStore((state) => state.activeMAs[ma]);
}

/**
 * Hook to check if a specific indicator is active
 */
export function useIsIndicatorActive(indicator: IndicatorType): boolean {
  return useChartStore((state) => state.activeIndicators.includes(indicator));
}

/**
 * Hook to get comparison count
 */
export function useComparisonCount(): number {
  return useChartStore((state) => state.comparisons.length);
}

/**
 * Hook to get count of enabled event filters
 */
export function useEnabledEventFiltersCount(): number {
  const eventFilters = useChartStore((state) => state.eventFilters);
  return Object.values(eventFilters).filter(Boolean).length;
}

/**
 * Hook to get count of enabled AI patterns
 */
export function useEnabledAIPatternsCount(): number {
  const aiPatterns = useChartStore((state) => state.aiPatterns);
  return Object.values(aiPatterns).filter(Boolean).length;
}
