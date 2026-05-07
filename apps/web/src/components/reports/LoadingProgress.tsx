/**
 * Loading Progress Component
 *
 * Shows step-by-step progress during PDF generation
 * Makes long wait times (30-60s) more tolerable
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle } from 'lucide-react';

interface Step {
  id: string;
  label: string;
  estimatedDuration: number; // in seconds
}

interface LoadingProgressProps {
  isLoading: boolean;
  currentStep?: string;
  error?: string | null;
}

const EXPORT_STEPS: Step[] = [
  { id: 'prepare', label: 'Preparing report data', estimatedDuration: 5 },
  { id: 'fetch', label: 'Fetching financial data', estimatedDuration: 8 },
  { id: 'analyze', label: 'Running AI analysis', estimatedDuration: 12 },
  { id: 'render', label: 'Rendering infographics', estimatedDuration: 10 },
  { id: 'generate', label: 'Generating PDF', estimatedDuration: 15 },
  { id: 'finalize', label: 'Finalizing document', estimatedDuration: 5 },
];

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  isLoading,
  currentStep,
  error,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Auto-progress through steps based on estimated duration
  useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0);
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) return;

    let cumulativeTime = 0;
    for (let i = 0; i < EXPORT_STEPS.length; i++) {
      cumulativeTime += EXPORT_STEPS[i].estimatedDuration;
      if (elapsedTime < cumulativeTime) {
        setActiveStepIndex(i);
        break;
      }
    }
  }, [elapsedTime, isLoading]);

  if (!isLoading) return null;

  const totalEstimatedTime = EXPORT_STEPS.reduce((sum, step) => sum + step.estimatedDuration, 0);
  const progressPercentage = Math.min(100, (elapsedTime / totalEstimatedTime) * 100);

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">
          Generating PDF Report
        </h3>
        <span className="text-sm text-text-secondary">
          {elapsedTime}s / ~{totalEstimatedTime}s
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-blue transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {EXPORT_STEPS.map((step, index) => {
          const isCompleted = index < activeStepIndex;
          const isActive = index === activeStepIndex;
          const isPending = index > activeStepIndex;

          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 transition-all duration-300 ${
                isActive ? 'scale-105' : ''
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {isCompleted && (
                  <CheckCircle2 className="w-5 h-5 text-signal-green" />
                )}
                {isActive && (
                  <Loader2 className="w-5 h-5 text-accent-blue animate-spin" />
                )}
                {isPending && (
                  <Circle className="w-5 h-5 text-text-muted" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-accent-blue'
                      : isCompleted
                      ? 'text-signal-green'
                      : 'text-text-muted'
                  }`}
                >
                  {step.label}
                  {isActive && '...'}
                  {isCompleted && ' ✓'}
                </p>
              </div>

              {/* Duration */}
              {isActive && (
                <span className="text-xs text-text-secondary">
                  ~{step.estimatedDuration}s
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-6 p-4 bg-signal-red/10 border border-signal-red/30 rounded-lg">
          <p className="text-sm text-signal-red font-medium">Error: {error}</p>
        </div>
      )}

      {/* Info Note */}
      <div className="mt-6 p-4 bg-accent-blue/10 border border-accent-blue/20 rounded-lg">
        <p className="text-xs text-text-secondary">
          <strong className="text-text-primary">Please don't close this page.</strong>{' '}
          PDF generation requires rendering the entire report with all infographics and data visualizations.
          {progressPercentage > 90 && ' Almost done!'}
        </p>
      </div>
    </div>
  );
};
