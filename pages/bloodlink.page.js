import { until } from 'selenium-webdriver';
import { seleniumConfig, toAppUrl } from '../config/selenium.config.js';
import { validDonorProfile } from '../data/selenium/testData.js';
import { BasePage } from './base.page.js';

export class BloodLinkPage extends BasePage {
  async resetSession() {
    await this.driver.get(toAppUrl('/login'));
    await this.waitForReady().catch(() => undefined);
    await this.driver.executeScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }).catch(() => undefined);
    await this.driver.manage().deleteAllCookies().catch(() => undefined);
  }

  async fillLogin(email, password) {
    await this.setField('Email', email);
    await this.setField('Password', password);
  }

  async ensureAuthenticated() {
    if (!seleniumConfig.auth.email || !seleniumConfig.auth.password) {
      throw new Error('Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run authenticated Selenium cases.');
    }

    await this.open('/login');
    const currentUrl = await this.driver.getCurrentUrl();
    if (currentUrl.includes('/search')) return;

    await this.fillLogin(seleniumConfig.auth.email, seleniumConfig.auth.password);
    await this.clickButton('Sign in');
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return url.includes('/search');
    }, seleniumConfig.waitTimeoutMs, 'Expected authenticated login to redirect to /search.');
  }

  async fillRegistration(overrides = {}) {
    const profile = { ...validDonorProfile, ...overrides };
    await this.setField('Full Name', profile.fullName);
    await this.setSelectByValue('Blood Group', profile.bloodGroup);
    await this.selectFirstRealOption('Year of Birth');
    await this.setField('Mobile Number', profile.phone);
    await this.setField('Email', profile.email);
    await this.setField('Password', profile.password);
    await this.setField('Retype Password', profile.confirmPassword);
    await this.fillLocation();

    if (profile.available !== false) {
      await this.checkByLabel('Available in case of emergency');
    }
    if (profile.consent !== false) {
      await this.checkByLabel('I authorize BloodLink to display my donor details');
    }
  }

  async fillLocation() {
    await this.selectFirstRealOption('State');
    await this.driver.wait(async () => {
      const snapshot = await this.snapshot();
      return snapshot.controls.some((control) => control.label.includes('District') && !control.disabled && control.options.some((option) => option.value));
    }, seleniumConfig.waitTimeoutMs);
    await this.selectFirstRealOption('District');
    await this.driver.wait(async () => {
      const snapshot = await this.snapshot();
      return snapshot.controls.some((control) => control.label.includes('City') && !control.disabled && control.options.some((option) => option.value));
    }, seleniumConfig.waitTimeoutMs);
    await this.selectFirstRealOption('City');
  }

  async visibleNoticeText() {
    await this.driver.wait(async () => {
      const snapshot = await this.snapshot();
      return snapshot.notices.length > 0;
    }, seleniumConfig.waitTimeoutMs);
    const snapshot = await this.snapshot();
    return snapshot.notices.map((notice) => notice.text).join(' ');
  }

  async waitForBodyContaining(text) {
    await this.driver.wait(async () => {
      const bodyText = await this.bodyText();
      return bodyText.includes(text);
    }, seleniumConfig.waitTimeoutMs);
  }

  async waitForUrlPath(path) {
    await this.driver.wait(until.urlContains(path), seleniumConfig.waitTimeoutMs);
  }
}
