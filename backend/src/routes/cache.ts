/**
 * Cache management routes
 */

import { Router, Request, Response } from 'express';
import { cache } from '../cache/fileCache';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/cache/purge
 * Purge all cached data
 */
router.post('/purge', async (_req: Request, res: Response) => {
  try {
    await cache.purge();
    logger.info('Cache purged successfully');
    res.json({
      message: 'Cache purged successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache purge error:', error);
    throw error;
  }
});

/**
 * POST /api/cache/clean
 * Clean expired cache entries
 */
router.post('/clean', async (_req: Request, res: Response) => {
  try {
    await cache.clean();
    logger.info('Expired cache entries cleaned');
    res.json({
      message: 'Expired cache entries cleaned',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache clean error:', error);
    throw error;
  }
});

export default router;
