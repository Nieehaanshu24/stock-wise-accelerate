/**
 * Jest setup file
 * Configure test environment and global mocks
 */

// Mock logger to suppress console output during tests
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATA_PROVIDER = 'yahoo';
