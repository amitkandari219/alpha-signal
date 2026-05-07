/**
 * Feedback API Routes - Example Implementation
 *
 * Copy this to your actual routes file and integrate with your Express app
 */

import { Router, Request, Response } from 'express';
import {
  submitFeedback,
  getUserFeedback,
  checkUserFeedback,
  getFeedbackStats,
  getFeedbackStatsByType,
  getRecentNegativeFeedback,
  FeedbackType,
  FeedbackRating,
} from '../services/feedbackService';

const router = Router();

/**
 * Submit or update feedback
 *
 * POST /api/feedback
 * Body: {
 *   feedbackType: 'AI_SUMMARY',
 *   resourceId: 'uuid',
 *   rating: 'UP' | 'DOWN',
 *   comment?: 'optional comment',
 *   companyId?: 'uuid',
 *   metadata?: {}
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Get user ID from authenticated session
    const userId = req.user?.id; // Adjust based on your auth middleware

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { feedbackType, resourceId, rating, comment, companyId, metadata } = req.body;

    // Validate required fields
    if (!feedbackType || !resourceId || !rating) {
      return res.status(400).json({
        error: 'Missing required fields: feedbackType, resourceId, rating',
      });
    }

    // Validate feedback type
    if (!Object.values(FeedbackType).includes(feedbackType)) {
      return res.status(400).json({
        error: `Invalid feedbackType. Must be one of: ${Object.values(FeedbackType).join(', ')}`,
      });
    }

    // Validate rating
    if (!['UP', 'DOWN'].includes(rating)) {
      return res.status(400).json({
        error: 'Invalid rating. Must be UP or DOWN',
      });
    }

    await submitFeedback({
      userId,
      feedbackType,
      resourceId,
      companyId,
      rating: rating as FeedbackRating,
      comment,
      metadata,
    });

    return res.json({
      success: true,
      message: 'Feedback submitted successfully',
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({
      error: 'Failed to submit feedback',
      message: error.message,
    });
  }
});

/**
 * Get user's feedback history
 *
 * GET /api/feedback/my-feedback
 * Query params: feedbackType?, limit?, offset?
 */
router.get('/my-feedback', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { feedbackType, limit, offset } = req.query;

    const feedback = await getUserFeedback(userId, {
      feedbackType: feedbackType as FeedbackType,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    return res.json({
      feedback,
      count: feedback.length,
    });
  } catch (error: any) {
    console.error('Error getting user feedback:', error);
    return res.status(500).json({
      error: 'Failed to get feedback',
      message: error.message,
    });
  }
});

/**
 * Check if user has given feedback for a resource
 *
 * GET /api/feedback/check/:resourceId
 */
router.get('/check/:resourceId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resourceId } = req.params;

    const result = await checkUserFeedback(userId, resourceId);

    return res.json(result);
  } catch (error: any) {
    console.error('Error checking feedback:', error);
    return res.status(500).json({
      error: 'Failed to check feedback',
      message: error.message,
    });
  }
});

/**
 * Get feedback statistics (Admin only)
 *
 * GET /api/feedback/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    const stats = await getFeedbackStats();

    return res.json({
      stats,
    });
  } catch (error: any) {
    console.error('Error getting feedback stats:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * Get feedback statistics by type (Admin only)
 *
 * GET /api/feedback/stats/:feedbackType
 * Query params: days? (default: 30)
 */
router.get('/stats/:feedbackType', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    const { feedbackType } = req.params;
    const { days } = req.query;

    if (!Object.values(FeedbackType).includes(feedbackType as FeedbackType)) {
      return res.status(400).json({
        error: `Invalid feedbackType. Must be one of: ${Object.values(FeedbackType).join(', ')}`,
      });
    }

    const stats = await getFeedbackStatsByType(
      feedbackType as FeedbackType,
      days ? parseInt(days as string) : 30
    );

    return res.json({
      feedbackType,
      days: days ? parseInt(days as string) : 30,
      stats,
    });
  } catch (error: any) {
    console.error('Error getting feedback stats by type:', error);
    return res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * Get recent negative feedback for quality monitoring (Admin only)
 *
 * GET /api/feedback/negative
 * Query params: feedbackType?, limit? (default: 20)
 */
router.get('/negative', async (req: Request, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (!req.user?.isAdmin) {
    //   return res.status(403).json({ error: 'Forbidden' });
    // }

    const { feedbackType, limit } = req.query;

    const feedback = await getRecentNegativeFeedback(
      feedbackType as FeedbackType,
      limit ? parseInt(limit as string) : 20
    );

    return res.json({
      feedback,
      count: feedback.length,
    });
  } catch (error: any) {
    console.error('Error getting negative feedback:', error);
    return res.status(500).json({
      error: 'Failed to get negative feedback',
      message: error.message,
    });
  }
});

export default router;

/**
 * Usage in main Express app:
 *
 * import feedbackRoutes from './routes/feedbackRoutes';
 * app.use('/api/feedback', authMiddleware, feedbackRoutes);
 */
