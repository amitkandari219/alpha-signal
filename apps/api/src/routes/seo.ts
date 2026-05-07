/**
 * SEO Routes
 *
 * Handles sitemap.xml and robots.txt generation for search engine optimization
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to generate sitemap URL entry
function generateSitemapUrl(loc: string, priority: string, changefreq: string, lastmod?: string): string {
  const lastmodStr = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>
    <loc>${loc}</loc>
    <priority>${priority}</priority>
    <changefreq>${changefreq}</changefreq>${lastmodStr}
  </url>`;
}

export async function seoRoutes(fastify: FastifyInstance) {
  /**
   * GET /sitemap.xml
   * Generate XML sitemap with all public pages
   */
  fastify.get('/sitemap.xml', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const today = new Date().toISOString().split('T')[0];

      const urls: string[] = [];

      // Static pages with high priority
      urls.push(generateSitemapUrl(`${baseUrl}`, '1.0', 'daily', today));
      urls.push(generateSitemapUrl(`${baseUrl}/pricing`, '0.9', 'weekly', today));
      urls.push(generateSitemapUrl(`${baseUrl}/screener`, '0.9', 'daily', today));

      // Fetch all active sectors
      const sectors = await prisma.sector.findMany({
        where: {},
        select: { slug: true },
      });

      // Add sector pages
      for (const sector of sectors) {
        urls.push(generateSitemapUrl(`${baseUrl}/sectors/${sector.slug}`, '0.8', 'daily'));
      }

      // Fetch all active companies (stocks)
      const companies = await prisma.company.findMany({
        where: { isActive: true },
        select: {
          nseSymbol: true,
          compositeScores: {
            orderBy: { date: 'desc' },
            take: 1,
            select: { date: true },
          },
        },
        take: 5000, // Limit to prevent huge sitemaps
      });

      // Add stock pages
      for (const company of companies) {
        if (company.nseSymbol) {
          const lastmod = company.compositeScores[0]?.date
            ? company.compositeScores[0].date.toISOString().split('T')[0]
            : undefined;
          urls.push(
            generateSitemapUrl(
              `${baseUrl}/stock/${company.nseSymbol}`,
              '0.7',
              'daily',
              lastmod
            )
          );
        }
      }

      // Fetch recent AI summaries (report pages)
      const aiSummaries = await prisma.aiSummary.findMany({
        where: {
          summaryType: 'BUSINESS_OVERVIEW',
        },
        select: {
          company: {
            select: {
              nseSymbol: true,
            },
          },
          generatedAt: true,
        },
        orderBy: { generatedAt: 'desc' },
        take: 1000, // Limit report pages
        distinct: ['companyId'],
      });

      // Add report pages
      for (const summary of aiSummaries) {
        if (summary.company.nseSymbol) {
          const lastmod = summary.generatedAt.toISOString().split('T')[0];
          urls.push(
            generateSitemapUrl(
              `${baseUrl}/reports/${summary.company.nseSymbol}`,
              '0.6',
              'weekly',
              lastmod
            )
          );
        }
      }

      // Generate XML sitemap
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

      reply
        .header('Content-Type', 'application/xml')
        .header('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
        .send(sitemap);
    } catch (error: any) {
      fastify.log.error('Error generating sitemap:', error);
      return reply.status(500).send({
        error: 'Failed to generate sitemap',
      });
    }
  });

  /**
   * GET /robots.txt
   * Generate robots.txt file for search engine crawlers
   */
  fastify.get('/robots.txt', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const robotsTxt = `# Alpha Signal - AI-Powered Stock Intelligence Platform
# Robots.txt for search engine crawlers

User-agent: *
Allow: /
Allow: /pricing
Allow: /screener
Allow: /sectors/*
Allow: /stock/*
Allow: /reports/*

# Disallow private/authenticated pages
Disallow: /dashboard
Disallow: /portfolio
Disallow: /watchlist
Disallow: /alerts
Disallow: /settings
Disallow: /api/
Disallow: /graphql

# Disallow admin and auth pages
Disallow: /admin
Disallow: /login
Disallow: /register
Disallow: /auth

# Crawl delay (be nice to our servers)
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
`;

      reply
        .header('Content-Type', 'text/plain')
        .header('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
        .send(robotsTxt);
    } catch (error: any) {
      fastify.log.error('Error generating robots.txt:', error);
      return reply.status(500).send({
        error: 'Failed to generate robots.txt',
      });
    }
  });
}
