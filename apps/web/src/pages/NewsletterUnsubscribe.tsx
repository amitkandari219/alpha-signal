/**
 * Newsletter Unsubscribe Page
 *
 * Allows users to unsubscribe from newsletter via email link
 * Route: /newsletter/unsubscribe?email=xxx
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MailX, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { SEO } from '../components/SEO';

const UNSUBSCRIBE_NEWSLETTER = gql`
  mutation UnsubscribeNewsletter($email: String!) {
    unsubscribeNewsletter(email: $email) {
      success
      message
    }
  }
`;

export const NewsletterUnsubscribe: React.FC = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const [confirmed, setConfirmed] = useState(false);

  const [unsubscribe, { loading, error, data }] = useMutation(UNSUBSCRIBE_NEWSLETTER);

  useEffect(() => {
    if (!email) {
      return;
    }
  }, [email]);

  const handleUnsubscribe = async () => {
    if (!email) return;

    try {
      await unsubscribe({
        variables: { email },
      });
      setConfirmed(true);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    }
  };

  // No email provided
  if (!email) {
    return (
      <>
        <SEO
          title="Unsubscribe from Newsletter"
          description="Unsubscribe from Alpha Signal newsletter"
          noindex={true}
        />
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-signal-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-signal-red" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Invalid Link</h1>
            <p className="text-text-secondary mb-6">
              This unsubscribe link is invalid or has expired. Please use the link from your
              newsletter email.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-signal-blue hover:bg-signal-blue/90 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Success state
  if (confirmed && data?.unsubscribeNewsletter?.success) {
    return (
      <>
        <SEO
          title="Unsubscribed Successfully"
          description="You have been unsubscribed from Alpha Signal newsletter"
          noindex={true}
        />
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-signal-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-signal-green" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Successfully Unsubscribed
            </h1>
            <p className="text-text-secondary mb-2">
              You have been removed from our newsletter list.
            </p>
            <p className="text-sm text-text-muted mb-6">
              Email: <span className="font-mono">{email}</span>
            </p>

            <div className="space-y-3">
              <p className="text-sm text-text-secondary">
                Changed your mind? You can resubscribe anytime.
              </p>
              <div className="flex gap-3">
                <Link
                  to="/reports"
                  className="flex-1 px-4 py-2 bg-signal-blue hover:bg-signal-blue/90 text-white font-semibold rounded-lg transition-colors"
                >
                  Browse Reports
                </Link>
                <Link
                  to="/"
                  className="flex-1 px-4 py-2 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary font-semibold rounded-lg border border-border-default transition-colors"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Confirmation form
  return (
    <>
      <SEO
        title="Unsubscribe from Newsletter"
        description="Unsubscribe from Alpha Signal newsletter"
        noindex={true}
      />
      <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-bg-secondary border border-border-default rounded-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-signal-red/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailX className="w-8 h-8 text-signal-red" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Unsubscribe from Newsletter
            </h1>
            <p className="text-text-secondary">
              We're sorry to see you go. Confirm to stop receiving our weekly reports.
            </p>
          </div>

          <div className="bg-bg-tertiary border border-border-default rounded-lg p-4 mb-6">
            <p className="text-sm text-text-muted mb-1">Email Address:</p>
            <p className="font-mono text-text-primary">{email}</p>
          </div>

          {error && (
            <div className="bg-signal-red/10 border border-signal-red/30 rounded-lg p-4 mb-6">
              <p className="text-signal-red text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error.message || 'Failed to unsubscribe. Please try again.'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleUnsubscribe}
              disabled={loading}
              className="w-full px-6 py-3 bg-signal-red hover:bg-signal-red/90 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Unsubscribing...
                </>
              ) : (
                <>
                  <MailX className="w-5 h-5" />
                  Confirm Unsubscribe
                </>
              )}
            </button>

            <Link
              to="/"
              className="w-full px-6 py-3 bg-bg-tertiary hover:bg-bg-tertiary/80 text-text-primary font-semibold rounded-lg border border-border-default transition-colors flex items-center justify-center"
            >
              Cancel
            </Link>
          </div>

          <p className="text-xs text-text-muted text-center mt-6">
            You'll stop receiving all newsletter emails. You can resubscribe anytime from our
            reports page.
          </p>
        </div>
      </div>
    </>
  );
};

export default NewsletterUnsubscribe;
