#!/bin/bash
# Build script for Dynamic Stock Analyzer backend

set -e  # Exit on error

echo "🔨 Building Dynamic Stock Analyzer Backend..."

# Step 1: Build C modules
echo "📦 Step 1/3: Building C modules..."
cd ../c_modules
make clean
make
cd ../backend

# Step 2: Build native Node.js addon
echo "📦 Step 2/3: Building native addon..."
cd native
npm install
npm run build
cd ..

# Step 3: Build TypeScript backend
echo "📦 Step 3/3: Building TypeScript backend..."
npm install
npm run build

echo "✅ Build complete! Run 'npm start' to launch the server."
