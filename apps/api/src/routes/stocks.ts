/**
 * Stock Routes
 *
 * REST API endpoints for stock data
 * Used for prefetching and direct access
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function stockRoutes(fastify: FastifyInstance) {
  // GET /api/stocks/:symbol - Get stock detail by symbol
  fastify.get('/api/stocks/:symbol', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { symbol } = request.params as { symbol: string };

      // Find company by NSE symbol
      const company = await prisma.company.findUnique({
        where: { nseSymbol: symbol },
        include: {
          sector: true,
          industry: true,
        },
      });

      if (!company) {
        return reply.status(404).send({
          error: 'Stock not found',
          message: `No stock found with symbol: ${symbol}`,
        });
      }

      // Get latest composite scores
      const latestScore = await prisma.compositeScore.findFirst({
        where: { companyId: company.id },
        orderBy: { date: 'desc' },
      });

      // Get latest technical indicators
      const latestTechnical = await prisma.technicalIndicator.findFirst({
        where: { companyId: company.id },
        orderBy: { date: 'desc' },
      });

      // Get recent financial results
      const financials = await prisma.financialResult.findMany({
        where: { companyId: company.id },
        orderBy: { publishedAt: 'desc' },
        take: 4,
      });

      // Build response
      return reply.send({
        success: true,
        data: {
          symbol: company.nseSymbol,
          companyName: company.companyName,
          shortName: company.shortName,
          sector: company.sector.name,
          industry: company.industry.name,
          isin: company.isin,
          marketCapCategory: company.marketCapCategory,
          listingDate: company.listingDate?.toISOString(),
          scores: latestScore ? {
            quality: latestScore.qualityScore,
            growth: latestScore.growthScore,
            risk: latestScore.riskScore,
            sentiment: latestScore.sentimentScore,
            momentum: latestScore.momentumScore,
            date: latestScore.date.toISOString(),
          } : null,
          technicals: latestTechnical ? {
            rsi14: latestTechnical.rsi14 ? parseFloat(latestTechnical.rsi14.toString()) : null,
            sma20: latestTechnical.sma20 ? parseFloat(latestTechnical.sma20.toString()) : null,
            sma50: latestTechnical.sma50 ? parseFloat(latestTechnical.sma50.toString()) : null,
            sma200: latestTechnical.sma200 ? parseFloat(latestTechnical.sma200.toString()) : null,
            date: latestTechnical.date.toISOString(),
          } : null,
          financials: financials.map(f => ({
            periodType: f.periodType,
            fiscalYear: f.fiscalYear,
            fiscalQuarter: f.fiscalQuarter,
            revenue: f.revenue ? parseFloat(f.revenue.toString()) : null,
            netProfit: f.netProfit ? parseFloat(f.netProfit.toString()) : null,
            eps: f.eps ? parseFloat(f.eps.toString()) : null,
            publishedAt: f.publishedAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch stock data',
      });
    }
  });

  // GET /api/stocks - List stocks with optional filters
  fastify.get('/api/stocks', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sector, limit = 50, offset = 0 } = request.query as {
        sector?: string;
        limit?: number;
        offset?: number;
      };

      const where: any = { isActive: true };
      if (sector) {
        const sectorRecord = await prisma.sector.findUnique({
          where: { slug: sector },
        });
        if (sectorRecord) {
          where.sectorId = sectorRecord.id;
        }
      }

      const companies = await prisma.company.findMany({
        where,
        include: {
          sector: true,
          compositeScores: {
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
        take: Number(limit),
        skip: Number(offset),
      });

      return reply.send({
        success: true,
        data: companies.map(c => ({
          symbol: c.nseSymbol,
          companyName: c.companyName,
          shortName: c.shortName,
          sector: c.sector.name,
          marketCapCategory: c.marketCapCategory,
          scores: c.compositeScores[0] ? {
            quality: c.compositeScores[0].qualityScore,
            growth: c.compositeScores[0].growthScore,
            risk: c.compositeScores[0].riskScore,
          } : null,
        })),
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch stocks',
      });
    }
  });
}
