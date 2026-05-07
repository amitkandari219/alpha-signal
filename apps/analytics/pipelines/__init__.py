"""
Data Ingestion Pipelines for Alpha Signal

5 pipelines for fetching real-time and periodic data:
- price_ingestion: Real-time stock prices via Zerodha WebSocket
- financial_results_ingestion: Quarterly results from BSE API
- news_ingestion: News from NewsAPI + RSS feeds
- social_ingestion: Twitter/Reddit sentiment
- shareholding_ingestion: Quarterly shareholding patterns
"""
from .price_ingestion import PriceIngestionPipeline, run_price_websocket, run_eod_task
from .financial_results_ingestion import FinancialResultsIngestionPipeline, run_financial_results_scan
from .news_ingestion import NewsIngestionPipeline, run_news_ingestion
from .social_ingestion import SocialIngestionPipeline, run_social_ingestion
from .shareholding_ingestion import ShareholdingIngestionPipeline, run_quarterly_shareholding, run_daily_bulk_deals

__all__ = [
    # Price Ingestion
    'PriceIngestionPipeline',
    'run_price_websocket',
    'run_eod_task',

    # Financial Results Ingestion
    'FinancialResultsIngestionPipeline',
    'run_financial_results_scan',

    # News Ingestion
    'NewsIngestionPipeline',
    'run_news_ingestion',

    # Social Ingestion
    'SocialIngestionPipeline',
    'run_social_ingestion',

    # Shareholding Ingestion
    'ShareholdingIngestionPipeline',
    'run_quarterly_shareholding',
    'run_daily_bulk_deals',
]
