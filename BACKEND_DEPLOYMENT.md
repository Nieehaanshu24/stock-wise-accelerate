# Backend Deployment Guide

## ⚠️ Important: Lovable Cannot Run the Backend

Lovable is a **frontend-only platform**. The Express backend with C modules must be deployed separately.

---

## Option 1: Deploy Backend to External Service

### Recommended Platforms:
- **Railway** (easiest) - supports Docker, automatic deployments
- **Render** - free tier available, Docker support
- **DigitalOcean App Platform** - $5/month
- **AWS ECS/Fargate** - production-grade
- **Fly.io** - edge deployment

### Steps:

#### 1. Deploy Backend Using Docker
```bash
# Build and push your Docker image
cd backend
docker build -t your-username/dsa-backend:latest .
docker push your-username/dsa-backend:latest
```

#### 2. Set Environment Variables on Your Platform
```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-lovable-app.lovable.app
DATA_PROVIDER=yahoo
CACHE_DIR=/app/cache
LOG_LEVEL=info
```

#### 3. Update Frontend Environment Variables in Lovable

In Lovable project settings, add:
```
VITE_API_BASE_URL=https://your-backend-url.com/api
VITE_BACKEND_URL=https://your-backend-url.com
```

#### 4. Test Connection
```bash
# Check backend health
curl https://your-backend-url.com/health

# Test from frontend
# Open browser console on your Lovable app and run:
fetch('https://your-backend-url.com/health').then(r => r.json()).then(console.log)
```

---

## Option 2: Local Development Setup

### Terminal 1 - Run Backend:
```bash
cd backend

# Install dependencies
npm install

# Compile C modules
cd ../c_modules
make clean && make
cd ../backend

# Build native Node.js addon
cd native
npm install
npm run build
cd ..

# Start backend server
npm run dev
# Should show: "Server running on port 3001"
```

### Terminal 2 - Run Frontend (in Lovable):
```bash
# The proxy in vite.config.ts will forward /api requests to localhost:3001
# Just use the Lovable preview - it will connect to your local backend
```

### Test Local Connection:
1. Backend health: http://localhost:3001/health
2. Frontend in Lovable should now connect successfully

---

## Option 3: Migrate to Lovable Cloud (Alternative Architecture)

If you want a fully integrated solution within Lovable:

### Architecture Changes Required:
1. **Enable Lovable Cloud** for database, auth, storage
2. **Migrate C module logic to Edge Functions** that:
   - Call an external microservice hosting your C modules
   - Or rewrite critical algorithms in TypeScript/WASM
3. **Use Supabase Functions** for stock data fetching and caching

### Benefits:
- ✅ Single deployment in Lovable
- ✅ Automatic scaling and HTTPS
- ✅ No separate backend to manage

### Tradeoffs:
- ❌ Cannot use native C modules directly
- ❌ Requires rewriting or wrapping C logic
- ⚠️ Performance may be different

---

## Current Status

- ✅ Frontend: **DEPLOYED** in Lovable
- ❌ Backend: **NOT RUNNING** (needs external deployment)
- ✅ Docker setup: **READY** in `/backend/Dockerfile`
- ✅ CI/CD: **CONFIGURED** in `.github/workflows/ci.yml`

---

## Quick Start for Production

### 1. Deploy to Railway (Fastest):
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
cd backend
railway init
railway up

# Get your backend URL
railway domain
# Add this URL to Lovable as VITE_API_BASE_URL
```

### 2. Update Lovable Frontend:
- Go to Lovable project settings
- Add environment variable: `VITE_API_BASE_URL=https://your-railway-url.railway.app/api`
- Rebuild frontend

### 3. Verify:
- Frontend should now show backend as **ONLINE**
- Test stock analysis features
- Check portfolio and comparison tools

---

## Troubleshooting

### "Network Error: Unable to connect to backend service"
- ✅ Backend is deployed and running
- ✅ CORS_ORIGIN in backend includes your Lovable URL
- ✅ VITE_API_BASE_URL in Lovable points to your backend
- ✅ Backend /health endpoint returns 200 OK

### "Backend shows OFFLINE in status"
- Backend isn't reachable from frontend
- Check VITE_API_BASE_URL is correct
- Verify backend CORS settings allow your Lovable domain

### C Modules Compilation Errors
- Ensure GCC and Make are available in deployment environment
- Use the provided Dockerfile which includes build tools
- Check logs: `docker logs <container-id>`

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   Lovable (Frontend Only)           │
│   - React App                        │
│   - Hosted on Lovable Cloud         │
└───────────────┬─────────────────────┘
                │
                │ HTTPS /api/* requests
                │
                ▼
┌─────────────────────────────────────┐
│   Your Backend Server               │
│   (Railway/Render/AWS/etc)          │
│                                     │
│   ┌──────────────────────────────┐ │
│   │ Express Server (Node.js)     │ │
│   │ - /api/analyze               │ │
│   │ - /api/portfolio             │ │
│   │ - /api/compare               │ │
│   └──────────┬───────────────────┘ │
│              │                      │
│              ▼                      │
│   ┌──────────────────────────────┐ │
│   │ Native C Modules (via N-API) │ │
│   │ - Stock Span                 │ │
│   │ - Segment Tree               │ │
│   │ - Sliding Window             │ │
│   └──────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## Support

For deployment questions:
- Railway: https://docs.railway.app
- Render: https://render.com/docs
- Lovable: https://docs.lovable.dev

For C module compilation issues, see `backend/README.md`
