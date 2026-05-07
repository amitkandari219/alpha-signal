/**
 * Drawing Store
 *
 * Manages chart drawings with undo/redo functionality and localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Drawing tool types
export type DrawingType =
  | 'cursor'
  | 'hline'
  | 'trendline'
  | 'fibonacci'
  | 'rectangle'
  | 'measure'
  | 'text'
  | 'eraser';

// Base drawing interface
export interface BaseDrawing {
  id: string;
  type: DrawingType;
  color: string;
  createdAt: number;
}

// Horizontal line drawing
export interface HLineDrawing extends BaseDrawing {
  type: 'hline';
  price: number;
  date?: string; // Optional: if line should only appear from this date
}

// Trend line drawing
export interface TrendLineDrawing extends BaseDrawing {
  type: 'trendline';
  startDate: string;
  startPrice: number;
  endDate: string;
  endPrice: number;
}

// Fibonacci retracement drawing
export interface FibonacciDrawing extends BaseDrawing {
  type: 'fibonacci';
  startDate: string;
  startPrice: number;
  endDate: string;
  endPrice: number;
  levels: number[]; // [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
}

// Rectangle drawing
export interface RectangleDrawing extends BaseDrawing {
  type: 'rectangle';
  startDate: string;
  startPrice: number;
  endDate: string;
  endPrice: number;
  fillOpacity: number; // 0-1
}

// Measure tool drawing
export interface MeasureDrawing extends BaseDrawing {
  type: 'measure';
  startDate: string;
  startPrice: number;
  endDate: string;
  endPrice: number;
}

// Text annotation drawing
export interface TextDrawing extends BaseDrawing {
  type: 'text';
  date: string;
  price: number;
  text: string;
  fontSize: number;
}

// Union type for all drawing types
export type Drawing =
  | HLineDrawing
  | TrendLineDrawing
  | FibonacciDrawing
  | RectangleDrawing
  | MeasureDrawing
  | TextDrawing;

// Drawing state per symbol
interface DrawingState {
  // Drawings organized by symbol
  drawingsBySymbol: Record<string, Drawing[]>;

  // Active drawing tool
  activeTool: DrawingType;

  // Selected drawing ID for editing
  selectedDrawingId: string | null;

  // Current symbol being drawn on
  currentSymbol: string | null;

  // Temporary drawing being created (not yet finalized)
  tempDrawing: Drawing | null;

  // Undo/redo stacks per symbol
  undoStacks: Record<string, Drawing[][]>;
  redoStacks: Record<string, Drawing[][]>;

  // Drawing settings
  defaultColor: string;
  defaultFillOpacity: number;

  // Actions
  setActiveTool: (tool: DrawingType) => void;
  setCurrentSymbol: (symbol: string) => void;

  // Drawing CRUD
  addDrawing: (symbol: string, drawing: Drawing) => void;
  updateDrawing: (symbol: string, drawingId: string, updates: Partial<Drawing>) => void;
  removeDrawing: (symbol: string, drawingId: string) => void;
  clearAllDrawings: (symbol: string) => void;

  // Selection
  selectDrawing: (drawingId: string | null) => void;

  // Temporary drawing (during creation)
  setTempDrawing: (drawing: Drawing | null) => void;
  finalizeTempDrawing: (symbol: string) => void;

  // Undo/redo
  undo: (symbol: string) => void;
  redo: (symbol: string) => void;
  canUndo: (symbol: string) => boolean;
  canRedo: (symbol: string) => boolean;

  // Settings
  setDefaultColor: (color: string) => void;
  setDefaultFillOpacity: (opacity: number) => void;

  // Get drawings for a symbol
  getDrawings: (symbol: string) => Drawing[];
}

// Default colors for different drawing types
export const DEFAULT_DRAWING_COLORS: Record<DrawingType, string> = {
  cursor: '#3b82f6',
  hline: '#8b5cf6',
  trendline: '#3b82f6',
  fibonacci: '#f59e0b',
  rectangle: '#10b981',
  measure: '#ef4444',
  text: '#6366f1',
  eraser: '#f43f5e',
};

// Generate unique ID for drawings
const generateId = () => `drawing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

// Helper to push state to undo stack
const pushToUndoStack = (
  undoStacks: Record<string, Drawing[][]>,
  symbol: string,
  drawings: Drawing[]
): Record<string, Drawing[][]> => {
  const symbolStack = undoStacks[symbol] || [];
  return {
    ...undoStacks,
    [symbol]: [...symbolStack, drawings],
  };
};

export const useDrawingStore = create<DrawingState>()(
  persist(
    (set, get) => ({
      drawingsBySymbol: {},
      activeTool: 'cursor',
      selectedDrawingId: null,
      currentSymbol: null,
      tempDrawing: null,
      undoStacks: {},
      redoStacks: {},
      defaultColor: DEFAULT_DRAWING_COLORS.trendline,
      defaultFillOpacity: 0.1,

      setActiveTool: (tool: DrawingType) => {
        set({ activeTool: tool, selectedDrawingId: null });
        console.log('[DrawingStore] Active tool changed to:', tool);
      },

      setCurrentSymbol: (symbol: string) => {
        set({ currentSymbol: symbol, selectedDrawingId: null });
      },

      addDrawing: (symbol: string, drawing: Drawing) => {
        const state = get();
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        // Push current state to undo stack
        const newUndoStacks = pushToUndoStack(state.undoStacks, symbol, currentDrawings);

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: [...currentDrawings, { ...drawing, id: drawing.id || generateId() }],
          },
          undoStacks: newUndoStacks,
          redoStacks: {
            ...state.redoStacks,
            [symbol]: [], // Clear redo stack when new action is performed
          },
        });

        console.log('[DrawingStore] Added drawing:', drawing.type, 'to', symbol);
      },

      updateDrawing: (symbol: string, drawingId: string, updates: Partial<Drawing>) => {
        const state = get();
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        // Push current state to undo stack
        const newUndoStacks = pushToUndoStack(state.undoStacks, symbol, currentDrawings);

        const updatedDrawings = currentDrawings.map((d) =>
          d.id === drawingId ? { ...d, ...updates } : d
        );

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: updatedDrawings,
          },
          undoStacks: newUndoStacks,
          redoStacks: {
            ...state.redoStacks,
            [symbol]: [],
          },
        });

        console.log('[DrawingStore] Updated drawing:', drawingId);
      },

      removeDrawing: (symbol: string, drawingId: string) => {
        const state = get();
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        // Push current state to undo stack
        const newUndoStacks = pushToUndoStack(state.undoStacks, symbol, currentDrawings);

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: currentDrawings.filter((d) => d.id !== drawingId),
          },
          undoStacks: newUndoStacks,
          redoStacks: {
            ...state.redoStacks,
            [symbol]: [],
          },
          selectedDrawingId: state.selectedDrawingId === drawingId ? null : state.selectedDrawingId,
        });

        console.log('[DrawingStore] Removed drawing:', drawingId);
      },

      clearAllDrawings: (symbol: string) => {
        const state = get();
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        if (currentDrawings.length === 0) return;

        // Push current state to undo stack
        const newUndoStacks = pushToUndoStack(state.undoStacks, symbol, currentDrawings);

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: [],
          },
          undoStacks: newUndoStacks,
          redoStacks: {
            ...state.redoStacks,
            [symbol]: [],
          },
          selectedDrawingId: null,
        });

        console.log('[DrawingStore] Cleared all drawings for:', symbol);
      },

      selectDrawing: (drawingId: string | null) => {
        set({ selectedDrawingId: drawingId });
      },

      setTempDrawing: (drawing: Drawing | null) => {
        set({ tempDrawing: drawing });
      },

      finalizeTempDrawing: (symbol: string) => {
        const state = get();
        if (state.tempDrawing) {
          get().addDrawing(symbol, state.tempDrawing);
          set({ tempDrawing: null });
        }
      },

      undo: (symbol: string) => {
        const state = get();
        const undoStack = state.undoStacks[symbol] || [];

        if (undoStack.length === 0) return;

        const previousState = undoStack[undoStack.length - 1];
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        // Push current state to redo stack
        const redoStack = state.redoStacks[symbol] || [];

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: previousState,
          },
          undoStacks: {
            ...state.undoStacks,
            [symbol]: undoStack.slice(0, -1),
          },
          redoStacks: {
            ...state.redoStacks,
            [symbol]: [...redoStack, currentDrawings],
          },
          selectedDrawingId: null,
        });

        console.log('[DrawingStore] Undo performed for:', symbol);
      },

      redo: (symbol: string) => {
        const state = get();
        const redoStack = state.redoStacks[symbol] || [];

        if (redoStack.length === 0) return;

        const nextState = redoStack[redoStack.length - 1];
        const currentDrawings = state.drawingsBySymbol[symbol] || [];

        // Push current state to undo stack
        const undoStack = state.undoStacks[symbol] || [];

        set({
          drawingsBySymbol: {
            ...state.drawingsBySymbol,
            [symbol]: nextState,
          },
          undoStacks: {
            ...state.undoStacks,
            [symbol]: [...undoStack, currentDrawings],
          },
          redoStacks: {
            ...state.redoStacks,
            [symbol]: redoStack.slice(0, -1),
          },
          selectedDrawingId: null,
        });

        console.log('[DrawingStore] Redo performed for:', symbol);
      },

      canUndo: (symbol: string) => {
        const undoStack = get().undoStacks[symbol] || [];
        return undoStack.length > 0;
      },

      canRedo: (symbol: string) => {
        const redoStack = get().redoStacks[symbol] || [];
        return redoStack.length > 0;
      },

      setDefaultColor: (color: string) => {
        set({ defaultColor: color });
      },

      setDefaultFillOpacity: (opacity: number) => {
        set({ defaultFillOpacity: opacity });
      },

      getDrawings: (symbol: string) => {
        return get().drawingsBySymbol[symbol] || [];
      },
    }),
    {
      name: 'alpha-signal-chart-drawings',
      // Only persist drawings, not temporary state
      partialize: (state) => ({
        drawingsBySymbol: state.drawingsBySymbol,
        defaultColor: state.defaultColor,
        defaultFillOpacity: state.defaultFillOpacity,
      }),
    }
  )
);

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook to get drawings for current symbol
 */
export function useCurrentSymbolDrawings(symbol: string): Drawing[] {
  return useDrawingStore((state) => state.drawingsBySymbol[symbol] || []);
}

/**
 * Hook to get drawing count for a symbol
 */
export function useDrawingCount(symbol: string): number {
  const drawings = useDrawingStore((state) => state.drawingsBySymbol[symbol] || []);
  return drawings.length;
}

/**
 * Hook to check if a tool is the active tool
 */
export function useIsActiveTool(tool: DrawingType): boolean {
  return useDrawingStore((state) => state.activeTool === tool);
}
