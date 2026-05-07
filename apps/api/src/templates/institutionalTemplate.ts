/**
 * Premium HTML Template for Institutional-Grade Research Reports
 *
 * Designed for elite equity research with infographic-ready visuals
 */

import { InstitutionalReport } from '../services/institutionalReportGenerator';

export function generateInstitutionalHTML(report: InstitutionalReport): string {
  const { companyName, symbol, asOfDate } = report;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${companyName} - Deep Research Master Report</title>
  <style>
    /* ═══════════════════════════════════════════════════════════════
       INSTITUTIONAL RESEARCH REPORT STYLING
       Premium, professional, print-optimized
    ═══════════════════════════════════════════════════════════════ */

    @page {
      size: A4;
      margin: 20mm 15mm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: white;
    }

    /* COVER PAGE */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%);
      color: white;
      text-align: center;
      padding: 60px 40px;
      page-break-after: always;
    }

    .cover-logo {
      font-size: 32pt;
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 600;
      margin: 40px 0 20px 0;
      line-height: 1.2;
    }

    .cover-subtitle {
      font-size: 14pt;
      opacity: 0.9;
      margin-bottom: 60px;
    }

    .cover-meta {
      display: flex;
      gap: 40px;
      justify-content: center;
      margin-top: 40px;
      font-size: 11pt;
    }

    .cover-meta-item {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .cover-meta-label {
      font-size: 9pt;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-meta-value {
      font-size: 13pt;
      font-weight: 600;
    }

    .disclaimer {
      margin-top: 80px;
      font-size: 8pt;
      opacity: 0.7;
      max-width: 600px;
    }

    /* TYPOGRAPHY */
    h1 {
      font-size: 20pt;
      font-weight: 700;
      color: #0d47a1;
      margin: 30px 0 15px 0;
      page-break-after: avoid;
    }

    h2 {
      font-size: 14pt;
      font-weight: 600;
      color: #1565c0;
      margin: 25px 0 12px 0;
      page-break-after: avoid;
    }

    h3 {
      font-size: 11pt;
      font-weight: 600;
      color: #333;
      margin: 15px 0 8px 0;
    }

    p {
      margin: 8px 0;
      text-align: justify;
    }

    /* EXECUTIVE DASHBOARD */
    .executive-dashboard {
      background: #f5f5f5;
      border-left: 4px solid #0d47a1;
      padding: 20px;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 15px;
    }

    .dashboard-card {
      background: white;
      padding: 15px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .dashboard-card h3 {
      color: #0d47a1;
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 10pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .confidence-score {
      font-size: 32pt;
      font-weight: 700;
      color: #1565c0;
      text-align: center;
      margin: 10px 0;
    }

    /* MOAT VERDICT */
    .moat-verdict {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
    }

    /* LISTS */
    .bullet-list {
      list-style: none;
      padding-left: 0;
    }

    .bullet-list li {
      padding: 6px 0 6px 20px;
      position: relative;
    }

    .bullet-list li:before {
      content: "▪";
      position: absolute;
      left: 0;
      color: #1565c0;
      font-weight: bold;
    }

    .numbered-list {
      padding-left: 20px;
      margin: 10px 0;
    }

    .numbered-list li {
      padding: 4px 0;
    }

    /* DATA TABLE */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .data-table thead {
      background: #0d47a1;
      color: white;
    }

    .data-table th {
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 9pt;
    }

    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e0e0e0;
    }

    .data-table tbody tr:nth-child(even) {
      background: #f9f9f9;
    }

    /* RISK HEATMAP */
    .risk-heatmap {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 15px 0;
    }

    .risk-box {
      padding: 12px;
      border-radius: 4px;
      font-size: 9pt;
    }

    .risk-high {
      background: #ffebee;
      border-left: 4px solid #d32f2f;
    }

    .risk-medium {
      background: #fff3e0;
      border-left: 4px solid #f57c00;
    }

    .risk-low {
      background: #e8f5e9;
      border-left: 4px solid #388e3c;
    }

    /* INFOGRAPHIC CARDS */
    .infographic-section {
      background: #fafafa;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .radar-chart-visual {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin: 15px 0;
    }

    .radar-axis {
      text-align: center;
      padding: 10px;
      background: white;
      border-radius: 4px;
      border: 2px solid #e0e0e0;
    }

    .radar-value {
      font-size: 24pt;
      font-weight: 700;
      color: #1565c0;
      display: block;
      margin: 5px 0;
    }

    .radar-label {
      font-size: 9pt;
      font-weight: 600;
      color: #666;
    }

    /* TIMELINE */
    .timeline {
      margin: 20px 0;
      padding-left: 30px;
      border-left: 3px solid #1565c0;
    }

    .timeline-item {
      margin: 15px 0;
      padding-left: 20px;
      position: relative;
    }

    .timeline-item:before {
      content: "";
      position: absolute;
      left: -33px;
      top: 5px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #1565c0;
      border: 3px solid white;
    }

    .timeline-year {
      font-weight: 700;
      color: #0d47a1;
      font-size: 11pt;
    }

    .timeline-event {
      font-weight: 600;
      margin: 3px 0;
    }

    .timeline-detail {
      font-size: 9pt;
      color: #666;
    }

    /* KPI DASHBOARD */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .kpi-card {
      background: white;
      padding: 15px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      text-align: center;
    }

    .kpi-value {
      font-size: 20pt;
      font-weight: 700;
      color: #0d47a1;
      display: block;
      margin: 5px 0;
    }

    .kpi-label {
      font-size: 8pt;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-delta {
      font-size: 9pt;
      margin-top: 5px;
    }

    .kpi-delta.positive {
      color: #388e3c;
    }

    .kpi-delta.negative {
      color: #d32f2f;
    }

    /* SOURCE LIBRARY */
    .sources {
      font-size: 8pt;
      margin: 30px 0;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .source-item {
      margin: 5px 0;
      padding-left: 15px;
      position: relative;
    }

    .source-item:before {
      content: "→";
      position: absolute;
      left: 0;
      color: #1565c0;
    }

    /* PAGE BREAKS */
    .page-break {
      page-break-after: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* SECTION HEADERS */
    .section-header {
      background: #0d47a1;
      color: white;
      padding: 15px 20px;
      margin: 30px -20px 20px -20px;
      font-size: 16pt;
      font-weight: 600;
      letter-spacing: 1px;
    }

    /* CHART CONTAINERS */
    .chart-container {
      background: #f9f9f9;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .chart-container h2 {
      color: #0d47a1;
      text-align: center;
      margin-bottom: 15px;
      font-size: 13pt;
    }

    .chart-container img {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 4px;
    }
  </style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-logo">ALPHA SIGNAL</div>
    <div class="cover-title">${companyName}</div>
    <div class="cover-subtitle">Deep Research Master Report</div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Ticker</div>
        <div class="cover-meta-value">${symbol}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">As of Date</div>
        <div class="cover-meta-value">${asOfDate}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Report Type</div>
        <div class="cover-meta-value">Institutional Grade</div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>DISCLAIMER:</strong> This report is for informational and educational purposes only.
      It does not constitute investment advice, recommendation, or solicitation to buy or sell securities.
      Investors should conduct their own due diligence and consult qualified financial advisors.
    </div>
  </div>

  ${generateExecutiveDashboard(report)}
  ${generateVisualInfographics(report)}
  ${generateDeepResearchDossier(report)}
  ${generateInfographicBlueprint(report)}
  ${generateRedFlags(report)}
  ${generateSourceLibrary(report)}

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// SECTION GENERATORS
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// VISUAL INFOGRAPHICS SECTION (NEW!)
// ═══════════════════════════════════════════════════════════════

function generateVisualInfographics(report: InstitutionalReport): string {
  if (!report.visualInfographics) {
    return ''; // Skip if no infographics generated
  }

  const charts = report.visualInfographics.renderedCharts;

  return `
  <div class="page-break"></div>
  <div class="section-header">VISUAL ANALYTICS & INFOGRAPHICS</div>

  <h1>📊 Data Visualizations</h1>
  <p style="font-size: 9pt; color: #666; margin-bottom: 20px;">
    AI-generated charts and diagrams providing visual insights into the company's performance, competitive position, and future outlook.
  </p>

  <!-- Revenue Breakdown -->
  <div class="chart-container avoid-break">
    <h2>Revenue Breakdown by Segment</h2>
    <img src="${charts.revenueBreakdownUrl}" alt="Revenue Breakdown" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
  </div>

  <!-- MOAT Radar Chart -->
  <div class="chart-container avoid-break">
    <h2>Competitive MOAT Analysis</h2>
    <img src="${charts.moatRadarUrl}" alt="MOAT Radar Chart" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
    <p style="font-size: 9pt; color: #666; text-align: center; margin-top: 10px;">
      Six dimensions of competitive advantage rated on a 1-10 scale
    </p>
  </div>

  <div class="page-break"></div>

  <!-- Financial Trends -->
  <div class="chart-container avoid-break">
    <h2>5-Year Financial Performance Trends</h2>
    <img src="${charts.financialTrendsUrl}" alt="Financial Trends" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
  </div>

  <!-- Peer Comparison -->
  <div class="chart-container avoid-break">
    <h2>Peer Benchmarking Analysis</h2>
    <img src="${charts.peerComparisonUrl}" alt="Peer Comparison" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
  </div>

  <div class="page-break"></div>

  <!-- Growth Trajectory -->
  <div class="chart-container avoid-break">
    <h2>Growth Trajectory: Base/Bull/Bear Scenarios</h2>
    <img src="${charts.growthTrajectoryUrl}" alt="Growth Trajectory" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
    <p style="font-size: 9pt; color: #666; text-align: center; margin-top: 10px;">
      Revenue projections under different market scenarios over the next 5 years
    </p>
  </div>

  <!-- Risk Heatmap -->
  <div class="chart-container avoid-break">
    <h2>Risk Assessment Heatmap</h2>
    <img src="${charts.riskHeatmapUrl}" alt="Risk Heatmap" style="width: 100%; max-width: 800px; height: auto; margin: 20px auto; display: block;" />
  </div>

  <div class="page-break"></div>
  `;
}

function generateExecutiveDashboard(report: InstitutionalReport): string {
  const dash = report.executiveDashboard;

  return `
  <div class="executive-dashboard">
    <h1>📊 Executive Dashboard</h1>

    <p><strong>Company Snapshot:</strong> ${dash.snapshot}</p>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Why It Matters</h3>
        <ul class="bullet-list">
          ${dash.whyItMatters.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="dashboard-card">
        <h3>Confidence Score</h3>
        <div class="confidence-score">${dash.confidenceScore}</div>
        <p style="font-size: 8pt; text-align: center;">${dash.confidenceReasoning}</p>
      </div>
    </div>

    <div class="moat-verdict">
      <h3>🏰 MOAT Verdict</h3>
      <p><strong>Strength:</strong> ${dash.moatVerdict.strength}</p>
      <p><strong>Durability:</strong> ${dash.moatVerdict.durability}</p>
      <p><strong>Erosion Risks:</strong> ${dash.moatVerdict.erosionRisks}</p>
    </div>

    <h3>Business Model</h3>
    <p>${dash.businessModelDiagram}</p>

    <div class="dashboard-grid">
      <div class="dashboard-card">
        <h3>Key Drivers (7)</h3>
        <ul class="bullet-list">
          ${dash.keyDrivers.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>

      <div class="dashboard-card">
        <h3>Key Risks (7)</h3>
        <ul class="bullet-list">
          ${dash.keyRisks.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    </div>

    <h3>What to Monitor (12-Month Checklist)</h3>
    <ul class="bullet-list">
      ${dash.whatToMonitor.map(item => `<li>${item}</li>`).join('')}
    </ul>
  </div>
  <div class="page-break"></div>
  `;
}

function generateDeepResearchDossier(report: InstitutionalReport): string {
  return `
  <div class="section-header">DEEP RESEARCH DOSSIER</div>

  ${generateCompanyDNA(report)}
  ${generateBusinessDeconstruction(report)}
  ${generateSupplyChain(report)}
  ${generateMoatAnalysis(report)}
  ${generateFinancialForensics(report)}
  ${generateMarketStructure(report)}
  ${generateGrowthEngines(report)}
  ${generateRiskLandscape(report)}
  ${generateMacroPolicy(report)}
  ${generateCatalysts(report)}
  ${generatePeerBenchmarking(report)}
  ${generateOperatingManual(report)}
  `;
}

function generateCompanyDNA(report: InstitutionalReport): string {
  const dna = report.companyDNA;

  return `
  <h1>A. Company DNA & History</h1>

  <h2>Founding Story</h2>
  <p>${dna.foundingStory}</p>

  <h2>Major Pivots & Strategic Shifts</h2>
  <ul class="bullet-list">
    ${dna.majorPivots.map(pivot => `<li>${pivot}</li>`).join('')}
  </ul>

  <h2>Timeline of Major Events</h2>
  <div class="timeline">
    ${dna.maTimeline && dna.maTimeline.length > 0
      ? dna.maTimeline.map((event: any) => `
        <div class="timeline-item">
          <div class="timeline-year">${event.year}</div>
          <div class="timeline-event">${event.event}</div>
          <div class="timeline-detail">${event.impact}</div>
        </div>
      `).join('')
      : '<p>Timeline data not available</p>'
    }
  </div>

  <h2>Strategy Evolution</h2>
  <p>${dna.strategyEvolution}</p>

  <div class="page-break"></div>
  `;
}

function generateBusinessDeconstruction(report: InstitutionalReport): string {
  const biz = report.businessDeconstruction;

  return `
  <h1>B. Business Deconstruction</h1>

  <h2>Product/Service Lines</h2>
  ${biz.productLines && biz.productLines.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Product/Service</th>
        <th>Revenue Split</th>
        <th>Margin Profile</th>
        <th>Analysis</th>
      </tr>
    </thead>
    <tbody>
      ${biz.productLines.map((line: any) => `
        <tr>
          <td>${line.product}</td>
          <td>${line.revenueSplit}</td>
          <td>${line.marginProfile}</td>
          <td>${line.analysis}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Product line data not available</p>'}

  <h2>Unit Economics</h2>
  <p>${biz.unitEconomics}</p>

  <h2>Routes to Market</h2>
  <p>${biz.routesToMarket}</p>

  <div class="page-break"></div>
  `;
}

function generateSupplyChain(report: InstitutionalReport): string {
  const sc = report.supplyChainPositioning;

  return `
  <h1>C. Supply Chain Positioning</h1>

  <h2>Upstream (Suppliers)</h2>
  ${sc.upstream && sc.upstream.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Type</th>
        <th>Criticality</th>
        <th>Concentration</th>
        <th>Import Exposure</th>
      </tr>
    </thead>
    <tbody>
      ${sc.upstream.map((item: any) => `
        <tr>
          <td>${item.type}</td>
          <td>${item.criticality}</td>
          <td>${item.supplierConcentration}</td>
          <td>${item.importExposure || 'N/A'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Upstream data not available</p>'}

  <h2>Midstream (Operations)</h2>
  <p>${sc.midstream}</p>

  <h2>Downstream (Distribution)</h2>
  ${sc.downstream && sc.downstream.length > 0 ? `
  <ul class="bullet-list">
    ${sc.downstream.map((item: any) => `<li><strong>${item.channel}</strong>: ${item.contribution} (Dependency: ${item.dependency})</li>`).join('')}
  </ul>
  ` : '<p>Downstream data not available</p>'}

  <h2>Dependencies & Vulnerabilities</h2>
  <p>${sc.dependenciesMap}</p>

  <h2>Competitive Positioning</h2>
  <p>${sc.competitiveMap}</p>

  <div class="page-break"></div>
  `;
}

function generateMoatAnalysis(report: InstitutionalReport): string {
  const moat = report.moatAnalysis;

  return `
  <h1>D. MOAT & Competitive Advantage</h1>

  <h2>Structural MOAT Analysis</h2>
  ${moat.structuralMoat ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Dimension</th>
        <th>Rating (1-10)</th>
        <th>Evidence</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(moat.structuralMoat).map(([key, val]: [string, any]) => `
        <tr>
          <td><strong>${key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
          <td>${val.rating}/10</td>
          <td>${val.evidence}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Structural MOAT data not available</p>'}

  <h2>Operational MOAT</h2>
  <p>${moat.operationalMoat}</p>

  <h2>Strategic MOAT</h2>
  <p>${moat.strategicMoat}</p>

  <h2>Fragility Analysis</h2>
  <p>${moat.fragility}</p>

  <h2>Evidence of MOAT</h2>
  <p>${moat.evidence}</p>

  ${moat.moatScorecard ? `
  <div class="moat-verdict">
    <h3>MOAT Scorecard</h3>
    <p><strong>Overall:</strong> ${moat.moatScorecard.overall}</p>
    <p><strong>Trend:</strong> ${moat.moatScorecard.trend}</p>
    <p><strong>Horizon:</strong> ${moat.moatScorecard.horizon}</p>
  </div>
  ` : ''}

  <div class="page-break"></div>
  `;
}

function generateFinancialForensics(report: InstitutionalReport): string {
  const fin = report.financialForensics;

  return `
  <h1>E. Financial Forensics</h1>

  <h2>Growth Quality</h2>
  <p>${fin.growthQuality}</p>

  <h2>Accounting Quality</h2>
  <p>${fin.accountingQuality}</p>

  <h2>Balance Sheet Analysis</h2>
  <p>${fin.balanceSheet}</p>

  <h2>Cash Conversion Cycle</h2>
  <p>${fin.cashConversionCycle}</p>

  <h2>Capital Allocation</h2>
  <p>${fin.capitalAllocation}</p>

  <h2>Promoter Behavior</h2>
  <p>${fin.promoterBehavior}</p>

  ${fin.financialTruthTable ? `
  <h2>Financial Truth Table</h2>
  <div class="dashboard-grid">
    <div class="dashboard-card">
      <h3>✅ Looks Good</h3>
      <ul class="bullet-list">
        ${fin.financialTruthTable.looksGood.map((item: string) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    <div class="dashboard-card">
      <h3>⚠️ Concerning</h3>
      <ul class="bullet-list">
        ${fin.financialTruthTable.concerning.map((item: string) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  </div>
  ${fin.financialTruthTable.unclear && fin.financialTruthTable.unclear.length > 0 ? `
  <div class="dashboard-card">
    <h3>❓ Unclear / Needs Verification</h3>
    <ul class="bullet-list">
      ${fin.financialTruthTable.unclear.map((item: string) => `<li>${item}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  ` : ''}

  <div class="page-break"></div>
  `;
}

function generateMarketStructure(report: InstitutionalReport): string {
  const market = report.marketStructure;

  return `
  <h1>F. Market & Industry Structure</h1>

  <h2>Market Sizing</h2>
  <p><strong>TAM (Total Addressable Market):</strong> ${market.tam}</p>
  <p><strong>SAM (Serviceable Addressable Market):</strong> ${market.sam}</p>
  <p><strong>SOM (Serviceable Obtainable Market / Market Share):</strong> ${market.som}</p>

  <h2>Industry Cycle</h2>
  <p>${market.industryCycle}</p>

  <h2>Porter's Five Forces</h2>
  ${market.portersFiveForces ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Force</th>
        <th>Intensity</th>
        <th>Reasoning</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(market.portersFiveForces).map(([key, val]) => `
        <tr>
          <td><strong>${key.replace(/([A-Z])/g, ' $1').trim()}</strong></td>
          <td>${typeof val === 'string' ? val.split('-')[0].trim() : val}</td>
          <td>${typeof val === 'string' ? val.split('-').slice(1).join('-').trim() : val}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Porter\'s analysis not available</p>'}

  <h2>Regulatory Landscape</h2>
  <p>${market.regulatoryLandscape}</p>

  <div class="page-break"></div>
  `;
}

function generateGrowthEngines(report: InstitutionalReport): string {
  const growth = report.growthEngines;

  return `
  <h1>G. Growth Engines & Execution Reality</h1>

  <h2>Growth Levers</h2>
  <ul class="bullet-list">
    ${growth.growthLevers.map(lever => `<li>${lever}</li>`).join('')}
  </ul>

  <h2>Execution Constraints</h2>
  <ul class="bullet-list">
    ${growth.executionConstraints.map(constraint => `<li>${constraint}</li>`).join('')}
  </ul>

  <h2>Pipeline & Announced Initiatives</h2>
  <p>${growth.pipeline}</p>

  <div class="dashboard-grid">
    <div class="dashboard-card">
      <h3>✅ What Must Go Right</h3>
      <ul class="bullet-list">
        ${growth.whatMustGoRight.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    <div class="dashboard-card">
      <h3>⚠️ What Can Go Wrong</h3>
      <ul class="bullet-list">
        ${growth.whatCanGoWrong.map(item => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  </div>

  <div class="page-break"></div>
  `;
}

function generateRiskLandscape(report: InstitutionalReport): string {
  const risk = report.riskLandscape;

  return `
  <h1>H. Risk Landscape</h1>

  ${risk.riskHeatmap ? `
  <h2>Risk Heatmap</h2>
  <div class="risk-heatmap">
    ${risk.riskHeatmap.high && risk.riskHeatmap.high.length > 0 ? risk.riskHeatmap.high.map((r: string) => `
      <div class="risk-box risk-high"><strong>HIGH:</strong> ${r}</div>
    `).join('') : ''}

    ${risk.riskHeatmap.medium && risk.riskHeatmap.medium.length > 0 ? risk.riskHeatmap.medium.map((r: string) => `
      <div class="risk-box risk-medium"><strong>MEDIUM:</strong> ${r}</div>
    `).join('') : ''}

    ${risk.riskHeatmap.low && risk.riskHeatmap.low.length > 0 ? risk.riskHeatmap.low.map((r: string) => `
      <div class="risk-box risk-low"><strong>LOW:</strong> ${r}</div>
    `).join('') : ''}
  </div>
  ` : ''}

  ${generateRiskCategory('Business Risk', risk.businessRisk)}
  ${generateRiskCategory('Financial Risk', risk.financialRisk)}
  ${generateRiskCategory('Governance Risk', risk.governanceRisk)}
  ${generateRiskCategory('Regulatory Risk', risk.regulatoryRisk)}
  ${generateRiskCategory('Tech Disruption Risk', risk.techDisruptionRisk)}
  ${generateRiskCategory('Competitive Risk', risk.competitiveRisk)}
  ${generateRiskCategory('Geopolitical Risk', risk.geopoliticalRisk)}

  <div class="page-break"></div>
  `;
}

function generateRiskCategory(title: string, risks: any[]): string {
  if (!risks || risks.length === 0) return '';

  return `
  <h2>${title}</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th>Risk</th>
        <th>Probability</th>
        <th>Impact</th>
        <th>Mitigation</th>
      </tr>
    </thead>
    <tbody>
      ${risks.map((r: any) => `
        <tr>
          <td>${r.risk}</td>
          <td>${r.probability}</td>
          <td>${r.impact}</td>
          <td>${r.mitigation}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  `;
}

function generateMacroPolicy(report: InstitutionalReport): string {
  const macro = report.macroPolicyGeopolitics;

  return `
  <h1>I. Macro, Policy & Geopolitics</h1>

  <h2>India Government Initiatives</h2>
  ${macro.indiaGovtInitiatives && macro.indiaGovtInitiatives.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Policy/Initiative</th>
        <th>Impact</th>
        <th>Timeline</th>
      </tr>
    </thead>
    <tbody>
      ${macro.indiaGovtInitiatives.map((item: any) => `
        <tr>
          <td>${item.policy}</td>
          <td>${item.impact}</td>
          <td>${item.timeline}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Government initiatives data not available</p>'}

  <h2>Trade Policy</h2>
  <p>${macro.tradePolicy}</p>

  <h2>Interest Rate Sensitivity</h2>
  <p>${macro.interestRatesSensitivity}</p>

  <h2>Global Relations</h2>
  <p>${macro.globalRelations}</p>

  ${macro.scenarios ? `
  <h2>Scenario Analysis</h2>
  <div class="dashboard-grid">
    <div class="dashboard-card">
      <h3>Base Case</h3>
      <p>${macro.scenarios.base}</p>
    </div>
    <div class="dashboard-card">
      <h3>Tailwind Scenario</h3>
      <p>${macro.scenarios.tailwind}</p>
    </div>
    <div class="dashboard-card">
      <h3>Headwind Scenario</h3>
      <p>${macro.scenarios.headwind}</p>
    </div>
  </div>
  ` : ''}

  <div class="page-break"></div>
  `;
}

function generateCatalysts(report: InstitutionalReport): string {
  const cat = report.catalysts;

  return `
  <h1>J. Catalysts</h1>

  <h2>Near-Term Catalysts (3-6 months)</h2>
  ${cat.nearTerm && cat.nearTerm.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Catalyst</th>
        <th>Timeline</th>
        <th>Impact</th>
        <th>Probability</th>
      </tr>
    </thead>
    <tbody>
      ${cat.nearTerm.map((item: any) => `
        <tr>
          <td>${item.catalyst}</td>
          <td>${item.timeline}</td>
          <td>${item.impact}</td>
          <td>${item.probability}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Near-term catalysts not available</p>'}

  <h2>Long-Term Catalysts (1-3 years)</h2>
  ${cat.longTerm && cat.longTerm.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Catalyst</th>
        <th>Timeline</th>
        <th>Impact</th>
      </tr>
    </thead>
    <tbody>
      ${cat.longTerm.map((item: any) => `
        <tr>
          <td>${item.catalyst}</td>
          <td>${item.timeline}</td>
          <td>${item.impact}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Long-term catalysts not available</p>'}

  <div class="page-break"></div>
  `;
}

function generatePeerBenchmarking(report: InstitutionalReport): string {
  const peer = report.peerBenchmarking;

  return `
  <h1>K. Peer Benchmarking</h1>

  ${peer.peers && peer.peers.length > 0 ? `
  <table class="data-table">
    <thead>
      <tr>
        <th>Company</th>
        <th>Growth</th>
        <th>Margins</th>
        <th>ROIC</th>
        <th>Valuation</th>
      </tr>
    </thead>
    <tbody>
      ${peer.peers.map((p: any) => `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.growth}</td>
          <td>${p.margins}</td>
          <td>${p.roic}</td>
          <td>${p.valuation}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : '<p>Peer data not available</p>'}

  <h2>Differentiation Analysis</h2>
  <p>${peer.differentiation}</p>

  <div class="page-break"></div>
  `;
}

function generateOperatingManual(report: InstitutionalReport): string {
  const manual = report.investorOperatingManual;

  return `
  <h1>L. Investor Operating Manual</h1>

  <h2>KPIs to Monitor</h2>
  <ul class="bullet-list">
    ${manual.kpisToMonitor.map(kpi => `<li>${kpi}</li>`).join('')}
  </ul>

  <h2>Early Warning Signals</h2>
  <ul class="bullet-list">
    ${manual.earlyWarningSignals.map(signal => `<li>${signal}</li>`).join('')}
  </ul>

  <h2>Management Questions (Earnings Call Checklist)</h2>
  <ol class="numbered-list">
    ${manual.managementQuestions.map(q => `<li>${q}</li>`).join('')}
  </ol>

  <div class="page-break"></div>
  `;
}

function generateInfographicBlueprint(report: InstitutionalReport): string {
  const infog = report.infographics;

  return `
  <div class="section-header">INFOGRAPHIC BLUEPRINT</div>

  <div class="infographic-section">
    <h1>Visual Data Structures</h1>
    <p style="font-size: 9pt; color: #666; margin-bottom: 20px;">
      The following sections provide structured data for rendering infographics and charts.
    </p>

    ${infog.radarChart ? generateRadarChart(infog.radarChart) : ''}
    ${infog.kpiDashboard ? generateKPIDashboard(infog.kpiDashboard) : ''}
    ${infog.timeline ? generateTimelineVisual(infog.timeline) : ''}
  </div>

  <div class="page-break"></div>
  `;
}

function generateRadarChart(radarData: any): string {
  if (!radarData.axes || radarData.axes.length === 0) return '';

  return `
  <h2>MOAT Strength Radar</h2>
  <div class="radar-chart-visual">
    ${radarData.axes.map((axis: any) => `
      <div class="radar-axis">
        <span class="radar-value">${axis.value}</span>
        <span class="radar-label">${axis.name}</span>
        <p style="font-size: 8pt; margin-top: 5px; color: #666;">${axis.note}</p>
      </div>
    `).join('')}
  </div>
  `;
}

function generateKPIDashboard(kpiData: any): string {
  if (!kpiData.kpis || kpiData.kpis.length === 0) return '';

  return `
  <h2>Key Performance Indicators</h2>
  <div class="kpi-grid">
    ${kpiData.kpis.map((kpi: any) => `
      <div class="kpi-card">
        <div class="kpi-label">${kpi.label}</div>
        <div class="kpi-value">${kpi.value}</div>
        <div class="kpi-delta ${kpi.delta && kpi.delta.includes('+') ? 'positive' : 'negative'}">
          ${kpi.delta} ${kpi.period}
        </div>
        ${kpi.note ? `<p style="font-size: 8pt; margin-top: 5px; color: #666;">${kpi.note}</p>` : ''}
      </div>
    `).join('')}
  </div>
  `;
}

function generateTimelineVisual(timelineData: any): string {
  if (!timelineData.events || timelineData.events.length === 0) return '';

  return `
  <h2>Company Timeline</h2>
  <div class="timeline">
    ${timelineData.events.map((event: any) => `
      <div class="timeline-item">
        <div class="timeline-year">${event.date}</div>
        <div class="timeline-event">${event.title}</div>
        <div class="timeline-detail">${event.detail} • Impact: ${event.impact}</div>
      </div>
    `).join('')}
  </div>
  `;
}

function generateRedFlags(report: InstitutionalReport): string {
  const flags = report.redFlags;

  return `
  <div class="section-header">RED FLAGS & OPEN QUESTIONS</div>

  <h1>Data Gaps</h1>
  ${flags.dataGaps && flags.dataGaps.length > 0 ? `
  <ul class="bullet-list">
    ${flags.dataGaps.map(gap => `<li>${gap}</li>`).join('')}
  </ul>
  ` : '<p>No identified data gaps</p>'}

  <h1>Due Diligence Checklist (Top 20)</h1>
  ${flags.diligenceChecklist && flags.diligenceChecklist.length > 0 ? `
  <ol class="numbered-list">
    ${flags.diligenceChecklist.map(item => `<li>${item}</li>`).join('')}
  </ol>
  ` : '<p>Checklist not available</p>'}

  <div class="page-break"></div>
  `;
}

function generateSourceLibrary(report: InstitutionalReport): string {
  const sources = report.sources;

  return `
  <div class="section-header">SOURCE LIBRARY</div>

  <div class="sources">
    ${generateSourceCategory('Company Primary Sources', sources.companyPrimary)}
    ${generateSourceCategory('Government & Regulatory', sources.governmentRegulatory)}
    ${generateSourceCategory('Industry Research', sources.industryResearch)}
    ${generateSourceCategory('Credible News', sources.credibleNews)}
  </div>
  `;
}

function generateSourceCategory(title: string, sources: any[]): string {
  if (!sources || sources.length === 0) return `<h3>${title}</h3><p>No sources available</p>`;

  return `
  <h3>${title}</h3>
  ${sources.map((source: any) => `
    <div class="source-item">
      <strong>${source.title}</strong> (${source.publisher}, ${source.date})
      ${source.link !== 'needs verification' ? ` - ${source.link}` : ' - <em>needs verification</em>'}
    </div>
  `).join('')}
  `;
}
