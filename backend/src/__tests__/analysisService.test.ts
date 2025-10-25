/**
 * Analysis service unit tests
 * 
 * IMPORTANT: No embedded market data. Tests use mocked providers.
 */

import { analysisService } from '../services/analysisService';
import { DataProvider } from '../services/dataProvider';
import { OHLCVData } from '../types';

// Mock data provider
jest.mock('../services/dataProvider', () => {
  const mockProvider: Partial<DataProvider> = {
    fetchHistoricalData: jest.fn(),
    searchSymbol: jest.fn(),
  };

  return {
    DataProvider: jest.fn(),
    DataProviderError: class extends Error {},
    createDataProvider: jest.fn(() => mockProvider),
  };
});

// Mock cache
jest.mock('../cache/fileCache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
    init: jest.fn(),
    delete: jest.fn(),
    purge: jest.fn(),
    clean: jest.fn(),
  },
}));

// Mock native module
jest.mock('../native/dist/wrapper', () => ({
  calculateStockSpan: jest.fn(async (prices: Float64Array) => {
    // Simple mock implementation
    return new Int32Array(prices.length).fill(1);
  }),
  withSegmentTree: jest.fn(async (_prices, callback) => {
    return await callback({});
  }),
  querySegmentTree: jest.fn(async () => ({
    min: 100,
    max: 110,
    avg: 105,
    variance: 10,
  })),
  withSlidingWindow: jest.fn(async (_prices, _windowSize, callback) => {
    return await callback({});
  }),
  getWindowResult: jest.fn(async () => ({
    max: 110,
    min: 100,
    avg: 105,
    pattern: 'stable',
  })),
}));

describe('AnalysisService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSpan', () => {
    it('should calculate span with direct prices', async () => {
      const prices = [100, 102, 98, 105, 107];
      
      const result = await analysisService.calculateSpan(
        undefined,
        undefined,
        undefined,
        prices
      );

      expect(result.spans).toBeDefined();
      expect(result.spans.length).toBe(prices.length);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should throw error when neither symbol nor prices provided', async () => {
      await expect(
        analysisService.calculateSpan(undefined, undefined, undefined, undefined)
      ).rejects.toThrow('Either provide symbol with dates or direct prices array');
    });

    it('should throw error when symbol provided without dates', async () => {
      await expect(
        analysisService.calculateSpan('AAPL', undefined, undefined, undefined)
      ).rejects.toThrow();
    });
  });

  describe('analyzeRange', () => {
    it('should analyze range with direct prices', async () => {
      const prices = [100, 102, 98, 105, 107, 103, 110];
      
      const result = await analysisService.analyzeRange(
        undefined,
        undefined,
        undefined,
        0,
        5,
        prices
      );

      expect(result.range).toEqual({ start: 0, end: 5 });
      expect(result.stats).toBeDefined();
      expect(result.stats.min).toBeDefined();
      expect(result.stats.max).toBeDefined();
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should throw error for invalid range bounds', async () => {
      const prices = [100, 102, 98, 105, 107];
      
      await expect(
        analysisService.analyzeRange(undefined, undefined, undefined, 3, 2, prices)
      ).rejects.toThrow('Invalid range');
    });

    it('should throw error for out of bounds range', async () => {
      const prices = [100, 102, 98];
      
      await expect(
        analysisService.analyzeRange(undefined, undefined, undefined, 0, 5, prices)
      ).rejects.toThrow('Invalid range');
    });
  });

  describe('analyzeWindow', () => {
    it('should analyze windows with direct prices', async () => {
      const prices = [100, 102, 98, 105, 107, 103, 110, 108];
      const windowSize = 3;
      
      const result = await analysisService.analyzeWindow(
        undefined,
        undefined,
        undefined,
        windowSize,
        prices
      );

      expect(result.windowSize).toBe(windowSize);
      expect(result.windows).toBeDefined();
      const expectedWindows = prices.length - windowSize + 1;
      expect(result.windows.length).toBe(expectedWindows);
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should throw error for invalid window size', async () => {
      const prices = [100, 102, 98];
      
      await expect(
        analysisService.analyzeWindow(undefined, undefined, undefined, 5, prices)
      ).rejects.toThrow('Invalid window size');
    });

    it('should throw error for zero window size', async () => {
      const prices = [100, 102, 98];
      
      await expect(
        analysisService.analyzeWindow(undefined, undefined, undefined, 0, prices)
      ).rejects.toThrow('Invalid window size');
    });
  });

  describe('searchSymbols', () => {
    it('should return empty array on provider error', async () => {
      const result = await analysisService.searchSymbols('AAPL');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
