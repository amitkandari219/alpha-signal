#!/usr/bin/env python3
"""
Test script to verify Celery worker connectivity and task execution
"""
import os
import time
from celery import Celery

# Initialize Celery app (same config as worker)
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', 'alphasignal_redis_dev')
BROKER_URL = f'redis://:{REDIS_PASSWORD}@localhost:6379/0'
BACKEND_URL = f'redis://:{REDIS_PASSWORD}@localhost:6379/0'

app = Celery(
    'alpha_signal_analytics',
    broker=BROKER_URL,
    backend=BACKEND_URL
)

def test_celery_connection():
    """Test Celery broker connection"""
    print("=" * 60)
    print("Testing Celery Worker Connection")
    print("=" * 60)

    try:
        # Check if broker is reachable
        inspect = app.control.inspect()
        stats = inspect.stats()

        if stats:
            print("✓ Successfully connected to Celery broker (Redis)")
            print(f"✓ Active workers: {list(stats.keys())}")
        else:
            print("✗ No active workers found")
            return False

        # Check registered tasks
        registered = inspect.registered()
        if registered:
            print(f"✓ Registered tasks found:")
            for worker, tasks in registered.items():
                print(f"  Worker: {worker}")
                for task in tasks:
                    print(f"    - {task}")

        return True
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        return False

def test_simple_task():
    """Test a simple task execution"""
    print("\n" + "=" * 60)
    print("Testing Task Execution")
    print("=" * 60)

    try:
        # Send a test task
        from src.tasks import fetch_stock_data

        print("Sending test task: fetch_stock_data('TCS', 'NSE')")
        result = fetch_stock_data.delay('TCS', 'NSE')

        print(f"Task ID: {result.id}")
        print("Waiting for result...")

        # Wait for result with timeout
        task_result = result.get(timeout=10)

        print(f"✓ Task completed successfully!")
        print(f"Result: {task_result}")

        return True
    except Exception as e:
        print(f"✗ Task execution failed: {e}")
        return False

def test_database_connection():
    """Test PostgreSQL database connection"""
    print("\n" + "=" * 60)
    print("Testing Database Connection")
    print("=" * 60)

    try:
        from sqlalchemy import create_engine, text

        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://alphasignal:alphasignal_dev_password@localhost:5432/alphasignal'
        )

        engine = create_engine(db_url)

        with engine.connect() as conn:
            # Test query
            result = conn.execute(text("""
                SELECT c.nse_symbol, c.company_name, COUNT(fr.id) as record_count
                FROM companies c
                LEFT JOIN financial_results fr ON c.id = fr.company_id
                GROUP BY c.id, c.nse_symbol, c.company_name
                HAVING COUNT(fr.id) > 0
                LIMIT 5
            """))

            companies = result.fetchall()

            print(f"✓ Successfully connected to PostgreSQL database")
            print(f"✓ Found {len(companies)} companies with financial data:")
            for company in companies:
                print(f"  - {company[0]}: {company[1]} ({company[2]} records)")

        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("ALPHA SIGNAL ANALYTICS ENGINE - HEALTH CHECK")
    print("=" * 60 + "\n")

    # Run tests
    conn_ok = test_celery_connection()
    db_ok = test_database_connection()
    task_ok = test_simple_task() if conn_ok else False

    # Summary
    print("\n" + "=" * 60)
    print("HEALTH CHECK SUMMARY")
    print("=" * 60)
    print(f"Celery Connection: {'✓ PASS' if conn_ok else '✗ FAIL'}")
    print(f"Database Connection: {'✓ PASS' if db_ok else '✗ FAIL'}")
    print(f"Task Execution: {'✓ PASS' if task_ok else '✗ FAIL'}")
    print("=" * 60)

    if conn_ok and db_ok and task_ok:
        print("\n✓ All checks passed! Analytics engine is ready.")
        exit(0)
    else:
        print("\n✗ Some checks failed. Please review the errors above.")
        exit(1)
