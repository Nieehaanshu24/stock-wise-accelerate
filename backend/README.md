# Dynamic Stock Analyzer - Backend Service

High-performance stock analysis REST API powered by native C modules.

## Features

- **Native C Performance**: Stock span, segment tree, and sliding window algorithms compiled to native code
- **Multiple Data Providers**: Yahoo Finance (free) and NSE India (requires API key)
- **File-based Caching**: Automatic caching with TTL to reduce API calls
- **Rate Limiting**: Protection against abuse (100 requests per 15 minutes per IP)
- **Input Validation**: Strict validation of symbols, dates, and parameters
- **Comprehensive Error Handling**: Clear error messages with status codes
- **TypeScript**: Full type safety across the stack

## Prerequisites

- Node.js >= 18.0.0
- Python 3 (for node-gyp)
- C/C++ compiler (GCC on Linux, Xcode Command Line Tools on macOS)
- Make

## Installation

### 1. Compile Native Modules

```bash
# Build C shared library
cd ../c_modules
make clean && make
cd ../backend

# Build Node native addon
cd native
npm install
npm run build
cd ..
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info

# Data Provider Configuration
DATA_PROVIDER=yahoo
# NSE_API_KEY=your_key_here  # Only if using NSE provider
# NSE_API_URL=https://api.nse.com

# Cache Configuration
CACHE_DIR=./cache
CACHE_TTL_MS=3600000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Running the Server

### Development Mode

```bash
npm run dev
```

Server runs on `http://localhost:3001` with auto-reload.

### Production Mode

```bash
npm run build
npm start
```

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 3600.5,
  "environment": "development"
}
```

---

### Stock Data Endpoints

#### Get Historical Data

```http
GET /api/stocks/:symbol/historical?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Parameters:**
- `symbol` (path): Stock symbol (e.g., AAPL, RELIANCE.NS)
- `startDate` (query): Start date in YYYY-MM-DD format
- `endDate` (query): End date in YYYY-MM-DD format

**Validation:**
- Symbol: 1-20 characters, alphanumeric with dots/hyphens
- Dates: Valid YYYY-MM-DD, not in future, max 10 year range

**Response:**
```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2024-01-01",
      "open": 150.0,
      "high": 152.0,
      "low": 149.0,
      "close": 151.5,
      "volume": 1000000
    }
  ],
  "source": "yahoo",
  "cached": false
}
```

**Errors:**
- `400`: Invalid parameters
- `503`: Data provider unavailable

---

#### Search Symbols

```http
GET /api/stocks/search?q=query
```

**Parameters:**
- `q` (query): Search query (1-20 characters)

**Response:**
```json
{
  "query": "AAPL",
  "results": ["AAPL", "AAPL.MX", "AAPLW"]
}
```

---

### Analysis Endpoints

#### Stock Span Analysis

```http
POST /api/analyze/span
Content-Type: application/json

{
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

**OR with direct prices:**

```json
{
  "prices": [100, 102, 98, 105, 107, 103]
}
```

**Response:**
```json
{
  "symbol": "AAPL",
  "spans": [1, 2, 1, 4, 5, 1],
  "processingTimeMs": 5
}
```

---

#### Range Query Analysis

```http
POST /api/analyze/range
Content-Type: application/json

{
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "ql": 0,
  "qr": 10
}
```

**Parameters:**
- `ql`: Query range start (0-based, inclusive)
- `qr`: Query range end (0-based, inclusive)

**Response:**
```json
{
  "symbol": "AAPL",
  "range": { "start": 0, "end": 10 },
  "stats": {
    "min": 149.5,
    "max": 155.2,
    "avg": 152.3,
    "variance": 3.2
  },
  "processingTimeMs": 2
}
```

---

#### Sliding Window Analysis

```http
POST /api/analyze/window
Content-Type: application/json

{
  "symbol": "AAPL",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "windowSize": 5
}
```

**Parameters:**
- `windowSize`: Window size (1-1000)

**Response:**
```json
{
  "symbol": "AAPL",
  "windowSize": 5,
  "windows": [
    {
      "index": 0,
      "max": 152.0,
      "min": 149.0,
      "avg": 150.5,
      "pattern": "bullish"
    }
  ],
  "processingTimeMs": 8
}
```

**Patterns:**
- `bullish`: Upward trend
- `bearish`: Downward trend
- `volatile`: High variance
- `stable`: Low variance

---

### Portfolio Endpoints

#### List Portfolios

```http
GET /api/portfolio
```

#### Get Portfolio

```http
GET /api/portfolio/:id
```

#### Create Portfolio

```http
POST /api/portfolio
Content-Type: application/json

{
  "name": "My Portfolio",
  "description": "Long-term investments"
}
```

#### Update Portfolio

```http
PUT /api/portfolio/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Portfolio

```http
DELETE /api/portfolio/:id
```

#### Add Holding

```http
POST /api/portfolio/:id/holdings
Content-Type: application/json

{
  "symbol": "AAPL",
  "quantity": 10,
  "averagePrice": 150.0
}
```

#### Remove Holding

```http
DELETE /api/portfolio/:id/holdings/:symbol
```

---

### Cache Management

#### Purge Cache

```http
POST /api/cache/purge
```

Removes all cached data.

#### Clean Expired Entries

```http
POST /api/cache/clean
```

Removes only expired cache entries.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error Type",
  "message": "Detailed error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### Common Error Codes

- `400`: Bad Request (validation failure)
- `404`: Not Found
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error
- `503`: Service Unavailable (data provider or native module unavailable)

---

## Data Providers

### Yahoo Finance (Default)

Free, no API key required. Supports global stocks.

**Symbols:**
- US stocks: `AAPL`, `GOOGL`, `MSFT`
- Indian stocks: `RELIANCE.NS`, `TCS.NS`

### NSE India

Requires API key. Set in `.env`:

```env
DATA_PROVIDER=nse
NSE_API_KEY=your_key_here
NSE_API_URL=https://api.nse.com
```

**Note**: NSE provider requires custom implementation based on your API subscription.

---

## Testing

### Run Tests

```bash
npm test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:coverage
```

**Important**: Tests use mocked data providers and native modules. No embedded market data.

---

## Docker Deployment

### Build Image

```bash
docker build -t dsa-backend -f backend/Dockerfile .
```

**Note**: Run from project root (not backend directory) as Dockerfile needs access to `c_modules`.

### Run Container

```bash
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATA_PROVIDER=yahoo \
  -e LOG_LEVEL=info \
  --name dsa-backend \
  dsa-backend
```

### With Environment File

```bash
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name dsa-backend \
  dsa-backend
```

### Health Check

```bash
curl http://localhost:3001/health
```

---

## Development Workflow

### 1. Make Changes

Edit files in `src/`

### 2. Run in Dev Mode

```bash
npm run dev
```

Changes auto-reload via `tsx watch`.

### 3. Lint Code

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### 4. Type Check

```bash
npm run typecheck
```

### 5. Run Tests

```bash
npm test
```

### 6. Build for Production

```bash
npm run build
```

---

## Performance Optimization

### 1. Native Module Performance

- Stock Span: O(n) - ~45ms for 1M prices
- Segment Tree: O(n) build, O(log n) query - ~38ms build
- Sliding Window: O(n) - ~180ms for 1M prices

### 2. Caching Strategy

- Historical data cached for 1 hour
- Cache automatically cleaned hourly
- File-based cache survives server restarts

### 3. Rate Limiting

- 100 requests per 15 minutes per IP
- Adjust in `.env`: `RATE_LIMIT_MAX_REQUESTS`

---

## Troubleshooting

### Native Module Not Available

**Error**: "Native DSA module not compiled"

**Solution**:
```bash
cd native
npm run rebuild
cd ..
npm run dev
```

### Data Provider Error

**Error**: "Failed to fetch data from Yahoo Finance"

**Causes**:
- Network connectivity issues
- Invalid symbol
- Yahoo Finance API changes

**Solution**:
- Check network connection
- Verify symbol format (e.g., `.NS` suffix for Indian stocks)
- Check Yahoo Finance service status

### Port Already in Use

**Error**: "EADDRINUSE"

**Solution**:
```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### Cache Errors

**Error**: "Failed to initialize cache directory"

**Solution**:
```bash
mkdir -p cache logs
chmod 755 cache logs
```

---

## Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express app entry
│   ├── types.ts               # TypeScript types
│   ├── routes/
│   │   ├── stocks.ts          # Stock data endpoints
│   │   ├── analyze.ts         # Analysis endpoints
│   │   ├── portfolio.ts       # Portfolio CRUD
│   │   └── cache.ts           # Cache management
│   ├── services/
│   │   ├── dataProvider.ts    # Data provider abstraction
│   │   └── analysisService.ts # Native module integration
│   ├── middleware/
│   │   ├── validation.ts      # Request validation
│   │   └── errorHandler.ts    # Global error handler
│   ├── cache/
│   │   └── fileCache.ts       # File-based cache
│   ├── utils/
│   │   └── logger.ts          # Winston logger
│   └── __tests__/
│       ├── setup.ts           # Jest configuration
│       └── *.test.ts          # Unit tests
├── native/                     # Native Node addon
├── Dockerfile                  # Production Docker image
├── package.json
├── tsconfig.json
└── README.md
```

---

## Security Considerations

1. **API Keys**: Never commit `.env` to version control
2. **Rate Limiting**: Protects against abuse
3. **Input Validation**: All inputs strictly validated
4. **Helmet.js**: Security headers enabled
5. **CORS**: Configure allowed origins in production

---

## License

See project LICENSE file.

## Support

For issues or questions:
1. Check logs: `logs/error.log` (production)
2. Review native module docs: `../native/README.md`
3. Review C module docs: `../c_modules/README.md`
4. Enable debug logging: `LOG_LEVEL=debug`
