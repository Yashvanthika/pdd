import path from 'node:path';
import { appiumConfig } from '../../config/appium.config.js';
import { captureLogcat, getCurrentActivity } from './deviceManager.js';
import { ensureDir, safeFileName, writeText } from './fileSystem.js';
import { logger } from './logger.js';

export async function captureFailureArtifacts({ device, driver, error, testCase }) {
  ensureDir(appiumConfig.artifacts.failuresDir);
  ensureDir(appiumConfig.artifacts.screenshotsDir);

  const baseName = `${safeFileName(testCase.id)}-${safeFileName(device?.udid || device?.deviceName || 'device')}`;
  const screenshotPath = path.join(appiumConfig.artifacts.screenshotsDir, `${baseName}.png`);
  const pageSourcePath = path.join(appiumConfig.artifacts.failuresDir, `${baseName}.xml`);
  let activity = '';
  let logcatPath = '';

  try {
    if (driver) {
      await driver.saveScreenshot(screenshotPath);
      const source = await driver.getPageSource();
      writeText(pageSourcePath, source || '');
      activity = await driver.getCurrentActivity();
    }
  } catch (artifactError) {
    logger.warn(`Unable to capture Appium screenshot/source: ${artifactError.message}`);
  }

  try {
    logcatPath = captureLogcat(device, testCase);
    activity = activity || getCurrentActivity(device);
  } catch (logError) {
    logger.warn(`Unable to capture logcat/current activity: ${logError.message}`);
  }

  return {
    activity,
    failureReason: error?.message || String(error),
    logcatPath,
    pageSourcePath,
    screenshotPath,
    stack: error?.stack || '',
  };
}
