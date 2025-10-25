/**
 * Export utilities for CSV and PDF generation
 * All functions require user-provided data
 */

import { Portfolio } from './api';

/**
 * Export portfolio holdings to CSV format
 * Throws error if portfolio has no holdings
 */
export function exportPortfolioToCSV(portfolio: Portfolio): string {
  if (!portfolio.holdings || portfolio.holdings.length === 0) {
    throw new Error('Cannot export empty portfolio. Add holdings first.');
  }

  const header = 'Symbol,Quantity,Average Price,Added At,Current Value\n';
  const rows = portfolio.holdings.map(holding => {
    const currentValue = holding.quantity * holding.averagePrice;
    return `${holding.symbol},${holding.quantity},${holding.averagePrice},${holding.addedAt},${currentValue}`;
  }).join('\n');

  return header + rows;
}

/**
 * Download CSV file
 */
export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate PDF report (placeholder)
 * In production, use libraries like jsPDF or server-side PDF generation
 */
export function exportPortfolioPDF(portfolio: Portfolio): void {
  if (!portfolio.holdings || portfolio.holdings.length === 0) {
    throw new Error('Cannot export empty portfolio. Add holdings first.');
  }

  // Placeholder: In production, implement with jsPDF or similar
  throw new Error('PDF export not yet implemented. Use CSV export for now.');
}

/**
 * Parse CSV import file
 * Expected format: symbol,quantity,averagePrice
 */
export function parseCSVImport(csvText: string): Array<{
  symbol: string;
  quantity: number;
  averagePrice: number;
}> {
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header if present
  const startIndex = lines[0].toLowerCase().includes('symbol') ? 1 : 0;
  const holdings: Array<{
    symbol: string;
    quantity: number;
    averagePrice: number;
  }> = [];

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 3) {
      throw new Error(`Invalid CSV format at line ${i + 1}: expected at least 3 columns`);
    }

    const [symbol, quantityStr, priceStr] = parts;
    const quantity = parseFloat(quantityStr);
    const averagePrice = parseFloat(priceStr);

    if (!symbol || isNaN(quantity) || isNaN(averagePrice)) {
      throw new Error(`Invalid data at line ${i + 1}: symbol="${symbol}", quantity="${quantityStr}", price="${priceStr}"`);
    }

    if (quantity <= 0 || averagePrice <= 0) {
      throw new Error(`Invalid values at line ${i + 1}: quantity and price must be positive`);
    }

    holdings.push({
      symbol: symbol.toUpperCase(),
      quantity,
      averagePrice,
    });
  }

  if (holdings.length === 0) {
    throw new Error('No valid holdings found in CSV file');
  }

  return holdings;
}

/**
 * Export comparison results to CSV
 */
export function exportComparisonCSV(
  results: Array<{ symbol: string; data?: Array<{ date: string; close: number }> }>
): string {
  // Find all unique dates
  const allDates = new Set<string>();
  results.forEach(r => {
    if (r.data) {
      r.data.forEach(d => allDates.add(d.date));
    }
  });

  const sortedDates = Array.from(allDates).sort();
  
  // Create header
  const header = 'Date,' + results.map(r => r.symbol).join(',') + '\n';
  
  // Create rows
  const rows = sortedDates.map(date => {
    const values = results.map(r => {
      const dataPoint = r.data?.find(d => d.date === date);
      return dataPoint ? dataPoint.close.toFixed(2) : '';
    });
    return date + ',' + values.join(',');
  }).join('\n');

  return header + rows;
}
