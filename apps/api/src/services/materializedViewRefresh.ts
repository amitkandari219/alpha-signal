/**
 * Materialized View Refresh Service
 *
 * Periodically refreshes materialized views to keep data current
 * In production, this should be done via Celery Beat tasks
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Refresh all materialized views
 */
export async function refreshAllMaterializedViews(): Promise<void> {
  console.log('🔄 Refreshing all materialized views...');

  const startTime = Date.now();

  try {
    // Use the stored function for concurrent refresh
    await prisma.$executeRawUnsafe('SELECT refresh_all_materialized_views()');

    const duration = Date.now() - startTime;
    console.log(`✅ All materialized views refreshed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error refreshing materialized views:', error);
    throw error;
  }
}

/**
 * Refresh screener data view only
 */
export async function refreshScreenerView(): Promise<void> {
  console.log('🔄 Refreshing screener view...');

  const startTime = Date.now();

  try {
    await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_screener_data');

    const duration = Date.now() - startTime;
    console.log(`✅ Screener view refreshed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error refreshing screener view:', error);
    throw error;
  }
}

/**
 * Refresh sector aggregates view only
 */
export async function refreshSectorView(): Promise<void> {
  console.log('🔄 Refreshing sector view...');

  const startTime = Date.now();

  try {
    await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sector_aggregates');

    const duration = Date.now() - startTime;
    console.log(`✅ Sector view refreshed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error refreshing sector view:', error);
    throw error;
  }
}

/**
 * Refresh dashboard data view only
 */
export async function refreshDashboardView(): Promise<void> {
  console.log('🔄 Refreshing dashboard view...');

  const startTime = Date.now();

  try {
    await prisma.$executeRawUnsafe('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_data');

    const duration = Date.now() - startTime;
    console.log(`✅ Dashboard view refreshed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error refreshing dashboard view:', error);
    throw error;
  }
}

/**
 * Schedule periodic refresh of materialized views
 * Run this on server startup
 */
export function scheduleMaterializedViewRefresh(): void {
  // Initial refresh after 10 seconds (allow server to fully start)
  setTimeout(() => {
    refreshAllMaterializedViews().catch(err => {
      console.error('Initial materialized view refresh failed:', err);
    });
  }, 10000);

  // Refresh every 5 minutes
  setInterval(() => {
    refreshAllMaterializedViews().catch(err => {
      console.error('Scheduled materialized view refresh failed:', err);
    });
  }, 5 * 60 * 1000); // 5 minutes

  console.log('✅ Materialized view refresh scheduled (every 5 minutes)');
}

/**
 * Get materialized view statistics
 */
export async function getMaterializedViewStats(): Promise<any[]> {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT
        schemaname,
        matviewname,
        hasindexes,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size,
        (SELECT COUNT(*) FROM mv_screener_data) AS screener_rows,
        (SELECT COUNT(*) FROM mv_sector_aggregates) AS sector_rows,
        (SELECT COUNT(*) FROM mv_dashboard_data) AS dashboard_rows
      FROM pg_matviews
      WHERE schemaname = 'public'
    `;

    return stats;
  } catch (error) {
    console.error('Error getting materialized view stats:', error);
    return [];
  }
}

export default {
  refreshAllMaterializedViews,
  refreshScreenerView,
  refreshSectorView,
  refreshDashboardView,
  scheduleMaterializedViewRefresh,
  getMaterializedViewStats,
};
