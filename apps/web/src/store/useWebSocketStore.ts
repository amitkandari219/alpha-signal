/**
 * WebSocket Store with Zustand
 *
 * Manages WebSocket connections with:
 * - Connection state (CONNECTED, CONNECTING, DISCONNECTED)
 * - Automatic reconnection with exponential backoff
 * - Price subscription management
 * - Alert notification handling
 */

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type ConnectionStatus = 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';

export interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  timestamp: string;
}

export interface AlertNotification {
  alert_id: string;
  stock_symbol: string;
  condition: string;
  current_value: number;
  threshold: number;
  triggered_at: string;
}

interface WebSocketState {
  // Connection state
  status: ConnectionStatus;
  pricesSocket: Socket | null;
  alertsSocket: Socket | null;

  // Price updates
  priceUpdates: Map<string, PriceUpdate>;
  subscribedSymbols: Set<string>;

  // Alert notifications
  alerts: AlertNotification[];

  // Reconnection
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  reconnectTimer: NodeJS.Timeout | null;

  // Actions
  connect: (token: string) => void;
  disconnect: () => void;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  subscribeToSymbols: (symbols: string[]) => void;
  clearAlert: (alertId: string) => void;
  getPriceForSymbol: (symbol: string) => PriceUpdate | undefined;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // Initial state
  status: 'DISCONNECTED',
  pricesSocket: null,
  alertsSocket: null,
  priceUpdates: new Map(),
  subscribedSymbols: new Set(),
  alerts: [],
  reconnectAttempts: 0,
  maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS,
  reconnectDelay: INITIAL_RECONNECT_DELAY,
  reconnectTimer: null,

  // Connect to WebSocket servers
  connect: (token: string) => {
    const state = get();

    // Don't reconnect if already connected or connecting
    if (state.status === 'CONNECTED' || state.status === 'CONNECTING') {
      return;
    }

    set({ status: 'CONNECTING' });

    // Connect to /prices namespace
    const pricesSocket = io(`${WS_URL}/prices`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false, // We handle reconnection ourselves
    });

    // Connect to /alerts namespace
    const alertsSocket = io(`${WS_URL}/alerts`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
    });

    // Prices socket event handlers
    pricesSocket.on('connect', () => {
      console.log('📡 Connected to prices WebSocket');
      set({
        status: 'CONNECTED',
        reconnectAttempts: 0,
        reconnectDelay: INITIAL_RECONNECT_DELAY,
      });

      // Re-subscribe to previously subscribed symbols
      const { subscribedSymbols } = get();
      if (subscribedSymbols.size > 0) {
        pricesSocket.emit('subscribe', { symbols: Array.from(subscribedSymbols) });
      }
    });

    pricesSocket.on('price_update', (data: PriceUpdate) => {
      set((state) => {
        const newMap = new Map(state.priceUpdates);
        newMap.set(data.symbol, data);
        return { priceUpdates: newMap };
      });
    });

    pricesSocket.on('disconnect', () => {
      console.log('📡 Disconnected from prices WebSocket');
      set({ status: 'DISCONNECTED' });
      get().scheduleReconnect(token);
    });

    pricesSocket.on('connect_error', (error) => {
      console.error('📡 Prices WebSocket connection error:', error.message);
      set({ status: 'DISCONNECTED' });
      get().scheduleReconnect(token);
    });

    // Alerts socket event handlers
    alertsSocket.on('connect', () => {
      console.log('🔔 Connected to alerts WebSocket');
    });

    alertsSocket.on('alert', (data: AlertNotification) => {
      console.log('🔔 Alert received:', data);
      set((state) => ({
        alerts: [data, ...state.alerts].slice(0, 50), // Keep last 50 alerts
      }));
    });

    alertsSocket.on('disconnect', () => {
      console.log('🔔 Disconnected from alerts WebSocket');
    });

    alertsSocket.on('connect_error', (error) => {
      console.error('🔔 Alerts WebSocket connection error:', error.message);
    });

    set({ pricesSocket, alertsSocket });
  },

  // Disconnect from WebSocket servers
  disconnect: () => {
    const { pricesSocket, alertsSocket, reconnectTimer } = get();

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    if (pricesSocket) {
      pricesSocket.disconnect();
    }

    if (alertsSocket) {
      alertsSocket.disconnect();
    }

    set({
      status: 'DISCONNECTED',
      pricesSocket: null,
      alertsSocket: null,
      reconnectTimer: null,
    });
  },

  // Subscribe to a single symbol
  subscribeToSymbol: (symbol: string) => {
    const { pricesSocket, subscribedSymbols } = get();

    if (!pricesSocket || !pricesSocket.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    if (subscribedSymbols.has(symbol)) {
      return; // Already subscribed
    }

    pricesSocket.emit('subscribe', { symbols: [symbol] });

    set((state) => ({
      subscribedSymbols: new Set(state.subscribedSymbols).add(symbol),
    }));
  },

  // Unsubscribe from a single symbol
  unsubscribeFromSymbol: (symbol: string) => {
    const { pricesSocket, subscribedSymbols } = get();

    if (!pricesSocket || !pricesSocket.connected) {
      return;
    }

    if (!subscribedSymbols.has(symbol)) {
      return; // Not subscribed
    }

    pricesSocket.emit('unsubscribe', { symbols: [symbol] });

    set((state) => {
      const newSet = new Set(state.subscribedSymbols);
      newSet.delete(symbol);
      return { subscribedSymbols: newSet };
    });
  },

  // Subscribe to multiple symbols
  subscribeToSymbols: (symbols: string[]) => {
    const { pricesSocket, subscribedSymbols } = get();

    if (!pricesSocket || !pricesSocket.connected) {
      console.warn('Cannot subscribe: WebSocket not connected');
      return;
    }

    const newSymbols = symbols.filter(s => !subscribedSymbols.has(s));

    if (newSymbols.length === 0) {
      return; // All already subscribed
    }

    pricesSocket.emit('subscribe', { symbols: newSymbols });

    set((state) => {
      const newSet = new Set(state.subscribedSymbols);
      newSymbols.forEach(s => newSet.add(s));
      return { subscribedSymbols: newSet };
    });
  },

  // Clear a specific alert
  clearAlert: (alertId: string) => {
    set((state) => ({
      alerts: state.alerts.filter(a => a.alert_id !== alertId),
    }));
  },

  // Get current price for a symbol
  getPriceForSymbol: (symbol: string) => {
    return get().priceUpdates.get(symbol);
  },

  // Schedule reconnection with exponential backoff
  scheduleReconnect: (token: string) => {
    const state = get();

    if (state.reconnectAttempts >= state.maxReconnectAttempts) {
      console.error('📡 Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      state.reconnectDelay * Math.pow(2, state.reconnectAttempts),
      MAX_RECONNECT_DELAY
    );

    console.log(`📡 Reconnecting in ${delay}ms (attempt ${state.reconnectAttempts + 1}/${state.maxReconnectAttempts})`);

    const timer = setTimeout(() => {
      set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 }));
      get().connect(token);
    }, delay);

    set({ reconnectTimer: timer });
  },
}));
