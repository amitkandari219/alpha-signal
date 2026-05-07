/**
 * Scoring Methodology - SEBI Compliance
 *
 * Comprehensive explanation of all 5 proprietary scoring systems
 */

export default function Methodology() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-4">Scoring Methodology</h1>
          <p className="text-slate-400 mb-8">
            Understand how Alpha Signal computes its proprietary scores
          </p>

          {/* Disclaimer */}
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-6 mb-8">
            <p className="text-amber-300 font-semibold text-center">
              ⚠️ These scores are for informational purposes only and do NOT constitute investment advice.
              All scores are backward-looking and based on historical data. They do not predict future performance.
            </p>
          </div>

          {/* Quality Score */}
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-blue-400">Quality Score</span>
              <span className="text-slate-500 text-xl">(0-100)</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Measures the fundamental quality and financial health of a company.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Factors & Weights:</h3>
            <div className="space-y-3 ml-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-300">1. Return on Equity (ROE) - measures profitability</span>
                <span className="text-blue-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">2. Return on Capital Employed (ROCE) - capital efficiency</span>
                <span className="text-blue-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">3. Operating Profit Margin - operational efficiency</span>
                <span className="text-blue-400 font-mono">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">4. Debt-to-Equity Ratio - financial leverage (lower is better)</span>
                <span className="text-blue-400 font-mono">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">5. Interest Coverage - ability to service debt</span>
                <span className="text-blue-400 font-mono">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">6. Current Ratio - short-term liquidity</span>
                <span className="text-blue-400 font-mono">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">7. Cash as % of Market Cap - financial cushion</span>
                <span className="text-blue-400 font-mono">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">8. Earnings Quality - consistency and reliability</span>
                <span className="text-blue-400 font-mono">5%</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Interpretation:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li><strong>80-100:</strong> Excellent quality - high profitability, low debt, strong cash flows</li>
              <li><strong>60-79:</strong> Good quality - solid fundamentals with minor weaknesses</li>
              <li><strong>40-59:</strong> Average quality - mixed indicators, requires deeper analysis</li>
              <li><strong>Below 40:</strong> Poor quality - weak fundamentals, high leverage, or distress</li>
            </ul>

            <p className="text-slate-400 text-sm mt-4 italic">
              Data Source: Company financial statements, quarterly results, annual reports
            </p>
          </section>

          {/* Growth Score */}
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-green-400">Growth Score</span>
              <span className="text-slate-500 text-xl">(0-100)</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Evaluates historical growth trajectory and expansion potential.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Factors & Weights:</h3>
            <div className="space-y-3 ml-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-300">1. Revenue CAGR (5-year) - top-line growth</span>
                <span className="text-green-400 font-mono">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">2. Profit CAGR (5-year) - bottom-line expansion</span>
                <span className="text-green-400 font-mono">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">3. EPS Growth - shareholder value creation</span>
                <span className="text-green-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">4. Market Share Trend - competitive positioning</span>
                <span className="text-green-400 font-mono">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">5. Asset Growth - business expansion</span>
                <span className="text-green-400 font-mono">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">6. Growth Consistency - volatility of growth</span>
                <span className="text-green-400 font-mono">5%</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Interpretation:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li><strong>80-100:</strong> High growth - rapid expansion, strong momentum</li>
              <li><strong>60-79:</strong> Moderate growth - steady expansion above industry average</li>
              <li><strong>40-59:</strong> Slow growth - lagging peers or mature industry</li>
              <li><strong>Below 40:</strong> Declining - negative growth or stagnation</li>
            </ul>

            <p className="text-slate-400 text-sm mt-4 italic">
              Data Source: Historical financial statements, industry reports
            </p>
          </section>

          {/* Risk Score */}
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-red-400">Risk Score</span>
              <span className="text-slate-500 text-xl">(0-100, higher = more risk)</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Identifies red flags, governance issues, and potential vulnerabilities.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Factors & Weights:</h3>
            <div className="space-y-3 ml-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-300">1. Debt Levels - high leverage increases risk</span>
                <span className="text-red-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">2. Promoter Pledge - shares pledged by founders</span>
                <span className="text-red-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">3. Auditor Concerns - qualifications or disclaimers</span>
                <span className="text-red-400 font-mono">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">4. Related Party Transactions - potential conflicts</span>
                <span className="text-red-400 font-mono">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">5. Litigation Risk - ongoing legal issues</span>
                <span className="text-red-400 font-mono">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">6. Volatility - price and earnings instability</span>
                <span className="text-red-400 font-mono">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">7. Governance Quality - board independence, disclosures</span>
                <span className="text-red-400 font-mono">5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">8. Regulatory Issues - SEBI actions or penalties</span>
                <span className="text-red-400 font-mono">5%</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Interpretation:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li><strong>0-20:</strong> Low risk - clean governance, low debt, no red flags</li>
              <li><strong>21-40:</strong> Moderate risk - minor concerns, manageable issues</li>
              <li><strong>41-60:</strong> High risk - significant red flags, proceed with caution</li>
              <li><strong>Above 60:</strong> Very high risk - multiple serious concerns</li>
            </ul>

            <p className="text-slate-400 text-sm mt-4 italic">
              Data Source: MCA filings, audit reports, regulatory disclosures, court records
            </p>
          </section>

          {/* Sentiment Score */}
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-purple-400">Sentiment Score</span>
              <span className="text-slate-500 text-xl">(0-100)</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Analyzes news flow, social sentiment, and market perception. Uses 7-day rolling window.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Factors & Weights:</h3>
            <div className="space-y-3 ml-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-300">1. News Sentiment - AI analysis of recent news articles</span>
                <span className="text-purple-400 font-mono">40%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">2. Analyst Actions - upgrades/downgrades by brokerages</span>
                <span className="text-purple-400 font-mono">30%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">3. Insider Activity - promoter buying/selling</span>
                <span className="text-purple-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">4. Social Media Buzz - volume and tone of discussions</span>
                <span className="text-purple-400 font-mono">10%</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Interpretation:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li><strong>70-100:</strong> Positive sentiment - favorable news, bullish coverage</li>
              <li><strong>40-69:</strong> Neutral sentiment - mixed signals, no clear direction</li>
              <li><strong>Below 40:</strong> Negative sentiment - adverse news, bearish outlook</li>
            </ul>

            <p className="text-yellow-400 text-sm mt-4 font-semibold">
              ⚠️ Note: Sentiment is short-term and volatile. It does not predict future price movements.
            </p>

            <p className="text-slate-400 text-sm mt-2 italic">
              Data Source: News aggregators, analyst reports, BSE/NSE disclosures
            </p>
          </section>

          {/* Momentum Score */}
          <section className="mb-10">
            <h2 className="text-3xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="text-orange-400">Momentum Score</span>
              <span className="text-slate-500 text-xl">(0-100)</span>
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Evaluates technical strength and price momentum across multiple timeframes.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Factors & Weights:</h3>
            <div className="space-y-3 ml-4 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-300">1. Relative Strength Index (RSI) - overbought/oversold</span>
                <span className="text-orange-400 font-mono">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">2. Moving Average Convergence - trend direction</span>
                <span className="text-orange-400 font-mono">25%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">3. Price vs. Moving Averages - SMA 20/50/200 position</span>
                <span className="text-orange-400 font-mono">20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">4. Volume Trend - buying/selling pressure</span>
                <span className="text-orange-400 font-mono">15%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">5. Breakout Signals - new highs or key level breaches</span>
                <span className="text-orange-400 font-mono">15%</span>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-3">Interpretation:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-1 ml-4">
              <li><strong>70-100:</strong> Strong momentum - uptrend, technical strength</li>
              <li><strong>40-69:</strong> Neutral momentum - sideways or consolidating</li>
              <li><strong>Below 40:</strong> Weak momentum - downtrend, technical weakness</li>
            </ul>

            <p className="text-yellow-400 text-sm mt-4 font-semibold">
              ⚠️ Note: Technical indicators are lagging and do not guarantee future performance.
            </p>

            <p className="text-slate-400 text-sm mt-2 italic">
              Data Source: BSE/NSE price and volume data
            </p>
          </section>

          {/* Limitations */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Limitations of Scoring System</h2>
            <div className="bg-slate-900/50 rounded-lg p-6">
              <ul className="list-disc list-inside text-slate-300 space-y-3">
                <li><strong>Backward-looking:</strong> All scores are based on historical data and do not predict future performance</li>
                <li><strong>Quantitative only:</strong> Scores do not capture qualitative factors like management quality, industry dynamics, or competitive moats</li>
                <li><strong>Data limitations:</strong> Accuracy depends on quality and timeliness of source data</li>
                <li><strong>Not personalized:</strong> Scores do not consider your individual risk tolerance, investment goals, or portfolio</li>
                <li><strong>Sector differences:</strong> Scores may not be directly comparable across different industries</li>
                <li><strong>Market conditions:</strong> Scores do not account for overall market sentiment or macroeconomic factors</li>
              </ul>
            </div>
          </section>

          {/* Final Disclaimer */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
            <p className="text-red-300 font-semibold text-center text-lg mb-2">
              ⚠️ NOT INVESTMENT ADVICE
            </p>
            <p className="text-red-300 text-center">
              These scores are for informational purposes only and do NOT constitute investment advice or
              recommendations to buy, sell, or hold any security. Always conduct your own research and
              consult a SEBI-registered financial advisor before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
