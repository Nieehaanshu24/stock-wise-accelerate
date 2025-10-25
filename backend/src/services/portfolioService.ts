/**
 * Portfolio service with file-based persistence
 * Stores portfolios as JSON files in configured directory
 */

import fs from 'fs/promises';
import path from 'path';
import { Portfolio, PortfolioHolding } from '../types';
import { logger } from '../utils/logger';
import { createDataProvider } from './dataProvider';
import {
  calculateStockSpan,
  withSegmentTree,
  querySegmentTree,
} from '../native/dist/wrapper';

const PORTFOLIOS_DIR = process.env.PORTFOLIOS_DIR || './data/portfolios';
const dataProvider = createDataProvider();

export class PortfolioService {
  async init(): Promise<void> {
    try {
      await fs.mkdir(PORTFOLIOS_DIR, { recursive: true });
      logger.info(`Portfolios directory initialized: ${PORTFOLIOS_DIR}`);
    } catch (error) {
      logger.error('Failed to initialize portfolios directory:', error);
      throw error;
    }
  }

  private getPortfolioPath(id: string): string {
    return path.join(PORTFOLIOS_DIR, `${id}.json`);
  }

  async listPortfolios(): Promise<Portfolio[]> {
    try {
      const files = await fs.readdir(PORTFOLIOS_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const portfolios = await Promise.all(
        jsonFiles.map(async (file) => {
          const content = await fs.readFile(
            path.join(PORTFOLIOS_DIR, file),
            'utf-8'
          );
          return JSON.parse(content) as Portfolio;
        })
      );

      return portfolios.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } catch (error) {
      logger.error('Error listing portfolios:', error);
      return [];
    }
  }

  async getPortfolio(id: string): Promise<Portfolio | null> {
    try {
      const content = await fs.readFile(this.getPortfolioPath(id), 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async createPortfolio(data: {
    name: string;
    description?: string;
  }): Promise<Portfolio> {
    const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const portfolio: Portfolio = {
      id,
      name: data.name,
      description: data.description,
      holdings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      this.getPortfolioPath(id),
      JSON.stringify(portfolio, null, 2),
      'utf-8'
    );

    logger.info(`Portfolio created: ${id}`);
    return portfolio;
  }

  async updatePortfolio(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Portfolio | null> {
    const portfolio = await this.getPortfolio(id);
    if (!portfolio) return null;

    if (data.name !== undefined) portfolio.name = data.name;
    if (data.description !== undefined) portfolio.description = data.description;
    portfolio.updatedAt = new Date().toISOString();

    await fs.writeFile(
      this.getPortfolioPath(id),
      JSON.stringify(portfolio, null, 2),
      'utf-8'
    );

    logger.info(`Portfolio updated: ${id}`);
    return portfolio;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    try {
      await fs.unlink(this.getPortfolioPath(id));
      logger.info(`Portfolio deleted: ${id}`);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  async addHolding(
    portfolioId: string,
    holding: Omit<PortfolioHolding, 'addedAt'>
  ): Promise<Portfolio | null> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) return null;

    // Check if holding already exists
    const existingIndex = portfolio.holdings.findIndex(
      h => h.symbol.toUpperCase() === holding.symbol.toUpperCase()
    );

    if (existingIndex >= 0) {
      // Update existing holding
      portfolio.holdings[existingIndex] = {
        ...portfolio.holdings[existingIndex],
        quantity: holding.quantity,
        averagePrice: holding.averagePrice,
      };
    } else {
      // Add new holding
      portfolio.holdings.push({
        ...holding,
        symbol: holding.symbol.toUpperCase(),
        addedAt: new Date().toISOString(),
      });
    }

    portfolio.updatedAt = new Date().toISOString();

    await fs.writeFile(
      this.getPortfolioPath(portfolioId),
      JSON.stringify(portfolio, null, 2),
      'utf-8'
    );

    logger.info(`Holding added to portfolio ${portfolioId}: ${holding.symbol}`);
    return portfolio;
  }

  async removeHolding(
    portfolioId: string,
    symbol: string
  ): Promise<Portfolio | null> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) return null;

    portfolio.holdings = portfolio.holdings.filter(
      h => h.symbol.toUpperCase() !== symbol.toUpperCase()
    );
    portfolio.updatedAt = new Date().toISOString();

    await fs.writeFile(
      this.getPortfolioPath(portfolioId),
      JSON.stringify(portfolio, null, 2),
      'utf-8'
    );

    logger.info(`Holding removed from portfolio ${portfolioId}: ${symbol}`);
    return portfolio;
  }

  /**
   * Import portfolio from CSV data
   * CSV format: symbol,quantity,averagePrice
   */
  async importFromCSV(
    portfolioId: string,
    csvData: string
  ): Promise<Portfolio | null> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) return null;

    const lines = csvData.trim().split('\n');
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('symbol') ? 1 : 0;
    const importedHoldings: Omit<PortfolioHolding, 'addedAt'>[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 3) {
        throw new Error(`Invalid CSV format at line ${i + 1}: expected 3 columns`);
      }

      const [symbol, quantityStr, priceStr] = parts;
      const quantity = parseFloat(quantityStr);
      const averagePrice = parseFloat(priceStr);

      if (!symbol || isNaN(quantity) || isNaN(averagePrice)) {
        throw new Error(`Invalid data at line ${i + 1}`);
      }

      importedHoldings.push({
        symbol: symbol.toUpperCase(),
        quantity,
        averagePrice,
      });
    }

    // Add all holdings
    for (const holding of importedHoldings) {
      await this.addHolding(portfolioId, holding);
    }

    const updatedPortfolio = await this.getPortfolio(portfolioId);
    logger.info(`Imported ${importedHoldings.length} holdings to portfolio ${portfolioId}`);
    return updatedPortfolio;
  }

  /**
   * Batch analyze all holdings in a portfolio
   */
  async batchAnalyze(
    portfolioId: string,
    startDate: string,
    endDate: string,
    onProgress?: (current: number, total: number, symbol: string) => void
  ): Promise<{
    results: Array<{
      symbol: string;
      success: boolean;
      data?: {
        spanAvg: number;
        rangeStats: { min: number; max: number; avg: number; variance: number };
      };
      error?: string;
      processingTimeMs: number;
    }>;
    totalTimeMs: number;
  }> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const startTime = Date.now();
    const results: Array<{
      symbol: string;
      success: boolean;
      data?: {
        spanAvg: number;
        rangeStats: { min: number; max: number; avg: number; variance: number };
      };
      error?: string;
      processingTimeMs: number;
    }> = [];

    for (let i = 0; i < portfolio.holdings.length; i++) {
      const holding = portfolio.holdings[i];
      const symbolStartTime = Date.now();

      if (onProgress) {
        onProgress(i + 1, portfolio.holdings.length, holding.symbol);
      }

      try {
        // Fetch historical data
        const historicalData = await dataProvider.fetchHistoricalData(
          holding.symbol,
          startDate,
          endDate
        );

        if (historicalData.length === 0) {
          results.push({
            symbol: holding.symbol,
            success: false,
            error: 'No data available',
            processingTimeMs: Date.now() - symbolStartTime,
          });
          continue;
        }

        // Extract close prices
        const prices = new Float64Array(historicalData.map(d => d.close));

        // Calculate span
        const spans = await calculateStockSpan(prices);
        const spanAvg = Array.from(spans).reduce((a, b) => a + b, 0) / spans.length;

        // Query range stats
        const rangeStats = await withSegmentTree(prices, async (tree) => {
          return await querySegmentTree(tree, 0, prices.length - 1);
        });

        results.push({
          symbol: holding.symbol,
          success: true,
          data: {
            spanAvg,
            rangeStats,
          },
          processingTimeMs: Date.now() - symbolStartTime,
        });
      } catch (error) {
        logger.error(`Error analyzing ${holding.symbol}:`, error);
        results.push({
          symbol: holding.symbol,
          success: false,
          error: (error as Error).message,
          processingTimeMs: Date.now() - symbolStartTime,
        });
      }
    }

    const totalTimeMs = Date.now() - startTime;

    return {
      results,
      totalTimeMs,
    };
  }
}

export const portfolioService = new PortfolioService();
