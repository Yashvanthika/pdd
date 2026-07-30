import { expect } from 'chai';
import { appiumConfig } from '../../config/appium.config.js';
import { expectVisibleByAccessibilityId, expectVisibleByText, textXPath, waitForAnyText } from '../../utilities/appium/waitUtils.js';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async source() {
    return this.driver.getPageSource();
  }

  async hasText(text) {
    const source = await this.source();
    return source.includes(text);
  }

  async byText(text, timeoutMs = appiumConfig.waitTimeoutMs) {
    return this.driver.findElement('xpath', textXPath(text), timeoutMs);
  }

  async byAccessibilityId(label, timeoutMs = appiumConfig.waitTimeoutMs) {
    try {
      return await this.driver.findElement('accessibility id', label, timeoutMs);
    } catch {
      return this.byText(label, timeoutMs);
    }
  }

  async tap(label, timeoutMs = appiumConfig.waitTimeoutMs) {
    const element = await this.byAccessibilityId(label, timeoutMs);
    await this.driver.click(element);
    return element;
  }

  async type(label, value, timeoutMs = appiumConfig.waitTimeoutMs) {
    const element = await this.byAccessibilityId(label, timeoutMs);
    await this.driver.setValue(element, value);
    await this.driver.hideKeyboard();
    return element;
  }

  async expectText(text, timeoutMs = appiumConfig.waitTimeoutMs) {
    return expectVisibleByText(this.driver, text, timeoutMs);
  }

  async expectA11y(label, timeoutMs = appiumConfig.waitTimeoutMs) {
    return expectVisibleByAccessibilityId(this.driver, label, timeoutMs);
  }

  async expectAnyText(labels, timeoutMs = appiumConfig.waitTimeoutMs) {
    return waitForAnyText(this.driver, labels, timeoutMs);
  }

  async expectUsableSource() {
    const source = await this.source();
    expect(source.length).to.be.greaterThan(200);
    expect(source).to.not.include('Invariant Violation');
    expect(source).to.not.include('Unable to resolve module');
    return source;
  }

  async select(fieldLabel, optionLabel) {
    await this.tap(fieldLabel);
    await this.expectText(optionLabel);
    await this.tap(optionLabel);
  }

  async resetToLogin() {
    await this.driver.activateApp();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const source = await this.source();
      if (source.includes('BloodLink') && source.includes('Sign In')) return;
      await this.driver.back();
    }
  }
}
