/**
 * Live Price Component with Flash Animation
 *
 * Displays real-time price with green/red flash on change
 */

import { useRealtimePrice, PriceDirection } from '../../hooks/useRealtimePrice';
import { ArrowUp, ArrowDown } from 'lucide-react';
import clsx from 'clsx';

interface LivePriceProps {
  symbol: string;
  className?: string;
  showChange?: boolean;
  showVolume?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LivePrice({
  symbol,
  className,
  showChange = true,
  showVolume = false,
  size = 'md',
}: LivePriceProps) {
  const { price, isConnected, flashAnimation } = useRealtimePrice(symbol);

  if (!price) {
    return (
      <div className={clsx('animate-pulse', className)}>
        <div className="h-8 bg-neutral-700 rounded w-32" />
      </div>
    );
  }

  const isPositive = price.change >= 0;

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Price with flash animation */}
      <div className="flex flex-col">
        <div
          className={clsx(
            'font-semibold transition-all duration-200',
            {
              'text-2xl': size === 'sm',
              'text-3xl': size === 'md',
              'text-4xl': size === 'lg',
            },
            // Flash animation
            {
              'text-success-400': flashAnimation === 'up',
              'text-danger-400': flashAnimation === 'down',
              'text-white': flashAnimation === 'neutral',
            }
          )}
        >
          ₹{price.price.toFixed(2)}
        </div>

        {/* Connection indicator */}
        {!isConnected && (
          <span className="text-xs text-neutral-500">Delayed</span>
        )}
      </div>

      {/* Change percentage */}
      {showChange && (
        <div
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
            {
              'bg-success-500/10 text-success-400': isPositive,
              'bg-danger-500/10 text-danger-400': !isPositive,
            }
          )}
        >
          {isPositive ? (
            <ArrowUp className="w-4 h-4" />
          ) : (
            <ArrowDown className="w-4 h-4" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {price.change_pct.toFixed(2)}%
          </span>
        </div>
      )}

      {/* Volume */}
      {showVolume && price.volume && (
        <div className="text-sm text-neutral-400">
          Vol: {(price.volume / 1000).toFixed(0)}K
        </div>
      )}
    </div>
  );
}

// Alternative compact version for lists
export function LivePriceCompact({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  const { price, flashAnimation } = useRealtimePrice(symbol);

  if (!price) {
    return <div className="h-6 bg-neutral-700 rounded w-20 animate-pulse" />;
  }

  const isPositive = price.change >= 0;

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <span
        className={clsx('font-medium transition-colors duration-200', {
          'text-success-400': flashAnimation === 'up',
          'text-danger-400': flashAnimation === 'down',
          'text-white': flashAnimation === 'neutral',
        })}
      >
        ₹{price.price.toFixed(2)}
      </span>
      <span
        className={clsx('text-sm', {
          'text-success-400': isPositive,
          'text-danger-400': !isPositive,
        })}
      >
        {isPositive ? '+' : ''}
        {price.change_pct.toFixed(2)}%
      </span>
    </div>
  );
}
