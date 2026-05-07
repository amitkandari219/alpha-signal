/**
 * DrawingCanvas Component
 *
 * Interactive SVG overlay for drawing tools with mouse handlers
 * Supports: HLine, TrendLine, Fibonacci, Rectangle, Measure, Text
 * Includes: Selection, resize handles, right-click context menu, keyboard shortcuts
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { X, Copy, Trash2, Palette } from 'lucide-react';
import {
  useDrawingStore,
  useCurrentSymbolDrawings,
  type Drawing,
  type HLineDrawing,
  type TrendLineDrawing,
  type FibonacciDrawing,
  type RectangleDrawing,
  type MeasureDrawing,
  type TextDrawing,
  DEFAULT_DRAWING_COLORS,
} from '@/store/useDrawingStore';
import { ChartCoordinateMapper } from '@/utils/chartCoordinates';
import toast from 'react-hot-toast';

interface DrawingCanvasProps {
  symbol: string;
  coordinateMapper: ChartCoordinateMapper | null;
}

/**
 * DrawingCanvas component
 */
export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ symbol, coordinateMapper }) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; drawingId: string } | null>(null);

  const activeTool = useDrawingStore((state) => state.activeTool);
  const selectedDrawingId = useDrawingStore((state) => state.selectedDrawingId);
  const selectDrawing = useDrawingStore((state) => state.selectDrawing);
  const addDrawing = useDrawingStore((state) => state.addDrawing);
  const removeDrawing = useDrawingStore((state) => state.removeDrawing);
  const updateDrawing = useDrawingStore((state) => state.updateDrawing);
  const setActiveTool = useDrawingStore((state) => state.setActiveTool);
  const defaultColor = useDrawingStore((state) => state.defaultColor);
  const drawings = useCurrentSymbolDrawings(symbol);

  if (!coordinateMapper) return null;

  const dimensions = coordinateMapper.getDimensions();

  // Mouse down - start drawing
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'cursor' || activeTool === 'eraser') return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if in bounds
    if (!coordinateMapper.isInBounds(x, y)) return;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  // Mouse move - update current point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPoint) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Clamp to bounds
    const clamped = coordinateMapper.clampToBounds(x, y);
    setCurrentPoint(clamped);
  };

  // Mouse up - finalize drawing
  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) {
      setIsDrawing(false);
      return;
    }

    // Convert SVG coordinates to chart coordinates
    const start = coordinateMapper.svgToChart(startPoint.x, startPoint.y);
    const end = coordinateMapper.svgToChart(currentPoint.x, currentPoint.y);

    if (!start || !end) {
      setIsDrawing(false);
      return;
    }

    // Create drawing based on active tool
    let newDrawing: Drawing | null = null;
    const id = `drawing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    switch (activeTool) {
      case 'hline':
        newDrawing = {
          id,
          type: 'hline',
          price: end.price,
          color: defaultColor,
          createdAt: Date.now(),
        } as HLineDrawing;
        break;

      case 'trendline':
        newDrawing = {
          id,
          type: 'trendline',
          startDate: start.date,
          startPrice: start.price,
          endDate: end.date,
          endPrice: end.price,
          color: defaultColor,
          createdAt: Date.now(),
        } as TrendLineDrawing;
        break;

      case 'fibonacci':
        newDrawing = {
          id,
          type: 'fibonacci',
          startDate: start.date,
          startPrice: start.price,
          endDate: end.date,
          endPrice: end.price,
          levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
          color: defaultColor,
          createdAt: Date.now(),
        } as FibonacciDrawing;
        break;

      case 'rectangle':
        newDrawing = {
          id,
          type: 'rectangle',
          startDate: start.date,
          startPrice: start.price,
          endDate: end.date,
          endPrice: end.price,
          fillOpacity: 0.1,
          color: defaultColor,
          createdAt: Date.now(),
        } as RectangleDrawing;
        break;

      case 'measure':
        newDrawing = {
          id,
          type: 'measure',
          startDate: start.date,
          startPrice: start.price,
          endDate: end.date,
          endPrice: end.price,
          color: defaultColor,
          createdAt: Date.now(),
        } as MeasureDrawing;
        break;

      case 'text':
        const text = prompt('Enter text:');
        if (text) {
          newDrawing = {
            id,
            type: 'text',
            date: end.date,
            price: end.price,
            text,
            fontSize: 12,
            color: defaultColor,
            createdAt: Date.now(),
          } as TextDrawing;
        }
        break;
    }

    if (newDrawing) {
      addDrawing(symbol, newDrawing);
      toast.success('Drawing added');
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);

    // Return to cursor tool after drawing
    if (activeTool !== 'hline') {
      setActiveTool('cursor');
    }
  };

  // Click on drawing
  const handleDrawingClick = (drawingId: string) => {
    if (activeTool === 'eraser') {
      removeDrawing(symbol, drawingId);
      toast.success('Drawing removed');
    } else if (activeTool === 'cursor') {
      selectDrawing(drawingId);
    }
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent, drawingId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, drawingId });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected drawing
      if (e.key === 'Delete' && selectedDrawingId) {
        removeDrawing(symbol, selectedDrawingId);
        selectDrawing(null);
        toast.success('Drawing deleted');
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        selectDrawing(null);
        setActiveTool('cursor');
      }

      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          useDrawingStore.getState().undo(symbol);
        }
        if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          useDrawingStore.getState().redo(symbol);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [symbol, selectedDrawingId]);

  // Close context menu on click outside
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <>
      <svg
        ref={canvasRef}
        className="absolute inset-0"
        style={{ zIndex: 30, cursor: getCursor(activeTool) }}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Render existing drawings */}
        {drawings.map((drawing) => (
          <DrawingRenderer
            key={drawing.id}
            drawing={drawing}
            mapper={coordinateMapper}
            isSelected={drawing.id === selectedDrawingId}
            onClick={() => handleDrawingClick(drawing.id)}
            onContextMenu={(e) => handleContextMenu(e, drawing.id)}
          />
        ))}

        {/* Render temporary drawing being created */}
        {isDrawing && startPoint && currentPoint && (
          <TempDrawingRenderer
            tool={activeTool}
            startPoint={startPoint}
            currentPoint={currentPoint}
            mapper={coordinateMapper}
            color={defaultColor}
          />
        )}
      </svg>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              // Duplicate drawing logic
              const drawing = drawings.find((d) => d.id === contextMenu.drawingId);
              if (drawing) {
                const newDrawing = { ...drawing, id: `drawing_${Date.now()}`, createdAt: Date.now() };
                addDrawing(symbol, newDrawing as Drawing);
                toast.success('Drawing duplicated');
              }
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>

          <button
            onClick={() => {
              removeDrawing(symbol, contextMenu.drawingId);
              toast.success('Drawing deleted');
              closeContextMenu();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </>
  );
};

// ============================================================================
// DRAWING RENDERERS
// ============================================================================

interface DrawingRendererProps {
  drawing: Drawing;
  mapper: ChartCoordinateMapper;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const DrawingRenderer: React.FC<DrawingRendererProps> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  switch (drawing.type) {
    case 'hline':
      return <HLineRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    case 'trendline':
      return <TrendLineRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    case 'fibonacci':
      return <FibonacciRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    case 'rectangle':
      return <RectangleRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    case 'measure':
      return <MeasureRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    case 'text':
      return <TextRenderer drawing={drawing} mapper={mapper} isSelected={isSelected} onClick={onClick} onContextMenu={onContextMenu} />;
    default:
      return null;
  }
};

// HLine Renderer
const HLineRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: HLineDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const y = mapper.priceToY(drawing.price);
  if (y === null) return null;

  const dimensions = mapper.getDimensions();

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      <line
        x1={dimensions.left}
        y1={y}
        x2={dimensions.width - dimensions.right}
        y2={y}
        stroke={drawing.color}
        strokeWidth={isSelected ? 3 : 2}
        strokeDasharray="6,4"
        opacity={0.8}
      />
      <text
        x={dimensions.width - dimensions.right + 5}
        y={y + 4}
        fontSize={11}
        fill={drawing.color}
        fontWeight="600"
      >
        {drawing.price.toFixed(2)}
      </text>
    </g>
  );
};

// TrendLine Renderer
const TrendLineRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: TrendLineDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const start = mapper.chartToSVG(drawing.startDate, drawing.startPrice);
  const end = mapper.chartToSVG(drawing.endDate, drawing.endPrice);

  if (!start || !end) return null;

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={drawing.color}
        strokeWidth={isSelected ? 3 : 2}
        opacity={0.8}
      />
      {isSelected && (
        <>
          <circle cx={start.x} cy={start.y} r={4} fill={drawing.color} />
          <circle cx={end.x} cy={end.y} r={4} fill={drawing.color} />
        </>
      )}
    </g>
  );
};

// Fibonacci Renderer
const FibonacciRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: FibonacciDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const start = mapper.chartToSVG(drawing.startDate, drawing.startPrice);
  const end = mapper.chartToSVG(drawing.endDate, drawing.endPrice);

  if (!start || !end) return null;

  const priceDiff = drawing.endPrice - drawing.startPrice;
  const dimensions = mapper.getDimensions();

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      {drawing.levels.map((level) => {
        const price = drawing.startPrice + priceDiff * level;
        const y = mapper.priceToY(price);
        if (y === null) return null;

        return (
          <g key={level}>
            <line
              x1={Math.min(start.x, end.x)}
              y1={y}
              x2={Math.max(start.x, end.x)}
              y2={y}
              stroke={drawing.color}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="2,2"
              opacity={0.6}
            />
            <text x={Math.max(start.x, end.x) + 5} y={y + 4} fontSize={10} fill={drawing.color}>
              {(level * 100).toFixed(1)}% ({price.toFixed(2)})
            </text>
          </g>
        );
      })}
    </g>
  );
};

// Rectangle Renderer
const RectangleRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: RectangleDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const start = mapper.chartToSVG(drawing.startDate, drawing.startPrice);
  const end = mapper.chartToSVG(drawing.endDate, drawing.endPrice);

  if (!start || !end) return null;

  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={drawing.color}
        fillOpacity={drawing.fillOpacity}
        stroke={drawing.color}
        strokeWidth={isSelected ? 2 : 1}
        opacity={0.8}
      />
    </g>
  );
};

// Measure Renderer
const MeasureRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: MeasureDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const start = mapper.chartToSVG(drawing.startDate, drawing.startPrice);
  const end = mapper.chartToSVG(drawing.endDate, drawing.endPrice);

  if (!start || !end) return null;

  const priceChange = ((drawing.endPrice - drawing.startPrice) / drawing.startPrice) * 100;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke={drawing.color}
        strokeWidth={isSelected ? 3 : 2}
        opacity={0.8}
      />
      <circle cx={start.x} cy={start.y} r={4} fill={drawing.color} />
      <circle cx={end.x} cy={end.y} r={4} fill={drawing.color} />

      {/* Label */}
      <rect
        x={midX - 40}
        y={midY - 12}
        width={80}
        height={24}
        fill="#1f2937"
        stroke={drawing.color}
        strokeWidth={1}
        rx={4}
      />
      <text x={midX} y={midY + 4} fontSize={11} fill="white" textAnchor="middle" fontWeight="600">
        {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
      </text>
    </g>
  );
};

// Text Renderer
const TextRenderer: React.FC<Omit<DrawingRendererProps, 'drawing'> & { drawing: TextDrawing }> = ({
  drawing,
  mapper,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const point = mapper.chartToSVG(drawing.date, drawing.price);
  if (!point) return null;

  return (
    <g className="pointer-events-auto" style={{ cursor: 'pointer' }} onClick={onClick} onContextMenu={onContextMenu}>
      <circle cx={point.x} cy={point.y} r={6} fill={drawing.color} />
      <rect
        x={point.x + 10}
        y={point.y - drawing.fontSize}
        width={drawing.text.length * 8}
        height={drawing.fontSize + 8}
        fill="#1f2937"
        stroke={drawing.color}
        strokeWidth={isSelected ? 2 : 1}
        rx={4}
        opacity={0.95}
      />
      <text
        x={point.x + 14}
        y={point.y}
        fontSize={drawing.fontSize}
        fill="white"
        fontWeight="500"
      >
        {drawing.text}
      </text>
    </g>
  );
};

// Temp Drawing Renderer (while drawing)
const TempDrawingRenderer: React.FC<{
  tool: string;
  startPoint: { x: number; y: number };
  currentPoint: { x: number; y: number };
  mapper: ChartCoordinateMapper;
  color: string;
}> = ({ tool, startPoint, currentPoint, mapper, color }) => {
  const dimensions = mapper.getDimensions();

  switch (tool) {
    case 'hline':
      return (
        <line
          x1={dimensions.left}
          y1={currentPoint.y}
          x2={dimensions.width - dimensions.right}
          y2={currentPoint.y}
          stroke={color}
          strokeWidth={2}
          strokeDasharray="6,4"
          opacity={0.5}
        />
      );

    case 'trendline':
    case 'measure':
      return (
        <line
          x1={startPoint.x}
          y1={startPoint.y}
          x2={currentPoint.x}
          y2={currentPoint.y}
          stroke={color}
          strokeWidth={2}
          opacity={0.5}
        />
      );

    case 'rectangle':
      return (
        <rect
          x={Math.min(startPoint.x, currentPoint.x)}
          y={Math.min(startPoint.y, currentPoint.y)}
          width={Math.abs(currentPoint.x - startPoint.x)}
          height={Math.abs(currentPoint.y - startPoint.y)}
          fill={color}
          fillOpacity={0.1}
          stroke={color}
          strokeWidth={2}
          opacity={0.5}
        />
      );

    default:
      return null;
  }
};

// Get cursor based on active tool
function getCursor(tool: string): string {
  switch (tool) {
    case 'cursor':
      return 'default';
    case 'eraser':
      return 'not-allowed';
    case 'text':
      return 'text';
    default:
      return 'crosshair';
  }
}
