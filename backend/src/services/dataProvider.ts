/**
 * Data provider abstraction for fetching stock data
 * Supports Yahoo Finance and NSE (requires configuration)
 */

import axios, { AxiosInstance } from 'axios';
import { OHLCVData, DataProviderConfig } from '../types';
import { logger } from '../utils/logger';

export class DataProviderError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DataProviderError';
  }
}

export abstract class DataProvider {
  protected client: AxiosInstance;

  constructor(protected config: DataProviderConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'DSA-Backend/1.0',
      },
    });
  }

  abstract fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<OHLCVData[]>;

  abstract searchSymbol(query: string): Promise<string[]>;
}

/**
 * Yahoo Finance provider (free, no API key required)
 */
export class YahooFinanceProvider extends DataProvider {
  constructor() {
    super({
      provider: 'yahoo',
      baseUrl: 'https://query1.finance.yahoo.com',
    });
  }

  async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<OHLCVData[]> {
    try {
      const start = Math.floor(new Date(startDate).getTime() / 1000);
      const end = Math.floor(new Date(endDate).getTime() / 1000);

      const response = await this.client.get('/v8/finance/chart/' + symbol, {
        params: {
          period1: start,
          period2: end,
          interval: '1d',
          events: 'history',
        },
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.timestamp) {
        throw new DataProviderError('Invalid response from Yahoo Finance');
      }

      const timestamps = result.timestamp;
      const quotes = result.indicators?.quote?.[0];

      if (!quotes) {
        throw new DataProviderError('No quote data available');
      }

      const data: OHLCVData[] = [];
      for (let i = 0; i < timestamps.length; i++) {
        // Skip null entries
        if (quotes.close[i] === null) continue;

        data.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quotes.open[i] ?? quotes.close[i],
          high: quotes.high[i] ?? quotes.close[i],
          low: quotes.low[i] ?? quotes.close[i],
          close: quotes.close[i],
          volume: quotes.volume[i] ?? 0,
        });
      }

      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Yahoo Finance API error: ${error.message}`);
        throw new DataProviderError(
          `Failed to fetch data from Yahoo Finance: ${error.message}`,
          'PROVIDER_ERROR'
        );
      }
      throw error;
    }
  }

  async searchSymbol(query: string): Promise<string[]> {
    try {
      const response = await this.client.get('/v1/finance/search', {
        params: { q: query, quotesCount: 10 },
      });

      return (
        response.data?.quotes?.map((q: { symbol: string }) => q.symbol) || []
      );
    } catch (error) {
      logger.error('Yahoo Finance search error:', error);
      return [];
    }
  }
}

/**
 * NSE India provider (requires API key or custom implementation)
 */
export class NSEProvider extends DataProvider {
  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new DataProviderError(
        'NSE_API_KEY environment variable is required for NSE provider',
        'MISSING_CONFIG'
      );
    }

    super({
      provider: 'nse',
      apiKey,
      baseUrl: process.env.NSE_API_URL || 'https://www.nseindia.com',
    });

    this.client.defaults.headers.common['X-API-Key'] = apiKey;
  }

  async fetchHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<OHLCVData[]> {
    // Note: NSE API implementation depends on specific provider/subscription
    // This is a placeholder that would need actual NSE API integration
    throw new DataProviderError(
      'NSE provider requires custom implementation based on your API subscription',
      'NOT_IMPLEMENTED'
    );
  }

  async searchSymbol(_query: string): Promise<string[]> {
    throw new DataProviderError('NSE search not implemented', 'NOT_IMPLEMENTED');
  }
}

/**
 * Factory to create appropriate provider based on configuration
 */
export function createDataProvider(): DataProvider {
  const provider = process.env.DATA_PROVIDER || 'yahoo';

  switch (provider.toLowerCase()) {
    case 'yahoo':
      return new YahooFinanceProvider();

    case 'nse':
      const apiKey = process.env.NSE_API_KEY;
      return new NSEProvider(apiKey);

    default:
      logger.warn(`Unknown provider ${provider}, falling back to Yahoo Finance`);
      return new YahooFinanceProvider();
  }
}
