# API Documentation

GraphQL and REST API documentation for Alpha Signal.

## 🔗 Base URLs

- **Development**: `http://localhost:4000`
- **Production**: `https://api.alphasignal.com`

## 🔐 Authentication

### JWT Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

### Obtaining a Token

```graphql
mutation Login {
  login(email: "user@example.com", password: "password") {
    accessToken
    user {
      id
      email
      name
    }
  }
}
```

## 📊 GraphQL API

### Endpoint

```
POST /graphql
```

### Interactive Playground

Visit `http://localhost:4000/graphql` for the interactive GraphQL Playground.

## 🔍 Queries

### Health Check

```graphql
query Health {
  health
  version
}
```

**Response:**
```json
{
  "data": {
    "health": "OK",
    "version": "1.0.0"
  }
}
```

### Get Stock

```graphql
query GetStock($symbol: String!) {
  stock(symbol: $symbol) {
    id
    symbol
    name
    exchange
    sector
    marketCap
    currentPrice
  }
}
```

**Variables:**
```json
{
  "symbol": "RELIANCE"
}
```

### List Stocks

```graphql
query ListStocks($limit: Int, $offset: Int) {
  stocks(limit: $limit, offset: $offset) {
    id
    symbol
    name
    exchange
    currentPrice
  }
}
```

### Search Stocks

```graphql
query SearchStocks($query: String!) {
  searchStocks(query: $query) {
    id
    symbol
    name
    exchange
  }
}
```

## ✏️ Mutations

### Ping Test

```graphql
mutation Ping {
  ping
}
```

### Create Watchlist

```graphql
mutation CreateWatchlist($name: String!) {
  createWatchlist(name: $name) {
    id
    name
    createdAt
  }
}
```

### Add to Watchlist

```graphql
mutation AddToWatchlist($watchlistId: ID!, $symbol: String!) {
  addToWatchlist(watchlistId: $watchlistId, symbol: $symbol) {
    id
    stocks {
      symbol
      name
    }
  }
}
```

## 📡 Subscriptions

### Real-time Price Updates

```graphql
subscription StockPriceUpdates($symbol: String!) {
  stockPriceUpdates(symbol: $symbol) {
    symbol
    price
    change
    changePercent
    timestamp
  }
}
```

## 🌐 REST API

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Stock (REST)

```bash
GET /api/stocks/:symbol
```

**Example:**
```bash
curl http://localhost:4000/api/stocks/RELIANCE
```

**Response:**
```json
{
  "id": "clx...",
  "symbol": "RELIANCE",
  "name": "Reliance Industries Ltd",
  "exchange": "NSE",
  "currentPrice": 2500.50
}
```

## 🔌 WebSocket API

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Subscribe to Stock Updates

```javascript
// Subscribe
socket.emit('subscribe:stock', 'RELIANCE');

// Listen for updates
socket.on('price:update', (data) => {
  console.log(data);
  // { symbol: 'RELIANCE', price: 2500.50, timestamp: '...' }
});

// Unsubscribe
socket.emit('unsubscribe:stock', 'RELIANCE');
```

#### Market Status

```javascript
socket.on('market:status', (status) => {
  console.log(status);
  // { isOpen: true, nextClose: '...' }
});
```

## 🔢 Data Types

### Stock

```typescript
type Stock {
  id: ID!
  symbol: String!
  name: String!
  exchange: Exchange!
  sector: String
  marketCap: Float
  currentPrice: Float
  dayHigh: Float
  dayLow: Float
  volume: Int
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Exchange

```typescript
enum Exchange {
  NSE
  BSE
}
```

### User

```typescript
type User {
  id: ID!
  email: String!
  name: String
  role: Role!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### Role

```typescript
enum Role {
  USER
  ADMIN
}
```

## ⚠️ Error Handling

### GraphQL Errors

```json
{
  "errors": [
    {
      "message": "Stock not found",
      "extensions": {
        "code": "NOT_FOUND",
        "symbol": "INVALID"
      }
    }
  ]
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

### Error Codes

| Code | Description |
|------|-------------|
| `NOT_FOUND` | Resource not found |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `VALIDATION_ERROR` | Input validation failed |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## 🚀 Rate Limiting

- **Authenticated**: 1000 requests/hour
- **Unauthenticated**: 100 requests/hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

## 📝 Examples

### Fetch and Display Stock

```typescript
// Using Apollo Client
import { useQuery, gql } from '@apollo/client';

const GET_STOCK = gql`
  query GetStock($symbol: String!) {
    stock(symbol: $symbol) {
      symbol
      name
      currentPrice
    }
  }
`;

function StockDisplay({ symbol }) {
  const { loading, error, data } = useQuery(GET_STOCK, {
    variables: { symbol },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>{data.stock.name}</h2>
      <p>₹{data.stock.currentPrice}</p>
    </div>
  );
}
```

### Real-time Price Updates

```typescript
// Using Socket.io
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';

function RealtimePrice({ symbol }) {
  const [price, setPrice] = useState(null);

  useEffect(() => {
    const socket = io('http://localhost:4000');

    socket.emit('subscribe:stock', symbol);
    socket.on('price:update', (data) => {
      setPrice(data.price);
    });

    return () => {
      socket.emit('unsubscribe:stock', symbol);
      socket.disconnect();
    };
  }, [symbol]);

  return <div>Current Price: ₹{price}</div>;
}
```

## 🔧 Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:4000/health

# GraphQL query
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ health }"}'

# With authentication
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"query":"{ stocks { symbol name } }"}'
```

### Using Postman

1. Create new request
2. Set method to POST
3. URL: `http://localhost:4000/graphql`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "query": "{ health }"
}
```

## 📚 Additional Resources

- [GraphQL Documentation](https://graphql.org/learn/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)

---

**Need help? Open an issue on GitHub!**
