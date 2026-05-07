/**
 * Billing & Subscription Page
 *
 * Plan management, billing history, and payment methods
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  CreditCard,
  Crown,
  Check,
  X,
  Download,
  Sparkles,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  currentUserPlan,
  planRenewalDate,
  invoices,
  planFeatures,
  currentUserTier,
} from '../data/mockSettingsData';

const Billing: React.FC = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Plan pricing
  const plans = {
    free: {
      name: 'Free',
      monthly: 0,
      annual: 0,
    },
    pro: {
      name: 'Pro',
      monthly: 499,
      annual: 4790, // 20% discount
    },
    premium: {
      name: 'Premium',
      monthly: 1499,
      annual: 14390, // 20% discount
    },
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get plan button text and state
  const getPlanButton = (tier: 'free' | 'pro' | 'premium') => {
    if (tier === currentUserTier) {
      return {
        text: 'Current Plan',
        disabled: true,
        className: 'w-full px-4 py-3 bg-bg-tertiary text-text-muted rounded-lg cursor-not-allowed',
      };
    } else if (
      (currentUserTier === 'free' && (tier === 'pro' || tier === 'premium')) ||
      (currentUserTier === 'pro' && tier === 'premium')
    ) {
      return {
        text: 'Upgrade',
        disabled: false,
        className: 'w-full px-4 py-3 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors',
      };
    } else {
      return {
        text: 'Downgrade',
        disabled: false,
        className: 'w-full px-4 py-3 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary',
      };
    }
  };

  // Get feature value for cell
  const getFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-signal-green mx-auto" />
      ) : (
        <X className="w-5 h-5 text-text-muted mx-auto" />
      );
    }
    return <span className="text-sm text-text-primary">{value}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <Link to="/settings" className="hover:text-text-primary transition-colors">
          Settings
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-text-primary">Billing</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Billing & Plans</h1>
        <p className="text-text-secondary">Manage your subscription and payment methods</p>
      </div>

      {/* 1. Current Plan Card */}
      <div className="bg-gradient-to-br from-signal-blue/10 via-bg-secondary to-bg-secondary border border-signal-blue/30 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            {currentUserTier === 'premium' ? (
              <div className="p-3 bg-signal-purple/10 rounded-lg">
                <Crown className="w-6 h-6 text-signal-purple" />
              </div>
            ) : currentUserTier === 'pro' ? (
              <div className="p-3 bg-signal-green/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-signal-green" />
              </div>
            ) : (
              <div className="p-3 bg-signal-blue/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-signal-blue" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{currentUserPlan.name} Plan</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-data font-bold text-signal-blue">
                  ₹{currentUserPlan.price.toLocaleString()}
                </span>
                <span className="text-text-muted">/ {currentUserPlan.billingPeriod}</span>
              </div>
            </div>
          </div>
          {currentUserTier !== 'premium' && (
            <Link
              to="#plans"
              className="px-4 py-2 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
            >
              Upgrade
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {currentUserPlan.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
              <Check className="w-4 h-4 text-signal-green flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        {currentUserTier !== 'free' && (
          <div className="flex items-center gap-2 pt-4 border-t border-border-primary text-sm text-text-muted">
            <Calendar className="w-4 h-4" />
            <span>
              Renews on <span className="text-text-primary font-medium">{formatDate(planRenewalDate)}</span>
            </span>
          </div>
        )}
      </div>

      {/* 2. Plan Comparison */}
      <div id="plans">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-text-primary">Choose Your Plan</h2>
          <div className="flex items-center gap-2 p-1 bg-bg-tertiary border border-border-primary rounded-lg">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-signal-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-signal-blue text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Annual discount callout */}
        {billingPeriod === 'annual' && (
          <div className="mb-6 p-4 bg-signal-green/10 border border-signal-green/30 rounded-lg flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-signal-green flex-shrink-0" />
            <p className="text-sm text-text-primary">
              <span className="font-semibold">Save 20% with annual billing</span> — Pay yearly and get 2 months free!
            </p>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Free Plan */}
          <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
            <h3 className="text-xl font-bold text-text-primary mb-2">Free</h3>
            <div className="mb-6">
              <span className="text-4xl font-data font-bold text-text-primary">₹0</span>
              <span className="text-text-muted ml-2">forever</span>
            </div>
            <button
              {...getPlanButton('free')}
              disabled={getPlanButton('free').disabled}
            >
              {getPlanButton('free').text}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-bg-secondary border-2 border-signal-green rounded-lg p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-signal-green text-bg-primary text-xs font-bold rounded-full">
              POPULAR
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Pro</h3>
            <div className="mb-6">
              <span className="text-4xl font-data font-bold text-text-primary">
                ₹{billingPeriod === 'monthly' ? plans.pro.monthly : (plans.pro.annual / 12).toFixed(0)}
              </span>
              <span className="text-text-muted ml-2">/month</span>
              {billingPeriod === 'annual' && (
                <div className="text-sm text-text-muted mt-1">
                  ₹{plans.pro.annual.toLocaleString()} billed annually
                </div>
              )}
            </div>
            <button
              {...getPlanButton('pro')}
              disabled={getPlanButton('pro').disabled}
            >
              {getPlanButton('pro').text}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-bg-secondary border border-signal-purple rounded-lg p-6 relative">
            <div className="absolute -top-3 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-signal-purple text-white text-xs font-bold rounded-full">
              <Crown className="w-3 h-3" />
              Premium
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Premium</h3>
            <div className="mb-6">
              <span className="text-4xl font-data font-bold text-text-primary">
                ₹{billingPeriod === 'monthly' ? plans.premium.monthly : (plans.premium.annual / 12).toFixed(0)}
              </span>
              <span className="text-text-muted ml-2">/month</span>
              {billingPeriod === 'annual' && (
                <div className="text-sm text-text-muted mt-1">
                  ₹{plans.premium.annual.toLocaleString()} billed annually
                </div>
              )}
            </div>
            <button
              {...getPlanButton('premium')}
              disabled={getPlanButton('premium').disabled}
            >
              {getPlanButton('premium').text}
            </button>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border-primary">
            <h3 className="text-lg font-semibold text-text-primary">Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-secondary">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-text-secondary">
                    Free
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-text-secondary">
                    Pro
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-text-secondary">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text-primary">{feature.name}</td>
                    <td className="px-6 py-4 text-center">{getFeatureValue(feature.free)}</td>
                    <td className="px-6 py-4 text-center">{getFeatureValue(feature.pro)}</td>
                    <td className="px-6 py-4 text-center">{getFeatureValue(feature.premium)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Billing History */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-primary">
          <h2 className="text-xl font-semibold text-text-primary">Billing History</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-tertiary border-b border-border-primary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b border-border-primary hover:bg-bg-tertiary transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-text-primary">{invoice.id}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {formatDate(invoice.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-data font-semibold text-text-primary">
                      ₹{invoice.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-signal-green/10 text-signal-green border border-signal-green/30'
                            : invoice.status === 'pending'
                            ? 'bg-signal-yellow/10 text-signal-yellow border border-signal-yellow/30'
                            : 'bg-signal-red/10 text-signal-red border border-signal-red/30'
                        }`}
                      >
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => window.open(invoice.downloadUrl, '_blank')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-signal-blue hover:bg-signal-blue/10 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Payment Method */}
      <div className="bg-bg-secondary border border-border-primary rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Payment Method</h2>

        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-signal-blue/10 mb-4">
            <CreditCard className="w-8 h-8 text-signal-blue" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No payment method added
          </h3>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Add a payment method to upgrade your plan and enjoy premium features. We use Razorpay
            for secure payments.
          </p>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-signal-blue text-white rounded-lg font-medium hover:bg-signal-blue/90 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>
      </div>

      {/* Razorpay Integration Placeholder Modal */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-bg-secondary border border-border-primary rounded-lg p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-text-primary mb-4">
              Add Payment Method
            </h3>
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-signal-blue/10 mb-4">
                <CreditCard className="w-8 h-8 text-signal-blue" />
              </div>
              <h4 className="text-lg font-semibold text-text-primary mb-2">
                Razorpay Integration
              </h4>
              <p className="text-text-secondary mb-6">
                This is a placeholder for Razorpay payment integration. The actual Razorpay SDK
                integration will be implemented in production.
              </p>
              <div className="space-y-3 text-left mb-6">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-signal-green" />
                  Secure payment processing
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-signal-green" />
                  UPI, Cards, NetBanking supported
                </div>
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Check className="w-4 h-4 text-signal-green" />
                  PCI DSS compliant
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg font-medium hover:bg-bg-secondary transition-colors border border-border-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
