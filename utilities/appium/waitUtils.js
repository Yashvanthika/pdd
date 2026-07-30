import { expect } from 'chai';
import { appiumConfig } from '../../config/appium.config.js';

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitUntil(assertion, {
  intervalMs = 500,
  message = 'Timed out waiting for condition',
  timeoutMs = appiumConfig.waitTimeoutMs,
} = {}) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const result = await assertion();
      if (result) return result;
    } catch (error) {
      lastError = error;
    }

    await sleep(intervalMs);
  }

  throw lastError || new Error(message);
}

export function textXPath(text) {
  const escaped = String(text).replace(/'/g, "\\'");
  return `//*[contains(@text, '${escaped}') or contains(@content-desc, '${escaped}')]`;
}

export async function expectVisibleByText(driver, text, timeoutMs = appiumConfig.waitTimeoutMs) {
  const element = await driver.findElement('xpath', textXPath(text), timeoutMs);
  expect(await driver.isDisplayed(element)).to.equal(true);
  return element;
}

export async function expectVisibleByAccessibilityId(driver, label, timeoutMs = appiumConfig.waitTimeoutMs) {
  const element = await driver.findElement('accessibility id', label, timeoutMs);
  expect(await driver.isDisplayed(element)).to.equal(true);
  return element;
}

export async function waitForAnyText(driver, labels, timeoutMs = appiumConfig.waitTimeoutMs) {
  return waitUntil(async () => {
    const source = await driver.getPageSource();
    const found = labels.find((label) => source.includes(label));
    return found || false;
  }, {
    message: `Expected one of these labels to appear: ${labels.join(', ')}`,
    timeoutMs,
  });
}
