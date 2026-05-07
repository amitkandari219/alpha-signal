/**
 * Sector Heatmap Component
 *
 * Treemap visualization of sector performance
 */

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { CollapsiblePanel } from '../common/CollapsiblePanel';
import { SectorData } from '../../data/mockDashboardData';

interface SectorHeatmapProps {
  sectors: SectorData[];
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({ sectors }) => {
  const navigate = useNavigate();

  // Prepare treemap data
  const treemapData = sectors.map((sector) => ({
    name: sector.name,
    size: sector.size,
    change: sector.change,
    topGainer: sector.topGainer,
    topLoser: sector.topLoser,
  }));

  // Get color based on performance
  const getColor = (change: number) => {
    if (change > 2) return '#26A69A'; // Strong green
    if (change > 1) return '#4DB6AC'; // Medium green
    if (change > 0) return '#80CBC4'; // Light green
    if (change > -1) return '#FFAB91'; // Light red
    if (change > -2) return '#FF8A65'; // Medium red
    return '#EF5350'; // Strong red
  };

  const handleSectorClick = (sectorName: string) => {
    // Convert sector name to URL-friendly slug
    const slug = sectorName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    navigate(`/sectors/${slug}`);
  };

  const CustomTreemapContent = (props: any) => {
    const { x, y, width, height, name, change, topGainer, topLoser } = props;

    // Guard against undefined change value
    if (change === undefined || change === null) {
      return null;
    }

    if (width < 80 || height < 60) {
      // Too small to render text
      return (
        <g onClick={() => handleSectorClick(name)}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={getColor(change)}
            stroke="#161B22"
            strokeWidth={2}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </g>
      );
    }

    return (
      <g onClick={() => handleSectorClick(name)}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={getColor(change)}
          stroke="#161B22"
          strokeWidth={2}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        {/* Sector Name with outline for readability */}
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          stroke="#000000"
          strokeWidth={3}
          fill="transparent"
          fontSize={width > 150 ? 14 : 12}
          fontWeight="bold"
        >
          {name}
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 - 10}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={width > 150 ? 14 : 12}
          fontWeight="bold"
        >
          {name}
        </text>

        {/* Change percentage with outline */}
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          stroke="#000000"
          strokeWidth={3}
          fill="transparent"
          fontSize={width > 150 ? 18 : 14}
          fontWeight="bold"
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize={width > 150 ? 18 : 14}
          fontWeight="bold"
        >
          {change > 0 ? '+' : ''}
          {change.toFixed(2)}%
        </text>
        {width > 180 && height > 80 && (
          <>
            {/* Top Gainer with outline */}
            <text
              x={x + width / 2}
              y={y + height / 2 + 28}
              textAnchor="middle"
              stroke="#000000"
              strokeWidth={2}
              fill="transparent"
              fontSize={10}
            >
              ↑ {topGainer}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 28}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.9)"
              fontSize={10}
            >
              ↑ {topGainer}
            </text>

            {/* Top Loser with outline */}
            <text
              x={x + width / 2}
              y={y + height / 2 + 40}
              textAnchor="middle"
              stroke="#000000"
              strokeWidth={2}
              fill="transparent"
              fontSize={10}
            >
              ↓ {topLoser}
            </text>
            <text
              x={x + width / 2}
              y={y + height / 2 + 40}
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.9)"
              fontSize={10}
            >
              ↓ {topLoser}
            </text>
          </>
        )}
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-bg-secondary border border-border-primary rounded-lg p-3 shadow-lg">
          <div className="font-bold text-text-primary mb-2">{data.name}</div>
          <div className="space-y-1 text-sm">
            <div
              className={`font-semibold font-data ${
                data.change > 0 ? 'text-signal-green' : 'text-signal-red'
              }`}
            >
              {data.change > 0 ? '+' : ''}
              {data.change.toFixed(2)}%
            </div>
            <div className="text-text-secondary text-xs">
              Market Cap: ₹{(data.size / 100000).toFixed(2)}L Cr
            </div>
            <div className="text-xs text-signal-green">↑ {data.topGainer}</div>
            <div className="text-xs text-signal-red">↓ {data.topLoser}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <CollapsiblePanel title="Sector Heatmap" icon={BarChart3} defaultExpanded={true}>
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#161B22"
            content={<CustomTreemapContent />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#26A69A' }}></div>
            <span className="text-text-muted">&gt; +2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#4DB6AC' }}></div>
            <span className="text-text-muted">+1% to +2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#80CBC4' }}></div>
            <span className="text-text-muted">0% to +1%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFAB91' }}></div>
            <span className="text-text-muted">0% to -1%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF8A65' }}></div>
            <span className="text-text-muted">-1% to -2%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF5350' }}></div>
            <span className="text-text-muted">&lt; -2%</span>
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  );
};
