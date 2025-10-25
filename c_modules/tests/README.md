# Dynamic Stock Analyzer - Test Suite

This directory contains test harness for validating the C modules. **No sample data is included** - you must provide your own price data files.

## Building Tests

```bash
cd c_modules
make test
```

This builds:
- `lib/libdsa.so` (or `libdsa.dylib` on macOS)
- `tests/harness` executable

## Running Tests

### 1. Prepare Price Data

Create a CSV file with stock prices. Format options:

**One price per line:**
```
100.50
102.30
99.80
103.10
...
```

**Comma-separated:**
```
100.50,102.30,99.80,103.10,105.20,...
```

**Tab-separated (TSV):**
```
100.50	102.30	99.80	103.10
```

### 2. Execute Test Harness

**Linux:**
```bash
LD_LIBRARY_PATH=./lib ./tests/harness prices.csv
```

**macOS:**
```bash
DYLD_LIBRARY_PATH=./lib ./tests/harness prices.csv
```

**Example with real data:**
```bash
# Download historical data (example using Yahoo Finance CSV)
# Or create synthetic data
echo "100,102,98,105,107,103,110,108" > test_prices.csv

LD_LIBRARY_PATH=./lib ./tests/harness test_prices.csv
```

## Test Coverage

The harness validates:

### Stock Span Algorithm
- All spans are positive
- Spans ≤ position + 1
- First 10 spans displayed for inspection

### Segment Tree
- Random range queries (50 tests for large datasets)
- Results verified against brute-force calculation
- Tests min, max, and average accuracy

### Sliding Window
- Window min ≤ avg ≤ max invariant
- All prices in window are within [min, max]
- Pattern classification (bullish/bearish/volatile/stable)
- First 5 windows displayed for inspection

## Getting Real Data

### Option 1: Download Historical Stock Data

```bash
# Using yfinance (Python)
pip install yfinance
python3 << EOF
import yfinance as yf
data = yf.download("AAPL", start="2024-01-01", end="2024-12-31")
data['Close'].to_csv('aapl_2024.csv', header=False, index=False)
EOF

./tests/harness aapl_2024.csv
```

### Option 2: Generate Synthetic Data

```bash
# Random walk generator
python3 << EOF
import random
price = 100.0
with open('synthetic.csv', 'w') as f:
    for _ in range(1000):
        price *= (1 + random.gauss(0, 0.02))  # 2% volatility
        f.write(f"{price:.2f}\n")
EOF

./tests/harness synthetic.csv
```

### Option 3: Use CSV from APIs

Many financial APIs provide CSV exports:
- Alpha Vantage: https://www.alphavantage.co/
- IEX Cloud: https://iexcloud.io/
- Quandl: https://www.quandl.com/

## Interpreting Results

### Success Output
```
Dynamic Stock Analyzer - Test Harness
======================================
Loaded 250 prices from aapl_2024.csv
Price range: 150.23 - 195.71

=== Testing Stock Span Algorithm ===
First 10 spans: 1 2 1 2 5 1 2 3 4 1 
✓ Stock span validation passed

=== Testing Segment Tree ===
✓ Segment tree validation passed (50 random queries)

=== Testing Sliding Window ===
Number of windows: 241 (window size: 10)

First 5 windows:
  Window 0: min=150.23, max=155.42, avg=152.81, pattern=bullish
  Window 1: min=151.10, max=156.03, avg=153.45, pattern=stable
  ...
✓ Sliding window validation passed

======================================
✓ ALL TESTS PASSED
```

### Failure Cases

Tests will report specific errors:
- **Invalid span**: Span value exceeds valid range
- **Query mismatch**: Segment tree result doesn't match brute-force
- **Window bounds**: Prices fall outside computed min/max

## Performance Testing

For performance benchmarks, create larger datasets:

```bash
# Generate 1M prices
python3 -c "import random; print('\n'.join(str(100*random.random()+50) for _ in range(1000000)))" > large.csv

time ./tests/harness large.csv
```

Expected performance:
- Stock span: O(n) - should process 1M prices in <1 second
- Segment tree build: O(n) - should build in <1 second
- Segment tree queries: O(log n) - 50 queries in <1ms total
- Sliding window: O(n) - should process 1M prices in <2 seconds

## Integration with Node.js

Once validated, integrate with Node via N-API:

```javascript
// After building native module
const dsa = require('./build/Release/dsa.node');

const prices = new Float64Array([100, 102, 98, 105, 107]);
const spans = dsa.calculateStockSpan(prices);
console.log(spans); // [1, 2, 1, 4, 5]
```

See `src/native_bindings.c` for N-API implementation notes.

## Troubleshooting

**Error: "Cannot open file"**
- Check file path is correct
- Ensure CSV file exists and is readable

**Error: "No valid prices found"**
- Verify CSV format (see examples above)
- Check for non-numeric values
- Ensure prices are positive

**Segmentation fault**
- Likely invalid input data (NaN, infinity)
- Run with valgrind: `valgrind ./tests/harness prices.csv`

**Library not found**
- Ensure LD_LIBRARY_PATH (Linux) or DYLD_LIBRARY_PATH (macOS) is set
- Or install library: `make install`

## Additional Resources

- Algorithm documentation: See header files in `include/`
- Build options: Run `make help`
- Memory debugging: Use valgrind or Address Sanitizer
- Thread safety: Refer to header comments for locking requirements
