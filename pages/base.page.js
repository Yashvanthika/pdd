import { By, until } from 'selenium-webdriver';
import { seleniumConfig, toAppUrl } from '../config/selenium.config.js';

export class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async open(routePath = '/') {
    await this.driver.get(toAppUrl(routePath));
    await this.waitForReady();
  }

  async waitForReady() {
    await this.driver.wait(async () => {
      const readyState = await this.driver.executeScript('return document.readyState;');
      return readyState === 'complete' || readyState === 'interactive';
    }, seleniumConfig.waitTimeoutMs);
  }

  async waitForUrlContaining(value) {
    await this.driver.wait(until.urlContains(value), seleniumConfig.waitTimeoutMs);
  }

  async snapshot() {
    return this.driver.executeScript(() => {
      const visibleText = (element) => (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      const labelFor = (element) => {
        if (element.labels && element.labels.length > 0) return visibleText(element.labels[0]);
        const id = element.getAttribute('id');
        if (id) {
          const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
          if (explicit) return visibleText(explicit);
        }
        return element.getAttribute('aria-label') || element.getAttribute('name') || element.getAttribute('placeholder') || id || '';
      };

      const controls = Array.from(document.querySelectorAll('input, select, textarea')).map((element) => ({
        disabled: element.disabled,
        id: element.id || '',
        label: labelFor(element),
        name: element.getAttribute('name') || '',
        options: element.tagName.toLowerCase() === 'select'
          ? Array.from(element.options).map((option) => ({ text: option.text, value: option.value }))
          : [],
        placeholder: element.getAttribute('placeholder') || '',
        required: element.required,
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute('type') || '',
        value: element.value || '',
        visible: Boolean(element.offsetParent || element.getClientRects().length),
      }));

      return {
        bodyText: visibleText(document.body),
        buttons: Array.from(document.querySelectorAll('button, [role="button"]')).map((element) => ({
          disabled: Boolean(element.disabled) || element.getAttribute('aria-disabled') === 'true',
          text: visibleText(element) || element.getAttribute('aria-label') || '',
          visible: Boolean(element.offsetParent || element.getClientRects().length),
        })),
        controls,
        forms: document.querySelectorAll('form').length,
        headings: Array.from(document.querySelectorAll('h1,h2,h3')).map(visibleText).filter(Boolean),
        horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
        links: Array.from(document.querySelectorAll('a')).map((element) => ({
          href: element.getAttribute('href') || '',
          text: visibleText(element),
          visible: Boolean(element.offsetParent || element.getClientRects().length),
        })),
        notices: Array.from(document.querySelectorAll('[role="alert"], [role="status"], .notice')).map((element) => ({
          role: element.getAttribute('role') || '',
          text: visibleText(element),
        })),
        title: document.title,
        url: window.location.href,
      };
    });
  }

  async bodyText() {
    const snapshot = await this.snapshot();
    return snapshot.bodyText;
  }

  async findControlByLabel(labelText) {
    const control = await this.driver.executeScript((label) => {
      const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const target = normalize(label);
      const controls = Array.from(document.querySelectorAll('input, select, textarea'));
      return controls.find((element) => {
        const labels = element.labels ? Array.from(element.labels).map((item) => item.innerText || item.textContent || '') : [];
        const candidates = [
          ...labels,
          element.getAttribute('aria-label'),
          element.getAttribute('name'),
          element.getAttribute('placeholder'),
          element.getAttribute('id'),
        ].filter(Boolean);
        return candidates.some((candidate) => normalize(candidate).includes(target));
      }) || null;
    }, labelText);

    if (!control) throw new Error(`Unable to find control with label "${labelText}".`);
    return control;
  }

  async setField(labelText, value) {
    const control = await this.findControlByLabel(labelText);
    await control.click();
    await control.clear();
    if (value) await control.sendKeys(value);
    return control;
  }

  async setSelectByValue(labelText, value) {
    const control = await this.findControlByLabel(labelText);
    const changed = await this.driver.executeScript((element, nextValue) => {
      element.value = nextValue;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return element.value;
    }, control, value);
    return changed;
  }

  async selectFirstRealOption(labelText) {
    const control = await this.findControlByLabel(labelText);
    const value = await this.driver.executeScript((element) => {
      const option = Array.from(element.options).find((item) => item.value);
      if (!option) return '';
      element.value = option.value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return option.value;
    }, control);
    if (!value) throw new Error(`No selectable option found for "${labelText}".`);
    return value;
  }

  async checkByLabel(labelText) {
    const control = await this.findControlByLabel(labelText);
    const checked = await control.isSelected();
    if (!checked) await control.click();
  }

  async toggleByLabel(labelText) {
    const control = await this.findControlByLabel(labelText);
    await control.click();
    return control.isSelected();
  }

  async buttonByText(text) {
    const button = await this.driver.executeScript((label) => {
      const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim().toLowerCase();
      return Array.from(document.querySelectorAll('button')).find((element) => normalize(element.innerText || element.textContent || element.getAttribute('aria-label')).includes(normalize(label))) || null;
    }, text);

    if (!button) throw new Error(`Unable to find button with text "${text}".`);
    return button;
  }

  async clickButton(text) {
    const button = await this.buttonByText(text);
    await button.click();
  }

  async clickLinkByHref(href) {
    const link = await this.driver.findElement(By.css(`a[href="${href}"]`));
    await link.click();
    await this.waitForReady();
  }

  async browserValidity(labelText) {
    const control = await this.findControlByLabel(labelText);
    return this.driver.executeScript((element) => ({
      message: element.validationMessage,
      valid: element.checkValidity(),
      value: element.value,
    }), control);
  }
}
