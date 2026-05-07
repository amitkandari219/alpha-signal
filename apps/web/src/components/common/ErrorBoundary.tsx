/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the component tree and displays fallback UI
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(to right, currentColor 1px, transparent 1px),
                  linear-gradient(to bottom, currentColor 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          </div>

          <div className="max-w-2xl w-full relative z-10">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex items-center justify-center">
                <div className="p-4 bg-signal-red/10 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-signal-red" />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-text-primary font-display">
                  Something went wrong
                </h1>
                <p className="text-text-secondary">
                  We encountered an unexpected error. Please try again or return to the dashboard.
                </p>
              </div>

              {/* Error Details - Code-style block */}
              {this.state.error && (
                <div className="bg-bg-secondary border border-border-default rounded-lg p-4 text-left max-w-xl mx-auto">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-default">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-signal-red/30" />
                      <div className="w-3 h-3 rounded-full bg-signal-yellow/30" />
                      <div className="w-3 h-3 rounded-full bg-signal-green/30" />
                    </div>
                    <span className="text-xs text-text-muted font-mono ml-2">Error</span>
                  </div>
                  <pre className="text-xs font-mono text-signal-red overflow-auto max-h-32 whitespace-pre-wrap break-words">
                    {this.state.error.toString()}
                  </pre>
                  {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                    <details className="mt-3 pt-3 border-t border-border-default">
                      <summary className="text-xs font-mono text-text-muted cursor-pointer hover:text-text-secondary">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs font-mono text-text-muted overflow-auto max-h-48 whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={this.handleReset}
                  className="flex items-center gap-2 px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <a
                  href="/dashboard"
                  className="flex items-center gap-2 px-6 py-3 bg-bg-secondary text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors border border-border-default"
                >
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </a>
              </div>

              {/* Report Issue Link */}
              <div className="pt-4">
                <a
                  href="https://github.com/yourusername/alpha-signal/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-text-tertiary hover:text-text-secondary transition-colors underline"
                >
                  Report this issue
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
