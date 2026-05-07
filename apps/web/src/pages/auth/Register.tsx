/**
 * Register Page
 *
 * User registration with name, email, password, and confirmation
 * Dark theme with validation and error handling
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name || name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password || password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms of Service and Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(email, password, name);
      navigate('/dashboard');
    } catch (err: any) {
      setErrors({
        general: err.message || 'Registration failed. Please try again.',
      });
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
            Create Account
          </h1>
          <p className="text-text-secondary">
            Start your journey with Alpha Signal
          </p>
        </div>

        {/* Register Form */}
        <div className="data-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`input peer ${name ? 'has-value' : ''} ${
                  errors.name ? 'border-signal-red' : ''
                }`}
                placeholder=" "
              />
              <label
                htmlFor="name"
                className="absolute left-3 top-3 text-text-secondary transition-all duration-200 pointer-events-none
                  peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-accent-blue peer-focus:bg-bg-secondary peer-focus:px-1
                  peer-[.has-value]:-top-2 peer-[.has-value]:left-2 peer-[.has-value]:text-xs peer-[.has-value]:bg-bg-secondary peer-[.has-value]:px-1"
              >
                Full Name
              </label>
              {errors.name && (
                <p className="mt-1 text-xs text-signal-red">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`input peer ${email ? 'has-value' : ''} ${
                  errors.email ? 'border-signal-red' : ''
                }`}
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
              {errors.email && (
                <p className="mt-1 text-xs text-signal-red">{errors.email}</p>
              )}
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
                className={`input peer ${password ? 'has-value' : ''} ${
                  errors.password ? 'border-signal-red' : ''
                }`}
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
              {errors.password && (
                <p className="mt-1 text-xs text-signal-red">{errors.password}</p>
              )}
              {!errors.password && password && (
                <p className="mt-1 text-xs text-text-muted">
                  Must be at least 8 characters
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`input peer ${confirmPassword ? 'has-value' : ''} ${
                  errors.confirmPassword ? 'border-signal-red' : ''
                }`}
                placeholder=" "
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-3 top-3 text-text-secondary transition-all duration-200 pointer-events-none
                  peer-focus:-top-2 peer-focus:left-2 peer-focus:text-xs peer-focus:text-accent-blue peer-focus:bg-bg-secondary peer-focus:px-1
                  peer-[.has-value]:-top-2 peer-[.has-value]:left-2 peer-[.has-value]:text-xs peer-[.has-value]:bg-bg-secondary peer-[.has-value]:px-1"
              >
                Confirm Password
              </label>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-signal-red">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="p-3 bg-signal-red/10 border border-signal-red/30 rounded-md">
                <p className="text-sm text-signal-red">{errors.general}</p>
              </div>
            )}

            {/* Terms & Privacy Consent - SEBI Compliance */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border-default bg-bg-tertiary text-accent-blue focus:ring-2 focus:ring-accent-blue focus:ring-offset-0"
                />
                <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                  I agree to the{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-accent-blue hover:underline font-medium"
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-accent-blue hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.terms && (
                <p className="text-xs text-signal-red ml-7">{errors.terms}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-border-default">
              <p className="text-text-secondary text-sm">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-accent-blue hover:text-accent-blue/80 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-8">
          Protected by industry-standard encryption
        </p>
      </div>
    </div>
  );
};

export default Register;
