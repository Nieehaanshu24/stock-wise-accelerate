# 🚀 Quick Start Guide

## Prerequisites
- **Node.js** 18+ 
- **GCC/G++** compiler (MinGW-w64 on Windows, build-essential on Linux, Xcode on macOS)
- **Make** utility
- **Python** 3.x (for node-gyp)

---

## 🏃 Running the Backend Locally

### Windows:
```cmd
cd backend
build.bat
npm start
```

### Linux/macOS:
```bash
cd backend
chmod +x build.sh
./build.sh
npm start
```

The backend will start on `http://localhost:3001`

---

## 🧪 Testing Backend Status

Once running, verify:
```bash
curl http://localhost:3001/health
```

Should return:
```json
{"status":"ok","timestamp":"...","native_modules":"available"}
```

---

## 🔧 Troubleshooting

### "Cannot find module '../native/dist/wrapper'"
**Solution:** Run the build script first (see above)

### "make: command not found" (Windows)
**Solution:** Install MinGW-w64 or use WSL

### "node-gyp rebuild failed"
**Solution:** 
```bash
npm install -g node-gyp
npm config set python /path/to/python3
```

### "Permission denied" (Linux/macOS)
**Solution:**
```bash
chmod +x build.sh
```

---

## 🌐 Connecting Frontend to Backend

### Local Development:
1. Set environment variable in Lovable:
   - Key: `VITE_API_BASE_URL`
   - Value: `http://localhost:3001/api`

2. Restart the frontend preview

### Deployed Backend:
1. Deploy backend to Railway/Render/DigitalOcean (see `BACKEND_DEPLOYMENT.md`)
2. Set `VITE_API_BASE_URL` to your deployed URL

---

## 📁 Project Structure After Build

```
backend/
├── dist/              # Compiled TypeScript
├── native/
│   ├── build/         # Compiled native addon (.node file)
│   └── dist/          # TypeScript wrapper
└── ...

c_modules/
├── lib/
│   └── libdsa.so      # Compiled C shared library
└── ...
```

---

## ✅ Verification Checklist

- [ ] C modules compiled (`c_modules/lib/libdsa.so` exists)
- [ ] Native addon built (`backend/native/build/Release/dsa_native.node` exists)
- [ ] TypeScript compiled (`backend/dist/` contains .js files)
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns `{"status":"ok"}`
- [ ] Frontend connects successfully (no "OFFLINE" status)

---

## 🐳 Using Docker (Alternative)

```bash
docker-compose up --build
```

Backend will be available at `http://localhost:3001`

---

**Need more help?** See `BACKEND_DEPLOYMENT.md` or `HANDOVER.md`
