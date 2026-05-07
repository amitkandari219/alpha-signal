"""
Test LLM Cost Tracking

Validates the LLM cost tracking functionality:
- Cost calculation
- Database logging
- Dashboard retrieval
- Alert threshold checking
"""

import os
import sys
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from utils.llm_cost_tracker import LLMCostTracker, log_llm_usage


def test_cost_calculation():
    """Test cost calculation for Claude API calls"""
    print("\n=== Testing Cost Calculation ===")

    tracker = LLMCostTracker()

    # Test case 1: Small request
    cost1 = tracker.calculate_cost(prompt_tokens=100, completion_tokens=50)
    expected1 = (100 / 1_000_000 * 3.0) + (50 / 1_000_000 * 15.0)
    print(f"Test 1 - Small request:")
    print(f"  Calculated: ${cost1}")
    print(f"  Expected: ${expected1:.6f}")
    print(f"  ✓ PASS" if abs(float(cost1) - expected1) < 0.000001 else "  ✗ FAIL")

    # Test case 2: Medium request
    cost2 = tracker.calculate_cost(prompt_tokens=1500, completion_tokens=800)
    expected2 = (1500 / 1_000_000 * 3.0) + (800 / 1_000_000 * 15.0)
    print(f"\nTest 2 - Medium request:")
    print(f"  Calculated: ${cost2}")
    print(f"  Expected: ${expected2:.6f}")
    print(f"  ✓ PASS" if abs(float(cost2) - expected2) < 0.000001 else "  ✗ FAIL")

    # Test case 3: Large request
    cost3 = tracker.calculate_cost(prompt_tokens=5000, completion_tokens=2000)
    expected3 = (5000 / 1_000_000 * 3.0) + (2000 / 1_000_000 * 15.0)
    print(f"\nTest 3 - Large request:")
    print(f"  Calculated: ${cost3}")
    print(f"  Expected: ${expected3:.6f}")
    print(f"  ✓ PASS" if abs(float(cost3) - expected3) < 0.000001 else "  ✗ FAIL")


def test_usage_logging():
    """Test logging LLM usage to database"""
    print("\n=== Testing Usage Logging ===")

    try:
        # Log a test usage entry
        usage_id = log_llm_usage(
            model="claude-sonnet-4-20250514",
            prompt_tokens=1500,
            completion_tokens=800,
            task_type="SUMMARY",
            duration_ms=2350,
            metadata={
                'test': True,
                'purpose': 'validation'
            }
        )

        print(f"✓ Successfully logged usage with ID: {usage_id}")
        return True
    except Exception as e:
        print(f"✗ Failed to log usage: {e}")
        return False


def test_cost_retrieval():
    """Test retrieving cost statistics"""
    print("\n=== Testing Cost Retrieval ===")

    try:
        tracker = LLMCostTracker()

        # Get today's cost
        today_cost = tracker.get_daily_cost()
        print(f"Today's cost: ${today_cost}")

        # Get weekly cost
        weekly_cost = tracker.get_weekly_cost()
        print(f"This week's cost: ${weekly_cost}")

        # Get monthly cost
        monthly_cost = tracker.get_monthly_cost()
        print(f"This month's cost: ${monthly_cost}")

        # Get call count
        calls_today = tracker.get_daily_call_count()
        print(f"Calls today: {calls_today}")

        # Get average cost per summary
        avg_summary_cost = tracker.get_avg_cost_by_task_type('SUMMARY')
        print(f"Avg cost per summary: ${avg_summary_cost}")

        # Get projected monthly cost
        projected = tracker.get_projected_monthly_cost()
        print(f"Projected monthly cost: ${projected}")

        print("✓ All cost retrievals successful")
        return True
    except Exception as e:
        print(f"✗ Failed to retrieve costs: {e}")
        return False


def test_dashboard_stats():
    """Test dashboard statistics aggregation"""
    print("\n=== Testing Dashboard Stats ===")

    try:
        tracker = LLMCostTracker()
        stats = tracker.get_dashboard_stats()

        print("Dashboard stats:")
        print(f"  Today: ${stats['today_usd']:.2f}")
        print(f"  This week: ${stats['this_week_usd']:.2f}")
        print(f"  This month: ${stats['this_month_usd']:.2f}")
        print(f"  Calls today: {stats['calls_today']}")
        print(f"  Avg per summary: ${stats['avg_cost_per_summary_usd']:.4f}")
        print(f"  Projected monthly: ${stats['projected_monthly_usd']:.2f}")

        print("✓ Dashboard stats retrieved successfully")
        return True
    except Exception as e:
        print(f"✗ Failed to get dashboard stats: {e}")
        return False


def test_cost_limit_check():
    """Test daily cost limit checking"""
    print("\n=== Testing Cost Limit Check ===")

    try:
        tracker = LLMCostTracker()
        limit_status = tracker.check_daily_limit()

        print(f"Current cost: ${limit_status['current_cost']:.2f}")
        print(f"Daily limit: ${limit_status['limit']:.2f}")
        print(f"Percentage: {limit_status['percentage']:.1f}%")
        print(f"Remaining: ${limit_status['remaining']:.2f}")
        print(f"Exceeded: {'YES ⚠️' if limit_status['exceeded'] else 'NO ✓'}")

        print("✓ Cost limit check successful")
        return True
    except Exception as e:
        print(f"✗ Failed to check cost limit: {e}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("LLM Cost Tracking Validation")
    print("=" * 60)

    results = []

    # Run tests
    test_cost_calculation()
    results.append(test_usage_logging())
    results.append(test_cost_retrieval())
    results.append(test_dashboard_stats())
    results.append(test_cost_limit_check())

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"Tests passed: {passed}/{total}")

    if passed == total:
        print("✅ All tests passed!")
    else:
        print(f"⚠️  {total - passed} test(s) failed")

    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
