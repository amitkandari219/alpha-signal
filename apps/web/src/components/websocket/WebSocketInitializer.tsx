/**
 * WebSocket Initializer
 *
 * Connects to WebSocket servers when user is authenticated
 * Disconnects when user logs out
 */

import { useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useWebSocketStore } from '../../store/useWebSocketStore';
import { useAlertNotifications } from '../../hooks/useAlertNotifications';

export function WebSocketInitializer() {
  const { isAuthenticated, accessToken } = useAuthStore();

  // Initialize alert notifications (will show toasts)
  useAlertNotifications();

  // Connect/disconnect based on auth state
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      // Disconnect if not authenticated
      const { status, disconnect } = useWebSocketStore.getState();
      if (status !== 'DISCONNECTED') {
        console.log('🔌 Disconnecting WebSocket (not authenticated)...');
        disconnect();
      }
      return;
    }

    // Connect if authenticated
    const { status, connect } = useWebSocketStore.getState();
    if (status === 'DISCONNECTED') {
      console.log('🔌 Initializing WebSocket connection...');
      connect(accessToken);
    }

    // Cleanup on unmount only
    return () => {
      console.log('🔌 WebSocketInitializer unmounting, disconnecting...');
      useWebSocketStore.getState().disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return null; // This component doesn't render anything
}
