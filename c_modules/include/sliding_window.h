#ifndef SLIDING_WINDOW_H
#define SLIDING_WINDOW_H

#include <stddef.h>

/**
 * Analyze price data using sliding windows to detect patterns.
 * 
 * Computes min, max, average, and pattern classification for each window
 * position in the array. Uses deque-based algorithm for O(n) total time.
 * 
 * Algorithm: Monotonic deque for min/max in O(1) amortized per window.
 * Space complexity: O(n) for results + O(windowSize) for deques.
 * 
 * Memory ownership: Allocates result structure. Caller MUST call
 * freeWindowResult() to release. Handle is opaque.
 * 
 * Thread-safety: NOT thread-safe. Each analysis creates independent handle.
 * Multiple threads can hold different handles safely.
 * 
 * @param prices Input array of stock prices (must not be NULL)
 * @param length Number of elements (must be >= windowSize)
 * @param windowSize Size of sliding window (must be > 0 and <= length)
 * @param out_window_result_handle Output pointer for result handle (must not be NULL)
 * @param err_buf Buffer for error messages (can be NULL)
 * @param err_buf_len Size of error buffer
 * 
 * @return 0 on success, non-zero on failure:
 *   -1: NULL pointer argument
 *   -2: Invalid length or window size
 *   -3: Memory allocation failure
 *   -4: Invalid price value
 * 
 * Example usage:
 *   void *result = NULL;
 *   char err[256];
 *   if (analyzeSlidingWindow(prices, 100, 10, &result, err, sizeof(err)) == 0) {
 *       for (size_t i = 0; i < 91; i++) {  // 100 - 10 + 1 windows
 *           double max, min, avg;
 *           char pattern[64];
 *           getWindowResult(result, i, &max, &min, &avg, pattern, 64, err, sizeof(err));
 *       }
 *       freeWindowResult(result);
 *   }
 */
int analyzeSlidingWindow(const double *prices, size_t length, size_t windowSize,
                         void **out_window_result_handle, char *err_buf, size_t err_buf_len);

/**
 * Get results for a specific window position.
 * 
 * Time complexity: O(1)
 * Thread-safety: NOT thread-safe if same handle accessed concurrently.
 * 
 * Patterns detected:
 *   - "bullish": Upward trend (last > first by threshold)
 *   - "bearish": Downward trend (last < first by threshold)
 *   - "volatile": High variance relative to mean
 *   - "stable": Low variance, minimal change
 * 
 * @param window_handle Result handle from analyzeSlidingWindow (must not be NULL)
 * @param idx Window index (0 to num_windows-1)
 * @param out_max Pointer to receive max value (can be NULL)
 * @param out_min Pointer to receive min value (can be NULL)
 * @param out_avg Pointer to receive average (can be NULL)
 * @param out_pattern Buffer to receive pattern string (can be NULL)
 * @param out_pattern_len Size of pattern buffer
 * @param err_buf Buffer for error messages (can be NULL)
 * @param err_len Size of error buffer
 * 
 * @return 0 on success, non-zero on failure:
 *   -1: NULL handle
 *   -2: Index out of bounds
 */
int getWindowResult(void *window_handle, size_t idx,
                    double *out_max, double *out_min, double *out_avg,
                    char *out_pattern, size_t out_pattern_len,
                    char *err_buf, size_t err_len);

/**
 * Free sliding window result resources.
 * 
 * Thread-safety: NOT thread-safe. Ensure no getWindowResult calls active.
 * Safe to call with NULL handle.
 * 
 * @param window_handle Handle to free
 */
void freeWindowResult(void *window_handle);

#endif // SLIDING_WINDOW_H
