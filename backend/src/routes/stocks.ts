/**
 * Stock data routes
 */

import { Router, Request, Response } from 'express';
import { createDataProvider } from '../services/dataProvider';
import { cache } from '../cache/fileCache';
import {
  symbolValidation,
  dateValidation,
  dateRangeValidation,
  handleValidationErrors,
} from '../middleware/validation';
import { HistoricalDataResponse } from '../types';
import { logger } from '../utils/logger';

const router = Router();
const dataProvider = createDataProvider();

/**
 * GET /api/stocks/:symbol/historical
 * Fetch historical OHLCV data for a symbol
 */
router.get(
  '/:symbol/historical',
  symbolValidation,
  ...dateValidation('startDate', 'query'),
  ...dateValidation('endDate', 'query'),
  dateRangeValidation('query'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { startDate, endDate } = req.query as { startDate: string; endDate: string };

      const cacheKey = `historical:${symbol}:${startDate}:${endDate}`;
      const cached = await cache.get<HistoricalDataResponse>(cacheKey);

      if (cached) {
        logger.info(`Cache hit for ${symbol} historical data`);
        res.json({ ...cached, cached: true });
        return;
      }

      logger.info(`Fetching historical data for ${symbol}`);
      const data = await dataProvider.fetchHistoricalData(symbol, startDate, endDate);

      const response: HistoricalDataResponse = {
        symbol,
        data,
        source: process.env.DATA_PROVIDER || 'yahoo',
        cached: false,
      };

      // Cache for 1 hour
      await cache.set(cacheKey, response, 3600000);

      res.json(response);
    } catch (error) {
      logger.error('Historical data fetch error:', error);
      throw error;
    }
  }
);

/**
 * GET /api/stocks/search
 * Search for stock symbols (autocomplete)
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Query parameter "q" is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (q.length < 1 || q.length > 20) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Query must be 1-20 characters',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const results = await dataProvider.searchSymbol(q);
    res.json({ query: q, results });
  } catch (error) {
    logger.error('Symbol search error:', error);
    throw error;
  }
});

export default router;
