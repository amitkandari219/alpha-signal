/**
 * Data Validator Service
 *
 * CRITICAL: Validates ALL data before it goes into reports.
 * Wrong data in beautiful infographics is worse than no data at all.
 *
 * Validation Types:
 * - Range checks: Values within expected bounds
 * - Cross-checks: Mathematical consistency (e.g., margin = profit/revenue)
 * - Outlier detection: Flag abnormal values
 * - Temporal consistency: Values make sense over time
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string;
  confidence: number; // 0-1 score
}

export interface ValidationRule {
  field: string;
  rules: Array<{
    type: 'range' | 'trend' | 'crossCheck' | 'outlier' | 'required';
    check: (value: any, context: any) => boolean;
    errorMessage: string;
    severity: 'error' | 'warning';
  }>;
}

// ═══════════════════════════════════════════════════════════════
// FINANCIAL METRICS VALIDATION RULES
// ═══════════════════════════════════════════════════════════════

export const financialValidationRules: ValidationRule[] = [
  // Profit Margin Validation
  {
    field: 'netMargin',
    rules: [
      {
        type: 'range',
        check: (value) => value >= -100 && value <= 100,
        errorMessage: 'Net profit margin must be between -100% and 100%',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (margin, context) => {
          if (!context.netProfit || !context.revenue || context.revenue === 0) {
            return true; // Skip if data missing
          }
          const calculated = (Number(context.netProfit) / Number(context.revenue)) * 100;
          const diff = Math.abs(calculated - Number(margin));
          return diff < 0.5; // Within 0.5%
        },
        errorMessage: 'Net margin doesn\'t match netProfit/revenue calculation',
        severity: 'error',
      },
      {
        type: 'range',
        check: (value) => value >= -50 && value <= 50,
        errorMessage: 'Net margin outside typical range (-50% to 50%) - please verify',
        severity: 'warning',
      },
    ],
  },

  // Operating Margin Validation
  {
    field: 'operatingMargin',
    rules: [
      {
        type: 'range',
        check: (value) => value >= -100 && value <= 100,
        errorMessage: 'Operating margin must be between -100% and 100%',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (opMargin, context) => {
          const netMargin = Number(context.netMargin);
          // Operating margin should generally be >= net margin
          // (unless there are exceptional gains/losses)
          if (opMargin < netMargin - 10) {
            return false;
          }
          return true;
        },
        errorMessage: 'Operating margin suspiciously lower than net margin',
        severity: 'warning',
      },
    ],
  },

  // Debt-to-Equity Ratio Validation
  {
    field: 'debtEquityRatio',
    rules: [
      {
        type: 'range',
        check: (value) => value >= 0 && value <= 20,
        errorMessage: 'D/E ratio suspiciously high (>20) - verify data source',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (ratio, context) => {
          if (!context.totalDebt || !context.totalEquity) {
            return true; // Skip if data missing
          }
          if (Number(context.totalEquity) === 0) {
            return true; // Can't validate if equity is 0
          }
          const calculated = Number(context.totalDebt) / Number(context.totalEquity);
          const diff = Math.abs(calculated - Number(ratio));
          return diff < 0.05; // Within 0.05
        },
        errorMessage: 'D/E ratio doesn\'t match totalDebt/totalEquity calculation',
        severity: 'error',
      },
    ],
  },

  // Revenue Growth Validation
  {
    field: 'revenueGrowth',
    rules: [
      {
        type: 'range',
        check: (value) => value >= -100 && value <= 1000,
        errorMessage: 'Revenue growth outside possible range (-100% to 1000%)',
        severity: 'error',
      },
      {
        type: 'outlier',
        check: (growth, context) => {
          if (!context.historicalGrowth || context.historicalGrowth.length < 2) {
            return true; // Skip if no historical data
          }
          // Flag if growth changes by >200% from historical average
          const validGrowth = context.historicalGrowth.filter((g: number) => g !== null && !isNaN(g));
          if (validGrowth.length === 0) return true;

          const avgGrowth = validGrowth.reduce((a: number, b: number) => a + b, 0) / validGrowth.length;
          const deviation = Math.abs(Number(growth) - avgGrowth);

          return deviation < 200;
        },
        errorMessage: 'Revenue growth looks abnormal compared to historical average - please verify',
        severity: 'warning',
      },
    ],
  },

  // Profit Growth Validation
  {
    field: 'profitGrowth',
    rules: [
      {
        type: 'range',
        check: (value) => value >= -100 && value <= 2000,
        errorMessage: 'Profit growth outside possible range',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (profitGrowth, context) => {
          if (!context.currentProfit || !context.previousProfit || context.previousProfit === 0) {
            return true;
          }
          const calculated = ((Number(context.currentProfit) - Number(context.previousProfit)) /
                             Math.abs(Number(context.previousProfit))) * 100;
          const diff = Math.abs(calculated - Number(profitGrowth));
          return diff < 1; // Within 1%
        },
        errorMessage: 'Profit growth doesn\'t match year-over-year profit data',
        severity: 'error',
      },
    ],
  },

  // Current Ratio Validation
  {
    field: 'currentRatio',
    rules: [
      {
        type: 'range',
        check: (value) => value >= 0 && value <= 20,
        errorMessage: 'Current ratio outside reasonable range (0-20)',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (ratio, context) => {
          if (!context.currentAssets || !context.currentLiabilities ||
              Number(context.currentLiabilities) === 0) {
            return true;
          }
          const calculated = Number(context.currentAssets) / Number(context.currentLiabilities);
          const diff = Math.abs(calculated - Number(ratio));
          return diff < 0.1;
        },
        errorMessage: 'Current ratio doesn\'t match currentAssets/currentLiabilities',
        severity: 'error',
      },
    ],
  },

  // ROE (Return on Equity) Validation
  {
    field: 'roe',
    rules: [
      {
        type: 'range',
        check: (value) => value >= -200 && value <= 200,
        errorMessage: 'ROE outside reasonable range (-200% to 200%)',
        severity: 'error',
      },
      {
        type: 'crossCheck',
        check: (roe, context) => {
          if (!context.netProfit || !context.shareholderEquity ||
              Number(context.shareholderEquity) === 0) {
            return true;
          }
          const calculated = (Number(context.netProfit) / Number(context.shareholderEquity)) * 100;
          const diff = Math.abs(calculated - Number(roe));
          return diff < 1;
        },
        errorMessage: 'ROE doesn\'t match netProfit/shareholderEquity calculation',
        severity: 'error',
      },
    ],
  },

  // Asset Turnover Validation
  {
    field: 'assetTurnover',
    rules: [
      {
        type: 'range',
        check: (value) => value >= 0 && value <= 10,
        errorMessage: 'Asset turnover outside typical range (0-10x)',
        severity: 'warning',
      },
      {
        type: 'crossCheck',
        check: (turnover, context) => {
          if (!context.revenue || !context.totalAssets || Number(context.totalAssets) === 0) {
            return true;
          }
          const calculated = Number(context.revenue) / Number(context.totalAssets);
          const diff = Math.abs(calculated - Number(turnover));
          return diff < 0.2;
        },
        errorMessage: 'Asset turnover doesn\'t match revenue/totalAssets',
        severity: 'error',
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// VALIDATE FINANCIALS
// ═══════════════════════════════════════════════════════════════

export async function validateFinancials(
  data: Record<string, any>
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of financialValidationRules) {
    const value = data[rule.field];

    // Skip if field is missing (will be caught by required check if needed)
    if (value === null || value === undefined) {
      continue;
    }

    for (const validation of rule.rules) {
      try {
        const isValid = validation.check(value, data);

        if (!isValid) {
          const message = `${rule.field}: ${validation.errorMessage}`;

          if (validation.severity === 'error') {
            errors.push(message);
          } else {
            warnings.push(message);
          }
        }
      } catch (err: any) {
        errors.push(`${rule.field}: Validation failed - ${err.message}`);
      }
    }
  }

  // Calculate confidence score
  const totalChecks = financialValidationRules.reduce(
    (sum, rule) => sum + rule.rules.length,
    0
  );
  const failedChecks = errors.length + warnings.length * 0.5; // Warnings count as 0.5
  const confidence = Math.max(0, Math.min(1, 1 - (failedChecks / totalChecks)));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
    confidence,
  };
}

// ═══════════════════════════════════════════════════════════════
// CROSS-REFERENCE VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface CrossReferenceResult {
  field: string;
  values: Array<{
    source: string;
    value: number;
    confidence: number;
  }>;
  finalValue: number;
  deviation: number;
  isConsistent: boolean;
}

/**
 * Cross-reference a data point against multiple sources
 * Flags if values differ by more than tolerance threshold
 */
export async function crossReferenceData(
  symbol: string,
  field: string,
  value: number,
  sources: Array<{ name: string; getValue: () => Promise<number | null> }>,
  tolerance: number = 0.10 // 10% tolerance
): Promise<CrossReferenceResult> {
  const values: Array<{ source: string; value: number; confidence: number }> = [];

  // Fetch from all sources
  for (const source of sources) {
    try {
      const sourceValue = await source.getValue();
      if (sourceValue !== null) {
        values.push({
          source: source.name,
          value: sourceValue,
          confidence: getSourceConfidence(source.name),
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch ${field} from ${source.name}:`, error);
    }
  }

  // Add current value
  values.push({
    source: 'current',
    value,
    confidence: 0.8,
  });

  // Calculate weighted average
  const totalWeight = values.reduce((sum, v) => sum + v.confidence, 0);
  const weightedAvg = values.reduce((sum, v) => sum + v.value * v.confidence, 0) / totalWeight;

  // Calculate maximum deviation
  const maxDeviation = Math.max(
    ...values.map((v) => Math.abs(v.value - weightedAvg) / Math.abs(weightedAvg))
  );

  const isConsistent = maxDeviation <= tolerance;

  if (!isConsistent) {
    console.warn(`Data inconsistency for ${symbol}.${field}:`, {
      values,
      weightedAvg,
      maxDeviation: (maxDeviation * 100).toFixed(1) + '%',
      tolerance: (tolerance * 100).toFixed(1) + '%',
    });
  }

  return {
    field,
    values,
    finalValue: weightedAvg,
    deviation: maxDeviation,
    isConsistent,
  };
}

function getSourceConfidence(sourceName: string): number {
  const confidenceMap: Record<string, number> = {
    NSE_API: 1.0,
    BSE_API: 1.0,
    company_filings: 0.95,
    database: 0.9,
    screener_api: 0.85,
    moneycontrol: 0.8,
    estimated: 0.4,
  };
  return confidenceMap[sourceName] || 0.7;
}

// ═══════════════════════════════════════════════════════════════
// TEMPORAL CONSISTENCY VALIDATION
// ═══════════════════════════════════════════════════════════════

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

/**
 * Validate that time series data makes sense over time
 * - Dates are in order
 * - No impossible changes (>500% in one period)
 * - No duplicate dates
 */
export async function validateTimeSeriesData(
  symbol: string,
  metric: string,
  data: TimeSeriesDataPoint[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check 1: Dates are in order
  for (let i = 1; i < data.length; i++) {
    const currentDate = new Date(data[i].date);
    const prevDate = new Date(data[i - 1].date);

    if (currentDate <= prevDate) {
      errors.push(`Dates out of order at index ${i}: ${data[i - 1].date} -> ${data[i].date}`);
    }
  }

  // Check 2: No impossible changes
  for (let i = 1; i < data.length; i++) {
    const change = (data[i].value - data[i - 1].value) / Math.abs(data[i - 1].value);

    // Flag if metric changes >500% in one period (except for special cases)
    if (Math.abs(change) > 5) {
      warnings.push(
        `Suspicious ${metric} change: ${(change * 100).toFixed(1)}% ` +
          `from ${data[i - 1].date} to ${data[i].date}. ` +
          `Values: ${data[i - 1].value.toFixed(2)} → ${data[i].value.toFixed(2)}`
      );
    }
  }

  // Check 3: No duplicate dates
  const dates = data.map((d) => d.date);
  const uniqueDates = new Set(dates);
  if (dates.length !== uniqueDates.size) {
    errors.push(`Duplicate dates found in ${metric} time series`);
  }

  // Check 4: No null/NaN values
  const invalidValues = data.filter(
    (d) => d.value === null || isNaN(d.value) || !isFinite(d.value)
  );
  if (invalidValues.length > 0) {
    errors.push(`Found ${invalidValues.length} invalid values (null/NaN/Infinity) in ${metric}`);
  }

  // Check 5: Reasonable data density (no huge gaps)
  if (data.length >= 2) {
    const firstDate = new Date(data[0].date);
    const lastDate = new Date(data[data.length - 1].date);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const expectedPoints = Math.floor(daysDiff / 90); // Expect quarterly data

    if (data.length < expectedPoints * 0.5) {
      warnings.push(
        `Sparse data: Only ${data.length} data points over ${Math.floor(daysDiff / 365)} years ` +
        `(expected ~${expectedPoints}). May have gaps.`
      );
    }
  }

  const confidence = Math.max(0, 1 - (errors.length * 0.2 + warnings.length * 0.1));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
    confidence,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPLETENESS VALIDATION
// ═══════════════════════════════════════════════════════════════

const requiredFields = [
  'companyName',
  'symbol',
  'sector',
  'industry',
];

const importantFinancialFields = [
  'revenue',
  'netProfit',
  'netMargin',
];

export async function validateCompleteness(data: Record<string, any>): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of requiredFields) {
    if (!data[field] || data[field] === null || data[field] === '') {
      errors.push(`Required field missing: ${field}`);
    }
  }

  // Check important financial fields
  for (const field of importantFinancialFields) {
    if (!data[field] && data[field] !== 0) {
      warnings.push(`Important financial field missing: ${field}`);
    }
  }

  const totalFields = requiredFields.length + importantFinancialFields.length;
  const missingFields = errors.length + warnings.length;
  const confidence = Math.max(0, 1 - (missingFields / totalFields));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validatedAt: new Date().toISOString(),
    confidence,
  };
}

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Run all validation checks on report data
 * This is the main entry point - call this before showing data to users
 */
export async function validateReportData(
  symbol: string,
  reportData: Record<string, any>
): Promise<ValidationResult> {
  const results: ValidationResult[] = [];

  // 1. Validate financial metrics
  if (reportData.financials) {
    const financialValidation = await validateFinancials(reportData.financials);
    results.push(financialValidation);
  }

  // 2. Validate completeness
  const completenessValidation = await validateCompleteness(reportData);
  results.push(completenessValidation);

  // 3. Validate timeline data if present
  if (reportData.timeline && Array.isArray(reportData.timeline)) {
    const timelineData = reportData.timeline
      .filter((e: any) => e.date && e.value)
      .map((e: any) => ({ date: e.date, value: e.value }));

    if (timelineData.length > 0) {
      const timelineValidation = await validateTimeSeriesData(
        symbol,
        'timeline',
        timelineData
      );
      results.push(timelineValidation);
    }
  }

  // Combine all results
  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings);
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  const overallResult: ValidationResult = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
    validatedAt: new Date().toISOString(),
    confidence: avgConfidence,
  };

  // Log validation failures
  if (!overallResult.isValid) {
    console.error(`Report validation failed for ${symbol}:`, {
      errors: allErrors,
      warnings: allWarnings,
      confidence: avgConfidence,
    });
  }

  return overallResult;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a value is within expected range for its industry
 */
export function isWithinIndustryBenchmark(
  metric: string,
  value: number,
  industry: string
): { isValid: boolean; benchmark?: { min: number; max: number; avg: number } } {
  // Industry benchmarks (these should ideally come from a database)
  const benchmarks: Record<string, Record<string, { min: number; max: number; avg: number }>> = {
    Banking: {
      netMargin: { min: 10, max: 30, avg: 20 },
      roe: { min: 10, max: 20, avg: 15 },
    },
    'IT Services': {
      netMargin: { min: 15, max: 30, avg: 20 },
      roe: { min: 20, max: 40, avg: 30 },
    },
    FMCG: {
      netMargin: { min: 5, max: 15, avg: 10 },
      roe: { min: 15, max: 40, avg: 25 },
    },
  };

  const industryBenchmark = benchmarks[industry]?.[metric];
  if (!industryBenchmark) {
    return { isValid: true }; // No benchmark available
  }

  const isValid = value >= industryBenchmark.min && value <= industryBenchmark.max;
  return { isValid, benchmark: industryBenchmark };
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.isValid) {
    return `✅ Validation passed (${(result.confidence * 100).toFixed(0)}% confidence)`;
  }

  let output = `❌ Validation failed (${(result.confidence * 100).toFixed(0)}% confidence)\n`;

  if (result.errors.length > 0) {
    output += `\nErrors:\n${result.errors.map(e => `  - ${e}`).join('\n')}`;
  }

  if (result.warnings.length > 0) {
    output += `\nWarnings:\n${result.warnings.map(w => `  - ${w}`).join('\n')}`;
  }

  return output;
}
