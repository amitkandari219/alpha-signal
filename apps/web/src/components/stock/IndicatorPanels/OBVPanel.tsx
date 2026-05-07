/**
 * OBV Sub-Chart Panel - On-Balance Volume
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
  ReferenceLine,
} from 'recharts';
import { X } from 'lucide-react';
import { useCrosshairSync } from '../../../contexts/CrosshairSyncContext';

interface OBVPanelProps {
  data: Array<{ time: string; value: number }>;
  chartData: any[];
  height?: number;
  onClose: () => void;
  className?: string;
}

export const OBVPanel: React.FC<OBVPanelProps> = ({
  data,
  chartData,
  height = 80,
  onClose,
  className = '',
}) => {
  const { crosshairState, setCrosshairState, clearCrosshair } = useCrosshairSync();

  // Calculate OBV trend (rising or falling over last 10 periods)
  const obvTrend = useMemo(() => {
    if (data.length < 10) return 'neutral';
    const last10 = data.slice(-10);
    const startValue = last10[0].value;
    const endValue = last10[last10.length - 1].value;
    return endValue > startValue ? 'rising' : 'falling';
  }, [data]);

  const mergedData = useMemo(() => {
    return chartData.map((item) => {
      const obvPoint = data.find((d) => d.time === item.rawTime);
      return {
        ...item,
        obv: obvPoint?.value || null,
      };
    });
    // Gap at start is correct - shows warmup period
  }, [chartData, data]);

  const obvColor = obvTrend === 'rising' ? '#3FB950' : '#F85149';

  const handleMouseMove = (e: any) => {
    if (e && e.activeTooltipIndex !== undefined && mergedData[e.activeTooltipIndex]) {
      setCrosshairState({
        activeIndex: e.activeTooltipIndex,
        activeTime: mergedData[e.activeTooltipIndex].rawTime,
        activeData: mergedData[e.activeTooltipIndex],
      });
    }
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
            <div className="font-data" style={{ color: obvColor }}>
              OBV: {data.obv?.toLocaleString() || 'N/A'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative border-t border-border-default ${className}`}>
      <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text-primary">OBV</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              obvTrend === 'rising'
                ? 'bg-signal-green/20 text-signal-green'
                : 'bg-signal-red/20 text-signal-red'
            }`}
          >
            {obvTrend === 'rising' ? 'Confirming' : 'Diverging'}
          </span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={mergedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 0 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => clearCrosshair()}
        >
          <CartesianGrid strokeDasharray="5 5" stroke="#21262D" />
          <XAxis dataKey="time" stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5} style={{ fontSize: 10 }} tick={false} />
          <YAxis stroke="#FFFFFF"
              strokeWidth={1}
              strokeOpacity={0.5} style={{ fontSize: 10 }} />
          <Tooltip content={<CustomTooltip />} />
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
          <Line
            type="monotone"
            dataKey="obv"
            stroke={obvColor}
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
              <div className="font-data" style={{ color: obvColor }}>
                OBV: {mergedData[crosshairState.activeIndex].obv?.toLocaleString() || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
