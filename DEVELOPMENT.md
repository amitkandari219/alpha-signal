# Development Guide

Comprehensive guide for developing Alpha Signal.

## 📚 Table of Contents

- [Development Environment](#development-environment)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [API Development](#api-development)
- [Frontend Development](#frontend-development)
- [Analytics Development](#analytics-development)
- [Testing](#testing)
- [Debugging](#debugging)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## 🛠️ Development Environment

### Required Tools

```bash
# Check versions
node --version    # Should be >= 20.0.0
npm --version     # Should be >= 10.0.0
docker --version  # Latest stable
python --version  # Should be 3.11
```

### IDE Setup

**VS Code** (Recommended)

Install recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Python
- Docker
- GraphQL

Settings are pre-configured in `.vscode/settings.json`.

**Alternative IDEs**
- WebStorm: Works great with built-in TypeScript support
- PyCharm: Good for Python analytics development

## 🏗️ Project Architecture

### Monorepo Structure

```
alpha-signal/
├── apps/
│   ├── web/          # React frontend (port 3000)
│   ├── api/          # Node.js backend (port 4000)
│   └── analytics/    # Python workers
├── packages/
│   └── shared/       # Shared TypeScript types
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | UI |
| Backend | Fastify + GraphQL | API |
| Database | PostgreSQL + TimescaleDB | Data storage |
| Cache | Redis | Caching & message queue |
| Workers | Python + Celery | Background jobs |
| State | Zustand + React Query | State management |
| Real-time | Socket.io | WebSockets |

### Communication Flow

```
User Browser (React)
    ↓ ↑ (HTTP/GraphQL/WebSocket)
API Server (Fastify + Apollo)
    ↓ ↑ (Prisma ORM)
PostgreSQL Database
    ↓ ↑
Analytics Workers (Celery)
    ↓ ↑ (Redis)
Message Queue
```

## 🔄 Development Workflow

### Quick Start

```bash
# Clone and setup
git clone <repo>
cd alpha-signal
./setup.sh

# Option 1: Docker (recommended)
make docker-up

# Option 2: Local development
make install
docker-compose up postgres redis -d
make dev
```

### Development Modes

#### Full Docker Mode
```bash
docker-compose up
```
Pros: Mirrors production, consistent environment
Cons: Slower hot reload

#### Hybrid Mode (Recommended)
```bash
# Infrastructure only
docker-compose up postgres redis -d

# Run apps locally
npm run dev              # Web + API
cd apps/analytics && celery -A src.celery_app worker --loglevel=info
```
Pros: Fast hot reload, easy debugging
Cons: More setup required

## 🗄️ Database Management

### Prisma Workflow

```bash
# 1. Update schema
vim apps/api/prisma/schema.prisma

# 2. Create migration
cd apps/api
npx prisma migrate dev --name add_user_preferences

# 3. Generate client
npx prisma generate

# 4. (Optional) Open Prisma Studio
npx prisma studio
```

### Common Prisma Commands

```bash
# Generate Prisma Client
make prisma-generate

# Create and apply migration
make prisma-migrate

# Reset database (⚠️ deletes data)
make db-reset

# Open Prisma Studio
make prisma-studio
```

### TimescaleDB Features

For time-series data (stock prices), use hypertables:

```sql
-- In migration file
CREATE TABLE stock_prices (
  id SERIAL,
  symbol VARCHAR(10) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable
SELECT create_hypertable('stock_prices', 'timestamp');

-- Add indexes
CREATE INDEX ON stock_prices (symbol, timestamp DESC);
```

### Database Backup & Restore

```bash
# Backup
make backup-db

# Restore
make restore-db FILE=backup_20240101_120000.sql

# Manual backup
docker-compose exec postgres pg_dump -U alphasignal alphasignal > backup.sql

# Manual restore
docker-compose exec -T postgres psql -U alphasignal alphasignal < backup.sql
```

## 🚀 API Development

### Adding a GraphQL Endpoint

1. **Update Type Definitions**
```typescript
// apps/api/src/index.ts
const typeDefs = `#graphql
  type Stock {
    id: ID!
    symbol: String!
    name: String!
    price: Float
  }

  type Query {
    stock(symbol: String!): Stock
    stocks: [Stock!]!
  }
`;
```

2. **Add Resolver**
```typescript
const resolvers = {
  Query: {
    stock: async (_, { symbol }, context) => {
      return context.prisma.stock.findUnique({
        where: { symbol },
      });
    },
    stocks: async (_, __, context) => {
      return context.prisma.stock.findMany();
    },
  },
};
```

3. **Update Shared Types**
```typescript
// packages/shared/src/index.ts
export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price?: number;
}
```

4. **Test in GraphQL Playground**
```graphql
query {
  stocks {
    id
    symbol
    name
    price
  }
}
```

### Adding REST Endpoint (if needed)

```typescript
// apps/api/src/index.ts
fastify.get('/api/stocks/:symbol', async (request, reply) => {
  const { symbol } = request.params;
  const stock = await prisma.stock.findUnique({
    where: { symbol },
  });
  return stock;
});
```

### WebSocket Events

```typescript
// Server (apps/api/src/index.ts)
io.on('connection', (socket) => {
  socket.on('subscribe:stock', (symbol) => {
    socket.join(`stock:${symbol}`);
  });

  socket.on('unsubscribe:stock', (symbol) => {
    socket.leave(`stock:${symbol}`);
  });
});

// Emit price updates
io.to(`stock:${symbol}`).emit('price:update', { symbol, price });
```

## 🎨 Frontend Development

### Adding a New Page

1. **Create Component**
```tsx
// apps/web/src/pages/StockDetail.tsx
import { useParams } from 'react-router-dom';

export const StockDetail = () => {
  const { symbol } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">{symbol}</h1>
      {/* Component content */}
    </div>
  );
};
```

2. **Add Route**
```tsx
// apps/web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StockDetail } from './pages/StockDetail';

<Routes>
  <Route path="/stocks/:symbol" element={<StockDetail />} />
</Routes>
```

### State Management

**Zustand** for client state:
```typescript
// apps/web/src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
```

**React Query** for server state:
```typescript
// apps/web/src/hooks/useStocks.ts
import { useQuery } from '@tanstack/react-query';

export const useStocks = () => {
  return useQuery({
    queryKey: ['stocks'],
    queryFn: fetchStocks,
  });
};
```

### Tailwind CSS Usage

```tsx
// Use Tailwind classes
<div className="bg-dark-900 rounded-lg p-6 shadow-xl border border-dark-800">
  <h2 className="text-2xl font-semibold mb-4 text-primary-400">
    Stock Performance
  </h2>
</div>

// Custom colors available:
// primary-* (blue shades)
// secondary-* (purple shades)
// dark-* (dark mode grays)
```

## 🐍 Analytics Development

### Adding a Celery Task

```python
# apps/analytics/src/tasks.py
from .celery_app import app
import logging

logger = logging.getLogger(__name__)

@app.task(bind=True)
def analyze_stock_sentiment(self, symbol: str):
    """
    Analyze social media sentiment for a stock
    """
    logger.info(f"Analyzing sentiment for {symbol}")

    # Implementation here
    sentiment_score = 0.75

    return {
        'symbol': symbol,
        'sentiment': sentiment_score,
        'status': 'success'
    }
```

### Calling Tasks from API

```typescript
// apps/api/src/index.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Enqueue task
const taskId = await redis.lpush(
  'celery',
  JSON.stringify({
    task: 'src.tasks.analyze_stock_sentiment',
    args: ['RELIANCE'],
    kwargs: {},
  })
);
```

### Monitoring Celery

```bash
# Watch worker logs
make logs-worker

# Celery status
docker-compose exec analytics-worker celery -A src.celery_app status

# Inspect tasks
docker-compose exec analytics-worker celery -A src.celery_app inspect active
```

## 🧪 Testing

### Frontend Tests

```typescript
// apps/web/src/__tests__/StockCard.test.tsx
import { render, screen } from '@testing-library/react';
import { StockCard } from '../components/StockCard';

test('renders stock information', () => {
  render(<StockCard symbol="RELIANCE" price={2500} />);
  expect(screen.getByText('RELIANCE')).toBeInTheDocument();
  expect(screen.getByText('₹2500')).toBeInTheDocument();
});
```

### Backend Tests

```typescript
// apps/api/src/__tests__/stocks.test.ts
import { test } from 'tap';
import { build } from '../app';

test('GET /api/stocks returns stocks', async (t) => {
  const app = await build();
  const response = await app.inject({
    method: 'GET',
    url: '/api/stocks',
  });

  t.equal(response.statusCode, 200);
  t.ok(Array.isArray(response.json()));
});
```

### Python Tests

```python
# apps/analytics/tests/test_tasks.py
from src.tasks import analyze_stock_sentiment

def test_analyze_sentiment():
    result = analyze_stock_sentiment.apply(args=['RELIANCE']).get()
    assert result['status'] == 'success'
    assert 'sentiment' in result
```

## 🐛 Debugging

### VS Code Debugging

Launch configurations are pre-configured in `.vscode/launch.json`:

- **Debug API Server**: Attach to Node.js process
- **Debug Web App**: Launch Chrome with debugger

### Console Logging

```typescript
// API Server uses Pino logger
fastify.log.info('Processing request');
fastify.log.error('Error occurred', error);

// Frontend uses console (or add a logger)
console.log('User action:', action);
```

### Database Debugging

```bash
# Open PostgreSQL CLI
make psql

# Query examples
SELECT * FROM stocks;
SELECT * FROM users WHERE email = 'test@example.com';
```

### Redis Debugging

```bash
# Open Redis CLI
make redis-cli

# Common commands
KEYS *
GET key_name
LLEN celery
```

## 🔧 Common Tasks

### Environment Variables

```bash
# Edit .env
vim .env

# Restart services to apply changes
make docker-down && make docker-up
```

### Updating Dependencies

```bash
# Update all packages
npm update

# Update specific package
npm update react react-dom

# Python packages
cd apps/analytics
pip install --upgrade pandas
pip freeze > requirements.txt
```

### Code Formatting

```bash
# Format all code
make format

# TypeScript/JavaScript
npx prettier --write "**/*.{ts,tsx,js,jsx}"

# Python
cd apps/analytics && black src/
```

## 🆘 Troubleshooting

### Port Already in Use

```bash
# Find process
lsof -i :3000
lsof -i :4000

# Kill process
kill -9 <PID>
```

### Docker Issues

```bash
# Clean restart
make docker-rebuild

# Remove all containers and volumes
docker-compose down -v
docker system prune -a
```

### Node Modules Issues

```bash
# Clean install
make clean
npm install
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
make status

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Hot Reload Not Working

```bash
# Stop and restart dev servers
# Ctrl+C then
npm run dev
```

---

**Happy Developing! 🚀**
