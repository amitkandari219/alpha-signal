/**
 * Chart Coordinate Mapping System
 *
 * Converts between chart domain coordinates (date/price) and SVG pixel coordinates.
 * Handles dynamic chart resizing and maintains accuracy across different chart configurations.
 */

export interface ChartDimensions {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDomain {
  xMin: number; // timestamp in ms
  xMax: number; // timestamp in ms
  yMin: number; // price
  yMax: number; // price
}

export interface ChartDataPoint {
  rawTime: string; // ISO date string
  date: string; // formatted date
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  [key: string]: any;
}

/**
 * ChartCoordinateMapper class
 *
 * Core coordinate mapping system that converts between chart domain and SVG pixels.
 * Must be instantiated with chart dimensions and data domain, then updated on resize.
 */
export class ChartCoordinateMapper {
  private dimensions: ChartDimensions;
  private domain: ChartDomain;
  private chartData: ChartDataPoint[];
  private dateToIndexMap: Map<string, number>;

  constructor(
    dimensions: ChartDimensions,
    chartData: ChartDataPoint[],
    priceRange?: { min: number; max: number }
  ) {
    this.dimensions = dimensions;
    this.chartData = chartData;

    // Build date to index map for fast lookup
    this.dateToIndexMap = new Map();
    chartData.forEach((point, index) => {
      this.dateToIndexMap.set(point.rawTime, index);
    });

    // Calculate domain from data
    const timestamps = chartData.map(d => new Date(d.rawTime).getTime());
    const prices = chartData.flatMap(d => [d.high, d.low]);

    this.domain = {
      xMin: Math.min(...timestamps),
      xMax: Math.max(...timestamps),
      yMin: priceRange?.min ?? Math.min(...prices),
      yMax: priceRange?.max ?? Math.max(...prices),
    };
  }

  /**
   * Update dimensions when chart resizes
   */
  updateDimensions(dimensions: ChartDimensions) {
    this.dimensions = dimensions;
  }

  /**
   * Update domain when price range changes or data updates
   */
  updateDomain(chartData: ChartDataPoint[], priceRange?: { min: number; max: number }) {
    this.chartData = chartData;

    // Rebuild date to index map
    this.dateToIndexMap.clear();
    chartData.forEach((point, index) => {
      this.dateToIndexMap.set(point.rawTime, index);
    });

    const timestamps = chartData.map(d => new Date(d.rawTime).getTime());
    const prices = chartData.flatMap(d => [d.high, d.low]);

    this.domain = {
      xMin: Math.min(...timestamps),
      xMax: Math.max(...timestamps),
      yMin: priceRange?.min ?? Math.min(...prices),
      yMax: priceRange?.max ?? Math.max(...prices),
    };
  }

  /**
   * Convert date to X pixel coordinate
   * @param date - ISO date string (rawTime format)
   * @returns X pixel coordinate or null if date not in range
   */
  dateToX(date: string): number | null {
    const timestamp = new Date(date).getTime();

    if (timestamp < this.domain.xMin || timestamp > this.domain.xMax) {
      return null;
    }

    const { width, left, right } = this.dimensions;
    const chartWidth = width - left - right;

    // Linear interpolation
    const ratio = (timestamp - this.domain.xMin) / (this.domain.xMax - this.domain.xMin);
    return left + ratio * chartWidth;
  }

  /**
   * Convert price to Y pixel coordinate
   * Note: Y axis is inverted (higher price = lower Y pixel)
   * @param price - Price value
   * @returns Y pixel coordinate or null if price not in range
   */
  priceToY(price: number): number | null {
    if (price < this.domain.yMin || price > this.domain.yMax) {
      // Allow slight overflow for drawing tools
      if (price < this.domain.yMin * 0.95 || price > this.domain.yMax * 1.05) {
        return null;
      }
    }

    const { height, top, bottom } = this.dimensions;
    const chartHeight = height - top - bottom;

    // Inverted: high price = low Y value
    const ratio = (price - this.domain.yMin) / (this.domain.yMax - this.domain.yMin);
    return top + chartHeight * (1 - ratio);
  }

  /**
   * Convert X pixel coordinate to date
   * @param x - X pixel coordinate
   * @returns ISO date string or null if out of range
   */
  xToDate(x: number): string | null {
    const { width, left, right } = this.dimensions;
    const chartWidth = width - left - right;

    if (x < left || x > width - right) {
      return null;
    }

    const ratio = (x - left) / chartWidth;
    const timestamp = this.domain.xMin + ratio * (this.domain.xMax - this.domain.xMin);

    // Find nearest data point
    const targetDate = new Date(timestamp).toISOString();
    return this.findNearestDate(targetDate);
  }

  /**
   * Convert Y pixel coordinate to price
   * @param y - Y pixel coordinate
   * @returns Price value or null if out of range
   */
  yToPrice(y: number): number | null {
    const { height, top, bottom } = this.dimensions;
    const chartHeight = height - top - bottom;

    if (y < top || y > height - bottom) {
      return null;
    }

    // Inverted ratio
    const ratio = 1 - (y - top) / chartHeight;
    return this.domain.yMin + ratio * (this.domain.yMax - this.domain.yMin);
  }

  /**
   * Find the nearest date in chartData to a given date
   */
  private findNearestDate(targetDate: string): string | null {
    if (this.chartData.length === 0) return null;

    const targetTime = new Date(targetDate).getTime();
    let nearestDate = this.chartData[0].rawTime;
    let minDiff = Math.abs(new Date(nearestDate).getTime() - targetTime);

    for (const point of this.chartData) {
      const diff = Math.abs(new Date(point.rawTime).getTime() - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearestDate = point.rawTime;
      }
    }

    return nearestDate;
  }

  /**
   * Get price at a specific date
   */
  getPriceAtDate(date: string): number | null {
    const index = this.dateToIndexMap.get(date);
    if (index === undefined) return null;
    return this.chartData[index].close;
  }

  /**
   * Get data point at a specific date
   */
  getDataPointAtDate(date: string): ChartDataPoint | null {
    const index = this.dateToIndexMap.get(date);
    if (index === undefined) return null;
    return this.chartData[index];
  }

  /**
   * Convert chart coordinates to SVG point
   */
  chartToSVG(date: string, price: number): { x: number; y: number } | null {
    const x = this.dateToX(date);
    const y = this.priceToY(price);

    if (x === null || y === null) return null;

    return { x, y };
  }

  /**
   * Convert SVG point to chart coordinates
   */
  svgToChart(x: number, y: number): { date: string; price: number } | null {
    const date = this.xToDate(x);
    const price = this.yToPrice(y);

    if (date === null || price === null) return null;

    return { date, price };
  }

  /**
   * Check if coordinates are within chart bounds
   */
  isInBounds(x: number, y: number): boolean {
    const { width, height, left, right, top, bottom } = this.dimensions;
    return (
      x >= left &&
      x <= width - right &&
      y >= top &&
      y <= height - bottom
    );
  }

  /**
   * Clamp coordinates to chart bounds
   */
  clampToBounds(x: number, y: number): { x: number; y: number } {
    const { width, height, left, right, top, bottom } = this.dimensions;
    return {
      x: Math.max(left, Math.min(width - right, x)),
      y: Math.max(top, Math.min(height - bottom, y)),
    };
  }

  /**
   * Get current dimensions
   */
  getDimensions(): ChartDimensions {
    return { ...this.dimensions };
  }

  /**
   * Get current domain
   */
  getDomain(): ChartDomain {
    return { ...this.domain };
  }

  /**
   * Get chart data
   */
  getChartData(): ChartDataPoint[] {
    return this.chartData;
  }
}

/**
 * Hook factory for creating coordinate mapper with ResizeObserver
 * Usage in component:
 *
 * const chartRef = useRef<HTMLDivElement>(null);
 * const mapper = useChartCoordinateMapper(chartRef, chartData, priceRange);
 */
export const createChartCoordinateMapper = (
  containerElement: HTMLElement,
  chartData: ChartDataPoint[],
  priceRange?: { min: number; max: number }
): ChartCoordinateMapper | null => {
  if (!containerElement || chartData.length === 0) return null;

  const rect = containerElement.getBoundingClientRect();

  // Default margins matching Recharts defaults
  const dimensions: ChartDimensions = {
    width: rect.width,
    height: rect.height,
    top: 5,
    right: 60, // Space for price axis labels
    bottom: 25, // Space for date axis labels
    left: 60,
  };

  return new ChartCoordinateMapper(dimensions, chartData, priceRange);
};
