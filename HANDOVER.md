# Dynamic Stock Analyzer - Developer Handover

**Target Audience**: Developer deploying to production for the first time

**Time to Production**: ~2 hours (including builds)

---

## Prerequisites Verification

Before starting, verify you have:

```bash
# Check versions
node --version    # Must be >= 18.0.0
python3 --version # Must be >= 3.x
gcc --version     # Any recent version
make --version    # GNU Make

# Clone repository
git clone <repository-url>
cd dynamic-stock-analyzer
```

---

## Step 1: Obtain Data Provider Credentials

**Choose ONE option:**

### Option A: Yahoo Finance (Recommended for Quick Start)
✅ **No registration required**  
✅ **Free to use**  
⚠️ **Rate-limited** (use responsibly)

**Setup**:
```env
DATA_PROVIDER=yahoo
# No additional credentials needed
```

### Option B: NSE API (Indian Market Data)
📋 **Requires account registration**

**Where to get credentials**:
1. Visit NSE data provider portal (contact NSE for specific provider)
2. Register for API access
3. Obtain API key and endpoint URL

**Setup**:
```env
DATA_PROVIDER=nse
NSE_API_KEY=your_actual_key_here
NSE_API_URL=https://api.nseindia.com/v1
```

---

## Step 2: Build C Modules (CRITICAL)

The native C library **MUST** be compiled before backend can start.

```bash
cd c_modules
make clean
make

# Verify build succeeded
ls -lh lib/libdsa.so      # Linux
ls -lh lib/libdsa.dylib   # macOS

# You should see ~50KB shared library file
```

**Common build errors**:
- Missing gcc: `sudo apt-get install build-essential` (Ubuntu)
- Missing make: `sudo apt-get install make`
- On macOS: `xcode-select --install`

**Shared library location**:
- Built to: `c_modules/lib/libdsa.so` (or `.dylib` on macOS)
- Backend expects it at: `../../c_modules/lib/` relative to backend/native/
- **Do not move or rename this file**

---

## Step 3: Build Native Node.js Addon

```bash
cd backend/native
npm install
npm run build

# Verify build succeeded
ls -lh build/Release/dsa_native.node
# Should see compiled .node binary (~500KB)
```

**Common build errors**:
- `Cannot find libdsa.so`: Ensure Step 2 completed successfully
- node-gyp errors: Install Python 3.x
- Permission errors: Check directory permissions

---

## Step 4: Configure Environment Variables

### Backend Configuration

```bash
cd backend
cp .env.example .env
nano .env  # or use your preferred editor
```

**Required variables**:
```env
# Server
NODE_ENV=production
PORT=3001

# Security - IMPORTANT: Set your actual domain
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Data Provider (choose one)
DATA_PROVIDER=yahoo
# DATA_PROVIDER=nse
# NSE_API_KEY=your_key_here
# NSE_API_URL=https://api.nseindia.com/v1

# Storage paths (defaults are fine)
CACHE_DIR=./cache
PORTFOLIOS_DIR=./data/portfolios

# Rate limiting (adjust for your needs)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

```bash
cd ../..  # Back to project root
cp .env.example .env
nano .env
```

**Required variables**:
```env
# Point to your backend URL
VITE_API_BASE_URL=https://api.yourdomain.com/api
# For local dev: http://localhost:3001/api
```

---

## Step 5: Build and Deploy with Docker (Production)

### Create docker-compose.override.yml (for secrets)

```bash
cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  backend:
    environment:
      # Your actual credentials here
      DATA_PROVIDER: yahoo
      # If using NSE:
      # NSE_API_KEY: your_actual_key
      # NSE_API_URL: https://api.nseindia.com/v1
      
      # Your domain
      CORS_ORIGIN: https://yourdomain.com
      
      NODE_ENV: production
      LOG_LEVEL: info
EOF
```

**IMPORTANT**: Add `docker-compose.override.yml` to `.gitignore`

### Build and Start Services

```bash
# Build all Docker images (takes 5-10 minutes)
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

**Services will be available at**:
- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health

---

## Step 6: Manual End-to-End Test

### Test 1: Backend Health

```bash
curl http://localhost:3001/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 42.5,
  "environment": "production"
}
```

### Test 2: Fetch Historical Data

```bash
# Test with real stock symbol
curl "http://localhost:3001/api/stocks/AAPL/historical?startDate=2024-01-01&endDate=2024-01-31"
```

**Expected**: JSON array with OHLC data  
**If 503 error**: Data provider credentials not configured correctly

### Test 3: Analysis with Real Prices

Create a test CSV file with real price data:

```bash
# Example: Create your own CSV with real closing prices
cat > test_prices.csv << EOF
150.25
152.30
148.90
153.10
EOF

# Or download real data from your data provider
```

Test analysis endpoint:

```bash
# Read prices from your CSV
PRICES=$(cat test_prices.csv | tr '\n' ',' | sed 's/,$//')

curl -X POST http://localhost:3001/api/analyze/span \
  -H "Content-Type: application/json" \
  -d "{\"prices\":[${PRICES}]}"
```

**Expected**: JSON with span results and processing metrics

### Test 4: Frontend Access

1. Open browser: http://localhost:8080
2. **Dashboard** should show "Backend: Online"
3. **Stock Analysis** page:
   - Enter symbol: AAPL (or valid symbol for your provider)
   - Select date range: Last 1 month
   - Click "Run Analysis"
   - Should see charts and metrics

4. **Portfolio** page:
   - Create new portfolio
   - Add holdings
   - Export to CSV
   - Import CSV back

### Test 5: CSV Import (User-Supplied Data)

Create a portfolio CSV with real data:

```bash
cat > my_portfolio.csv << EOF
symbol,quantity,averagePrice
AAPL,10,150.25
MSFT,25,380.50
EOF
```

**Test import**:
1. Go to Portfolio page
2. Click "Import Portfolio"
3. Upload `my_portfolio.csv`
4. Verify holdings appear correctly
5. Run batch analysis
6. Export to verify data integrity

---

## Step 7: Production Deployment Checklist

### Security

- [ ] **HTTPS enabled** (use nginx/CloudFlare/load balancer)
- [ ] **CORS_ORIGIN set to actual domain** (not localhost or *)
- [ ] **Firewall configured** (only ports 80/443 exposed)
- [ ] **Secrets in docker-compose.override.yml**, not committed to git
- [ ] **Rate limits configured** appropriately for expected traffic
- [ ] **Health checks configured** in load balancer

### Monitoring

- [ ] **Log aggregation** setup (CloudWatch, ELK, etc.)
- [ ] **Error alerts** configured (Sentry, PagerDuty)
- [ ] **Uptime monitoring** (Pingdom, UptimeRobot)
- [ ] **Resource monitoring** (CPU, memory, disk)
- [ ] **Backup schedule** for portfolio data

### Data Management

```bash
# Create backup script
cat > backup_portfolios.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "backup_${DATE}.tar.gz" backend/data/portfolios/
echo "Backup created: backup_${DATE}.tar.gz"
EOF

chmod +x backup_portfolios.sh

# Add to crontab for daily backups
# 0 2 * * * /path/to/backup_portfolios.sh
```

### Performance Tuning

```env
# Adjust cache TTL for production (2 hours)
CACHE_TTL_MS=7200000

# Increase rate limits for production traffic
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

---

## Step 8: Verify Production Deployment

### Automated Health Checks

```bash
# Health endpoint
curl https://api.yourdomain.com/health

# Frontend loading
curl -I https://yourdomain.com

# Test with real symbol
curl "https://api.yourdomain.com/api/stocks/AAPL/historical?startDate=2024-01-01&endDate=2024-01-31"
```

### Manual Smoke Test

1. Access https://yourdomain.com
2. Navigate through all pages
3. Test stock analysis with real symbol
4. Create and manage portfolio
5. Test CSV import/export
6. Test stock comparison
7. Check browser console for errors
8. Verify dark/light mode toggle
9. Test mobile responsiveness

---

## Common Issues & Solutions

### Issue: "Native DSA module not compiled"

**Solution**:
```bash
cd backend/native
npm run rebuild
docker-compose restart backend
```

### Issue: "Data provider not configured"

**Solution**:
- Verify `DATA_PROVIDER` set in environment
- If using NSE, verify `NSE_API_KEY` and `NSE_API_URL` set
- Check backend logs: `docker-compose logs backend`

### Issue: CORS errors in browser

**Solution**:
```env
# In backend/.env or docker-compose.override.yml
CORS_ORIGIN=https://yourdomain.com
```

### Issue: Port already in use

**Solution**:
```bash
# Check what's using the port
lsof -i :3001

# Kill the process or change port
PORT=3002 docker-compose up -d
```

### Issue: Cache not working

**Solution**:
```bash
# Create cache directory
mkdir -p backend/cache
chmod 755 backend/cache

# Or purge cache
curl -X POST http://localhost:3001/api/cache/purge
```

---

## Maintenance

### Daily Operations

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update code
git pull
make build-all
docker-compose build
docker-compose up -d

# Backup portfolios
./backup_portfolios.sh
```

### Weekly Tasks

- Review error logs for patterns
- Check disk space (cache/logs)
- Verify backup integrity
- Review rate limit violations

### Monthly Tasks

- Update dependencies: `npm audit fix`
- Rotate logs (if not automated)
- Security audit: Run `npm audit`
- Review performance metrics

---

## Scaling Considerations

### Horizontal Scaling

**Current limitation**: File-based cache and portfolio storage

**To scale horizontally**:
1. Migrate portfolios to PostgreSQL/MongoDB
2. Use Redis for distributed cache
3. Setup load balancer (nginx/HAProxy)
4. Use shared storage (NFS/S3) for temporary file operations

### Vertical Scaling

**Recommended specs per container**:
- **Development**: 1 CPU, 2GB RAM
- **Production (< 100 users)**: 2 CPU, 4GB RAM
- **Production (100-1000 users)**: 4 CPU, 8GB RAM

**Native C modules are CPU-intensive**. More cores = better performance.

---

## Support Resources

### Documentation

- **Main README**: Project overview and features
- **DEPLOYMENT_GUIDE.md**: Detailed deployment instructions
- **PORTFOLIO_IMPORT_EXPORT.md**: CSV format specifications
- **SECURITY.md**: Security best practices and TODOs
- **Backend README**: API documentation
- **C Modules README**: Native algorithm documentation

### Commands Reference

```bash
# Build everything
make build-all

# Run tests
make test

# Clean build artifacts
make clean

# Development mode
make dev

# Docker operations
docker-compose up -d     # Start
docker-compose down      # Stop
docker-compose logs -f   # Logs
docker-compose ps        # Status
```

---

## Next Steps After Deployment

1. **Monitor first 24 hours** closely
2. **Test with real user workflows**
3. **Setup automated backups**
4. **Configure monitoring/alerts**
5. **Document any custom configurations**
6. **Plan for database migration** (if scaling needed)
7. **Implement authentication** (see SECURITY.md TODOs)
8. **Setup SSL/TLS certificates**
9. **Configure CDN** for frontend assets
10. **Review SECURITY.md** for hardening steps

---

## Emergency Contacts

- **Repository Issues**: [GitHub Issues URL]
- **Security Issues**: See SECURITY.md
- **Documentation**: All README files in repo

---

## Final Verification

Before marking deployment complete:

✅ Backend health endpoint responds  
✅ Frontend loads without errors  
✅ Stock data fetches successfully  
✅ Analysis endpoints return results  
✅ Portfolio CRUD operations work  
✅ CSV import/export functional  
✅ Comparison feature works  
✅ Cache is functioning  
✅ Logs are being written  
✅ Backups scheduled  
✅ Monitoring configured  
✅ SSL/HTTPS enabled  
✅ Security checklist reviewed  

---

**Deployment Date**: _______________

**Deployed By**: _______________

**Production URL**: _______________

**Notes**: _______________

---

**🎉 Congratulations! Your Dynamic Stock Analyzer is now live.**
