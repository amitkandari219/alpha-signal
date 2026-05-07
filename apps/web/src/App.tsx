/**
 * Main App Component
 *
 * React Router v6 setup with AppShell layout wrapper
 * Includes React Query provider and Error Boundary
 * Performance optimized with lazy loading for major components
 */

import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client';
import { Toaster } from 'react-hot-toast';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DesignSystemDemo } from './pages/DesignSystemDemo';
import { WebSocketInitializer } from './components/websocket/WebSocketInitializer';
import { LoadingPage } from './components/common/LoadingSkeleton';
import { queryClient } from './lib/queryClient';
import { apolloClient } from './lib/apolloClient';

// Critical pages - loaded immediately (public routes)
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Non-critical pages - lazy loaded (protected routes)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Screener = lazy(() => import('./pages/Screener'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const WatchlistDetail = lazy(() => import('./pages/WatchlistDetail'));
const Sectors = lazy(() => import('./pages/Sectors'));
const SectorDetail = lazy(() => import('./pages/SectorDetail'));
const StockDetailPage = lazy(() => import('./pages/StockDetailPage'));
const StockReport = lazy(() => import('./pages/StockReport'));
const MarketTrends = lazy(() => import('./pages/MarketTrends'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Settings = lazy(() => import('./pages/Settings'));
const BillingSettings = lazy(() => import('./pages/BillingSettings'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const Methodology = lazy(() => import('./pages/legal/Methodology'));
const NewsletterUnsubscribe = lazy(() => import('./pages/NewsletterUnsubscribe'));
const NewsletterPreferences = lazy(() => import('./pages/NewsletterPreferences'));

function App() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <QueryClientProvider client={queryClient}>
          {/* WebSocket Connection Manager */}
          <WebSocketInitializer />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
          }}
        />

        <BrowserRouter>
          <Routes>
            {/* Landing Page (public) */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes (public) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Pricing & Checkout (semi-public) - Lazy loaded with Suspense */}
            <Route
              path="/pricing"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <Pricing />
                </Suspense>
              }
            />
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <Checkout />
                </Suspense>
              }
            />
            <Route
              path="/payment-success"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <PaymentSuccess />
                </Suspense>
              }
            />

            {/* Legal Pages (public) - Lazy loaded with Suspense */}
            <Route
              path="/terms"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <TermsOfService />
                </Suspense>
              }
            />
            <Route
              path="/privacy"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <PrivacyPolicy />
                </Suspense>
              }
            />
            <Route
              path="/methodology"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <Methodology />
                </Suspense>
              }
            />

            {/* Newsletter Routes (public unsubscribe, protected preferences) */}
            <Route
              path="/newsletter/unsubscribe"
              element={
                <Suspense fallback={<LoadingPage />}>
                  <NewsletterUnsubscribe />
                </Suspense>
              }
            />

            {/* Main App Routes with AppShell (Protected) - Lazy loaded with Suspense */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              {/* Main Pages */}
              <Route
                path="/dashboard"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Dashboard />
                  </Suspense>
                }
              />

              {/* Stock Detail (with navigation) */}
              <Route
                path="/stock/:symbol"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <StockDetailPage />
                  </Suspense>
                }
              />

              {/* Stock Comprehensive Report */}
              <Route
                path="/stock/:symbol/report"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <StockReport />
                  </Suspense>
                }
              />

              <Route
                path="/screener"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Screener />
                  </Suspense>
                }
              />

              {/* Watchlist Routes */}
              <Route
                path="/watchlist"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Watchlist />
                  </Suspense>
                }
              />
              <Route
                path="/watchlist/:id"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <WatchlistDetail />
                  </Suspense>
                }
              />

              {/* Sector Routes */}
              <Route
                path="/sectors"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Sectors />
                  </Suspense>
                }
              />
              <Route
                path="/sectors/:sectorId"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <SectorDetail />
                  </Suspense>
                }
              />

              {/* Other Pages */}
              <Route
                path="/trends"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <MarketTrends />
                  </Suspense>
                }
              />

              {/* Reports Routes */}
              <Route
                path="/reports"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Reports />
                  </Suspense>
                }
              />
              <Route
                path="/reports/:slug"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <ReportDetail />
                  </Suspense>
                }
              />

              <Route
                path="/portfolio"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Portfolio />
                  </Suspense>
                }
              />
              <Route
                path="/alerts"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Alerts />
                  </Suspense>
                }
              />

              {/* Settings Routes */}
              <Route
                path="/settings"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <Settings />
                  </Suspense>
                }
              />
              <Route
                path="/settings/billing"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <BillingSettings />
                  </Suspense>
                }
              />
              <Route
                path="/settings/newsletter"
                element={
                  <Suspense fallback={<LoadingPage />}>
                    <NewsletterPreferences />
                  </Suspense>
                }
              />

              {/* Design System Demo */}
              <Route path="/design-system" element={<DesignSystemDemo />} />
            </Route>

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </QueryClientProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}

export default App;
