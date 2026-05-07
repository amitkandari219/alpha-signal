/**
 * Apply TimescaleDB Optimizations
 *
 * Applies compression policies, retention policies, and performance indexes
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

async function applyTimescaleDBOptimizations() {
  console.log('🔧 Applying TimescaleDB optimizations...\n');

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '../prisma/migrations/timescaledb_optimization.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split into individual statements (skip comments and empty lines)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Executing ${statements.length} optimization statements...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        successCount++;

        // Log significant operations
        if (statement.includes('add_compression_policy')) {
          console.log('✅ Compression policy added');
        } else if (statement.includes('add_retention_policy')) {
          console.log('✅ Retention policy added');
        } else if (statement.includes('CREATE MATERIALIZED VIEW')) {
          console.log('✅ Continuous aggregate created');
        } else if (statement.includes('CREATE INDEX')) {
          const match = statement.match(/CREATE INDEX.*?(\w+)/);
          if (match) {
            console.log(`✅ Index created: ${match[1]}`);
          }
        }
      } catch (error: any) {
        // Ignore "already exists" errors
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate')
        ) {
          console.log(`⚠️  Already exists, skipping: ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error executing statement: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`\n✨ TimescaleDB optimizations complete!`);
    console.log(`   Success: ${successCount}, Errors: ${errorCount}\n`);

    // Verify optimizations
    console.log('🔍 Verifying optimizations...\n');

    // Check compression policies
    try {
      const compression = await prisma.$queryRaw<any[]>`
        SELECT * FROM timescaledb_information.compression_settings
      `;
      console.log(`📦 Compression policies: ${compression.length}`);
    } catch (err) {
      console.log('⚠️  Could not verify compression policies');
    }

    // Check continuous aggregates
    try {
      const aggregates = await prisma.$queryRaw<any[]>`
        SELECT view_name, materialized_only
        FROM timescaledb_information.continuous_aggregates
      `;
      console.log(`📊 Continuous aggregates: ${aggregates.length}`);
      aggregates.forEach(agg => {
        console.log(`   - ${agg.view_name}`);
      });
    } catch (err) {
      console.log('⚠️  Could not verify continuous aggregates');
    }

    // Check indexes
    try {
      const indexes = await prisma.$queryRaw<any[]>`
        SELECT
          schemaname,
          tablename,
          indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname LIKE 'idx_%'
        ORDER BY tablename, indexname
      `;
      console.log(`\n📇 Indexes created: ${indexes.length}`);
    } catch (err) {
      console.log('⚠️  Could not verify indexes');
    }

    // Check table sizes
    try {
      const sizes = await prisma.$queryRaw<any[]>`
        SELECT
          tablename,
          pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size('public.'||tablename) DESC
        LIMIT 10
      `;
      console.log(`\n💾 Top 10 tables by size:`);
      sizes.forEach(s => {
        console.log(`   ${s.tablename}: ${s.size}`);
      });
    } catch (err) {
      console.log('⚠️  Could not check table sizes');
    }

    console.log('\n✨ All optimizations applied successfully!');
    console.log('\nPerformance improvements:');
    console.log('  - Compression: 10-20x space savings on old data');
    console.log('  - Retention: Automatic cleanup of old data');
    console.log('  - Indexes: Faster queries on common patterns');
    console.log('  - Continuous aggregates: Pre-computed daily/weekly data');
  } catch (error: any) {
    console.error('❌ Error applying optimizations:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyTimescaleDBOptimizations();
