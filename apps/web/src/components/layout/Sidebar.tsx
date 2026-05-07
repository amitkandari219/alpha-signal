/**
 * Sidebar Navigation Component
 *
 * Responsive sidebar: 260px desktop, 64px tablet (icon-only), bottom bar mobile
 * Professional, terminal-like styling
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Filter,
  Star,
  PieChart,
  LineChart,
  Briefcase,
  Bell,
  Settings,
  Crown,
  ChevronLeft,
  Newspaper,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'screener', label: 'Screener', icon: Filter, path: '/screener' },
  { id: 'watchlist', label: 'Watchlist', icon: Star, path: '/watchlist' },
  { id: 'sectors', label: 'Sectors', icon: PieChart, path: '/sectors' },
  { id: 'trends', label: 'Market Trends', icon: LineChart, path: '/trends' },
  { id: 'reports', label: 'Reports', icon: Newspaper, path: '/reports' },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase, path: '/portfolio' },
  { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar, user, unreadAlerts } = useAppStore();

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside
        className={`
          hidden md:flex md:flex-col
          fixed left-0 top-0 h-screen
          bg-bg-secondary border-r border-border-default
          transition-all duration-200 ease-out
          z-30
          ${isSidebarCollapsed ? 'md:w-16' : 'md:w-[260px]'}
        `}
      >
        {/* Logo Area with Collapse Toggle */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border-default">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-signal-purple to-signal-green rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Α</span>
                </div>
                <span className="text-gradient font-bold text-lg">Alpha Signal</span>
              </div>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              className="w-8 h-8 bg-gradient-to-br from-signal-purple to-signal-green rounded-md flex items-center justify-center mx-auto hover:opacity-80 transition-opacity"
              title="Expand sidebar"
            >
              <span className="text-white font-bold text-sm">Α</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `
                flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md
                transition-all duration-200 ease-out
                group
                ${
                  isActive
                    ? 'bg-bg-tertiary text-accent-blue border-l-2 border-accent-blue'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                }
                ${isSidebarCollapsed ? 'justify-center' : ''}
              `
              }
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="relative">
                <item.icon
                  className={`w-5 h-5 ${
                    isSidebarCollapsed ? '' : 'flex-shrink-0'
                  }`}
                />
                {/* Unread Badge for Alerts */}
                {item.id === 'alerts' && unreadAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-signal-red rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {unreadAlerts > 9 ? '9+' : unreadAlerts}
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {/* Unread Badge for Alerts (expanded view) */}
                  {item.id === 'alerts' && unreadAlerts > 0 && (
                    <span className="px-2 py-0.5 bg-signal-red rounded-full text-xs font-semibold text-white">
                      {unreadAlerts}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Tier Section */}
        <div className="mx-2 mb-4 p-3 bg-bg-tertiary border border-border-default rounded-md">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-xs font-medium">Your Plan</span>
                <span
                  className={`
                  px-2 py-0.5 rounded text-xs font-semibold
                  ${user?.tier === 'PREMIUM' ? 'bg-signal-purple/20 text-signal-purple' : ''}
                  ${user?.tier === 'PRO' ? 'bg-signal-green/20 text-signal-green' : ''}
                  ${(!user?.tier || user?.tier === 'FREE') ? 'bg-text-muted/20 text-text-muted' : ''}
                `}
                >
                  {user?.tier || 'FREE'}
                </span>
              </div>
              {(!user?.tier || user?.tier === 'FREE') && (
                <button className="w-full px-3 py-2 bg-accent-blue hover:bg-accent-blue/80 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Crown className="w-4 h-4" />
                  Upgrade to PRO
                </button>
              )}
            </>
          ) : (
            <div className="flex justify-center">
              <Crown
                className={`w-5 h-5 ${
                  user?.tier === 'PREMIUM'
                    ? 'text-signal-purple'
                    : user?.tier === 'PRO'
                    ? 'text-signal-green'
                    : 'text-text-muted'
                }`}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-secondary border-t border-border-default z-30">
        <div className="h-full flex items-center justify-around px-2">
          {navItems.filter(item => ['dashboard', 'screener', 'watchlist', 'reports', 'alerts'].includes(item.id)).map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `
                flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-md
                transition-colors duration-200
                ${
                  isActive
                    ? 'text-accent-blue'
                    : 'text-text-secondary active:text-text-primary'
                }
              `
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
