/**
 * useAlertNotifications Hook
 *
 * Listens for alert notifications and displays toast notifications
 * Returns list of recent alerts
 */

import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useWebSocketStore, AlertNotification } from '../store/useWebSocketStore';

export function useAlertNotifications() {
  const processedAlerts = useRef(new Set<string>());

  // Poll for new alerts using setInterval to avoid reactivity issues
  useEffect(() => {
    const checkForAlerts = () => {
      const store = useWebSocketStore.getState();
      const alerts = store.alerts;

      alerts.forEach((alert) => {
        // Skip if already processed
        if (processedAlerts.current.has(alert.alert_id)) {
          return;
        }

        // Mark as processed
        processedAlerts.current.add(alert.alert_id);

        // Determine icon based on condition
        const icon = alert.condition.includes('ABOVE') ? '📈' : '📉';

        // Show toast notification with success type
        toast.success(
          `${icon} ${alert.stock_symbol}: ${formatAlertMessage(alert)}`,
          {
            duration: 8000,
            position: 'top-right',
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
          }
        );
      });
    };

    // Check immediately
    checkForAlerts();

    // Then poll every 500ms for new alerts
    const intervalId = setInterval(checkForAlerts, 500);

    return () => clearInterval(intervalId);
  }, []);

  // Get reactive values for return
  const alerts = useWebSocketStore((state) => state.alerts);
  const clearAlert = useWebSocketStore((state) => state.clearAlert);
  const status = useWebSocketStore((state) => state.status);

  return {
    alerts,
    clearAlert,
    isConnected: status === 'CONNECTED',
  };
}

function formatAlertMessage(alert: AlertNotification): string {
  const { condition, current_value, threshold } = alert;

  if (condition === 'PRICE_ABOVE') {
    return `Price ₹${current_value.toFixed(2)} crossed above ₹${threshold.toFixed(2)}`;
  } else if (condition === 'PRICE_BELOW') {
    return `Price ₹${current_value.toFixed(2)} fell below ₹${threshold.toFixed(2)}`;
  } else if (condition === 'VOLUME_SPIKE') {
    return `Volume spike detected: ${(current_value / 1000).toFixed(0)}K (threshold: ${(threshold / 1000).toFixed(0)}K)`;
  } else if (condition === 'TECHNICAL_INDICATOR') {
    return `Technical indicator alert triggered`;
  }

  return `Alert triggered for ${alert.stock_symbol}`;
}
