/**
 * Login Page
 *
 * Email + password authentication with "Remember me" option
 * Dark theme with floating labels and validation
 */

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);

      // Redirect to intended page or dashboard
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-signal-purple to-signal-green rounded-lg mb-4">
            <span className="text-white font-bold text-2xl">Α</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary">
            Sign in to continue to Alpha Signal
          </p>
        </div>

        {/* Login Form */}
        <div className="data-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`input peer ${email ? 'has-value' : ''}`}
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-3 text-text-secondary transition-all duration-200 pointer-events-none
                  peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-accent-blue peer-focus:bg-bg-secondary peer-focus:px-1
                  peer-[.has-value]:-top-2 peer-[.has-value]:left-2 peer-[.has-value]:text-xs peer-[.has-value]:bg-bg-secondary peer-[.has-value]:px-1"
              >
                Email Address
              </label>
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={`input peer ${password ? 'has-value' : ''}`}
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-3 text-text-secondary transition-all duration-200 pointer-events-none
                  peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-accent-blue peer-focus:bg-bg-secondary peer-focus:px-1
                  peer-[.has-value]:-top-2 peer-[.has-value]:left-2 peer-[.has-value]:text-xs peer-[.has-value]:bg-bg-secondary peer-[.has-value]:px-1"
              >
                Password
              </label>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border-default bg-bg-tertiary text-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-offset-0"
                />
                <span className="text-sm text-text-secondary">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-accent-blue hover:text-accent-blue/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-signal-red/10 border border-signal-red/30 rounded-md">
                <p className="text-sm text-signal-red">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-4 border-t border-border-default">
              <p className="text-text-secondary text-sm">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
