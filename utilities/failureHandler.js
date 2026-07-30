import fs from 'node:fs';
import path from 'node:path';
import { seleniumConfig } from '../config/selenium.config.js';
import { ensureDir, toSafeFileName, writeJson } from './fileSystem.js';

async function collectBrowserLogs(driver) {
  try {
    return await driver.manage().logs().get('browser');
  } catch (error) {
    return [{
      level: { name: 'UNAVAILABLE' },
      message: error.message,
      timestamp: Date.now(),
    }];
  }
}

export async function captureFailure({ browser, driver, error, testCase }) {
  ensureDir(seleniumConfig.artifacts.failuresDir);
  ensureDir(seleniumConfig.artifacts.screenshotsDir);

  const safeName = toSafeFileName(`${testCase.id}-${browser}`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(seleniumConfig.artifacts.screenshotsDir, `${safeName}-${timestamp}.png`);
  const failureJsonPath = path.join(seleniumConfig.artifacts.failuresDir, `${safeName}-${timestamp}.json`);
  let currentUrl = '';

  try {
    currentUrl = await driver.getCurrentUrl();
  } catch {
    currentUrl = '';
  }

  try {
    const image = await driver.takeScreenshot();
    fs.writeFileSync(screenshotPath, image, 'base64');
  } catch {
    // Keep the JSON failure useful even if screenshot capture is unavailable.
  }

  const browserLogs = await collectBrowserLogs(driver);
  const failure = {
    browser,
    consoleLogs: browserLogs.map((entry) => ({
      level: entry.level?.name || String(entry.level || ''),
      message: entry.message,
      timestamp: entry.timestamp,
    })),
    currentUrl,
    failureReason: error.message,
    screenshotPath,
    stack: error.stack,
    testCase,
    timestamp: new Date().toISOString(),
  };

  writeJson(failureJsonPath, failure);
  return {
    ...failure,
    failureJsonPath,
  };
}
