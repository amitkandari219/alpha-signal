/**
 * Newsletter Signup Component
 *
 * Form for subscribing to weekly/daily market intelligence reports
 * Features: Email validation, sector selection, frequency options
 */

import React, { useState } from 'react';
import { Mail, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuthStore } from '../../store/useAuthStore';

const SUBSCRIBE_NEWSLETTER = gql`
  mutation SubscribeNewsletter($email: String!, $subscribedSectors: [String!]!, $frequency: NewsletterFrequency!) {
    subscribeNewsletter(email: $email, subscribedSectors: $subscribedSectors, frequency: $frequency) {
      id
      email
      isActive
    }
  }
`;

const SECTORS = [
  { id: 'TECHNOLOGY', name: 'Technology' },
  { id: 'FINANCE', name: 'Financial Services' },
  { id: 'HEALTHCARE', name: 'Healthcare' },
  { id: 'ENERGY', name: 'Energy' },
  { id: 'CONSUMER', name: 'Consumer Goods' },
  { id: 'INDUSTRIALS', name: 'Industrials' },
  { id: 'MATERIALS', name: 'Materials' },
  { id: 'UTILITIES', name: 'Utilities' },
  { id: 'REAL_ESTATE', name: 'Real Estate' },
  { id: 'TELECOM', name: 'Telecommunications' },
];

interface NewsletterSignupProps {
  variant?: 'card' | 'banner' | 'modal';
  onDismiss?: () => void;
  onSuccess?: () => void;
}

export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  variant = 'card',
  onDismiss,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [selectedSectors, setSelectedSectors] = useState<string[]>(['TECHNOLOGY', 'FINANCE']);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'DAILY'>('WEEKLY');
  const [emailError, setEmailError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const [subscribeNewsletter, { loading, error }] = useMutation(SUBSCRIBE_NEWSLETTER, {
    onCompleted: () => {
      setShowSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    },
  });

  // Real-time email validation
  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      validateEmail(value);
    } else {
      setEmailError('');
    }
  };

  const toggleSector = (sectorId: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId)
        ? prev.filter((id) => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    if (selectedSectors.length === 0) {
      setEmailError('Please select at least one sector');
      return;
    }

    try {
      await subscribeNewsletter({
        variables: {
          email,
          subscribedSectors: selectedSectors,
          frequency,
        },
      });
    } catch (err) {
      console.error('Newsletter subscription failed:', err);
    }
  };

  // Success State
  if (showSuccess) {
    return (
      <div
        className={`
        bg-gradient-to-br from-signal-green/10 to-signal-blue/10
        border-2 border-signal-green/50 rounded-lg p-8
        ${variant === 'banner' ? 'shadow-sm' : 'shadow-lg'}
      `}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 bg-signal-green/20 rounded-full flex items-center justify-center">
            <Check className="w-6 h-6 text-signal-green" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-text-primary mb-2">
            Welcome to Alpha Signal Intelligence!
          </h3>
          <p className="text-text-secondary">
            Check your inbox for a confirmation email. You'll start receiving{' '}
            {frequency.toLowerCase()} reports soon.
          </p>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div
      className={`
        bg-bg-secondary border-2 rounded-lg relative
        ${variant === 'card' ? 'border-signal-blue/30 shadow-lg' : ''}
        ${variant === 'banner' ? 'border-signal-blue/20 shadow-sm' : ''}
        ${variant === 'modal' ? 'border-border-default' : ''}
      `}
    >
      {/* Dismissible banner */}
      {variant === 'banner' && onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className={variant === 'banner' ? 'p-6' : 'p-8'}>
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-signal-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-signal-blue" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-2">
              Get Weekly Market Intelligence in Your Inbox
            </h3>
            <p className="text-text-secondary">
              Join 10,000+ investors receiving AI-powered reports
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className={`
                w-full px-4 py-3 bg-bg-tertiary border rounded-lg
                text-text-primary placeholder-text-muted
                focus:outline-none focus:ring-2 transition-all
                ${emailError ? 'border-signal-red focus:ring-signal-red/50' : 'border-border-default focus:ring-signal-blue/50'}
              `}
              placeholder="your@email.com"
              disabled={loading}
            />
            {emailError && (
              <p className="text-signal-red text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {emailError}
              </p>
            )}
          </div>

          {/* Sector Selection */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Select Sectors (Choose at least one) *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SECTORS.map((sector) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => toggleSector(sector.id)}
                  className={`
                    px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${
                      selectedSectors.includes(sector.id)
                        ? 'bg-signal-blue/20 border-signal-blue text-signal-blue'
                        : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-muted'
                    }
                  `}
                  disabled={loading}
                >
                  {sector.name}
                </button>
              ))}
            </div>
            {/* Selected Sector Badges */}
            {selectedSectors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedSectors.map((sectorId) => {
                  const sector = SECTORS.find((s) => s.id === sectorId);
                  return (
                    <span
                      key={sectorId}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-signal-blue/10 border border-signal-blue/30 rounded-full text-sm font-medium text-signal-blue"
                    >
                      {sector?.name}
                      <button
                        type="button"
                        onClick={() => toggleSector(sectorId)}
                        className="hover:bg-signal-blue/20 rounded-full p-0.5"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-3">
              Report Frequency *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFrequency('WEEKLY')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                  ${
                    frequency === 'WEEKLY'
                      ? 'bg-signal-green/20 border-signal-green text-signal-green'
                      : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-muted'
                  }
                `}
                disabled={loading}
              >
                Weekly (Recommended)
              </button>
              <button
                type="button"
                onClick={() => setFrequency('DAILY')}
                className={`
                  flex-1 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                  ${
                    frequency === 'DAILY'
                      ? 'bg-signal-green/20 border-signal-green text-signal-green'
                      : 'bg-bg-tertiary border-border-default text-text-secondary hover:border-text-muted'
                  }
                `}
                disabled={loading}
              >
                Daily
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-4">
              <p className="text-signal-red text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error.message || 'Failed to subscribe. Please try again.'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !email || selectedSectors.length === 0}
            className="
              w-full px-6 py-3 bg-signal-blue hover:bg-signal-blue/90
              text-white font-semibold rounded-lg
              transition-all shadow-lg hover:shadow-xl
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                Subscribe to Newsletter
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p className="text-xs text-text-muted text-center">
            By subscribing, you agree to receive market reports via email.
            You can unsubscribe at any time.
          </p>
        </form>
      </div>
    </div>
  );
};
