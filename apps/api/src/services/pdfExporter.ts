/**
 * PDF Exporter Service
 *
 * Generates beautiful PDF reports from React components using Puppeteer.
 *
 * Features:
 * - Tier gating (PRO/PREMIUM only)
 * - Watermark for PRO tier
 * - High-quality print layout
 * - Analytics tracking
 * - S3 or local storage
 */

import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import jwt from 'jsonwebtoken';
import { generateComprehensiveReport } from './aiReportGenerator';
import { generateMockReport } from './mockAIReportGenerator';
import { generateInstitutionalReport } from './institutionalReportGenerator';

const prisma = new PrismaClient();

// Toggle between report types
const USE_INSTITUTIONAL_REPORT = false; // ⚠️ Temporarily disabled - retry timeouts with JSON parsing
const USE_MOCK_AI = false; // Set to true for testing without AI

// Generate a temporary JWT token for Puppeteer authentication
async function generateTempToken(userId: string, email: string): Promise<string> {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const token = jwt.sign(
    {
      userId,
      email,
      // Short expiration since it's only for PDF generation
      exp: Math.floor(Date.now() / 1000) + (60 * 5), // 5 minutes
    },
    secret
  );
  return token;
}

interface PDFExportOptions {
  symbol: string;
  userId: string;
  includeWatermark?: boolean;
}

interface PDFExportResult {
  success: boolean;
  pdfUrl?: string;
  filename?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PDF EXPORT FUNCTION
// ═══════════════════════════════════════════════════════════════

export async function generateReportPDF(
  symbol: string,
  userId: string
): Promise<PDFExportResult> {
  const startTime = Date.now();

  try {
    // 1. Check user tier (PRO/PREMIUM only)
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const tier = user.tier || 'FREE';
    if (tier === 'FREE') {
      return {
        success: false,
        error: 'PDF export requires PRO or PREMIUM subscription',
      };
    }

    console.log(`🎨 Generating AI-powered PDF for ${symbol} (user: ${user.email}, tier: ${tier})`);

    // 2. Generate comprehensive AI report
    let aiReport;
    if (USE_MOCK_AI) {
      console.log('📝 Using MOCK AI generator (for testing)...');
      // Get company name from database
      const company = await prisma.company.findFirst({
        where: {
          OR: [
            { nseSymbol: { equals: symbol.toUpperCase(), mode: 'insensitive' } },
            { bseCode: { equals: symbol, mode: 'insensitive' } },
          ]
        },
      });
      const companyName = company?.companyName || symbol;
      aiReport = await generateMockReport(symbol, companyName);
      console.log('✅ Mock report generated successfully');
    } else if (USE_INSTITUTIONAL_REPORT) {
      console.log('🎯 Generating INSTITUTIONAL-GRADE deep research report...');
      aiReport = await generateInstitutionalReport(symbol);
      console.log('✅ Institutional report generated successfully');
    } else {
      console.log('🤖 Generating standard AI report content...');
      aiReport = await generateComprehensiveReport(symbol);
      console.log('✅ AI report generated successfully');
    }

    // 3. Generate HTML from AI report
    let html: string;
    if (USE_INSTITUTIONAL_REPORT) {
      const { generateInstitutionalHTML } = await import('../templates/institutionalTemplate');
      html = generateInstitutionalHTML(aiReport);
    } else {
      const { generateReportHTML } = await import('../templates/reportTemplate');
      html = generateReportHTML(aiReport);
    }

    // 4. Launch headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2, // High DPI for crisp charts
    });

    // 5. Load AI-generated HTML directly into Puppeteer
    console.log('📄 Loading AI-generated HTML...');
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    // Small delay to ensure CSS and fonts are fully rendered
    console.log('⏳ Finalizing rendering...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 5. Generate PDF
    console.log('📊 Rendering PDF...');

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '25mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm',
      },
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size:9px; color:#666; text-align:center; width:100%; padding:10px 0;">
          ${symbol} - Comprehensive Report | Generated by Alpha Signal
        </div>
      `,
      footerTemplate: `
        <div style="font-size:9px; color:#666; text-align:center; width:100%; padding:10px 0;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span> |
          Generated: ${new Date().toLocaleDateString('en-IN')} |
          Alpha Signal - Premium Stock Analysis
        </div>
      `,
    });

    await browser.close();

    console.log(`✅ PDF generated (${(pdfBuffer.length / 1024).toFixed(0)} KB)`);

    // 6. Add watermark for PRO tier (not PREMIUM)
    let finalPdfBuffer = pdfBuffer;

    if (tier === 'PRO') {
      console.log('🔒 Adding watermark for PRO tier...');
      finalPdfBuffer = await addWatermark(pdfBuffer, 'Alpha Signal PRO');
    }

    // 7. Save PDF to local storage (or S3 in production)
    const filename = `${symbol}_report_${Date.now()}.pdf`;
    const filePath = await savePDF(finalPdfBuffer, filename);

    // 8. Track download in database
    await trackReportDownload(symbol, userId);

    // 9. Track analytics
    const generationTime = Date.now() - startTime;
    console.log(`✅ PDF export complete in ${(generationTime / 1000).toFixed(1)}s`);

    await prisma.pageAnalytics.create({
      data: {
        userId,
        sessionId: `pdf-export-${Date.now()}`,
        eventName: 'REPORT_PDF_DOWNLOADED',
        pageUrl: `/stock/${symbol}/report`,
        userAgent: 'Puppeteer PDF Exporter',
        eventData: {
          symbol,
          tier,
          generationTimeMs: generationTime,
          fileSize: finalPdfBuffer.length,
        },
      },
    });

    return {
      success: true,
      pdfUrl: `/api/reports/download/${filename}`,
      filename,
    };
  } catch (error: any) {
    console.error('❌ PDF generation failed:', error);

    // Track error
    await prisma.pageAnalytics.create({
      data: {
        userId,
        sessionId: `pdf-export-${Date.now()}`,
        eventName: 'REPORT_PDF_ERROR',
        pageUrl: `/stock/${symbol}/report`,
        userAgent: 'Puppeteer PDF Exporter',
        eventData: {
          symbol,
          error: error.message,
        },
      },
    });

    return {
      success: false,
      error: error.message || 'Failed to generate PDF',
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ADD WATERMARK TO PDF
// ═══════════════════════════════════════════════════════════════

async function addWatermark(pdfBuffer: Buffer, watermarkText: string): Promise<Buffer> {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Load font
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Add watermark to each page
    for (const page of pages) {
      const { width, height } = page.getSize();

      // Add semi-transparent watermark diagonally
      page.drawText(watermarkText, {
        x: width / 2 - 100,
        y: height / 2,
        size: 60,
        font,
        color: rgb(0.7, 0.7, 0.7),
        opacity: 0.1,
        rotate: {
          type: 'degrees',
          angle: -45,
        },
      });

      // Add small watermark in footer
      page.drawText(`Generated with ${watermarkText}`, {
        x: width / 2 - 120,
        y: 15,
        size: 8,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.7,
      });
    }

    // Serialize to bytes
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Failed to add watermark:', error);
    // Return original PDF if watermarking fails
    return pdfBuffer;
  }
}

// ═══════════════════════════════════════════════════════════════
// SAVE PDF TO STORAGE
// ═══════════════════════════════════════════════════════════════

async function savePDF(pdfBuffer: Buffer, filename: string): Promise<string> {
  // TODO: In production, upload to S3
  // For now, save to local storage

  const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');

  // Create directory if it doesn't exist
  await fs.mkdir(uploadsDir, { recursive: true });

  const filePath = path.join(uploadsDir, filename);
  await fs.writeFile(filePath, pdfBuffer);

  console.log(`💾 PDF saved to: ${filePath}`);

  return filePath;
}

// ═══════════════════════════════════════════════════════════════
// UPLOAD TO S3 (PRODUCTION)
// ═══════════════════════════════════════════════════════════════

async function uploadToS3(pdfBuffer: Buffer, filename: string): Promise<string> {
  // TODO: Implement S3 upload
  // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
  //
  // const s3Client = new S3Client({ region: 'us-east-1' });
  // const command = new PutObjectCommand({
  //   Bucket: process.env.S3_BUCKET_NAME,
  //   Key: `reports/${filename}`,
  //   Body: pdfBuffer,
  //   ContentType: 'application/pdf',
  // });
  //
  // await s3Client.send(command);
  //
  // return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/reports/${filename}`;

  throw new Error('S3 upload not implemented yet');
}

// ═══════════════════════════════════════════════════════════════
// TRACK REPORT DOWNLOAD
// ═══════════════════════════════════════════════════════════════

async function trackReportDownload(symbol: string, userId: string): Promise<void> {
  try {
    // Find the report
    const company = await prisma.company.findUnique({
      where: { nseSymbol: symbol },
    });

    if (!company) return;

    const report = await prisma.generatedReport.findFirst({
      where: {
        companyId: company.id,
        status: 'COMPLETED',
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (!report) return;

    // Increment download count
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    console.log(`📊 Download tracked for ${symbol}`);
  } catch (error) {
    console.error('Failed to track download:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET USER TIER
// ═══════════════════════════════════════════════════════════════

export async function getUserTier(userId: string): Promise<{
  tier: 'FREE' | 'PRO' | 'PREMIUM';
  canExportPDF: boolean;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const tier = (user?.tier as 'FREE' | 'PRO' | 'PREMIUM') || 'FREE';
  const canExportPDF = tier === 'PRO' || tier === 'PREMIUM';

  return { tier, canExportPDF };
}

// ═══════════════════════════════════════════════════════════════
// CLEANUP OLD PDFs (Run periodically)
// ═══════════════════════════════════════════════════════════════

export async function cleanupOldPDFs(retentionDays: number = 7): Promise<number> {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'reports');

    const files = await fs.readdir(uploadsDir);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);

      const ageInDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);

      if (ageInDays > retentionDays) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }

    console.log(`🧹 Cleaned up ${deletedCount} old PDFs (>${retentionDays} days old)`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup old PDFs:', error);
    return 0;
  }
}
