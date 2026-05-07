/**
 * Header Component
 *
 * Fixed header with logo, global search (Cmd+K), and user menu
 * Height: 56px, professional terminal-like styling
 */

import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, User, ChevronDown, LogOut, Crown } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { ThemeToggle } from '../common/ThemeToggle';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { setSearchOpen, isSidebarCollapsed } = useAppStore();
  const { user, logout } = useAuthStore();

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen]);

  const getTierBadge = (tier?: string) => {
    if (!tier || tier === 'FREE') return null;
    return (
      <span
        className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold
        ${tier === 'PREMIUM' ? 'bg-signal-purple/20 text-signal-purple' : ''}
        ${tier === 'PRO' ? 'bg-signal-green/20 text-signal-green' : ''}
      `}
      >
        {tier === 'PREMIUM' && <Crown className="w-3 h-3" />}
        {tier}
      </span>
    );
  };

  return (
    <header
      className={`
        fixed top-0 right-0 h-14 z-20
        bg-bg-secondary border-b border-border-default
        transition-all duration-200 ease-out
        ${isSidebarCollapsed ? 'md:left-16' : 'md:left-[260px]'}
        left-0
      `}
    >
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Mobile Logo (visible only on mobile) */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-signal-purple to-signal-green rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">Α</span>
          </div>
        </div>

        {/* Search Bar */}
        <button
          onClick={() => setSearchOpen(true)}
          className="
            flex-1 max-w-md md:max-w-lg
            flex items-center gap-3
            px-4 py-2 rounded-md
            bg-bg-tertiary border border-border-default
            text-text-secondary
            hover:border-signal-purple/50 hover:text-text-primary
            transition-all duration-200
            group
          "
        >
          <Search className="w-4 h-4 text-text-secondary group-hover:text-signal-purple transition-colors" />
          <span className="flex-1 text-left text-sm">Search stocks, sectors...</span>
          <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-1 bg-bg-secondary border border-border-default rounded text-xs font-mono text-text-muted">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Connection Status */}
        <div className="hidden md:block">
          <ConnectionStatus />
        </div>

        {/* Theme Toggle */}
        <div className="hidden md:block">
          <ThemeToggle />
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3 ml-4">
          {user ? (
            <div className="group relative">
              <button
                className="
                  flex items-center gap-2 px-3 py-2 rounded-md
                  hover:bg-bg-tertiary transition-colors duration-200
                "
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-signal-purple to-signal-green flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start">
                    <span className="text-sm font-medium text-text-primary">
                      {user.name || 'User'}
                    </span>
                    {getTierBadge(user.tier)}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-text-secondary hidden md:block" />
              </button>

              {/* Dropdown Menu */}
              <div className="
                absolute right-0 top-full mt-2 w-56
                bg-bg-secondary border border-border-default rounded-lg
                shadow-2xl
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200
              ">
                <div className="p-3 border-b border-border-default">
                  <p className="text-sm font-medium text-text-primary">
                    {user.email}
                  </p>
                  {getTierBadge(user.tier) && (
                    <div className="mt-1">{getTierBadge(user.tier)}</div>
                  )}
                </div>
                <div className="py-2">
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    Profile Settings
                  </Link>
                  <Link
                    to="/settings/billing"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                  >
                    Billing & Plans
                  </Link>
                </div>
                <div className="border-t border-border-default py-2">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-signal-red hover:bg-bg-tertiary transition-colors"
                    onClick={async () => {
                      await logout();
                      navigate('/');
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm bg-signal-purple hover:bg-signal-purple/90 text-white rounded-md transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
