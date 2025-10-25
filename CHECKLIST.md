# Dynamic Stock Analyzer - Pre-Deployment Checklist

## ✅ Sample Data Verification

**VERIFIED**: This repository contains **NO sample or fake market data**.

### Files Checked for Sample Data

#### C Modules
- ✅ `c_modules/src/stock_span.c` - No embedded data
- ✅ `c_modules/src/segment_tree.c` - No embedded data
- ✅ `c_modules/src/sliding_window.c` - No embedded data
- ✅ `c_modules/include/*.h` - No embedded data
- ✅ `c_modules/tests/harness.c` - Accepts user CSV, no embedded data

#### Backend
- ✅ `backend/src/services/dataProvider.ts` - External API calls only, no mock data
- ✅ `backend/src/services/analysisService.ts` - Processing logic only
- ✅ `backend/src/services/portfolioService.ts` - File I/O, no sample portfolios
- ✅ `backend/src/routes/*.ts` - No embedded responses
- ✅ `backend/src/__tests__/*.test.ts` - Uses mocks, no real market data
- ✅ `backend/README.md` - No sample API responses

#### Frontend
- ✅ `src/pages/*.tsx` - No embedded chart data or stock lists
- ✅ `src/components/**/*.tsx` - No sample data in components
- ✅ `src/lib/api.ts` - API client only
- ✅ `src/lib/utils/formatters.ts` - Formatting logic only, no example numbers

#### Documentation
- ✅ `README.md` - No sample data, provider names only
- ✅ `DEPLOYMENT_GUIDE.md` - Instructions only
- ✅ `PORTFOLIO_IMPORT_EXPORT.md` - Format specification only
- ✅ `backend/README.md` - No sample responses

#### Configuration
- ✅ `.env.example` - Variable names only, no values
- ✅ `backend/.env.example` - Variable names only, no values
- ✅ `docker-compose.yml` - No hardcoded credentials

---

## 🔑 Required Credentials

### Before Deployment, Developers Must Supply:

#### Data Provider Configuration
Choose **ONE** data provider and configure:

**Option 1: Yahoo Finance (Free, No API Key)**
```env
DATA_PROVIDER=yahoo
```
- No registration required
- Rate-limited by Yahoo (use responsibly)
- Supports global stocks

**Option 2: NSE API (Requires Account)**
```env
DATA_PROVIDER=nse
NSE_API_KEY=<your-key>
NSE_API_URL=<api-endpoint>
```
- Requires NSE data provider account
- Obtain credentials from: [NSE Data Provider Registration]
- Supports Indian market stocks

#### Application Configuration
```env
# Backend (.env in backend/)
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
CACHE_DIR=./cache
PORTFOLIOS_DIR=./data/portfolios

# Frontend (.env in root)
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## 🚀 Build & Deploy Checklist

### Pre-Build
- [ ] All required credentials obtained and documented
- [ ] Environment variables configured in `.env` files
- [ ] Build dependencies installed (Node.js >= 18, gcc, make, python3)
- [ ] Review `SECURITY.md` for security best practices

### Build Process
- [ ] C modules compile: `cd c_modules && make`
- [ ] Native addon builds: `cd backend/native && npm run build`
- [ ] Backend builds: `cd backend && npm run build`
- [ ] Frontend builds: `npm run build`
- [ ] Docker images build: `docker-compose build`

### Testing
- [ ] C module tests pass (if applicable)
- [ ] Backend unit tests pass: `cd backend && npm test`
- [ ] Frontend builds without errors
- [ ] Manual smoke test: backend health endpoint responds
- [ ] Manual smoke test: frontend loads and shows proper disabled states

### Deployment Verification
- [ ] Backend health check: `curl http://localhost:3001/health`
- [ ] Frontend accessible and shows correct backend connection status
- [ ] Data provider configuration validated (test one stock fetch)
- [ ] Portfolio CRUD operations functional
- [ ] Analysis endpoints return results (with configured provider)
- [ ] Error messages descriptive when features disabled

### Security
- [ ] No credentials committed to repository
- [ ] Environment variables properly loaded
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] HTTPS configured (production)
- [ ] Security headers active (Helmet middleware)

### Monitoring
- [ ] Logs directory created and writable
- [ ] Cache directory created and writable
- [ ] Portfolio data directory created
- [ ] Log level appropriate for environment
- [ ] Error tracking configured (optional)

---

## 📁 Files Requiring External Data

These files **require** user-supplied data at runtime:

1. **Market Data** - Must be fetched via configured data provider
   - `/api/stocks/:symbol/historical`
   - No embedded fallback data

2. **Portfolio Data** - User creates or imports
   - `backend/data/portfolios/*.json`
   - CSV import format documented in `PORTFOLIO_IMPORT_EXPORT.md`

3. **Analysis Results** - Generated from user-requested data
   - All `/api/analyze/*` endpoints
   - Requires valid historical data input

---

## ⚠️ What Happens Without Credentials

### Backend Behavior
- Server starts successfully
- Health endpoint responds: `{"status": "healthy"}`
- Stock data endpoints return `503 Service Unavailable` with message:
  ```json
  {
    "error": "Data provider not configured",
    "message": "Set DATA_PROVIDER and required credentials in .env"
  }
  ```
- Analysis endpoints reject requests referencing symbols
- Portfolio CRUD remains functional
- Local analysis with user-provided price arrays works

### Frontend Behavior
- Application loads normally
- Dashboard shows "Backend: Online"
- Stock search/autocomplete disabled with message:
  "Data provider not configured. Contact administrator."
- Symbol-based analysis disabled
- Manual price input remains available
- Portfolio features functional

---

## 🔍 Verification Commands

Run before deployment:

```bash
# Verify no sample data
make verify

# Check build artifacts exist
test -f c_modules/lib/libdsa.so && echo "C library: OK"
test -f backend/native/build/Release/dsa_native.node && echo "Native addon: OK"
test -d backend/dist && echo "Backend build: OK"
test -d dist && echo "Frontend build: OK"

# Test backend starts
cd backend && npm start &
sleep 5
curl -f http://localhost:3001/health || echo "Backend health check failed"
```

---

## 📊 Deployment Modes

### Development
- `NODE_ENV=development`
- Detailed logs enabled
- CORS allows localhost
- Hot reload enabled
- Sample portfolios can be manually created for testing

### Production
- `NODE_ENV=production`
- `LOG_LEVEL=info` or `warn`
- CORS restricted to production domain
- Compiled bundles served
- Data provider credentials **required** for full functionality

---

## 📝 Additional Notes

- **Native Modules**: Require recompilation on deployment platform
- **Data Retention**: Cache TTL configured via `CACHE_TTL_MS` (default 1 hour)
- **Rate Limits**: Configured per `RATE_LIMIT_MAX_REQUESTS` (default 100/15min)
- **Portfolio Backups**: Manual backup recommended (see `DEPLOYMENT_GUIDE.md`)

---

## ✅ Final Verification

Before marking deployment complete:

1. Run `./tools/verify_no_sample_data.sh` - must report no violations
2. Verify all environment variables documented
3. Test with data provider credentials
4. Test without credentials (graceful degradation)
5. Review security checklist in `SECURITY.md`

---

**Status**: Repository verified clean of sample data on [DATE]

**Verified by**: [NAME]

**Next Review**: Before production deployment
