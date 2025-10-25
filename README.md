# Dynamic Stock Analyzer

High-performance stock analysis application combining native C algorithms with modern web technologies for real-time market analysis.

## Features

### 🚀 Native Performance
- **Stock Span Analysis**: O(n) stack-based algorithm for momentum tracking
- **Segment Tree Queries**: O(log n) range statistics (min/max/avg/variance)
- **Sliding Window Analysis**: O(n) pattern detection (bullish/bearish/volatile/stable)

### 📊 Analysis Capabilities
- Historical stock data from Yahoo Finance
- Multiple time ranges (1M, 3M, 6M, 1Y, custom)
- Real-time processing metrics
- Interactive chart visualizations

### 💼 Portfolio Management
- Create and manage multiple portfolios
- Track holdings with cost basis
- CSV import/export for backup
- Batch analysis across all holdings

### 🔄 Stock Comparison
- Compare up to 5 stocks simultaneously
- Overlay price charts
- Side-by-side performance metrics
- Export comparison data

---

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd dynamic-stock-analyzer
```

### 2. Build C Modules

```bash
cd c_modules
make clean && make
cd ..
```

### 3. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on http://localhost:3001

### 4. Setup Frontend

```bash
# From project root
npm install
cp .env.example .env
npm run dev
```

Frontend runs on http://localhost:5173

---

## Project Structure

```
dynamic-stock-analyzer/
├── c_modules/              # Native C algorithms
│   ├── include/            # Header files
│   ├── src/                # C implementations
│   ├── tests/              # C test harness
│   └── Makefile            # Build configuration
│
├── backend/                # Express API server
│   ├── native/             # N-API bindings
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── cache/          # Caching layer
│   └── Dockerfile          # Backend container
│
└── src/                    # React frontend
    ├── components/         # UI components
    ├── pages/              # Route pages
    ├── lib/                # Utilities & API client
    └── hooks/              # React hooks
```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization
- **React Router** - Navigation

### Backend
- **Express.js** - REST API
- **TypeScript** - Type safety
- **Winston** - Logging
- **Helmet** - Security
- **Express Validator** - Input validation

### Native Layer
- **C11** - Core algorithms
- **N-API** - Node.js bindings
- **node-addon-api** - C++ wrapper

---

## Documentation

### User Documentation
- [Portfolio Import/Export Guide](PORTFOLIO_IMPORT_EXPORT.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

### Technical Documentation
- [C Modules README](c_modules/README.md)
- [Native Bindings README](backend/native/README.md)
- [Backend API README](backend/README.md)
- [Test Harness Guide](c_modules/tests/README.md)

---

## API Documentation

### Endpoints

**Stock Data:**
- `GET /api/stocks/:symbol/historical` - Fetch historical OHLCV data
- `GET /api/stocks/search` - Search stock symbols

**Analysis:**
- `POST /api/analyze/span` - Calculate stock span
- `POST /api/analyze/range` - Range query with segment tree
- `POST /api/analyze/window` - Sliding window analysis

**Portfolio:**
- `GET /api/portfolio` - List portfolios
- `POST /api/portfolio` - Create portfolio
- `POST /api/portfolio/:id/holdings` - Add holding
- `POST /api/portfolio/:id/import` - Import from CSV
- `POST /api/portfolio/:id/analyze` - Batch analyze

**Comparison:**
- `POST /api/compare/historical` - Compare historical data
- `POST /api/compare/analyze` - Compare analysis metrics

**Cache:**
- `POST /api/cache/purge` - Clear all cache
- `POST /api/cache/clean` - Remove expired entries

See [Backend README](backend/README.md) for detailed API documentation.

---

## Testing

### C Module Tests

```bash
cd c_modules
make test

# Run with user-provided CSV
LD_LIBRARY_PATH=./lib ./tests/harness prices.csv
```

### Backend Tests

```bash
cd backend
npm test
npm run test:coverage
```

### Frontend Tests

```bash
npm test
```

**Note**: All tests use mocked data. No embedded market data in repository.

---

## Development Workflow

### Making Changes

1. **C Modules**: Edit `c_modules/src/*.c`, rebuild with `make`
2. **Native Bindings**: Edit `backend/native/src/*.cpp`, rebuild with `npm run build:native`
3. **Backend**: Edit `backend/src/*.ts`, auto-reloads with `npm run dev`
4. **Frontend**: Edit `src/**/*.tsx`, hot reloads automatically

### Adding New Analysis Algorithm

1. Implement C function in `c_modules/src/`
2. Add header to `c_modules/include/`
3. Create N-API wrapper in `backend/native/src/native_binding.cpp`
4. Add TypeScript wrapper in `backend/native/src/wrapper.ts`
5. Create Express route in `backend/src/routes/`
6. Add API method to `src/lib/api.ts`
7. Create React component to display results

---

## Performance

### Benchmarks (1M price points)

| Operation | Time | Complexity |
|-----------|------|------------|
| Stock Span | 45ms | O(n) |
| Segment Tree Build | 38ms | O(n) |
| Segment Tree Query | <1μs | O(log n) |
| Sliding Window | 180ms | O(n) |

### Optimization Tips

1. **Caching**: Historical data cached for 1 hour
2. **Batch Operations**: Use portfolio batch analysis
3. **Date Ranges**: Limit to required period only
4. **Comparison**: Maximum 5 stocks at once

---

## Troubleshooting

### Common Issues

**Build Failures:**
- Verify all prerequisites installed
- Check `node --version` >= 18.0.0
- Ensure Python 3.x available
- Install build tools (gcc, make)

**Runtime Errors:**
- Check backend is running (http://localhost:3001/health)
- Verify `.env` files configured
- Check CORS_ORIGIN matches frontend URL
- Review logs in `backend/logs/`

**Data Provider Errors:**
- Yahoo Finance is free but rate-limited
- Add delays between requests if needed
- Verify stock symbols are correct
- Check network connectivity

See [Deployment Guide](DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

---

## Contributing

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with recommended rules
- **Formatting**: Prettier (automatic)
- **Commits**: Conventional commits format

### Testing Requirements

- Unit tests for all business logic
- No embedded test data
- Mock external dependencies
- 80%+ code coverage target

---

## License

See LICENSE file for details.

---

## Support

For issues and questions:

1. Review documentation in respective module READMEs
2. Check troubleshooting guides
3. Enable debug logging
4. Review error logs
5. Test components independently

---

## Roadmap

- [ ] Real-time WebSocket data streaming
- [ ] Advanced charting with technical indicators
- [ ] Machine learning price predictions
- [ ] Mobile app (React Native)
- [ ] Additional data providers (Alpha Vantage, IEX)
- [ ] PDF export with full reports
- [ ] Multi-user support with authentication
- [ ] Cloud deployment templates (AWS, GCP, Azure)

---

**Built with ❤️ using React, TypeScript, and C**
