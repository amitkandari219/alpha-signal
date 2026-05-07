/**
 * Metrics Collection Service
 *
 * Collects and stores application metrics for monitoring and observability:
 * - HTTP request metrics (count, duration)
 * - GraphQL resolver metrics (duration per resolver)
 * - WebSocket metrics (active connections)
 * - Cache metrics (hits, misses)
 * - Business metrics (active users, page views, etc.)
 *
 * Metrics are stored in-memory and exposed via /metrics endpoint
 * In production, these would be scraped by Prometheus or similar
 */

/**
 * Metric types
 */
type MetricType = 'counter' | 'histogram' | 'gauge';

/**
 * Label set for metrics (e.g., { method: 'GET', path: '/api/stocks' })
 */
type Labels = Record<string, string | number>;

/**
 * Counter metric - monotonically increasing value
 */
interface Counter {
  type: 'counter';
  value: number;
  labels: Labels;
}

/**
 * Histogram metric - tracks distribution of values
 */
interface Histogram {
  type: 'histogram';
  values: number[];
  count: number;
  sum: number;
  labels: Labels;
}

/**
 * Gauge metric - can go up or down
 */
interface Gauge {
  type: 'gauge';
  value: number;
  labels: Labels;
}

/**
 * All metric types
 */
type Metric = Counter | Histogram | Gauge;

/**
 * Metric storage - name -> label hash -> metric
 */
type MetricStore = Map<string, Map<string, Metric>>;

/**
 * Metrics Service
 */
export class MetricsService {
  private metrics: MetricStore;

  constructor() {
    this.metrics = new Map();
  }

  /**
   * Generate a hash from labels for storage key
   */
  private labelHash(labels: Labels = {}): string {
    const sortedKeys = Object.keys(labels).sort();
    return sortedKeys.map(key => `${key}=${labels[key]}`).join(',') || 'default';
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: Labels = {}, increment: number = 1): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Map());
    }

    const labelMap = this.metrics.get(name)!;
    const hash = this.labelHash(labels);

    if (!labelMap.has(hash)) {
      labelMap.set(hash, {
        type: 'counter',
        value: 0,
        labels,
      });
    }

    const metric = labelMap.get(hash) as Counter;
    metric.value += increment;
  }

  /**
   * Record a value in a histogram
   */
  recordHistogram(name: string, value: number, labels: Labels = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Map());
    }

    const labelMap = this.metrics.get(name)!;
    const hash = this.labelHash(labels);

    if (!labelMap.has(hash)) {
      labelMap.set(hash, {
        type: 'histogram',
        values: [],
        count: 0,
        sum: 0,
        labels,
      });
    }

    const metric = labelMap.get(hash) as Histogram;
    metric.values.push(value);
    metric.count++;
    metric.sum += value;

    // Keep only last 1000 values to prevent memory issues
    if (metric.values.length > 1000) {
      metric.values.shift();
    }
  }

  /**
   * Set a gauge metric value
   */
  setGauge(name: string, value: number, labels: Labels = {}): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, new Map());
    }

    const labelMap = this.metrics.get(name)!;
    const hash = this.labelHash(labels);

    labelMap.set(hash, {
      type: 'gauge',
      value,
      labels,
    });
  }

  /**
   * Calculate histogram percentiles
   */
  private calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const p50Index = Math.floor(sorted.length * 0.5);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
    };
  }

  /**
   * Get all metrics in a readable format
   */
  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, labelMap] of this.metrics.entries()) {
      const metrics: any[] = [];

      for (const [hash, metric] of labelMap.entries()) {
        if (metric.type === 'counter') {
          metrics.push({
            labels: metric.labels,
            value: metric.value,
          });
        } else if (metric.type === 'histogram') {
          const percentiles = this.calculatePercentiles(metric.values);
          metrics.push({
            labels: metric.labels,
            count: metric.count,
            sum: metric.sum,
            avg: metric.count > 0 ? metric.sum / metric.count : 0,
            ...percentiles,
          });
        } else if (metric.type === 'gauge') {
          metrics.push({
            labels: metric.labels,
            value: metric.value,
          });
        }
      }

      result[name] = metrics;
    }

    return result;
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusFormat(): string {
    const lines: string[] = [];

    for (const [name, labelMap] of this.metrics.entries()) {
      for (const [hash, metric] of labelMap.entries()) {
        const labelStr = Object.entries(metric.labels)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',');
        const labelPart = labelStr ? `{${labelStr}}` : '';

        if (metric.type === 'counter') {
          lines.push(`# TYPE ${name} counter`);
          lines.push(`${name}${labelPart} ${metric.value}`);
        } else if (metric.type === 'histogram') {
          const percentiles = this.calculatePercentiles(metric.values);
          const avg = metric.count > 0 ? metric.sum / metric.count : 0;

          lines.push(`# TYPE ${name} histogram`);
          lines.push(`${name}_count${labelPart} ${metric.count}`);
          lines.push(`${name}_sum${labelPart} ${metric.sum}`);
          lines.push(`${name}_avg${labelPart} ${avg.toFixed(2)}`);
          lines.push(`${name}_p50${labelPart} ${percentiles.p50.toFixed(2)}`);
          lines.push(`${name}_p95${labelPart} ${percentiles.p95.toFixed(2)}`);
          lines.push(`${name}_p99${labelPart} ${percentiles.p99.toFixed(2)}`);
        } else if (metric.type === 'gauge') {
          lines.push(`# TYPE ${name} gauge`);
          lines.push(`${name}${labelPart} ${metric.value}`);
        }

        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Track HTTP request
   */
  trackHttpRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    // Increment request counter
    this.incrementCounter('http_requests_total', {
      method,
      path,
      status: statusCode,
    });

    // Record request duration
    this.recordHistogram('http_request_duration_ms', durationMs, {
      method,
      path,
      status: statusCode,
    });
  }

  /**
   * Track GraphQL resolver
   */
  trackGraphQLResolver(resolverName: string, durationMs: number, hasError: boolean): void {
    this.recordHistogram('graphql_resolver_duration_ms', durationMs, {
      resolver: resolverName,
      error: hasError ? 'true' : 'false',
    });

    this.incrementCounter('graphql_resolver_calls_total', {
      resolver: resolverName,
      error: hasError ? 'true' : 'false',
    });
  }

  /**
   * Track WebSocket connections
   */
  trackWebSocketConnections(count: number): void {
    this.setGauge('websocket_connections_active', count);
  }

  /**
   * Track cache hit/miss
   */
  trackCacheHit(cacheType: string): void {
    this.incrementCounter('cache_hits_total', { cache: cacheType });
  }

  trackCacheMiss(cacheType: string): void {
    this.incrementCounter('cache_misses_total', { cache: cacheType });
  }

  /**
   * Track business metrics
   */
  trackActiveUsers(count: number): void {
    this.setGauge('active_users_daily', count);
  }

  trackStockPageView(symbol: string): void {
    this.incrementCounter('stock_page_views_total', { symbol });
  }

  trackSearchQuery(query: string): void {
    this.incrementCounter('search_queries_total', { query });
  }

  trackSubscriptionUpgrade(fromTier: string, toTier: string): void {
    this.incrementCounter('subscription_upgrades_total', {
      from_tier: fromTier,
      to_tier: toTier,
    });
  }
}

// Singleton instance
let metricsServiceInstance: MetricsService | null = null;

/**
 * Get metrics service singleton
 */
export function getMetricsService(): MetricsService {
  if (!metricsServiceInstance) {
    metricsServiceInstance = new MetricsService();
  }
  return metricsServiceInstance;
}

export default getMetricsService;
