/**
 * File-based cache with TTL support
 * 
 * Stores cache entries as JSON files in the cache directory.
 * Automatically expires entries based on TTL.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { CacheEntry } from '../types';
import { logger } from '../utils/logger';

export class FileCache {
  private cacheDir: string;
  private defaultTTL: number; // milliseconds

  constructor(cacheDir: string = './cache', defaultTTL: number = 3600000) {
    this.cacheDir = cacheDir;
    this.defaultTTL = defaultTTL; // Default 1 hour
  }

  async init(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      logger.info(`Cache directory initialized: ${this.cacheDir}`);
    } catch (error) {
      logger.error('Failed to initialize cache directory:', error);
      throw error;
    }
  }

  private generateKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private getFilePath(key: string): string {
    const hashedKey = this.generateKey(key);
    return path.join(this.cacheDir, `${hashedKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(data);

      // Check if expired
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        logger.debug(`Cache expired for key: ${key}`);
        await this.delete(key);
        return null;
      }

      logger.debug(`Cache hit for key: ${key}`);
      return entry.data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.debug(`Cache miss for key: ${key}`);
        return null;
      }
      logger.error('Error reading cache:', error);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const filePath = this.getFilePath(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };

    try {
      await fs.writeFile(filePath, JSON.stringify(entry), 'utf-8');
      logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
      logger.error('Error writing cache:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
      logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.error('Error deleting cache:', error);
      }
    }
  }

  async purge(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      );
      logger.info('Cache purged successfully');
    } catch (error) {
      logger.error('Error purging cache:', error);
      throw error;
    }
  }

  async clean(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        try {
          const data = await fs.readFile(filePath, 'utf-8');
          const entry: CacheEntry<unknown> = JSON.parse(data);

          if (now - entry.timestamp > entry.ttl) {
            await fs.unlink(filePath);
            logger.debug(`Cleaned expired cache file: ${file}`);
          }
        } catch (error) {
          logger.warn(`Failed to clean cache file ${file}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error cleaning cache:', error);
    }
  }
}

export const cache = new FileCache();
