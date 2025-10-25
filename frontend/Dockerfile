# Multi-stage build for Dynamic Stock Analyzer frontend

# Stage 1: Build React application
FROM node:18-bullseye AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY src ./src
COPY public ./public

# Build argument for API URL
ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Build application
RUN npm run build

# Stage 2: Production nginx server
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Enable gzip compression \
    gzip on; \
    gzip_vary on; \
    gzip_min_length 1000; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript; \
    \
    # SPA routing - serve index.html for all routes \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache static assets \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # Security headers \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
