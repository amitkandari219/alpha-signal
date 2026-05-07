/**
 * 404 Not Found Page
 *
 * Displayed when user navigates to non-existent route
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const NotFound: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/screener?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, currentColor 1px, transparent 1px),
              linear-gradient(to bottom, currentColor 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in relative z-10">
        {/* Large 404 with gradient */}
        <div className="relative">
          <h1
            className="text-[180px] leading-none font-bold font-display select-none"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-blue) 0%, var(--color-signal-purple) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </h1>
        </div>

        {/* Error message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-text-primary font-display">
            Page not found
          </h2>
          <p className="text-lg text-text-secondary">
            The stock you're looking for might have been delisted
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for stocks..."
              className="w-full pl-12 pr-4 py-3 bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 focus:border-accent-blue transition-all"
            />
          </div>
        </form>

        {/* Action button */}
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-accent-blue hover:bg-accent-blue/90 text-white font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
