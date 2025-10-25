/**
 * Request validation middleware using express-validator
 */

import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Validate stock symbol format
 * Allows: A-Z, 0-9, dots, hyphens (e.g., BRK.B, RELIANCE.NS)
 */
export const symbolValidation: ValidationChain[] = [
  param('symbol')
    .matches(/^[A-Z0-9.\-]+$/i)
    .withMessage('Invalid symbol format')
    .isLength({ min: 1, max: 20 })
    .withMessage('Symbol must be 1-20 characters'),
];

/**
 * Validate date format (YYYY-MM-DD) and ensure not in future
 */
export const dateValidation = (field: 'startDate' | 'endDate', location: 'query' | 'body' = 'query') => {
  const validator = location === 'query' ? query : body;
  
  return [
    validator(field)
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format')
      .custom((value) => {
        const date = new Date(value);
        const now = new Date();
        now.setHours(23, 59, 59, 999); // End of today
        
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
        if (date > now) {
          throw new Error('Date cannot be in the future');
        }
        return true;
      }),
  ];
};

/**
 * Validate date range (startDate <= endDate)
 */
export const dateRangeValidation = (location: 'query' | 'body' = 'query'): ValidationChain => {
  const validator = location === 'query' ? query : body;
  
  return validator('endDate').custom((endDate, { req }) => {
    const startDate = req[location].startDate;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        throw new Error('startDate must be before or equal to endDate');
      }
      
      // Limit to 10 years of data
      const diffYears = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (diffYears > 10) {
        throw new Error('Date range cannot exceed 10 years');
      }
    }
    return true;
  });
};

/**
 * Validate range query parameters (ql, qr)
 */
export const rangeQueryValidation: ValidationChain[] = [
  body('ql')
    .isInt({ min: 0 })
    .withMessage('ql must be a non-negative integer'),
  body('qr')
    .isInt({ min: 0 })
    .withMessage('qr must be a non-negative integer')
    .custom((qr, { req }) => {
      const ql = parseInt(req.body.ql);
      if (ql !== undefined && qr < ql) {
        throw new Error('qr must be greater than or equal to ql');
      }
      return true;
    }),
];

/**
 * Validate window size
 */
export const windowSizeValidation: ValidationChain = body('windowSize')
  .isInt({ min: 1, max: 1000 })
  .withMessage('windowSize must be between 1 and 1000');

/**
 * Validate prices array (if provided directly)
 */
export const pricesArrayValidation: ValidationChain = body('prices')
  .optional()
  .isArray({ min: 1, max: 100000 })
  .withMessage('prices must be an array with 1 to 100,000 elements')
  .custom((prices: number[]) => {
    if (!prices.every(p => typeof p === 'number' && !isNaN(p) && isFinite(p))) {
      throw new Error('All prices must be valid numbers');
    }
    return true;
  });

/**
 * Middleware to check validation results
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request parameters',
      details: errors.array(),
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
};
