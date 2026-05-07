"""
Celery tasks for stock data processing and analysis
"""
from celery import Task
from .celery_app import app
from .engines.scoring_engine import ScoringEngine
from .engines.financial_ratios import FinancialRatioEngine
from sqlalchemy import create_engine, text
import os
import json
import time

# Import structured logger
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from utils.logger import logger, log_celery_task, log_error


class CallbackTask(Task):
    """Base task with callbacks using structured logging"""

    def on_success(self, retval, task_id, args, kwargs):
        log_celery_task(
            task_name=self.name,
            task_id=task_id,
            status='success',
            metadata={'result': retval, 'args': args}
        )

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        log_celery_task(
            task_name=self.name,
            task_id=task_id,
            status='failure',
            error=exc,
            metadata={'args': args, 'kwargs': kwargs}
        )


@app.task(base=CallbackTask, bind=True)
def fetch_stock_data(self, symbol: str, exchange: str = 'NSE'):
    """
    Fetch real-time stock data for a given symbol

    Args:
        symbol: Stock symbol (e.g., 'RELIANCE')
        exchange: Exchange name (NSE or BSE)

    Returns:
        dict: Stock data
    """
    start_time = time.time()

    log_celery_task(
        task_name=self.name,
        task_id=self.request.id,
        status='started',
        metadata={'symbol': symbol, 'exchange': exchange}
    )

    try:
        # Placeholder implementation
        result = {
            'symbol': symbol,
            'exchange': exchange,
            'status': 'success',
            'message': 'Task executed successfully'
        }

        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='success',
            duration_ms=duration_ms,
            metadata={'symbol': symbol, 'exchange': exchange}
        )

        return result
    except Exception as e:
        duration_ms = (time.time() - start_time) * 1000
        log_celery_task(
            task_name=self.name,
            task_id=self.request.id,
            status='failure',
            duration_ms=duration_ms,
            error=e,
            metadata={'symbol': symbol, 'exchange': exchange}
        )
        raise


@app.task(base=CallbackTask, bind=True)
def calculate_technical_indicators(self, symbol: str, period: int = 14):
    """
    Calculate technical indicators for a stock

    Args:
        symbol: Stock symbol
        period: Period for indicator calculation

    Returns:
        dict: Technical indicators
    """
    logger.info(f"Calculating technical indicators for {symbol} with period {period}")

    # Placeholder implementation
    return {
        'symbol': symbol,
        'period': period,
        'indicators': {},
        'status': 'success'
    }


@app.task(base=CallbackTask, bind=True)
def run_ai_analysis(self, symbol: str):
    """
    Run AI-powered analysis on stock data

    Args:
        symbol: Stock symbol

    Returns:
        dict: AI analysis results
    """
    logger.info(f"Running AI analysis for {symbol}")

    # Placeholder implementation
    return {
        'symbol': symbol,
        'analysis': {},
        'confidence': 0.0,
        'status': 'success'
    }


@app.task(base=CallbackTask, bind=True)
def compute_all_scores(self, company_id: str):
    """
    Compute all 5 composite scores for a company

    Args:
        company_id: UUID of the company

    Returns:
        dict: All scores with factor breakdown
    """
    logger.info(f"Computing all scores for company {company_id}")

    try:
        engine = ScoringEngine()
        scores = engine.compute_all_scores(company_id)

        # Store scores in database
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        with db_engine.connect() as conn:
            # Upsert scores
            for score_type, score in scores.items():
                # Prepare factor breakdown as JSON
                factor_breakdown = [
                    {
                        'factor_name': f.factor_name,
                        'weight': f.weight,
                        'raw_value': f.raw_value,
                        'normalized_score': f.normalized_score,
                        'weighted_contribution': f.weighted_contribution,
                        'is_missing': f.is_missing
                    }
                    for f in score.factors
                ]

                query = text("""
                    INSERT INTO composite_scores (
                        company_id, score_type, total_score, factor_breakdown, computed_at
                    ) VALUES (
                        :company_id, :score_type, :total_score, :factor_breakdown, NOW()
                    )
                    ON CONFLICT (company_id, score_type)
                    DO UPDATE SET
                        total_score = EXCLUDED.total_score,
                        factor_breakdown = EXCLUDED.factor_breakdown,
                        computed_at = EXCLUDED.computed_at
                """)

                conn.execute(query, {
                    'company_id': company_id,
                    'score_type': score_type,
                    'total_score': score.total_score,
                    'factor_breakdown': json.dumps(factor_breakdown)
                })

            conn.commit()

        logger.info(f"Successfully computed and stored all scores for {company_id}")

        return {
            'company_id': company_id,
            'quality': scores['quality'].total_score,
            'growth': scores['growth'].total_score,
            'risk': scores['risk'].total_score,
            'sentiment': scores['sentiment'].total_score,
            'momentum': scores['momentum'].total_score,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error computing scores for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def recompute_all_companies(self):
    """
    Batch task: Recompute scores for all active companies
    Runs daily at 04:00 IST

    Returns:
        dict: Summary of computation
    """
    logger.info("Starting batch recomputation of all company scores")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all active companies
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                ORDER BY company_name
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        logger.info(f"Found {len(companies)} active companies to process")

        # Compute scores for each company
        success_count = 0
        error_count = 0
        errors = []

        for company in companies:
            try:
                compute_all_scores.delay(str(company['id']))
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({
                    'company': company['company_name'],
                    'error': str(e)
                })
                logger.error(f"Error queuing {company['company_name']}: {e}")

        logger.info(f"Batch recomputation queued: {success_count} success, {error_count} errors")

        return {
            'total_companies': len(companies),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch recomputation: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def compute_financial_ratios(self, company_id: str):
    """
    Compute 45+ financial ratios for a company and trigger score recomputation

    Args:
        company_id: UUID of the company

    Returns:
        dict: Computed ratios and updated scores
    """
    logger.info(f"Computing financial ratios for company {company_id}")

    try:
        # Compute ratios
        ratio_engine = FinancialRatioEngine()
        ratios = ratio_engine.compute_all_ratios(company_id)

        logger.info(f"Ratios computed for {company_id}, now triggering score recomputation")

        # Automatically trigger score recomputation
        # This ensures scores always use the latest computed ratios
        scoring_engine = ScoringEngine()
        scores = scoring_engine.compute_all_scores(company_id)

        # Store scores in database (already done in compute_all_scores)

        logger.info(f"Successfully computed ratios and scores for {company_id}")

        return {
            'company_id': company_id,
            'ratios_computed': True,
            'quality_flags': [
                flag for flag in [
                    'limited_history' if ratios.has_limited_history else None,
                    'negative_equity' if ratios.has_negative_equity else None,
                    'stock_split' if ratios.possible_stock_split else None,
                    'zero_revenue' if ratios.has_zero_revenue_quarters else None,
                ] if flag
            ],
            'key_ratios': {
                'revenue_cagr_5y': ratios.revenue_cagr_5y,
                'profit_cagr_5y': ratios.profit_cagr_5y,
                'roe_ttm': ratios.roe_ttm,
                'roce_ttm': ratios.roce_ttm,
                'debt_to_equity': ratios.debt_to_equity,
                'ocf_to_pat_3y_avg': ratios.ocf_to_pat_3y_avg,
            },
            'scores': {
                'quality': scores['quality'].total_score,
                'growth': scores['growth'].total_score,
                'risk': scores['risk'].total_score,
                'sentiment': scores['sentiment'].total_score,
                'momentum': scores['momentum'].total_score,
            },
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error computing ratios for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def compute_technical_indicators(self, company_id: str):
    """
    Compute technical indicators for a company and trigger score update

    Args:
        company_id: UUID of the company

    Returns:
        dict: Technical indicators, trend analysis, momentum score
    """
    logger.info(f"Computing technical indicators for company {company_id}")

    try:
        from .engines.technical_analysis import TechnicalAnalysisEngine

        # Compute indicators
        tech_engine = TechnicalAnalysisEngine()
        result = tech_engine.compute_all_indicators(company_id)

        logger.info(f"Technical indicators computed for {company_id}, now triggering score update")

        # Automatically trigger score recomputation
        # This ensures Momentum Score uses the latest technical data
        scoring_engine = ScoringEngine()
        scores = scoring_engine.compute_all_scores(company_id)

        logger.info(f"Successfully computed technical indicators and updated scores for {company_id}")

        return {
            'company_id': company_id,
            'indicators_computed': result['indicators_computed'],
            'trend_status': result['trend_analysis'].trend_status,
            'breakout_active': result['trend_analysis'].breakout_active,
            'momentum_score': result['momentum_score'].total_score,
            'quality_flags': result['quality_flags'],
            'updated_scores': {
                'quality': scores['quality'].total_score,
                'growth': scores['growth'].total_score,
                'risk': scores['risk'].total_score,
                'sentiment': scores['sentiment'].total_score,
                'momentum': scores['momentum'].total_score,
            },
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error computing technical indicators for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def process_news_article(self, article_id: str):
    """
    Process a single news article through NLP pipeline

    Args:
        article_id: UUID of the news article

    Returns:
        dict: Processing results with sentiment and risk keywords
    """
    logger.info(f"Processing news article {article_id}")

    try:
        from .engines.nlp_pipeline import NLPPipeline

        # Process article
        nlp = NLPPipeline()
        result = nlp.process_article(article_id)

        logger.info(f"Article {article_id} processed, now updating sentiment snapshot")

        # Update sentiment snapshot if company linked
        if result.company_id:
            snapshot = nlp.update_sentiment_snapshot(result.company_id)

            # Trigger score recomputation
            scoring_engine = ScoringEngine()
            scores = scoring_engine.compute_all_scores(result.company_id)

            logger.info(f"Successfully processed article and updated scores for {result.company_id}")

            return {
                'article_id': article_id,
                'company_id': result.company_id,
                'sentiment_score': result.sentiment_score,
                'sentiment_label': result.sentiment_label,
                'risk_keywords_count': len(result.risk_keywords),
                'entity_match_score': result.entity_match_score,
                'snapshot': snapshot,
                'updated_scores': {
                    'sentiment': scores['sentiment'].total_score
                },
                'status': 'success'
            }
        else:
            return {
                'article_id': article_id,
                'company_id': None,
                'sentiment_score': result.sentiment_score,
                'sentiment_label': result.sentiment_label,
                'risk_keywords_count': len(result.risk_keywords),
                'entity_match_score': result.entity_match_score,
                'status': 'success_no_company_link'
            }

    except Exception as e:
        logger.error(f"Error processing article {article_id}: {e}", exc_info=True)
        return {
            'article_id': article_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def update_sentiment_snapshot(self, company_id: str):
    """
    Update sentiment snapshot for a company

    Args:
        company_id: UUID of the company

    Returns:
        dict: Snapshot data
    """
    logger.info(f"Updating sentiment snapshot for company {company_id}")

    try:
        from .engines.nlp_pipeline import NLPPipeline

        nlp = NLPPipeline()
        snapshot = nlp.update_sentiment_snapshot(company_id)

        logger.info(f"Successfully updated sentiment snapshot for {company_id}")

        return {
            'company_id': company_id,
            'snapshot': snapshot,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error updating sentiment snapshot for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def batch_process_articles(self, article_ids: list):
    """
    Process multiple articles efficiently

    Args:
        article_ids: List of article UUIDs

    Returns:
        dict: Summary of processing
    """
    logger.info(f"Batch processing {len(article_ids)} articles")

    try:
        from .engines.nlp_pipeline import NLPPipeline

        nlp = NLPPipeline()
        results = []
        companies_to_update = set()

        for article_id in article_ids:
            try:
                result = nlp.process_article(article_id)
                results.append({
                    'article_id': article_id,
                    'status': 'success',
                    'company_id': result.company_id
                })

                if result.company_id:
                    companies_to_update.add(result.company_id)

            except Exception as e:
                logger.error(f"Error processing article {article_id}: {e}")
                results.append({
                    'article_id': article_id,
                    'status': 'error',
                    'error': str(e)
                })

        # Update sentiment snapshots for all affected companies
        for company_id in companies_to_update:
            nlp.update_sentiment_snapshot(company_id)

        logger.info(f"Batch processing completed: {len(results)} articles, {len(companies_to_update)} companies updated")

        return {
            'total_articles': len(article_ids),
            'processed': len([r for r in results if r['status'] == 'success']),
            'errors': len([r for r in results if r['status'] == 'error']),
            'companies_updated': len(companies_to_update),
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch processing: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def generate_summary(self, company_id: str, summary_type: str):
    """
    Generate AI summary for a company

    Args:
        company_id: UUID of the company
        summary_type: One of 6 types:
            - business_overview
            - earnings_summary
            - bull_case
            - bear_case
            - news_digest
            - risk_assessment

    Returns:
        dict: Summary content and metadata
    """
    logger.info(f"Generating {summary_type} summary for company {company_id}")

    try:
        from .engines.llm_engine import LLMEngine

        llm = LLMEngine()
        summary = llm.generate_summary(company_id, summary_type)

        return {
            'company_id': company_id,
            'summary_type': summary_type,
            'content': summary.content,
            'model_version': summary.model_version,
            'token_usage': summary.token_usage,
            'generated_at': summary.generated_at.isoformat(),
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error generating summary for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'summary_type': summary_type,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def regenerate_all_summaries(self, company_id: str):
    """
    Regenerate all 6 summary types for a company

    Args:
        company_id: UUID of the company

    Returns:
        dict: Results for all summary types
    """
    logger.info(f"Regenerating all summaries for company {company_id}")

    try:
        from .engines.llm_engine import LLMEngine

        llm = LLMEngine()
        results = llm.regenerate_all_summaries(company_id)

        summary_data = {}
        success_count = 0
        error_count = 0

        for summary_type, summary in results.items():
            if summary:
                summary_data[summary_type] = {
                    'status': 'success',
                    'token_usage': summary.token_usage
                }
                success_count += 1
            else:
                summary_data[summary_type] = {
                    'status': 'error'
                }
                error_count += 1

        logger.info(f"Regenerated summaries for {company_id}: {success_count} success, {error_count} errors")

        return {
            'company_id': company_id,
            'summary_types': summary_data,
            'success_count': success_count,
            'error_count': error_count,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error regenerating summaries for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def batch_regenerate_summaries(self, company_ids: list = None, summary_type: str = None):
    """
    Batch regenerate summaries for multiple companies

    Args:
        company_ids: Optional list of company UUIDs. If None, processes all active companies.
        summary_type: Optional - specific summary type to regenerate.
                     If None, regenerates all types.

    Returns:
        dict: Summary of batch operation
    """
    try:
        # If no company_ids provided, get all active companies
        if not company_ids:
            db_url = os.getenv(
                'DATABASE_URL',
                'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
            )
            db_engine = create_engine(db_url)

            with db_engine.connect() as conn:
                query = text("SELECT id FROM companies WHERE is_active = true")
                result = conn.execute(query)
                company_ids = [str(row[0]) for row in result]

        logger.info(f"Batch regenerating summaries for {len(company_ids)} companies")

        success_count = 0
        error_count = 0
        errors = []

        for company_id in company_ids:
            try:
                if summary_type:
                    # Regenerate specific summary type
                    generate_summary.delay(company_id, summary_type)
                else:
                    # Regenerate all summaries
                    regenerate_all_summaries.delay(company_id)

                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({
                    'company_id': company_id,
                    'error': str(e)
                })
                logger.error(f"Error queuing summaries for {company_id}: {e}")

        logger.info(f"Batch regeneration queued: {success_count} success, {error_count} errors")

        return {
            'total_companies': len(company_ids),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch regeneration: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


# ═══════════════════════════════════════════
# DATA INGESTION PIPELINE TASKS
# ═══════════════════════════════════════════

@app.task(base=CallbackTask, bind=True)
def run_news_ingestion(self):
    """
    Run news ingestion pipeline (NewsAPI + RSS feeds)

    Returns:
        dict: Ingestion statistics
    """
    logger.info("Starting news ingestion pipeline")

    try:
        from pipelines.news_ingestion import NewsIngestionPipeline

        pipeline = NewsIngestionPipeline()
        stats = pipeline.run()

        logger.info(f"News ingestion completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"News ingestion failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def run_social_ingestion(self):
    """
    Run social media ingestion pipeline (Twitter + Reddit)

    Returns:
        dict: Ingestion statistics
    """
    logger.info("Starting social media ingestion pipeline")

    try:
        from pipelines.social_ingestion import SocialIngestionPipeline

        pipeline = SocialIngestionPipeline()
        stats = pipeline.run()

        logger.info(f"Social ingestion completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Social ingestion failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def run_financial_results_scan(self):
    """
    Run daily financial results scan from BSE

    Returns:
        dict: Ingestion statistics
    """
    logger.info("Starting financial results scan")

    try:
        from pipelines.financial_results_ingestion import FinancialResultsIngestionPipeline

        pipeline = FinancialResultsIngestionPipeline()
        stats = pipeline.run_daily_scan()

        logger.info(f"Financial results scan completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Financial results scan failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def run_quarterly_shareholding(self):
    """
    Run quarterly shareholding pattern ingestion from BSE

    Returns:
        dict: Ingestion statistics
    """
    logger.info("Starting quarterly shareholding ingestion")

    try:
        from pipelines.shareholding_ingestion import ShareholdingIngestionPipeline

        pipeline = ShareholdingIngestionPipeline()
        stats = pipeline.run_quarterly_patterns()

        logger.info(f"Quarterly shareholding completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Quarterly shareholding failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def run_daily_bulk_deals(self):
    """
    Run daily bulk/block deals ingestion from BSE

    Returns:
        dict: Ingestion statistics
    """
    logger.info("Starting daily bulk/block deals ingestion")

    try:
        from pipelines.shareholding_ingestion import ShareholdingIngestionPipeline

        pipeline = ShareholdingIngestionPipeline()
        stats = pipeline.run_daily_bulk_deals()

        logger.info(f"Bulk/block deals completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Bulk/block deals failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def run_eod_task(self):
    """
    Run end-of-day task for price data (finalize daily candles, trigger indicators)

    Returns:
        dict: EOD task statistics
    """
    logger.info("Starting EOD task for price data")

    try:
        from pipelines.price_ingestion import PriceIngestionPipeline

        pipeline = PriceIngestionPipeline()
        stats = pipeline.run_eod_task()

        logger.info(f"EOD task completed: {stats}")
        return stats

    except Exception as e:
        logger.error(f"EOD task failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


# Alias for scheduler compatibility
batch_recompute_scores = recompute_all_companies


# ═══════════════════════════════════════════
# MAINTENANCE & CLEANUP TASKS
# ═══════════════════════════════════════════

@app.task(base=CallbackTask, bind=True)
def cleanup_dead_letter_queue(self):
    """
    Clean up processed items from dead-letter queue (>30 days old)

    Returns:
        dict: Cleanup statistics
    """
    logger.info("Starting dead-letter queue cleanup")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        with db_engine.begin() as conn:
            query = text("""
                DELETE FROM dead_letter_queue
                WHERE created_at < NOW() - INTERVAL '30 days'
                  AND (processed_at IS NOT NULL OR retry_count >= 3)
                RETURNING id
            """)
            result = conn.execute(query)
            deleted_count = result.rowcount

        logger.info(f"Cleaned up {deleted_count} items from dead-letter queue")

        return {
            'deleted_count': deleted_count,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Dead-letter queue cleanup failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def cleanup_old_sentiment_data(self):
    """
    Clean up old sentiment snapshots (>90 days) and social posts (>180 days)

    Returns:
        dict: Cleanup statistics
    """
    logger.info("Starting old sentiment data cleanup")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        snapshots_deleted = 0
        posts_deleted = 0

        with db_engine.begin() as conn:
            # Clean up old sentiment snapshots
            query1 = text("""
                DELETE FROM sentiment_snapshots
                WHERE date < NOW() - INTERVAL '90 days'
                RETURNING id
            """)
            result1 = conn.execute(query1)
            snapshots_deleted = result1.rowcount

            # Clean up old social posts
            query2 = text("""
                DELETE FROM social_posts
                WHERE posted_at < NOW() - INTERVAL '180 days'
                RETURNING id
            """)
            result2 = conn.execute(query2)
            posts_deleted = result2.rowcount

        logger.info(f"Cleaned up {snapshots_deleted} snapshots and {posts_deleted} social posts")

        return {
            'snapshots_deleted': snapshots_deleted,
            'posts_deleted': posts_deleted,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Sentiment data cleanup failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def monitor_pipeline_health(self):
    """
    Monitor pipeline health and data freshness

    Returns:
        dict: Health check results
    """
    logger.info("Starting pipeline health monitoring")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        health_checks = {}

        with db_engine.connect() as conn:
            # Check news data freshness
            query = text("""
                SELECT MAX(published_at) as latest_news
                FROM news_articles
            """)
            result = conn.execute(query).fetchone()
            latest_news = result[0] if result else None
            health_checks['news_freshness'] = {
                'latest': latest_news.isoformat() if latest_news else None,
                'status': 'healthy' if latest_news and (datetime.now() - latest_news).seconds < 3600 else 'stale'
            }

            # Check price data freshness
            query = text("""
                SELECT MAX(timestamp) as latest_price
                FROM price_data
            """)
            result = conn.execute(query).fetchone()
            latest_price = result[0] if result else None
            health_checks['price_freshness'] = {
                'latest': latest_price.isoformat() if latest_price else None,
                'status': 'healthy' if latest_price and (datetime.now() - latest_price).seconds < 600 else 'stale'
            }

            # Check dead-letter queue size
            query = text("""
                SELECT COUNT(*) as dlq_count
                FROM dead_letter_queue
                WHERE processed_at IS NULL
            """)
            result = conn.execute(query).fetchone()
            dlq_count = result[0] if result else 0
            health_checks['dead_letter_queue'] = {
                'count': dlq_count,
                'status': 'healthy' if dlq_count < 100 else 'warning' if dlq_count < 500 else 'critical'
            }

        logger.info(f"Pipeline health check completed: {health_checks}")

        return {
            'health_checks': health_checks,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Pipeline health monitoring failed: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


# ═══════════════════════════════════════════
# WEEKLY REPORT GENERATION TASKS
# ═══════════════════════════════════════════

@app.task(base=CallbackTask, bind=True, name='generate_sector_weekly_report')
def generate_sector_weekly_report_task(self, sector_id: str):
    """
    Generate sector-specific weekly report

    Args:
        sector_id: UUID of the sector

    Returns:
        dict: Report generation results
    """
    logger.info(f"Starting sector weekly report generation for sector {sector_id}")

    try:
        from .engines.weekly_report_generator import WeeklyReportGenerator

        generator = WeeklyReportGenerator()
        report_id = generator.generate_sector_weekly_report(sector_id)

        logger.info(f"Successfully generated sector weekly report: {report_id}")

        return {
            'report_id': report_id,
            'sector_id': sector_id,
            'report_type': 'SECTOR_WEEKLY',
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error generating sector weekly report for {sector_id}: {e}", exc_info=True)
        return {
            'sector_id': sector_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True, name='generate_macro_weekly_report')
def generate_macro_weekly_report_task(self):
    """
    Generate macro market weekly report

    Returns:
        dict: Report generation results
    """
    logger.info("Starting macro weekly report generation")

    try:
        from .engines.weekly_report_generator import WeeklyReportGenerator

        generator = WeeklyReportGenerator()
        report_id = generator.generate_macro_weekly_report()

        logger.info(f"Successfully generated macro weekly report: {report_id}")

        return {
            'report_id': report_id,
            'report_type': 'MACRO_WEEKLY',
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error generating macro weekly report: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True, name='generate_all_sector_reports')
def generate_all_sector_reports_task(self):
    """
    Generate weekly reports for all sectors

    Returns:
        dict: Batch report generation results
    """
    logger.info("Starting batch sector weekly report generation")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all parent sectors (not sub-sectors)
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, name, slug
                FROM sectors
                WHERE parent_sector_id IS NULL
                ORDER BY name
            """)
            result = conn.execute(query)
            sectors = [dict(row._mapping) for row in result]

        logger.info(f"Found {len(sectors)} sectors to process")

        success_count = 0
        error_count = 0
        errors = []
        report_ids = []

        for sector in sectors:
            try:
                # Queue task for each sector
                result = generate_sector_weekly_report_task.delay(str(sector['id']))
                success_count += 1
                logger.info(f"Queued report generation for sector: {sector['name']}")
            except Exception as e:
                error_count += 1
                errors.append({
                    'sector_id': str(sector['id']),
                    'sector_name': sector['name'],
                    'error': str(e)
                })
                logger.error(f"Error queuing report for sector {sector['name']}: {e}")

        logger.info(f"Batch sector report generation queued: {success_count} success, {error_count} errors")

        return {
            'total_sectors': len(sectors),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch sector report generation: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


# ═══════════════════════════════════════════
# EVENT INGESTION ENGINE TASKS (TASK #78)
# ═══════════════════════════════════════════

@app.task(base=CallbackTask, bind=True)
def process_new_events_task(self, company_id: str):
    """
    Process new events for a company from all sources

    Args:
        company_id: UUID of the company

    Returns:
        dict: Summary of events created
    """
    logger.info(f"Processing new events for company {company_id}")

    try:
        from .engines.event_ingestion import EventIngestionEngine

        engine = EventIngestionEngine()
        result = engine.process_new_events(company_id)

        logger.info(f"Successfully processed events for {company_id}: {result['events_created']['total']} events created")

        return result

    except Exception as e:
        logger.error(f"Error processing events for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def generate_period_summary_task(self, company_id: str, period_type: str):
    """
    Generate period summary for a company (monthly/quarterly/annual)

    Args:
        company_id: UUID of the company
        period_type: 'monthly', 'quarterly', or 'annual'

    Returns:
        dict: Summary generation results
    """
    logger.info(f"Generating {period_type} summary for company {company_id}")

    try:
        from .engines.event_ingestion import EventIngestionEngine

        engine = EventIngestionEngine()
        result = engine.generate_period_summary(company_id, period_type)

        logger.info(f"Successfully generated {period_type} summary for {company_id}")

        return result

    except Exception as e:
        logger.error(f"Error generating period summary for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'period_type': period_type,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def batch_process_all_company_events(self):
    """
    Batch process events for all active companies

    Returns:
        dict: Batch processing results
    """
    logger.info("Starting batch event processing for all companies")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all active companies
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                ORDER BY company_name
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        logger.info(f"Found {len(companies)} active companies to process")

        success_count = 0
        error_count = 0
        errors = []

        for company in companies:
            try:
                process_new_events_task.delay(str(company['id']))
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({
                    'company': company['company_name'],
                    'error': str(e)
                })
                logger.error(f"Error queuing event processing for {company['company_name']}: {e}")

        logger.info(f"Batch event processing queued: {success_count} success, {error_count} errors")

        return {
            'total_companies': len(companies),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch event processing: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def batch_generate_weekly_summaries(self):
    """
    Generate weekly summaries for all active companies

    Returns:
        dict: Batch summary generation results
    """
    logger.info("Starting batch weekly summary generation")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all active companies
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                ORDER BY company_name
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        logger.info(f"Generating weekly summaries for {len(companies)} companies")

        success_count = 0
        error_count = 0
        errors = []

        for company in companies:
            try:
                generate_period_summary_task.delay(str(company['id']), 'weekly')
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({
                    'company': company['company_name'],
                    'error': str(e)
                })
                logger.error(f"Error queuing weekly summary for {company['company_name']}: {e}")

        logger.info(f"Batch weekly summary generation queued: {success_count} success, {error_count} errors")

        return {
            'total_companies': len(companies),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch weekly summary generation: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


# ═══════════════════════════════════════════
# COMPANY PROFILE BUILDER TASKS (TASK #79)
# ═══════════════════════════════════════════

@app.task(base=CallbackTask, bind=True)
def build_company_profile_task(self, company_id: str):
    """
    Build complete company profile with all 7 sections

    Args:
        company_id: UUID of the company

    Returns:
        dict: Profile generation results
    """
    logger.info(f"Building complete profile for company {company_id}")

    try:
        from .engines.profile_builder import CompanyProfileBuilder

        builder = CompanyProfileBuilder()
        result = builder.build_complete_profile(company_id)

        logger.info(f"Successfully built profile for {company_id}: {result['success_count']}/{result['total_sections']} sections")

        return result

    except Exception as e:
        logger.error(f"Error building profile for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def update_company_profile_section_task(self, company_id: str, section_type: str):
    """
    Update a specific section of company profile

    Args:
        company_id: UUID of the company
        section_type: Section to update (e.g., 'BUSINESS_MODEL', 'KEY_RISKS')

    Returns:
        dict: Section update results
    """
    logger.info(f"Updating {section_type} section for company {company_id}")

    try:
        from .engines.profile_builder import CompanyProfileBuilder

        builder = CompanyProfileBuilder()
        section = builder.update_section(company_id, section_type)

        logger.info(f"Successfully updated {section_type} for {company_id} (version {section.version})")

        return {
            'company_id': company_id,
            'section_type': section_type,
            'version': section.version,
            'confidence_level': section.confidence_level,
            'last_updated': section.last_updated.isoformat(),
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error updating section {section_type} for {company_id}: {e}", exc_info=True)
        return {
            'company_id': company_id,
            'section_type': section_type,
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def check_and_update_profiles_task(self):
    """
    Check all companies and update profiles that need updating

    Returns:
        dict: Batch update results
    """
    logger.info("Checking profiles for updates")

    try:
        from .engines.profile_builder import CompanyProfileBuilder

        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all active companies
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                ORDER BY company_name
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        logger.info(f"Checking {len(companies)} companies for profile updates")

        builder = CompanyProfileBuilder()
        updates_queued = 0
        sections_to_update = {}

        for company in companies:
            try:
                company_id = str(company['id'])
                sections = builder.check_update_triggers(company_id)

                if sections:
                    sections_to_update[company_id] = sections
                    # Queue update for each section
                    for section_type in sections:
                        update_company_profile_section_task.delay(company_id, section_type)
                        updates_queued += 1

            except Exception as e:
                logger.error(f"Error checking updates for {company['company_name']}: {e}")

        logger.info(f"Profile update check complete: {updates_queued} section updates queued for {len(sections_to_update)} companies")

        return {
            'total_companies': len(companies),
            'companies_with_updates': len(sections_to_update),
            'sections_queued': updates_queued,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in profile update check: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }


@app.task(base=CallbackTask, bind=True)
def batch_build_all_profiles_task(self):
    """
    Build profiles for all active companies (initial setup)

    Returns:
        dict: Batch build results
    """
    logger.info("Starting batch profile build for all companies")

    try:
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        db_engine = create_engine(db_url)

        # Get all active companies
        with db_engine.connect() as conn:
            query = text("""
                SELECT id, company_name, nse_symbol
                FROM companies
                WHERE is_active = true
                ORDER BY company_name
            """)
            result = conn.execute(query)
            companies = [dict(row._mapping) for row in result]

        logger.info(f"Building profiles for {len(companies)} companies")

        success_count = 0
        error_count = 0
        errors = []

        for company in companies:
            try:
                build_company_profile_task.delay(str(company['id']))
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({
                    'company': company['company_name'],
                    'error': str(e)
                })
                logger.error(f"Error queuing profile build for {company['company_name']}: {e}")

        logger.info(f"Batch profile build queued: {success_count} success, {error_count} errors")

        return {
            'total_companies': len(companies),
            'queued': success_count,
            'errors': error_count,
            'error_details': errors,
            'status': 'success'
        }

    except Exception as e:
        logger.error(f"Error in batch profile build: {e}", exc_info=True)
        return {
            'status': 'error',
            'error': str(e)
        }
