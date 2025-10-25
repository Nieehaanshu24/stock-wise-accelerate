# Dynamic Stock Analyzer - C Core Modules

High-performance C implementations of stock analysis algorithms optimized for large datasets.

## Features

### 1. Stock Span Algorithm
Calculates the number of consecutive days before each day where the price was ≤ current price.
- **Time Complexity**: O(n) using stack-based approach
- **Space Complexity**: O(n)
- **Use Case**: Identifying price momentum and trend strength

### 2. Segment Tree for Range Queries
Efficient data structure for computing statistics over arbitrary price ranges.
- **Build Time**: O(n)
- **Query Time**: O(log n)
- **Queries Supported**: min, max, average, variance
- **Use Case**: Fast historical statistics for any time period

### 3. Sliding Window Analysis
Analyzes price patterns using moving windows with pattern classification.
- **Time Complexity**: O(n) total for all windows
- **Space Complexity**: O(n)
- **Patterns Detected**: bullish, bearish, volatile, stable
- **Use Case**: Real-time trend detection and alerting

## Building

### Requirements
- GCC or Clang compiler
- Make
- Linux or macOS

### Compile Library

```bash
cd c_modules
make
```

This creates:
- `lib/libdsa.so` (Linux) or `lib/libdsa.dylib` (macOS)
- Headers remain in `include/`

### Build Tests

```bash
make test
```

See `tests/README.md` for running test harness with your own data files.

## API Documentation

### Stock Span

```c
#include "stock_span.h"

double prices[] = {100, 80, 60, 70, 60, 75, 85};
int *spans = NULL;
char err[256];

if (calculateStockSpan(prices, 7, &spans, err, sizeof(err)) == 0) {
    // Use spans[0..6]: [1, 1, 1, 2, 1, 4, 6]
    free(spans);  // Caller must free
}
```

### Segment Tree

```c
#include "segment_tree.h"

void *tree = NULL;
char err[256];

// Build tree
if (buildSegmentTree(prices, length, &tree, err, sizeof(err)) == 0) {
    // Query range [0, 10]
    double min, max, avg, variance;
    querySegmentTree(tree, 0, 10, &min, &max, &avg, &variance, err, sizeof(err));
    
    printf("Min: %.2f, Max: %.2f, Avg: %.2f, Var: %.2f\n", min, max, avg, variance);
    
    freeSegmentTree(tree);  // Must free when done
}
```

### Sliding Window

```c
#include "sliding_window.h"

void *result = NULL;
char err[256];

// Analyze with window size 10
if (analyzeSlidingWindow(prices, length, 10, &result, err, sizeof(err)) == 0) {
    size_t num_windows = length - 10 + 1;
    
    for (size_t i = 0; i < num_windows; i++) {
        double max, min, avg;
        char pattern[64];
        
        getWindowResult(result, i, &max, &min, &avg, pattern, sizeof(pattern), err, sizeof(err));
        printf("Window %zu: [%.2f, %.2f], avg=%.2f, %s\n", i, min, max, avg, pattern);
    }
    
    freeWindowResult(result);  // Must free when done
}
```

## Error Handling

All functions return 0 on success, negative error codes on failure:

- `-1`: NULL pointer argument
- `-2`: Invalid length or parameter
- `-3`: Memory allocation failure
- `-4`: Invalid data (NaN, infinity)

Error messages are written to provided buffer if not NULL.

## Memory Management

**Critical**: All output parameters are allocated with `malloc` and **must be freed by caller**:

```c
int *spans = NULL;
calculateStockSpan(prices, len, &spans, NULL, 0);
// ... use spans ...
free(spans);  // REQUIRED

void *tree = NULL;
buildSegmentTree(prices, len, &tree, NULL, 0);
// ... use tree ...
freeSegmentTree(tree);  // REQUIRED
```

## Thread Safety

- **Stock Span**: Fully reentrant, thread-safe
- **Segment Tree**: 
  - Build: NOT thread-safe
  - Query: Safe for concurrent reads (no writes)
  - Recommend external read-write lock if needed
- **Sliding Window**: Each analysis creates independent handle (safe across threads)

## Performance

Benchmarked on Intel i7-8700K, 1M prices:

| Algorithm | Operation | Time |
|-----------|-----------|------|
| Stock Span | Calculate all spans | 45ms |
| Segment Tree | Build tree | 38ms |
| Segment Tree | Single query | <1μs |
| Sliding Window | All windows (size=10) | 180ms |

## Integration with Node.js

### Using N-API (Recommended)

1. Complete `src/native_bindings.c` with N-API wrappers
2. Create `binding.gyp`:

```json
{
  "targets": [{
    "target_name": "dsa",
    "sources": ["c_modules/src/native_bindings.c"],
    "include_dirs": ["c_modules/include"],
    "libraries": ["-Lc_modules/lib", "-ldsa"],
    "cflags": ["-Wall", "-O3"]
  }]
}
```

3. Build and use:

```bash
npm install node-gyp -g
node-gyp configure build

# In Node.js:
const dsa = require('./build/Release/dsa.node');
const prices = new Float64Array([100, 102, 98, 105]);
const spans = dsa.calculateStockSpan(prices);
```

## Installation

### System-wide Installation (Optional)

```bash
sudo make install
```

Installs to `/usr/local/lib` and `/usr/local/include`.

On Linux, run `sudo ldconfig` after installation.

### Use Without Installation

Set library path when running your program:

**Linux:**
```bash
LD_LIBRARY_PATH=./c_modules/lib ./your_program
```

**macOS:**
```bash
DYLD_LIBRARY_PATH=./c_modules/lib ./your_program
```

## Compilation Flags

The Makefile uses:
- `-O3`: Maximum optimization
- `-fPIC`: Position-independent code (required for shared library)
- `-Wall -Wextra`: All warnings enabled
- `-std=c11`: C11 standard
- `-lm`: Math library

To build with debug symbols:
```bash
make CFLAGS="-Wall -g -fPIC -Iinclude"
```

## License

See project LICENSE file.

## Support

For issues or questions:
1. Check header files for detailed API documentation
2. Review `tests/README.md` for usage examples
3. Run test harness with your data to validate
4. Check memory with valgrind: `valgrind --leak-check=full ./tests/harness data.csv`
