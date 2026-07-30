import path from 'node:path';
import winston from 'winston';
import { loadConfig } from '../../config/load.config.js';
import { ensureDir } from '../fileSystem.js';

ensureDir(loadConfig.artifacts.logsDir);

export const loadLogger = winston.createLogger({
  defaultMeta: {
    service: 'load-test',
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  level: process.env.LOAD_TEST_LOG_LEVEL || 'info',
  transports: [
    new winston.transports.File({
      filename: path.join(loadConfig.artifacts.logsDir, 'load-test.log'),
      maxFiles: 5,
      maxsize: 5 * 1024 * 1024,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      silent: process.env.LOAD_TEST_SILENT_LOGS === 'true',
    }),
  ],
});
