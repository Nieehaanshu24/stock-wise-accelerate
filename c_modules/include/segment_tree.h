#ifndef SEGMENT_TREE_H
#define SEGMENT_TREE_H

#include <stddef.h>

/**
 * Build a segment tree for efficient range queries on price data.
 * 
 * Segment tree supports O(log n) queries for min, max, average, and variance
 * over any subrange of the input array.
 * 
 * Algorithm: Bottom-up segment tree construction in O(n) time.
 * Space complexity: O(n) - tree uses 2*n nodes for n leaf elements.
 * 
 * Memory ownership: Allocates internal tree structure. Caller MUST call
 * freeSegmentTree() to release memory. Handle is opaque.
 * 
 * Thread-safety: NOT thread-safe. Tree handle can be shared by multiple
 * query threads ONLY if protected by external read lock. Do not modify
 * during queries.
 * 
 * @param prices Input array of stock prices (must not be NULL)
 * @param length Number of elements (must be > 0)
 * @param out_tree_handle Output pointer to receive tree handle (must not be NULL)
 * @param err_buf Buffer for error messages (can be NULL)
 * @param err_buf_len Size of error buffer
 * 
 * @return 0 on success, non-zero on failure:
 *   -1: NULL pointer argument
 *   -2: Invalid length
 *   -3: Memory allocation failure
 *   -4: Invalid price value
 * 
 * Example usage:
 *   void *tree = NULL;
 *   char err[256];
 *   if (buildSegmentTree(prices, len, &tree, err, sizeof(err)) == 0) {
 *       double min, max, avg, var;
 *       querySegmentTree(tree, 0, 10, &min, &max, &avg, &var, err, sizeof(err));
 *       freeSegmentTree(tree);
 *   }
 */
int buildSegmentTree(const double *prices, size_t length, void **out_tree_handle,
                     char *err_buf, size_t err_buf_len);

/**
 * Query segment tree for range statistics.
 * 
 * Time complexity: O(log n)
 * Thread-safety: Safe for concurrent queries if tree is not being modified.
 * 
 * @param tree_handle Tree handle from buildSegmentTree (must not be NULL)
 * @param ql Query range start (inclusive, 0-based)
 * @param qr Query range end (inclusive, 0-based)
 * @param out_min Pointer to receive minimum value (can be NULL)
 * @param out_max Pointer to receive maximum value (can be NULL)
 * @param out_avg Pointer to receive average value (can be NULL)
 * @param out_variance Pointer to receive variance (can be NULL)
 * @param err_buf Buffer for error messages (can be NULL)
 * @param err_buf_len Size of error buffer
 * 
 * @return 0 on success, non-zero on failure:
 *   -1: NULL tree handle
 *   -2: Invalid query range (ql > qr or out of bounds)
 * 
 * Example:
 *   double min, max, avg, var;
 *   querySegmentTree(tree, 5, 15, &min, &max, &avg, &var, NULL, 0);
 */
int querySegmentTree(void *tree_handle, size_t ql, size_t qr,
                     double *out_min, double *out_max, double *out_avg,
                     double *out_variance, char *err_buf, size_t err_buf_len);

/**
 * Free segment tree resources.
 * 
 * Thread-safety: NOT thread-safe. Ensure no queries are active.
 * Safe to call with NULL handle.
 * 
 * @param tree_handle Tree handle to free
 */
void freeSegmentTree(void *tree_handle);

#endif // SEGMENT_TREE_H
