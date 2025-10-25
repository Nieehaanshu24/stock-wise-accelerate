# Dynamic Stock Analyzer - Deployment Guide

Complete deployment instructions for running the full-stack application.

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │ (Port 5173)
│  Vite + TS      │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Express API    │ (Port 3001)
│  Node.js + TS   │
└────────┬────────┘
         │ N-API
         ▼
┌─────────────────┐
│  Native Modules │
│  C Libraries    │
└─────────────────┘
```

---

## Prerequisites

### System Requirements

- **Operating System**: Linux or macOS (Windows requires WSL2)
- **Node.js**: >= 18.0.0 (LTS recommended)
- **Python**: 3.x (for node-gyp)
- **C Compiler**:
  - Linux: GCC or Clang
  - macOS: Xcode Command Line Tools
- **Make**: GNU Make
- **Memory**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB for dependencies and build artifacts

### Installation Prerequisites

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y build-essential python3 make gcc g++
```

**macOS:**
```bash
xcode-select --install
```

**Verify installations:**
```bash
node --version    # Should be >= 18.0.0
python3 --version # Should be >= 3.x
gcc --version     # Should show GCC version
make --version    # Should show GNU Make
```

---

## Step 1: Build Native C Modules

```bash
cd c_modules
make clean
make

# Verify output
ls -lh lib/libdsa.so    # Linux
ls -lh lib/libdsa.dylib # macOS
```

**Expected output:**
- `lib/libdsa.so` or `lib/libdsa.dylib` (~50KB)
- Headers in `include/`

**Test native modules:**
```bash
# Create test data (download or generate)
echo "100,102,98,105,107,103,110" > test_prices.csv

# Run test harness
make test
LD_LIBRARY_PATH=./lib ./tests/harness test_prices.csv
```

---

## Step 2: Build Node Native Addon

```bash
cd backend/native
npm install
npm run build

# Verify output
ls -lh build/Release/dsa_native.node
ls -lh dist/
```

**Expected output:**
- `build/Release/dsa_native.node` (compiled addon)
- `dist/` directory with TypeScript output

---

## Step 3: Setup Backend

```bash
cd backend
npm install

# Create configuration
cp .env.example .env
```

**Edit `.env`:**
```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
DATA_PROVIDER=yahoo
CACHE_DIR=./cache
PORTFOLIOS_DIR=./data/portfolios
```

**Create data directories:**
```bash
mkdir -p cache logs data/portfolios
```

**Test backend:**
```bash
npm run dev

# In another terminal:
curl http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 0.5,
  "environment": "development"
}
```

---

## Step 4: Setup Frontend

```bash
# From project root
npm install

# Create configuration
cp .env.example .env
```

**Edit `.env`:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Start development server:**
```bash
npm run dev
```

**Access application:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Production Deployment

### Option 1: Docker (Recommended)

**Build Docker image:**
```bash
# From project root
docker build -t dsa-backend -f backend/Dockerfile .
```

**Run backend container:**
```bash
docker run -d \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATA_PROVIDER=yahoo \
  -e CORS_ORIGIN=https://yourdomain.com \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --name dsa-backend \
  dsa-backend
```

**Build and deploy frontend:**
```bash
npm run build

# Serve dist/ folder with nginx, Apache, or static host
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/dsa/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: PM2 (Process Manager)

**Install PM2:**
```bash
npm install -g pm2
```

**Build backend:**
```bash
cd backend
npm run build
```

**Start with PM2:**
```bash
pm2 start dist/server.js --name dsa-backend
pm2 save
pm2 startup
```

**Monitor:**
```bash
pm2 logs dsa-backend
pm2 monit
```

---

## Environment Variables

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 3001 | Backend server port |
| `CORS_ORIGIN` | No | * | Allowed CORS origins |
| `LOG_LEVEL` | No | info | Logging level (debug/info/warn/error) |
| `DATA_PROVIDER` | No | yahoo | Data source (yahoo/nse) |
| `NSE_API_KEY` | Conditional | - | Required if DATA_PROVIDER=nse |
| `NSE_API_URL` | No | - | NSE API base URL |
| `CACHE_DIR` | No | ./cache | Cache storage directory |
| `CACHE_TTL_MS` | No | 3600000 | Cache TTL in milliseconds |
| `PORTFOLIOS_DIR` | No | ./data/portfolios | Portfolio storage directory |
| `RATE_LIMIT_WINDOW_MS` | No | 900000 | Rate limit window |
| `RATE_LIMIT_MAX_REQUESTS` | No | 100 | Max requests per window |

### Frontend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | No | http://localhost:3001/api | Backend API URL |

---

## Testing Deployment

### Health Checks

**Backend:**
```bash
curl http://localhost:3001/health
```

**Expected:** `{"status":"healthy",...}`

### API Tests

**Get historical data:**
```bash
curl "http://localhost:3001/api/stocks/AAPL/historical?startDate=2024-01-01&endDate=2024-01-31"
```

**Run analysis:**
```bash
curl -X POST http://localhost:3001/api/analyze/span \
  -H "Content-Type: application/json" \
  -d '{"prices":[100,102,98,105,107,103]}'
```

### Frontend Tests

1. Open http://localhost:5173
2. Navigate to Dashboard - should show "Online" status
3. Go to Stock Analysis - configure and run analysis
4. Check browser console for errors

---

## Performance Tuning

### Backend Optimization

**Increase cache TTL for production:**
```env
CACHE_TTL_MS=7200000  # 2 hours
```

**Adjust rate limits:**
```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=500      # Higher for production
```

**Enable compression:**
Already enabled via `compression` middleware.

### Frontend Optimization

**Build optimizations:**
```bash
npm run build -- --mode production
```

**Enable gzip in nginx:**
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

---

## Monitoring

### Backend Logs

**Location:**
- Development: Console output
- Production: `logs/combined.log`, `logs/error.log`

**Log levels:**
- `error`: Critical errors
- `warn`: Warnings
- `info`: General information
- `debug`: Detailed debugging

**Enable debug logging:**
```env
LOG_LEVEL=debug
```

### Metrics to Monitor

1. **Response times**: Check processing times in API responses
2. **Cache hit rate**: Monitor `cached: true/false` in responses
3. **Error rate**: Track 4xx and 5xx responses
4. **Memory usage**: Monitor Node.js heap
5. **Native module errors**: Check logs for "Native" keyword

**PM2 monitoring:**
```bash
pm2 monit
pm2 logs dsa-backend --lines 100
```

---

## Troubleshooting

### Native Module Not Loading

**Symptom:** "Native DSA module not compiled"

**Solutions:**
```bash
# Rebuild native modules
cd backend/native
npm run rebuild

# Verify C library exists
ls -lh ../../c_modules/lib/libdsa.so

# Check library path
export LD_LIBRARY_PATH=$(pwd)/../../c_modules/lib:$LD_LIBRARY_PATH
```

### Port Already in Use

**Symptom:** "EADDRINUSE"

**Solution:**
```bash
# Find process
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different port
PORT=3002 npm run dev
```

### CORS Errors

**Symptom:** Browser blocks requests

**Solution:**
Update backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173,https://yourdomain.com
```

### Cache Errors

**Symptom:** "Failed to initialize cache directory"

**Solution:**
```bash
mkdir -p backend/cache backend/logs backend/data/portfolios
chmod 755 backend/cache backend/logs backend/data
```

### Data Provider Errors

**Symptom:** "Failed to fetch data from Yahoo Finance"

**Solutions:**
1. Check network connectivity
2. Verify symbol format (use `.NS` for Indian stocks)
3. Try different date range
4. Check Yahoo Finance service status

---

## Security Checklist

- [ ] Change default ports in production
- [ ] Set strong CORS_ORIGIN (not `*`)
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable security headers (helmet)
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity
- [ ] Backup portfolio data regularly
- [ ] Use environment variables for secrets (never commit .env)

---

## Backup & Recovery

### Backup Portfolio Data

```bash
# Backup portfolios directory
tar -czf portfolios_backup_$(date +%Y%m%d).tar.gz backend/data/portfolios

# Automated daily backup (cron)
0 2 * * * cd /path/to/dsa && tar -czf backups/portfolios_$(date +\%Y\%m\%d).tar.gz backend/data/portfolios
```

### Restore from Backup

```bash
# Stop backend
pm2 stop dsa-backend

# Restore
tar -xzf portfolios_backup_20240120.tar.gz -C backend/data/

# Start backend
pm2 start dsa-backend
```

---

## Scaling Considerations

### Horizontal Scaling

- Backend is stateless (except file cache and portfolios)
- Use shared storage (NFS, S3) for cache and portfolio data
- Load balancer: nginx, HAProxy, or cloud LB

### Vertical Scaling

- Native C modules are CPU-intensive
- Minimum 2 CPU cores recommended
- 4GB RAM for handling 100+ concurrent requests

### Database Migration

Current implementation uses JSON files. For production scale:

1. Replace `portfolioService` with database backend:
   - PostgreSQL for relational data
   - MongoDB for document storage
2. Update `PORTFOLIOS_DIR` to connection string
3. Implement database schema and migrations

---

## License

See project LICENSE file.

## Support

For deployment issues:
1. Check logs first
2. Review error messages carefully
3. Consult README files in each module
4. Enable debug logging
5. Test components independently
