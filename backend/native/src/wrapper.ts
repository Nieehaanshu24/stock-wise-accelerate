/**
 * TypeScript wrapper for native DSA (Dynamic Stock Analyzer) module
 * 
 * Provides promise-based, type-safe interface to C algorithms.
 * Handles resource cleanup and error propagation.
 */

import { Worker } from 'worker_threads';

// Native module types
interface NativeModule {
  calculateStockSpan(prices: Float64Array): Int32Array;
  buildSegmentTree(prices: Float64Array): unknown; // Opaque external handle
  querySegmentTree(handle: unknown, ql: number, qr: number): {
    min: number;
    max: number;
    avg: number;
    variance: number;
  };
  freeSegmentTree(handle: unknown): void;
  analyzeSlidingWindow(prices: Float64Array, windowSize: number): unknown; // Opaque handle
  getWindowResult(handle: unknown, idx: number): {
    max: number;
    min: number;
    avg: number;
    pattern: string;
  };
  freeWindowResult(handle: unknown): void;
}

// Lazy load native module (allows fallback if not compiled)
let nativeModule: NativeModule | null = null;

function loadNativeModule(): NativeModule {
  if (nativeModule) return nativeModule;
  
  try {
    // Try to load compiled native addon
    nativeModule = require('../../build/Release/dsa_native.node') as NativeModule;
    return nativeModule;
  } catch (err) {
    throw new Error(
      'Native DSA module not compiled. Run: cd backend/native && npm run build\n' +
      'Original error: ' + (err as Error).message
    );
  }
}

/**
 * Calculate stock span for price array
 * 
 * @param prices Array of stock prices
 * @returns Array of span values (same length as input)
 * @throws Error if native module fails or invalid input
 */
export async function calculateStockSpan(prices: Float64Array): Promise<Int32Array> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      const result = native.calculateStockSpan(prices);
      resolve(result);
    } catch (err) {
      reject(new Error(`Stock span calculation failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Opaque handle for segment tree
 * IMPORTANT: Must call freeSegmentTree() when done to prevent memory leak
 */
export type SegmentTreeHandle = unknown;

/**
 * Build segment tree from price array
 * 
 * @param prices Array of stock prices
 * @returns Opaque handle (must be freed with freeSegmentTree)
 * @throws Error if build fails
 */
export async function buildSegmentTree(prices: Float64Array): Promise<SegmentTreeHandle> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      const handle = native.buildSegmentTree(prices);
      resolve(handle);
    } catch (err) {
      reject(new Error(`Segment tree build failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Range query statistics
 */
export interface RangeStats {
  min: number;
  max: number;
  avg: number;
  variance: number;
}

/**
 * Query segment tree for range statistics
 * 
 * @param handle Tree handle from buildSegmentTree
 * @param ql Query range start (inclusive, 0-based)
 * @param qr Query range end (inclusive, 0-based)
 * @returns Statistics for the range
 * @throws Error if query fails (invalid range, null handle)
 */
export async function querySegmentTree(
  handle: SegmentTreeHandle,
  ql: number,
  qr: number
): Promise<RangeStats> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      const result = native.querySegmentTree(handle, ql, qr);
      resolve(result);
    } catch (err) {
      reject(new Error(`Segment tree query failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Free segment tree resources
 * 
 * @param handle Tree handle to free
 * @throws Error if handle is invalid
 */
export async function freeSegmentTree(handle: SegmentTreeHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      native.freeSegmentTree(handle);
      resolve();
    } catch (err) {
      reject(new Error(`Segment tree free failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Opaque handle for sliding window results
 * IMPORTANT: Must call freeWindowResult() when done
 */
export type WindowResultHandle = unknown;

/**
 * Analyze prices using sliding window
 * 
 * @param prices Array of stock prices
 * @param windowSize Size of sliding window
 * @returns Handle to window results (must be freed)
 * @throws Error if analysis fails
 */
export async function analyzeSlidingWindow(
  prices: Float64Array,
  windowSize: number
): Promise<WindowResultHandle> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      const handle = native.analyzeSlidingWindow(prices, windowSize);
      resolve(handle);
    } catch (err) {
      reject(new Error(`Sliding window analysis failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Single window statistics with pattern
 */
export interface WindowStats {
  max: number;
  min: number;
  avg: number;
  pattern: 'bullish' | 'bearish' | 'volatile' | 'stable';
}

/**
 * Get results for specific window
 * 
 * @param handle Window result handle
 * @param idx Window index (0 to numWindows-1)
 * @returns Statistics for the window
 * @throws Error if index out of bounds
 */
export async function getWindowResult(
  handle: WindowResultHandle,
  idx: number
): Promise<WindowStats> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      const result = native.getWindowResult(handle, idx);
      resolve(result as WindowStats);
    } catch (err) {
      reject(new Error(`Get window result failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Free window result resources
 * 
 * @param handle Window result handle to free
 * @throws Error if handle is invalid
 */
export async function freeWindowResult(handle: WindowResultHandle): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const native = loadNativeModule();
      native.freeWindowResult(handle);
      resolve();
    } catch (err) {
      reject(new Error(`Window result free failed: ${(err as Error).message}`));
    }
  });
}

/**
 * Helper: Auto-cleanup segment tree with callback pattern
 * 
 * Example:
 *   await withSegmentTree(prices, async (tree) => {
 *     const stats = await querySegmentTree(tree, 0, 10);
 *     // tree automatically freed after callback
 *   });
 */
export async function withSegmentTree<T>(
  prices: Float64Array,
  callback: (handle: SegmentTreeHandle) => Promise<T>
): Promise<T> {
  const handle = await buildSegmentTree(prices);
  try {
    return await callback(handle);
  } finally {
    await freeSegmentTree(handle);
  }
}

/**
 * Helper: Auto-cleanup window analysis with callback pattern
 */
export async function withSlidingWindow<T>(
  prices: Float64Array,
  windowSize: number,
  callback: (handle: WindowResultHandle) => Promise<T>
): Promise<T> {
  const handle = await analyzeSlidingWindow(prices, windowSize);
  try {
    return await callback(handle);
  } finally {
    await freeWindowResult(handle);
  }
}
