/**
 * Portfolio management routes with file persistence
 */

import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors, dateValidation, dateRangeValidation } from '../middleware/validation';
import { portfolioService } from '../services/portfolioService';
import { logger } from '../utils/logger';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * GET /api/portfolio
 * List all portfolios
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const portfolioList = await portfolioService.listPortfolios();
    res.json({ portfolios: portfolioList });
  } catch (error) {
    logger.error('Error listing portfolios:', error);
    throw error;
  }
});

/**
 * GET /api/portfolio/:id
 * Get portfolio by ID
 */
router.get(
  '/:id',
  param('id').isString(),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const portfolio = await portfolioService.getPortfolio(id);

      if (!portfolio) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json(portfolio);
    } catch (error) {
      logger.error('Error getting portfolio:', error);
      throw error;
    }
  }
);

/**
 * POST /api/portfolio
 * Create new portfolio
 */
router.post(
  '/',
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const portfolio = await portfolioService.createPortfolio({ name, description });
      res.status(201).json(portfolio);
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      throw error;
    }
  }
);

/**
 * PUT /api/portfolio/:id
 * Update portfolio
 */
router.put(
  '/:id',
  param('id').isString(),
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const portfolio = await portfolioService.updatePortfolio(id, { name, description });
      if (!portfolio) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json(portfolio);
    } catch (error) {
      logger.error('Error updating portfolio:', error);
      throw error;
    }
  }
);

/**
 * DELETE /api/portfolio/:id
 * Delete portfolio
 */
router.delete(
  '/:id',
  param('id').isString(),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await portfolioService.deletePortfolio(id);

      if (!deleted) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      logger.error('Error deleting portfolio:', error);
      throw error;
    }
  }
);

/**
 * POST /api/portfolio/:id/holdings
 * Add holding to portfolio
 */
router.post(
  '/:id/holdings',
  param('id').isString(),
  body('symbol').matches(/^[A-Z0-9.\-]+$/i).isLength({ min: 1, max: 20 }),
  body('quantity').isFloat({ min: 0.000001 }),
  body('averagePrice').isFloat({ min: 0 }),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { symbol, quantity, averagePrice } = req.body;

      const portfolio = await portfolioService.addHolding(id, {
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        averagePrice: parseFloat(averagePrice),
      });

      if (!portfolio) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.status(201).json(portfolio);
    } catch (error) {
      logger.error('Error adding holding:', error);
      throw error;
    }
  }
);

/**
 * DELETE /api/portfolio/:id/holdings/:symbol
 * Remove holding from portfolio
 */
router.delete(
  '/:id/holdings/:symbol',
  param('id').isString(),
  param('symbol').matches(/^[A-Z0-9.\-]+$/i),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id, symbol } = req.params;
      const portfolio = await portfolioService.removeHolding(id, symbol);

      if (!portfolio) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found or holding not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json(portfolio);
    } catch (error) {
      logger.error('Error removing holding:', error);
      throw error;
    }
  }
);

/**
 * POST /api/portfolio/:id/import
 * Import holdings from CSV
 */
router.post(
  '/:id/import',
  param('id').isString(),
  upload.single('file'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.file) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'CSV file is required',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const csvData = req.file.buffer.toString('utf-8');
      const portfolio = await portfolioService.importFromCSV(id, csvData);

      if (!portfolio) {
        res.status(404).json({
          error: 'Not Found',
          message: `Portfolio with ID ${id} not found`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      res.json({
        message: 'Holdings imported successfully',
        portfolio,
      });
    } catch (error) {
      logger.error('Error importing CSV:', error);
      res.status(400).json({
        error: 'Import Error',
        message: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /api/portfolio/:id/analyze
 * Batch analyze all holdings in portfolio
 */
router.post(
  '/:id/analyze',
  param('id').isString(),
  ...dateValidation('startDate', 'body'),
  ...dateValidation('endDate', 'body'),
  dateRangeValidation('body'),
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;

      logger.info(`Starting batch analysis for portfolio ${id}`);

      const result = await portfolioService.batchAnalyze(id, startDate, endDate);

      res.json({
        portfolioId: id,
        ...result,
      });
    } catch (error) {
      logger.error('Error in batch analysis:', error);
      throw error;
    }
  }
);

export default router;
