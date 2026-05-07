/**
 * Mock AI Intelligence Data
 *
 * Simulated AI-generated insights for stock analysis
 */

export interface AIIntelligenceData {
  confidence: 'High' | 'Medium' | 'Low';
  updatedAt: string;
  businessOverview: string[];
  currentThesis: string;
  bullCase: {
    points: string[];
  };
  bearCase: {
    points: string[];
  };
  keyRisks: {
    risk: string;
    severity: 'HIGH' | 'MEDIUM';
    source: string;
  }[];
  tailwinds: {
    item: string;
    source: string;
  }[];
  dataFreshness: string;
  modelVersion: string;
}

export const mockAIIntelligence: Record<string, AIIntelligenceData> = {
  RELIANCE: {
    confidence: 'High',
    updatedAt: '2 hours ago',
    businessOverview: [
      'Reliance Industries Limited (RIL) is India\'s largest private sector conglomerate, with diversified operations spanning energy, petrochemicals, retail, telecommunications, and digital services. The company operates the world\'s largest refining complex in Jamnagar, Gujarat, with a combined capacity of 1.4 million barrels per day.',
      'Through Jio Platforms, Reliance has revolutionized India\'s digital landscape with over 450 million telecom subscribers and a rapidly growing digital services ecosystem. The retail division, Reliance Retail, is India\'s largest organized retailer with 18,000+ stores across multiple formats.',
      'The company\'s competitive moat lies in its vertical integration, scale advantages, and capital allocation prowess. Management has successfully pivoted from legacy energy towards consumer-facing businesses, with retail and digital now contributing 45% of EBITDA. The new energy initiatives position RIL at the forefront of India\'s clean energy transition.'
    ],
    currentThesis: 'The market is increasingly viewing Reliance as a digital and consumer conglomerate rather than an energy play. The upcoming demerger of the financial services vertical and potential listing of Jio and Retail are expected to unlock significant value. Near-term catalysts include 5G monetization, retail margin expansion, and commissioning of the new energy giga-factories.',
    bullCase: {
      points: [
        '5G ARPU uplift potential: Jio\'s 5G rollout is complete with 100M+ users. Management expects gradual tariff hikes to drive 15-20% ARPU growth over next 2 years, adding ₹15,000cr+ to annual EBITDA',
        'Retail margin trajectory: O2O integration and premium format expansion driving gross margins from 7.5% to 9%+ by FY26. Each 100bps improvement adds ₹6,000cr to EBITDA',
        'New energy vertical: Committed ₹75,000cr capex for solar panels, batteries, and hydrogen. TAM of $10B+ annually in India alone, with potential to replicate Jio\'s disruption playbook',
        'Demerger value unlock: Sum-of-parts valuation suggests 25-30% upside. Jio could command 15x EV/EBITDA vs current blended 12x, Retail 35-40x PE vs 25x',
        'Petrochemicals upcycle: New PP/PE capacities coming online in H2 FY26. Asian spreads improving with China demand recovery + supply discipline'
      ]
    },
    bearCase: {
      points: [
        'Tariff hike execution risk: Attempts to raise mobile tariffs have historically been met with subscriber churn. If competitive intensity remains high, ARPU expansion may disappoint',
        'Retail profitability pressure: Aggressive expansion (1500+ stores/year) and competition from quick commerce players could keep margins compressed below guidance',
        'New energy delays and costs: Green hydrogen and solar panel manufacturing are capital-intensive with uncertain demand visibility. Cost overruns or delayed ramp-up could weigh on returns',
        'Debt and capex burden: Net debt of ₹1.4L cr despite recent deleveraging. Ongoing capex of ₹50,000cr+ annually limits flexibility for dividends or buybacks',
        'Conglomerate discount: Complex structure and cross-holdings may perpetuate a 15-20% holding company discount to sum-of-parts valuation'
      ]
    },
    keyRisks: [
      {
        risk: 'Regulatory intervention in telecom tariffs',
        severity: 'MEDIUM',
        source: 'TRAI consultation paper Dec 2025'
      },
      {
        risk: 'Execution risk on ₹75,000cr new energy capex',
        severity: 'HIGH',
        source: 'Management commentary, Q3 FY25'
      },
      {
        risk: 'Dependence on O2O success for retail margin expansion',
        severity: 'MEDIUM',
        source: 'Industry analysis'
      },
      {
        risk: 'Crude price volatility impacting refining margins',
        severity: 'MEDIUM',
        source: 'GRM historical volatility'
      }
    ],
    tailwinds: [
      {
        item: 'India 5G adoption at only 20% of subscriber base - significant runway for premium plans',
        source: 'GSMA India Mobile Economy 2026'
      },
      {
        item: 'Government PLI schemes for electronics and clean energy manufacturing - ₹12,000cr incentives available',
        source: 'MeitY PLI Policy'
      },
      {
        item: 'Premiumization trend in Indian retail - premium products growing at 2x overall retail',
        source: 'Redseer Retail Report 2026'
      },
      {
        item: 'National Green Hydrogen Mission targets 5 MMT production by 2030',
        source: 'Ministry of New & Renewable Energy'
      }
    ],
    dataFreshness: 'Based on Q3 FY25 results + news through Feb 7, 2026',
    modelVersion: 'AlphaSignal-v2.1'
  },

  TCS: {
    confidence: 'High',
    updatedAt: '3 hours ago',
    businessOverview: [
      'Tata Consultancy Services (TCS) is India\'s largest IT services company and a global leader in digital transformation, consulting, and technology services. With $29B in annual revenue and 615,000+ employees, TCS serves clients across 55 countries in Banking, Retail, Manufacturing, Healthcare, and Telecom verticals.',
      'The company\'s competitive advantage stems from its scale, industry expertise, and strong client relationships. TCS maintains a 99%+ customer retention rate and has deep partnerships with Fortune 500 companies. The proprietary platforms (BaNCS, TCS BPS, ignio) and IP-led solutions contribute 15% of revenue with superior margins.',
      'TCS has successfully navigated multiple technology cycles - from Y2K to cloud to AI/GenAI. The recent focus on AI.Cloud unit and cognitive business operations positions the company well for the next wave of enterprise transformation.'
    ],
    currentThesis: 'The market is cautiously optimistic on TCS as clients resume discretionary spending after 18 months of budget cuts. Deal wins remain strong ($11.2B TCV in Q3) but conversion to revenue is taking longer. The key debate is around margin sustainability - can TCS deliver 26-27% EBIT while investing in AI and absorbing wage hikes?',
    bullCase: {
      points: [
        'Demand recovery underway: Client conversations show 65% planning to increase IT budgets in 2026 vs 40% in 2025. Discretionary deal pipeline up 30% QoQ',
        'GenAI monetization: $1.5B+ GenAI deal wins so far. As pilots convert to production deployments, could add 200-300bps to revenue growth in FY27',
        'Market share gains: Mid-tier IT vendors struggling with talent and delivery issues. TCS winning deals from competition in BFSI and Retail verticals',
        'Margin levers: Automation (ignio, AI.Cloud) and offshore mix improvement can offset wage inflation. Target 27%+ EBIT margins achievable',
        'Capital allocation: ₹42,000cr+ cash with dividend yield of 3.5%. Scope for special dividends or strategic acquisitions to enhance growth'
      ]
    },
    bearCase: {
      points: [
        'Prolonged spending caution: If macro uncertainty persists, clients may delay large transformation programs. Growth could remain in 5-7% range vs historical 10%+',
        'GenAI cannibalization: AI-led efficiency could reduce demand for traditional services. 20-30% productivity gains may translate to headcount reductions',
        'Margin pressure: Wage inflation of 6-8%, higher visa costs, and AI investments could compress margins to 24-25% range',
        'Attrition and talent wars: Tech talent shortage driving compensation inflation. Attrition stabilizing at 12% but still above pre-pandemic 10%',
        'Currency headwinds: 75% revenue in USD/EUR. Rupee appreciation could impact realizations and margins by 50-100bps'
      ]
    },
    keyRisks: [
      {
        risk: 'Client spending delays due to macro uncertainty',
        severity: 'MEDIUM',
        source: 'Q3 FY25 earnings call'
      },
      {
        risk: 'GenAI-driven productivity leading to pricing pressure',
        severity: 'HIGH',
        source: 'Industry analyst estimates'
      },
      {
        risk: 'Visa restrictions impacting offshore delivery model',
        severity: 'MEDIUM',
        source: 'US immigration policy changes'
      }
    ],
    tailwinds: [
      {
        item: 'Global IT services market expected to grow 8-10% CAGR through 2028',
        source: 'Gartner IT Spending Forecast'
      },
      {
        item: 'Enterprise AI adoption accelerating - 75% of enterprises deploying AI by 2026',
        source: 'IDC AI Spending Guide'
      },
      {
        item: 'Cloud migration still in early innings - only 30% of workloads in public cloud',
        source: 'McKinsey Cloud Survey'
      }
    ],
    dataFreshness: 'Based on Q3 FY25 results + news through Feb 7, 2026',
    modelVersion: 'AlphaSignal-v2.1'
  },

  INFY: {
    confidence: 'Medium',
    updatedAt: '4 hours ago',
    businessOverview: [
      'Infosys is India\'s second-largest IT services company with $18.6B in revenue, serving global enterprises across Financial Services, Retail, Energy, Manufacturing, and Telecom sectors. The company employs 340,000+ professionals and operates in 56 countries.',
      'Infosys differentiates through its digital-first approach and platforms like Infosys Cobalt (cloud), Infosys Finacle (banking), and EdgeVerve (automation). The company has been early in embracing AI with the Topaz suite of AI-first services and solutions.',
      'Under CEO Salil Parekh\'s leadership since 2018, Infosys has focused on large deal wins, client mining, and margin improvement. The strategy has delivered consistent market share gains, though growth has moderated recently in line with industry trends.'
    ],
    currentThesis: 'Infosys is navigating a challenging demand environment with better visibility than peers due to its strong large deal pipeline ($3.2B TCV in Q3). The market is watching for signs of spending recovery in BFSI vertical and margin trajectory as wage hikes kick in. FY26 guidance of 1-3% CC growth is conservative and could see upward revision.',
    bullCase: {
      points: [
        'Large deal engine: $10B+ TCV wins in first 9 months of FY25. 80% of deals have digital component with better margins',
        'Digital revenue mix: Digital now 65% of revenue vs 50% three years ago. Growing at 8-10% vs flat traditional services',
        'Cost optimization focus: Pyramid rationalization and automation driving 100-150bps margin expansion potential',
        'Client additions: Net new client additions accelerating, particularly in Europe and Energy verticals',
        'Cobalt momentum: Cloud transformation deals gaining traction. $4B+ cloud revenue run-rate with 20%+ growth'
      ]
    },
    bearCase: {
      points: [
        'BFSI weakness: Largest vertical (28% of revenue) seeing budget pressure. Regional banking stress in US/Europe impacting deals',
        'Revenue conversion lag: While TCV is strong, revenue conversion taking 6-9 months longer than historical average',
        'Subcontracting pressure: Higher dependence on third-party resources (20% of delivery) creating margin headwinds',
        'Attrition normalization: Attrition declining to 12% creating bench costs and utilization challenges in near term',
        'Conservative guidance: FY26 growth guidance of 1-3% implies cautious management outlook on demand recovery timeline'
      ]
    },
    keyRisks: [
      {
        risk: 'BFSI sector spending weakness extending into FY26',
        severity: 'HIGH',
        source: 'Vertical performance Q3 FY25'
      },
      {
        risk: 'Margin compression from wage hikes and subcon costs',
        severity: 'MEDIUM',
        source: 'Management guidance'
      },
      {
        risk: 'Elongated deal closure cycles',
        severity: 'MEDIUM',
        source: 'Industry feedback'
      }
    ],
    tailwinds: [
      {
        item: 'European clients accelerating digital initiatives post-pandemic delays',
        source: 'Regional growth trends Q3'
      },
      {
        item: 'Generative AI creating net new demand for enterprise transformation',
        source: 'Topaz client wins'
      },
      {
        item: 'Manufacturing sector IT spend growing 12%+ driven by Industry 4.0',
        source: 'IDC Manufacturing Insights'
      }
    ],
    dataFreshness: 'Based on Q3 FY25 results + news through Feb 7, 2026',
    modelVersion: 'AlphaSignal-v2.1'
  },

  HDFCBANK: {
    confidence: 'High',
    updatedAt: '1 hour ago',
    businessOverview: [
      'HDFC Bank is India\'s largest private sector bank by assets (₹23.8 lakh crore) and market capitalization. Post-merger with HDFC Ltd in July 2023, the combined entity has unparalleled franchise strength with 8,300+ branches, 21,000+ ATMs, and 120 million customers.',
      'The bank\'s competitive moat lies in its best-in-class underwriting, superior asset quality (gross NPA <1%), and operational efficiency. The retail-focused business model (60% of loan book) with strong cross-sell capabilities drives industry-leading ROE of 17%+.',
      'The HDFC merger has created India\'s most comprehensive financial institution, adding a ₹7 lakh crore mortgage book and access to affordable housing and developer lending segments. Management is navigating post-merger integration while managing regulatory requirements on capital and liquidity.'
    ],
    currentThesis: 'The market is pricing in successful merger integration and return to 18%+ ROE by FY27. Near-term focus is on improving deposit mix (CASA ratio at 36% vs pre-merger 42%), managing LCR requirements, and navigating elevated credit costs from unsecured lending. Credit growth of 50%+ post-merger is normalizing to sector levels of 12-14%.',
    bullCase: {
      points: [
        'Deposit franchise strengthening: CASA ratio improving 150bps QoQ to 36.4%. Branch network expansion adding 1500+ branches over next 2 years to deepen deposit mobilization',
        'NIM expansion ahead: As deposit mix improves and high-cost wholesale funding rolls off, NIMs could expand 30-40bps from current 3.4%',
        'Merger synergies: ₹10,000cr+ cost synergies through tech integration, branch optimization, and cross-sell. Revenue synergies from product suite expansion',
        'Market share gains: Gaining in retail assets, credit cards, and corporate banking. Co-branded cards and digital platforms driving customer acquisition',
        'Credit cost normalization: Unsecured portfolio seasoning complete by Q2 FY26. Credit costs declining to 0.4-0.5% from current elevated levels'
      ]
    },
    bearCase: {
      points: [
        'Deposit competition intense: Industry-wide deposit shortage driving up costs. CASA improvement may be slower than expected',
        'Unsecured lending stress: Credit card and personal loan NPAs ticking up. Write-offs could remain elevated for 2-3 quarters',
        'LCR constraints: Regulatory requirement to maintain 100%+ LCR limiting loan growth potential. May need to sacrifice growth for liquidity',
        'Fee income pressure: MDR cuts on UPI and digital payments impacting fee growth. Could offset loan growth benefits',
        'Integration risks: Post-merger cultural integration and system consolidation carrying execution risks'
      ]
    },
    keyRisks: [
      {
        risk: 'Elevated credit costs in unsecured retail portfolio',
        severity: 'HIGH',
        source: 'Q3 FY25 asset quality trends'
      },
      {
        risk: 'LCR regulatory requirements constraining growth',
        severity: 'MEDIUM',
        source: 'RBI liquidity guidelines'
      },
      {
        risk: 'Deposit mobilization falling short of loan growth targets',
        severity: 'MEDIUM',
        source: 'CD ratio at 107%'
      },
      {
        risk: 'Housing market slowdown impacting mortgage growth',
        severity: 'MEDIUM',
        source: 'Property market indicators'
      }
    ],
    tailwinds: [
      {
        item: 'India retail credit penetration at 15% vs 50%+ in developed markets - massive runway',
        source: 'World Bank Financial Inclusion Data'
      },
      {
        item: 'Housing demand supported by demographics - 10M+ household formations annually',
        source: 'Census data projections'
      },
      {
        item: 'Digital payments infrastructure (UPI, ONDC) driving low-cost customer acquisition',
        source: 'NPCI transaction data'
      },
      {
        item: 'Corporate capex cycle recovery benefiting wholesale banking segment',
        source: 'RBI credit policy outlook'
      }
    ],
    dataFreshness: 'Based on Q3 FY25 results + news through Feb 7, 2026',
    modelVersion: 'AlphaSignal-v2.1'
  },

  TATASTEEL: {
    confidence: 'Low',
    updatedAt: '5 hours ago',
    businessOverview: [
      'Tata Steel is India\'s largest integrated steel producer with 34 million tonnes of annual crude steel capacity across India, Europe, and Southeast Asia. The company operates across the steel value chain from iron ore mining to downstream products, serving automotive, construction, and engineering sectors.',
      'The India operations contribute 70% of EBITDA with low-cost iron ore mines in Odisha and efficient blast furnace facilities. The European operations (Tata Steel UK and Netherlands) face structural challenges with aging assets, high energy costs, and carbon transition requirements.',
      'The company is undergoing strategic transformation - expanding India capacity to 40 MTPA by FY30, investing in green steel technology, and restructuring European assets. Recent focus on specialty steel and automotive segments to improve realization and margins.'
    ],
    currentThesis: 'The market is concerned about prolonged weakness in steel prices, rising coking coal costs, and challenges in European operations. Near-term earnings under pressure with EBITDA/tonne declining to $75-80 range. Management\'s ability to execute India expansion while managing Europe restructuring is key to sentiment recovery.',
    bullCase: {
      points: [
        'China stimulus: Recent policy measures could drive steel demand recovery and stabilize prices at $650-700/tonne levels',
        'India demand resilience: Infrastructure spending and automotive growth keeping domestic demand healthy at 8-10% growth',
        'Captive iron ore advantage: Own mines providing $80-100/tonne cost advantage vs peers dependent on imports',
        'Specialty steel expansion: Automotive and value-added products growing from 40% to 50%+ of mix, improving realizations by ₹2000-3000/tonne',
        'UK restructuring progress: Port Talbot transition to EAF reduces losses and carbon footprint. Government support of £500M secured'
      ]
    },
    bearCase: {
      points: [
        'Steel price weakness: Oversupply situation with China exporting record volumes. Prices could test $550-600/tonne levels',
        'Coking coal cost inflation: Australian coal prices elevated at $280-300/tonne vs long-term average of $180. Squeezing margins',
        'Europe cash burn: UK and Netherlands operations loss-making. Could consume ₹5000-8000cr annually until restructuring complete',
        'Debt burden: Net debt of ₹80,000cr with D/E of 1.2x. Limited headroom for growth capex or dividends',
        'Green transition costs: Decarbonization requiring $12B+ capex over next decade with uncertain returns'
      ]
    },
    keyRisks: [
      {
        risk: 'Prolonged steel price weakness below $600/tonne',
        severity: 'HIGH',
        source: 'Global steel market outlook'
      },
      {
        risk: 'Europe restructuring delays or cost overruns',
        severity: 'HIGH',
        source: 'UK government negotiations'
      },
      {
        risk: 'Elevated coking coal prices impacting spreads',
        severity: 'MEDIUM',
        source: 'Commodity price trends'
      },
      {
        risk: 'China steel exports remaining elevated',
        severity: 'HIGH',
        source: 'Chinese production data'
      }
    ],
    tailwinds: [
      {
        item: 'India National Infrastructure Pipeline of ₹111 lakh crore supporting steel demand',
        source: 'NITI Aayog NIP'
      },
      {
        item: 'Government PLI for specialty steel providing ₹6,322cr incentives',
        source: 'Ministry of Steel PLI scheme'
      },
      {
        item: 'Automotive production expected to reach 50M vehicles by 2030',
        source: 'SIAM projections'
      }
    ],
    dataFreshness: 'Based on Q3 FY25 results + news through Feb 7, 2026',
    modelVersion: 'AlphaSignal-v2.1'
  }
};

export const getAIIntelligence = (symbol: string): AIIntelligenceData => {
  return mockAIIntelligence[symbol] || mockAIIntelligence['RELIANCE'];
};
