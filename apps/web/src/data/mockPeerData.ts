/**
 * Mock Peer Comparison Data
 *
 * Contains peer company data grouped by sector for comparison tables
 */

export interface PeerCompany {
  symbol: string;
  name: string;
  cmp: number;
  marketCap: number; // in crores
  qualityScore: number;
  growthScore: number;
  riskScore: number;
  roe: number;
  peRatio: number;
  return1Y: number;
  radarScores: {
    quality: number;
    growth: number;
    riskInverse: number; // Higher is better (100 - riskScore)
    sentiment: number;
    momentum: number;
  };
}

export interface PeerComparisonData {
  sector: string;
  companies: PeerCompany[];
  sectorMedian: {
    quality: number;
    growth: number;
    riskInverse: number;
    sentiment: number;
    momentum: number;
  };
}

const sectorData: Record<string, PeerComparisonData> = {
  // IT Services
  'TCS': {
    sector: 'IT Services',
    companies: [
      {
        symbol: 'TCS',
        name: 'Persistent Systems',
        cmp: 5245.30,
        marketCap: 41230,
        qualityScore: 78,
        growthScore: 82,
        riskScore: 35,
        roe: 21.4,
        peRatio: 45.2,
        return1Y: 42.5,
        radarScores: { quality: 78, growth: 82, riskInverse: 65, sentiment: 72, momentum: 75 },
      },
      {
        symbol: 'LTIM',
        name: 'LTIMindtree Limited',
        cmp: 4850.65,
        marketCap: 51200,
        qualityScore: 75,
        growthScore: 68,
        riskScore: 32,
        roe: 19.8,
        peRatio: 38.5,
        return1Y: 28.3,
        radarScores: { quality: 75, growth: 68, riskInverse: 68, sentiment: 65, momentum: 62 },
      },
      {
        symbol: 'INFY',
        name: 'Coforge Ltd',
        cmp: 6320.40,
        marketCap: 42150,
        qualityScore: 72,
        growthScore: 76,
        riskScore: 38,
        roe: 18.5,
        peRatio: 42.8,
        return1Y: 35.7,
        radarScores: { quality: 72, growth: 76, riskInverse: 62, sentiment: 70, momentum: 68 },
      },
      {
        symbol: 'TECHM',
        name: 'Tech Mahindra Limited',
        cmp: 2580.20,
        marketCap: 48900,
        qualityScore: 70,
        growthScore: 65,
        riskScore: 40,
        roe: 17.2,
        peRatio: 35.6,
        return1Y: 18.9,
        radarScores: { quality: 70, growth: 65, riskInverse: 60, sentiment: 62, momentum: 58 },
      },
      {
        symbol: 'CYIENT',
        name: 'Cyient Ltd',
        cmp: 1845.75,
        marketCap: 20400,
        qualityScore: 68,
        growthScore: 62,
        riskScore: 42,
        roe: 15.8,
        peRatio: 32.4,
        return1Y: 22.1,
        radarScores: { quality: 68, growth: 62, riskInverse: 58, sentiment: 60, momentum: 55 },
      },
      {
        symbol: 'ZENSAR',
        name: 'Zensar Technologies',
        cmp: 685.30,
        marketCap: 11200,
        qualityScore: 64,
        growthScore: 58,
        riskScore: 45,
        roe: 14.2,
        peRatio: 28.9,
        return1Y: 15.4,
        radarScores: { quality: 64, growth: 58, riskInverse: 55, sentiment: 56, momentum: 52 },
      },
    ],
    sectorMedian: { quality: 71, growth: 68.5, riskInverse: 61.5, sentiment: 64, momentum: 61.5 },
  },

  // Pharmaceuticals
  'DIVISLAB': {
    sector: 'Pharmaceuticals',
    companies: [
      {
        symbol: 'DIVISLAB',
        name: 'Laurus Labs',
        cmp: 485.60,
        marketCap: 12850,
        qualityScore: 72,
        growthScore: 68,
        riskScore: 48,
        roe: 16.5,
        peRatio: 22.4,
        return1Y: 32.8,
        radarScores: { quality: 72, growth: 68, riskInverse: 52, sentiment: 68, momentum: 70 },
      },
      {
        symbol: 'APLLTD',
        name: 'Alembic Pharma',
        cmp: 1025.40,
        marketCap: 20450,
        qualityScore: 70,
        growthScore: 65,
        riskScore: 45,
        roe: 18.2,
        peRatio: 24.6,
        return1Y: 28.5,
        radarScores: { quality: 70, growth: 65, riskInverse: 55, sentiment: 65, momentum: 66 },
      },
      {
        symbol: 'GRANULES',
        name: 'Granules India',
        cmp: 545.20,
        marketCap: 13200,
        qualityScore: 68,
        growthScore: 72,
        riskScore: 50,
        roe: 15.8,
        peRatio: 20.8,
        return1Y: 45.2,
        radarScores: { quality: 68, growth: 72, riskInverse: 50, sentiment: 70, momentum: 74 },
      },
      {
        symbol: 'SUVEN',
        name: 'Suven Pharmaceuticals',
        cmp: 1180.50,
        marketCap: 15100,
        qualityScore: 74,
        growthScore: 70,
        riskScore: 42,
        roe: 19.5,
        peRatio: 26.2,
        return1Y: 38.6,
        radarScores: { quality: 74, growth: 70, riskInverse: 58, sentiment: 72, momentum: 68 },
      },
      {
        symbol: 'LALPATHLAB',
        name: 'Dr. Lal PathLabs',
        cmp: 2650.30,
        marketCap: 22050,
        qualityScore: 76,
        growthScore: 62,
        riskScore: 38,
        roe: 20.4,
        peRatio: 32.5,
        return1Y: 24.3,
        radarScores: { quality: 76, growth: 62, riskInverse: 62, sentiment: 60, momentum: 58 },
      },
      {
        symbol: 'METROPOLIS',
        name: 'Metropolis Healthcare',
        cmp: 1925.80,
        marketCap: 19800,
        qualityScore: 73,
        growthScore: 58,
        riskScore: 40,
        roe: 18.9,
        peRatio: 35.8,
        return1Y: 18.7,
        radarScores: { quality: 73, growth: 58, riskInverse: 60, sentiment: 58, momentum: 54 },
      },
    ],
    sectorMedian: { quality: 72, growth: 65.8, riskInverse: 56.2, sentiment: 65.5, momentum: 65 },
  },

  // Auto Components
  'MOTHERSON': {
    sector: 'Auto Components',
    companies: [
      {
        symbol: 'MOTHERSON',
        name: 'Samvardhana Motherson',
        cmp: 178.45,
        marketCap: 118500,
        qualityScore: 68,
        growthScore: 72,
        riskScore: 52,
        roe: 14.2,
        peRatio: 28.4,
        return1Y: 35.8,
        radarScores: { quality: 68, growth: 72, riskInverse: 48, sentiment: 70, momentum: 73 },
      },
      {
        symbol: 'ENDURANCE',
        name: 'Endurance Technologies',
        cmp: 2180.60,
        marketCap: 29800,
        qualityScore: 72,
        growthScore: 68,
        riskScore: 48,
        roe: 16.8,
        peRatio: 32.6,
        return1Y: 28.4,
        radarScores: { quality: 72, growth: 68, riskInverse: 52, sentiment: 66, momentum: 65 },
      },
      {
        symbol: 'SCHAEFFLER',
        name: 'Schaeffler India',
        cmp: 3850.20,
        marketCap: 27400,
        qualityScore: 75,
        growthScore: 65,
        riskScore: 45,
        roe: 18.5,
        peRatio: 38.2,
        return1Y: 42.1,
        radarScores: { quality: 75, growth: 65, riskInverse: 55, sentiment: 68, momentum: 70 },
      },
      {
        symbol: 'SONA',
        name: 'Sona BLW Precision',
        cmp: 625.40,
        marketCap: 38200,
        qualityScore: 70,
        growthScore: 78,
        riskScore: 50,
        roe: 17.4,
        peRatio: 45.8,
        return1Y: 52.3,
        radarScores: { quality: 70, growth: 78, riskInverse: 50, sentiment: 75, momentum: 78 },
      },
      {
        symbol: 'RKFORGE',
        name: 'Ramkrishna Forgings',
        cmp: 845.70,
        marketCap: 12850,
        qualityScore: 65,
        growthScore: 70,
        riskScore: 55,
        roe: 13.8,
        peRatio: 24.5,
        return1Y: 38.9,
        radarScores: { quality: 65, growth: 70, riskInverse: 45, sentiment: 68, momentum: 72 },
      },
      {
        symbol: 'SUPRAJIT',
        name: 'Suprajit Engineering',
        cmp: 445.30,
        marketCap: 6200,
        qualityScore: 62,
        growthScore: 64,
        riskScore: 58,
        roe: 12.5,
        peRatio: 22.8,
        return1Y: 25.6,
        radarScores: { quality: 62, growth: 64, riskInverse: 42, sentiment: 62, momentum: 60 },
      },
    ],
    sectorMedian: { quality: 68.5, growth: 69.5, riskInverse: 48.7, sentiment: 68.2, momentum: 69.7 },
  },

  // Speciality Chemicals
  'HDFCBANK': {
    sector: 'Speciality Chemicals',
    companies: [
      {
        symbol: 'HDFCBANK',
        name: 'Clean Science and Technology',
        cmp: 1685.40,
        marketCap: 21200,
        qualityScore: 82,
        growthScore: 78,
        riskScore: 35,
        roe: 24.5,
        peRatio: 52.4,
        return1Y: 48.2,
        radarScores: { quality: 82, growth: 78, riskInverse: 65, sentiment: 75, momentum: 80 },
      },
      {
        symbol: 'UPL',
        name: 'UPL Limited',
        cmp: 625.80,
        marketCap: 22400,
        qualityScore: 70,
        growthScore: 68,
        riskScore: 48,
        roe: 16.8,
        peRatio: 28.6,
        return1Y: 32.5,
        radarScores: { quality: 70, growth: 68, riskInverse: 52, sentiment: 66, momentum: 68 },
      },
      {
        symbol: 'SRF',
        name: 'SRF Ltd',
        cmp: 2380.60,
        marketCap: 71500,
        qualityScore: 78,
        growthScore: 72,
        riskScore: 38,
        roe: 20.4,
        peRatio: 42.8,
        return1Y: 38.7,
        radarScores: { quality: 78, growth: 72, riskInverse: 62, sentiment: 72, momentum: 74 },
      },
      {
        symbol: 'BALRAMCHIN',
        name: 'Balrampur Chini Mills',
        cmp: 485.20,
        marketCap: 9700,
        qualityScore: 62,
        growthScore: 58,
        riskScore: 58,
        roe: 12.5,
        peRatio: 18.4,
        return1Y: 22.8,
        radarScores: { quality: 62, growth: 58, riskInverse: 42, sentiment: 55, momentum: 58 },
      },
      {
        symbol: 'NOCIL',
        name: 'NOCIL Ltd',
        cmp: 285.40,
        marketCap: 4850,
        qualityScore: 65,
        growthScore: 62,
        riskScore: 52,
        roe: 14.2,
        peRatio: 22.5,
        return1Y: 18.6,
        radarScores: { quality: 65, growth: 62, riskInverse: 48, sentiment: 58, momentum: 55 },
      },
      {
        symbol: 'VINATI',
        name: 'Vinati Organics',
        cmp: 2145.70,
        marketCap: 20600,
        qualityScore: 75,
        growthScore: 70,
        riskScore: 42,
        roe: 19.2,
        peRatio: 38.5,
        return1Y: 28.4,
        radarScores: { quality: 75, growth: 70, riskInverse: 58, sentiment: 68, momentum: 66 },
      },
      {
        symbol: 'TATASTEEL',
        name: 'Tata Steel Limited',
        cmp: 3280.50,
        marketCap: 43800,
        qualityScore: 80,
        growthScore: 75,
        riskScore: 40,
        roe: 22.8,
        peRatio: 48.2,
        return1Y: 42.3,
        radarScores: { quality: 80, growth: 75, riskInverse: 60, sentiment: 73, momentum: 72 },
      },
    ],
    sectorMedian: { quality: 73.1, growth: 69.0, riskInverse: 55.3, sentiment: 66.7, momentum: 67.6 },
  },
};

export const getPeerComparisonData = (symbol: string): PeerComparisonData => {
  return (
    sectorData[symbol] || {
      sector: 'IT Services',
      companies: sectorData['TCS'].companies,
      sectorMedian: sectorData['TCS'].sectorMedian,
    }
  );
};
