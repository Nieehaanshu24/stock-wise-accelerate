# Multi-stage build for Dynamic Stock Analyzer backend

# Stage 1: Build native C modules
FROM node:18-bullseye AS native-builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    make \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy C modules source
COPY c_modules ./c_modules

# Build C shared library
WORKDIR /app/c_modules
RUN make clean && make

# Stage 2: Build Node native addon
FROM node:18-bullseye AS addon-builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy C library from previous stage
COPY --from=native-builder /app/c_modules ./c_modules

# Copy native addon source
COPY backend/native/package*.json ./backend/native/
COPY backend/native ./backend/native

# Build native addon
WORKDIR /app/backend/native
RUN npm ci
RUN npm run build:native

# Stage 3: Build TypeScript backend
FROM node:18-bullseye AS ts-builder

WORKDIR /app/backend

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Copy native module from previous stage
COPY --from=addon-builder /app/backend/native ./native
COPY --from=addon-builder /app/c_modules ../c_modules

# Build TypeScript
RUN npm run build

# Stage 4: Production image
FROM node:18-bullseye-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=ts-builder /app/backend/dist ./dist
COPY --from=addon-builder /app/backend/native/build ./native/build
COPY --from=addon-builder /app/backend/native/dist ./native/dist
COPY --from=native-builder /app/c_modules/lib ../c_modules/lib

# Set library path for shared library
ENV LD_LIBRARY_PATH=/app/c_modules/lib:$LD_LIBRARY_PATH

# Create cache directory
RUN mkdir -p /app/cache /app/logs

# Non-root user
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start server
CMD ["node", "dist/server.js"]
