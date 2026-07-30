import { appiumConfig } from '../../config/appium.config.js';
import { sleep, textXPath } from './waitUtils.js';

async function windowRect(driver) {
  const rect = await driver.getWindowRect();
  return {
    height: rect.height || 1920,
    width: rect.width || 1080,
    x: rect.x || 0,
    y: rect.y || 0,
  };
}

export async function scrollDown(driver, percent = 0.75) {
  const rect = await windowRect(driver);
  return driver.executeScript('mobile: scrollGesture', [{
    direction: 'down',
    height: Math.floor(rect.height * 0.7),
    left: Math.floor(rect.width * 0.1),
    percent,
    top: Math.floor(rect.height * 0.15),
    width: Math.floor(rect.width * 0.8),
  }]);
}

export async function scrollUp(driver, percent = 0.75) {
  const rect = await windowRect(driver);
  return driver.executeScript('mobile: scrollGesture', [{
    direction: 'up',
    height: Math.floor(rect.height * 0.7),
    left: Math.floor(rect.width * 0.1),
    percent,
    top: Math.floor(rect.height * 0.15),
    width: Math.floor(rect.width * 0.8),
  }]);
}

export async function scrollToText(driver, text, maxScrolls = 6) {
  for (let attempt = 0; attempt <= maxScrolls; attempt += 1) {
    const matches = await driver.findElements('xpath', textXPath(text));
    if (matches.length > 0) return matches[0];
    await scrollDown(driver);
    await sleep(400);
  }

  throw new Error(`Could not scroll to visible text: ${text}`);
}

export async function tapCenter(driver) {
  const rect = await windowRect(driver);
  return driver.executeScript('mobile: clickGesture', [{
    x: Math.floor(rect.width / 2),
    y: Math.floor(rect.height / 2),
  }]);
}

export async function longPressText(driver, text, durationMs = 800) {
  const element = await driver.findElement('xpath', textXPath(text), appiumConfig.waitTimeoutMs);
  return driver.executeScript('mobile: longClickGesture', [{
    elementId: element['element-6066-11e4-a52e-4f735466cecf'] || element.ELEMENT,
    duration: durationMs,
  }]);
}
