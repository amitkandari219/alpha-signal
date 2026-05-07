/**
 * AI Content Filter - SEBI Compliance
 *
 * Scans AI-generated content for prohibited terms that violate SEBI regulations
 * Flags and blocks content containing investment advice or recommendations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Prohibited terms that constitute investment advice or recommendations
 * These terms are NOT allowed for non-SEBI-registered platforms
 */
export const PROHIBITED_TERMS = [
  // Direct recommendations
  'recommend',
  'recommendation',
  'should buy',
  'should sell',
  'must buy',
  'must sell',
  'strong buy',
  'strong sell',
  'buy rating',
  'sell rating',
  'hold rating',
  'accumulate',

  // Price targets
  'target price',
  'price target',
  'expected to reach',
  'will reach',
  'could reach',
  'likely to reach',
  'potential target',

  // Investment advice
  'investment advice',
  'investment recommendation',
  'advised to buy',
  'advised to sell',
  'suggest buying',
  'suggest selling',

  // Guarantees
  'guaranteed returns',
  'assured returns',
  'risk-free',
  'guaranteed profit',
  'sure shot',
  'surefire',

  // Call to action
  'buy now',
  'sell now',
  'exit now',
  'book profits',
  'cut losses',
  'add to portfolio',
  'remove from portfolio',
];

/**
 * Validation result interface
 */
export interface ContentValidationResult {
  isValid: boolean;
  flaggedTerms: string[];
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  originalContent?: string;
}

/**
 * Validate AI-generated summary for prohibited terms
 *
 * @param content - The AI-generated text to validate
 * @param summaryId - Optional summary ID for logging
 * @param companyId - Optional company ID for context
 * @returns Validation result with flagged terms
 */
export async function validateAISummary(
  content: string,
  summaryId?: string,
  companyId?: string
): Promise<ContentValidationResult> {
  const flaggedTerms: string[] = [];
  const contentLower = content.toLowerCase();

  // Check for each prohibited term
  for (const term of PROHIBITED_TERMS) {
    if (contentLower.includes(term.toLowerCase())) {
      flaggedTerms.push(term);
    }
  }

  const isValid = flaggedTerms.length === 0;

  // Determine severity based on number and type of violations
  let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (flaggedTerms.length > 0) {
    const highSeverityTerms = ['recommend', 'buy rating', 'sell rating', 'target price', 'guaranteed returns'];
    const hasHighSeverity = flaggedTerms.some(term =>
      highSeverityTerms.some(highTerm => term.toLowerCase().includes(highTerm.toLowerCase()))
    );

    if (hasHighSeverity || flaggedTerms.length >= 3) {
      severity = 'HIGH';
    } else if (flaggedTerms.length >= 2) {
      severity = 'MEDIUM';
    }
  }

  // Log flagged content to database
  if (!isValid && summaryId) {
    try {
      await prisma.$executeRawUnsafe(
        `
        INSERT INTO content_flags (summary_id, company_id, flagged_terms, severity, original_content, action_taken)
        VALUES ($1, $2, $3, $4, $5, $6)
        `,
        summaryId,
        companyId || null,
        JSON.stringify(flaggedTerms),
        severity,
        content.substring(0, 1000), // Store first 1000 chars
        'BLOCKED'
      );
    } catch (error) {
      console.error('Error logging flagged content:', error);
      // Don't fail validation if logging fails
    }
  }

  return {
    isValid,
    flaggedTerms,
    severity,
    originalContent: !isValid ? content : undefined,
  };
}

/**
 * Generate a repair prompt to regenerate content without violations
 *
 * @param originalPrompt - The original prompt that generated problematic content
 * @param flaggedTerms - The terms that were flagged
 * @returns Enhanced prompt with explicit restrictions
 */
export function generateRepairPrompt(originalPrompt: string, flaggedTerms: string[]): string {
  return `${originalPrompt}

CRITICAL COMPLIANCE REQUIREMENTS - YOU MUST FOLLOW THESE:
1. Do NOT include any buy, sell, or hold recommendations
2. Do NOT provide price targets or earnings forecasts
3. Do NOT use words like: ${flaggedTerms.slice(0, 5).join(', ')}
4. Do NOT give investment advice or suggestions
5. ONLY provide factual, informational analysis
6. Frame everything as educational information, not recommendations
7. Use phrases like "data shows", "historical performance indicates", "fundamentals suggest" instead of "should buy" or "recommend"

Remember: This platform is NOT a SEBI-registered Research Analyst. Content must be purely informational.`;
}

/**
 * Test the content filter with sample texts
 * Used for validation and testing
 */
export async function testContentFilter() {
  console.log('🧪 Testing Content Filter...\n');

  const testCases = [
    {
      name: 'Valid content',
      content: 'The company reported strong revenue growth of 25% YoY in Q4. Operating margins improved to 18%.',
      shouldPass: true,
    },
    {
      name: 'Invalid - recommendation',
      content: 'Strong fundamentals and growth prospects. We recommend buying this stock.',
      shouldPass: false,
    },
    {
      name: 'Invalid - price target',
      content: 'Based on DCF valuation, target price is ₹500 with upside of 20%.',
      shouldPass: false,
    },
    {
      name: 'Invalid - call to action',
      content: 'Good time to buy now before the breakout. Add to portfolio.',
      shouldPass: false,
    },
    {
      name: 'Valid - neutral analysis',
      content: 'The stock trades at a P/E of 25x, which is above the industry average of 20x. Debt-to-equity ratio is 0.5.',
      shouldPass: true,
    },
  ];

  for (const testCase of testCases) {
    const result = await validateAISummary(testCase.content);
    const status = result.isValid === testCase.shouldPass ? '✅ PASS' : '❌ FAIL';

    console.log(`${status} - ${testCase.name}`);
    if (result.flaggedTerms.length > 0) {
      console.log(`  Flagged: ${result.flaggedTerms.join(', ')}`);
    }
    console.log('');
  }

  console.log('✨ Content Filter Test Complete\n');
}

export default validateAISummary;
