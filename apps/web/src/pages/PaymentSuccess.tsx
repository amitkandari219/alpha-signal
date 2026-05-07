import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Receipt, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuthStore } from '../store/useAuthStore';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuthStore();
  const isMock = searchParams.get('mock') === 'true';

  useEffect(() => {
    // Refresh user data to get updated tier
    refreshUser();

    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });

      // Fire from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900/20 to-slate-900">
      {/* Navigation Header */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Alpha Signal
          </div>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full">
        <div className="bg-slate-800/50 backdrop-blur border-2 border-green-500/50 rounded-3xl p-12 text-center">
          {/* Success Icon */}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full border-4 border-green-500">
            <CheckCircle className="h-12 w-12 text-green-400" />
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold text-white mb-4">
            Payment Successful! 🎉
          </h1>
          <p className="text-xl text-slate-300 mb-8">
            Welcome to {user?.tier} tier! Your account has been upgraded.
          </p>

          {isMock && (
            <div className="mb-8 p-4 bg-amber-900/20 border border-amber-500/30 rounded-xl">
              <p className="text-amber-400 text-sm">
                ⚠️ This was a mock payment for testing purposes
              </p>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-slate-900/50 rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">What happens next?</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium">Instant Access</h3>
                  <p className="text-sm text-slate-400">
                    All premium features are unlocked immediately
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Receipt className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium">Invoice Sent</h3>
                  <p className="text-sm text-slate-400">
                    Check your email for the GST invoice and receipt
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium">Manage Subscription</h3>
                  <p className="text-sm text-slate-400">
                    Update billing info or cancel anytime from settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              Start Exploring
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/settings/billing')}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
            >
              <Settings className="h-5 w-5" />
              Manage Billing
            </button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Need help? Contact us at{' '}
              <a href="mailto:support@alphasignal.com" className="text-blue-400 hover:underline">
                support@alphasignal.com
              </a>
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
