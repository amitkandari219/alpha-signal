/**
 * Application State Store
 *
 * Global state management for sidebar, user preferences, and authentication
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name?: string;
  tier: 'FREE' | 'PRO' | 'PREMIUM';
}

interface AppState {
  // Sidebar state
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // User state
  user: User | null;
  setUser: (user: User | null) => void;

  // Search state
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Notifications
  unreadAlerts: number;
  setUnreadAlerts: (count: number) => void;

  // Preferences
  preferences: {
    theme: 'dark' | 'light';
    compactMode: boolean;
    defaultTimeframe: '1D' | '1W' | '1M' | '3M' | '1Y';
  };
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Sidebar defaults
      isSidebarCollapsed: false,
      toggleSidebar: () =>
        set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ isSidebarCollapsed: collapsed }),

      // User defaults
      user: null,
      setUser: (user) => set({ user }),

      // Search defaults
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      // Notifications defaults
      unreadAlerts: 0,
      setUnreadAlerts: (count) => set({ unreadAlerts: count }),

      // Preferences defaults
      preferences: {
        theme: 'dark',
        compactMode: false,
        defaultTimeframe: '1D',
      },
      updatePreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
    }),
    {
      name: 'alpha-signal-storage',
      partialize: (state) => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        user: state.user,
        preferences: state.preferences,
      }),
    }
  )
);
