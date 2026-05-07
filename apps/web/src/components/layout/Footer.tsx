/**
 * Footer Component - Legal Links and SEBI Disclaimer
 *
 * Displays on every page with links to legal pages
 * Critical SEBI compliance requirement
 */

import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
          <Link
            to="/terms"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
          <span className="text-slate-700">|</span>
          <Link
            to="/privacy"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-700">|</span>
          <Link
            to="/methodology"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Methodology
          </Link>
          <span className="text-slate-700">|</span>
          <a
            href="mailto:contact@alphasignal.in"
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact Us
          </a>
        </div>

        {/* SEBI Disclaimer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">
            © {currentYear} Alpha Signal. All rights reserved.
          </p>
          <p className="text-xs text-amber-400 font-medium">
            ⚠️ Not a SEBI-registered Research Analyst.
          </p>
          <p className="text-xs text-slate-500 max-w-3xl mx-auto leading-relaxed">
            All content is for informational and educational purposes only. Not investment advice.
            Always consult a SEBI-registered financial advisor before making investment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
