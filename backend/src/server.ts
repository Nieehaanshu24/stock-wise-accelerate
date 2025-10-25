/**
 * Express server with native C analysis modules
 */

import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { cache } from './cache/fileCache';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import stocksRoutes from './routes/stocks';
import analyzeRoutes from './routes/analyze';
import portfolioRoutes from './routes/portfolio';
import cacheRoutes from './routes/cache';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/stocks', stocksRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/cache', cacheRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Initialize cache and start server
async function startServer() {
  try {
    // Initialize file cache
    await cache.init();
    
    // Start cache cleanup interval (every hour)
    setInterval(() => {
      cache.clean().catch(err => logger.error('Cache cleanup error:', err));
    }, 3600000);

    // Check native module availability
    try {
      require('./native/dist/wrapper');
      logger.info('Native analysis module loaded successfully');
    } catch (error) {
      logger.warn('Native module not available. Compile with: cd native && npm run build');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Data Provider: ${process.env.DATA_PROVIDER || 'yahoo'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
startServer();

export default app;
