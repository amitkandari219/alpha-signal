import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, Shield, Lock, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../lib/apiClient';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Plan {
  id: string;
  name: string;
  tier: string;
  billingCycle: string;
  regularPrice: number;
  launchPrice: number;
  isLaunchActive: boolean;
  razorpayPlanId: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuthStore();

  const planId = searchParams.get('plan');
  const couponCodeParam = searchParams.get('coupon');

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState(couponCodeParam || '');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (!planId) {
      navigate('/pricing');
      return;
    }

    fetchPlan();
    loadRazorpayScript();
  }, [planId, user]);

  useEffect(() => {
    if (couponCodeParam && plan) {
      validateCoupon();
    }
  }, [couponCodeParam, plan]);

  const loadRazorpayScript = () => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchPlan = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subscription-plans/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setPlan(data.plan);
      } else {
        navigate('/pricing');
      }
    } catch (error) {
      console.error('Error fetching plan:', error);
      navigate('/pricing');
    } finally {
      setLoading(false);
    }
  };

  const validateCoupon = async () => {
    if (!couponCode || !plan) return;

    setCouponError('');
    try {
      const response = await apiClient.post('/billing/validate-coupon', {
        couponCode,
        planId: plan.id,
      });

      if (response.data.valid) {
        setCouponData(response.data.coupon);
      } else {
        setCouponError('Invalid or expired coupon');
        setCouponData(null);
      }
    } catch (error: any) {
      setCouponError(error.response?.data?.error || 'Invalid coupon');
      setCouponData(null);
    }
  };

  const handleCheckout = async () => {
    if (!plan || !user) return;

    setProcessing(true);
    try {
      // Create subscription
      const response = await apiClient.post('/billing/create-subscription', {
        planId: plan.id,
        couponCode: couponData ? couponCode : undefined,
      });

      const { razorpaySubscriptionId, amount, mockMode } = response.data;

      if (mockMode) {
        // Mock mode - simulate success
        setTimeout(() => {
          navigate('/payment-success?mock=true');
        }, 1000);
        return;
      }

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: razorpaySubscriptionId,
        name: 'Alpha Signal',
        description: `${plan.name} Subscription`,
        image: '/logo.png',
        handler: async function (response: any) {
          // Payment successful
          await refreshUser();
          navigate('/payment-success');
        },
        prefill: {
          email: user.email,
          name: user.name || '',
        },
        theme: {
          color: '#3B82F6',
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (priceInPaise: number) => {
    return (priceInPaise / 100).toLocaleString('en-IN');
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    const basePrice = plan.isLaunchActive ? plan.launchPrice : plan.regularPrice;
    if (couponData) {
      return couponData.finalAmount;
    }
    return basePrice;
  };

  const calculateDiscount = () => {
    if (!plan) return 0;
    let total = 0;

    // Launch discount
    if (plan.isLaunchActive) {
      total += plan.regularPrice - plan.launchPrice;
    }

    // Coupon discount
    if (couponData) {
      total += couponData.discountAmount;
    }

    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Pricing
          </button>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Alpha Signal
          </div>
          <div className="w-32" /> {/* Spacer for center alignment */}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Purchase</h1>
          <p className="text-slate-400">You're one step away from unlocking premium features</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="text-sm text-slate-400">
                    {plan.billingCycle === 'MONTHLY' ? 'Monthly' : 'Annual'} Subscription
                  </p>
                </div>
                <span className="text-white font-semibold">
                  ₹{formatPrice(plan.regularPrice)}
                </span>
              </div>

              {plan.isLaunchActive && (
                <div className="flex justify-between text-green-400">
                  <span>Launch Discount (40%)</span>
                  <span>-₹{formatPrice(plan.regularPrice - plan.launchPrice)}</span>
                </div>
              )}

              {couponData && (
                <div className="flex justify-between text-green-400">
                  <span>Coupon ({couponCode})</span>
                  <span>-₹{formatPrice(couponData.discountAmount)}</span>
                </div>
              )}

              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-blue-400">₹{formatPrice(calculateTotal())}</span>
                </div>
                {calculateDiscount() > 0 && (
                  <p className="text-sm text-green-400 text-right mt-1">
                    You save ₹{formatPrice(calculateDiscount())}!
                  </p>
                )}
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Have a coupon code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="EARLYBIRD40"
                  className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={validateCoupon}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Apply
                </button>
              </div>
              {couponError && (
                <p className="text-sm text-red-400 mt-2">{couponError}</p>
              )}
              {couponData && (
                <p className="text-sm text-green-400 mt-2 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Coupon applied successfully!
                </p>
              )}
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg">
              <Shield className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-sm font-medium text-white">Secure Payment</p>
                <p className="text-xs text-slate-400">Powered by Razorpay</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-6">
              <h2 className="text-2xl font-bold text-white mb-6">What's Included</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Full Platform Access</h4>
                    <p className="text-sm text-slate-400">All {plan.tier} features unlocked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Cancel Anytime</h4>
                    <p className="text-sm text-slate-400">No questions asked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Priority Support</h4>
                    <p className="text-sm text-slate-400">Get help when you need it</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-medium">Regular Updates</h4>
                    <p className="text-sm text-slate-400">New features every month</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold text-lg rounded-xl transition flex items-center justify-center gap-3"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Complete Payment
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-400 mt-4">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
