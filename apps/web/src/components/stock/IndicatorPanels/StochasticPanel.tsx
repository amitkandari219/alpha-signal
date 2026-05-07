/**
 * Stochastic Sub-Chart Panel
 *
 * Displays Stochastic(14,3,3) with %K and %D lines, overbought/oversold zones
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  Scatter,
} from 'recharts';
import { X } from 'lucide-react';
import { useCrosshairSync } from '../../../contexts/CrosshairSyncContext';

interface StochasticPanelProps {
  kData: Array<{ time: string; value: number }>;
  dData: Array<{ time: string; value: number }>;
  chartData: any[];
  height?: number;
  onClose: () => void;
  className?: string;
}

export const StochasticPanel: React.FC<StochasticPanelProps> = ({
  kData,
  dData,
  chartData,
  height = 80,
  onClose,
  className = '',
}) => {
  const { crosshairState, setCrosshairState, clearCrosshair } = useCrosshairSync();

  // Merge Stochastic data and detect crossovers
  const mergedData = useMemo(() => {
    const merged = chartData.map((item, idx) => {
      const kPoint = kData.find((d) => d.time === item.rawTime);
      const dPoint = dData.find((d) => d.time === item.rawTime);

      // Detect crossover (bullish when %K crosses above %D)
      let crossover = null;
      if (idx > 0 && kPoint && dPoint) {
        const prevKPoint = kData.find((d) => d.time === chartData[idx - 1].rawTime);
        const prevDPoint = dData.find((d) => d.time === chartData[idx - 1].rawTime);

        if (prevKPoint && prevDPoint) {
          // Bullish crossover
          if (prevKPoint.value <= prevDPoint.value && kPoint.value > dPoint.value) {
            crossover = 'bullish';
          }
          // Bearish crossover
          if (prevKPoint.value >= prevDPoint.value && kPoint.value < dPoint.value) {
            crossover = 'bearish';
          }
        }
      }

      return {
        ...item,
        k: kPoint?.value || null,
        d: dPoint?.value || null,
        crossover,
      };
    });
    // Gap at start is correct - shows warmup period
    return merged;
  }, [chartData, kData, dData]);

  // Get current values
  const currentK = kData.length > 0 ? kData[kData.length - 1].value : 0;
  const currentD = dData.length > 0 ? dData[dData.length - 1].value : 0;

  // Handle mouse move
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
              %K: {data.k?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-signal-yellow font-data">
              %D: {data.d?.toFixed(2) || 'N/A'}
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
            Stochastic (14, 3, 3)
          </span>
          <span className="text-xs text-text-muted font-data">
            {currentK.toFixed(1)} / {currentD.toFixed(1)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Close Stochastic panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
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

          <YAxis
            domain={[0, 100]}
            stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5}
            style={{ fontSize: 10 }}
            ticks={[0, 20, 50, 80, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Oversold zone (<20) - green */}
          <ReferenceArea y1={0} y2={20} fill="#3FB950" fillOpacity={0.08} />

          {/* Overbought zone (>80) - red */}
          <ReferenceArea y1={80} y2={100} fill="#F85149" fillOpacity={0.08} />

          {/* Reference lines */}
          <ReferenceLine y={20} stroke="#30363D" strokeDasharray="5 5" />
          <ReferenceLine y={80} stroke="#30363D" strokeDasharray="5 5" />
          <ReferenceLine y={50} stroke="#21262D" strokeDasharray="5 5" />

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

          {/* %K line */}
          <Line
            type="monotone"
            dataKey="k"
            stroke="#58A6FF"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />

          {/* %D line */}
          <Line
            type="monotone"
            dataKey="d"
            stroke="#D29922"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
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
                %K: {mergedData[crosshairState.activeIndex].k?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-signal-yellow font-data">
                %D: {mergedData[crosshairState.activeIndex].d?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
