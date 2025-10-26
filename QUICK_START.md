# 🚀 Quick Start Guide

## Prerequisites

### All Platforms:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.x (for node-gyp) ([Download](https://www.python.org/downloads/))

### Windows:
- **MSYS2** (includes GCC, Make, and development tools)
  1. Download from [https://www.msys2.org/](https://www.msys2.org/)
  2. Install MSYS2
  3. Open "MSYS2 MSYS" terminal and run:
     ```bash
     pacman -S --needed base-devel mingw-w64-x86_64-toolchain mingw-w64-x86_64-gcc make
     ```
  4. Add to PATH: `C:\msys64\mingw64\bin` and `C:\msys64\usr\bin`
  
**Alternative:** Use Visual Studio 2019+ with "Desktop development with C++" workload

### Linux:
- **GCC/G++** compiler: `sudo apt-get install build-essential`
- **Make** utility (usually pre-installed)

### macOS:
- **Xcode Command Line Tools**: `xcode-select --install`

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

### Windows: "make: command not found"
**Solution:** 
1. Install MSYS2 (see Prerequisites above)
2. Add to PATH: `C:\msys64\mingw64\bin` and `C:\msys64\usr\bin`
3. Restart your terminal/IDE
4. Verify with: `make --version`

**Alternative:** Use WSL2 Ubuntu and follow Linux instructions

### Windows: "gcc: command not found"
**Solution:**
```cmd
REM In MSYS2 terminal:
pacman -S mingw-w64-x86_64-gcc make
```

### Windows: "node-gyp rebuild failed"
**Solution:**
```cmd
npm install -g node-gyp windows-build-tools
npm config set python %USERPROFILE%\.windows-build-tools\python27\python.exe
npm config set msvs_version 2019
```

### Linux: "node-gyp rebuild failed"
**Solution:** 
```bash
sudo apt-get install build-essential python3 node-gyp
npm config set python /usr/bin/python3
```

### macOS: "Permission denied"
**Solution:**
```bash
chmod +x build.sh
./build.sh
```

### "Cannot open shared library"
**Windows:** Ensure `c_modules/lib/libdsa.dll` exists  
**Linux:** Set `LD_LIBRARY_PATH`: `export LD_LIBRARY_PATH=./c_modules/lib:$LD_LIBRARY_PATH`  
**macOS:** Set `DYLD_LIBRARY_PATH`: `export DYLD_LIBRARY_PATH=./c_modules/lib:$DYLD_LIBRARY_PATH`

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

### Windows:
- [ ] C modules compiled (`c_modules\lib\libdsa.dll` and `libdsa.lib` exist)
- [ ] Native addon built (`backend\native\build\Release\dsa_native.node` exists)
- [ ] TypeScript compiled (`backend\dist\` contains .js files)
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns `{"status":"ok","native_modules":"available"}`
- [ ] Frontend connects successfully (no "OFFLINE" status)

### Linux/macOS:
- [ ] C modules compiled (`c_modules/lib/libdsa.so` or `libdsa.dylib` exists)
- [ ] Native addon built (`backend/native/build/Release/dsa_native.node` exists)
- [ ] TypeScript compiled (`backend/dist/` contains .js files)
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns `{"status":"ok","native_modules":"available"}`
- [ ] Frontend connects successfully (no "OFFLINE" status)

---

## 🐳 Using Docker (Alternative)

```bash
docker-compose up --build
```

Backend will be available at `http://localhost:3001`

---

**Need more help?** See `BACKEND_DEPLOYMENT.md` or `HANDOVER.md`
