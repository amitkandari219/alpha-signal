/**
 * Design System Demo Page
 *
 * Showcases Alpha Signal's dark-mode-first design system
 * Terminal-like, data-dense, professional aesthetic inspired by Quiver Quantitative
 */

import React from 'react';

export const DesignSystemDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-bg-primary p-8 space-y-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gradient mb-2">
          Alpha Signal Design System
        </h1>
        <p className="text-text-secondary text-lg">
          Dark-mode-first, terminal-like, data-dense interface for stock intelligence
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Color Palette */}
        <section className="data-card">
          <div className="card-header">
            <h2 className="card-title">Color Palette</h2>
          </div>

          <div className="space-y-6">
            {/* Background Colors */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Background Colors
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-bg-primary border border-border-default rounded-md"></div>
                  <p className="text-data-sm font-data">bg-primary</p>
                  <p className="text-data-xs text-text-muted">#0D1117</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-bg-secondary border border-border-default rounded-md"></div>
                  <p className="text-data-sm font-data">bg-secondary</p>
                  <p className="text-data-xs text-text-muted">#161B22</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-bg-tertiary border border-border-default rounded-md"></div>
                  <p className="text-data-sm font-data">bg-tertiary</p>
                  <p className="text-data-xs text-text-muted">#21262D</p>
                </div>
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Text Colors
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-bg-secondary border border-border-default rounded-md flex items-center justify-center">
                    <span className="text-text-primary text-lg font-semibold">Aa</span>
                  </div>
                  <p className="text-data-sm font-data">text-primary</p>
                  <p className="text-data-xs text-text-muted">#E6EDF3</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-bg-secondary border border-border-default rounded-md flex items-center justify-center">
                    <span className="text-text-secondary text-lg font-semibold">Aa</span>
                  </div>
                  <p className="text-data-sm font-data">text-secondary</p>
                  <p className="text-data-xs text-text-muted">#8B949E</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-bg-secondary border border-border-default rounded-md flex items-center justify-center">
                    <span className="text-text-muted text-lg font-semibold">Aa</span>
                  </div>
                  <p className="text-data-sm font-data">text-muted</p>
                  <p className="text-data-xs text-text-muted">#484F58</p>
                </div>
              </div>
            </div>

            {/* Signal Colors */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Signal Colors
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-signal-green/20 border border-signal-green rounded-md flex items-center justify-center">
                    <span className="text-signal-green text-2xl font-bold">↑</span>
                  </div>
                  <p className="text-data-sm font-data text-signal-green">signal-green</p>
                  <p className="text-data-xs text-text-muted">#3FB950</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-signal-red/20 border border-signal-red rounded-md flex items-center justify-center">
                    <span className="text-signal-red text-2xl font-bold">↓</span>
                  </div>
                  <p className="text-data-sm font-data text-signal-red">signal-red</p>
                  <p className="text-data-xs text-text-muted">#F85149</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-signal-yellow/20 border border-signal-yellow rounded-md flex items-center justify-center">
                    <span className="text-signal-yellow text-2xl font-bold">⚠</span>
                  </div>
                  <p className="text-data-sm font-data text-signal-yellow">signal-yellow</p>
                  <p className="text-data-xs text-text-muted">#D29922</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-signal-purple/20 border border-signal-purple rounded-md flex items-center justify-center">
                    <span className="text-signal-purple text-2xl font-bold">✨</span>
                  </div>
                  <p className="text-data-sm font-data text-signal-purple">signal-purple</p>
                  <p className="text-data-xs text-text-muted">#A371F7</p>
                </div>
              </div>
            </div>

            {/* Chart Colors */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Chart Colors
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-20 bg-chart-up/20 border border-chart-up rounded-md flex items-center justify-center">
                    <span className="text-chart-up text-3xl font-bold">▲</span>
                  </div>
                  <p className="text-data-sm font-data text-chart-up">chart-up</p>
                  <p className="text-data-xs text-text-muted">#26A69A</p>
                </div>
                <div className="space-y-2">
                  <div className="h-20 bg-chart-down/20 border border-chart-down rounded-md flex items-center justify-center">
                    <span className="text-chart-down text-3xl font-bold">▼</span>
                  </div>
                  <p className="text-data-sm font-data text-chart-down">chart-down</p>
                  <p className="text-data-xs text-text-muted">#EF5350</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="data-card">
          <div className="card-header">
            <h2 className="card-title">Typography</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="mb-2">Heading 1 - Plus Jakarta Sans</h1>
              <p className="text-data-sm text-text-secondary">36px / 2.25rem - Used for page titles</p>
            </div>
            <div>
              <h2 className="mb-2">Heading 2 - Plus Jakarta Sans</h2>
              <p className="text-data-sm text-text-secondary">30px / 1.875rem - Used for section headers</p>
            </div>
            <div>
              <h3 className="mb-2">Heading 3 - Plus Jakarta Sans</h3>
              <p className="text-data-sm text-text-secondary">24px / 1.5rem - Used for card titles</p>
            </div>
            <div className="divider"></div>
            <div>
              <p className="font-data text-data-lg mb-2">1,234,567.89 - JetBrains Mono</p>
              <p className="text-data-sm text-text-secondary">Monospace font for numbers and data - ensures tabular alignment</p>
            </div>
          </div>
        </section>

        {/* Component Utilities */}
        <section className="data-card">
          <div className="card-header">
            <h2 className="card-title">Component Utilities</h2>
          </div>

          <div className="space-y-6">
            {/* Metric Variants */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Metric Displays
              </h3>
              <div className="flex gap-6 items-center">
                <div>
                  <p className="text-text-secondary text-sm mb-1">Positive</p>
                  <p className="metric-positive text-2xl">+12.45%</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Negative</p>
                  <p className="metric-negative text-2xl">-8.32%</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm mb-1">Neutral</p>
                  <p className="metric-neutral text-2xl">0.00%</p>
                </div>
              </div>
            </div>

            {/* Score Badges */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Score Badges
              </h3>
              <div className="flex gap-3 flex-wrap">
                <span className="score-badge-high">High Quality: 92</span>
                <span className="score-badge-medium">Medium Risk: 45</span>
                <span className="score-badge-low">Low Confidence: 28</span>
                <span className="score-badge">Neutral: 50</span>
              </div>
            </div>

            {/* AI Badge */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                AI Content Indicator
              </h3>
              <div className="flex gap-3">
                <span className="ai-badge">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
                  </svg>
                  AI Generated
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Buttons
              </h3>
              <div className="flex gap-3 flex-wrap">
                <button className="btn-primary">Primary Button</button>
                <button className="btn-secondary">Secondary Button</button>
                <button className="btn-ghost">Ghost Button</button>
              </div>
            </div>

            {/* Input */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                Input Field
              </h3>
              <input
                type="text"
                className="input max-w-md"
                placeholder="Search for stocks..."
              />
            </div>
          </div>
        </section>

        {/* Data Cards */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-text-primary">Data Card Examples</h2>

          <div className="stats-grid">
            <div className="data-card">
              <p className="text-text-secondary text-sm mb-1">Market Cap</p>
              <p className="font-data text-2xl text-text-primary">₹45,234 Cr</p>
              <p className="metric-positive text-sm mt-1">+2.34%</p>
            </div>

            <div className="data-card">
              <p className="text-text-secondary text-sm mb-1">P/E Ratio</p>
              <p className="font-data text-2xl text-text-primary">28.45</p>
              <p className="metric-negative text-sm mt-1">-5.21%</p>
            </div>

            <div className="data-card">
              <p className="text-text-secondary text-sm mb-1">ROE</p>
              <p className="font-data text-2xl text-text-primary">18.92%</p>
              <p className="metric-positive text-sm mt-1">+1.12%</p>
            </div>

            <div className="data-card">
              <p className="text-text-secondary text-sm mb-1">Debt/Equity</p>
              <p className="font-data text-2xl text-text-primary">0.45</p>
              <p className="metric-neutral text-sm mt-1">0.00%</p>
            </div>
          </div>
        </section>

        {/* Terminal Panel */}
        <section className="terminal-panel">
          <div className="terminal-header">
            <span className="terminal-dot bg-signal-red"></span>
            <span className="terminal-dot bg-signal-yellow"></span>
            <span className="terminal-dot bg-signal-green"></span>
            <span className="text-text-secondary">Terminal</span>
          </div>
          <div className="space-y-1">
            <p className="text-signal-green">$ alphasignal --query "DIXON"</p>
            <p className="text-text-secondary">Fetching stock data...</p>
            <p className="text-text-primary">Dixon Technologies (DIXON) - ₹5,847.50</p>
            <p className="text-signal-green">Quality Score: 78 | Growth Score: 92 | Risk Score: 32</p>
            <p className="text-signal-purple">✨ AI Summary: Strong growth momentum in consumer electronics manufacturing.</p>
          </div>
        </section>

        {/* Data Table */}
        <section className="data-card">
          <div className="card-header">
            <h2 className="card-title">Data Table Example</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Change</th>
                  <th className="text-right">Quality</th>
                  <th className="text-right">Growth</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">DIXON</td>
                  <td>Dixon Technologies</td>
                  <td className="text-right">₹5,847.50</td>
                  <td className="text-right metric-positive">+2.34%</td>
                  <td className="text-right"><span className="score-badge-high">78</span></td>
                  <td className="text-right"><span className="score-badge-high">92</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">DEEPAKNTR</td>
                  <td>Deepak Nitrite</td>
                  <td className="text-right">₹2,145.00</td>
                  <td className="text-right metric-negative">-1.23%</td>
                  <td className="text-right"><span className="score-badge-high">88</span></td>
                  <td className="text-right"><span className="score-badge-medium">72</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">POLYCAB</td>
                  <td>Polycab India</td>
                  <td className="text-right">₹5,680.00</td>
                  <td className="text-right metric-positive">+0.89%</td>
                  <td className="text-right"><span className="score-badge-high">85</span></td>
                  <td className="text-right"><span className="score-badge-medium">75</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <section className="data-card text-center">
          <p className="text-text-secondary">
            Alpha Signal Design System - Dark-mode-first, data-dense, professional
          </p>
          <p className="text-text-muted text-sm mt-2">
            Built with Tailwind CSS • Plus Jakarta Sans & JetBrains Mono
          </p>
        </section>
      </div>
    </div>
  );
};

export default DesignSystemDemo;
