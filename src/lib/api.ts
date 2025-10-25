/**
 * API client for Dynamic Stock Analyzer backend
 * Typed fetch wrappers with error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

async function fetchWithErrorHandling<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        error: 'Unknown Error',
        message: 'Failed to parse error response',
      }));

      throw new ApiError(
        errorData.message,
        response.status,
        errorData.code
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      'Network error: Unable to connect to backend service',
      0
    );
  }
}

// Types matching backend responses
export interface OHLCVData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalDataResponse {
  symbol: string;
  data: OHLCVData[];
  source: string;
  cached: boolean;
}

export interface SpanAnalysisResponse {
  symbol?: string;
  spans: number[];
  processingTimeMs: number;
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

// API methods
export const api = {
  // Stock data endpoints
  async getHistoricalData(
    symbol: string,
    startDate: string,
    endDate: string
  ): Promise<HistoricalDataResponse> {
    return fetchWithErrorHandling(
      `/stocks/${encodeURIComponent(symbol)}/historical?startDate=${startDate}&endDate=${endDate}`
    );
  },

  async searchSymbols(query: string): Promise<{ query: string; results: string[] }> {
    return fetchWithErrorHandling(`/stocks/search?q=${encodeURIComponent(query)}`);
  },

  // Analysis endpoints
  async calculateSpan(data: {
    symbol?: string;
    startDate?: string;
    endDate?: string;
    prices?: number[];
  }): Promise<SpanAnalysisResponse> {
    return fetchWithErrorHandling('/analyze/span', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async analyzeRange(data: {
    symbol?: string;
    startDate?: string;
    endDate?: string;
    ql: number;
    qr: number;
    prices?: number[];
  }): Promise<RangeAnalysisResponse> {
    return fetchWithErrorHandling('/analyze/range', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async analyzeWindow(data: {
    symbol?: string;
    startDate?: string;
    endDate?: string;
    windowSize: number;
    prices?: number[];
  }): Promise<WindowAnalysisResponse> {
    return fetchWithErrorHandling('/analyze/window', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Portfolio endpoints
  async getPortfolios(): Promise<{ portfolios: Portfolio[] }> {
    return fetchWithErrorHandling('/portfolio');
  },

  async getPortfolio(id: string): Promise<Portfolio> {
    return fetchWithErrorHandling(`/portfolio/${id}`);
  },

  async createPortfolio(data: {
    name: string;
    description?: string;
  }): Promise<Portfolio> {
    return fetchWithErrorHandling('/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updatePortfolio(
    id: string,
    data: { name?: string; description?: string }
  ): Promise<Portfolio> {
    return fetchWithErrorHandling(`/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deletePortfolio(id: string): Promise<void> {
    return fetchWithErrorHandling(`/portfolio/${id}`, {
      method: 'DELETE',
    });
  },

  async addHolding(
    portfolioId: string,
    data: { symbol: string; quantity: number; averagePrice: number }
  ): Promise<Portfolio> {
    return fetchWithErrorHandling(`/portfolio/${portfolioId}/holdings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async removeHolding(portfolioId: string, symbol: string): Promise<Portfolio> {
    return fetchWithErrorHandling(
      `/portfolio/${portfolioId}/holdings/${encodeURIComponent(symbol)}`,
      {
        method: 'DELETE',
      }
    );
  },

  // Cache management
  async purgeCache(): Promise<{ message: string; timestamp: string }> {
    return fetchWithErrorHandling('/cache/purge', {
      method: 'POST',
    });
  },

  async cleanCache(): Promise<{ message: string; timestamp: string }> {
    return fetchWithErrorHandling('/cache/clean', {
      method: 'POST',
    });
  },

  // Health check
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  }> {
    return fetch(`${API_BASE_URL.replace('/api', '')}/health`).then(r => r.json());
  },
};
