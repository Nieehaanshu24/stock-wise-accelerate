/**
 * Portfolio management routes
 * Simple in-memory storage (replace with database in production)
 */

import { Router, Request, Response } from 'express';
import { body, param } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { Portfolio, PortfolioHolding } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// In-memory storage (replace with database)
const portfolios = new Map<string, Portfolio>();
let nextId = 1;

/**
 * GET /api/portfolio
 * List all portfolios
 */
router.get('/', (_req: Request, res: Response) => {
  const portfolioList = Array.from(portfolios.values());
  res.json({ portfolios: portfolioList });
});

/**
 * GET /api/portfolio/:id
 * Get portfolio by ID
 */
router.get(
  '/:id',
  param('id').isString(),
  handleValidationErrors,
  (req: Request, res: Response) => {
    const { id } = req.params;
    const portfolio = portfolios.get(id);

    if (!portfolio) {
      res.status(404).json({
        error: 'Not Found',
        message: `Portfolio with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json(portfolio);
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
  (req: Request, res: Response) => {
    const { name, description } = req.body;

    const portfolio: Portfolio = {
      id: (nextId++).toString(),
      name,
      description,
      holdings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    portfolios.set(portfolio.id, portfolio);
    logger.info(`Portfolio created: ${portfolio.id}`);

    res.status(201).json(portfolio);
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
  (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const portfolio = portfolios.get(id);
    if (!portfolio) {
      res.status(404).json({
        error: 'Not Found',
        message: `Portfolio with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (name !== undefined) portfolio.name = name;
    if (description !== undefined) portfolio.description = description;
    portfolio.updatedAt = new Date().toISOString();

    portfolios.set(id, portfolio);
    logger.info(`Portfolio updated: ${id}`);

    res.json(portfolio);
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
  (req: Request, res: Response) => {
    const { id } = req.params;

    if (!portfolios.has(id)) {
      res.status(404).json({
        error: 'Not Found',
        message: `Portfolio with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    portfolios.delete(id);
    logger.info(`Portfolio deleted: ${id}`);

    res.status(204).send();
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
  (req: Request, res: Response) => {
    const { id } = req.params;
    const { symbol, quantity, averagePrice } = req.body;

    const portfolio = portfolios.get(id);
    if (!portfolio) {
      res.status(404).json({
        error: 'Not Found',
        message: `Portfolio with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const holding: PortfolioHolding = {
      symbol: symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      averagePrice: parseFloat(averagePrice),
      addedAt: new Date().toISOString(),
    };

    portfolio.holdings.push(holding);
    portfolio.updatedAt = new Date().toISOString();

    portfolios.set(id, portfolio);
    logger.info(`Holding added to portfolio ${id}: ${symbol}`);

    res.status(201).json(portfolio);
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
  (req: Request, res: Response) => {
    const { id, symbol } = req.params;

    const portfolio = portfolios.get(id);
    if (!portfolio) {
      res.status(404).json({
        error: 'Not Found',
        message: `Portfolio with ID ${id} not found`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const initialLength = portfolio.holdings.length;
    portfolio.holdings = portfolio.holdings.filter(
      h => h.symbol.toUpperCase() !== symbol.toUpperCase()
    );

    if (portfolio.holdings.length === initialLength) {
      res.status(404).json({
        error: 'Not Found',
        message: `Holding ${symbol} not found in portfolio`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    portfolio.updatedAt = new Date().toISOString();
    portfolios.set(id, portfolio);
    logger.info(`Holding removed from portfolio ${id}: ${symbol}`);

    res.json(portfolio);
  }
);

export default router;
