import path from 'node:path';
import winston from 'winston';
import { seleniumConfig } from '../config/selenium.config.js';
import { ensureDir } from './fileSystem.js';

ensureDir(seleniumConfig.artifacts.logsDir);

export const logger = winston.createLogger({
  defaultMeta: {
    service: 'selenium-e2e',
  },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  level: process.env.E2E_LOG_LEVEL || 'info',
  transports: [
    new winston.transports.File({
      filename: path.join(seleniumConfig.artifacts.logsDir, 'selenium-e2e.log'),
      maxFiles: 5,
      maxsize: 5 * 1024 * 1024,
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      silent: process.env.E2E_SILENT_LOGS === 'true',
    }),
  ],
});
