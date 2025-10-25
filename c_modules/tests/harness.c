/**
 * Test harness for Dynamic Stock Analyzer C modules.
 * 
 * This harness reads price data from CSV/TSV files and validates all three algorithms.
 * NO HARDCODED DATA - all inputs must be provided via files.
 * 
 * Usage:
 *   ./harness <prices.csv>
 * 
 * CSV Format (one price per line or comma-separated):
 *   100.5
 *   102.3
 *   99.8
 *   ...
 * 
 * Or:
 *   100.5,102.3,99.8,103.1,...
 * 
 * Validation checks:
 *   - Stock span: Verify spans are positive and <= position+1
 *   - Segment tree: Verify query results match brute-force calculations
 *   - Sliding window: Verify min/max/avg are within bounds of input
 */

#include "stock_span.h"
#include "segment_tree.h"
#include "sliding_window.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#define MAX_PRICES 1000000
#define BUFFER_SIZE 4096

// Read prices from CSV file
static size_t readPricesFromFile(const char *filename, double **out_prices) {
    FILE *fp = fopen(filename, "r");
    if (!fp) {
        fprintf(stderr, "ERROR: Cannot open file: %s\n", filename);
        return 0;
    }
    
    double *prices = malloc(MAX_PRICES * sizeof(double));
    if (!prices) {
        fprintf(stderr, "ERROR: Memory allocation failed\n");
        fclose(fp);
        return 0;
    }
    
    size_t count = 0;
    char buffer[BUFFER_SIZE];
    
    while (fgets(buffer, BUFFER_SIZE, fp) && count < MAX_PRICES) {
        char *token = strtok(buffer, ",\n\r\t ");
        while (token && count < MAX_PRICES) {
            double price = atof(token);
            if (price > 0.0) {  // Basic validation
                prices[count++] = price;
            }
            token = strtok(NULL, ",\n\r\t ");
        }
    }
    
    fclose(fp);
    
    if (count == 0) {
        fprintf(stderr, "ERROR: No valid prices found in file\n");
        free(prices);
        return 0;
    }
    
    *out_prices = prices;
    return count;
}

// Brute-force min/max/avg for validation
static void bruteForceRange(const double *prices, size_t start, size_t end,
                           double *min, double *max, double *avg) {
    *min = prices[start];
    *max = prices[start];
    double sum = prices[start];
    
    for (size_t i = start + 1; i <= end; i++) {
        if (prices[i] < *min) *min = prices[i];
        if (prices[i] > *max) *max = prices[i];
        sum += prices[i];
    }
    
    *avg = sum / (end - start + 1);
}

// Test stock span algorithm
static int testStockSpan(const double *prices, size_t length) {
    printf("\n=== Testing Stock Span Algorithm ===\n");
    
    int *spans = NULL;
    char err[256];
    
    int result = calculateStockSpan(prices, length, &spans, err, sizeof(err));
    if (result != 0) {
        fprintf(stderr, "ERROR: calculateStockSpan failed: %s\n", err);
        return -1;
    }
    
    printf("First 10 spans: ");
    for (size_t i = 0; i < 10 && i < length; i++) {
        printf("%d ", spans[i]);
    }
    printf("\n");
    
    // Validate spans
    int errors = 0;
    for (size_t i = 0; i < length; i++) {
        if (spans[i] < 1 || spans[i] > (int)(i + 1)) {
            fprintf(stderr, "ERROR: Invalid span at position %zu: %d\n", i, spans[i]);
            errors++;
            if (errors > 5) break;  // Limit error output
        }
    }
    
    free(spans);
    
    if (errors == 0) {
        printf("✓ Stock span validation passed\n");
        return 0;
    } else {
        printf("✗ Stock span validation failed\n");
        return -1;
    }
}

// Test segment tree
static int testSegmentTree(const double *prices, size_t length) {
    printf("\n=== Testing Segment Tree ===\n");
    
    void *tree = NULL;
    char err[256];
    
    int result = buildSegmentTree(prices, length, &tree, err, sizeof(err));
    if (result != 0) {
        fprintf(stderr, "ERROR: buildSegmentTree failed: %s\n", err);
        return -1;
    }
    
    // Test a few queries
    int errors = 0;
    size_t num_tests = length < 100 ? 10 : 50;
    
    for (size_t test = 0; test < num_tests; test++) {
        size_t ql = rand() % length;
        size_t qr = ql + (rand() % (length - ql));
        
        double tree_min, tree_max, tree_avg;
        result = querySegmentTree(tree, ql, qr, &tree_min, &tree_max, &tree_avg, NULL, err, sizeof(err));
        
        if (result != 0) {
            fprintf(stderr, "ERROR: querySegmentTree failed: %s\n", err);
            errors++;
            continue;
        }
        
        // Validate against brute force
        double bf_min, bf_max, bf_avg;
        bruteForceRange(prices, ql, qr, &bf_min, &bf_max, &bf_avg);
        
        if (fabs(tree_min - bf_min) > 1e-9 || fabs(tree_max - bf_max) > 1e-9 || 
            fabs(tree_avg - bf_avg) > 1e-6) {
            fprintf(stderr, "ERROR: Query [%zu, %zu] mismatch\n", ql, qr);
            fprintf(stderr, "  Tree: min=%.2f, max=%.2f, avg=%.2f\n", tree_min, tree_max, tree_avg);
            fprintf(stderr, "  Expected: min=%.2f, max=%.2f, avg=%.2f\n", bf_min, bf_max, bf_avg);
            errors++;
            if (errors > 5) break;
        }
    }
    
    freeSegmentTree(tree);
    
    if (errors == 0) {
        printf("✓ Segment tree validation passed (%zu random queries)\n", num_tests);
        return 0;
    } else {
        printf("✗ Segment tree validation failed\n");
        return -1;
    }
}

// Test sliding window
static int testSlidingWindow(const double *prices, size_t length) {
    printf("\n=== Testing Sliding Window ===\n");
    
    size_t window_size = length < 20 ? length / 2 : 10;
    void *result = NULL;
    char err[256];
    
    int status = analyzeSlidingWindow(prices, length, window_size, &result, err, sizeof(err));
    if (status != 0) {
        fprintf(stderr, "ERROR: analyzeSlidingWindow failed: %s\n", err);
        return -1;
    }
    
    size_t num_windows = length - window_size + 1;
    printf("Number of windows: %zu (window size: %zu)\n", num_windows, window_size);
    
    // Print first few results
    printf("\nFirst 5 windows:\n");
    for (size_t i = 0; i < 5 && i < num_windows; i++) {
        double max, min, avg;
        char pattern[64];
        
        getWindowResult(result, i, &max, &min, &avg, pattern, sizeof(pattern), err, sizeof(err));
        printf("  Window %zu: min=%.2f, max=%.2f, avg=%.2f, pattern=%s\n",
               i, min, max, avg, pattern);
    }
    
    // Validate a few windows
    int errors = 0;
    for (size_t i = 0; i < 10 && i < num_windows; i++) {
        double max, min, avg;
        getWindowResult(result, i, &max, &min, &avg, NULL, 0, NULL, 0);
        
        // Check invariants: min <= avg <= max
        if (min > avg || avg > max) {
            fprintf(stderr, "ERROR: Invalid window %zu: min=%.2f, avg=%.2f, max=%.2f\n",
                   i, min, avg, max);
            errors++;
        }
        
        // Check bounds against actual window
        for (size_t j = 0; j < window_size; j++) {
            double price = prices[i + j];
            if (price < min - 1e-9 || price > max + 1e-9) {
                fprintf(stderr, "ERROR: Window %zu price out of bounds\n", i);
                errors++;
                break;
            }
        }
    }
    
    freeWindowResult(result);
    
    if (errors == 0) {
        printf("✓ Sliding window validation passed\n");
        return 0;
    } else {
        printf("✗ Sliding window validation failed\n");
        return -1;
    }
}

int main(int argc, char *argv[]) {
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <prices.csv>\n", argv[0]);
        fprintf(stderr, "\nCSV format: one price per line or comma-separated\n");
        fprintf(stderr, "Example: 100.5,102.3,99.8,103.1\n");
        return 1;
    }
    
    printf("Dynamic Stock Analyzer - Test Harness\n");
    printf("======================================\n");
    
    // Read prices from file
    double *prices = NULL;
    size_t length = readPricesFromFile(argv[1], &prices);
    
    if (length == 0) {
        return 1;
    }
    
    printf("Loaded %zu prices from %s\n", length, argv[1]);
    printf("Price range: %.2f - %.2f\n", prices[0], prices[length-1]);
    
    // Run tests
    int failures = 0;
    
    if (testStockSpan(prices, length) != 0) failures++;
    if (testSegmentTree(prices, length) != 0) failures++;
    if (testSlidingWindow(prices, length) != 0) failures++;
    
    free(prices);
    
    printf("\n======================================\n");
    if (failures == 0) {
        printf("✓ ALL TESTS PASSED\n");
        return 0;
    } else {
        printf("✗ %d TEST(S) FAILED\n", failures);
        return 1;
    }
}
