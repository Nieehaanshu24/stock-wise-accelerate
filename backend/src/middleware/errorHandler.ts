/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { DataProviderError } from '../services/dataProvider';
import { logger } from '../utils/logger';
import { ErrorResponse } from '../types';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Data provider errors
  if (err instanceof DataProviderError) {
    const statusCode = err.code === 'MISSING_CONFIG' ? 503 : 400;
    const response: ErrorResponse = {
      error: 'Data Provider Error',
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(response);
    return;
  }

  // Native module errors
  if (err.message.includes('Native DSA module')) {
    const response: ErrorResponse = {
      error: 'Native Module Error',
      message: 'Analysis engine not available. Please contact administrator.',
      code: 'NATIVE_MODULE_ERROR',
      timestamp: new Date().toISOString(),
    };
    res.status(503).json(response);
    return;
  }

  // Validation errors
  if (err.message.includes('Invalid') || err.message.includes('must be')) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      message: err.message,
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  // Default error response
  const response: ErrorResponse = {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    timestamp: new Date().toISOString(),
  };
  res.status(500).json(response);
};
