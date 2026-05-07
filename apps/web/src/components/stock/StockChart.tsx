/**
 * Professional Stock Chart Component (Enhanced Recharts Version)
 *
 * Features:
 * - Multiple chart types (Line, Candlestick, Area, Heikin-Ashi)
 * - Moving average overlays (SMA, EMA, VWAP, Bollinger Bands)
 * - Technical indicator sub-chart panels (RSI, MACD, Stochastic, ADX, OBV, ATR)
 * - Synced crosshair across all panels
 * - Comparison overlay with normalized % returns
 * - Comprehensive tooltip with MA values and indicator values
 * - Integrated with chart controls and preferences store
 * - AI-powered pattern detection (7 algorithms)
 * - Event markers from stock_events table
 * - Interactive drawing tools with undo/redo
 */

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import { X } from 'lucide-react';
import { useChartStore } from '../../store/useChartStore';
import { useCrosshairSync } from '../../contexts/CrosshairSyncContext';
import { OHLCVData } from '../../utils/technicalIndicators';
import {
  calculateSMA,
  calculateEMA,
  calculateVWAP,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateADX,
  calculateOBV,
  calculateATR,
} from '../../utils/technicalIndicators';
import {
  convertToHeikinAshi,
  MA_COLORS,
  COMPARISON_COLORS,
  formatPrice,
  formatPercent,
  formatVolume,
  generateComparisonData,
  normalizeToPercentReturn,
} from '../../utils/chartHelpers';
import {
  RSIPanel,
  MACDPanel,
  StochasticPanel,
  ADXPanel,
  OBVPanel,
  ATRPanel,
} from './IndicatorPanels';
import { createChartCoordinateMapper, type ChartCoordinateMapper } from '../../utils/chartCoordinates';
import { detectAllPatterns } from '../../utils/chartPatterns';
import { AIAnnotations } from '../chart/AIAnnotations';
import { DrawingCanvas } from '../chart/DrawingCanvas';
import { DrawingToolbar } from '../chart/DrawingToolbar';
import { EventMarkers } from '../chart/EventMarkers';
import { useDrawingStore } from '../../store/useDrawingStore';
import { useChartEvents } from '../../hooks/useChartEvents';

interface StockChartProps {
  data: OHLCVData[];
  period: string;
  height?: number;
  symbol?: string;
}

export const StockChart: React.FC<StockChartProps> = ({
  data,
  period,
  height = 400,
  symbol = 'STOCK',
}) => {
  // Chart store
  const chartType = useChartStore((state) => state.chartType);
  const activeMAs = useChartStore((state) => state.activeMAs);
  const activeIndicators = useChartStore((state) => state.activeIndicators);
  const comparisons = useChartStore((state) => state.comparisons);
  const removeComparison = useChartStore((state) => state.removeComparison);
  const aiPatterns = useChartStore((state) => state.aiPatterns);

  // Crosshair sync for indicator panels
  const { crosshairState, setCrosshairState, clearCrosshair } = useCrosshairSync();

  // Refs for coordinate mapping and drawing
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [coordinateMapper, setCoordinateMapper] = useState<ChartCoordinateMapper | null>(null);

  // Drawing store
  const setCurrentSymbol = useDrawingStore((state) => state.setCurrentSymbol);

  // Responsive heights
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Calculate dynamic main chart height based on active panels
  const panelHeight = isMobile ? 60 : 80;
  const totalPanelHeight = activeIndicators.length * panelHeight;
  const minMainChartHeight = isMobile ? 200 : 250;
  const adjustedMainChartHeight = Math.max(
    (isMobile ? Math.min(height, 250) : height) - totalPanelHeight,
    minMainChartHeight
  );

  // Check if in comparison mode
  const isComparisonMode = comparisons.length > 0;

  // In comparison mode, force line chart (candlesticks don't work for normalized returns)
  const effectiveChartType = isComparisonMode ? 'line' : chartType;
  const useCandlestick = effectiveChartType === 'candle' || effectiveChartType === 'heikinAshi';

  // Process data based on chart type
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let workingData = data;

    if (effectiveChartType === 'heikinAshi') {
      workingData = convertToHeikinAshi(data);
    }

    return workingData;
  }, [data, effectiveChartType]);

  // Generate comparison data
  const comparisonData = useMemo(() => {
    if (!isComparisonMode || !data || data.length === 0) return [];

    return comparisons.map((comp) => {
      const mockData = generateComparisonData(
        comp.symbol,
        data[0].time,
        data[data.length - 1].time,
        data
      );
      return {
        symbol: comp.symbol,
        name: comp.name,
        data: mockData,
        normalized: normalizeToPercentReturn(mockData),
      };
    });
  }, [comparisons, data, isComparisonMode]);

  // Normalize main stock data for comparison mode
  const normalizedMainData = useMemo(() => {
    if (!isComparisonMode || !processedData || processedData.length === 0) return [];
    return normalizeToPercentReturn(processedData);
  }, [processedData, isComparisonMode]);

  // Calculate moving averages
  const maData = useMemo(() => {
    if (!data || data.length === 0) return {};

    const result: any = {};

    if (activeMAs.sma20) result.sma20 = calculateSMA(data, 20);
    if (activeMAs.sma50) result.sma50 = calculateSMA(data, 50);
    if (activeMAs.sma100) result.sma100 = calculateSMA(data, 100);
    if (activeMAs.sma200) result.sma200 = calculateSMA(data, 200);
    if (activeMAs.ema20) result.ema20 = calculateEMA(data, 20);
    if (activeMAs.vwap) result.vwap = calculateVWAP(data);
    if (activeMAs.bb) result.bb = calculateBollingerBands(data, 20, 2);

    return result;
  }, [data, activeMAs]);

  // Calculate technical indicators
  const indicators = useMemo(() => {
    if (!data || data.length === 0) return {};

    const result: any = {};

    if (activeIndicators.includes('rsi')) {
      result.rsi = calculateRSI(data, 14);
    }

    if (activeIndicators.includes('macd')) {
      const macd = calculateMACD(data, 12, 26, 9);
      result.macd = macd.macd;
      result.macdSignal = macd.signal;
      result.macdHistogram = macd.histogram;
    }

    if (activeIndicators.includes('stochastic')) {
      const stoch = calculateStochastic(data, 14, 3);
      result.stochK = stoch.k;
      result.stochD = stoch.d;
    }

    if (activeIndicators.includes('adx')) {
      result.adx = calculateADX(data, 14);
    }

    if (activeIndicators.includes('obv')) {
      result.obv = calculateOBV(data);
    }

    if (activeIndicators.includes('atr')) {
      result.atr = calculateATR(data, 14);
    }

    return result;
  }, [data, activeIndicators]);

  // Prepare chart data with MA values, indicator values, and rawTime for panel sync
  const chartData = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];

    return processedData.map((d, idx) => {
      const item: any = {
        time: new Date(d.time).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          ...(period === '1D' || period === '1W' ? {} : { year: '2-digit' }),
        }),
        rawTime: d.time, // For panel synchronization
        close: d.close,
        open: d.open,
        high: d.high,
        low: d.low,
        volume: d.volume / 100000, // Convert to lakhs
        candleColor: d.close >= d.open ? '#26A69A' : '#EF5350',
      };

      // In comparison mode, add normalized return for main stock
      if (isComparisonMode && idx < normalizedMainData.length) {
        item.mainReturn = normalizedMainData[idx].value;
      }

      // Add comparison returns
      comparisonData.forEach((comp, compIdx) => {
        if (idx < comp.normalized.length) {
          item[`comp${compIdx}Return`] = comp.normalized[idx].value;
        }
      });

      // Add MA values
      if (maData.sma20 && idx >= 19) {
        item.sma20 = maData.sma20[idx - 19]?.value;
      }
      if (maData.sma50 && idx >= 49) {
        item.sma50 = maData.sma50[idx - 49]?.value;
      }
      if (maData.sma100 && idx >= 99) {
        item.sma100 = maData.sma100[idx - 99]?.value;
      }
      if (maData.sma200 && idx >= 199) {
        item.sma200 = maData.sma200[idx - 199]?.value;
      }
      if (maData.ema20 && idx >= 19) {
        item.ema20 = maData.ema20[idx - 19]?.value;
      }
      if (maData.vwap) {
        item.vwap = maData.vwap[idx]?.value;
      }
      if (maData.bb && idx >= 19) {
        item.bbUpper = maData.bb.upper[idx - 19]?.value;
        item.bbMiddle = maData.bb.middle[idx - 19]?.value;
        item.bbLower = maData.bb.lower[idx - 19]?.value;
      }

      // Add indicator values to chartData for tooltip
      if (indicators.rsi && idx < indicators.rsi.length) {
        item.rsi = indicators.rsi.find(r => r.time === d.time)?.value;
      }
      if (indicators.macd && idx < indicators.macd.length) {
        const macdPoint = indicators.macd.find(m => m.time === d.time);
        const signalPoint = indicators.macdSignal?.find(s => s.time === d.time);
        item.macd = macdPoint?.value;
        item.macdSignal = signalPoint?.value;
      }
      if (indicators.stochK && idx < indicators.stochK.length) {
        const kPoint = indicators.stochK.find(k => k.time === d.time);
        const dPoint = indicators.stochD?.find(d => d.time === d.time);
        item.stochK = kPoint?.value;
        item.stochD = dPoint?.value;
      }
      if (indicators.adx && idx < indicators.adx.length) {
        item.adx = indicators.adx.find(a => a.time === d.time)?.value;
      }
      if (indicators.obv && idx < indicators.obv.length) {
        item.obv = indicators.obv.find(o => o.time === d.time)?.value;
      }
      if (indicators.atr && idx < indicators.atr.length) {
        item.atr = indicators.atr.find(a => a.time === d.time)?.value;
      }

      return item;
    });
  }, [processedData, period, maData, indicators, isComparisonMode, normalizedMainData, comparisonData]);

  // Calculate price range for better Y-axis domain
  const priceRange = useMemo(() => {
    if (!processedData || processedData.length === 0) return { min: 0, max: 100 };

    if (isComparisonMode) {
      // In comparison mode, find min/max of all normalized returns
      const allReturns = chartData.flatMap(d => {
        const returns = [d.mainReturn || 0];
        comparisonData.forEach((_, idx) => {
          if (d[`comp${idx}Return`] !== undefined) {
            returns.push(d[`comp${idx}Return`]);
          }
        });
        return returns;
      });

      const min = Math.min(...allReturns);
      const max = Math.max(...allReturns);
      const padding = (max - min) * 0.1;

      return {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding),
      };
    } else {
      // Normal price mode
      const prices = processedData.flatMap((d) => [d.high, d.low]);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const padding = (max - min) * 0.1;

      return {
        min: Math.floor(min - padding),
        max: Math.ceil(max + padding),
      };
    }
  }, [processedData, isComparisonMode, chartData, comparisonData]);

  // SEPARATE price range for AI patterns (always uses actual prices, never percentages)
  const patternPriceRange = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 100 };

    const prices = data.flatMap((d) => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;

    return {
      min: min - padding,
      max: max + padding,
    };
  }, [data]);

  // AI Pattern Detection with period-aware tolerance
  const detectedPatterns = useMemo(() => {
    if (!data || data.length === 0) {
      return {};
    }
    return detectAllPatterns(data, period);
  }, [data, period]);

  // Filter patterns by enabled AI patterns
  const activeAIPatterns = useMemo(() => {
    const filtered: Record<string, any[]> = {};
    Object.entries(detectedPatterns).forEach(([key, patterns]) => {
      if (aiPatterns[key as keyof typeof aiPatterns]) {
        filtered[key] = patterns;
      }
    });
    return filtered;
  }, [detectedPatterns, aiPatterns]);

  // Fetch chart events (corporate events, financial results, etc.)
  const { events: chartEvents } = useChartEvents({
    symbol: symbol, // Using stock symbol directly
    startDate: data[0]?.time, // First data point date
    endDate: data[data.length - 1]?.time, // Last data point date
    isVerifiedOnly: true, // Show only verified events
    enabled: !!symbol && data.length > 0,
  });

  // Set current symbol for drawing store
  useEffect(() => {
    if (symbol) {
      setCurrentSymbol(symbol);
    }
  }, [symbol, setCurrentSymbol]);

  // Create coordinate mapper when chart data changes
  // This mapper uses ACTUAL PRICES for AI pattern overlays
  useEffect(() => {
    if (chartContainerRef.current && chartData.length > 0) {
      // Use pattern price range (actual prices) for coordinate mapper
      // This ensures patterns detected at ₹1000 can be mapped correctly
      const mapper = createChartCoordinateMapper(
        chartContainerRef.current,
        chartData.map(d => ({
          ...d,
          rawTime: d.rawTime || d.time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        })),
        patternPriceRange // Use actual price range, not display range!
      );
      setCoordinateMapper(mapper);
    }
  }, [chartData, patternPriceRange]);

  // Get current price for ATR panel
  const currentPrice = data && data.length > 0 ? data[data.length - 1].close : 0;

  // Remove indicator from active list
  const removeIndicator = (indicator: string) => {
    const toggleIndicator = useChartStore.getState().toggleIndicator;
    toggleIndicator(indicator as any);
  };

  // Handle mouse move for crosshair sync
  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined && chartData[e.activeTooltipIndex]) {
      setCrosshairState({
        activeIndex: e.activeTooltipIndex,
        activeTime: chartData[e.activeTooltipIndex].rawTime,
        activeData: chartData[e.activeTooltipIndex],
      });
    }
  };

  // Render fallback message if no data
  if (!data || data.length === 0 || chartData.length === 0) {
    return (
      <div
        className="relative w-full flex items-center justify-center"
        style={{ height: `${adjustedMainChartHeight}px` }}
      >
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-2">📊 Chart Loading...</p>
          <p className="text-text-muted text-sm">No data available for period: {period}</p>
        </div>
      </div>
    );
  }

  // Enhanced Custom Tooltip - shows OHLCV + all active MAs + all active indicators
  const CustomTooltip = ({ active, payload }: any) => {
    // Show tooltip if either directly hovering this chart OR crosshair is synced from indicator panels
    const shouldShow = active || (crosshairState.activeIndex !== null);

    if (shouldShow) {
      // Use payload data if hovering this chart, otherwise use crosshairState data
      let data;
      if (active && payload && payload.length) {
        data = payload[0].payload;
      } else if (crosshairState.activeIndex !== null && chartData[crosshairState.activeIndex]) {
        data = chartData[crosshairState.activeIndex];
      } else {
        return null;
      }

      return (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-xl max-w-[280px]">
          <p className="text-text-primary font-semibold mb-2 text-xs">{data.time}</p>

          {/* OHLCV Section */}
          <div className="space-y-1 text-xs">
            {!isComparisonMode ? (
              <>
                {useCandlestick ? (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-text-muted">Open:</span>
                      <span className="text-text-primary font-data">
                        {formatPrice(data.open)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-text-muted">High:</span>
                      <span className="text-signal-green font-data">
                        {formatPrice(data.high)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-text-muted">Low:</span>
                      <span className="text-signal-red font-data">
                        {formatPrice(data.low)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-text-muted">Close:</span>
                      <span className="text-text-primary font-data font-semibold">
                        {formatPrice(data.close)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Price:</span>
                    <span className="text-text-primary font-data font-semibold">
                      {formatPrice(data.close)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-text-muted">Volume:</span>
                  <span className="text-text-primary font-data">{data.volume.toFixed(2)}L</span>
                </div>
              </>
            ) : (
              <>
                {/* Comparison mode - show % returns */}
                <div className="flex justify-between gap-4">
                  <span className="text-text-muted">{symbol}:</span>
                  <span className="text-accent-blue font-data font-semibold">
                    {formatPercent(data.mainReturn || 0)}
                  </span>
                </div>
                {comparisonData.map((comp, idx) => (
                  <div key={comp.symbol} className="flex justify-between gap-4">
                    <span className="text-text-muted">{comp.symbol}:</span>
                    <span className="font-data" style={{ color: COMPARISON_COLORS[idx] }}>
                      {formatPercent(data[`comp${idx}Return`] || 0)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* MA Section (only in non-comparison mode) */}
          {!isComparisonMode && Object.values(activeMAs).some(Boolean) && (
            <>
              <div className="border-t border-border-default my-2" />
              <div className="space-y-1 text-xs">
                {activeMAs.sma20 && data.sma20 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">SMA 20:</span>
                    <span className="font-data" style={{ color: MA_COLORS.sma20 }}>
                      {formatPrice(data.sma20)}
                      <span className={`ml-1 ${data.close > data.sma20 ? 'text-signal-green' : 'text-signal-red'}`}>
                        ({formatPercent(((data.close - data.sma20) / data.sma20) * 100, 1)})
                      </span>
                    </span>
                  </div>
                )}
                {activeMAs.sma50 && data.sma50 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">SMA 50:</span>
                    <span className="font-data" style={{ color: MA_COLORS.sma50 }}>
                      {formatPrice(data.sma50)}
                      <span className={`ml-1 ${data.close > data.sma50 ? 'text-signal-green' : 'text-signal-red'}`}>
                        ({formatPercent(((data.close - data.sma50) / data.sma50) * 100, 1)})
                      </span>
                    </span>
                  </div>
                )}
                {activeMAs.sma100 && data.sma100 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">SMA 100:</span>
                    <span className="font-data" style={{ color: MA_COLORS.sma100 }}>
                      {formatPrice(data.sma100)}
                      <span className={`ml-1 ${data.close > data.sma100 ? 'text-signal-green' : 'text-signal-red'}`}>
                        ({formatPercent(((data.close - data.sma100) / data.sma100) * 100, 1)})
                      </span>
                    </span>
                  </div>
                )}
                {activeMAs.sma200 && data.sma200 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">SMA 200:</span>
                    <span className="font-data" style={{ color: MA_COLORS.sma200 }}>
                      {formatPrice(data.sma200)}
                      <span className={`ml-1 ${data.close > data.sma200 ? 'text-signal-green' : 'text-signal-red'}`}>
                        ({formatPercent(((data.close - data.sma200) / data.sma200) * 100, 1)})
                      </span>
                    </span>
                  </div>
                )}
                {activeMAs.ema20 && data.ema20 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">EMA 20:</span>
                    <span className="font-data" style={{ color: MA_COLORS.ema20 }}>
                      {formatPrice(data.ema20)}
                      <span className={`ml-1 ${data.close > data.ema20 ? 'text-signal-green' : 'text-signal-red'}`}>
                        ({formatPercent(((data.close - data.ema20) / data.ema20) * 100, 1)})
                      </span>
                    </span>
                  </div>
                )}
                {activeMAs.vwap && data.vwap && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">VWAP:</span>
                    <span className="font-data" style={{ color: MA_COLORS.vwap }}>
                      {formatPrice(data.vwap)}
                    </span>
                  </div>
                )}
                {activeMAs.bb && data.bbUpper && data.bbLower && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">BB:</span>
                    <span className="font-data text-xs" style={{ color: MA_COLORS.bb }}>
                      {formatPrice(data.bbUpper)} / {formatPrice(data.bbLower)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Indicator Section (only if any indicators active) */}
          {activeIndicators.length > 0 && (
            <>
              <div className="border-t border-border-default my-2" />
              <div className="space-y-1 text-xs">
                {activeIndicators.includes('rsi') && data.rsi !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">RSI(14):</span>
                    <span
                      className={`font-data ${
                        data.rsi >= 40 && data.rsi <= 60
                          ? 'text-signal-green'
                          : data.rsi >= 30 && data.rsi < 40 || data.rsi > 60 && data.rsi <= 70
                          ? 'text-signal-yellow'
                          : 'text-signal-red'
                      }`}
                    >
                      {data.rsi.toFixed(1)}
                    </span>
                  </div>
                )}
                {activeIndicators.includes('macd') && data.macd !== undefined && data.macdSignal !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">MACD:</span>
                    <span className={`font-data ${data.macd > data.macdSignal ? 'text-signal-green' : 'text-signal-red'}`}>
                      {data.macd.toFixed(2)} / {data.macdSignal.toFixed(2)}
                      <span className="ml-1 text-xs">
                        {data.macd > data.macdSignal ? '↑ Bull' : '↓ Bear'}
                      </span>
                    </span>
                  </div>
                )}
                {activeIndicators.includes('stochastic') && data.stochK !== undefined && data.stochD !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">Stoch %K/%D:</span>
                    <span className="font-data text-accent-blue">
                      {data.stochK.toFixed(1)} / {data.stochD.toFixed(1)}
                    </span>
                  </div>
                )}
                {activeIndicators.includes('adx') && data.adx !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">ADX:</span>
                    <span className={`font-data ${data.adx > 25 ? 'text-signal-green' : 'text-text-muted'}`}>
                      {data.adx.toFixed(1)}
                      <span className="ml-1 text-xs">
                        {data.adx > 25 ? 'Trending' : 'Range-bound'}
                      </span>
                    </span>
                  </div>
                )}
                {activeIndicators.includes('obv') && data.obv !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">OBV:</span>
                    <span className="font-data text-text-primary">
                      {formatVolume(data.obv)}
                    </span>
                  </div>
                )}
                {activeIndicators.includes('atr') && data.atr !== undefined && (
                  <div className="flex justify-between gap-4">
                    <span className="text-text-muted">ATR:</span>
                    <span className="font-data text-signal-yellow">
                      {formatPrice(data.atr)} ({((data.atr / data.close) * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      ref={chartContainerRef}
      className="relative space-y-0"
      onMouseLeave={clearCrosshair}
    >
      {/* Main price chart */}
      <ResponsiveContainer width="100%" height={adjustedMainChartHeight}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#21262D" />

          <XAxis
            dataKey="time"
            stroke="#8B949E"
            style={{ fontSize: 11 }}
            angle={period === '5Y' || period === 'MAX' ? -45 : 0}
            textAnchor={period === '5Y' || period === 'MAX' ? 'end' : 'middle'}
            height={period === '5Y' || period === 'MAX' ? 60 : 30}
          />

          <YAxis
            yAxisId="price"
            domain={[priceRange.min, priceRange.max]}
            stroke="#8B949E"
            style={{ fontSize: 11 }}
            tickFormatter={(value) => isComparisonMode ? `${value}%` : `₹${value}`}
          />

          <YAxis
            yAxisId="volume"
            orientation="right"
            stroke="#8B949E"
            style={{ fontSize: 11 }}
            tickFormatter={(value) => `${value}L`}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Synced crosshair vertical line - thin area between current and next point */}
          {crosshairState.activeIndex !== null &&
           crosshairState.activeIndex >= 0 &&
           crosshairState.activeIndex < chartData.length - 1 &&
           chartData[crosshairState.activeIndex] &&
           chartData[crosshairState.activeIndex + 1] && (
            <ReferenceArea
              key={`crosshair-${crosshairState.activeIndex}`}
              x1={chartData[crosshairState.activeIndex].time}
              x2={chartData[crosshairState.activeIndex + 1].time}
              yAxisId="price"
              fill="#FFFFFF"
              fillOpacity={0.2}
              ifOverflow="extendDomain"
            />
          )}

          {/* Volume bars (hide in comparison mode) */}
          {!isComparisonMode && (
            <Bar yAxisId="volume" dataKey="volume" fill="#30363D" opacity={0.3} />
          )}

          {/* Main stock line */}
          {isComparisonMode ? (
            /* Comparison mode - normalized % return */
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="mainReturn"
              stroke="#58A6FF"
              strokeWidth={2}
              dot={false}
            />
          ) : (
            /* Normal mode - price */
            <>
              {effectiveChartType === 'area' ? (
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#58A6FF"
                  strokeWidth={2}
                  fill="#58A6FF"
                  fillOpacity={0.1}
                />
              ) : useCandlestick ? (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="close"
                    stroke="#58A6FF"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="high"
                    stroke="none"
                    fill="#26A69A"
                    fillOpacity={0.1}
                  />
                  <Area
                    yAxisId="price"
                    type="monotone"
                    dataKey="low"
                    stroke="none"
                    fill="#EF5350"
                    fillOpacity={0.1}
                  />
                </>
              ) : (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="close"
                  stroke="#58A6FF"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </>
          )}

          {/* Comparison lines */}
          {isComparisonMode && comparisonData.map((comp, idx) => (
            <Line
              key={comp.symbol}
              yAxisId="price"
              type="monotone"
              dataKey={`comp${idx}Return`}
              stroke={COMPARISON_COLORS[idx]}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
            />
          ))}

          {/* Moving Average Overlays (only in non-comparison mode) */}
          {!isComparisonMode && (
            <>
              {activeMAs.sma20 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma20"
                  stroke={MA_COLORS.sma20}
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
              {activeMAs.sma50 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma50"
                  stroke={MA_COLORS.sma50}
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
              {activeMAs.sma100 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma100"
                  stroke={MA_COLORS.sma100}
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
              {activeMAs.sma200 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="sma200"
                  stroke={MA_COLORS.sma200}
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
              {activeMAs.ema20 && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="ema20"
                  stroke={MA_COLORS.ema20}
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
              {activeMAs.vwap && (
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="vwap"
                  stroke={MA_COLORS.vwap}
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {/* Bollinger Bands */}
              {activeMAs.bb && (
                <>
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="bbUpper"
                    stroke={MA_COLORS.bb}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="bbMiddle"
                    stroke={MA_COLORS.bb}
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line
                    yAxisId="price"
                    type="monotone"
                    dataKey="bbLower"
                    stroke={MA_COLORS.bb}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </>
              )}
            </>
          )}

          {/* Event Markers (corporate events, financial results) */}
          <EventMarkers
            events={chartEvents}
            chartData={chartData}
            yAxisDomain={[priceRange.min, priceRange.max]}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* AI Pattern Annotations Overlay */}
      {coordinateMapper && Object.keys(activeAIPatterns).length > 0 && (
        <AIAnnotations
          patterns={activeAIPatterns}
          coordinateMapper={coordinateMapper}
        />
      )}

      {/* Drawing Canvas Overlay */}
      {coordinateMapper && (
        <DrawingCanvas
          symbol={symbol}
          coordinateMapper={coordinateMapper}
        />
      )}

      {/* Drawing Toolbar (Fixed Position) */}
      <DrawingToolbar symbol={symbol} />

      {/* Floating tooltip on main chart when crosshair is synced from indicator panels */}
      {crosshairState.activeIndex !== null && chartData[crosshairState.activeIndex] && (
        <div className="absolute top-4 right-4 pointer-events-none z-50">
          <CustomTooltip
            active={true}
            payload={[{ payload: chartData[crosshairState.activeIndex] }]}
          />
        </div>
      )}

      {/* Comparison Legend Bar */}
      {isComparisonMode && (
        <div className="px-3 py-2 bg-bg-tertiary border-t border-border-default flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-accent-blue" />
            <span className="text-xs font-medium text-text-primary">{symbol}:</span>
            <span className="text-xs font-data text-accent-blue">
              {normalizedMainData.length > 0 &&
                formatPercent(normalizedMainData[normalizedMainData.length - 1].value)}
            </span>
          </div>

          {comparisonData.map((comp, idx) => (
            <div key={comp.symbol} className="flex items-center gap-2">
              <div className="w-3 h-0.5" style={{ backgroundColor: COMPARISON_COLORS[idx] }} />
              <span className="text-xs font-medium text-text-primary">{comp.name}:</span>
              <span className="text-xs font-data" style={{ color: COMPARISON_COLORS[idx] }}>
                {comp.normalized.length > 0 &&
                  formatPercent(comp.normalized[comp.normalized.length - 1].value)}
              </span>
              <button
                onClick={() => removeComparison(comp.symbol)}
                className="ml-1 text-text-muted hover:text-signal-red transition-colors"
                title={`Remove ${comp.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Technical Indicator Sub-Chart Panels */}
      {activeIndicators.includes('rsi') && indicators.rsi && (
        <RSIPanel
          data={indicators.rsi}
          chartData={chartData}
          height={panelHeight}
          onClose={() => removeIndicator('rsi')}
        />
      )}

      {activeIndicators.includes('macd') &&
        indicators.macd &&
        indicators.macdSignal &&
        indicators.macdHistogram && (
          <MACDPanel
            macdData={indicators.macd}
            signalData={indicators.macdSignal}
            histogramData={indicators.macdHistogram}
            chartData={chartData}
            height={panelHeight}
            onClose={() => removeIndicator('macd')}
          />
        )}

      {activeIndicators.includes('stochastic') &&
        indicators.stochK &&
        indicators.stochD && (
          <StochasticPanel
            kData={indicators.stochK}
            dData={indicators.stochD}
            chartData={chartData}
            height={panelHeight}
            onClose={() => removeIndicator('stochastic')}
          />
        )}

      {activeIndicators.includes('adx') && indicators.adx && (
        <ADXPanel
          data={indicators.adx}
          chartData={chartData}
          height={panelHeight}
          onClose={() => removeIndicator('adx')}
        />
      )}

      {activeIndicators.includes('obv') && indicators.obv && (
        <OBVPanel
          data={indicators.obv}
          chartData={chartData}
          height={panelHeight}
          onClose={() => removeIndicator('obv')}
        />
      )}

      {activeIndicators.includes('atr') && indicators.atr && (
        <ATRPanel
          data={indicators.atr}
          chartData={chartData}
          currentPrice={currentPrice}
          height={panelHeight}
          onClose={() => removeIndicator('atr')}
        />
      )}
    </div>
  );
};
