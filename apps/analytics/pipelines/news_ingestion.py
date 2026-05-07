"""
News Ingestion Pipeline

Fetches news from multiple sources:
- NewsAPI (newsapi.org) with Indian market keywords
- RSS feeds: Moneycontrol, Economic Times, LiveMint, Business Standard

Features:
- Runs every 15 minutes
- Deduplicates by URL and title similarity (>85% = duplicate)
- Triggers NLP processing for each unique article
- Rate limit awareness
"""
import os
import logging
import time
from typing import List, Dict, Optional, Set
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import feedparser
from thefuzz import fuzz
from sqlalchemy import create_engine, text
import hashlib

logger = logging.getLogger(__name__)


class NewsIngestionPipeline:
    """
    News ingestion from NewsAPI and RSS feeds
    """

    # RSS feed URLs
    RSS_FEEDS = {
        'moneycontrol': 'https://www.moneycontrol.com/rss/business.xml',
        'economic_times': 'https://economictimes.indiatimes.com/markets/stocks/rssfeeds/2146842.cms',
        'livemint': 'https://www.livemint.com/rss/markets',
        'business_standard': 'https://www.business-standard.com/rss/markets-106.rss'
    }

    # Indian market keywords for NewsAPI
    MARKET_KEYWORDS = [
        'NSE', 'BSE', 'Nifty', 'Sensex',
        'Indian stocks', 'Indian market', 'Indian company',
        'earnings', 'quarterly results', 'IPO India'
    ]

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # NewsAPI configuration
        self.newsapi_key = os.getenv('NEWSAPI_KEY')
        self.newsapi_url = 'https://newsapi.org/v2/everything'

        # Tracking
        self.seen_urls: Set[str] = set()
        self.seen_titles: Set[str] = set()

    def run(self) -> Dict:
        """
        Main ingestion run

        Returns:
            Dict with ingestion statistics
        """
        logger.info("Starting news ingestion run")
        start_time = time.time()

        stats = {
            'newsapi_articles': 0,
            'rss_articles': 0,
            'duplicates_filtered': 0,
            'articles_ingested': 0,
            'nlp_tasks_triggered': 0,
            'errors': 0
        }

        all_articles = []

        # Fetch from NewsAPI
        if self.newsapi_key:
            try:
                newsapi_articles = self._fetch_from_newsapi()
                all_articles.extend(newsapi_articles)
                stats['newsapi_articles'] = len(newsapi_articles)
                logger.info(f"Fetched {len(newsapi_articles)} articles from NewsAPI")
            except Exception as e:
                logger.error(f"NewsAPI fetch failed: {e}", exc_info=True)
                stats['errors'] += 1
        else:
            logger.warning("NEWSAPI_KEY not configured, skipping NewsAPI")

        # Fetch from RSS feeds
        for source, feed_url in self.RSS_FEEDS.items():
            try:
                rss_articles = self._fetch_from_rss(source, feed_url)
                all_articles.extend(rss_articles)
                stats['rss_articles'] += len(rss_articles)
                logger.info(f"Fetched {len(rss_articles)} articles from {source}")
            except Exception as e:
                logger.error(f"RSS fetch from {source} failed: {e}", exc_info=True)
                stats['errors'] += 1

        # Deduplicate articles
        unique_articles = self._deduplicate_articles(all_articles)
        stats['duplicates_filtered'] = len(all_articles) - len(unique_articles)

        logger.info(f"Filtered {stats['duplicates_filtered']} duplicates, "
                   f"{len(unique_articles)} unique articles")

        # Ingest unique articles
        for article in unique_articles:
            try:
                article_id = self._ingest_article(article)
                if article_id:
                    stats['articles_ingested'] += 1

                    # Trigger NLP processing (async via Celery)
                    self._trigger_nlp_processing(article_id)
                    stats['nlp_tasks_triggered'] += 1

            except Exception as e:
                logger.error(f"Failed to ingest article {article.get('title', 'unknown')}: {e}")
                stats['errors'] += 1

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"News ingestion completed: {stats}")

        return stats

    def _fetch_from_newsapi(self) -> List[Dict]:
        """
        Fetch articles from NewsAPI

        Returns:
            List of article dicts
        """
        articles = []

        # Fetch for each keyword
        for keyword in self.MARKET_KEYWORDS[:3]:  # Limit to 3 keywords to respect rate limits
            try:
                params = {
                    'apiKey': self.newsapi_key,
                    'q': keyword,
                    'language': 'en',
                    'sortBy': 'publishedAt',
                    'from': (datetime.now() - timedelta(hours=24)).isoformat(),
                    'pageSize': 20
                }

                response = requests.get(self.newsapi_url, params=params, timeout=30)
                response.raise_for_status()

                data = response.json()

                if data.get('status') == 'ok':
                    for item in data.get('articles', []):
                        articles.append({
                            'title': item.get('title', ''),
                            'url': item.get('url', ''),
                            'source': item.get('source', {}).get('name', 'NewsAPI'),
                            'published_at': item.get('publishedAt'),
                            'full_text': item.get('content') or item.get('description', ''),
                            'summary': item.get('description', '')
                        })

                # Rate limiting: sleep between requests
                time.sleep(1)

            except Exception as e:
                logger.error(f"NewsAPI request failed for keyword '{keyword}': {e}")

        return articles

    def _fetch_from_rss(self, source: str, feed_url: str) -> List[Dict]:
        """
        Fetch articles from RSS feed

        Args:
            source: Source name (e.g., 'moneycontrol')
            feed_url: RSS feed URL

        Returns:
            List of article dicts
        """
        articles = []

        try:
            feed = feedparser.parse(feed_url)

            for entry in feed.entries[:50]:  # Limit to 50 most recent
                # Parse published date
                published_at = None
                if hasattr(entry, 'published_parsed'):
                    published_at = datetime(*entry.published_parsed[:6])
                elif hasattr(entry, 'updated_parsed'):
                    published_at = datetime(*entry.updated_parsed[:6])

                # Skip old articles (>7 days)
                if published_at and (datetime.now() - published_at).days > 7:
                    continue

                # Extract content
                full_text = ''
                if hasattr(entry, 'content'):
                    full_text = entry.content[0].value if entry.content else ''
                elif hasattr(entry, 'description'):
                    full_text = entry.description

                # Clean HTML tags
                if full_text:
                    soup = BeautifulSoup(full_text, 'html.parser')
                    full_text = soup.get_text(strip=True)

                articles.append({
                    'title': entry.get('title', ''),
                    'url': entry.get('link', ''),
                    'source': source.replace('_', ' ').title(),
                    'published_at': published_at.isoformat() if published_at else None,
                    'full_text': full_text,
                    'summary': entry.get('summary', '')[:500]  # Limit summary length
                })

        except Exception as e:
            logger.error(f"RSS parsing failed for {source}: {e}", exc_info=True)
            raise

        return articles

    def _deduplicate_articles(self, articles: List[Dict]) -> List[Dict]:
        """
        Remove duplicate articles based on URL and title similarity

        Args:
            articles: List of article dicts

        Returns:
            List of unique articles
        """
        unique_articles = []
        seen_urls = set()
        seen_title_hashes = set()

        for article in articles:
            url = article.get('url', '')
            title = article.get('title', '')

            # Skip if URL already seen
            if url and url in seen_urls:
                continue

            # Check title similarity against all seen titles
            is_duplicate = False
            title_lower = title.lower()

            for seen_title in self.seen_titles:
                similarity = fuzz.ratio(title_lower, seen_title)
                if similarity > 85:  # >85% similarity = duplicate
                    is_duplicate = True
                    break

            if not is_duplicate:
                unique_articles.append(article)
                if url:
                    seen_urls.add(url)
                if title:
                    self.seen_titles.add(title_lower)

        return unique_articles

    def _ingest_article(self, article: Dict) -> Optional[str]:
        """
        Insert article into database

        Args:
            article: Article dict

        Returns:
            Article ID (UUID) if successful
        """
        try:
            with self.engine.begin() as conn:
                # Generate URL hash for deduplication
                url = article.get('url', '')
                if not url:
                    url = f"rss://{article['source']}/{hashlib.md5(article['title'].encode()).hexdigest()}"

                # Check if article already exists
                check_query = text("""
                    SELECT id FROM news_articles
                    WHERE url = :url
                """)
                result = conn.execute(check_query, {'url': url})
                existing = result.fetchone()

                if existing:
                    logger.debug(f"Article already exists: {article['title'][:50]}")
                    return None

                # Parse published_at
                published_at = article.get('published_at')
                if isinstance(published_at, str):
                    try:
                        published_at = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    except:
                        published_at = datetime.now()
                elif not published_at:
                    published_at = datetime.now()

                # Insert article
                query = text("""
                    INSERT INTO news_articles (
                        id, title, url, source, full_text, summary,
                        published_at, created_at
                    ) VALUES (
                        gen_random_uuid(), :title, :url, :source, :full_text, :summary,
                        :published_at, NOW()
                    )
                    RETURNING id
                """)

                result = conn.execute(query, {
                    'title': article['title'][:500],  # Limit title length
                    'url': url,
                    'source': article.get('source', 'Unknown'),
                    'full_text': article.get('full_text', '')[:10000],  # Limit content
                    'summary': article.get('summary', '')[:1000],
                    'published_at': published_at
                })

                article_id = result.fetchone()[0]
                logger.info(f"Ingested article: {article['title'][:50]}... (ID: {article_id})")

                return str(article_id)

        except Exception as e:
            logger.error(f"Database insert failed for article: {e}", exc_info=True)
            raise

    def _trigger_nlp_processing(self, article_id: str):
        """
        Trigger NLP processing task for article

        Args:
            article_id: UUID of article
        """
        try:
            # Import here to avoid circular dependency
            from src.tasks import process_news_article

            # Queue NLP processing task
            process_news_article.delay(article_id)
            logger.debug(f"Queued NLP processing for article {article_id}")

        except Exception as e:
            logger.error(f"Failed to trigger NLP processing: {e}")


def run_news_ingestion():
    """
    Celery task wrapper for news ingestion
    """
    pipeline = NewsIngestionPipeline()
    return pipeline.run()
