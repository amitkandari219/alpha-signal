/**
 * Infographic Generator Service
 *
 * Generates visual infographics for institutional reports using:
 * 1. AI-generated chart specifications (Claude)
 * 2. QuickChart API for chart rendering
 * 3. Mermaid for diagrams
 * 4. DALL-E for custom illustrations (optional)
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set');
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface InfographicSpecs {
  // Chart Specifications
  charts: {
    revenueBreakdown: PieChartSpec;
    moatRadar: RadarChartSpec;
    riskHeatmap: HeatmapSpec;
    financialTrends: LineChartSpec;
    peerComparison: BarChartSpec;
    growthTrajectory: AreaChartSpec;
  };

  // Diagram Specifications
  diagrams: {
    valueChainFlow: MermaidDiagramSpec;
    competitivePosition: MermaidDiagramSpec;
    catalystTimeline: TimelineSpec;
    portersFiveForces: DiagramSpec;
  };

  // Visual Assets (for DALL-E)
  illustrations: {
    industryVisual: IllustrationSpec;
    companyMetaphor: IllustrationSpec;
    riskIcons: IllustrationSpec[];
  };

  // QuickChart URLs (generated)
  renderedCharts: {
    revenueBreakdownUrl: string;
    moatRadarUrl: string;
    riskHeatmapUrl: string;
    financialTrendsUrl: string;
    peerComparisonUrl: string;
    growthTrajectoryUrl: string;
  };
}

interface PieChartSpec {
  title: string;
  data: { label: string; value: number; color: string }[];
  totalLabel: string;
}

interface RadarChartSpec {
  title: string;
  axes: { label: string; value: number; maxValue: number }[];
  fillColor: string;
  strokeColor: string;
}

interface HeatmapSpec {
  title: string;
  rows: string[];
  columns: string[];
  values: number[][];
  colorScale: { min: string; mid: string; max: string };
}

interface LineChartSpec {
  title: string;
  xAxis: { label: string; values: string[] };
  yAxis: { label: string };
  series: { name: string; data: number[]; color: string }[];
}

interface BarChartSpec {
  title: string;
  categories: string[];
  series: { name: string; data: number[]; color: string }[];
  horizontal?: boolean;
}

interface AreaChartSpec {
  title: string;
  xAxis: { label: string; values: string[] };
  yAxis: { label: string };
  series: { name: string; data: number[]; color: string; fillOpacity: number }[];
}

interface MermaidDiagramSpec {
  title: string;
  diagramType: 'flowchart' | 'sequenceDiagram' | 'gantt' | 'classDiagram';
  mermaidCode: string;
}

interface TimelineSpec {
  title: string;
  events: { date: string; label: string; description: string; color: string }[];
}

interface DiagramSpec {
  title: string;
  svgCode: string;
}

interface IllustrationSpec {
  prompt: string;
  style: 'professional' | 'minimalist' | 'corporate' | 'creative';
  purpose: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function generateInfographics(
  reportData: any,
  companyName: string,
  symbol: string
): Promise<InfographicSpecs> {
  console.log(`🎨 Generating infographics for ${symbol}`);

  // Step 1: Use AI to generate chart specifications
  const chartSpecs = await generateChartSpecifications(reportData, companyName, symbol);

  // Step 2: Render charts using QuickChart API
  const renderedCharts = await renderChartsWithQuickChart(chartSpecs.charts);

  // Step 3: Generate diagram specs
  const diagrams = await generateDiagramSpecs(reportData, companyName);

  // Step 4: Generate illustration prompts (for future DALL-E integration)
  const illustrations = await generateIllustrationPrompts(reportData, companyName, symbol);

  const infographics: InfographicSpecs = {
    charts: chartSpecs.charts,
    diagrams,
    illustrations,
    renderedCharts,
  };

  console.log('✅ Infographics generated successfully');
  return infographics;
}

// ═══════════════════════════════════════════════════════════════
// STEP 1: AI-GENERATED CHART SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════

async function generateChartSpecifications(
  reportData: any,
  companyName: string,
  symbol: string
): Promise<{ charts: any }> {
  console.log('  🤖 Generating chart specifications with AI...');

  const client = getAnthropicClient();

  const prompt = `You are a data visualization expert. Analyze this institutional research report for ${companyName} (${symbol}) and generate comprehensive chart specifications.

Report Summary:
- Business: ${reportData.businessDeconstruction?.productLines?.map((p: any) => `${p.product} (${p.revenueSplit})`).join(', ') || 'Unknown'}
- MOAT Dimensions: ${JSON.stringify(reportData.moatAnalysis?.structuralMoat || {})}
- Risks: ${JSON.stringify(reportData.riskLandscape?.riskHeatmap || {})}
- Peer Data: ${JSON.stringify(reportData.peerBenchmarking?.peers || [])}

Generate chart specifications for visualizing this data. Return ONLY valid JSON:

{
  "charts": {
    "revenueBreakdown": {
      "title": "Revenue Breakdown by Segment",
      "data": [
        {"label": "Core Products", "value": 60, "color": "#1565c0"},
        {"label": "Premium", "value": 25, "color": "#42a5f5"},
        {"label": "Services", "value": 10, "color": "#90caf9"},
        {"label": "Exports", "value": 5, "color": "#bbdefb"}
      ],
      "totalLabel": "Total Revenue"
    },

    "moatRadar": {
      "title": "Competitive MOAT Analysis",
      "axes": [
        {"label": "Network Effects", "value": 3, "maxValue": 10},
        {"label": "Brand Power", "value": 8, "maxValue": 10},
        {"label": "Cost Advantages", "value": 7, "maxValue": 10},
        {"label": "Switching Costs", "value": 6, "maxValue": 10},
        {"label": "IP/Regulatory", "value": 5, "maxValue": 10},
        {"label": "Scale Economics", "value": 8, "maxValue": 10}
      ],
      "fillColor": "rgba(21, 101, 192, 0.2)",
      "strokeColor": "#1565c0"
    },

    "riskHeatmap": {
      "title": "Risk Assessment Matrix",
      "rows": ["Business", "Financial", "Governance", "Regulatory", "Technology", "Competitive"],
      "columns": ["Probability", "Impact", "Overall"],
      "values": [
        [7, 8, 7.5],
        [5, 7, 6],
        [4, 6, 5],
        [6, 7, 6.5],
        [6, 8, 7],
        [8, 7, 7.5]
      ],
      "colorScale": {"min": "#4caf50", "mid": "#ff9800", "max": "#f44336"}
    },

    "financialTrends": {
      "title": "5-Year Financial Performance",
      "xAxis": {"label": "Fiscal Year", "values": ["FY19", "FY20", "FY21", "FY22", "FY23"]},
      "yAxis": {"label": "Amount (₹ Cr)"},
      "series": [
        {"name": "Revenue", "data": [5000, 5500, 6200, 7100, 8200], "color": "#1565c0"},
        {"name": "EBITDA", "data": [900, 1000, 1150, 1350, 1600], "color": "#42a5f5"},
        {"name": "Net Profit", "data": [600, 650, 750, 900, 1100], "color": "#90caf9"}
      ]
    },

    "peerComparison": {
      "title": "Peer Benchmarking",
      "categories": ["Company", "Peer A", "Peer B", "Peer C"],
      "series": [
        {"name": "Revenue Growth %", "data": [15, 12, 18, 10], "color": "#1565c0"},
        {"name": "EBITDA Margin %", "data": [18, 16, 20, 15], "color": "#42a5f5"},
        {"name": "ROIC %", "data": [22, 20, 24, 18], "color": "#90caf9"}
      ],
      "horizontal": false
    },

    "growthTrajectory": {
      "title": "Growth Trajectory (Base/Bull/Bear Cases)",
      "xAxis": {"label": "Year", "values": ["FY24", "FY25", "FY26", "FY27", "FY28"]},
      "yAxis": {"label": "Revenue (₹ Cr)"},
      "series": [
        {"name": "Bull Case", "data": [9000, 10500, 12500, 15000, 18000], "color": "#4caf50", "fillOpacity": 0.1},
        {"name": "Base Case", "data": [9000, 10000, 11200, 12600, 14200], "color": "#1565c0", "fillOpacity": 0.2},
        {"name": "Bear Case", "data": [9000, 9500, 10200, 10800, 11500], "color": "#f44336", "fillOpacity": 0.1}
      ]
    }
  }
}

IMPORTANT: Use ACTUAL data from the report where available. The above is just example structure.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response format');
  }

  let text = content.text.trim();
  if (text.startsWith('```json')) {
    text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
  } else if (text.startsWith('```')) {
    text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(text.trim());
  console.log('  ✅ Chart specifications generated');
  return parsed;
}

// ═══════════════════════════════════════════════════════════════
// STEP 2: RENDER CHARTS WITH QUICKCHART API
// ═══════════════════════════════════════════════════════════════

async function renderChartsWithQuickChart(charts: any): Promise<any> {
  console.log('  📊 Rendering charts with QuickChart API...');

  const baseUrl = 'https://quickchart.io/chart';

  // Revenue Breakdown Pie Chart
  const revenueChart = {
    type: 'pie',
    data: {
      labels: charts.revenueBreakdown.data.map((d: any) => d.label),
      datasets: [{
        data: charts.revenueBreakdown.data.map((d: any) => d.value),
        backgroundColor: charts.revenueBreakdown.data.map((d: any) => d.color),
      }]
    },
    options: {
      title: { display: true, text: charts.revenueBreakdown.title },
      plugins: { datalabels: { display: true, color: '#fff', font: { weight: 'bold' } } }
    }
  };

  // MOAT Radar Chart
  const moatChart = {
    type: 'radar',
    data: {
      labels: charts.moatRadar.axes.map((a: any) => a.label),
      datasets: [{
        label: 'MOAT Strength',
        data: charts.moatRadar.axes.map((a: any) => a.value),
        backgroundColor: charts.moatRadar.fillColor,
        borderColor: charts.moatRadar.strokeColor,
        borderWidth: 2,
      }]
    },
    options: {
      title: { display: true, text: charts.moatRadar.title },
      scale: { ticks: { min: 0, max: 10, stepSize: 2 } }
    }
  };

  // Financial Trends Line Chart
  const financialChart = {
    type: 'line',
    data: {
      labels: charts.financialTrends.xAxis.values,
      datasets: charts.financialTrends.series.map((s: any) => ({
        label: s.name,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color + '20',
        fill: false,
        tension: 0.4,
      }))
    },
    options: {
      title: { display: true, text: charts.financialTrends.title },
      scales: {
        y: { title: { display: true, text: charts.financialTrends.yAxis.label } }
      }
    }
  };

  // Peer Comparison Bar Chart
  const peerChart = {
    type: 'bar',
    data: {
      labels: charts.peerComparison.categories,
      datasets: charts.peerComparison.series.map((s: any) => ({
        label: s.name,
        data: s.data,
        backgroundColor: s.color,
      }))
    },
    options: {
      title: { display: true, text: charts.peerComparison.title },
      indexAxis: charts.peerComparison.horizontal ? 'y' : 'x',
    }
  };

  // Growth Trajectory Area Chart
  const growthChart = {
    type: 'line',
    data: {
      labels: charts.growthTrajectory.xAxis.values,
      datasets: charts.growthTrajectory.series.map((s: any) => ({
        label: s.name,
        data: s.data,
        borderColor: s.color,
        backgroundColor: s.color + Math.round(s.fillOpacity * 255).toString(16),
        fill: true,
        tension: 0.4,
      }))
    },
    options: {
      title: { display: true, text: charts.growthTrajectory.title },
    }
  };

  const renderedCharts = {
    revenueBreakdownUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify(revenueChart))}&width=800&height=400`,
    moatRadarUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify(moatChart))}&width=800&height=400`,
    riskHeatmapUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify({ type: 'matrix', data: charts.riskHeatmap }))}&width=800&height=400`,
    financialTrendsUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify(financialChart))}&width=800&height=400`,
    peerComparisonUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify(peerChart))}&width=800&height=400`,
    growthTrajectoryUrl: `${baseUrl}?c=${encodeURIComponent(JSON.stringify(growthChart))}&width=800&height=400`,
  };

  console.log('  ✅ Charts rendered successfully');
  return renderedCharts;
}

// ═══════════════════════════════════════════════════════════════
// STEP 3: GENERATE DIAGRAM SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════

async function generateDiagramSpecs(reportData: any, companyName: string): Promise<any> {
  console.log('  🔷 Generating diagram specifications...');

  const diagrams = {
    valueChainFlow: {
      title: 'Value Chain Flow',
      diagramType: 'flowchart' as const,
      mermaidCode: `flowchart LR
        A[Raw Materials] --> B[Manufacturing]
        B --> C[Distribution]
        C --> D[Retail/B2B]
        D --> E[End Customers]
        style A fill:#e3f2fd
        style B fill:#bbdefb
        style C fill:#90caf9
        style D fill:#64b5f6
        style E fill:#42a5f5`
    },
    competitivePosition: {
      title: 'Competitive Positioning Matrix',
      diagramType: 'flowchart' as const,
      mermaidCode: `flowchart TB
        subgraph Leaders
          A[${companyName}]
          B[Peer A]
        end
        subgraph Challengers
          C[Peer B]
          D[Peer C]
        end
        style A fill:#4caf50
        style B fill:#8bc34a
        style C fill:#ff9800
        style D fill:#ff9800`
    },
    catalystTimeline: {
      title: 'Growth Catalyst Timeline',
      events: [
        { date: 'Q2 FY25', label: 'Product Launch', description: 'New premium line', color: '#1565c0' },
        { date: 'Q4 FY25', label: 'Capacity Expansion', description: 'Manufacturing ramp-up', color: '#42a5f5' },
        { date: 'FY26', label: 'Market Expansion', description: 'Enter Tier-2 cities', color: '#90caf9' },
      ]
    },
    portersFiveForces: {
      title: "Porter's Five Forces",
      svgCode: `<svg viewBox="0 0 400 300">
        <circle cx="200" cy="150" r="40" fill="#1565c0"/>
        <text x="200" y="155" text-anchor="middle" fill="white">Company</text>
        <rect x="100" y="50" width="80" height="40" fill="#42a5f5"/>
        <text x="140" y="75" text-anchor="middle">Suppliers</text>
      </svg>`
    }
  };

  console.log('  ✅ Diagrams generated');
  return diagrams;
}

// ═══════════════════════════════════════════════════════════════
// STEP 4: GENERATE ILLUSTRATION PROMPTS (For DALL-E)
// ═══════════════════════════════════════════════════════════════

async function generateIllustrationPrompts(
  reportData: any,
  companyName: string,
  symbol: string
): Promise<any> {
  console.log('  🎨 Generating illustration prompts for DALL-E...');

  const illustrations = {
    industryVisual: {
      prompt: `Professional minimal illustration of ${reportData.marketStructure?.industryCycle || 'industry'} sector, corporate style, blue and white color scheme, clean lines`,
      style: 'professional' as const,
      purpose: 'Industry overview visual'
    },
    companyMetaphor: {
      prompt: `Abstract geometric illustration representing ${companyName}'s business model: ${reportData.executiveDashboard?.businessModelDiagram || 'integrated business'}, minimalist style, corporate colors`,
      style: 'minimalist' as const,
      purpose: 'Business model metaphor'
    },
    riskIcons: [
      {
        prompt: 'Simple icon representing business risk, flat design, blue outline',
        style: 'minimalist' as const,
        purpose: 'Risk category icon'
      },
      {
        prompt: 'Simple icon representing financial risk, flat design, orange outline',
        style: 'minimalist' as const,
        purpose: 'Risk category icon'
      }
    ]
  };

  console.log('  ✅ Illustration prompts generated (ready for DALL-E integration)');
  return illustrations;
}

export default {
  generateInfographics,
};
