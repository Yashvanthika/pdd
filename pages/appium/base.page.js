import { expect } from 'chai';
import { appiumConfig } from '../../config/appium.config.js';
import { expectVisibleByText, textXPath, waitForAnyText } from '../../utilities/appium/waitUtils.js';

function xpathLiteral(value) {
  const text = String(value);
  if (!text.includes("'")) return `'${text}'`;
  if (!text.includes('"')) return `"${text}"`;
  return `concat('${text.replace(/'/g, "', \"'\", '")}')`;
}

const inputHints = {
  'Donation Date': ['YYYY-MM-DD'],
  Email: ['name@example.com'],
  'Facility / Organization': ['Facility name'],
  'Mobile Number': ['10 digit mobile number'],
  Password: ['Password', 'Minimum 8 characters'],
  'Registered email ID': ['name@example.com'],
  'Retype Password': ['Retype password'],
};

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
    const element = await this.inputByLabel(label, timeoutMs);
    await this.driver.setValue(element, value);
    await this.driver.hideKeyboard();
    return element;
  }

  async expectText(text, timeoutMs = appiumConfig.waitTimeoutMs) {
    return expectVisibleByText(this.driver, text, timeoutMs);
  }

  async expectA11y(label, timeoutMs = appiumConfig.waitTimeoutMs) {
    const element = await this.byAccessibilityId(label, timeoutMs);
    expect(await this.driver.isDisplayed(element)).to.equal(true);
    return element;
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

  async inputByLabel(label, timeoutMs = appiumConfig.waitTimeoutMs) {
    const literal = xpathLiteral(label);
    const locators = [
      ['accessibility id', label],
      ['xpath', `//android.widget.TextView[@text=${literal}]/following-sibling::android.widget.EditText[1]`],
      ['xpath', `//android.widget.EditText[@hint=${literal} or @text=${literal} or @content-desc=${literal}]`],
      ...(inputHints[label] || []).map((hint) => {
        const hintLiteral = xpathLiteral(hint);
        return ['xpath', `//android.widget.EditText[@hint=${hintLiteral} or @text=${hintLiteral}]`];
      }),
    ];

    let lastError;
    for (const [using, value] of locators) {
      try {
        return await this.driver.findElement(using, value, timeoutMs);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`Input not found for label ${label}`);
  }

  async resetToLogin() {
    await this.driver.activateApp();
    let source = await this.source();

    if (source.includes('BloodLink') && source.includes('Sign In')) {
      return;
    }

    await this.driver.terminateApp();
    await this.driver.activateApp();
    source = await this.source();

    if (!source.includes('BloodLink') || !source.includes('Sign In')) {
      throw new Error('BloodLink did not open to the login screen after app restart.');
    }
  }
}
