@echo off
REM Build script for Dynamic Stock Analyzer backend (Windows)

echo Building Dynamic Stock Analyzer Backend...

REM Step 1: Build C modules
echo Step 1/3: Building C modules...
cd ..\c_modules
make clean
make
cd ..\backend

REM Step 2: Build native Node.js addon
echo Step 2/3: Building native addon...
cd native
call npm install
call npm run build
cd ..

REM Step 3: Build TypeScript backend
echo Step 3/3: Building TypeScript backend...
call npm install
call npm run build

echo Build complete! Run 'npm start' to launch the server.
