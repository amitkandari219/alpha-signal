/**
 * useRealtimePrice Hook
 *
 * Subscribes to real-time price updates for a stock symbol
 * Returns live price data with change detection for animations
 */

import { useEffect, useState, useRef } from 'react';
import { useWebSocketStore, PriceUpdate } from '../store/useWebSocketStore';

export type PriceDirection = 'up' | 'down' | 'neutral';

export interface RealtimePrice extends PriceUpdate {
  direction: PriceDirection;
  isLive: boolean;
}

export function useRealtimePrice(symbol: string | undefined) {
  const [priceData, setPriceData] = useState<RealtimePrice | null>(null);
  const [flashAnimation, setFlashAnimation] = useState<PriceDirection>('neutral');
  const previousPriceRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);

  // Subscribe to symbol on mount
  useEffect(() => {
    if (!symbol) return;

    const store = useWebSocketStore.getState();
    store.subscribeToSymbol(symbol);

    return () => {
      const store = useWebSocketStore.getState();
      store.unsubscribeFromSymbol(symbol);
    };
  }, [symbol]);

  // Poll for updates using setInterval to avoid Zustand reactivity issues
  useEffect(() => {
    if (!symbol) return;

    const checkForUpdates = () => {
      const store = useWebSocketStore.getState();
      const update = store.priceUpdates.get(symbol);
      const status = store.status;

      if (!update) return;

      // Only process if this is a new update (different timestamp)
      if (previousTimestampRef.current === update.timestamp) {
        return;
      }

      previousTimestampRef.current = update.timestamp;

      // Detect price direction
      let direction: PriceDirection = 'neutral';
      if (previousPriceRef.current !== null) {
        if (update.price > previousPriceRef.current) {
          direction = 'up';
          setFlashAnimation('up');
          setTimeout(() => setFlashAnimation('neutral'), 600);
        } else if (update.price < previousPriceRef.current) {
          direction = 'down';
          setFlashAnimation('down');
          setTimeout(() => setFlashAnimation('neutral'), 600);
        }
      }

      previousPriceRef.current = update.price;

      setPriceData({
        ...update,
        direction,
        isLive: status === 'CONNECTED',
      });
    };

    // Check immediately
    checkForUpdates();

    // Then poll every 100ms for updates
    const intervalId = setInterval(checkForUpdates, 100);

    return () => clearInterval(intervalId);
  }, [symbol]);

  const status = useWebSocketStore((state) => state.status);

  return {
    price: priceData,
    isConnected: status === 'CONNECTED',
    isConnecting: status === 'CONNECTING',
    flashAnimation,
  };
}
