# Alpha Signal — AI-Powered Stock Intelligence Platform

A full-stack platform for Indian small/mid-cap equity research that ingests
prices, news, financial results, shareholding changes, and social signals
into a TimescaleDB hypertable store, runs distributed analytics workers
over them, and surfaces an LLM-synthesised thesis per stock through a
GraphQL API and React dashboard.

> _Status: architecture and core infrastructure complete. Runs locally
> end-to-end via `docker-compose up`. Ingestion pipelines wired and
> functional with yfinance + Kite Connect; some advanced analytics
> (AI patterns, full risk dashboard) WIP._

<!--
    [Add screenshots / video here once captured]
    Dashboard:        screenshots/dashboard.png
    Stock detail:     screenshots/stock-detail.png
    Risk view:        screenshots/risk-dashboard.png
    Quick walkthrough: screenshots/walkthrough.gif
-->

## Why this exists

Indian smallcap research tooling is fragmented — Screener has fundamentals,
TradingView has charts, ValuePickr has discussion, Trendlyne has
shareholding. Nobody combines them into a single signal-ranked view with
proper risk flags. Alpha Signal is an opinionated answer:

- **Ingest everything per stock** — prices (TimescaleDB hypertable), news,
  quarterly results, shareholding deltas, social mentions
- **Score with multiple lenses** — technical, fundamental, news sentiment,
  AI-extracted patterns
- **Surface as a single thesis** — LLM combines the signals into a
  read-at-a-glance bull/bear case per stock
- **Flag governance risks** — promoter pledges, auditor concerns,
  related-party transactions, debt spirals (8 risk types)

## Architecture

```
┌────────────────────────────┐     ┌──────────────────────────────────┐
│  React 18 + Vite           │◄───►│  Fastify + Apollo GraphQL        │
│  • Dashboard / Stock view  │     │  • Auth (JWT)                    │
│  • TanStack Query + Apollo │     │  • Prisma ORM                    │
│  • Zustand state           │     │  • Socket.io (live updates)      │
└────────────────────────────┘     │  • Razorpay billing integration  │
                                   └─────────────┬────────────────────┘
                                                 │
                                                 ▼
                              ┌─────────────────────────────────────┐
                              │ Python analytics workers (Celery)   │
                              │ • Price ingestion (yfinance, Kite)  │
                              │ • News ingestion + sentiment        │
                              │ • Quarterly results pipeline        │
                              │ • Shareholding change tracking      │
                              │ • Social signal collection          │
                              │ • LLM thesis synthesis (Anthropic)  │
                              │ • Technical / fundamental scoring   │
                              └────────────┬───────────────┬────────┘
                                           ▼               ▼
                                   ┌────────────┐    ┌──────────┐
                                   │ Postgres   │    │  Redis   │
                                   │ + Timescale│    │  (broker │
                                   │ DB         │    │   + cache│
                                   └────────────┘    └──────────┘
```

Five services in `docker-compose.yml`: `postgres` (TimescaleDB), `redis`,
`api` (Node), `web` (Vite), `analytics-worker` (Celery).

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + TypeScript + Tailwind, TanStack Query, Apollo Client, Zustand, Socket.io |
| API | Fastify + Apollo Server, Prisma ORM, JWT auth, Socket.io WebSockets |
| Analytics | Python 3.11 + Celery 5.3 + SQLAlchemy 2.0 + pandas + ta + Anthropic SDK |
| Market data | yfinance, Kite Connect (Zerodha), praw (Reddit), feedparser, BeautifulSoup |
| Database | PostgreSQL 16 + **TimescaleDB** hypertables for time-series |
| Cache / broker | Redis 7 |
| Billing | Razorpay (with tier-gating + webhook verification) |
| Infra | Docker Compose, Nginx-ready |

## Domain logic, in three pieces

### 1. Multi-source ingestion (`apps/analytics/pipelines/`)

Each pipeline is a Celery-scheduled job that pulls from a different source
and lands into the appropriate Postgres table:

- `price_ingestion.py` — daily OHLCV from yfinance + Kite Connect; lands
  into a TimescaleDB hypertable for fast time-series queries
- `news_ingestion.py` — RSS + scrape, sentiment scoring (VADER + TextBlob),
  duplicate-detection across sources
- `financial_results_ingestion.py` — quarterly numbers parsing, growth
  calculations (YoY, QoQ), red-flag detection (e.g. revenue ↓ but profit ↑
  via lower depreciation)
- `shareholding_ingestion.py` — promoter pledge changes, FII/DII flow,
  insider transaction tracking
- `social_ingestion.py` — Reddit/Twitter mentions with relevance filtering

Each pipeline writes provenance metadata (source URL, fetch timestamp,
parser version) so downstream scoring can audit where data came from.

### 2. Scoring engine + LLM thesis synthesis

The scoring layer combines multi-lens signals per stock:

- **Technical** (`apps/analytics`): pandas + `ta` library — RSI, MACD,
  moving averages, support/resistance, swing-low detection
- **Fundamental**: ROE, debt/equity, FCF growth, working-capital trend
- **News sentiment**: rolling 30-day sentiment with recency-weighting
- **Pattern detection**: AI-extracted patterns from earnings calls, news
  text (uses Anthropic API)

Outputs feed into a per-stock thesis document — the LLM combines scored
signals + recent news into a structured bull-case / bear-case JSON that
the frontend renders as a single readable view.

### 3. Risk-flag system (`Severity` enum + `RiskFlagType`)

8 risk types modeled in the Prisma schema:

```
PROMOTER_PLEDGE       AUDITOR_CONCERN
RELATED_PARTY         DEBT_SPIRAL
EARNINGS_MANIPULATION GOVERNANCE
LITIGATION            REGULATORY
```

Each flag has a severity (HIGH / MEDIUM / LOW), a confidence level, and a
provenance pointer back to the source document that triggered it. The
risk dashboard surfaces all active flags per stock with drill-through to
source.

## Quick start

```bash
# 1. Clone
git clone <repo-url> && cd alpha-signal

# 2. Copy env template and fill in keys
cp .env.example .env
# Required: ANTHROPIC_API_KEY, KITE_API_KEY (optional, falls back to yfinance)

# 3. Boot everything
docker-compose up -d

# 4. Apply Prisma migrations
docker-compose exec api npm run prisma:migrate

# 5. Visit
open http://localhost:3000          # web app
open http://localhost:4000/graphql  # GraphQL playground
```

For first-time setup, `apps/analytics/seed_historical_data.py` backfills
~30 days of price + news data for the configured stock universe so the
dashboard shows real signals immediately.

## What works today

- ✅ Multi-service `docker-compose up` boots the full stack cleanly
- ✅ All 5 ingestion pipelines (price, news, financials, shareholding, social)
- ✅ TimescaleDB hypertable for stock prices with materialized-view rollups
- ✅ GraphQL API with auth, queries for stock detail / dashboard / search
- ✅ Frontend: dashboard list, stock detail page, fundamental/technical/news panels, theme toggle
- ✅ LLM thesis synthesis (Anthropic API integration with cost tracking)
- ✅ Razorpay billing integration with tier-gating middleware
- ✅ Socket.io for live updates

## What's WIP

- ⏳ AI pattern detection — base implementation works, accuracy tuning ongoing
- ⏳ Risk dashboard — 8 risk types modeled, flag-detection rules implemented
  for 4 of 8 (promoter pledge, debt spiral, related-party, auditor concern);
  remaining 4 are designed not implemented
- ⏳ Live deployment — nginx config exists, not yet pointed at production domain
- ⏳ Backtest framework for scoring engine validation
- ⏳ SEBI compliance review — research investment-advisor regulations applied
  in design; not legally cleared for paid public offering

## Repo structure

```
alpha-signal/
├── apps/
│   ├── web/                 # React 18 + Vite frontend
│   │   ├── src/pages/       # Dashboard, StockDetail, Reports, Auth
│   │   ├── src/components/  # Panels, charts, navigation
│   │   └── src/lib/         # Apollo client, Socket.io, auth
│   ├── api/                 # Fastify + Apollo GraphQL backend
│   │   ├── src/             # Resolvers, schema, services
│   │   ├── prisma/          # Schema + migrations
│   │   └── scripts/         # DB ops, seed scripts, materialized views
│   └── analytics/           # Python Celery workers
│       ├── pipelines/       # 5 ingestion pipelines
│       ├── src/             # tasks, celery_app
│       └── utils/           # llm_cost_tracker, logger
├── packages/
│   └── shared/              # Cross-app TypeScript types
├── scripts/                 # Root-level utilities (db checks, dev helpers)
├── docs/
│   ├── archive/             # Historical implementation logs (preserved)
│   └── reports/             # Architecture decisions, feature designs
├── docker-compose.yml
├── docker-compose.prod.yml
└── nginx/                   # Production reverse-proxy config
```

## Operational notes

- **Cost tracking:** `apps/analytics/utils/llm_cost_tracker.py` records
  per-job Anthropic token usage so the analytics layer's LLM bill is
  attributable per stock / per pipeline run
- **TimescaleDB choice:** smallcap research generates dense per-day
  per-stock series; hypertables let aggregation queries finish in
  milliseconds instead of seconds at scale
- **Razorpay over Stripe:** Indian-first payment, supports UPI directly,
  required for any Indian retail target

## License

MIT (see `LICENSE`).
