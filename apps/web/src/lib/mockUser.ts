/**
 * Mock User Helper
 *
 * Initialize a test user for development (DISABLED - using real auth)
 */

import { useAppStore } from '../store/useAppStore';

export const initializeMockUser = () => {
  const { setUnreadAlerts } = useAppStore.getState();

  // Set mock unread alerts count for testing badge
  setUnreadAlerts(3);

  // Note: Mock user is now disabled - using real authentication
  // Uncomment below to re-enable mock user for testing UI without backend
  /*
  const { setUser } = useAppStore.getState();
  setUser({
    id: 'mock-user-123',
    email: 'demo@alphasignal.com',
    name: 'Demo User',
    tier: 'PRO',
  });
  */
};

// Auto-initialize in development
if (import.meta.env.DEV) {
  initializeMockUser();
}
