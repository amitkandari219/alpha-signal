/**
 * ChartSharing Component
 *
 * Screenshot, social sharing, and CSV export functionality
 * - Screenshot with watermark (FREE+)
 * - Copy chart link with settings encoded
 * - Share to Twitter/X, WhatsApp, LinkedIn
 * - CSV Export (PREMIUM only)
 */

import React, { useState } from 'react';
import { Camera, Share2, Link as LinkIcon, Download, Lock, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useChartStore } from '@/store/useChartStore';
import type { OHLCVData } from '@/utils/technicalIndicators';

interface ChartSharingProps {
  symbol: string;
  period: string;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  chartData?: OHLCVData[];
  indicators?: Record<string, number[]>;
}

/**
 * ChartSharing component
 */
export const ChartSharing: React.FC<ChartSharingProps> = ({
  symbol,
  period,
  chartContainerRef,
  chartData,
  indicators,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const chartType = useChartStore((state) => state.chartType);
  const activeMAs = useChartStore((state) => state.activeMAs);
  const activeIndicators = useChartStore((state) => state.activeIndicators);

  // Feature gate for CSV export
  const { hasAccess: hasPremium, userTier } = useFeatureGate('data_export');
  const isPremium = userTier === 'PREMIUM';

  /**
   * Capture chart as PNG with watermark
   */
  const handleScreenshot = async () => {
    if (!chartContainerRef.current) {
      toast.error('Chart not ready');
      return;
    }

    setIsCapturing(true);

    try {
      // Capture chart with html2canvas
      const canvas = await html2canvas(chartContainerRef.current, {
        scale: 2, // High quality
        backgroundColor: '#0f1419', // Dark background
        logging: false,
        useCORS: true,
      });

      // Add watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Bottom-right watermark
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.fillText('Alpha Signal | alphasignal.in', canvas.width - 20, canvas.height - 20);

        // Top-left: Symbol and Period
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'left';
        ctx.fillText(`${symbol} • ${period}`, 20, 40);

        // Top-left: Date
        ctx.font = '18px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 20, 70);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${symbol}_${period}_chart_${format(new Date(), 'yyyy-MM-dd')}.png`;
          link.click();
          URL.revokeObjectURL(url);

          toast.success('Chart screenshot saved!');
        }
      });
    } catch (error) {
      console.error('Screenshot failed:', error);
      toast.error('Failed to capture screenshot');
    } finally {
      setIsCapturing(false);
      setIsOpen(false);
    }
  };

  /**
   * Copy chart link with settings encoded
   */
  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      symbol,
      period,
      chartType,
      mas: Object.entries(activeMAs)
        .filter(([_, active]) => active)
        .map(([ma]) => ma)
        .join(','),
      indicators: activeIndicators.join(','),
    });

    const url = `${baseUrl}/stock/${symbol}?${params.toString()}`;

    navigator.clipboard.writeText(url);
    toast.success('Chart link copied to clipboard!');
    setIsOpen(false);
  };

  /**
   * Share to social media
   */
  const handleSocialShare = (platform: 'twitter' | 'whatsapp' | 'linkedin') => {
    const text = `Check out ${symbol} on Alpha Signal`;
    const url = `${window.location.origin}/stock/${symbol}`;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    setIsOpen(false);
  };

  /**
   * Export chart data as CSV
   */
  const handleCSVExport = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    if (!chartData || chartData.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      // Build CSV header
      const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume'];

      // Add active indicators to headers
      if (activeMAs.sma20) headers.push('SMA20');
      if (activeMAs.sma50) headers.push('SMA50');
      if (activeMAs.sma100) headers.push('SMA100');
      if (activeMAs.sma200) headers.push('SMA200');
      if (activeMAs.ema20) headers.push('EMA20');
      if (activeMAs.vwap) headers.push('VWAP');

      if (activeIndicators.includes('rsi')) headers.push('RSI');
      if (activeIndicators.includes('macd')) headers.push('MACD', 'MACD_Signal', 'MACD_Histogram');
      if (activeIndicators.includes('stochastic')) headers.push('Stoch_K', 'Stoch_D');
      if (activeIndicators.includes('adx')) headers.push('ADX');
      if (activeIndicators.includes('obv')) headers.push('OBV');
      if (activeIndicators.includes('atr')) headers.push('ATR');

      // Build CSV rows
      const rows = chartData.map((point, index) => {
        const row = [
          point.time,
          point.open.toString(),
          point.high.toString(),
          point.low.toString(),
          point.close.toString(),
          point.volume.toString(),
        ];

        // Add indicator values
        if (activeMAs.sma20 && indicators?.sma20) row.push(indicators.sma20[index]?.toString() || '');
        if (activeMAs.sma50 && indicators?.sma50) row.push(indicators.sma50[index]?.toString() || '');
        if (activeMAs.sma100 && indicators?.sma100) row.push(indicators.sma100[index]?.toString() || '');
        if (activeMAs.sma200 && indicators?.sma200) row.push(indicators.sma200[index]?.toString() || '');
        if (activeMAs.ema20 && indicators?.ema20) row.push(indicators.ema20[index]?.toString() || '');
        if (activeMAs.vwap && indicators?.vwap) row.push(indicators.vwap[index]?.toString() || '');

        if (activeIndicators.includes('rsi') && indicators?.rsi) row.push(indicators.rsi[index]?.toString() || '');
        if (activeIndicators.includes('macd') && indicators?.macd) {
          row.push(indicators.macd[index]?.toString() || '');
          row.push(indicators.macdSignal?.[index]?.toString() || '');
          row.push(indicators.macdHistogram?.[index]?.toString() || '');
        }
        if (activeIndicators.includes('stochastic') && indicators?.stochK) {
          row.push(indicators.stochK[index]?.toString() || '');
          row.push(indicators.stochD?.[index]?.toString() || '');
        }
        if (activeIndicators.includes('adx') && indicators?.adx) row.push(indicators.adx[index]?.toString() || '');
        if (activeIndicators.includes('obv') && indicators?.obv) row.push(indicators.obv[index]?.toString() || '');
        if (activeIndicators.includes('atr') && indicators?.atr) row.push(indicators.atr[index]?.toString() || '');

        return row;
      });

      // Create CSV content
      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${symbol}_data_${period}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('CSV exported successfully!');
      setIsOpen(false);
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <>
      <div className="relative">
        {/* Screenshot Button */}
        <button
          onClick={handleScreenshot}
          disabled={isCapturing}
          title="Screenshot Chart"
          className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCapturing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
        </button>

        {/* Share Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Share Chart"
          className={`p-2 rounded-lg transition-colors ${
            isOpen ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700/50 text-gray-400 hover:text-white'
          }`}
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Share Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

            {/* Dropdown Content */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
              <div className="p-2">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy Chart Link
                </button>

                {/* Twitter/X */}
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  Share on Twitter/X
                </button>

                {/* WhatsApp */}
                <button
                  onClick={() => handleSocialShare('whatsapp')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                  Share on WhatsApp
                </button>

                {/* LinkedIn */}
                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  Share on LinkedIn
                </button>

                {/* Divider */}
                <div className="my-2 border-t border-gray-700" />

                {/* CSV Export */}
                <button
                  onClick={handleCSVExport}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    isPremium
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                  {!isPremium && <Lock className="w-3 h-3 ml-auto text-yellow-500" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="data_export"
          variant="modal"
          requiredTier="PREMIUM"
          message="Export chart data as CSV with all indicators"
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};
