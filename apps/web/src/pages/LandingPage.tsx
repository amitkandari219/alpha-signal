/**
 * Landing Page - Public Homepage
 *
 * SEO-optimized landing page for non-logged-in users
 * Logged-in users are redirected to /dashboard
 */

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, Shield, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { SEO } from '../components/SEO';
import { SEO_CONFIG } from '../config/seo';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <>
      <SEO
        title={SEO_CONFIG.homepage.title}
        description={SEO_CONFIG.homepage.description}
        canonical="/"
        jsonLd={SEO_CONFIG.homepage.jsonLd}
      />

      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Navigation Header */}
        <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">α</span>
              </div>
              <span className="text-xl font-bold text-white">Alpha Signal</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/pricing"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Pricing
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Start Free
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              AI-Powered Stock Intelligence
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                for Indian Markets
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              2 hours of research done in 5 minutes. AI-generated bull/bear cases, risk flags,
              and quality scores for 500+ stocks.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                Start Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="px-8 py-4 border border-slate-600 hover:border-slate-500 text-white text-lg font-semibold rounded-lg transition-colors"
              >
                See Pricing
              </Link>
            </div>
            <p className="text-slate-400 mt-4 text-sm">
              No credit card required • 7-day free trial
            </p>
          </div>

          {/* Background Grid Pattern */}
          <div className="absolute inset-0 -z-10 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '4rem 4rem',
              }}
            />
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Intelligence */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">AI Intelligence</h3>
              <p className="text-slate-300 mb-4">
                Bull/bear cases, thesis, risk assessment for every stock. Generated by advanced
                AI models trained on Indian market data.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Business overview & competitive positioning
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Bull/bear investment thesis
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Risk flags & red alerts
                </li>
              </ul>
            </div>

            {/* Smart Screening */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Smart Screening</h3>
              <p className="text-slate-300 mb-4">
                Multi-factor screener with Quality, Growth, Risk, Momentum scores. Filter by
                fundamentals, technicals, and valuations.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Quality & Growth scoring (0-100)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Advanced filters & sorting
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Save custom screens
                </li>
              </ul>
            </div>

            {/* Risk Detection */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Risk Detection</h3>
              <p className="text-slate-300 mb-4">
                Governance scoring, earnings manipulation detection, red flag alerts. Protect
                your portfolio from hidden risks.
              </p>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Promoter pledge tracking
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Financial health monitoring
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Real-time risk alerts
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-12">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  See Alpha Signal in Action
                </h2>
                <p className="text-slate-300 mb-6">
                  Experience the power of AI-driven stock analysis. Check out a live example of
                  how we analyze Dixon Technologies.
                </p>
                <Link
                  to="/stock/DIXON"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold"
                >
                  See Dixon Technologies Analysis
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
                <div className="text-sm text-slate-400 mb-2">Stock Analysis Preview</div>
                <div className="text-2xl font-bold text-white mb-2">DIXON</div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">Quality</div>
                    <div className="text-lg font-bold text-green-500">88</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">Growth</div>
                    <div className="text-lg font-bold text-green-500">92</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-slate-400">Risk</div>
                    <div className="text-lg font-bold text-green-500">28</div>
                  </div>
                </div>
                <div className="text-sm text-slate-300">
                  "Leading EMS player with strong execution track record and diversified
                  clientele..."
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-slate-300 text-lg">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="text-sm text-blue-400 font-semibold mb-2">FREE</div>
              <div className="text-3xl font-bold text-white mb-4">₹0</div>
              <ul className="space-y-3 text-slate-300 text-sm mb-6">
                <li>Basic stock overviews</li>
                <li>Quality & Growth scores</li>
                <li>5 stocks/day limit</li>
              </ul>
              <Link
                to="/register"
                className="block w-full py-3 text-center border border-slate-600 hover:border-slate-500 text-white rounded-lg transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-gradient-to-b from-blue-900/50 to-slate-800/50 backdrop-blur border-2 border-blue-500 rounded-xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-sm text-blue-400 font-semibold mb-2">PRO</div>
              <div className="text-3xl font-bold text-white mb-4">₹299/mo</div>
              <ul className="space-y-3 text-slate-300 text-sm mb-6">
                <li>Full AI Intelligence</li>
                <li>Unlimited stock analysis</li>
                <li>Advanced screener</li>
                <li>Real-time alerts</li>
              </ul>
              <Link
                to="/pricing"
                className="block w-full py-3 text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
              <div className="text-sm text-purple-400 font-semibold mb-2">PREMIUM</div>
              <div className="text-3xl font-bold text-white mb-4">₹499/mo</div>
              <ul className="space-y-3 text-slate-300 text-sm mb-6">
                <li>Everything in Pro</li>
                <li>Weekly sector reports</li>
                <li>Portfolio tracking</li>
                <li>Priority support</li>
              </ul>
              <Link
                to="/pricing"
                className="block w-full py-3 text-center border border-slate-600 hover:border-slate-500 text-white rounded-lg transition-colors"
              >
                View Premium
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">α</span>
                  </div>
                  <span className="text-xl font-bold text-white">Alpha Signal</span>
                </div>
                <p className="text-slate-400 text-sm">
                  AI-powered stock intelligence for Indian markets.
                </p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><Link to="/screener" className="hover:text-white">Screener</Link></li>
                  <li><Link to="/sectors" className="hover:text-white">Sectors</Link></li>
                  <li><Link to="/reports" className="hover:text-white">Reports</Link></li>
                  <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Company</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                  <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
                  <li><Link to="/methodology" className="hover:text-white">Methodology</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Connect</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  <li><a href="https://twitter.com/alphasignal" className="hover:text-white">Twitter</a></li>
                  <li><a href="https://linkedin.com/company/alphasignal" className="hover:text-white">LinkedIn</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-8">
              <p className="text-slate-400 text-sm text-center">
                © 2026 Alpha Signal. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
