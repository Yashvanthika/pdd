import fs from 'node:fs';
import path from 'node:path';
import { appiumConfig, createCapabilities } from '../../config/appium.config.js';
import { ensureDir } from './fileSystem.js';
import { logger } from './logger.js';

const elementKey = 'element-6066-11e4-a52e-4f735466cecf';

function joinServerPath(baseUrl, resourcePath) {
  const url = new URL(baseUrl);
  const basePath = url.pathname.replace(/\/+$/, '');
  url.pathname = `${basePath}${resourcePath}`;
  return url.toString();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function responseValue(payload) {
  return payload?.value === undefined ? payload : payload.value;
}

function toElementId(element) {
  if (typeof element === 'string') return element;
  return element?.[elementKey] || element?.ELEMENT || element?.elementId;
}

function errorMessage(method, resourcePath, payload, status) {
  const value = payload?.value || payload || {};
  return `${method} ${resourcePath} failed with ${status}: ${value.message || value.error || JSON.stringify(value)}`;
}

export class AppiumDriver {
  constructor({ sessionId, serverUrl, capabilities }) {
    this.capabilities = capabilities;
    this.sessionId = sessionId;
    this.serverUrl = serverUrl;
  }

  async request(method, resourcePath, body = undefined, { allowFailure = false } = {}) {
    const response = await fetch(joinServerPath(this.serverUrl, resourcePath), {
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      method,
    });

    const text = await response.text();
    const payload = text ? JSON.parse(text) : {};

    if (!response.ok) {
      const message = errorMessage(method, resourcePath, payload, response.status);
      if (allowFailure) {
        logger.warn(message);
        return undefined;
      }
      throw new Error(message);
    }

    return responseValue(payload);
  }

  async deleteSession() {
    if (!this.sessionId) return;
    await this.request('DELETE', `/session/${this.sessionId}`, undefined, { allowFailure: true });
    this.sessionId = '';
  }

  async findElement(using, value, timeoutMs = appiumConfig.waitTimeoutMs) {
    const startedAt = Date.now();
    let lastError;

    while (Date.now() - startedAt <= timeoutMs) {
      try {
        return await this.request('POST', `/session/${this.sessionId}/element`, { using, value });
      } catch (error) {
        lastError = error;
        await sleep(500);
      }
    }

    throw lastError || new Error(`Element not found by ${using}: ${value}`);
  }

  async findElements(using, value) {
    return this.request('POST', `/session/${this.sessionId}/elements`, { using, value });
  }

  async click(element) {
    return this.request('POST', `/session/${this.sessionId}/element/${toElementId(element)}/click`, {});
  }

  async clear(element) {
    return this.request('POST', `/session/${this.sessionId}/element/${toElementId(element)}/clear`, {}, { allowFailure: true });
  }

  async setValue(element, value) {
    await this.clear(element);
    return this.request('POST', `/session/${this.sessionId}/element/${toElementId(element)}/value`, {
      text: String(value),
      value: [...String(value)],
    });
  }

  async getText(element) {
    return this.request('GET', `/session/${this.sessionId}/element/${toElementId(element)}/text`);
  }

  async isDisplayed(element) {
    return this.request('GET', `/session/${this.sessionId}/element/${toElementId(element)}/displayed`);
  }

  async back() {
    return this.request('POST', `/session/${this.sessionId}/back`, {});
  }

  async hideKeyboard() {
    return this.request('POST', `/session/${this.sessionId}/appium/device/hide_keyboard`, {}, { allowFailure: true });
  }

  async pressKeyCode(keycode) {
    return this.request('POST', `/session/${this.sessionId}/appium/device/press_keycode`, { keycode });
  }

  async getPageSource() {
    return this.request('GET', `/session/${this.sessionId}/source`);
  }

  async takeScreenshot() {
    return this.request('GET', `/session/${this.sessionId}/screenshot`);
  }

  async saveScreenshot(filePath) {
    const base64Image = await this.takeScreenshot();
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, Buffer.from(base64Image, 'base64'));
    return filePath;
  }

  async getCurrentActivity() {
    return this.request('GET', `/session/${this.sessionId}/appium/device/current_activity`, undefined, { allowFailure: true });
  }

  async terminateApp(appId = appiumConfig.app.packageName) {
    return this.request('POST', `/session/${this.sessionId}/appium/device/terminate_app`, { appId }, { allowFailure: true });
  }

  async activateApp(appId = appiumConfig.app.packageName) {
    return this.request('POST', `/session/${this.sessionId}/appium/device/activate_app`, { appId });
  }

  async executeScript(script, args = []) {
    return this.request('POST', `/session/${this.sessionId}/execute/sync`, { args, script });
  }

  async getWindowRect() {
    return this.request('GET', `/session/${this.sessionId}/window/rect`);
  }
}

export async function createDriver(device) {
  const capabilities = createCapabilities(device);
  logger.info(`Creating Appium session for ${capabilities['appium:deviceName']} at ${appiumConfig.serverUrl}`);

  const response = await fetch(joinServerPath(appiumConfig.serverUrl, '/session'), {
    body: JSON.stringify({
      capabilities: {
        alwaysMatch: capabilities,
        firstMatch: [{}],
      },
    }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(errorMessage('POST', '/session', payload, response.status));
  }

  const value = responseValue(payload);
  const sessionId = value.sessionId || payload.sessionId;

  if (!sessionId) {
    throw new Error(`Appium did not return a session id: ${JSON.stringify(payload)}`);
  }

  return new AppiumDriver({
    capabilities: value.capabilities || capabilities,
    serverUrl: appiumConfig.serverUrl,
    sessionId,
  });
}
