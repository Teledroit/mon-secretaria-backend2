import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    const { logger } = require('../logger');
    expect(logger).toBeDefined();
  });

  it('should have debug, info, warn, and error methods', () => {
    const { logger } = require('../logger');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should store logs', () => {
    const { logger } = require('../logger');
    logger.clearLogs();
    logger.error('Test error', new Error('test'));
    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThan(0);
  });

  it('should clear logs', () => {
    const { logger } = require('../logger');
    logger.error('Test error');
    logger.clearLogs();
    const logs = logger.getLogs();
    expect(logs.length).toBe(0);
  });
});
