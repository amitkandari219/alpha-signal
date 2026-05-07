/**
 * PDF Report HTML Template Generator
 *
 * Creates a beautiful HTML template from AI-generated report data
 */

import { ComprehensiveReport } from '../services/aiReportGenerator';

export function generateReportHTML(report: ComprehensiveReport): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.companyName} - Comprehensive Analysis Report</title>
  <style>
    /* ============================================= */
    /* GLOBAL STYLES */
    /* ============================================= */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    .container {
      max-width: 100%;
      padding: 0 40px;
    }

    /* ============================================= */
    /* TYPOGRAPHY */
    /* ============================================= */
    h1 {
      font-size: 28pt;
      font-weight: 700;
      margin-bottom: 16pt;
      color: #1a73e8;
      line-height: 1.2;
    }

    h2 {
      font-size: 20pt;
      font-weight: 700;
      margin-top: 32pt;
      margin-bottom: 12pt;
      color: #2c3e50;
      border-bottom: 3px solid #1a73e8;
      padding-bottom: 8pt;
      page-break-after: avoid;
    }

    h3 {
      font-size: 14pt;
      font-weight: 600;
      margin-top: 20pt;
      margin-bottom: 10pt;
      color: #34495e;
      page-break-after: avoid;
    }

    h4 {
      font-size: 12pt;
      font-weight: 600;
      margin-top: 14pt;
      margin-bottom: 8pt;
      color: #5a6c7d;
    }

    p {
      margin-bottom: 10pt;
      text-align: justify;
    }

    /* ============================================= */
    /* PAGE BREAKS */
    /* ============================================= */
    .page-break {
      page-break-after: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* ============================================= */
    /* COVER PAGE */
    /* ============================================= */
    .cover-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      color: white;
      padding: 60px 40px;
      page-break-after: always;
    }

    .cover-title {
      font-size: 42pt;
      font-weight: 800;
      margin-bottom: 20pt;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .cover-subtitle {
      font-size: 18pt;
      margin-bottom: 10pt;
      opacity: 0.95;
    }

    .cover-meta {
      margin: 40pt 0;
      padding: 30pt;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20pt;
    }

    .cover-meta-item {
      text-align: left;
    }

    .cover-meta-label {
      font-size: 10pt;
      opacity: 0.8;
      margin-bottom: 5pt;
    }

    .cover-meta-value {
      font-size: 16pt;
      font-weight: 700;
    }

    .cover-footer {
      margin-top: 60pt;
      font-size: 9pt;
      opacity: 0.7;
    }

    /* ============================================= */
    /* CONTENT SECTIONS */
    /* ============================================= */
    .section {
      margin-bottom: 30pt;
      page-break-inside: avoid;
    }

    .section-header {
      background: #f8f9fa;
      padding: 15pt 20pt;
      margin: 0 -40px 20pt -40px;
      border-left: 5px solid #1a73e8;
    }

    /* ============================================= */
    /* HIGHLIGHTS BOX */
    /* ============================================= */
    .highlights-box {
      background: #e3f2fd;
      border-left: 5px solid #1a73e8;
      padding: 20pt;
      margin: 20pt 0;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .highlights-box h3 {
      margin-top: 0;
      color: #1a73e8;
    }

    .highlights-box ul {
      margin: 10pt 0;
      padding-left: 20pt;
    }

    .highlights-box li {
      margin-bottom: 8pt;
      line-height: 1.5;
    }

    /* ============================================= */
    /* BULL/BEAR CASE */
    /* ============================================= */
    .case-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20pt;
      margin: 20pt 0;
    }

    .bull-case {
      background: #e8f5e9;
      border-left: 5px solid #4caf50;
      padding: 15pt;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .bull-case h4 {
      color: #2e7d32;
      margin-top: 0;
    }

    .bear-case {
      background: #ffebee;
      border-left: 5px solid #f44336;
      padding: 15pt;
      border-radius: 4px;
      page-break-inside: avoid;
    }

    .bear-case h4 {
      color: #c62828;
      margin-top: 0;
    }

    /* ============================================= */
    /* TABLES */
    /* ============================================= */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15pt 0;
      page-break-inside: auto;
    }

    thead {
      background: #1a73e8;
      color: white;
    }

    th {
      padding: 10pt 12pt;
      text-align: left;
      font-weight: 600;
      font-size: 10pt;
    }

    td {
      padding: 10pt 12pt;
      border-bottom: 1px solid #e0e0e0;
    }

    tr {
      page-break-inside: avoid;
    }

    tbody tr:hover {
      background: #f5f5f5;
    }

    /* ============================================= */
    /* BADGES */
    /* ============================================= */
    .badge {
      display: inline-block;
      padding: 4pt 10pt;
      border-radius: 12pt;
      font-size: 9pt;
      font-weight: 600;
      margin-right: 8pt;
    }

    .badge-high {
      background: #ffebee;
      color: #c62828;
    }

    .badge-medium {
      background: #fff3e0;
      color: #e65100;
    }

    .badge-low {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .badge-buy {
      background: #4caf50;
      color: white;
    }

    .badge-sell {
      background: #f44336;
      color: white;
    }

    .badge-hold {
      background: #ff9800;
      color: white;
    }

    /* ============================================= */
    /* RATING BOX */
    /* ============================================= */
    .rating-box {
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      color: white;
      padding: 25pt;
      border-radius: 8px;
      margin: 25pt 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .rating-value {
      font-size: 32pt;
      font-weight: 800;
      margin-bottom: 10pt;
    }

    .rating-confidence {
      font-size: 14pt;
      opacity: 0.9;
    }

    /* ============================================= */
    /* LISTS */
    /* ============================================= */
    ul {
      padding-left: 20pt;
      margin: 10pt 0;
    }

    li {
      margin-bottom: 6pt;
    }

    /* Strong emphasis */
    strong {
      color: #1a73e8;
      font-weight: 600;
    }

    /* ============================================= */
    /* FOOTER */
    /* ============================================= */
    .report-footer {
      margin-top: 40pt;
      padding-top: 20pt;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
  </style>
</head>
<body>

  <!-- ============================================= -->
  <!-- COVER PAGE -->
  <!-- ============================================= -->
  <div class="cover-page">
    <div class="cover-title">${report.companyName}</div>
    <div class="cover-subtitle">Comprehensive Stock Analysis Report</div>
    <div class="cover-meta">
      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <div class="cover-meta-label">Symbol</div>
          <div class="cover-meta-value">${report.symbol}</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">Report Date</div>
          <div class="cover-meta-value">${new Date(report.generatedAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</div>
        </div>
      </div>
    </div>
    <div class="cover-footer">
      <p>AI-Powered Analysis by Alpha Signal</p>
      <p>© ${new Date().getFullYear()} Alpha Signal. All rights reserved.</p>
    </div>
  </div>

  <!-- ============================================= -->
  <!-- EXECUTIVE SUMMARY -->
  <!-- ============================================= -->
  <div class="container">
    <div class="section">
      <h2>Executive Summary</h2>

      <div class="highlights-box">
        <h3>${report.executiveSummary.headline}</h3>
      </div>

      <h3>Key Highlights</h3>
      <ul>
        ${report.executiveSummary.keyHighlights.map(h => `<li>${h}</li>`).join('')}
      </ul>

      <h3>Investment Thesis</h3>
      <p>${report.executiveSummary.investmentThesis}</p>

      <div class="case-grid">
        <div class="bull-case">
          <h4>🐂 Bull Case</h4>
          <p>${report.executiveSummary.bullCase}</p>
        </div>
        <div class="bear-case">
          <h4>🐻 Bear Case</h4>
          <p>${report.executiveSummary.bearCase}</p>
        </div>
      </div>

      <div class="highlights-box">
        <h4>Bottom Line</h4>
        <p>${report.executiveSummary.bottomLine}</p>
      </div>
    </div>

    <!-- ============================================= -->
    <!-- BUSINESS ANALYSIS -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Business Analysis</h2>

      <h3>Overview</h3>
      <p>${report.businessAnalysis.overview}</p>

      <h3>Business Model</h3>
      <p>${report.businessAnalysis.businessModel}</p>

      <h3>Revenue Streams</h3>
      <table>
        <thead>
          <tr>
            <th>Revenue Stream</th>
            <th>Contribution</th>
            <th>Analysis</th>
          </tr>
        </thead>
        <tbody>
          ${report.businessAnalysis.revenueStreams.map(stream => `
            <tr>
              <td><strong>${stream.stream}</strong></td>
              <td>${stream.percentage}</td>
              <td>${stream.analysis}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Competitive Advantages</h3>
      <ul>
        ${report.businessAnalysis.competitiveAdvantages.map(adv => `<li>${adv}</li>`).join('')}
      </ul>

      <h3>Key Business Risks</h3>
      <ul>
        ${report.businessAnalysis.keyRisks.map(risk => `<li>${risk}</li>`).join('')}
      </ul>
    </div>

    <!-- ============================================= -->
    <!-- FINANCIAL ANALYSIS -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Financial Analysis</h2>

      <h3>Overview</h3>
      <p>${report.financialAnalysis.overview}</p>

      <h3>Profitability Analysis</h3>
      <h4>Summary</h4>
      <p>${report.financialAnalysis.profitability.summary}</p>
      <h4>Trends</h4>
      <p>${report.financialAnalysis.profitability.trends}</p>
      <h4>Margins</h4>
      <p>${report.financialAnalysis.profitability.margins}</p>

      <h3>Growth Analysis</h3>
      <h4>Historical Performance</h4>
      <p>${report.financialAnalysis.growth.historical}</p>
      <h4>Growth Drivers</h4>
      <p>${report.financialAnalysis.growth.drivers}</p>
      <h4>Sustainability</h4>
      <p>${report.financialAnalysis.growth.sustainability}</p>

      <h3>Balance Sheet</h3>
      <h4>Strengths</h4>
      <p>${report.financialAnalysis.balanceSheet.strength}</p>
      <h4>Concerns</h4>
      <p>${report.financialAnalysis.balanceSheet.concerns}</p>
    </div>

    <!-- ============================================= -->
    <!-- MOAT ANALYSIS -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Competitive Moat Assessment</h2>

      <p><strong>Overall Assessment:</strong> ${report.moatAnalysis.overallStrength}</p>

      <h3>Moat Dimensions</h3>
      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Rating</th>
            <th>Analysis</th>
          </tr>
        </thead>
        <tbody>
          ${report.moatAnalysis.dimensions.map(dim => `
            <tr>
              <td><strong>${dim.name}</strong></td>
              <td>${dim.rating}/10</td>
              <td>${dim.explanation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Sustainability Outlook</h3>
      <p>${report.moatAnalysis.sustainability}</p>
    </div>

    <!-- ============================================= -->
    <!-- CATALYSTS -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Growth Catalysts & Opportunities</h2>

      <h3>Near-Term Catalysts (6-12 Months)</h3>
      <table>
        <thead>
          <tr>
            <th>Catalyst</th>
            <th>Timeline</th>
            <th>Probability</th>
            <th>Potential Impact</th>
          </tr>
        </thead>
        <tbody>
          ${report.catalysts.nearTerm.map(cat => `
            <tr>
              <td><strong>${cat.catalyst}</strong></td>
              <td>${cat.timeline}</td>
              <td><span class="badge badge-${cat.probability.toLowerCase()}">${cat.probability}</span></td>
              <td>${cat.impact}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h3>Long-Term Catalysts (1-3 Years)</h3>
      <table>
        <thead>
          <tr>
            <th>Catalyst</th>
            <th>Timeline</th>
            <th>Potential Impact</th>
          </tr>
        </thead>
        <tbody>
          ${report.catalysts.longTerm.map(cat => `
            <tr>
              <td><strong>${cat.catalyst}</strong></td>
              <td>${cat.timeline}</td>
              <td>${cat.impact}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- ============================================= -->
    <!-- RISK ASSESSMENT -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Risk Assessment</h2>

      <div class="highlights-box">
        <h4>Overall Risk Profile</h4>
        <p>${report.riskAssessment.overallRisk}</p>
        <p><strong>Risk Score:</strong> ${report.riskAssessment.riskScore}/100</p>
      </div>

      <h3>Major Risks</h3>
      <table>
        <thead>
          <tr>
            <th>Risk</th>
            <th>Severity</th>
            <th>Likelihood</th>
            <th>Mitigation</th>
          </tr>
        </thead>
        <tbody>
          ${report.riskAssessment.majorRisks.map(risk => `
            <tr>
              <td><strong>${risk.risk}</strong></td>
              <td><span class="badge badge-${risk.severity.toLowerCase()}">${risk.severity}</span></td>
              <td><span class="badge badge-${risk.likelihood.toLowerCase()}">${risk.likelihood}</span></td>
              <td>${risk.mitigation}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- ============================================= -->
    <!-- VALUATION -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Valuation & Price Targets</h2>

      <p><strong>Current Price:</strong> ₹${report.valuation.currentPrice}</p>
      <p><strong>Fair Value:</strong> ${report.valuation.fairValue}</p>

      <h3>12-Month Price Targets</h3>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Target Price</th>
            <th>Upside/Downside</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Bear Case</strong></td>
            <td>${report.valuation.priceTarget.low}</td>
            <td>-</td>
          </tr>
          <tr>
            <td><strong>Base Case</strong></td>
            <td>${report.valuation.priceTarget.base}</td>
            <td>-</td>
          </tr>
          <tr>
            <td><strong>Bull Case</strong></td>
            <td>${report.valuation.priceTarget.high}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>

      <h3>Valuation Metrics</h3>
      <p>${report.valuation.valuationMetrics}</p>

      <h3>Peer Comparison</h3>
      <p>${report.valuation.comparison}</p>
    </div>

    <!-- ============================================= -->
    <!-- RECOMMENDATION -->
    <!-- ============================================= -->
    <div class="section page-break">
      <h2>Investment Recommendation</h2>

      <div class="rating-box">
        <div class="rating-value">
          <span class="badge badge-${report.recommendation.rating.toLowerCase().replace(' ', '-')}">${report.recommendation.rating}</span>
        </div>
        <div class="rating-confidence">Confidence: ${report.recommendation.confidence}%</div>
      </div>

      <h3>Reasoning</h3>
      <p>${report.recommendation.reasoning}</p>

      <h3>Ideal Investor Profile</h3>
      <p>${report.recommendation.idealInvestor}</p>

      <h3>Recommended Time Horizon</h3>
      <p>${report.recommendation.timeHorizon}</p>

      <h3>Position Sizing Guidance</h3>
      <p>${report.recommendation.positionSize}</p>
    </div>

    <!-- ============================================= -->
    <!-- FOOTER / DISCLAIMER -->
    <!-- ============================================= -->
    <div class="report-footer">
      <p><strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute investment advice.
      The information provided is based on publicly available data and AI analysis. Past performance is not indicative of future results.
      Please consult with a qualified financial advisor before making investment decisions.</p>
      <p style="margin-top: 15pt;">
        <strong>Generated by Alpha Signal</strong><br>
        AI-Powered Stock Intelligence for Indian Markets<br>
        Report Date: ${new Date(report.generatedAt).toLocaleString('en-IN')}
      </p>
    </div>
  </div>

</body>
</html>
  `.trim();
}
