#ifndef STOCK_SPAN_H
#define STOCK_SPAN_H

#include <stddef.h>

/**
 * Calculate stock span for each day in the price array.
 * 
 * Stock span is the number of consecutive days before day i (including day i)
 * where the price was less than or equal to the price on day i.
 * 
 * Algorithm: Uses stack-based approach for O(n) time complexity.
 * Space complexity: O(n) for output array and internal stack.
 * 
 * Memory ownership: Allocates *out_spans with malloc. Caller MUST free it.
 * Thread-safety: Reentrant (uses only local stack). Safe to call from multiple threads.
 * 
 * @param prices Input array of stock prices (must not be NULL)
 * @param length Number of elements in prices array (must be > 0)
 * @param out_spans Output pointer to receive allocated span array (must not be NULL)
 * @param err_buf Buffer for error messages (can be NULL)
 * @param err_buf_len Size of error buffer
 * 
 * @return 0 on success, non-zero error code on failure:
 *   -1: NULL pointer argument
 *   -2: Invalid length (0 or too large)
 *   -3: Memory allocation failure
 *   -4: Invalid price value (NaN or infinite)
 * 
 * Example usage:
 *   double prices[] = {100, 80, 60, 70, 60, 75, 85};
 *   int *spans = NULL;
 *   char err[256];
 *   if (calculateStockSpan(prices, 7, &spans, err, sizeof(err)) == 0) {
 *       // Use spans[0..6]
 *       free(spans);
 *   }
 */
int calculateStockSpan(const double *prices, size_t length, int **out_spans, 
                       char *err_buf, size_t err_buf_len);

#endif // STOCK_SPAN_H
