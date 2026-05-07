/**
 * RSI Sub-Chart Panel
 *
 * Displays RSI(14) indicator with overbought/oversold zones
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
} from 'recharts';
import { X } from 'lucide-react';
import { useCrosshairSync } from '../../../contexts/CrosshairSyncContext';
import { IndicatorDataPoint } from '../../../utils/technicalIndicators';

interface RSIPanelProps {
  data: IndicatorDataPoint[];
  chartData: any[]; // Combined chart data with time labels
  height?: number;
  onClose: () => void;
  className?: string;
}

export const RSIPanel: React.FC<RSIPanelProps> = ({
  data,
  chartData,
  height = 80,
  onClose,
  className = '',
}) => {
  const { crosshairState, setCrosshairState, clearCrosshair } = useCrosshairSync();

  // Merge RSI data into chart data (gap at start is correct - shows warmup period)
  const mergedData = useMemo(() => {
    return chartData.map((item, idx) => {
      const rsiPoint = data.find((d) => d.time === item.rawTime);
      return {
        ...item,
        rsi: rsiPoint?.value || null,
      };
    });
  }, [chartData, data]);

  // Get current RSI value (latest)
  const currentRSI = data.length > 0 ? data[data.length - 1].value : 0;

  // Determine badge color based on RSI value
  const getBadgeColor = (rsi: number) => {
    if (rsi >= 40 && rsi <= 60) return 'bg-signal-green/20 text-signal-green';
    if ((rsi >= 30 && rsi < 40) || (rsi > 60 && rsi <= 70))
      return 'bg-signal-yellow/20 text-signal-yellow';
    return 'bg-signal-red/20 text-signal-red';
  };

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
          <div className="text-xs">
            <div className="text-text-primary font-semibold mb-1">{data.time}</div>
            <div className="text-accent-blue font-data">
              RSI: {data.rsi?.toFixed(2) || 'N/A'}
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
          <span className="text-xs font-semibold text-text-primary">RSI (14)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(
              currentRSI
            )}`}
          >
            {currentRSI.toFixed(1)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted hover:text-text-primary transition-colors"
          title="Close RSI panel"
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
            ticks={[0, 30, 50, 70, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Oversold zone (0-30) - green */}
          <ReferenceArea y1={0} y2={30} fill="#3FB950" fillOpacity={0.08} />

          {/* Overbought zone (70-100) - red */}
          <ReferenceArea y1={70} y2={100} fill="#F85149" fillOpacity={0.08} />

          {/* Reference lines */}
          <ReferenceLine y={30} stroke="#30363D" strokeDasharray="5 5" />
          <ReferenceLine y={70} stroke="#30363D" strokeDasharray="5 5" />
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

          {/* RSI line */}
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#58A6FF"
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
            <div className="text-xs">
              <div className="text-text-primary font-semibold mb-1">
                {mergedData[crosshairState.activeIndex].time}
              </div>
              <div className="text-accent-blue font-data">
                RSI: {mergedData[crosshairState.activeIndex].rsi?.toFixed(2) || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
