/**
 * Theme Toggle Component
 *
 * Switches between light and dark mode
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false
}) => {
  const { theme, toggleTheme } = useThemeStore();

  console.log('[ThemeToggle] Rendering - Current theme:', theme);

  const handleClick = () => {
    console.log('[ThemeToggle] Button clicked! Toggling from', theme);
    toggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-md
        bg-bg-tertiary hover:bg-bg-secondary
        border-2 border-border-default
        text-text-secondary hover:text-text-primary
        transition-all duration-200
        cursor-pointer
        ${className}
      `}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-5 h-5" />
          {showLabel && <span className="text-sm font-medium">Light</span>}
        </>
      ) : (
        <>
          <Moon className="w-5 h-5" />
          {showLabel && <span className="text-sm font-medium">Dark</span>}
        </>
      )}
    </button>
  );
};
