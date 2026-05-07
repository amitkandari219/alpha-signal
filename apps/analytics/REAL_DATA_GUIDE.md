# Real Stock Data Fetching Guide

This guide explains how to fetch real stock market data using Yahoo Finance API.

## 🎯 Features

- ✅ **Free API** - No API key required
- ✅ **Real-time data** - Current prices for NSE/BSE stocks
- ✅ **Historical data** - Up to 5 years of daily data
- ✅ **Nifty 50 coverage** - All 50 stocks included
- ✅ **Auto-update** - Daily scheduled fetches via Celery
- ✅ **Company info** - Sector, industry, market cap

## 📦 Installation

### 1. Install yfinance dependency

```bash
cd apps/analytics
pip install yfinance==0.2.36
```

Or rebuild the Docker analytics worker:

```bash
make docker-rebuild
```

### 2. Verify installation

```bash
python -c "import yfinance; print('✓ yfinance installed')"
```

## 🚀 Initial Data Seeding

Populate your database with 3 months of historical data for Nifty 50 stocks:

```bash
# Run the seeding script
python scripts/seed-real-stock-data.py
```

Expected output:
```
🚀 Starting Real Stock Data Seeding
============================================================

📊 Fetching data for 50 Nifty 50 stocks...

[1/50] Processing RELIANCE... ✓ Info ✓ 63 days | ₹2725.50 (+1.23%)
[2/50] Processing TCS... ✓ Info ✓ 63 days | ₹3890.20 (-0.45%)
...
[50/50] Processing LTIM... ✓ Info ✓ 63 days | ₹5234.80 (+2.10%)

============================================================
✅ Seeding Complete!
   Success: 48/50
   Errors: 2/50
```

**Note:** This will take 3-5 minutes to complete (rate limited to avoid Yahoo Finance throttling).

## 📅 Daily Auto-Update

The system automatically fetches new data daily via Celery Beat.

### Check schedule:

```bash
# View Celery Beat schedule
docker compose -f docker-compose.prod.yml exec analytics-beat \
  celery -A src.celery_app inspect scheduled
```

### Manual trigger:

```bash
# Trigger daily fetch now
docker compose exec analytics-worker \
  celery -A src.celery_app call fetch_nifty50_daily_data
```

## 🔧 Available Tasks

### 1. Fetch Daily Data (All Nifty 50)

```python
from tasks.fetch_stock_data import fetch_nifty50_daily_data

# Fetch current day's data for all stocks
result = fetch_nifty50_daily_data()
```

### 2. Fetch Historical Data (Single Stock)

```python
from tasks.fetch_stock_data import fetch_historical_data_for_stock

# Fetch 6 months of historical data for RELIANCE
result = fetch_historical_data_for_stock('RELIANCE', period='6mo')
```

### 3. Update Company Info

```python
from tasks.fetch_stock_data import update_company_info

# Update company information from Yahoo Finance
result = update_company_info('RELIANCE')
```

### 4. Get Top Gainers/Losers

```python
from tasks.fetch_stock_data import fetch_top_gainers_losers

# Get today's top gainers and losers
result = fetch_top_gainers_losers()
```

## 📊 Using the Data Fetcher Directly

```python
from data_fetchers.yahoo_finance_fetcher import YahooFinanceFetcher

fetcher = YahooFinanceFetcher()

# Get current price
price_data = fetcher.fetch_current_price('RELIANCE')
print(f"RELIANCE: ₹{price_data['close']:.2f} ({price_data['change_percent']:+.2f}%)")

# Get historical data
hist = fetcher.fetch_historical_data('TCS', period='1mo')
print(hist.tail())

# Get company info
info = fetcher.fetch_company_info('INFY')
print(info['company_name'], info['sector'])

# Fetch multiple stocks at once
stocks = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK']
data = fetcher.fetch_multiple_stocks(stocks)
for stock in data:
    print(f"{stock['symbol']}: ₹{stock['close']:.2f}")
```

## 🗓️ Celery Beat Schedule

Add to `celery_app.py`:

```python
from celery.schedules import crontab

app.conf.beat_schedule = {
    # Fetch Nifty 50 data daily at 3:45 PM IST (after market close)
    'fetch-nifty50-daily': {
        'task': 'fetch_nifty50_daily_data',
        'schedule': crontab(hour=10, minute=15),  # 3:45 PM IST = 10:15 AM UTC
    },

    # Update top gainers/losers every hour during market hours
    'fetch-gainers-losers': {
        'task': 'fetch_top_gainers_losers',
        'schedule': crontab(hour='4-11', minute=0),  # 9:30 AM - 4:30 PM IST
    },
}
```

## 📈 Data Coverage

### Nifty 50 Stocks (50 stocks):
- RELIANCE, TCS, HDFCBANK, INFY, HINDUNILVR
- ICICIBANK, KOTAKBANK, SBIN, BHARTIARTL, BAJFINANCE
- ITC, ASIANPAINT, AXISBANK, LT, MARUTI
- And 35 more...

Full list in: `data_fetchers/yahoo_finance_fetcher.py::NIFTY_50_SYMBOLS`

## 🔍 Troubleshooting

### Error: "No data found for symbol"

**Cause:** Symbol not listed on Yahoo Finance or incorrect format.

**Solution:** Verify symbol on [Yahoo Finance India](https://in.finance.yahoo.com/)

### Error: "Company not found in database"

**Cause:** Company record doesn't exist in `companies` table.

**Solution:** First seed companies data:
```bash
cd apps/api
npx prisma db seed
```

### Error: "Rate limit exceeded"

**Cause:** Too many requests to Yahoo Finance.

**Solution:** Add delays between requests (already implemented in seeder).

## 🌐 API Limitations

- **Free tier**: Unlimited for reasonable use
- **Rate limits**: ~2000 requests/hour (unofficial)
- **Data delay**: Real-time data for free (15-20 min delayed for some exchanges)
- **Historical data**: Up to 100 years available

## 🚦 Status Check

```bash
# Check last successful fetch
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U alphasignal -d alphasignal -c \
  "SELECT symbol, MAX(timestamp) as last_update FROM price_data GROUP BY symbol ORDER BY last_update DESC LIMIT 10;"
```

## 📝 Notes

- Data is stored in `price_data` TimescaleDB hypertable
- Duplicate data is automatically handled via UPSERT
- All prices are in INR (Indian Rupees)
- Timestamps are in UTC
- Volume is in number of shares traded

## 🔗 Resources

- [yfinance Documentation](https://pypi.org/project/yfinance/)
- [Yahoo Finance](https://finance.yahoo.com/)
- [NSE India](https://www.nseindia.com/)
- [BSE India](https://www.bseindia.com/)
