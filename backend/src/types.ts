/**
 * Shared type definitions for DSA backend
 */

export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataRequest {
  symbol: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface HistoricalDataResponse {
  symbol: string;
  data: OHLCVData[];
  source: string;
  cached: boolean;
}

export interface SpanAnalysisRequest {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  prices?: number[]; // Optional direct price input
}

export interface SpanAnalysisResponse {
  symbol?: string;
  spans: number[];
  processingTimeMs: number;
}

export interface RangeAnalysisRequest {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  ql: number;
  qr: number;
  prices?: number[];
}

export interface RangeStats {
  min: number;
  max: number;
  avg: number;
  variance: number;
}

export interface RangeAnalysisResponse {
  symbol?: string;
  range: {
    start: number;
    end: number;
  };
  stats: RangeStats;
  processingTimeMs: number;
}

export interface WindowAnalysisRequest {
  symbol?: string;
  startDate?: string;
  endDate?: string;
  windowSize: number;
  prices?: number[];
}

export interface WindowStats {
  index: number;
  max: number;
  min: number;
  avg: number;
  pattern: 'bullish' | 'bearish' | 'volatile' | 'stable';
}

export interface WindowAnalysisResponse {
  symbol?: string;
  windowSize: number;
  windows: WindowStats[];
  processingTimeMs: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  holdings: PortfolioHolding[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  averagePrice: number;
  addedAt: string;
}

export interface DataProviderConfig {
  provider: 'yahoo' | 'nse';
  apiKey?: string;
  baseUrl?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}
