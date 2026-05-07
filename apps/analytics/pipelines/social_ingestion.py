"""
Social Media Ingestion Pipeline

Fetches social sentiment from:
- Twitter/X API v2 (tweets mentioning stock symbols + company names)
- Reddit (r/IndianStreetBets, r/IndiaInvestments) via PRAW

Features:
- Runs every 30 minutes
- Entity linking for each post/tweet
- Sentiment classification
- Aggregates into sentiment_snapshots daily
"""
import os
import logging
import time
from typing import List, Dict, Optional, Set
from datetime import datetime, timedelta
import requests
from sqlalchemy import create_engine, text
import json

logger = logging.getLogger(__name__)


class SocialIngestionPipeline:
    """
    Social media sentiment ingestion from Twitter and Reddit
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Twitter/X API v2 configuration
        self.twitter_bearer_token = os.getenv('TWITTER_BEARER_TOKEN')
        self.twitter_api_url = 'https://api.twitter.com/2/tweets/search/recent'

        # Reddit API configuration (PRAW)
        self.reddit_client_id = os.getenv('REDDIT_CLIENT_ID')
        self.reddit_client_secret = os.getenv('REDDIT_CLIENT_SECRET')
        self.reddit_user_agent = os.getenv('REDDIT_USER_AGENT', 'AlphaSignal/1.0')

        # Subreddits to monitor
        self.subreddits = ['IndianStreetBets', 'IndiaInvestments']

        # Tracking
        self.seen_tweet_ids: Set[str] = set()
        self.seen_reddit_ids: Set[str] = set()

    def run(self) -> Dict:
        """
        Main social ingestion run

        Returns:
            Dict with ingestion statistics
        """
        logger.info("Starting social media ingestion run")
        start_time = time.time()

        stats = {
            'tweets_fetched': 0,
            'reddit_posts_fetched': 0,
            'posts_ingested': 0,
            'sentiment_processed': 0,
            'errors': 0
        }

        # Fetch from Twitter
        if self.twitter_bearer_token:
            try:
                tweets = self._fetch_from_twitter()
                stats['tweets_fetched'] = len(tweets)

                for tweet in tweets:
                    if self._ingest_social_post(tweet, 'TWITTER'):
                        stats['posts_ingested'] += 1
                        stats['sentiment_processed'] += 1

                logger.info(f"Fetched {len(tweets)} tweets")
            except Exception as e:
                logger.error(f"Twitter fetch failed: {e}", exc_info=True)
                stats['errors'] += 1
        else:
            logger.warning("TWITTER_BEARER_TOKEN not configured, skipping Twitter")

        # Fetch from Reddit
        if self.reddit_client_id and self.reddit_client_secret:
            try:
                reddit_posts = self._fetch_from_reddit()
                stats['reddit_posts_fetched'] = len(reddit_posts)

                for post in reddit_posts:
                    if self._ingest_social_post(post, 'REDDIT'):
                        stats['posts_ingested'] += 1
                        stats['sentiment_processed'] += 1

                logger.info(f"Fetched {len(reddit_posts)} Reddit posts")
            except Exception as e:
                logger.error(f"Reddit fetch failed: {e}", exc_info=True)
                stats['errors'] += 1
        else:
            logger.warning("Reddit credentials not configured, skipping Reddit")

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"Social media ingestion completed: {stats}")

        return stats

    def _fetch_from_twitter(self) -> List[Dict]:
        """
        Fetch tweets from Twitter API v2

        Returns:
            List of tweet dicts
        """
        tweets = []

        # Get tracked companies and their symbols
        companies = self._get_tracked_companies()

        # Build search queries (combine multiple symbols with OR)
        symbols = [c['nse_symbol'] for c in companies if c.get('nse_symbol')]

        # Twitter API allows max 512 characters per query
        # Split into batches if needed
        batch_size = 10
        for i in range(0, len(symbols), batch_size):
            batch_symbols = symbols[i:i + batch_size]

            # Build query: ($DIXON OR $POLYCAB OR ...) lang:en
            query = '(' + ' OR '.join([f'${s}' for s in batch_symbols]) + ') lang:en'

            try:
                params = {
                    'query': query,
                    'max_results': 100,  # Max allowed by API
                    'tweet.fields': 'created_at,author_id,public_metrics',
                    'start_time': (datetime.utcnow() - timedelta(hours=1)).isoformat() + 'Z'
                }

                headers = {
                    'Authorization': f'Bearer {self.twitter_bearer_token}'
                }

                response = requests.get(
                    self.twitter_api_url,
                    params=params,
                    headers=headers,
                    timeout=30
                )
                response.raise_for_status()

                data = response.json()

                if 'data' in data:
                    for tweet in data['data']:
                        tweet_id = tweet['id']

                        # Skip if already seen
                        if tweet_id in self.seen_tweet_ids:
                            continue

                        tweets.append({
                            'external_id': tweet_id,
                            'text': tweet['text'],
                            'author_id': tweet.get('author_id'),
                            'created_at': tweet.get('created_at'),
                            'metrics': tweet.get('public_metrics', {}),
                            'platform': 'TWITTER'
                        })

                        self.seen_tweet_ids.add(tweet_id)

                # Rate limiting
                time.sleep(2)

            except Exception as e:
                logger.error(f"Twitter API request failed for batch: {e}")

        return tweets

    def _fetch_from_reddit(self) -> List[Dict]:
        """
        Fetch posts from Reddit using PRAW

        Returns:
            List of Reddit post dicts
        """
        posts = []

        try:
            import praw

            # Initialize Reddit client
            reddit = praw.Reddit(
                client_id=self.reddit_client_id,
                client_secret=self.reddit_client_secret,
                user_agent=self.reddit_user_agent
            )

            # Get tracked companies and their symbols
            companies = self._get_tracked_companies()
            symbols = set([c['nse_symbol'] for c in companies if c.get('nse_symbol')])

            # Search in each subreddit
            for subreddit_name in self.subreddits:
                try:
                    subreddit = reddit.subreddit(subreddit_name)

                    # Get recent posts (last 24 hours)
                    for submission in subreddit.new(limit=100):
                        # Check if post mentions any tracked symbol
                        post_text = f"{submission.title} {submission.selftext}".upper()

                        mentioned_symbols = [s for s in symbols if s in post_text]

                        if mentioned_symbols:
                            post_id = submission.id

                            # Skip if already seen
                            if post_id in self.seen_reddit_ids:
                                continue

                            posts.append({
                                'external_id': post_id,
                                'text': f"{submission.title}\n\n{submission.selftext}",
                                'author_id': str(submission.author) if submission.author else 'deleted',
                                'created_at': datetime.fromtimestamp(submission.created_utc).isoformat(),
                                'metrics': {
                                    'score': submission.score,
                                    'upvote_ratio': submission.upvote_ratio,
                                    'num_comments': submission.num_comments
                                },
                                'platform': 'REDDIT',
                                'subreddit': subreddit_name,
                                'mentioned_symbols': mentioned_symbols
                            })

                            self.seen_reddit_ids.add(post_id)

                except Exception as e:
                    logger.error(f"Error fetching from r/{subreddit_name}: {e}")

        except ImportError:
            logger.error("PRAW not installed. Install with: pip install praw")
        except Exception as e:
            logger.error(f"Reddit API error: {e}", exc_info=True)

        return posts

    def _get_tracked_companies(self) -> List[Dict]:
        """Get all active companies with symbols"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol, bse_code
                FROM companies
                WHERE is_active = true
                  AND nse_symbol IS NOT NULL
                ORDER BY company_name
            """)
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]

    def _ingest_social_post(self, post: Dict, platform: str) -> bool:
        """
        Ingest social media post into database

        Args:
            post: Post dict
            platform: 'TWITTER' or 'REDDIT'

        Returns:
            True if ingested successfully
        """
        try:
            # Link entity (find which company this is about)
            company_id = self._link_entity(post['text'])

            if not company_id:
                logger.debug(f"No company linked for post: {post['text'][:50]}...")
                return False

            # Classify sentiment
            sentiment_score, sentiment_label = self._classify_sentiment(post['text'])

            with self.engine.begin() as conn:
                # Check if post already exists
                check_query = text("""
                    SELECT id FROM social_posts
                    WHERE external_id = :external_id
                      AND platform = :platform
                """)
                result = conn.execute(check_query, {
                    'external_id': post['external_id'],
                    'platform': platform
                })
                if result.fetchone():
                    return False

                # Insert social post
                query = text("""
                    INSERT INTO social_posts (
                        id, company_id, platform, external_id,
                        text, author_id, sentiment_score, sentiment_label,
                        metrics, posted_at, created_at
                    ) VALUES (
                        gen_random_uuid(), :company_id, :platform, :external_id,
                        :text, :author_id, :sentiment_score, :sentiment_label,
                        :metrics, :posted_at, NOW()
                    )
                """)

                conn.execute(query, {
                    'company_id': company_id,
                    'platform': platform,
                    'external_id': post['external_id'],
                    'text': post['text'][:2000],  # Limit text length
                    'author_id': post.get('author_id', 'unknown'),
                    'sentiment_score': sentiment_score,
                    'sentiment_label': sentiment_label,
                    'metrics': json.dumps(post.get('metrics', {})),
                    'posted_at': post.get('created_at', datetime.now())
                })

                logger.info(f"Ingested {platform} post about company {company_id}")
                return True

        except Exception as e:
            logger.error(f"Failed to ingest social post: {e}", exc_info=True)
            return False

    def _link_entity(self, text: str) -> Optional[str]:
        """
        Link social media post to a company using entity matching

        Args:
            text: Post text

        Returns:
            Company ID or None
        """
        try:
            # Import NLP pipeline for entity linking
            from src.engines.nlp_pipeline import NLPPipeline

            nlp = NLPPipeline()
            company_id, sector_id, match_score = nlp.link_entity(text, "")

            # Require >75% match score for social posts (lower threshold due to informal language)
            if company_id and match_score >= 0.75:
                return company_id

            return None

        except Exception as e:
            logger.error(f"Entity linking failed: {e}")
            return None

    def _classify_sentiment(self, text: str) -> tuple:
        """
        Classify sentiment of social post

        Args:
            text: Post text

        Returns:
            (sentiment_score, sentiment_label)
        """
        try:
            # Import NLP pipeline for sentiment classification
            from src.engines.nlp_pipeline import NLPPipeline

            nlp = NLPPipeline()
            sentiment_score, sentiment_label = nlp.classify_sentiment(text, "")

            return sentiment_score, sentiment_label

        except Exception as e:
            logger.error(f"Sentiment classification failed: {e}")
            return 0.0, 'NEUTRAL'


def run_social_ingestion():
    """Celery task wrapper for social media ingestion"""
    pipeline = SocialIngestionPipeline()
    return pipeline.run()
