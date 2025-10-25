/**
 * Dynamic Stock Analyzer - Native Module Exports
 * 
 * High-performance C-based stock analysis algorithms exposed to TypeScript.
 * 
 * @module dsa-native
 */

export {
  // Core functions
  calculateStockSpan,
  buildSegmentTree,
  querySegmentTree,
  freeSegmentTree,
  analyzeSlidingWindow,
  getWindowResult,
  freeWindowResult,
  
  // Helper functions with auto-cleanup
  withSegmentTree,
  withSlidingWindow,
  
  // Types
  type SegmentTreeHandle,
  type WindowResultHandle,
  type RangeStats,
  type WindowStats,
} from './wrapper';

/**
 * Example usage (type annotations only - no runtime data):
 * 
 * ```typescript
 * import { calculateStockSpan, withSegmentTree, withSlidingWindow } from './native';
 * 
 * // Stock span
 * const prices = new Float64Array([...]); // Your price data
 * const spans = await calculateStockSpan(prices);
 * 
 * // Segment tree with auto-cleanup
 * await withSegmentTree(prices, async (tree) => {
 *   const stats = await querySegmentTree(tree, 0, 10);
 *   console.log(`Range [0,10]: min=${stats.min}, max=${stats.max}`);
 * });
 * 
 * // Sliding window with auto-cleanup
 * await withSlidingWindow(prices, 10, async (windowHandle) => {
 *   for (let i = 0; i < numWindows; i++) {
 *     const window = await getWindowResult(windowHandle, i);
 *     console.log(`Window ${i}: ${window.pattern}, avg=${window.avg}`);
 *   }
 * });
 * ```
 */
