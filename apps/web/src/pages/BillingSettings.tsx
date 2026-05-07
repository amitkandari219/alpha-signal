import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { apiClient } from '../lib/apiClient';

interface Subscription {
  id: string;
  status: string;
  plan_name: string;
  tier: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  coupon_code?: string;
  coupon_discount?: number;
  regular_price: number;
  launch_price: number;
  is_launch_active: boolean;
}

export default function BillingSettings() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthStore();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchSubscriptionStatus();
  }, [user]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await apiClient.get('/billing/status');
      if (response.data.hasSubscription) {
        setSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (cancelAtPeriodEnd: boolean) => {
    setCanceling(true);
    try {
      await apiClient.post('/billing/cancel', { cancelAtPeriodEnd });
      await refreshUser();
      await fetchSubscriptionStatus();
      setShowCancelModal(false);
      alert(
        cancelAtPeriodEnd
          ? 'Subscription will be canceled at the end of the current period'
          : 'Subscription canceled successfully'
      );
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (priceInPaise: number) => {
    return (priceInPaise / 100).toLocaleString('en-IN');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400';
      case 'CANCELLED':
        return 'text-red-400';
      case 'HALTED':
        return 'text-yellow-400';
      case 'EXPIRED':
        return 'text-gray-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Billing & Subscription</h1>

        {/* Current Plan */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Current Plan</h2>
            {user?.tier !== 'FREE' && subscription && (
              <div className="flex items-center gap-2">
                {getStatusIcon(subscription.status)}
                <span className={`font-medium ${getStatusColor(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
            )}
          </div>

          {user?.tier === 'FREE' ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-6">You're currently on the FREE plan</p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition inline-flex items-center gap-2"
              >
                <ArrowUpCircle className="h-5 w-5" />
                Upgrade Now
              </button>
            </div>
          ) : subscription ? (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Plan</p>
                  <p className="text-lg font-semibold text-white">{subscription.plan_name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Billing Cycle</p>
                  <p className="text-lg font-semibold text-white">
                    {subscription.billing_cycle === 'MONTHLY' ? 'Monthly' : 'Annual'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Current Period</p>
                  <p className="text-white">
                    {formatDate(subscription.current_period_start)} -{' '}
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Price</p>
                  <p className="text-lg font-semibold text-white">
                    ₹
                    {formatPrice(
                      subscription.is_launch_active
                        ? subscription.launch_price
                        : subscription.regular_price
                    )}
                    <span className="text-sm text-slate-400">
                      /{subscription.billing_cycle === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  </p>
                </div>
              </div>

              {subscription.coupon_code && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-green-400 font-medium">
                    🎉 Coupon Applied: {subscription.coupon_code} ({subscription.coupon_discount}% off)
                  </p>
                </div>
              )}

              {subscription.cancel_at_period_end && (
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                  <p className="text-yellow-400 font-medium">
                    ⚠️ Your subscription will be canceled on{' '}
                    {formatDate(subscription.current_period_end)}
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-slate-700">
                <button
                  onClick={() => navigate('/pricing')}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Change Plan
                </button>
                {!subscription.cancel_at_period_end && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 font-medium rounded-lg transition"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-400">No active subscription found</p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Payment Method</h2>
            <CreditCard className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-400 mb-4">
            Your payment method is securely stored with Razorpay
          </p>
          <button className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition">
            Update Payment Method
          </button>
        </div>

        {/* Billing History */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Billing History</h2>
            <FileText className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-400 text-center py-8">No payment history available yet</p>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-2xl font-bold text-white mb-4">Cancel Subscription?</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to cancel your subscription? You can choose to cancel
                immediately or at the end of the current billing period.
              </p>
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleCancelSubscription(true)}
                  disabled={canceling}
                  className="w-full px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
                >
                  Cancel at Period End
                </button>
                <button
                  onClick={() => handleCancelSubscription(false)}
                  disabled={canceling}
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
                >
                  Cancel Immediately
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={canceling}
                  className="w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                >
                  Keep Subscription
                </button>
              </div>
              {canceling && (
                <div className="flex items-center justify-center gap-2 text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
