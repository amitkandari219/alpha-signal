/**
 * Newsletter Preferences Page
 *
 * Protected page for authenticated users to manage newsletter preferences
 * Route: /settings/newsletter
 */

import React, { useState, useEffect } from 'react';
import { Mail, Check, AlertCircle, Loader2, X } from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import { useAuthStore } from '../store/useAuthStore';
import { SEO } from '../components/SEO';

const GET_NEWSLETTER_PREFERENCES = gql`
  query GetNewsletterPreferences {
    myNewsletterPreferences {
      id
      email
      subscribedSectors
      frequency
      isActive
      subscribedAt
    }
  }
`;

const UPDATE_NEWSLETTER_PREFERENCES = gql`
  mutation UpdateNewsletterPreferences($subscribedSectors: [String!]!, $frequency: NewsletterFrequency!) {
    updateNewsletterPreferences(subscribedSectors: $subscribedSectors, frequency: $frequency) {
      id
      subscribedSectors
      frequency
      isActive
    }
  }
`;

const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeNewsletter($email: String!) {
    unsubscribeNewsletter(email: $email) {
      success
      message
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

export const NewsletterPreferences: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<'WEEKLY' | 'DAILY'>('WEEKLY');
  const [showSuccess, setShowSuccess] = useState(false);

  const { data, loading: loadingPrefs } = useQuery(GET_NEWSLETTER_PREFERENCES);

  const [updatePreferences, { loading: updating, error: updateError }] = useMutation(
    UPDATE_NEWSLETTER_PREFERENCES,
    {
      onCompleted: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    }
  );

  const [unsubscribe, { loading: unsubscribing }] = useMutation(UNSUBSCRIBE_NEWSLETTER, {
    onCompleted: () => {
      window.location.href = '/';
    },
  });

  // Load preferences
  useEffect(() => {
    if (data?.myNewsletterPreferences) {
      const prefs = data.myNewsletterPreferences;
      setSelectedSectors(prefs.subscribedSectors || []);
      setFrequency(prefs.frequency || 'WEEKLY');
    }
  }, [data]);

  const toggleSector = (sectorId: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sectorId) ? prev.filter((id) => id !== sectorId) : [...prev, sectorId]
    );
  };

  const handleSavePreferences = async () => {
    if (selectedSectors.length === 0) {
      return;
    }

    try {
      await updatePreferences({
        variables: {
          subscribedSectors: selectedSectors,
          frequency,
        },
      });
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user?.email) return;

    if (
      !confirm(
        'Are you sure you want to unsubscribe from all newsletter emails? You can resubscribe anytime.'
      )
    ) {
      return;
    }

    try {
      await unsubscribe({
        variables: { email: user.email },
      });
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  };

  if (loadingPrefs) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-bg-secondary border border-border-default rounded-lg p-8 animate-pulse">
          <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-bg-tertiary rounded w-full" />
            <div className="h-4 bg-bg-tertiary rounded w-5/6" />
            <div className="h-4 bg-bg-tertiary rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  const preferences = data?.myNewsletterPreferences;
  const isSubscribed = preferences?.isActive;

  return (
    <>
      <SEO
        title="Newsletter Preferences"
        description="Manage your Alpha Signal newsletter subscription preferences"
        noindex={true}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Newsletter Preferences</h1>
          <p className="text-text-secondary">
            Customize your market intelligence report subscriptions
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-signal-green/10 border border-signal-green/30 rounded-lg p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-signal-green" />
            <p className="text-signal-green font-medium">Preferences updated successfully!</p>
          </div>
        )}

        {/* Not Subscribed State */}
        {!isSubscribed && (
          <div className="bg-bg-secondary border border-border-default rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-signal-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-signal-blue" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              You're not subscribed to our newsletter
            </h2>
            <p className="text-text-secondary mb-6">
              Subscribe to receive weekly market intelligence reports directly in your inbox.
            </p>
            <a
              href="/reports"
              className="inline-flex items-center justify-center px-6 py-3 bg-signal-blue hover:bg-signal-blue/90 text-white font-semibold rounded-lg transition-colors"
            >
              Subscribe Now
            </a>
          </div>
        )}

        {/* Subscribed State */}
        {isSubscribed && (
          <div className="space-y-6">
            {/* Subscription Status */}
            <div className="bg-signal-green/10 border border-signal-green/30 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-signal-green" />
                <div>
                  <p className="font-semibold text-text-primary">Active Subscription</p>
                  <p className="text-sm text-text-secondary">
                    Subscribed on{' '}
                    {preferences?.subscribedAt
                      ? new Date(preferences.subscribedAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Email Address
              </label>
              <div className="px-4 py-3 bg-bg-tertiary border border-border-default rounded-lg">
                <p className="font-mono text-text-primary">{preferences?.email || user?.email}</p>
              </div>
            </div>

            {/* Sector Preferences */}
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Subscribed Sectors *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
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
                  >
                    {sector.name}
                  </button>
                ))}
              </div>

              {/* Selected Badges */}
              {selectedSectors.length > 0 && (
                <div className="flex flex-wrap gap-2">
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
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Frequency Preferences */}
            <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
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
                >
                  Daily
                </button>
              </div>
            </div>

            {/* Error Message */}
            {updateError && (
              <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-4">
                <p className="text-signal-red text-sm flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {updateError.message || 'Failed to update preferences. Please try again.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSavePreferences}
                disabled={updating || selectedSectors.length === 0}
                className="flex-1 px-6 py-3 bg-signal-blue hover:bg-signal-blue/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* Unsubscribe Section */}
            <div className="bg-bg-secondary border border-signal-red/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Unsubscribe from Newsletter
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                You'll stop receiving all newsletter emails. You can resubscribe anytime from our
                reports page.
              </p>
              <button
                onClick={handleUnsubscribe}
                disabled={unsubscribing}
                className="px-6 py-2 bg-signal-red/20 hover:bg-signal-red/30 text-signal-red font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {unsubscribing ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NewsletterPreferences;
