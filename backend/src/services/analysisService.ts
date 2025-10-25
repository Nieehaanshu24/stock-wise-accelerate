/**
 * Analysis service - bridges data providers and native C modules
 */

import {
  calculateStockSpan,
  withSegmentTree,
  querySegmentTree,
  withSlidingWindow,
  getWindowResult,
} from '../nativeBridge';
import { createDataProvider, DataProviderError } from './dataProvider';
import { cache } from '../cache/fileCache';
import {
  OHLCVData,
  SpanAnalysisResponse,
  RangeAnalysisResponse,
  WindowAnalysisResponse,
  WindowStats,
} from '../types';
import { logger } from '../utils/logger';

export class AnalysisService {
  private dataProvider = createDataProvider();

  /**
   * Fetch historical data with caching
   */
  private async getHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<OHLCVData[]> {
    const cacheKey = `historical:${symbol}:${startDate}:${endDate}`;
    const cached = await cache.get<OHLCVData[]>(cacheKey);

    if (cached) {
      logger.debug(`Using cached data for ${symbol}`);
      return cached;
    }

    logger.info(`Fetching historical data for ${symbol} from ${startDate} to ${endDate}`);
    const data = await this.dataProvider.fetchHistoricalData(symbol, startDate, endDate);

    // Cache for 1 hour
    await cache.set(cacheKey, data, 3600000);

    return data;
  }

  /**
   * Extract close prices from OHLCV data
   */
  private extractClosePrices(data: OHLCVData[]): Float64Array {
    return new Float64Array(data.map(d => d.close));
  }

  /**
   * Calculate stock span analysis
   */
  async calculateSpan(
    symbol: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
    directPrices?: number[]
  ): Promise<SpanAnalysisResponse> {
    const startTime = Date.now();

    let prices: Float64Array;

    if (directPrices && directPrices.length > 0) {
      // Use directly provided prices
      prices = new Float64Array(directPrices);
    } else if (symbol && startDate && endDate) {
      // Fetch from provider
      const historicalData = await this.getHistoricalData(symbol, startDate, endDate);
      if (historicalData.length === 0) {
        throw new DataProviderError('No data available for the specified period');
      }
      prices = this.extractClosePrices(historicalData);
    } else {
      throw new Error('Either provide symbol with dates or direct prices array');
    }

    // Call native function
    const spansArray = await calculateStockSpan(prices);
    const spans = Array.from(spansArray);

    const processingTimeMs = Date.now() - startTime;

    logger.info(`Span analysis completed in ${processingTimeMs}ms`);

    return {
      symbol,
      spans,
      processingTimeMs,
    };
  }

  /**
   * Perform range query analysis using segment tree
   */
  async analyzeRange(
    symbol: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
    ql: number,
    qr: number,
    directPrices?: number[]
  ): Promise<RangeAnalysisResponse> {
    const startTime = Date.now();

    let prices: Float64Array;

    if (directPrices && directPrices.length > 0) {
      prices = new Float64Array(directPrices);
    } else if (symbol && startDate && endDate) {
      const historicalData = await this.getHistoricalData(symbol, startDate, endDate);
      if (historicalData.length === 0) {
        throw new DataProviderError('No data available for the specified period');
      }
      prices = this.extractClosePrices(historicalData);
    } else {
      throw new Error('Either provide symbol with dates or direct prices array');
    }

    // Validate range bounds
    if (ql < 0 || qr >= prices.length || ql > qr) {
      throw new Error(`Invalid range: ql=${ql}, qr=${qr}, length=${prices.length}`);
    }

    // Use segment tree with auto-cleanup
    const stats = await withSegmentTree(prices, async (tree) => {
      return await querySegmentTree(tree, ql, qr);
    });

    const processingTimeMs = Date.now() - startTime;

    logger.info(`Range analysis completed in ${processingTimeMs}ms`);

    return {
      symbol,
      range: { start: ql, end: qr },
      stats,
      processingTimeMs,
    };
  }

  /**
   * Perform sliding window analysis
   */
  async analyzeWindow(
    symbol: string | undefined,
    startDate: string | undefined,
    endDate: string | undefined,
    windowSize: number,
    directPrices?: number[]
  ): Promise<WindowAnalysisResponse> {
    const startTime = Date.now();

    let prices: Float64Array;

    if (directPrices && directPrices.length > 0) {
      prices = new Float64Array(directPrices);
    } else if (symbol && startDate && endDate) {
      const historicalData = await this.getHistoricalData(symbol, startDate, endDate);
      if (historicalData.length === 0) {
        throw new DataProviderError('No data available for the specified period');
      }
      prices = this.extractClosePrices(historicalData);
    } else {
      throw new Error('Either provide symbol with dates or direct prices array');
    }

    // Validate window size
    if (windowSize <= 0 || windowSize > prices.length) {
      throw new Error(
        `Invalid window size: ${windowSize} (must be 1 to ${prices.length})`
      );
    }

    const numWindows = prices.length - windowSize + 1;
    const windows: WindowStats[] = [];

    // Use sliding window with auto-cleanup
    await withSlidingWindow(prices, windowSize, async (handle) => {
      for (let i = 0; i < numWindows; i++) {
        const result = await getWindowResult(handle, i);
        windows.push({
          index: i,
          ...result,
        });
      }
    });

    const processingTimeMs = Date.now() - startTime;

    logger.info(`Window analysis completed in ${processingTimeMs}ms`);

    return {
      symbol,
      windowSize,
      windows,
      processingTimeMs,
    };
  }

  /**
   * Search for stock symbols
   */
  async searchSymbols(query: string): Promise<string[]> {
    try {
      return await this.dataProvider.searchSymbol(query);
    } catch (error) {
      logger.error('Symbol search error:', error);
      return [];
    }
  }
}

export const analysisService = new AnalysisService();
