/**
 * Report Section Renderer
 *
 * Renders different types of report sections (text, charts, tables, metrics, stock lists)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MetricCard } from '../scores/MetricCard';

interface ReportSection {
  id: string;
  sectionOrder: number;
  sectionTitle: string;
  sectionType: 'TEXT' | 'METRIC_CARDS' | 'CHART_DATA' | 'TABLE_DATA' | 'STOCK_LIST';
  content: string;
}

interface ReportSectionRendererProps {
  section: ReportSection;
}

export const ReportSectionRenderer: React.FC<ReportSectionRendererProps> = ({ section }) => {
  const { sectionTitle, sectionType, content } = section;

  // Parse JSON content for structured data types
  let parsedContent: any = content;
  try {
    if (sectionType !== 'TEXT') {
      parsedContent = JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to parse section content:', error);
  }

  // Render TEXT sections
  if (sectionType === 'TEXT') {
    return (
      <section className="mb-8">
        {sectionTitle && (
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b border-border-default pb-2">
            {sectionTitle}
          </h2>
        )}
        <div className="prose prose-lg prose-invert max-w-none">
          {content.split('\n\n').map((paragraph, idx) => (
            <p key={idx} className="text-text-secondary leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    );
  }

  // Render METRIC_CARDS sections
  if (sectionType === 'METRIC_CARDS') {
    const metrics = Array.isArray(parsedContent) ? parsedContent : [];
    return (
      <section className="mb-8">
        {sectionTitle && (
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b border-border-default pb-2">
            {sectionTitle}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric: any, idx: number) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              change={metric.change}
              changeLabel={metric.changeLabel}
              color={metric.change > 0 ? 'green' : metric.change < 0 ? 'red' : 'default'}
            />
          ))}
        </div>
      </section>
    );
  }

  // Render CHART_DATA sections
  if (sectionType === 'CHART_DATA') {
    const chartData = parsedContent;
    const chartType = chartData.type || 'bar';
    const data = chartData.data || [];

    return (
      <section className="mb-8">
        {sectionTitle && (
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b border-border-default pb-2">
            {sectionTitle}
          </h2>
        )}
        <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
          <ResponsiveContainer width="100%" height={350}>
            {chartType === 'bar' ? (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis
                  dataKey="name"
                  stroke="#8B949E"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#8B949E" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#C9D1D9' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Bar dataKey="value" fill="#58A6FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                <XAxis
                  dataKey="name"
                  stroke="#8B949E"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#8B949E" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#161B22',
                    border: '1px solid #30363D',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#C9D1D9' }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#58A6FF"
                  strokeWidth={2}
                  dot={{ fill: '#58A6FF', r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>
    );
  }

  // Render TABLE_DATA sections
  if (sectionType === 'TABLE_DATA') {
    const tableData = parsedContent;
    const headers = tableData.headers || [];
    const rows = tableData.rows || [];

    return (
      <section className="mb-8">
        {sectionTitle && (
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b border-border-default pb-2">
            {sectionTitle}
          </h2>
        )}
        <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-bg-tertiary border-b border-border-default">
                  {headers.map((header: string, idx: number) => (
                    <th
                      key={idx}
                      className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any[], rowIdx: number) => (
                  <tr
                    key={rowIdx}
                    className={`border-b border-border-default ${
                      rowIdx % 2 === 0 ? 'bg-bg-secondary' : 'bg-bg-tertiary'
                    } hover:bg-bg-hover transition-colors`}
                  >
                    {row.map((cell: any, cellIdx: number) => (
                      <td
                        key={cellIdx}
                        className="px-4 py-3 text-sm text-text-primary whitespace-nowrap"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  // Render STOCK_LIST sections
  if (sectionType === 'STOCK_LIST') {
    const stocks = Array.isArray(parsedContent) ? parsedContent : [];

    return (
      <section className="mb-8">
        {sectionTitle && (
          <h2 className="text-2xl font-bold text-text-primary mb-4 border-b border-border-default pb-2">
            {sectionTitle}
          </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map((stock: any, idx: number) => (
            <Link
              key={idx}
              to={`/stock/${stock.symbol}`}
              className="block bg-bg-secondary border border-border-default rounded-lg p-4 hover:border-border-hover hover:bg-bg-tertiary transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-lg font-bold text-text-primary group-hover:text-accent-blue transition-colors">
                    {stock.symbol}
                  </div>
                  <div className="text-xs text-text-muted line-clamp-1">
                    {stock.name}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-blue group-hover:translate-x-1 transition-all" />
              </div>

              {stock.scores && (
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-bg-tertiary rounded px-2 py-1">
                    <div className="text-[10px] text-text-muted">Alpha</div>
                    <div className="text-sm font-bold text-signal-green">
                      {stock.scores.alphaScore}
                    </div>
                  </div>
                  <div className="flex-1 bg-bg-tertiary rounded px-2 py-1">
                    <div className="text-[10px] text-text-muted">Quality</div>
                    <div className="text-sm font-bold text-signal-blue">
                      {stock.scores.qualityScore}
                    </div>
                  </div>
                  <div className="flex-1 bg-bg-tertiary rounded px-2 py-1">
                    <div className="text-[10px] text-text-muted">Value</div>
                    <div className="text-sm font-bold text-signal-purple">
                      {stock.scores.valueScore}
                    </div>
                  </div>
                </div>
              )}

              {stock.price && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary font-semibold">
                    ₹{stock.price.toLocaleString()}
                  </span>
                  {stock.return !== undefined && (
                    <span
                      className={`flex items-center gap-1 ${
                        stock.return > 0 ? 'text-signal-green' : 'text-signal-red'
                      }`}
                    >
                      {stock.return > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {stock.return > 0 ? '+' : ''}
                      {stock.return.toFixed(2)}%
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return null;
};
