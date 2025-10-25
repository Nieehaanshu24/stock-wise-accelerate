/**
 * Analysis routes using native C modules
 */

import { Router, Request, Response } from 'express';
import { analysisService } from '../services/analysisService';
import {
  dateValidation,
  dateRangeValidation,
  rangeQueryValidation,
  windowSizeValidation,
  pricesArrayValidation,
  handleValidationErrors,
} from '../middleware/validation';
import { body } from 'express-validator';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/analyze/span
 * Calculate stock span analysis
 * Body: { symbol?, startDate?, endDate?, prices? }
 */
router.post(
  '/span',
  body('symbol').optional().matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  pricesArrayValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbol, startDate, endDate, prices } = req.body;

      // Validate: either (symbol + dates) or prices array
      if (!prices && (!symbol || !startDate || !endDate)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Provide either (symbol, startDate, endDate) or prices array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.info('Span analysis request:', { symbol, startDate, endDate, pricesLength: prices?.length });

      const result = await analysisService.calculateSpan(
        symbol,
        startDate,
        endDate,
        prices
      );

      res.json(result);
    } catch (error) {
      logger.error('Span analysis error:', error);
      throw error;
    }
  }
);

/**
 * POST /api/analyze/range
 * Perform range query using segment tree
 * Body: { symbol?, startDate?, endDate?, ql, qr, prices? }
 */
router.post(
  '/range',
  body('symbol').optional().matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  ...rangeQueryValidation,
  pricesArrayValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbol, startDate, endDate, ql, qr, prices } = req.body;

      if (!prices && (!symbol || !startDate || !endDate)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Provide either (symbol, startDate, endDate) or prices array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.info('Range analysis request:', { symbol, ql, qr });

      const result = await analysisService.analyzeRange(
        symbol,
        startDate,
        endDate,
        parseInt(ql),
        parseInt(qr),
        prices
      );

      res.json(result);
    } catch (error) {
      logger.error('Range analysis error:', error);
      throw error;
    }
  }
);

/**
 * POST /api/analyze/window
 * Perform sliding window analysis
 * Body: { symbol?, startDate?, endDate?, windowSize, prices? }
 */
router.post(
  '/window',
  body('symbol').optional().matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  windowSizeValidation,
  pricesArrayValidation,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbol, startDate, endDate, windowSize, prices } = req.body;

      if (!prices && (!symbol || !startDate || !endDate)) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Provide either (symbol, startDate, endDate) or prices array',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      logger.info('Window analysis request:', { symbol, windowSize });

      const result = await analysisService.analyzeWindow(
        symbol,
        startDate,
        endDate,
        parseInt(windowSize),
        prices
      );

      res.json(result);
    } catch (error) {
      logger.error('Window analysis error:', error);
      throw error;
    }
  }
);

export default router;
