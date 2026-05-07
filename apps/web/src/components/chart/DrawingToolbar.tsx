/**
 * DrawingToolbar Component
 *
 * Vertical toolbar on right edge with 10 drawing tools
 * Tier gating: FREE (HLine only, max 2), PRO (all tools, max 20), PREMIUM (unlimited)
 */

import React, { useState } from 'react';
import {
  MousePointer,
  Minus,
  TrendingUp,
  Percent,
  Square,
  Ruler,
  Type,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Lock,
} from 'lucide-react';
import { useDrawingStore, useDrawingCount, type DrawingType } from '@/store/useDrawingStore';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { UpgradePrompt } from '@/components/common/UpgradePrompt';
import toast from 'react-hot-toast';

interface DrawingToolbarProps {
  symbol: string;
  onClearAll?: () => void;
}

/**
 * Tool configuration
 */
const TOOL_CONFIG: Record<
  DrawingType,
  {
    label: string;
    icon: React.ReactNode;
    shortcut?: string;
    requiresPro?: boolean;
  }
> = {
  cursor: {
    label: 'Select',
    icon: <MousePointer className="w-5 h-5" />,
    shortcut: 'V',
  },
  hline: {
    label: 'Horizontal Line',
    icon: <Minus className="w-5 h-5" />,
    shortcut: 'H',
  },
  trendline: {
    label: 'Trend Line',
    icon: <TrendingUp className="w-5 h-5" />,
    shortcut: 'T',
    requiresPro: true,
  },
  fibonacci: {
    label: 'Fibonacci',
    icon: <Percent className="w-5 h-5" />,
    shortcut: 'F',
    requiresPro: true,
  },
  rectangle: {
    label: 'Rectangle',
    icon: <Square className="w-5 h-5" />,
    shortcut: 'R',
    requiresPro: true,
  },
  measure: {
    label: 'Measure',
    icon: <Ruler className="w-5 h-5" />,
    shortcut: 'M',
    requiresPro: true,
  },
  text: {
    label: 'Text Note',
    icon: <Type className="w-5 h-5" />,
    shortcut: 'N',
    requiresPro: true,
  },
  eraser: {
    label: 'Eraser',
    icon: <Eraser className="w-5 h-5" />,
    shortcut: 'E',
  },
};

/**
 * DrawingToolbar component
 */
export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({ symbol, onClearAll }) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const activeTool = useDrawingStore((state) => state.activeTool);
  const setActiveTool = useDrawingStore((state) => state.setActiveTool);
  const drawingCount = useDrawingCount(symbol);
  const canUndo = useDrawingStore((state) => state.canUndo(symbol));
  const canRedo = useDrawingStore((state) => state.canRedo(symbol));
  const undo = useDrawingStore((state) => state.undo);
  const redo = useDrawingStore((state) => state.redo);
  const clearAllDrawings = useDrawingStore((state) => state.clearAllDrawings);

  // Feature gate check
  const { hasAccess, userTier } = useFeatureGate('data_export');
  const isFreeUser = userTier === 'FREE';
  const isProUser = userTier === 'PRO';
  const isPremiumUser = userTier === 'PREMIUM';

  // Drawing limits per tier
  const MAX_DRAWINGS = isFreeUser ? 2 : isProUser ? 20 : Infinity;

  const handleToolSelect = (tool: DrawingType) => {
    const config = TOOL_CONFIG[tool];

    // Check tier gating
    if (config.requiresPro && isFreeUser) {
      setShowUpgradeModal(true);
      return;
    }

    // Check drawing limit
    if (tool !== 'cursor' && tool !== 'eraser' && drawingCount >= MAX_DRAWINGS) {
      if (isFreeUser) {
        toast.error(`Free users can add up to ${MAX_DRAWINGS} drawings. Upgrade to PRO for more!`);
        setShowUpgradeModal(true);
      } else if (isProUser) {
        toast.error(`PRO users can add up to ${MAX_DRAWINGS} drawings. Upgrade to PREMIUM for unlimited!`);
        setShowUpgradeModal(true);
      }
      return;
    }

    setActiveTool(tool);
  };

  const handleUndo = () => {
    if (canUndo) {
      undo(symbol);
      toast.success('Undone');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo(symbol);
      toast.success('Redone');
    }
  };

  const handleClearAll = () => {
    if (drawingCount === 0) {
      toast('No drawings to clear', { icon: 'ℹ️' });
      return;
    }

    if (showClearConfirm) {
      clearAllDrawings(symbol);
      toast.success('All drawings cleared');
      setShowClearConfirm(false);
      onClearAll?.();
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <>
      {/* Toolbar */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1 shadow-xl">
        {/* Drawing Tools */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-700">
          {(Object.entries(TOOL_CONFIG) as [DrawingType, typeof TOOL_CONFIG[DrawingType]][])
            .filter(([tool]) => tool !== 'eraser') // Eraser goes in second section
            .map(([tool, config]) => {
              const isActive = activeTool === tool;
              const isLocked = config.requiresPro && isFreeUser;

              return (
                <button
                  key={tool}
                  onClick={() => handleToolSelect(tool)}
                  disabled={isLocked}
                  title={`${config.label}${config.shortcut ? ` (${config.shortcut})` : ''}${isLocked ? ' - PRO Feature' : ''}`}
                  className={`
                    relative group w-10 h-10 rounded flex items-center justify-center transition-colors
                    ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : isLocked
                          ? 'text-gray-600 cursor-not-allowed'
                          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  {config.icon}

                  {/* Lock overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded">
                      <Lock className="w-3 h-3 text-yellow-500" />
                    </div>
                  )}

                  {/* Tooltip */}
                  <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {config.label}
                    {config.shortcut && <span className="ml-1 text-gray-400">({config.shortcut})</span>}
                    {isLocked && <span className="ml-1 text-yellow-500">🔒 PRO</span>}
                  </div>
                </button>
              );
            })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 pb-1 border-b border-gray-700">
          {/* Eraser */}
          <button
            onClick={() => handleToolSelect('eraser')}
            title="Eraser (E)"
            className={`
              group w-10 h-10 rounded flex items-center justify-center transition-colors
              ${
                activeTool === 'eraser'
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            <Eraser className="w-5 h-5" />
            <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Eraser (E)
            </div>
          </button>

          {/* Clear All */}
          <button
            onClick={handleClearAll}
            title="Clear All Drawings"
            disabled={drawingCount === 0}
            className={`
              group w-10 h-10 rounded flex items-center justify-center transition-colors
              ${
                showClearConfirm
                  ? 'bg-red-500 text-white animate-pulse'
                  : drawingCount === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
          >
            <Trash2 className="w-5 h-5" />
            <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {showClearConfirm ? 'Click again to confirm' : 'Clear All'}
            </div>
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex flex-col gap-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`
              group w-10 h-10 rounded flex items-center justify-center transition-colors
              ${
                canUndo
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Undo2 className="w-5 h-5" />
            <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Undo (Ctrl+Z)
            </div>
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className={`
              group w-10 h-10 rounded flex items-center justify-center transition-colors
              ${
                canRedo
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 cursor-not-allowed'
              }
            `}
          >
            <Redo2 className="w-5 h-5" />
            <div className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Redo (Ctrl+Shift+Z)
            </div>
          </button>
        </div>

        {/* Drawing Count */}
        {drawingCount > 0 && (
          <div className="px-2 py-1 text-xs text-center">
            <div className="text-gray-400">
              {drawingCount}
              {MAX_DRAWINGS !== Infinity && ` / ${MAX_DRAWINGS}`}
            </div>
            {isFreeUser && drawingCount >= MAX_DRAWINGS && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-yellow-500 hover:text-yellow-400 transition-colors mt-1"
              >
                Upgrade
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradePrompt
          feature="chart_drawings"
          variant="modal"
          requiredTier={isFreeUser ? 'PRO' : 'PREMIUM'}
          message={
            isFreeUser
              ? 'Unlock all drawing tools and add up to 20 drawings per chart'
              : 'Get unlimited drawings and advanced features'
          }
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </>
  );
};
