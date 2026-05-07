/**
 * Terms of Service - SEBI Compliance
 *
 * Comprehensive legal terms for Alpha Signal platform
 */

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400 mb-8">Last Updated: February 8, 2026</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Welcome to Alpha Signal, an AI-powered stock analysis and information platform. By accessing
              or using our services, you agree to be bound by these Terms of Service.
            </p>
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-300 font-medium">
                ⚠️ IMPORTANT: Alpha Signal is NOT a SEBI-registered Research Analyst. We do not provide
                investment advice, stock recommendations, or personalized financial guidance.
              </p>
            </div>
          </section>

          {/* Nature of Content */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Nature of Content</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              All content provided on Alpha Signal, including but not limited to AI-generated summaries,
              scores, analyses, and data visualizations, is <strong>informational and educational only</strong>.
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>No content constitutes investment advice or recommendations</li>
              <li>No content is a solicitation to buy, sell, or hold any security</li>
              <li>All information should be independently verified before making decisions</li>
              <li>We do not provide personalized financial guidance</li>
            </ul>
          </section>

          {/* AI Disclaimer */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. AI-Generated Content Disclaimer</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Alpha Signal uses artificial intelligence to analyze publicly available data and generate
              summaries, insights, and scores. By using our services, you acknowledge that:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>AI-generated content may contain errors, omissions, or inaccuracies</li>
              <li>AI models can hallucinate or generate incorrect information</li>
              <li>All AI outputs should be verified against primary sources</li>
              <li>AI summaries are based on historical data and do not predict future performance</li>
              <li>We continuously improve our models but cannot guarantee 100% accuracy</li>
            </ul>
          </section>

          {/* No Forward Projections */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. No Forward-Looking Projections</h2>
            <p className="text-slate-300 leading-relaxed">
              Alpha Signal does NOT provide:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mt-2">
              <li>Price targets or earnings forecasts</li>
              <li>Buy, sell, or hold ratings</li>
              <li>Future projections or predictions of any kind</li>
              <li>Expected returns or performance estimates</li>
              <li>Guaranteed or assured returns</li>
            </ul>
          </section>

          {/* Data Sources */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sources</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              All data is sourced from publicly available information including:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>BSE and NSE stock exchanges</li>
              <li>Ministry of Corporate Affairs (MCA) filings</li>
              <li>Company annual reports and quarterly results</li>
              <li>Public company websites and disclosures</li>
              <li>News sources and media publications</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              We do NOT use or have access to insider information, unpublished price-sensitive information,
              or any non-public data.
            </p>
          </section>

          {/* User Responsibility */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. User Responsibility</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              By using Alpha Signal, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>You are solely responsible for all investment decisions</li>
              <li>You assume all risk for any actions taken based on platform content</li>
              <li>You should consult a SEBI-registered financial advisor before investing</li>
              <li>Past performance does not guarantee future results</li>
              <li>Stock market investments involve risk of loss, including loss of principal</li>
              <li>You will independently verify all information before making decisions</li>
            </ul>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Alpha Signal, its founders, employees, and affiliates shall NOT be liable for:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Any financial losses or damages resulting from use of our platform</li>
              <li>Errors, omissions, or inaccuracies in content or data</li>
              <li>Investment decisions made based on platform information</li>
              <li>Indirect, incidental, consequential, or punitive damages</li>
              <li>Loss of profits, revenue, or business opportunities</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4 font-semibold">
              Maximum liability is limited to the total subscription fees paid in the last 12 months.
            </p>
          </section>

          {/* Intellectual Property */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Intellectual Property</h2>
            <p className="text-slate-300 leading-relaxed">
              All AI-generated summaries, proprietary scores, analyses, methodologies, and platform features
              are the intellectual property of Alpha Signal. Users may not reproduce, distribute, or
              commercially exploit our content without written permission.
            </p>
          </section>

          {/* Account Terms */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Account Terms</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Users must be 18 years or older to create an account</li>
              <li>One account per person; account sharing is prohibited</li>
              <li>You are responsible for maintaining account security</li>
              <li>We reserve the right to terminate accounts for violations</li>
              <li>Subscription fees are non-refundable except as required by law</li>
            </ul>
          </section>

          {/* Modifications */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Modifications to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Users will be notified
              of material changes at least 30 days in advance via email. Continued use of the platform
              after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Governing Law */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law and Jurisdiction</h2>
            <p className="text-slate-300 leading-relaxed">
              These Terms of Service are governed by the laws of India. Any disputes arising from use
              of Alpha Signal shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For questions about these Terms of Service, contact us at:{' '}
              <a href="mailto:legal@alphasignal.in" className="text-blue-400 hover:underline">
                legal@alphasignal.in
              </a>
            </p>
          </section>

          {/* Final Disclaimer */}
          <div className="mt-12 p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 font-semibold text-center">
              ⚠️ Alpha Signal is NOT a SEBI-registered Research Analyst. This platform does NOT provide
              investment advice. Always consult a qualified financial advisor before investing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
