/**
 * AppShell Layout Wrapper
 *
 * Main layout structure combining Sidebar, Header, and content area
 * Responsive with smooth transitions
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { GlobalStockSearch } from '../search/GlobalStockSearch';
import { DisclaimerBanner } from '../common/DisclaimerBanner';
import { useAppStore } from '../../store/useAppStore';

export const AppShell: React.FC = () => {
  const { isSidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Global Search Modal */}
      <GlobalStockSearch />

      {/* Sidebar */}
      <Sidebar />

      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main
        className={`
          pt-14 pb-24 md:pb-20 flex flex-col min-h-screen
          transition-all duration-200 ease-out
          ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-[260px]'}
        `}
      >
        <div className="container mx-auto px-4 md:px-6 py-6 max-w-[1920px] flex-1">
          {/* 12-column grid container */}
          <div className="w-full">
            <Outlet />
          </div>
        </div>

        {/* Footer - Legal Links */}
        <Footer />
      </main>

      {/* Global Disclaimer Banner - SEBI Compliance */}
      <DisclaimerBanner />
    </div>
  );
};
