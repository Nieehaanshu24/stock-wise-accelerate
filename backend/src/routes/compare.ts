/**
 * Stock comparison routes
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import {
  dateValidation,
  dateRangeValidation,
  handleValidationErrors,
} from '../middleware/validation';
import { analysisService } from '../services/analysisService';
import { createDataProvider } from '../services/dataProvider';
import { logger } from '../utils/logger';

const router = Router();
const dataProvider = createDataProvider();

/**
 * POST /api/compare/historical
 * Compare historical data for multiple stocks
 */
router.post(
  '/historical',
  body('symbols').isArray({ min: 2, max: 5 }),
  body('symbols.*').matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbols, startDate, endDate } = req.body;

      logger.info(`Comparing ${symbols.length} stocks`);

      const results = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const data = await dataProvider.fetchHistoricalData(
              symbol,
              startDate,
              endDate
            );

            return {
              symbol,
              success: true,
              data: data.map(d => ({
                date: d.date,
                close: d.close,
                volume: d.volume,
              })),
            };
          } catch (error) {
            logger.error(`Error fetching data for ${symbol}:`, error);
            return {
              symbol,
              success: false,
              error: (error as Error).message,
            };
          }
        })
      );

      res.json({
        symbols,
        startDate,
        endDate,
        results,
      });
    } catch (error) {
      logger.error('Comparison error:', error);
      throw error;
    }
  }
);

/**
 * POST /api/compare/analyze
 * Run analysis on multiple stocks for comparison
 */
router.post(
  '/analyze',
  body('symbols').isArray({ min: 2, max: 5 }),
  body('symbols.*').matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbols, startDate, endDate } = req.body;

      logger.info(`Analyzing ${symbols.length} stocks for comparison`);

      const results = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            // Run span analysis
            const spanData = await analysisService.calculateSpan(
              symbol,
              startDate,
              endDate
            );

            // Calculate average span
            const avgSpan =
              spanData.spans.reduce((a, b) => a + b, 0) / spanData.spans.length;

            return {
              symbol,
              success: true,
              metrics: {
                avgSpan,
                maxSpan: Math.max(...spanData.spans),
                totalDays: spanData.spans.length,
              },
              processingTimeMs: spanData.processingTimeMs,
            };
          } catch (error) {
            logger.error(`Error analyzing ${symbol}:`, error);
            return {
              symbol,
              success: false,
              error: (error as Error).message,
            };
          }
        })
      );

      res.json({
        symbols,
        startDate,
        endDate,
        results,
      });
    } catch (error) {
      logger.error('Analysis comparison error:', error);
      throw error;
    }
  }
);

export default router;
