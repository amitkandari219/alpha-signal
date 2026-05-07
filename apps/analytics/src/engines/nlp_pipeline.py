"""
NLP Pipeline for Alpha Signal

Processes news articles and social media posts for sentiment and risk extraction.
6-stage pipeline: preprocessing, entity linking, sentiment classification,
risk keyword extraction, aggregation, and scoring engine integration.
"""
import logging
import re
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
import uuid

from thefuzz import fuzz
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from sqlalchemy import create_engine, text
import anthropic

logger = logging.getLogger(__name__)


# Company abbreviation mapping for top stocks
COMPANY_ABBREVIATIONS = {
    'TCS': 'Tata Consultancy Services',
    'Infy': 'Infosys',
    'HDFC': 'HDFC Bank',
    'ICICI': 'ICICI Bank',
    'Reliance': 'Reliance Industries',
    'Wipro': 'Wipro Limited',
    'HCL': 'HCL Technologies',
    'Bharti': 'Bharti Airtel',
    'ITC': 'ITC Limited',
    'SBI': 'State Bank of India',
    'L&T': 'Larsen & Toubro',
    'Maruti': 'Maruti Suzuki',
    'M&M': 'Mahindra & Mahindra',
    'Asian Paints': 'Asian Paints Limited',
    'Titan': 'Titan Company',
    'UltraTech': 'UltraTech Cement',
    'Bajaj': 'Bajaj Finance',
    'HUL': 'Hindustan Unilever',
    'Kotak': 'Kotak Mahindra Bank',
    'Axis': 'Axis Bank'
}


# Risk keyword dictionary organized by category
RISK_KEYWORDS = {
    'FINANCIAL': {
        'HIGH': [
            'default', 'NPA', 'insolvency', 'NCLT', 'bankruptcy', 'debt trap',
            'loan recall', 'write-off', 'bad debt', 'credit watch downgrade'
        ],
        'MEDIUM': [
            'debt restructuring', 'cash crunch', 'working capital stress',
            'payment delay', 'liquidity crunch', 'provision', 'stressed asset',
            'overdraft', 'CDR'
        ],
        'LOW': [
            'leverage', 'debt levels', 'interest burden', 'refinancing'
        ]
    },
    'GOVERNANCE': {
        'HIGH': [
            'SEBI notice', 'auditor resignation', 'fraud allegation',
            'misrepresentation', 'insider trading', 'corporate governance failure',
            'whistleblower', 'pledge invocation'
        ],
        'MEDIUM': [
            'auditor change', 'qualified opinion', 'emphasis of matter',
            'related party transaction', 'board resignation', 'MD resignation',
            'CFO resignation', 'promoter selling', 'non-compliance'
        ],
        'LOW': [
            'governance review', 'compliance update', 'board meeting'
        ]
    },
    'REGULATORY': {
        'HIGH': [
            'penalty', 'fine', 'investigation', 'license revocation',
            'import ban', 'tax evasion', 'GST notice', 'income tax raid',
            'ED investigation', 'CBI investigation'
        ],
        'MEDIUM': [
            'show cause notice', 'compliance failure', 'export restriction',
            'environmental violation', 'pollution control', 'court order',
            'stay order'
        ],
        'LOW': [
            'regulatory filing', 'compliance update', 'inspection'
        ]
    },
    'OPERATIONAL': {
        'HIGH': [
            'plant shutdown', 'fire accident', 'major accident', 'supply disruption'
        ],
        'MEDIUM': [
            'labor dispute', 'strike', 'lockout', 'quality recall',
            'product recall', 'capacity constraint'
        ],
        'LOW': [
            'raw material shortage', 'maintenance shutdown', 'planned outage'
        ]
    },
    'LEGAL': {
        'HIGH': [
            'criminal case', 'money laundering', 'fraud case', 'class action'
        ],
        'MEDIUM': [
            'litigation', 'arbitration', 'consumer complaint',
            'patent infringement', 'trademark dispute', 'land dispute'
        ],
        'LOW': [
            'legal notice', 'dispute resolution', 'settlement'
        ]
    },
    'MANAGEMENT': {
        'HIGH': [
            'key man risk', 'promoter conflict', 'family dispute', 'hostile takeover'
        ],
        'MEDIUM': [
            'management change', 'succession concern', 'strategy shift',
            'diversification concern'
        ],
        'LOW': [
            'organizational restructuring', 'management appointment', 'board expansion'
        ]
    }
}


@dataclass
class ProcessedArticle:
    """Container for processed article data"""
    article_id: str
    company_id: Optional[str]
    sector_id: Optional[str]
    cleaned_text: str
    sentiment_score: float  # -1.0 to +1.0
    sentiment_label: str  # POSITIVE, NEGATIVE, NEUTRAL
    risk_keywords: List[Dict]  # [{term, category, severity}]
    entity_match_score: float  # Confidence of company linking


class NLPPipeline:
    """
    Main NLP pipeline for processing news articles
    """

    def __init__(self, db_url: Optional[str] = None):
        """Initialize pipeline with database connection"""
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # Initialize sentiment analyzers
        self.vader = SentimentIntensityAnalyzer()
        self.anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        self.anthropic_client = None
        if self.anthropic_key:
            try:
                self.anthropic_client = anthropic.Anthropic(api_key=self.anthropic_key)
                logger.info("Claude API initialized for sentiment analysis")
            except Exception as e:
                logger.warning(f"Could not initialize Claude API: {e}")

    # ============================================================================
    # STAGE 1: TEXT PREPROCESSING
    # ============================================================================

    def preprocess_text(self, text: str) -> str:
        """
        Clean and normalize text
        """
        if not text:
            return ""

        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)

        # Normalize unicode
        text = text.encode('ascii', 'ignore').decode('ascii')

        # Strip extra whitespace
        text = ' '.join(text.split())

        # Truncate to 512 tokens (approximate: 4 chars per token)
        max_chars = 512 * 4
        if len(text) > max_chars:
            text = text[:max_chars]

        return text

    def is_english(self, text: str) -> bool:
        """
        Simple heuristic: if >70% ASCII characters, treat as English
        """
        if not text:
            return False

        ascii_chars = sum(1 for c in text if ord(c) < 128)
        return (ascii_chars / len(text)) > 0.7

    # ============================================================================
    # STAGE 2: ENTITY LINKING
    # ============================================================================

    def link_entity(self, text: str, title: str = "") -> Tuple[Optional[str], Optional[str], float]:
        """
        Match company mentions against companies table

        Returns:
            (company_id, sector_id, match_score)
        """
        # Combine title and text for better matching
        search_text = f"{title} {text}".lower()

        # Fetch all companies
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol, bse_code, sector_id
                FROM companies
                WHERE is_active = true
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        best_match_company = None
        best_match_score = 0
        best_sector = None

        # Check abbreviations first
        for abbrev, full_name in COMPANY_ABBREVIATIONS.items():
            if abbrev.lower() in search_text:
                # Find matching company
                for company in companies:
                    if fuzz.ratio(full_name.lower(), company['company_name'].lower()) > 85:
                        return str(company['id']), str(company['sector_id']) if company['sector_id'] else None, 95.0

        # Fuzzy match against company names and symbols
        for company in companies:
            # Try matching symbol
            if company['nse_symbol'] and company['nse_symbol'].lower() in search_text:
                score = 95.0
            else:
                # Fuzzy match company name
                score = fuzz.partial_ratio(company['company_name'].lower(), search_text)

            if score > best_match_score and score >= 85:
                best_match_score = score
                best_match_company = company['id']
                best_sector = company['sector_id']

        if best_match_company:
            return str(best_match_company), str(best_sector) if best_sector else None, best_match_score

        # If no company match, try sector keywords
        sector_id = self._link_to_sector(search_text)
        if sector_id:
            return None, sector_id, 70.0

        return None, None, 0.0

    def _link_to_sector(self, text: str) -> Optional[str]:
        """Link to sector via keywords"""
        sector_keywords = {
            'technology': ['IT', 'software', 'technology', 'digital', 'cloud'],
            'banking': ['bank', 'banking', 'finance', 'NBFC', 'financial services'],
            'pharma': ['pharma', 'pharmaceutical', 'drug', 'medicine', 'healthcare'],
            'auto': ['auto', 'automobile', 'car', 'vehicle', 'EV'],
            'energy': ['oil', 'gas', 'energy', 'power', 'petroleum']
        }

        with self.engine.connect() as conn:
            for sector_name, keywords in sector_keywords.items():
                if any(keyword.lower() in text for keyword in keywords):
                    query = text("""
                        SELECT id FROM sectors
                        WHERE LOWER(sector_name) LIKE :sector_name
                        LIMIT 1
                    """)
                    result = conn.execute(query, {'sector_name': f'%{sector_name}%'})
                    row = result.fetchone()
                    if row:
                        return str(row.id)

        return None

    # ============================================================================
    # STAGE 3: SENTIMENT CLASSIFICATION
    # ============================================================================

    def classify_sentiment(self, text: str, title: str = "") -> Tuple[float, str]:
        """
        Classify sentiment using Claude API (primary) or VADER (fallback)

        Returns:
            (sentiment_score, sentiment_label)
        """
        combined_text = f"{title}. {text}"

        # Try Claude API first
        if self.anthropic_client:
            try:
                return self._classify_with_claude(combined_text)
            except Exception as e:
                logger.warning(f"Claude API failed: {e}, falling back to VADER")

        # Fallback to VADER
        return self._classify_with_vader(combined_text)

    def _classify_with_claude(self, text: str) -> Tuple[float, str]:
        """Classify using Claude API"""
        message = self.anthropic_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{
                "role": "user",
                "content": f"""Analyze the sentiment of this financial news article.
Respond with ONLY a JSON object in this exact format:
{{"sentiment": "POSITIVE|NEGATIVE|NEUTRAL", "score": 0.X}}

The score should be between -1.0 (very negative) and +1.0 (very positive).

Article: {text[:1000]}"""
            }]
        )

        response_text = message.content[0].text.strip()

        # Parse JSON response
        import json
        try:
            result = json.loads(response_text)
            sentiment_label = result['sentiment']
            sentiment_score = float(result['score'])

            return sentiment_score, sentiment_label
        except:
            # If parsing fails, fall back to VADER
            logger.warning("Could not parse Claude response, falling back to VADER")
            return self._classify_with_vader(text)

    def _classify_with_vader(self, text: str) -> Tuple[float, str]:
        """Classify using VADER sentiment analyzer"""
        scores = self.vader.polarity_scores(text)
        compound = scores['compound']

        # Map to label
        if compound >= 0.05:
            label = 'POSITIVE'
        elif compound <= -0.05:
            label = 'NEGATIVE'
        else:
            label = 'NEUTRAL'

        return compound, label

    # ============================================================================
    # STAGE 4: RISK KEYWORD EXTRACTION
    # ============================================================================

    def extract_risk_keywords(self, text: str, title: str = "") -> List[Dict]:
        """
        Extract risk keywords from text

        Returns:
            List of {term, category, severity}
        """
        combined_text = f"{title}. {text}".lower()
        found_keywords = []

        for category, severity_dict in RISK_KEYWORDS.items():
            for severity, keywords in severity_dict.items():
                for keyword in keywords:
                    # Use word boundary matching (case-insensitive)
                    pattern = r'\b' + re.escape(keyword.lower()) + r'\b'
                    if re.search(pattern, combined_text):
                        found_keywords.append({
                            'term': keyword,
                            'category': category,
                            'severity': severity
                        })

        return found_keywords

    # ============================================================================
    # STAGE 5: AGGREGATION
    # ============================================================================

    def update_sentiment_snapshot(self, company_id: str) -> Dict:
        """
        Compute daily sentiment snapshot for a company

        Returns:
            Snapshot data
        """
        with self.engine.connect() as conn:
            # Get articles from last 7 days
            query = text("""
                SELECT sentiment_score, published_at
                FROM news_articles
                WHERE company_id = :company_id
                AND sentiment_score IS NOT NULL
                AND published_at >= NOW() - INTERVAL '7 days'
                ORDER BY published_at DESC
            """)
            result = conn.execute(query, {'company_id': company_id})
            articles = [dict(row._mapping) for row in result]

        if not articles:
            return {'news_sentiment': 0.0, 'composite_sentiment': 0.0, 'sample_size': 0}

        # Weighted average: last 24h weighted 2x, last 7 days 1x
        now = datetime.now()
        weighted_sum = 0
        weight_total = 0

        for article in articles:
            score = float(article['sentiment_score'])
            age_hours = (now - article['published_at']).total_seconds() / 3600

            if age_hours <= 24:
                weight = 2.0
            else:
                weight = 1.0

            weighted_sum += score * weight
            weight_total += weight

        news_sentiment = weighted_sum / weight_total if weight_total > 0 else 0.0

        # Social sentiment (placeholder for now)
        social_sentiment = 0.0

        # Composite: 60% news + 40% social
        composite_sentiment = news_sentiment * 0.6 + social_sentiment * 0.4

        # Upsert into sentiment_snapshots
        today = datetime.now().date()
        with self.engine.connect() as conn:
            query = text("""
                INSERT INTO sentiment_snapshots (
                    id, company_id, date,
                    news_sentiment, social_sentiment, composite_sentiment,
                    sample_size
                ) VALUES (
                    :id, :company_id, :date,
                    :news_sentiment, :social_sentiment, :composite_sentiment,
                    :sample_size
                )
                ON CONFLICT (company_id, date)
                DO UPDATE SET
                    news_sentiment = EXCLUDED.news_sentiment,
                    social_sentiment = EXCLUDED.social_sentiment,
                    composite_sentiment = EXCLUDED.composite_sentiment,
                    sample_size = EXCLUDED.sample_size
            """)
            conn.execute(query, {
                'id': str(uuid.uuid4()),
                'company_id': company_id,
                'date': today,
                'news_sentiment': news_sentiment,
                'social_sentiment': social_sentiment,
                'composite_sentiment': composite_sentiment,
                'sample_size': len(articles)
            })
            conn.commit()

        logger.info(f"Updated sentiment snapshot for {company_id}: {composite_sentiment:.4f}")

        return {
            'news_sentiment': news_sentiment,
            'social_sentiment': social_sentiment,
            'composite_sentiment': composite_sentiment,
            'sample_size': len(articles)
        }

    # ============================================================================
    # MAIN PROCESSING PIPELINE
    # ============================================================================

    def process_article(self, article_id: str) -> ProcessedArticle:
        """
        Run full pipeline on a single article
        """
        # Fetch article
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, title, full_text, company_id, sector_id
                FROM news_articles
                WHERE id = :article_id
            """)
            result = conn.execute(query, {'article_id': article_id})
            row = result.fetchone()

            if not row:
                raise ValueError(f"Article {article_id} not found")

            article = dict(row._mapping)

        # Stage 1: Preprocessing
        cleaned_text = self.preprocess_text(article['full_text'] or "")

        if not self.is_english(cleaned_text):
            logger.warning(f"Article {article_id} is not English, skipping")
            raise ValueError("Non-English text")

        # Stage 2: Entity Linking (if not already linked)
        company_id = article['company_id']
        sector_id = article['sector_id']
        match_score = 100.0

        if not company_id:
            company_id, sector_id, match_score = self.link_entity(
                cleaned_text,
                article['title']
            )

        # Stage 3: Sentiment Classification
        sentiment_score, sentiment_label = self.classify_sentiment(
            cleaned_text,
            article['title']
        )

        # Stage 4: Risk Keyword Extraction
        risk_keywords = self.extract_risk_keywords(
            cleaned_text,
            article['title']
        )

        # Update article in database
        with self.engine.connect() as conn:
            risk_tags = [kw['term'] for kw in risk_keywords]

            query = text("""
                UPDATE news_articles
                SET company_id = :company_id,
                    sector_id = :sector_id,
                    sentiment_score = :sentiment_score,
                    sentiment_label = :sentiment_label,
                    risk_tags = :risk_tags
                WHERE id = :article_id
            """)
            conn.execute(query, {
                'article_id': article_id,
                'company_id': company_id,
                'sector_id': sector_id,
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                'risk_tags': risk_tags
            })
            conn.commit()

        logger.info(f"Processed article {article_id}: sentiment={sentiment_label} ({sentiment_score:.2f}), "
                   f"risks={len(risk_keywords)}, entity_match={match_score:.0f}%")

        return ProcessedArticle(
            article_id=article_id,
            company_id=company_id,
            sector_id=sector_id,
            cleaned_text=cleaned_text,
            sentiment_score=sentiment_score,
            sentiment_label=sentiment_label,
            risk_keywords=risk_keywords,
            entity_match_score=match_score
        )
