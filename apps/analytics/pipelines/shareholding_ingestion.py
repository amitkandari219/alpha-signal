"""
Shareholding Pattern Ingestion Pipeline

Fetches and processes shareholding data:
- Quarterly shareholding patterns from BSE
- Promoter %, FII %, DII %, Public %, Pledge %
- Bulk deals and block deals (daily)
- Insider transactions monitoring

Features:
- Runs quarterly for shareholding patterns
- Daily for bulk/block deals
- Detects significant changes (>2% promoter holding change)
- Creates risk flags for concerning patterns
"""
import os
import logging
import time
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import requests
from sqlalchemy import create_engine, text
import json

logger = logging.getLogger(__name__)


class ShareholdingIngestionPipeline:
    """
    Shareholding pattern and insider transaction ingestion
    """

    def __init__(self, db_url: Optional[str] = None):
        self.db_url = db_url or os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@postgres:5432/alphasignal'
        )
        self.engine = create_engine(self.db_url)

        # BSE API configuration (placeholder - actual API details needed)
        self.bse_api_key = os.getenv('BSE_API_KEY')
        self.bse_api_url = os.getenv('BSE_API_URL', 'https://api.bseindia.com')

    def run_quarterly_patterns(self) -> Dict:
        """
        Fetch quarterly shareholding patterns for all tracked companies

        Returns:
            Dict with ingestion statistics
        """
        logger.info("Starting quarterly shareholding pattern ingestion")
        start_time = time.time()

        stats = {
            'companies_processed': 0,
            'patterns_ingested': 0,
            'risk_flags_created': 0,
            'errors': 0
        }

        # Get all active companies with BSE codes
        companies = self._get_tracked_companies()

        for company in companies:
            try:
                # Fetch shareholding pattern
                pattern = self._fetch_shareholding_pattern(company)

                if pattern:
                    # Ingest pattern
                    self._ingest_shareholding_pattern(company['id'], pattern)
                    stats['patterns_ingested'] += 1

                    # Check for significant changes and create risk flags
                    risk_flags = self._check_shareholding_changes(company['id'], pattern)
                    stats['risk_flags_created'] += len(risk_flags)

                stats['companies_processed'] += 1

                # Rate limiting
                time.sleep(1)

            except Exception as e:
                logger.error(f"Failed to process shareholding for {company['company_name']}: {e}")
                stats['errors'] += 1

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"Quarterly shareholding ingestion completed: {stats}")

        return stats

    def run_daily_bulk_deals(self) -> Dict:
        """
        Fetch daily bulk deals and block deals

        Returns:
            Dict with ingestion statistics
        """
        logger.info("Starting daily bulk/block deals ingestion")
        start_time = time.time()

        stats = {
            'bulk_deals': 0,
            'block_deals': 0,
            'insider_transactions': 0,
            'errors': 0
        }

        try:
            # Fetch bulk deals
            bulk_deals = self._fetch_bulk_deals()
            for deal in bulk_deals:
                self._ingest_insider_transaction(deal, 'BULK_DEAL')
                stats['bulk_deals'] += 1

            # Fetch block deals
            block_deals = self._fetch_block_deals()
            for deal in block_deals:
                self._ingest_insider_transaction(deal, 'BLOCK_DEAL')
                stats['block_deals'] += 1

            stats['insider_transactions'] = stats['bulk_deals'] + stats['block_deals']

        except Exception as e:
            logger.error(f"Failed to fetch bulk/block deals: {e}", exc_info=True)
            stats['errors'] += 1

        duration = time.time() - start_time
        stats['duration_seconds'] = round(duration, 2)

        logger.info(f"Daily bulk/block deals ingestion completed: {stats}")

        return stats

    def _get_tracked_companies(self) -> List[Dict]:
        """
        Get all active companies with BSE codes

        Returns:
            List of company dicts with id, company_name, bse_code
        """
        with self.engine.connect() as conn:
            query = text("""
                SELECT id, company_name, bse_code
                FROM companies
                WHERE is_active = true
                  AND bse_code IS NOT NULL
                ORDER BY company_name
            """)
            result = conn.execute(query)
            return [dict(row._mapping) for row in result]

    def _fetch_shareholding_pattern(self, company: Dict) -> Optional[Dict]:
        """
        Fetch shareholding pattern from BSE API

        Args:
            company: Company dict with bse_code

        Returns:
            Shareholding pattern dict or None
        """
        if not self.bse_api_key:
            logger.warning("BSE_API_KEY not configured, using mock data")
            return self._generate_mock_shareholding_pattern()

        try:
            # TODO: Replace with actual BSE API call
            # This is a placeholder implementation
            url = f"{self.bse_api_url}/corporates/shareholding"
            params = {
                'scripcode': company['bse_code'],
                'quarter': self._get_current_quarter()
            }

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Parse BSE response format
            return self._parse_bse_shareholding_response(data)

        except Exception as e:
            logger.error(f"BSE API call failed for {company['company_name']}: {e}")
            return None

    def _generate_mock_shareholding_pattern(self) -> Dict:
        """Generate mock shareholding data for testing"""
        import random
        return {
            'quarter': self._get_current_quarter(),
            'promoter_holding_pct': round(random.uniform(50, 75), 2),
            'fii_holding_pct': round(random.uniform(10, 25), 2),
            'dii_holding_pct': round(random.uniform(8, 20), 2),
            'public_holding_pct': round(random.uniform(5, 15), 2),
            'pledge_pct': round(random.uniform(0, 5), 2),
            'num_shareholders': random.randint(50000, 500000)
        }

    def _parse_bse_shareholding_response(self, data: Dict) -> Dict:
        """
        Parse BSE API response into our schema

        Args:
            data: BSE API response

        Returns:
            Parsed shareholding pattern dict
        """
        # TODO: Implement actual BSE response parsing
        # This is placeholder logic
        return {
            'quarter': data.get('quarter'),
            'promoter_holding_pct': data.get('promoter', 0),
            'fii_holding_pct': data.get('fii', 0),
            'dii_holding_pct': data.get('dii', 0),
            'public_holding_pct': data.get('public', 0),
            'pledge_pct': data.get('pledge', 0),
            'num_shareholders': data.get('shareholders', 0)
        }

    def _ingest_shareholding_pattern(self, company_id: str, pattern: Dict):
        """
        Insert shareholding pattern into database

        Args:
            company_id: UUID of company
            pattern: Shareholding pattern dict
        """
        with self.engine.begin() as conn:
            # Check if pattern already exists for this quarter
            check_query = text("""
                SELECT id FROM shareholding_patterns
                WHERE company_id = :company_id
                  AND quarter = :quarter
            """)
            result = conn.execute(check_query, {
                'company_id': company_id,
                'quarter': pattern['quarter']
            })
            existing = result.fetchone()

            if existing:
                logger.debug(f"Shareholding pattern already exists for quarter {pattern['quarter']}")
                return

            # Insert new pattern
            query = text("""
                INSERT INTO shareholding_patterns (
                    id, company_id, quarter,
                    promoter_holding_pct, fii_holding_pct, dii_holding_pct,
                    public_holding_pct, pledge_pct, num_shareholders,
                    created_at
                ) VALUES (
                    gen_random_uuid(), :company_id, :quarter,
                    :promoter_holding_pct, :fii_holding_pct, :dii_holding_pct,
                    :public_holding_pct, :pledge_pct, :num_shareholders,
                    NOW()
                )
            """)

            conn.execute(query, {
                'company_id': company_id,
                'quarter': pattern['quarter'],
                'promoter_holding_pct': pattern['promoter_holding_pct'],
                'fii_holding_pct': pattern['fii_holding_pct'],
                'dii_holding_pct': pattern['dii_holding_pct'],
                'public_holding_pct': pattern['public_holding_pct'],
                'pledge_pct': pattern['pledge_pct'],
                'num_shareholders': pattern['num_shareholders']
            })

            logger.info(f"Ingested shareholding pattern for company {company_id}, quarter {pattern['quarter']}")

    def _check_shareholding_changes(self, company_id: str, current_pattern: Dict) -> List[str]:
        """
        Check for significant shareholding changes and create risk flags

        Args:
            company_id: UUID of company
            current_pattern: Current quarter's pattern

        Returns:
            List of risk flag IDs created
        """
        risk_flags = []

        with self.engine.connect() as conn:
            # Get previous quarter's pattern
            query = text("""
                SELECT promoter_holding_pct, pledge_pct
                FROM shareholding_patterns
                WHERE company_id = :company_id
                  AND quarter < :current_quarter
                ORDER BY quarter DESC
                LIMIT 1
            """)
            result = conn.execute(query, {
                'company_id': company_id,
                'current_quarter': current_pattern['quarter']
            })
            previous = result.fetchone()

            if not previous:
                return risk_flags

            prev_promoter = float(previous[0] or 0)
            prev_pledge = float(previous[1] or 0)

            curr_promoter = current_pattern['promoter_holding_pct']
            curr_pledge = current_pattern['pledge_pct']

            # Check for significant promoter holding decrease (>2%)
            if curr_promoter < prev_promoter - 2:
                flag_id = self._create_risk_flag(
                    company_id,
                    'PROMOTER_HOLDING_DECLINE',
                    f"Promoter holding decreased from {prev_promoter:.2f}% to {curr_promoter:.2f}%"
                )
                risk_flags.append(flag_id)

            # Check for high or increasing pledge
            if curr_pledge > 50:
                flag_id = self._create_risk_flag(
                    company_id,
                    'HIGH_PROMOTER_PLEDGE',
                    f"Promoter pledge at {curr_pledge:.2f}% (High risk)"
                )
                risk_flags.append(flag_id)
            elif curr_pledge > prev_pledge + 5:
                flag_id = self._create_risk_flag(
                    company_id,
                    'INCREASING_PROMOTER_PLEDGE',
                    f"Promoter pledge increased from {prev_pledge:.2f}% to {curr_pledge:.2f}%"
                )
                risk_flags.append(flag_id)

        return risk_flags

    def _create_risk_flag(self, company_id: str, flag_type: str, description: str) -> str:
        """
        Create a risk flag entry

        Args:
            company_id: UUID of company
            flag_type: Type of risk flag
            description: Description of the risk

        Returns:
            Risk flag ID
        """
        with self.engine.begin() as conn:
            query = text("""
                INSERT INTO risk_flags (
                    id, company_id, flag_type, description,
                    severity, created_at
                ) VALUES (
                    gen_random_uuid(), :company_id, :flag_type, :description,
                    :severity, NOW()
                )
                RETURNING id
            """)

            # Determine severity based on flag type
            severity = 'HIGH' if 'HIGH' in flag_type or 'DECLINE' in flag_type else 'MEDIUM'

            result = conn.execute(query, {
                'company_id': company_id,
                'flag_type': flag_type,
                'description': description,
                'severity': severity
            })

            flag_id = result.fetchone()[0]
            logger.info(f"Created risk flag: {flag_type} for company {company_id}")

            return str(flag_id)

    def _fetch_bulk_deals(self) -> List[Dict]:
        """
        Fetch bulk deals from BSE

        Returns:
            List of bulk deal dicts
        """
        if not self.bse_api_key:
            logger.warning("BSE_API_KEY not configured, skipping bulk deals")
            return []

        try:
            # TODO: Replace with actual BSE API call
            url = f"{self.bse_api_url}/bulkdeals"
            params = {
                'date': datetime.now().strftime('%Y-%m-%d')
            }

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            return self._parse_bulk_deals(data)

        except Exception as e:
            logger.error(f"Failed to fetch bulk deals: {e}")
            return []

    def _fetch_block_deals(self) -> List[Dict]:
        """
        Fetch block deals from BSE

        Returns:
            List of block deal dicts
        """
        if not self.bse_api_key:
            logger.warning("BSE_API_KEY not configured, skipping block deals")
            return []

        try:
            # TODO: Replace with actual BSE API call
            url = f"{self.bse_api_url}/blockdeals"
            params = {
                'date': datetime.now().strftime('%Y-%m-%d')
            }

            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            return self._parse_block_deals(data)

        except Exception as e:
            logger.error(f"Failed to fetch block deals: {e}")
            return []

    def _parse_bulk_deals(self, data: Dict) -> List[Dict]:
        """Parse BSE bulk deals response"""
        # TODO: Implement actual parsing
        return []

    def _parse_block_deals(self, data: Dict) -> List[Dict]:
        """Parse BSE block deals response"""
        # TODO: Implement actual parsing
        return []

    def _ingest_insider_transaction(self, deal: Dict, deal_type: str):
        """
        Insert insider transaction into database

        Args:
            deal: Deal dict
            deal_type: 'BULK_DEAL' or 'BLOCK_DEAL'
        """
        with self.engine.begin() as conn:
            query = text("""
                INSERT INTO insider_transactions (
                    id, company_id, transaction_type,
                    quantity, price, value,
                    person_name, person_category,
                    filing_date, created_at
                ) VALUES (
                    gen_random_uuid(), :company_id, :transaction_type,
                    :quantity, :price, :value,
                    :person_name, :person_category,
                    :filing_date, NOW()
                )
            """)

            conn.execute(query, {
                'company_id': deal.get('company_id'),
                'transaction_type': deal.get('transaction_type', 'BUY'),
                'quantity': deal.get('quantity', 0),
                'price': deal.get('price', 0),
                'value': deal.get('value', 0),
                'person_name': deal.get('person_name', 'Unknown'),
                'person_category': deal_type,
                'filing_date': deal.get('date', datetime.now())
            })

    def _get_current_quarter(self) -> str:
        """
        Get current quarter in format 'Q1FY25'

        Returns:
            Quarter string
        """
        now = datetime.now()
        month = now.month
        year = now.year

        # Indian fiscal year: April - March
        if month >= 4:
            fiscal_year = year + 1
        else:
            fiscal_year = year

        # Determine quarter
        if month in [4, 5, 6]:
            quarter = 'Q1'
        elif month in [7, 8, 9]:
            quarter = 'Q2'
        elif month in [10, 11, 12]:
            quarter = 'Q3'
        else:  # [1, 2, 3]
            quarter = 'Q4'

        return f"{quarter}FY{str(fiscal_year)[-2:]}"


def run_quarterly_shareholding():
    """Celery task wrapper for quarterly shareholding patterns"""
    pipeline = ShareholdingIngestionPipeline()
    return pipeline.run_quarterly_patterns()


def run_daily_bulk_deals():
    """Celery task wrapper for daily bulk/block deals"""
    pipeline = ShareholdingIngestionPipeline()
    return pipeline.run_daily_bulk_deals()
