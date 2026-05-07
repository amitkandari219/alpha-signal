/**
 * Stock Report Page
 *
 * Displays comprehensive AI-powered analysis report for a stock
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Clock,
  TrendingUp,
  AlertTriangle,
  Building2,
  Globe,
  Shield,
  Lightbulb,
  Loader2,
  Calendar,
  DollarSign,
  Target,
  Zap,
  Landmark,
  Users,
  Award,
  Lock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { useAuthStore } from '../store/useAuthStore';
import { GatedContent } from '../components/common/GatedContent';
import { UpgradePrompt } from '../components/common/UpgradePrompt';
import { CollapsiblePanel } from '../components/common/CollapsiblePanel';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { TimelineInfographic } from '../components/reports/infographics/TimelineInfographic';
import { MoatRadar } from '../components/reports/infographics/MoatRadar';
import { BusinessModelCanvas } from '../components/reports/infographics/BusinessModelCanvas';
import { FinancialScorecard } from '../components/reports/infographics/FinancialScorecard';
import { LoadingProgress } from '../components/reports/LoadingProgress';
import { GENERATE_REPORT, TRACK_REPORT_DOWNLOAD } from '../graphql/generatedReports';

interface GeneratedReport {
  id: string;
  symbol: string;
  companyId: string;
  reportType: string;
  title: string;
  timeline: any[];
  businessModel: any;
  financials: any;
  moat: any;
  supplyChain: any;
  catalysts: any;
  govtImpact: any;
  globalTrade: any;
  risks: any;
  aiSummary: any;
  metadata: any;
  generationMetrics: any;
  viewCount: number;
  downloadCount: number;
  status: string;
  generatedAt: string;
  expiresAt?: string;
  lastAccessedAt?: string;
  upgradeRequired?: boolean;
  requiredTier?: string;
  message?: string;
}

// Helper function to map icon names to React components
const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    Users: <Users className="w-5 h-5" />,
    Award: <Award className="w-5 h-5" />,
    DollarSign: <DollarSign className="w-5 h-5" />,
    Lock: <Lock className="w-5 h-5" />,
    TrendingUp: <TrendingUp className="w-5 h-5" />,
  };
  return iconMap[iconName] || <Shield className="w-5 h-5" />;
};

export const StockReport: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');

  // Detect print mode from query parameter
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const isPrintMode = searchParams.get('print') === 'true';

  // Fetch report
  const { data, loading, error, refetch } = useQuery<{ generateReport: GeneratedReport }>(
    GENERATE_REPORT,
    {
      variables: { symbol: symbol?.toUpperCase() },
      skip: !symbol || !user,
    }
  );

  const [trackDownload] = useMutation(TRACK_REPORT_DOWNLOAD);

  const report = data?.generateReport;

  // Debug logging
  useEffect(() => {
    console.log('StockReport Debug:', {
      symbol,
      user: user?.email,
      loading,
      error: error?.message,
      hasData: !!data,
      report: report ? 'exists' : 'null',
      reportKeys: report ? Object.keys(report) : [],
      hasTimeline: !!report?.timeline,
      timelineType: report?.timeline ? typeof report.timeline : 'undefined',
      timelineIsArray: report?.timeline ? Array.isArray(report.timeline) : false,
      timelineLength: report?.timeline ? (Array.isArray(report.timeline) ? report.timeline.length : 'not array') : 0,
      timelineValue: report?.timeline,
      hasBusinessModel: !!report?.businessModel,
      hasFinancials: !!report?.financials,
      hasMoat: !!report?.moat,
      hasMoatAnalysis: !!report?.moat?.analysis,
      hasMoatDimensions: !!report?.moat?.analysis?.dimensions,
    });
  }, [symbol, user, loading, error, data, report]);

  // Handle upgrade required
  useEffect(() => {
    if (report?.upgradeRequired) {
      setShowUpgradeModal(true);
    }
  }, [report?.upgradeRequired]);

  // Add report-ready class for Puppeteer PDF generation
  useEffect(() => {
    if (report && !loading) {
      // Add class after a small delay to ensure all content is rendered
      const timer = setTimeout(() => {
        // Add class to report container for Puppeteer to detect
        const reportContainer = document.querySelector('.report-container');
        if (reportContainer) {
          reportContainer.classList.add('report-ready');
        }
      }, 1000);

      return () => {
        const reportContainer = document.querySelector('.report-container');
        if (reportContainer) {
          reportContainer.classList.remove('report-ready');
        }
        clearTimeout(timer);
      };
    }
  }, [report, loading]);

  const handleDownloadPDF = async (retryCount = 0) => {
    console.log('🎯 Download PDF clicked', { retryCount });

    if (!symbol || isExporting) {
      console.log('❌ Early return - symbol:', symbol, 'isExporting:', isExporting);
      return;
    }

    let toastId: string | undefined;

    try {
      console.log('📝 Starting PDF download process...');
      // Check tier access
      const userTier = user?.tier || 'FREE';
      console.log('👤 User tier:', userTier);

      if (userTier === 'FREE') {
        setShowUpgradeModal(true);
        return;
      }

      // Show loading toast
      toastId = toast.loading('Generating PDF... This may take 30-60 seconds');
      setIsExporting(true);
      setExportProgress('Preparing report data...');

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      // Get token from auth store (preferred) or localStorage (fallback)
      let token: string | null = null;
      let refreshAccessToken: (() => Promise<string | null>) | null = null;

      try {
        const authState = useAuthStore.getState();
        token = authState.accessToken || null;
        refreshAccessToken = authState.refreshAccessToken || null;
        console.log('🔐 Token from auth store:', !!token);
      } catch (storeError) {
        console.error('⚠️  Auth store error:', storeError);
        // Fallback to localStorage
        token = localStorage.getItem('token');
        console.log('🔐 Token from localStorage:', !!token);
      }

      if (!token) {
        token = localStorage.getItem('token');
        console.log('🔐 Final token check:', !!token);
      }

      if (!token) {
        console.error('❌ No token found');
        if (toastId) {
          toast.error('Authentication required', { id: toastId });
        } else {
          toast.error('Authentication required');
        }
        setIsExporting(false);
        setExportProgress('');
        return;
      }

      console.log('📄 Starting PDF generation for:', symbol);
      console.log('🌐 API URL:', API_URL);
      console.log('🔑 Token exists:', !!token);
      console.log('🔄 Retry count:', retryCount);

      setExportProgress('Generating PDF (this may take 30-60 seconds)...');
      toast.loading('Generating PDF... Please wait', { id: toastId });

      // Generate PDF via REST endpoint
      const url = `${API_URL}/api/reports/generate/${symbol.toUpperCase()}`;
      console.log('📡 Fetching:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Send empty JSON body
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData: any = {};
        let errorText = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            console.error('❌ Error response:', errorData);
          } else {
            errorText = await response.text();
            console.error('❌ Error response (text):', errorText);
          }
        } catch (e) {
          console.error('❌ Could not parse error response:', e);
        }

        if (response.status === 403) {
          if (toastId) {
            toast.error('PDF export requires PRO subscription', { id: toastId });
          } else {
            toast.error('PDF export requires PRO subscription');
          }
          setShowUpgradeModal(true);
          setIsExporting(false);
          setExportProgress('');
          return;
        }

        if (response.status === 401) {
          // Token expired - try to refresh once
          if (retryCount === 0 && refreshAccessToken) {
            console.log('🔄 Token expired, attempting refresh...');
            toast.loading('Refreshing session...', { id: toastId });

            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                console.log('✅ Token refreshed successfully');
                // Update localStorage for compatibility
                localStorage.setItem('token', newToken);
                // Retry download with new token
                setIsExporting(false);
                setExportProgress('');
                if (toastId) toast.dismiss(toastId);
                return handleDownloadPDF(retryCount + 1);
              }
            } catch (refreshError) {
              console.error('❌ Token refresh failed:', refreshError);
            }
          }

          if (toastId) {
            toast.error('Session expired. Please login again', { id: toastId });
          } else {
            toast.error('Session expired. Please login again');
          }
          setIsExporting(false);
          setExportProgress('');
          return;
        }

        // Extract error message from various possible formats
        let errorMsg = `HTTP ${response.status}: Failed to generate PDF`;
        if (errorData.error && typeof errorData.error === 'string') {
          errorMsg = errorData.error;
        } else if (errorData.message && typeof errorData.message === 'string') {
          errorMsg = errorData.message;
        } else if (errorText) {
          errorMsg = errorText;
        }

        throw new Error(errorMsg);
      }

      setExportProgress('Downloading PDF...');
      toast.loading('Downloading PDF...', { id: toastId });

      // Download the PDF
      const blob = await response.blob();
      console.log('📦 PDF blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('Generated PDF is empty');
      }

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${symbol}_comprehensive_report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      }, 100);

      // Track download
      if (report?.id) {
        await trackDownload({ variables: { reportId: report.id } }).catch(console.error);
      }

      console.log('✅ PDF downloaded successfully');
      toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error: any) {
      console.error('❌ PDF export failed:', error);
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        error: error,
      });

      // Extract error message safely - ensure it's always a string
      let errorMessage = 'Failed to export PDF. Please try again.';

      try {
        if (error?.message && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (error?.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error?.toString && typeof error.toString === 'function') {
          const str = error.toString();
          if (str !== '[object Object]') {
            errorMessage = str;
          }
        }
      } catch (e) {
        console.error('Failed to extract error message:', e);
        errorMessage = 'Failed to export PDF. Please try again.';
      }

      if (toastId) {
        toast.error(errorMessage, { id: toastId });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Report refreshed');
    } catch (error) {
      toast.error('Failed to refresh report');
    }
  };

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <FileText className="w-16 h-16 mx-auto text-accent-blue mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-text-secondary mb-6">
          You need to be signed in to generate stock reports
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Loader2 className="w-6 h-6 text-accent-blue animate-spin" />
          <p className="text-text-secondary">Generating comprehensive report for {symbol}...</p>
        </div>
        <LoadingSkeleton count={5} height={200} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-signal-red mb-4" />
        <h2 className="text-2xl font-bold mb-2">Failed to Generate Report</h2>
        <p className="text-text-secondary mb-6">{error.message}</p>
        <button
          onClick={() => navigate(`/stock/${symbol}`)}
          className="px-6 py-3 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90"
        >
          Back to Stock Detail
        </button>
      </div>
    );
  }

  if (!report) return null;

  const userTier = user?.tier || 'FREE';
  const hasFullAccess = userTier === 'PRO' || userTier === 'PREMIUM';

  return (
    <>
      {/* Print Mode CSS */}
      {isPrintMode && (
        <style>{`
          @media print, screen {
            /* General Print Styles */
            body {
              background: white !important;
              color: #000 !important;
              font-size: 11pt;
              line-height: 1.5;
            }

            /* Hide interactive elements */
            .no-print { display: none !important; }
            button, .cursor-pointer { cursor: default !important; }

            /* Container styles */
            .report-container {
              max-width: 100% !important;
              padding: 20px !important;
              background: white !important;
              margin: 0 !important;
            }

            /* Page breaks */
            .page-break { page-break-after: always; }
            .page-break-before { page-break-before: always; }
            .avoid-break { page-break-inside: avoid; }

            /* Force all panels to be expanded */
            .overflow-hidden {
              max-height: none !important;
              opacity: 1 !important;
              overflow: visible !important;
            }

            /* Ensure panel content is visible */
            .transition-all {
              transition: none !important;
            }

            /* Headers and titles */
            h1 { font-size: 24pt; margin-bottom: 12pt; }
            h2 { font-size: 18pt; margin-bottom: 10pt; }
            h3 { font-size: 14pt; margin-bottom: 8pt; }
            h4 { font-size: 12pt; margin-bottom: 6pt; }

            /* Infographics and charts */
            svg, canvas {
              max-width: 100%;
              page-break-inside: avoid;
            }

            /* Tables and grids */
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
            }
            tr { page-break-inside: avoid; }

            /* Color adjustments for print */
            .bg-bg-secondary, .bg-bg-tertiary {
              background: #f9f9f9 !important;
              border: 1px solid #ddd !important;
            }

            /* Text colors */
            .text-text-primary { color: #000 !important; }
            .text-text-secondary { color: #333 !important; }
            .text-text-muted { color: #666 !important; }

            /* Signal colors - keep them visible */
            .text-signal-green { color: #059669 !important; }
            .text-signal-red { color: #DC2626 !important; }
            .text-signal-yellow { color: #D97706 !important; }

            /* Spacing */
            .space-y-6 > * + * { margin-top: 24pt; }
            .space-y-4 > * + * { margin-top: 16pt; }
            .space-y-3 > * + * { margin-top: 12pt; }

            /* Remove hover effects */
            *:hover { background: inherit !important; }
          }
        `}</style>
      )}

      <div className={`max-w-6xl mx-auto px-4 py-8 space-y-6 report-container ${isPrintMode ? 'print-mode' : ''}`}>
        {/* Header */}
        {!isPrintMode && (
          <div className="flex items-center justify-between flex-wrap gap-4 no-print">
            <Link
              to={`/stock/${symbol}`}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-accent-blue transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stock Detail
            </Link>

            <div className="flex gap-2 flex-wrap">
            {/* Download PDF Button - PRO/PREMIUM only */}
            <button
              onClick={(e) => {
                e.preventDefault();
                try {
                  handleDownloadPDF().catch(err => {
                    console.error('Unhandled error in handleDownloadPDF:', err);
                    const msg = err?.message || String(err) || 'Failed to download PDF';
                    toast.error(msg);
                  });
                } catch (syncError) {
                  console.error('Synchronous error in button click:', syncError);
                  const msg = syncError?.message || String(syncError) || 'Failed to start download';
                  toast.error(msg);
                }
              }}
              disabled={isExporting || !hasFullAccess}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                isExporting
                  ? 'bg-accent-blue/50 text-white cursor-not-allowed'
                  : hasFullAccess
                  ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
                  : 'bg-bg-tertiary text-text-secondary cursor-not-allowed'
              }`}
              title={!hasFullAccess ? 'Upgrade to PRO to download PDF' : ''}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {hasFullAccess ? 'Download PDF' : 'PDF (PRO)'}
                  </span>
                </>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>

            {/* Refresh Button */}
            {hasFullAccess && (
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-border-default text-text-primary rounded-lg hover:bg-bg-tertiary transition-colors font-medium"
                title="Refresh report data"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
        )}

        {/* Export Progress Indicator */}
        {!isPrintMode && isExporting && (
          <LoadingProgress
            isLoading={isExporting}
            currentStep={exportProgress}
            error={null}
          />
        )}

        {/* PDF Cover Page (Print Mode Only) */}
        {isPrintMode && (
          <div className="page-break avoid-break" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ marginBottom: '40px' }}>
              <h1 style={{ fontSize: '36pt', fontWeight: 'bold', marginBottom: '20px', color: '#1a73e8' }}>
                {report.title}
              </h1>
              <p style={{ fontSize: '16pt', color: '#666', marginBottom: '10px' }}>
                Comprehensive Stock Analysis Report
              </p>
              <p style={{ fontSize: '14pt', color: '#999' }}>
                Generated by Alpha Signal
              </p>
            </div>

            <div style={{ margin: '40px 0', padding: '30px', background: '#f5f5f5', borderRadius: '8px', width: '100%', maxWidth: '600px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '12pt' }}>
                <div>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Symbol</p>
                  <p style={{ fontWeight: 'bold', fontSize: '14pt' }}>{symbol}</p>
                </div>
                <div>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Report Date</p>
                  <p style={{ fontWeight: 'bold', fontSize: '14pt' }}>
                    {new Date(report.generatedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Subscription</p>
                  <p style={{ fontWeight: 'bold', fontSize: '14pt', color: '#1a73e8' }}>{userTier}</p>
                </div>
                <div>
                  <p style={{ color: '#666', marginBottom: '5px' }}>Pages</p>
                  <p style={{ fontWeight: 'bold', fontSize: '14pt' }}>Multi-Page Analysis</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '60px', fontSize: '10pt', color: '#999' }}>
              <p>This report contains proprietary analysis and should be treated as confidential.</p>
              <p style={{ marginTop: '10px' }}>© {new Date().getFullYear()} Alpha Signal. All rights reserved.</p>
            </div>
          </div>
        )}

        {/* Title Section */}
        <div className={`bg-bg-secondary border border-border-default rounded-lg p-8 ${isPrintMode ? 'page-break-before avoid-break' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-accent-blue" />
                <h1 className="text-3xl font-bold">{report.title}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Generated {new Date(report.generatedAt).toLocaleString()}
                </span>
                <span>•</span>
                <span>{report.viewCount} views</span>
              </div>
            </div>
          </div>
        </div>

        {/* Report Sections - Tier Gated */}
        <GatedContent
          feature="profile_full"
          showPreview={userTier === 'FREE'}
          upgradeVariant="inline"
        >
          <div className="space-y-6">
            {/* Section 1: AI Summary */}
            {report.aiSummary && (
              <div className={isPrintMode ? 'page-break-before avoid-break' : ''}>
                <CollapsiblePanel
                  title="AI-Powered Executive Summary"
                  icon={Lightbulb}
                  badge={{ text: 'AI Generated', color: 'purple' }}
                  defaultExpanded={true}
                >
                <div className="space-y-4">
                  {report.aiSummary.businessOverview && (
                    <div>
                      <h4 className="font-semibold mb-2">Business Overview</h4>
                      <p className="text-text-secondary">{JSON.stringify(report.aiSummary.businessOverview)}</p>
                    </div>
                  )}
                  {report.aiSummary.bullCase && (
                    <div>
                      <h4 className="font-semibold text-signal-green mb-2">Bull Case</h4>
                      <p className="text-text-secondary">{JSON.stringify(report.aiSummary.bullCase)}</p>
                    </div>
                  )}
                  {report.aiSummary.bearCase && (
                    <div>
                      <h4 className="font-semibold text-signal-red mb-2">Bear Case</h4>
                      <p className="text-text-secondary">{JSON.stringify(report.aiSummary.bearCase)}</p>
                    </div>
                  )}
                </div>
              </CollapsiblePanel>
              </div>
            )}

            {/* Section 2: Company Journey Timeline (Beautiful Infographic) */}
            {report.timeline && Array.isArray(report.timeline) && report.timeline.length > 0 && (() => {
              console.log('📊 Rendering TimelineInfographic with', report.timeline.length, 'events');
              try {
                return (
                  <div className={`bg-bg-secondary border border-border-default rounded-lg p-6 ${isPrintMode ? 'page-break-before avoid-break' : ''}`}>
                    <TimelineInfographic
                      events={report.timeline}
                      companyName={report.title?.split(' - ')[0] || symbol || ''}
                      foundedYear={
                        report.timeline.find((e: any) =>
                          e.category === 'FOUNDING' || e.title?.toLowerCase().includes('found')
                        )?.year || undefined
                      }
                    />
                  </div>
                );
              } catch (error) {
                console.error('❌ TimelineInfographic crashed:', error);
                return null;
              }
            })()}

            {/* Section 3: Business Model Canvas (Beautiful Infographic) */}
            {report.businessModel && typeof report.businessModel === 'object' && (() => {
              console.log('📊 Rendering BusinessModelCanvas');
              try {
                return (
                  <div className={`bg-bg-secondary border border-border-default rounded-lg p-6 ${isPrintMode ? 'page-break-before avoid-break' : ''}`}>
                    <BusinessModelCanvas
                      data={{
                        description: report.businessModel.description || '',
                        products: report.businessModel.products || [],
                        competitivePosition: report.businessModel.competitivePosition || 'N/A',
                        company: {
                          name: report.title?.split(' - ')[0] || symbol || '',
                          sector: report.businessModel.sector || report.company?.sector || 'Unknown',
                          industry: report.businessModel.industry || report.company?.industry || 'Unknown',
                        },
                        financials: report.financials || {},
                      }}
                    />
                  </div>
                );
              } catch (error) {
                console.error('❌ BusinessModelCanvas crashed:', error);
                return null;
              }
            })()}

            {/* Section 4: Financial Scorecard (Beautiful Infographic) */}
            {report.financials && typeof report.financials === 'object' && (() => {
              console.log('📊 Rendering FinancialScorecard');
              try {
                return (
                  <div className={`bg-bg-secondary border border-border-default rounded-lg p-6 ${isPrintMode ? 'page-break-before avoid-break' : ''}`}>
                    <FinancialScorecard
                      data={report.financials}
                      companyName={report.title?.split(' - ')[0] || symbol || ''}
                    />
                  </div>
                );
              } catch (error) {
                console.error('❌ FinancialScorecard crashed:', error);
                return null;
              }
            })()}

            {/* Section 5: Competitive Moat (Beautiful Infographic) */}
            {report.moat?.analysis?.dimensions && (() => {
              console.log('📊 Rendering MoatRadar');
              try {
                return (
                  <div className={`bg-bg-secondary border border-border-default rounded-lg p-6 ${isPrintMode ? 'page-break-before avoid-break' : ''}`}>
                    <MoatRadar
                      analysis={{
                        ...report.moat.analysis,
                        dimensions: {
                          networkEffects: {
                            ...report.moat.analysis.dimensions.networkEffects,
                            icon: getIconComponent(report.moat.analysis.dimensions.networkEffects?.icon || 'Users'),
                          },
                          brandPower: {
                            ...report.moat.analysis.dimensions.brandPower,
                            icon: getIconComponent(report.moat.analysis.dimensions.brandPower?.icon || 'Award'),
                          },
                          costAdvantage: {
                            ...report.moat.analysis.dimensions.costAdvantage,
                            icon: getIconComponent(report.moat.analysis.dimensions.costAdvantage?.icon || 'DollarSign'),
                          },
                          switchingCosts: {
                            ...report.moat.analysis.dimensions.switchingCosts,
                            icon: getIconComponent(report.moat.analysis.dimensions.switchingCosts?.icon || 'Lock'),
                          },
                          scaleEconomies: {
                            ...report.moat.analysis.dimensions.scaleEconomies,
                            icon: getIconComponent(report.moat.analysis.dimensions.scaleEconomies?.icon || 'TrendingUp'),
                          },
                        },
                      }}
                      companyName={report.title?.split(' - ')[0] || symbol || ''}
                    />
                  </div>
                );
              } catch (error) {
                console.error('❌ MoatRadar crashed:', error);
                return null;
              }
            })()}

            {/* Section 6: Supply Chain Analysis */}
            {report.supplyChain && (report.supplyChain.suppliers || report.supplyChain.customers || report.supplyChain.distribution) && (
              <CollapsiblePanel
                title="Supply Chain & Distribution"
                icon={Building2}
                defaultExpanded={false}
              >
                <div className="space-y-6">
                  {/* Suppliers */}
                  {report.supplyChain.suppliers && Array.isArray(report.supplyChain.suppliers) && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-accent-blue" />
                        Key Suppliers
                      </h4>
                      <div className="space-y-3">
                        {report.supplyChain.suppliers.map((item: any, idx: number) => (
                          <div key={idx} className="bg-bg-tertiary p-4 rounded-lg">
                            <div className="font-medium text-accent-blue mb-2">{item.category}</div>
                            <div className="text-sm text-text-secondary mb-1">
                              {Array.isArray(item.suppliers) ? item.suppliers.join(', ') : item.suppliers}
                            </div>
                            {item.details && (
                              <div className="text-xs text-text-muted mt-2">{item.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customers */}
                  {report.supplyChain.customers && Array.isArray(report.supplyChain.customers) && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-signal-green" />
                        Customer Segments
                      </h4>
                      <div className="space-y-3">
                        {report.supplyChain.customers.map((item: any, idx: number) => (
                          <div key={idx} className="bg-bg-tertiary p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-signal-green">{item.segment}</div>
                              {item.revenue && (
                                <div className="text-xs px-2 py-1 bg-signal-green/20 text-signal-green rounded">
                                  {item.revenue}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-text-secondary mb-1">
                              {Array.isArray(item.customers) ? item.customers.join(', ') : item.customers}
                            </div>
                            {item.details && (
                              <div className="text-xs text-text-muted mt-2">{item.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Distribution */}
                  {report.supplyChain.distribution && Array.isArray(report.supplyChain.distribution) && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-signal-purple" />
                        Distribution Channels
                      </h4>
                      <div className="space-y-3">
                        {report.supplyChain.distribution.map((item: any, idx: number) => (
                          <div key={idx} className="bg-bg-tertiary p-4 rounded-lg">
                            <div className="font-medium text-signal-purple mb-2">{item.channel}</div>
                            {item.reach && (
                              <div className="text-sm text-text-secondary mb-1">{item.reach}</div>
                            )}
                            {item.brands && (
                              <div className="text-xs text-text-muted mt-2">
                                <span className="font-medium">Brands:</span> {item.brands}
                              </div>
                            )}
                            {item.details && (
                              <div className="text-xs text-text-muted mt-1">{item.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsiblePanel>
            )}

            {/* Section 7: Growth Catalysts */}
            {report.catalysts && (
              <CollapsiblePanel
                title="Growth Catalysts"
                icon={Zap}
                defaultExpanded={false}
              >
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary">{JSON.stringify(report.catalysts)}</p>
                </div>
              </CollapsiblePanel>
            )}

            {/* Section 8: Global Trade */}
            {report.globalTrade && (
              <CollapsiblePanel
                title="Global Trade & FX Exposure"
                icon={Globe}
                defaultExpanded={false}
              >
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary">{JSON.stringify(report.globalTrade)}</p>
                </div>
              </CollapsiblePanel>
            )}

            {/* Section 9: Government Impact */}
            {report.govtImpact && (
              <CollapsiblePanel
                title="Government Policies & Impact"
                icon={Landmark}
                defaultExpanded={false}
              >
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary">{JSON.stringify(report.govtImpact)}</p>
                </div>
              </CollapsiblePanel>
            )}

            {/* Section 10: Risks */}
            {report.risks && (
              <CollapsiblePanel
                title="Risk Analysis"
                icon={AlertTriangle}
                badge={{
                  text: `Risk Score: ${report.risks.riskScore || 0}/100`,
                  color: report.risks.riskScore > 50 ? 'red' : 'yellow'
                }}
                defaultExpanded={false}
              >
                <div className="space-y-3">
                  {report.risks.activeFlags?.map((flag: any, idx: number) => (
                    <div key={idx} className="bg-bg-tertiary p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-signal-red" />
                        <h5 className="font-semibold">{flag.flagType}</h5>
                        <span className="text-xs px-2 py-1 bg-signal-red/20 text-signal-red rounded">
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{flag.description}</p>
                    </div>
                  ))}
                  {(!report.risks.activeFlags || report.risks.activeFlags.length === 0) && (
                    <p className="text-text-secondary">No active risk flags identified</p>
                  )}
                </div>
              </CollapsiblePanel>
            )}
          </div>
        </GatedContent>

        {/* Upgrade CTA for FREE users */}
        {!isPrintMode && !hasFullAccess && (
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-8 text-center no-print">
            <h3 className="text-2xl font-bold mb-2">Unlock Full Report</h3>
            <p className="text-text-secondary mb-6">
              Upgrade to PRO to access all report sections, download PDF, and more
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="px-8 py-3 bg-accent-blue text-white rounded-lg font-semibold hover:bg-accent-blue/90"
            >
              Upgrade to PRO
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && report?.upgradeRequired && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Upgrade Required</h3>
            <p className="text-text-secondary mb-6">{report.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue/90"
              >
                Upgrade to {report.requiredTier}
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  navigate(`/stock/${symbol}`);
                }}
                className="flex-1 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-tertiary/80"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StockReport;
