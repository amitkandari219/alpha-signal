import { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, ArrowRight, Home, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../lib/apiClient';
import { SEO } from '../components/SEO';
import { SEO_CONFIG } from '../config/seo';

interface Plan {
  id: string;
  name: string;
  tier: 'PRO' | 'PREMIUM';
  billingCycle: 'MONTHLY' | 'ANNUAL';
  regularPrice: number;
  launchPrice: number;
  isLaunchActive: boolean;
}

const TIER_FEATURES = {
  FREE: [
    'Business overviews in AI Intelligence',
    'Profitability metrics (ROE, ROCE, OPM)',
    'Trend dashboard in Technical Analysis',
    'News headlines with sentiment',
    'Governance quality scores',
    'Basic company fundamentals',
    'Search & explore stocks',
  ],
  PRO: [
    'Everything in FREE',
    'Full AI Intelligence with thesis',
    'Complete Fundamentals Analysis',
    'Full Technical Analysis with breakouts',
    'News Sentiment Timeline & Risk Alerts',
    'Tailwind Engine',
    'Stock Alerts',
    'Portfolio Tracker',
    'Advanced Screener filters',
    '500 API calls/min',
  ],
  PREMIUM: [
    'Everything in PRO',
    'Priority AI updates',
    'Advanced Risk Dashboard',
    'Earnings quality analysis',
    'Institutional activity tracking',
    'Real-time alerts',
    'API access with 2000 calls/min',
    'Export reports (coming soon)',
    'Priority support',
  ],
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('ANNUAL');
  const [couponCode, setCouponCode] = useState('EARLYBIRD40');
  const [couponValid, setCouponValid] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscription-plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async (planId: string) => {
    if (!couponCode) return;

    try {
      const response = await apiClient.post('/billing/validate-coupon', {
        couponCode,
        planId,
      });

      if (response.data.valid) {
        setCouponValid(true);
        setCouponDiscount(response.data.coupon.discountPct);
      }
    } catch (error) {
      setCouponValid(false);
      setCouponDiscount(0);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (!user) {
      navigate('/login?redirect=/pricing');
      return;
    }

    if (user.tier === plan.tier) {
      return;
    }

    // Navigate to checkout
    navigate(`/checkout?plan=${plan.id}&coupon=${couponCode}`);
  };

  const formatPrice = (priceInPaise: number) => {
    return (priceInPaise / 100).toLocaleString('en-IN');
  };

  const calculateFinalPrice = (plan: Plan) => {
    const basePrice = plan.isLaunchActive ? plan.launchPrice : plan.regularPrice;
    if (couponValid && couponDiscount > 0) {
      return basePrice - Math.round((basePrice * couponDiscount) / 100);
    }
    return basePrice;
  };

  const getSavingsPercent = (plan: Plan) => {
    if (!plan.isLaunchActive) return 0;
    return Math.round(((plan.regularPrice - plan.launchPrice) / plan.regularPrice) * 100);
  };

  const proPlans = plans.filter(p => p.tier === 'PRO');
  const premiumPlans = plans.filter(p => p.tier === 'PREMIUM');

  const proMonthly = proPlans.find(p => p.billingCycle === 'MONTHLY');
  const proAnnual = proPlans.find(p => p.billingCycle === 'ANNUAL');
  const premiumMonthly = premiumPlans.find(p => p.billingCycle === 'MONTHLY');
  const premiumAnnual = premiumPlans.find(p => p.billingCycle === 'ANNUAL');

  const selectedProPlan = billingCycle === 'MONTHLY' ? proMonthly : proAnnual;
  const selectedPremiumPlan = billingCycle === 'MONTHLY' ? premiumMonthly : premiumAnnual;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={SEO_CONFIG.pricing.title}
        description={SEO_CONFIG.pricing.description}
        canonical="/pricing"
      />
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Alpha Signal
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-slate-300 hover:text-white transition flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </button>
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-sm">
                  {user.tier}
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-slate-300 hover:text-white transition flex items-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-16 px-4">
        {/* Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors group"
          >
            <ArrowRight className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            <span>{user ? 'Back to Dashboard' : 'Back to Home'}</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Limited Time Launch Offer - 40% OFF</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-slate-400">
            Unlock powerful stock analysis tools for smarter investing
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              billingCycle === 'MONTHLY'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-6 py-3 rounded-lg font-medium transition relative ${
              billingCycle === 'ANNUAL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* FREE Tier */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">FREE</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">₹0</span>
                <span className="text-slate-400">/forever</span>
              </div>
            </div>

            <button
              disabled={user?.tier === 'FREE'}
              className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition mb-6"
            >
              {user?.tier === 'FREE' ? 'Current Plan' : 'Get Started'}
            </button>

            <div className="space-y-3">
              {TIER_FEATURES.FREE.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRO Tier */}
          <div className="bg-gradient-to-b from-blue-900/40 to-slate-800/50 backdrop-blur border-2 border-blue-500 rounded-2xl p-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-6 w-6 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">PRO</h3>
            </div>

            {selectedProPlan && (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {selectedProPlan.isLaunchActive && (
                      <span className="text-xl text-slate-500 line-through">
                        ₹{formatPrice(selectedProPlan.regularPrice)}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-white">
                      ₹{formatPrice(calculateFinalPrice(selectedProPlan))}
                    </span>
                    <span className="text-slate-400">/{billingCycle === 'MONTHLY' ? 'month' : 'year'}</span>
                  </div>
                  {selectedProPlan.isLaunchActive && (
                    <div className="text-green-400 text-sm mt-1">
                      Save {getSavingsPercent(selectedProPlan)}% (Launch Offer)
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(selectedProPlan)}
                  disabled={user?.tier === 'PRO' || user?.tier === 'PREMIUM'}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition mb-6 flex items-center justify-center gap-2"
                >
                  {user?.tier === 'PRO' ? (
                    'Current Plan'
                  ) : user?.tier === 'PREMIUM' ? (
                    'Downgrade'
                  ) : (
                    <>
                      Upgrade to PRO <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </>
            )}

            <div className="space-y-3">
              {TIER_FEATURES.PRO.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PREMIUM Tier */}
          <div className="bg-gradient-to-b from-amber-900/40 to-slate-800/50 backdrop-blur border-2 border-amber-500 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-amber-400" />
              <h3 className="text-2xl font-bold text-white">PREMIUM</h3>
            </div>

            {selectedPremiumPlan && (
              <>
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    {selectedPremiumPlan.isLaunchActive && (
                      <span className="text-xl text-slate-500 line-through">
                        ₹{formatPrice(selectedPremiumPlan.regularPrice)}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-white">
                      ₹{formatPrice(calculateFinalPrice(selectedPremiumPlan))}
                    </span>
                    <span className="text-slate-400">/{billingCycle === 'MONTHLY' ? 'month' : 'year'}</span>
                  </div>
                  {selectedPremiumPlan.isLaunchActive && (
                    <div className="text-green-400 text-sm mt-1">
                      Save {getSavingsPercent(selectedPremiumPlan)}% (Launch Offer)
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(selectedPremiumPlan)}
                  disabled={user?.tier === 'PREMIUM'}
                  className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition mb-6 flex items-center justify-center gap-2"
                >
                  {user?.tier === 'PREMIUM' ? (
                    'Current Plan'
                  ) : (
                    <>
                      Upgrade to PREMIUM <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </>
            )}

            <div className="space-y-3">
              {TIER_FEATURES.PREMIUM.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-200 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coupon Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-6 w-6 text-green-400" />
              <h3 className="text-xl font-bold text-white">Launch Offer Coupon</h3>
            </div>
            <p className="text-slate-300 mb-4">
              Use code <span className="font-mono font-bold text-green-400">EARLYBIRD40</span> for an additional 40% OFF on all paid plans!
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition">
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <details className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Can I cancel anytime?
              </summary>
              <p className="mt-4 text-slate-400">
                Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period.
              </p>
            </details>
            <details className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                Is the launch discount stackable with coupons?
              </summary>
              <p className="mt-4 text-slate-400">
                Yes! The EARLYBIRD40 coupon provides an additional 40% off on top of the launch discount, giving you massive savings.
              </p>
            </details>
            <details className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <summary className="font-semibold text-white cursor-pointer">
                What payment methods do you accept?
              </summary>
              <p className="mt-4 text-slate-400">
                We accept all major credit/debit cards, UPI, net banking, and wallets through Razorpay.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
