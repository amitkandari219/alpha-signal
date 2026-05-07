/**
 * MACD Sub-Chart Panel
 *
 * Displays MACD(12,26,9) with MACD line, Signal line, and histogram
 */

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { X, TrendingUp, TrendingDown } from 'lucide-react';
import { useCrosshairSync } from '../../../contexts/CrosshairSyncContext';

interface MACDPanelProps {
  macdData: Array<{ time: string; value: number }>;
  signalData: Array<{ time: string; value: number }>;
  histogramData: Array<{ time: string; value: number }>;
  chartData: any[];
  height?: number;
  onClose: () => void;
  className?: string;
}

export const MACDPanel: React.FC<MACDPanelProps> = ({
  macdData,
  signalData,
  histogramData,
  chartData,
  height = 80,
  onClose,
  className = '',
}) => {
  const { crosshairState, setCrosshairState, clearCrosshair } = useCrosshairSync();

  // Merge MACD data into chart data (gap at start is correct - shows warmup period)
  const mergedData = useMemo(() => {
    return chartData.map((item, idx) => {
      const macdPoint = macdData.find((d) => d.time === item.rawTime);
      const signalPoint = signalData.find((d) => d.time === item.rawTime);
      const histPoint = histogramData.find((d) => d.time === item.rawTime);

      return {
        ...item,
        macd: macdPoint?.value || null,
        signal: signalPoint?.value || null,
        histogram: histPoint?.value || null,
        histogramColor:
          histPoint && histPoint.value >= 0 ? '#3FB950' : '#F85149',
      };
    });
  }, [chartData, macdData, signalData, histogramData]);

  // Get current values
  const currentMACD = macdData.length > 0 ? macdData[macdData.length - 1].value : 0;
  const currentSignal =
    signalData.length > 0 ? signalData[signalData.length - 1].value : 0;
  const isBullish = currentMACD > currentSignal;

  // Handle mouse move for crosshair sync
  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined && mergedData[e.activeTooltipIndex]) {
      setCrosshairState({
        activeIndex: e.activeTooltipIndex,
        activeTime: mergedData[e.activeTooltipIndex].rawTime,
        activeData: mergedData[e.activeTooltipIndex],
      });
    }
  };

  const handleMouseLeave = () => {
    clearCrosshair();
  };

  // Custom tooltip - shows when hovering this chart OR when crosshair is synced from another chart
  const CustomTooltip = ({ active, payload }: any) => {
    // Show tooltip if either directly hovering this chart OR crosshair is synced from another chart
    const shouldShow = active || (crosshairState.activeIndex !== null);

    if (shouldShow) {
      // Use payload data if hovering this chart, otherwise use crosshairState data
      let data;
      if (active && payload && payload.length) {
        data = payload[0].payload;
      } else if (crosshairState.activeIndex !== null && mergedData[crosshairState.activeIndex]) {
        data = mergedData[crosshairState.activeIndex];
      } else {
        return null;
      }

      return (
        <div className="bg-bg-secondary border-2 border-accent-blue rounded-lg p-2 shadow-2xl">
          <div className="text-xs space-y-0.5">
            <div className="text-text-primary font-semibold mb-1">{data.time}</div>
            <div className="text-accent-blue font-data">
              MACD: {data.macd?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-signal-yellow font-data">
              Signal: {data.signal?.toFixed(2) || 'N/A'}
            </div>
            <div
              className="font-data"
              style={{ color: data.histogramColor }}
            >
              Hist: {data.histogram?.toFixed(2) || 'N/A'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative border-t border-border-default ${className}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">
            MACD (12, 26, 9)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
              isBullish
                ? 'bg-signal-green/20 text-signal-green'
                : 'bg-signal-red/20 text-signal-red'
            }`}
          >
            {isBullish ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {isBullish ? 'Bullish' : 'Bearish'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Close MACD panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={mergedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <CartesianGrid strokeDasharray="5 5" stroke="#21262D" />

          <XAxis
            dataKey="time"
            stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5}
            style={{ fontSize: 10 }}
            tick={false}
          />

          <YAxis stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5} style={{ fontSize: 10 }} />

          <Tooltip content={<CustomTooltip />} />

          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="#30363D" strokeDasharray="5 5" />

          {/* Synced crosshair - use activeTime for perfect alignment */}
          {crosshairState.activeTime && (
            <ReferenceLine
              key={`crosshair-${crosshairState.activeTime}`}
              x={mergedData.find(d => d.rawTime === crosshairState.activeTime)?.time}
              stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5}
              strokeDasharray="5 5"
            />
          )}

          {/* Histogram */}
          <Bar dataKey="histogram" fill="#3FB950" />

          {/* MACD line */}
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#58A6FF"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />

          {/* Signal line */}
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#D29922"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Floating tooltip when crosshair is synced from another panel */}
      {crosshairState.activeIndex !== null && mergedData[crosshairState.activeIndex] && (
        <div className="absolute top-2 right-2 pointer-events-none z-50">
          <div className="bg-bg-secondary border-2 border-accent-blue rounded-lg p-2 shadow-2xl">
            <div className="text-xs space-y-0.5">
              <div className="text-text-primary font-semibold mb-1">
                {mergedData[crosshairState.activeIndex].time}
              </div>
              <div className="text-accent-blue font-data">
                MACD: {mergedData[crosshairState.activeIndex].macd?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-signal-yellow font-data">
                Signal: {mergedData[crosshairState.activeIndex].signal?.toFixed(2) || 'N/A'}
              </div>
              <div
                className="font-data"
                style={{ color: mergedData[crosshairState.activeIndex].histogramColor }}
              >
                Hist: {mergedData[crosshairState.activeIndex].histogram?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
