#include "segment_tree.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <math.h>
#include <float.h>

#define MAX_ARRAY_SIZE 10000000

// Node stores aggregate statistics for a range
typedef struct {
    double min;
    double max;
    double sum;      // For average calculation
    double sum_sq;   // For variance calculation
    size_t count;
} TreeNode;

typedef struct {
    TreeNode *nodes;
    size_t length;      // Original array length
    size_t tree_size;   // Total nodes in tree (2 * length)
} SegmentTree;

static void setError(char *err_buf, size_t err_buf_len, const char *msg) {
    if (err_buf && err_buf_len > 0) {
        strncpy(err_buf, msg, err_buf_len - 1);
        err_buf[err_buf_len - 1] = '\0';
    }
}

// Merge two nodes' statistics
static TreeNode mergeNodes(const TreeNode *left, const TreeNode *right) {
    TreeNode result;
    result.min = (left->min < right->min) ? left->min : right->min;
    result.max = (left->max > right->max) ? left->max : right->max;
    result.sum = left->sum + right->sum;
    result.sum_sq = left->sum_sq + right->sum_sq;
    result.count = left->count + right->count;
    return result;
}

int buildSegmentTree(const double *prices, size_t length, void **out_tree_handle,
                     char *err_buf, size_t err_buf_len) {
    // Validate inputs
    if (!prices || !out_tree_handle) {
        setError(err_buf, err_buf_len, "NULL pointer argument");
        return -1;
    }
    
    if (length == 0 || length > MAX_ARRAY_SIZE) {
        setError(err_buf, err_buf_len, "Invalid array length");
        return -2;
    }
    
    // Validate prices
    for (size_t i = 0; i < length; i++) {
        if (isnan(prices[i]) || isinf(prices[i])) {
            setError(err_buf, err_buf_len, "Invalid price value");
            return -4;
        }
    }
    
    // Allocate tree structure
    SegmentTree *tree = malloc(sizeof(SegmentTree));
    if (!tree) {
        setError(err_buf, err_buf_len, "Memory allocation failed");
        return -3;
    }
    
    tree->length = length;
    tree->tree_size = 2 * length;  // Bottom-up tree uses 2n nodes
    
    tree->nodes = malloc(tree->tree_size * sizeof(TreeNode));
    if (!tree->nodes) {
        free(tree);
        setError(err_buf, err_buf_len, "Memory allocation failed for tree nodes");
        return -3;
    }
    
    // Build tree bottom-up: O(n) construction
    // Leaf nodes start at index 'length'
    for (size_t i = 0; i < length; i++) {
        size_t idx = length + i;
        tree->nodes[idx].min = prices[i];
        tree->nodes[idx].max = prices[i];
        tree->nodes[idx].sum = prices[i];
        tree->nodes[idx].sum_sq = prices[i] * prices[i];
        tree->nodes[idx].count = 1;
    }
    
    // Build internal nodes by merging children
    for (size_t i = length - 1; i > 0; i--) {
        tree->nodes[i] = mergeNodes(&tree->nodes[2*i], &tree->nodes[2*i + 1]);
    }
    
    *out_tree_handle = tree;
    return 0;
}

int querySegmentTree(void *tree_handle, size_t ql, size_t qr,
                     double *out_min, double *out_max, double *out_avg,
                     double *out_variance, char *err_buf, size_t err_buf_len) {
    if (!tree_handle) {
        setError(err_buf, err_buf_len, "NULL tree handle");
        return -1;
    }
    
    SegmentTree *tree = (SegmentTree*)tree_handle;
    
    // Validate query range
    if (ql > qr || qr >= tree->length) {
        setError(err_buf, err_buf_len, "Invalid query range");
        return -2;
    }
    
    // Adjust to leaf positions
    size_t left = ql + tree->length;
    size_t right = qr + tree->length;
    
    // Initialize accumulator
    TreeNode result;
    result.min = DBL_MAX;
    result.max = -DBL_MAX;
    result.sum = 0.0;
    result.sum_sq = 0.0;
    result.count = 0;
    
    int first = 1;
    
    // Query using bottom-up traversal - O(log n)
    while (left <= right) {
        // If left is odd (right child), include it
        if (left % 2 == 1) {
            if (first) {
                result = tree->nodes[left];
                first = 0;
            } else {
                result = mergeNodes(&result, &tree->nodes[left]);
            }
            left++;
        }
        
        // If right is even (left child), include it
        if (right % 2 == 0) {
            if (first) {
                result = tree->nodes[right];
                first = 0;
            } else {
                result = mergeNodes(&result, &tree->nodes[right]);
            }
            right--;
        }
        
        left /= 2;
        right /= 2;
    }
    
    // Compute outputs
    if (out_min) *out_min = result.min;
    if (out_max) *out_max = result.max;
    
    if (out_avg) {
        *out_avg = result.count > 0 ? result.sum / result.count : 0.0;
    }
    
    if (out_variance && result.count > 0) {
        double mean = result.sum / result.count;
        // Variance = E[X²] - (E[X])²
        *out_variance = (result.sum_sq / result.count) - (mean * mean);
    } else if (out_variance) {
        *out_variance = 0.0;
    }
    
    return 0;
}

void freeSegmentTree(void *tree_handle) {
    if (tree_handle) {
        SegmentTree *tree = (SegmentTree*)tree_handle;
        free(tree->nodes);
        free(tree);
    }
}
