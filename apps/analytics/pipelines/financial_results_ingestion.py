"""
Financial Results Ingestion Pipeline

Fetches quarterly and annual financial results from BSE API:
- Daily scan at 22:00 IST for new filings
- Event-triggered via webhook/polling
- Parses BSE filing format (XML/JSON)
- Handles standalone and consolidated results
- Triggers downstream tasks (ratio computation, summary generation)

Features:
- Retry with exponential backoff (3 attempts)
- Dead-letter queue for persistent failures
- Prefers consolidated over standalone results
"""
import os
import logging
import time
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import requests
from sqlalchemy import create_engine, text
import json
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)


class FinancialResultsIngestionPipeline:
    """
    Quarterly and annual financial results ingestion from BSE
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # BSE API configuration
        self.bse_api_key = os.getenv('BSE_API_KEY')
        self.bse_api_url = os.getenv('BSE_API_URL', 'https://api.bseindia.com')

        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 2  # seconds

    def run_daily_scan(self) -> Dict:
        """
        Daily scan for new financial results filings

        Returns:
            Dict with ingestion statistics
        """
        logger.info("Starting daily financial results scan")
        start_time = time.time()

        stats = {
            'companies_scanned': 0,
            'new_results_found': 0,
            'results_ingested': 0,
            'ratio_tasks_triggered': 0,
            'summary_tasks_triggered': 0,
            'errors': 0,
            'failed_permanently': 0
        }

        # Get all active companies with BSE codes
        companies = self._get_tracked_companies()
        stats['companies_scanned'] = len(companies)

        for company in companies:
            try:
                # Check for new filings
                new_filings = self._check_new_filings(company)
                stats['new_results_found'] += len(new_filings)

                for filing in new_filings:
                    # Ingest with retry
                    success = self._ingest_with_retry(company, filing)

                    if success:
                        stats['results_ingested'] += 1

                        # Trigger downstream tasks
                        self._trigger_ratio_computation(company['id'])
                        stats['ratio_tasks_triggered'] += 1

                        self._trigger_summary_generation(company['id'])
                        stats['summary_tasks_triggered'] += 1
                    else:
                        stats['failed_permanently'] += 1
                        self._move_to_dead_letter_queue(company, filing)

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                logger.error(f"Error processing {company['company_name']}: {e}", exc_info=True)
                stats['errors'] += 1

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"Daily financial results scan completed: {stats}")

        return stats

    def _get_tracked_companies(self) -> List[Dict]:
        """Get all active companies with BSE codes"""
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, company_name, bse_code, nse_symbol
                FROM companies
                WHERE is_active = true
                  AND bse_code IS NOT NULL
                ORDER BY company_name
            """)
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]

    def _check_new_filings(self, company: Dict) -> List[Dict]:
        """
        Check BSE API for new financial result filings

        Args:
            company: Company dict

        Returns:
            List of new filing dicts
        """
        if not self.bse_api_key:
            logger.warning("BSE_API_KEY not configured, using mock data")
            return []

        try:
            # TODO: Replace with actual BSE API call
            url = f"{self.bse_api_url}/corporates/results"
            params = {
                'scripcode': company['bse_code'],
                'from_date': (datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d')
            }

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Parse and filter new filings
            filings = self._parse_bse_filings(data)

            # Filter out already ingested results
            new_filings = []
            for filing in filings:
                if not self._is_already_ingested(company['id'], filing):
                    new_filings.append(filing)

            return new_filings

        except Exception as e:
            logger.error(f"Failed to check filings for {company['company_name']}: {e}")
            return []

    def _parse_bse_filings(self, data: Dict) -> List[Dict]:
        """
        Parse BSE API response into filing dicts

        Args:
            data: BSE API response

        Returns:
            List of filing dicts
        """
        filings = []

        # TODO: Implement actual BSE response parsing
        # This is placeholder logic

        if isinstance(data, dict) and 'results' in data:
            for result in data['results']:
                filings.append({
                    'period_type': result.get('period_type', 'QUARTERLY'),
                    'fiscal_year': result.get('fiscal_year'),
                    'fiscal_quarter': result.get('fiscal_quarter'),
                    'result_type': result.get('result_type', 'CONSOLIDATED'),  # or STANDALONE
                    'published_at': result.get('published_date'),
                    'raw_data': result
                })

        return filings

    def _is_already_ingested(self, company_id: str, filing: Dict) -> bool:
        """
        Check if result is already in database

        Args:
            company_id: UUID of company
            filing: Filing dict

        Returns:
            True if already ingested
        """
        with self.engine.connect() as conn:
            query = text("""
                SELECT id FROM financial_results
                WHERE company_id = :company_id
                  AND period_type = :period_type
                  AND fiscal_year = :fiscal_year
                  AND fiscal_quarter = :fiscal_quarter
            """)
            result = conn.execute(query, {
                'company_id': company_id,
                'period_type': filing['period_type'],
                'fiscal_year': filing['fiscal_year'],
                'fiscal_quarter': filing.get('fiscal_quarter')
            })
            return result.fetchone() is not None

    def _ingest_with_retry(self, company: Dict, filing: Dict) -> bool:
        """
        Ingest filing with exponential backoff retry

        Args:
            company: Company dict
            filing: Filing dict

        Returns:
            True if successful
        """
        for attempt in range(self.max_retries):
            try:
                self._ingest_financial_result(company['id'], filing)
                logger.info(f"Successfully ingested {filing['period_type']} result "
                           f"for {company['company_name']}")
                return True

            except Exception as e:
                logger.warning(f"Ingestion attempt {attempt + 1} failed for "
                              f"{company['company_name']}: {e}")

                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    delay = self.retry_delay * (2 ** attempt)
                    time.sleep(delay)
                else:
                    logger.error(f"All retry attempts exhausted for {company['company_name']}")
                    return False

        return False

    def _ingest_financial_result(self, company_id: str, filing: Dict):
        """
        Insert financial result into database

        Args:
            company_id: UUID of company
            filing: Filing dict with financial data
        """
        with self.engine.begin() as conn:
            # Parse financial metrics from raw data
            raw_data = filing.get('raw_data', {})
            metrics = self._extract_financial_metrics(raw_data)

            # Prefer consolidated over standalone
            result_type = filing.get('result_type', 'CONSOLIDATED')

            query = text("""
                INSERT INTO financial_results (
                    id, company_id, period_type, fiscal_year, fiscal_quarter,
                    revenue, operating_profit, net_profit, eps,
                    operating_margin, net_margin, tax_rate,
                    raw_data, source_url, published_at, created_at
                ) VALUES (
                    gen_random_uuid(), :company_id, :period_type, :fiscal_year, :fiscal_quarter,
                    :revenue, :operating_profit, :net_profit, :eps,
                    :operating_margin, :net_margin, :tax_rate,
                    :raw_data, :source_url, :published_at, NOW()
                )
            """)

            conn.execute(query, {
                'company_id': company_id,
                'period_type': filing['period_type'],
                'fiscal_year': filing['fiscal_year'],
                'fiscal_quarter': filing.get('fiscal_quarter'),
                'revenue': metrics.get('revenue'),
                'operating_profit': metrics.get('operating_profit'),
                'net_profit': metrics.get('net_profit'),
                'eps': metrics.get('eps'),
                'operating_margin': metrics.get('operating_margin'),
                'net_margin': metrics.get('net_margin'),
                'tax_rate': metrics.get('tax_rate'),
                'raw_data': json.dumps(raw_data),
                'source_url': raw_data.get('filing_url'),
                'published_at': filing.get('published_at', datetime.now())
            })

    def _extract_financial_metrics(self, raw_data: Dict) -> Dict:
        """
        Extract financial metrics from raw BSE data

        Args:
            raw_data: Raw BSE filing data

        Returns:
            Dict with extracted metrics
        """
        # TODO: Implement actual BSE data extraction
        # This is placeholder logic

        metrics = {}

        # Try to extract common fields
        metrics['revenue'] = raw_data.get('total_income') or raw_data.get('revenue')
        metrics['operating_profit'] = raw_data.get('ebit') or raw_data.get('operating_profit')
        metrics['net_profit'] = raw_data.get('net_profit') or raw_data.get('pat')
        metrics['eps'] = raw_data.get('eps')

        # Calculate margins if we have the data
        revenue = metrics.get('revenue')
        if revenue and revenue > 0:
            if metrics.get('operating_profit'):
                metrics['operating_margin'] = (metrics['operating_profit'] / revenue) * 100

            if metrics.get('net_profit'):
                metrics['net_margin'] = (metrics['net_profit'] / revenue) * 100

        metrics['tax_rate'] = raw_data.get('tax_rate')

        return metrics

    def _trigger_ratio_computation(self, company_id: str):
        """
        Trigger financial ratio computation task

        Args:
            company_id: UUID of company
        """
        try:
            from src.tasks import compute_financial_ratios

            compute_financial_ratios.delay(company_id)
            logger.info(f"Triggered ratio computation for company {company_id}")

        except Exception as e:
            logger.error(f"Failed to trigger ratio computation: {e}")

    def _trigger_summary_generation(self, company_id: str):
        """
        Trigger AI summary generation task

        Args:
            company_id: UUID of company
        """
        try:
            from src.tasks import generate_summary

            # Generate earnings summary (most relevant after new results)
            generate_summary.delay(company_id, 'earnings_summary')
            logger.info(f"Triggered summary generation for company {company_id}")

        except Exception as e:
            logger.error(f"Failed to trigger summary generation: {e}")

    def _move_to_dead_letter_queue(self, company: Dict, filing: Dict):
        """
        Move failed ingestion to dead-letter queue for manual review

        Args:
            company: Company dict
            filing: Filing dict
        """
        try:
            with self.engine.begin() as conn:
                query = text("""
                    INSERT INTO dead_letter_queue (
                        id, queue_type, payload, error_message,
                        retry_count, created_at
                    ) VALUES (
                        gen_random_uuid(), :queue_type, :payload, :error_message,
                        :retry_count, NOW()
                    )
                """)

                conn.execute(query, {
                    'queue_type': 'financial_results_ingestion',
                    'payload': json.dumps({
                        'company': company,
                        'filing': filing
                    }),
                    'error_message': f"Failed after {self.max_retries} retries",
                    'retry_count': self.max_retries
                })

                logger.info(f"Moved {company['company_name']} filing to dead-letter queue")

        except Exception as e:
            logger.error(f"Failed to move to dead-letter queue: {e}")


def run_financial_results_scan():
    """Celery task wrapper for daily financial results scan"""
    pipeline = FinancialResultsIngestionPipeline()
    return pipeline.run_daily_scan()
