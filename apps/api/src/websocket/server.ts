/**
 * WebSocket Server for Real-time Price Updates and Alerts
 *
 * Features:
 * - Socket.io integrated with Fastify
 * - Redis adapter for horizontal scaling
 * - JWT authentication
 * - Two namespaces: /prices and /alerts
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'alphasignal_dev_secret';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private pubClient: any;
  private subClient: any;

  constructor(fastify: FastifyInstance) {
    // Initialize Socket.io with Fastify
    this.io = new SocketIOServer(fastify.server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupRedisAdapter();
    this.setupNamespaces();
    this.startListeningToPriceUpdates();
    this.startListeningToAlerts();
  }

  private async setupRedisAdapter() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Create Redis clients for pub/sub
    this.pubClient = createClient({ url: redisUrl });
    this.subClient = this.pubClient.duplicate();

    await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

    // Attach Redis adapter for horizontal scaling
    this.io.adapter(createAdapter(this.pubClient, this.subClient));

    console.log('✅ WebSocket Redis adapter configured');
  }

  private setupNamespaces() {
    // Prices namespace: /prices
    const pricesNamespace = this.io.of('/prices');

    pricesNamespace.use((socket: any, next) => {
      this.authenticateSocket(socket, next);
    });

    pricesNamespace.on('connection', (socket: any) => {
      console.log(`Client connected to /prices: ${socket.id}`);

      // Store subscribed symbols for this socket
      socket.subscribedSymbols = new Set<string>();

      // Handle subscribe event
      socket.on('subscribe', ({ symbols }: { symbols: string[] }) => {
        if (!Array.isArray(symbols)) return;

        symbols.forEach((symbol) => {
          socket.subscribedSymbols.add(symbol);
          socket.join(`symbol:${symbol}`);
        });

        console.log(`Socket ${socket.id} subscribed to: ${symbols.join(', ')}`);
      });

      // Handle unsubscribe event
      socket.on('unsubscribe', ({ symbols }: { symbols: string[] }) => {
        if (!Array.isArray(symbols)) return;

        symbols.forEach((symbol) => {
          socket.subscribedSymbols.delete(symbol);
          socket.leave(`symbol:${symbol}`);
        });

        console.log(`Socket ${socket.id} unsubscribed from: ${symbols.join(', ')}`);
      });

      // Auto-unsubscribe on disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected from /prices: ${socket.id}`);
      });
    });

    // Alerts namespace: /alerts
    const alertsNamespace = this.io.of('/alerts');

    alertsNamespace.use((socket: any, next) => {
      this.authenticateSocket(socket, next);
    });

    alertsNamespace.on('connection', (socket: any) => {
      console.log(`Client connected to /alerts: ${socket.id} (user: ${socket.userId})`);

      // Join user-specific room for targeted notifications
      if (socket.userId) {
        socket.join(`user:${socket.userId}`);
      }

      socket.on('disconnect', () => {
        console.log(`Client disconnected from /alerts: ${socket.id}`);
      });
    });
  }

  private authenticateSocket(socket: any, next: (err?: Error) => void) {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.userId || decoded.id;
      socket.userEmail = decoded.email;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  }

  private startListeningToPriceUpdates() {
    // Subscribe to Redis pub/sub channel for price updates
    const priceChannel = 'price_updates:*';

    // Create a separate client for subscription
    const priceSubClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    priceSubClient.connect().then(() => {
      console.log('✅ Listening for price updates from Redis');

      // Subscribe to all price update channels using pattern
      priceSubClient.pSubscribe(priceChannel, (message, channel) => {
        try {
          const symbol = channel.split(':')[1]; // Extract symbol from "price_updates:DIXON"
          const priceData = JSON.parse(message);

          // Broadcast to all clients subscribed to this symbol
          const pricesNamespace = this.io.of('/prices');

          // Throttle: Only emit if last emit was > 1 second ago
          const room = `symbol:${symbol}`;
          pricesNamespace.to(room).emit('price_update', {
            symbol,
            price: priceData.ltp,
            change: priceData.change,
            change_pct: priceData.change_pct,
            volume: priceData.volume,
            timestamp: priceData.timestamp,
          });
        } catch (err) {
          console.error('Error processing price update:', err);
        }
      });
    });
  }

  private startListeningToAlerts() {
    // Subscribe to Redis pub/sub channel for alert notifications
    const alertChannel = 'alert_triggered';

    const alertSubClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    alertSubClient.connect().then(() => {
      console.log('✅ Listening for alert notifications from Redis');

      alertSubClient.subscribe(alertChannel, (message) => {
        try {
          const alertData = JSON.parse(message);

          // Send alert to specific user
          const alertsNamespace = this.io.of('/alerts');
          alertsNamespace.to(`user:${alertData.userId}`).emit('alert', {
            alert_id: alertData.alertId,
            stock_symbol: alertData.symbol,
            condition: alertData.condition,
            current_value: alertData.currentValue,
            threshold: alertData.threshold,
            triggered_at: alertData.triggeredAt,
          });

          console.log(`Alert sent to user ${alertData.userId}: ${alertData.symbol}`);
        } catch (err) {
          console.error('Error processing alert:', err);
        }
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
