/**
 * Analytics Service
 *
 * Tracks user interactions and page views across the application.
 * Sends events to backend API and optionally to GA4.
 */

// Event names - keep this centralized for consistency
export const AnalyticsEvents = {
  STOCK_PAGE_VIEW: 'stock_page_view',
  SCREENER_USED: 'screener_used',
  WATCHLIST_CREATED: 'watchlist_created',
  ALERT_CREATED: 'alert_created',
  UPGRADE_CLICKED: 'upgrade_clicked',
  PAYMENT_COMPLETED: 'payment_completed',
  REPORT_VIEWED: 'report_viewed',
  AI_PANEL_EXPANDED: 'ai_panel_expanded',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  PORTFOLIO_UPDATED: 'portfolio_updated',
  PRICING_PAGE_VIEW: 'pricing_page_view',
  SIGN_UP_STARTED: 'sign_up_started',
  SIGN_UP_COMPLETED: 'sign_up_completed',
  LOGIN_COMPLETED: 'login_completed',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

interface AnalyticsEventData {
  [key: string]: any;
}

interface TrackingPayload {
  eventName: AnalyticsEventName;
  eventData?: AnalyticsEventData;
  pageUrl: string;
  referrer: string;
  userAgent: string;
  sessionId: string;
  userId?: string;
}

class AnalyticsService {
  private apiEndpoint: string;
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.sessionId = this.getOrCreateSessionId();
    this.isEnabled = import.meta.env.PROD || import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  }

  /**
   * Get or create a session ID for tracking
   */
  private getOrCreateSessionId(): string {
    const storageKey = 'alpha_signal_session_id';
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Get current user ID from auth store (if available)
   */
  private getUserId(): string | undefined {
    try {
      const authStore = localStorage.getItem('auth-store');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return parsed?.state?.user?.id;
      }
    } catch (error) {
      // Silent fail
    }
    return undefined;
  }

  /**
   * Send analytics event to backend
   */
  private async sendToBackend(payload: TrackingPayload): Promise<void> {
    try {
      await fetch(`${this.apiEndpoint}/api/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        // Don't wait for response, fire and forget
        keepalive: true,
      });
    } catch (error) {
      // Silent fail - don't disrupt user experience
      if (import.meta.env.DEV) {
        console.error('Analytics tracking error:', error);
      }
    }
  }

  /**
   * Send event to Google Analytics 4 (if configured)
   */
  private sendToGA4(eventName: string, eventData?: AnalyticsEventData): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', eventName, eventData);
      } catch (error) {
        // Silent fail
        if (import.meta.env.DEV) {
          console.error('GA4 tracking error:', error);
        }
      }
    }
  }

  /**
   * Track a page view
   */
  public trackPageView(pageName: string, metadata?: AnalyticsEventData): void {
    if (!this.isEnabled) return;

    const eventData = {
      pageName,
      ...metadata,
    };

    const payload: TrackingPayload = {
      eventName: 'page_view',
      eventData,
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      userId: this.getUserId(),
    };

    this.sendToBackend(payload);
    this.sendToGA4('page_view', eventData);
  }

  /**
   * Track a custom event
   */
  public trackEvent(eventName: AnalyticsEventName, eventData?: AnalyticsEventData): void {
    if (!this.isEnabled) return;

    const payload: TrackingPayload = {
      eventName,
      eventData: eventData || {},
      pageUrl: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      sessionId: this.sessionId,
      userId: this.getUserId(),
    };

    this.sendToBackend(payload);
    this.sendToGA4(eventName, eventData);
  }

  /**
   * Track stock page view with stock symbol
   */
  public trackStockView(symbol: string, additionalData?: AnalyticsEventData): void {
    this.trackEvent(AnalyticsEvents.STOCK_PAGE_VIEW, {
      symbol,
      ...additionalData,
    });
  }

  /**
   * Track screener usage
   */
  public trackScreenerUsed(filterCount: number, resultCount: number): void {
    this.trackEvent(AnalyticsEvents.SCREENER_USED, {
      filterCount,
      resultCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track watchlist creation
   */
  public trackWatchlistCreated(name: string, stockCount: number): void {
    this.trackEvent(AnalyticsEvents.WATCHLIST_CREATED, {
      name,
      stockCount,
    });
  }

  /**
   * Track alert creation
   */
  public trackAlertCreated(symbol: string, alertType: string): void {
    this.trackEvent(AnalyticsEvents.ALERT_CREATED, {
      symbol,
      alertType,
    });
  }

  /**
   * Track upgrade button click
   */
  public trackUpgradeClicked(location: string, targetTier: string): void {
    this.trackEvent(AnalyticsEvents.UPGRADE_CLICKED, {
      location,
      targetTier,
      userTier: this.getUserTier(),
    });
  }

  /**
   * Track payment completion
   */
  public trackPaymentCompleted(tier: string, amount: number, currency: string = 'INR'): void {
    this.trackEvent(AnalyticsEvents.PAYMENT_COMPLETED, {
      tier,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    });

    // Also track as GA4 purchase event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'purchase', {
        transaction_id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
        value: amount,
        currency: currency,
        items: [
          {
            item_id: tier,
            item_name: `${tier} Subscription`,
          },
        ],
      });
    }
  }

  /**
   * Track report view
   */
  public trackReportViewed(reportType: string, symbol?: string): void {
    this.trackEvent(AnalyticsEvents.REPORT_VIEWED, {
      reportType,
      symbol,
    });
  }

  /**
   * Track AI panel expansion
   */
  public trackAIPanelExpanded(symbol: string, panelName: string): void {
    this.trackEvent(AnalyticsEvents.AI_PANEL_EXPANDED, {
      symbol,
      panelName,
    });
  }

  /**
   * Get user tier from auth store
   */
  private getUserTier(): string {
    try {
      const authStore = localStorage.getItem('auth-store');
      if (authStore) {
        const parsed = JSON.parse(authStore);
        return parsed?.state?.user?.tier || 'FREE';
      }
    } catch (error) {
      // Silent fail
    }
    return 'FREE';
  }

  /**
   * Enable/disable tracking
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if tracking is enabled
   */
  public isTrackingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Export for use in React components
export default analytics;
