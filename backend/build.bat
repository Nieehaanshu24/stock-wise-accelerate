@echo off
REM Build script for Dynamic Stock Analyzer backend (Windows)

echo ==============================================
echo   Building Dynamic Stock Analyzer Backend
echo ==============================================
echo.

REM Check for required tools
where gcc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] GCC not found! Please install MinGW-w64 or MSYS2.
    echo Download from: https://www.msys2.org/
    echo.
    pause
    exit /b 1
)

where make >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Make not found! Please install MinGW-w64 or MSYS2.
    echo Download from: https://www.msys2.org/
    echo.
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    echo Download from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Step 1: Build C modules
echo.
echo [Step 1/3] Building C modules...
echo -------------------------------------------
cd ..\c_modules
if exist lib\libdsa.dll del lib\libdsa.dll
if exist lib\libdsa.lib del lib\libdsa.lib
make clean
make
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build C modules
    cd ..\backend
    pause
    exit /b 1
)
cd ..\backend

REM Step 2: Build native Node.js addon
echo.
echo [Step 2/3] Building native addon...
echo -------------------------------------------
cd native
if exist build rmdir /S /Q build
if exist dist rmdir /S /Q dist
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install native dependencies
    cd ..
    pause
    exit /b 1
)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build native addon
    cd ..
    pause
    exit /b 1
)
cd ..

REM Step 3: Build TypeScript backend
echo.
echo [Step 3/3] Building TypeScript backend...
echo -------------------------------------------
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to build TypeScript backend
    pause
    exit /b 1
)

echo.
echo ==============================================
echo   Build Complete!
echo ==============================================
echo.
echo Run 'npm start' to launch the server.
echo.
pause
