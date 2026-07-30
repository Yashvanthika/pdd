import path from 'node:path';
import winston from 'winston';
import { appiumConfig } from '../../config/appium.config.js';
import { ensureDir } from './fileSystem.js';

ensureDir(appiumConfig.artifacts.logsDir);

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`),
  ),
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({ silent: process.env.APPIUM_SILENT_LOGS === 'true' }),
    new winston.transports.File({ filename: path.join(appiumConfig.artifacts.logsDir, 'appium-e2e.log') }),
  ],
});
