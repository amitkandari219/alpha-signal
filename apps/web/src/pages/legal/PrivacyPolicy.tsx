/**
 * Privacy Policy - SEBI Compliance & Data Protection
 *
 * Comprehensive privacy policy for Alpha Signal platform
 */

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-slate-400 mb-8">Last Updated: February 8, 2026</p>

          {/* Introduction */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              Alpha Signal ("we", "our", "us") is committed to protecting your privacy and personal data.
              This Privacy Policy explains how we collect, use, store, and protect your information in
              compliance with Indian data protection laws.
            </p>
          </section>

          {/* Data Collected */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Data We Collect</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We collect the following types of information:
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">Account Information:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
              <li><strong>Email address</strong> - for account creation and communication</li>
              <li><strong>Name</strong> - optional, for personalization</li>
              <li><strong>Password</strong> - hashed using bcrypt, never stored in plaintext</li>
              <li><strong>Subscription tier</strong> - FREE, PRO, or PREMIUM</li>
              <li><strong>Account creation date and last login timestamp</strong></li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Usage Data:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
              <li>Pages viewed and features accessed</li>
              <li>Stock symbols searched and viewed</li>
              <li>AI summaries generated and feedback provided</li>
              <li>Portfolio holdings (if you choose to track your portfolio)</li>
              <li>Watchlists and alerts configured</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Payment Information:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4 mb-4">
              <li>Processed by Razorpay (our payment partner)</li>
              <li>We do NOT store credit/debit card details</li>
              <li>We store transaction IDs and payment status only</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">Technical Data:</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>IP address (for security and rate limiting)</li>
              <li>Browser type and version</li>
              <li>Device information (desktop/mobile)</li>
              <li>Session duration and activity timestamps</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Data</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use your information for the following purposes:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Provide services</strong> - deliver platform features and functionality</li>
              <li><strong>Personalization</strong> - customize your experience and recommendations</li>
              <li><strong>Portfolio analytics</strong> - compute returns and performance metrics</li>
              <li><strong>AI model improvement</strong> - aggregated and anonymized data only</li>
              <li><strong>Communication</strong> - send transactional emails (payment confirmations, alerts)</li>
              <li><strong>Security</strong> - detect fraud, prevent abuse, enforce terms</li>
              <li><strong>Legal compliance</strong> - comply with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-green-300 font-semibold">
                ✅ We do NOT sell, rent, or share your personal data with third parties for marketing purposes.
              </p>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              We share data only in these limited circumstances:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Razorpay</strong> - for payment processing (necessary for subscription billing)</li>
              <li><strong>Email service provider</strong> - for transactional emails only (e.g., SendGrid)</li>
              <li><strong>Legal requirements</strong> - if required by law, court order, or government authority</li>
              <li><strong>Business transfer</strong> - in the event of merger, acquisition, or asset sale</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Retention</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li>Account data is retained while your account is active</li>
              <li>Upon account deletion, personal data is deleted within 90 days</li>
              <li>Payment records are retained for 7 years (tax and audit requirements)</li>
              <li>Anonymized analytics data may be retained indefinitely</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We use the following types of cookies:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Essential cookies</strong> - session cookies for authentication (required)</li>
              <li><strong>Preference cookies</strong> - remember UI settings and theme preferences</li>
              <li><strong>Analytics cookies</strong> - understand platform usage and improve experience</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              We do NOT use third-party tracking cookies or advertising networks.
            </p>
          </section>

          {/* Compliance */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Legal Compliance</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              Alpha Signal complies with:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Information Technology Act, 2000</strong></li>
              <li><strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong></li>
              <li><strong>Digital Personal Data Protection Act, 2023</strong></li>
            </ul>
          </section>

          {/* User Rights */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Access</strong> - request a copy of your personal data</li>
              <li><strong>Correction</strong> - update or correct inaccurate information</li>
              <li><strong>Deletion</strong> - request deletion of your account and personal data</li>
              <li><strong>Portability</strong> - export your data in a machine-readable format</li>
              <li><strong>Objection</strong> - object to certain processing activities</li>
              <li><strong>Withdrawal of consent</strong> - withdraw consent for optional data processing</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@alphasignal.in" className="text-blue-400 hover:underline">
                privacy@alphasignal.in
              </a>
            </p>
          </section>

          {/* Security */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Security Measures</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
              <li><strong>Encryption in transit</strong> - TLS 1.3 for all communications</li>
              <li><strong>Encryption at rest</strong> - AES-256 encryption for sensitive data</li>
              <li><strong>Password hashing</strong> - bcrypt with salt for password storage</li>
              <li><strong>Rate limiting</strong> - protect against brute force attacks</li>
              <li><strong>Regular security audits</strong> - periodic vulnerability assessments</li>
              <li><strong>Access controls</strong> - role-based access for internal systems</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Alpha Signal is not intended for users under 18 years of age. We do not knowingly collect
              personal data from children. If we become aware that a user is under 18, we will delete
              their account and data.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Material changes will be communicated
              via email at least 30 days before taking effect. Continued use of Alpha Signal after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              For privacy-related questions, concerns, or data requests, contact us at:
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <p className="text-white">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@alphasignal.in" className="text-blue-400 hover:underline">
                  privacy@alphasignal.in
                </a>
              </p>
              <p className="text-white mt-2">
                <strong>Data Protection Officer:</strong> DPO@alphasignal.in
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
