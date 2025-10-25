# Dynamic Stock Analyzer - Native Node.js Bindings

TypeScript/JavaScript bindings for high-performance C stock analysis algorithms via N-API.

## Prerequisites

### System Requirements
- Node.js >= 18.0.0
- Python (for node-gyp)
- C/C++ compiler:
  - **Linux**: GCC or Clang (`sudo apt-get install build-essential`)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- Make

### Compile C Modules First

The native bindings link against `libdsa.so` (or `libdsa.dylib` on macOS):

```bash
# From project root
cd c_modules
make clean && make
cd ../backend/native
```

Verify `c_modules/lib/libdsa.so` exists before proceeding.

## Installation

```bash
npm install
```

This automatically:
1. Builds C modules (`c_modules/lib/libdsa.so`)
2. Compiles N-API bindings (`build/Release/dsa_native.node`)
3. Transpiles TypeScript to `dist/`

### Manual Build

```bash
npm run build
```

Or step-by-step:
```bash
npm run build:c         # Compile C modules
npm run build:native    # Build N-API addon
npm run build:ts        # Transpile TypeScript
```

## Usage

### TypeScript

```typescript
import {
  calculateStockSpan,
  withSegmentTree,
  withSlidingWindow,
  type RangeStats,
  type WindowStats
} from 'dsa-native';

// Example 1: Stock Span
async function analyzeSpan(prices: number[]) {
  const priceArray = new Float64Array(prices);
  const spans = await calculateStockSpan(priceArray);
  
  console.log('Spans:', Array.from(spans));
}

// Example 2: Segment Tree (auto-cleanup)
async function analyzeRange(prices: number[], start: number, end: number) {
  const priceArray = new Float64Array(prices);
  
  await withSegmentTree(priceArray, async (tree) => {
    const stats: RangeStats = await querySegmentTree(tree, start, end);
    console.log(`Range [${start}, ${end}]:`, stats);
    // tree automatically freed after this block
  });
}

// Example 3: Sliding Window (auto-cleanup)
async function analyzeTrends(prices: number[], windowSize: number) {
  const priceArray = new Float64Array(prices);
  
  await withSlidingWindow(priceArray, windowSize, async (handle) => {
    const numWindows = prices.length - windowSize + 1;
    
    for (let i = 0; i < numWindows; i++) {
      const window: WindowStats = await getWindowResult(handle, i);
      console.log(`Window ${i}: ${window.pattern}, avg=${window.avg.toFixed(2)}`);
    }
    // handle automatically freed after this block
  });
}
```

### JavaScript (CommonJS)

```javascript
const {
  calculateStockSpan,
  withSegmentTree,
  querySegmentTree
} = require('dsa-native');

async function example() {
  const prices = new Float64Array([100, 102, 98, 105, 107, 103]);
  
  // Stock span
  const spans = await calculateStockSpan(prices);
  console.log('Spans:', Array.from(spans));
  
  // Segment tree query
  await withSegmentTree(prices, async (tree) => {
    const stats = await querySegmentTree(tree, 0, 5);
    console.log('Stats:', stats);
  });
}

example().catch(console.error);
```

## API Reference

### Stock Span

```typescript
async function calculateStockSpan(prices: Float64Array): Promise<Int32Array>
```

Calculates stock span for each price. Span is the number of consecutive days with price ≤ current day.

**Complexity**: O(n)  
**Throws**: Error if prices is empty or contains invalid values

---

### Segment Tree

#### Build Tree

```typescript
async function buildSegmentTree(prices: Float64Array): Promise<SegmentTreeHandle>
```

Builds segment tree for efficient range queries.

**Complexity**: O(n)  
**IMPORTANT**: Must call `freeSegmentTree()` or use `withSegmentTree()` to prevent memory leak

#### Query Range

```typescript
async function querySegmentTree(
  handle: SegmentTreeHandle,
  ql: number,  // Start index (inclusive)
  qr: number   // End index (inclusive)
): Promise<RangeStats>

interface RangeStats {
  min: number;
  max: number;
  avg: number;
  variance: number;
}
```

Query statistics for range [ql, qr].

**Complexity**: O(log n)  
**Throws**: Error if range invalid or handle is null

#### Free Tree

```typescript
async function freeSegmentTree(handle: SegmentTreeHandle): Promise<void>
```

Releases tree memory. Required to prevent leaks.

#### Auto-Cleanup Helper

```typescript
async function withSegmentTree<T>(
  prices: Float64Array,
  callback: (handle: SegmentTreeHandle) => Promise<T>
): Promise<T>
```

Automatically frees tree after callback completes (even if error thrown).

---

### Sliding Window

#### Analyze Windows

```typescript
async function analyzeSlidingWindow(
  prices: Float64Array,
  windowSize: number
): Promise<WindowResultHandle>
```

Analyzes all sliding windows of given size.

**Complexity**: O(n)  
**IMPORTANT**: Must call `freeWindowResult()` or use `withSlidingWindow()`

#### Get Window Stats

```typescript
async function getWindowResult(
  handle: WindowResultHandle,
  idx: number
): Promise<WindowStats>

interface WindowStats {
  max: number;
  min: number;
  avg: number;
  pattern: 'bullish' | 'bearish' | 'volatile' | 'stable';
}
```

Get statistics for window at index `idx`.

**Complexity**: O(1)  
**Throws**: Error if index out of bounds

#### Free Results

```typescript
async function freeWindowResult(handle: WindowResultHandle): Promise<void>
```

Releases window result memory.

#### Auto-Cleanup Helper

```typescript
async function withSlidingWindow<T>(
  prices: Float64Array,
  windowSize: number,
  callback: (handle: WindowResultHandle) => Promise<T>
): Promise<T>
```

Automatically frees results after callback.

---

## Memory Management

### Critical Rules

1. **Always free handles** returned by `buildSegmentTree()` and `analyzeSlidingWindow()`
2. **Prefer auto-cleanup helpers**: `withSegmentTree()`, `withSlidingWindow()`
3. **TypedArrays**: Input `Float64Array` is copied to C - safe to reuse after call

### Memory Leak Example (BAD)

```typescript
// ❌ BAD - Memory leak!
const tree = await buildSegmentTree(prices);
const stats = await querySegmentTree(tree, 0, 10);
// Forgot to call freeSegmentTree(tree)
```

### Correct Patterns (GOOD)

```typescript
// ✅ GOOD - Manual cleanup
const tree = await buildSegmentTree(prices);
try {
  const stats = await querySegmentTree(tree, 0, 10);
} finally {
  await freeSegmentTree(tree);
}

// ✅ BETTER - Auto cleanup
await withSegmentTree(prices, async (tree) => {
  const stats = await querySegmentTree(tree, 0, 10);
});
```

## Error Handling

All C errors are converted to JavaScript `Error` with descriptive messages:

```typescript
try {
  const spans = await calculateStockSpan(prices);
} catch (err) {
  console.error('Native error:', err.message);
  // Example: "C Module Error (code -2): Invalid array length"
}
```

### Error Codes (from C)

- `-1`: NULL pointer or invalid argument
- `-2`: Invalid length or parameter
- `-3`: Memory allocation failure
- `-4`: Invalid data (NaN, infinity)

## Environment Variables

### Optional: Custom Library Path

If `libdsa.so` is not in standard location:

**Linux:**
```bash
export LD_LIBRARY_PATH=/path/to/c_modules/lib:$LD_LIBRARY_PATH
node your-app.js
```

**macOS:**
```bash
export DYLD_LIBRARY_PATH=/path/to/c_modules/lib:$DYLD_LIBRARY_PATH
node your-app.js
```

### Build Configuration

```bash
# Use specific node-gyp Python version
export PYTHON=/usr/bin/python3

# Enable debug build
npm run build:native -- --debug

# Verbose output
npm run build:native -- --verbose
```

## Troubleshooting

### "Native DSA module not compiled"

**Solution**: Run build process

```bash
npm run rebuild
```

### "Cannot find module 'dsa_native.node'"

**Check**:
1. `build/Release/dsa_native.node` exists
2. Run `npm run build:native`

### "symbol lookup error: undefined symbol"

**Cause**: `libdsa.so` not found or incompatible

**Solution**:
```bash
# Verify C library exists
ls ../../c_modules/lib/libdsa.so

# Rebuild C modules
cd ../../c_modules && make clean && make && cd -

# Rebuild native addon
npm run build:native
```

### "node-gyp not found"

```bash
npm install -g node-gyp
# Or use local:
npx node-gyp rebuild
```

### Compilation Errors on macOS

**Xcode tools missing**:
```bash
xcode-select --install
```

**Python errors**:
```bash
# Install Python 3
brew install python3
export PYTHON=$(which python3)
```

### Segmentation Fault

**Likely causes**:
- Passing invalid handles (already freed)
- TypedArray buffer was garbage collected
- Invalid array indices

**Debug**:
```bash
# Run with core dump
node --abort-on-uncaught-exception your-app.js

# Or use lldb/gdb
lldb node
> run your-app.js
```

## Performance

### Benchmarks (1M prices)

| Operation | Time | Memory |
|-----------|------|--------|
| Stock Span | ~45ms | 8MB |
| Segment Tree Build | ~38ms | 16MB |
| Segment Tree Query | <1μs | - |
| Sliding Window (size=10) | ~180ms | 12MB |

### Optimization Tips

1. **Reuse handles**: Build tree once, query multiple times
2. **Batch queries**: Minimize JS ↔ C boundary crossings
3. **TypedArrays**: Always use `Float64Array` (avoid conversion overhead)
4. **Worker threads**: Parallelize independent analyses

## Testing

```bash
npm test
```

Requires CSV file with prices. See `c_modules/tests/README.md` for test data generation.

## Fallback Strategy

If native compilation fails in production:

```typescript
// Implement pure JS fallback
let nativeAvailable = false;

try {
  require('./build/Release/dsa_native.node');
  nativeAvailable = true;
} catch {
  console.warn('Native module unavailable, using JS fallback');
}

export const calculateStockSpan = nativeAvailable
  ? require('./dist/wrapper').calculateStockSpan
  : jsImplementation;
```

## License

See project LICENSE file.

## Support

- C module docs: `../../c_modules/README.md`
- Test harness: `../../c_modules/tests/README.md`
- Report issues with build output and system info (OS, Node version, compiler version)
