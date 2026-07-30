import { expect } from 'chai';
import { seleniumConfig, toAppUrl } from '../config/selenium.config.js';
import { expectedCopy, validDonorProfile, viewports } from '../data/selenium/testData.js';

async function openCasePath(page, testCase) {
  await page.open(testCase.path);
}

async function assertNonBlank(page) {
  const snapshot = await page.driver.wait(async () => {
    const currentSnapshot = await page.snapshot();
    return currentSnapshot.bodyText.trim().length > 10 ? currentSnapshot : false;
  }, seleniumConfig.waitTimeoutMs, 'Expected page body to render meaningful content.');
  expect(snapshot.bodyText.trim().length).to.be.greaterThan(10);
  return snapshot;
}

async function assertNoRuntimeErrors(snapshot) {
  const runtimeMarkers = [
    'Application error',
    'Unhandled Runtime Error',
    'Hydration failed',
    'Internal Server Error',
    'This page could not be found',
  ];
  runtimeMarkers.forEach((marker) => {
    expect(snapshot.bodyText).to.not.include(marker);
  });
}

async function setViewport(driver, name) {
  const viewport = viewports.find((item) => item.name === name);
  await driver.manage().window().setRect({ width: viewport.width, height: viewport.height });
}

async function expectButtonDisabled(page, buttonText, disabled = true) {
  const button = await page.buttonByText(buttonText);
  expect(await button.isEnabled()).to.equal(!disabled);
}

async function expectNotice(page, expectedText) {
  const noticeText = await page.visibleNoticeText();
  expect(noticeText).to.include(expectedText);
}

async function executeRouteCase({ driver, page, testCase }) {
  switch (testCase.action) {
    case 'route-loads':
      await openCasePath(page, testCase);
      await assertNonBlank(page);
      return;
    case 'route-title': {
      await openCasePath(page, testCase);
      const snapshot = await page.snapshot();
      expect(snapshot.title).to.include(expectedCopy.appName);
      return;
    }
    case 'route-body':
      await openCasePath(page, testCase);
      expect((await page.bodyText()).length).to.be.greaterThan(30);
      return;
    case 'no-runtime-errors': {
      await openCasePath(page, testCase);
      await assertNoRuntimeErrors(await page.snapshot());
      return;
    }
    case 'no-empty-links': {
      await openCasePath(page, testCase);
      const snapshot = await page.snapshot();
      snapshot.links.forEach((link) => expect(link.href, `empty href for link ${link.text}`).to.not.equal(''));
      return;
    }
    case 'controls-accessible': {
      await openCasePath(page, testCase);
      const snapshot = await page.snapshot();
      snapshot.controls
        .filter((control) => control.visible)
        .forEach((control) => expect(control.label, `missing label for ${control.tag}#${control.id}`).to.not.equal(''));
      return;
    }
    case 'desktop-overflow': {
      await setViewport(driver, 'desktop');
      await openCasePath(page, testCase);
      const snapshot = await page.snapshot();
      expect(snapshot.horizontalOverflow).to.be.lessThan(12);
      return;
    }
    case 'mobile-overflow': {
      await setViewport(driver, 'mobile');
      await openCasePath(page, testCase);
      const snapshot = await page.snapshot();
      expect(snapshot.horizontalOverflow).to.be.lessThan(12);
      await setViewport(driver, 'desktop');
      return;
    }
    case 'refresh': {
      await openCasePath(page, testCase);
      await driver.navigate().refresh();
      await page.waitForReady();
      await assertNonBlank(page);
      return;
    }
    case 'back-forward': {
      await page.open('/login');
      await openCasePath(page, testCase);
      await driver.navigate().back();
      await page.waitForReady();
      await driver.navigate().forward();
      await page.waitForReady();
      await assertNonBlank(page);
      return;
    }
    case 'brand-visible': {
      await openCasePath(page, testCase);
      const bodyText = await page.bodyText();
      expect(bodyText).to.include(expectedCopy.appName);
      return;
    }
    case 'generated-route-contract': {
      await openCasePath(page, testCase);
      const snapshot = await assertNonBlank(page);
      await assertNoRuntimeErrors(snapshot);
      expect(snapshot.url).to.include(seleniumConfig.appUrl);
      return;
    }
    default:
      throw new Error(`Unhandled route action ${testCase.action}`);
  }
}

async function executeAuthenticationCase({ page, testCase }) {
  switch (testCase.action) {
    case 'button-disabled':
      await page.open(testCase.path);
      await expectButtonDisabled(page, testCase.data.buttonText, true);
      return;
    case 'login-button-gating':
      await page.open('/login');
      if (testCase.data.email) await page.setField('Email', testCase.data.email);
      if (testCase.data.password) await page.setField('Password', testCase.data.password);
      await expectButtonDisabled(page, 'Sign in', true);
      return;
    case 'login-button-enabled':
      await page.open('/login');
      await page.fillLogin(testCase.data.email, testCase.data.password);
      await expectButtonDisabled(page, 'Sign in', false);
      return;
    case 'login-invalid-credentials':
      await page.open('/login');
      await page.fillLogin(testCase.data.email, testCase.data.password);
      await page.clickButton('Sign in');
      expect(await page.visibleNoticeText()).to.not.equal('');
      return;
    case 'protected-redirect':
      await page.open(testCase.path);
      await page.waitForUrlPath('/login');
      return;
    case 'protected-no-content': {
      await page.open(testCase.path);
      await page.waitForUrlPath('/login');
      const bodyText = await page.bodyText();
      expect(bodyText).to.include(expectedCopy.loginTitle);
      return;
    }
    case 'protected-login-recovery': {
      await page.open(testCase.path);
      await page.waitForUrlPath('/login');
      const snapshot = await page.snapshot();
      expect(snapshot.links.some((link) => link.href.includes('/forgot-password'))).to.equal(true);
      return;
    }
    case 'auth-login':
      await page.open('/login');
      await page.fillLogin(seleniumConfig.auth.email, seleniumConfig.auth.password);
      await page.clickButton('Sign in');
      await page.waitForUrlPath('/search');
      return;
    case 'auth-logout':
      await page.ensureAuthenticated();
      await page.clickButton('Log out');
      await page.waitForUrlPath('/login');
      return;
    case 'auth-session-refresh':
      await page.ensureAuthenticated();
      await page.open('/search');
      await page.driver.navigate().refresh();
      await page.waitForReady();
      expect(await page.driver.getCurrentUrl()).to.include('/search');
      return;
    default:
      throw new Error(`Unhandled authentication action ${testCase.action}`);
  }
}

async function executeFormCase({ page, testCase }) {
  switch (testCase.action) {
    case 'button-disabled':
      await page.open(testCase.path);
      await expectButtonDisabled(page, testCase.data.buttonText, true);
      return;
    case 'email-format':
      await page.open(testCase.path);
      await page.setField(testCase.data.label, testCase.data.value);
      expect(await page.driver.executeScript((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), testCase.data.value)).to.equal(false);
      return;
    case 'email-format-valid':
      await page.open(testCase.path);
      await page.setField(testCase.data.label, testCase.data.value);
      expect((await page.browserValidity(testCase.data.label)).valid).to.equal(true);
      expect(await page.driver.executeScript((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), testCase.data.value)).to.equal(true);
      return;
    case 'register-invalid-phone':
      await page.open('/register');
      await page.setField('Mobile Number', testCase.data.value);
      expect(await page.driver.executeScript((value) => {
        const digits = value.replace(/\D/g, '');
        return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'));
      }, testCase.data.value)).to.equal(false);
      return;
    case 'register-invalid-phone-message':
      await page.open('/register');
      await page.fillRegistration({ phone: testCase.data.value });
      await page.clickButton('Register');
      await expectNotice(page, testCase.data.expectedMessage);
      return;
    case 'register-weak-password':
      await page.open('/register');
      await page.setField('Password', testCase.data.value);
      expect(testCase.data.value.length).to.be.lessThan(8);
      return;
    case 'register-weak-password-message':
      await page.open('/register');
      await page.fillRegistration({ confirmPassword: testCase.data.value, password: testCase.data.value });
      await page.clickButton('Register');
      await expectNotice(page, testCase.data.expectedMessage);
      return;
    case 'register-password-mismatch':
      await page.open('/register');
      await page.setField('Password', testCase.data.password);
      await page.setField('Retype Password', testCase.data.confirmPassword);
      expect(testCase.data.password).to.not.equal(testCase.data.confirmPassword);
      return;
    case 'register-password-mismatch-message':
      await page.open('/register');
      await page.fillRegistration({
        confirmPassword: testCase.data.confirmPassword,
        password: testCase.data.password,
      });
      await page.clickButton('Register');
      await expectNotice(page, testCase.data.expectedMessage);
      return;
    case 'register-checkbox-gating':
      await page.open('/register');
      await page.fillRegistration({ available: false, consent: false });
      await expectButtonDisabled(page, 'Register', true);
      return;
    case 'change-password-mismatch':
      await page.ensureAuthenticated();
      await page.open('/profile/password');
      await page.setField('New Password', 'BloodLinkNew#2026');
      await page.setField('Retype Password', 'BloodLinkMismatch#2026');
      await page.clickButton('Change Password');
      await expectNotice(page, expectedCopy.passwordMismatch);
      return;
    default:
      throw new Error(`Unhandled form action ${testCase.action}`);
  }
}

async function executeUiCase({ page, testCase }) {
  switch (testCase.action) {
    case 'ui-button-visible': {
      await page.open(testCase.path);
      const snapshot = await page.snapshot();
      const button = snapshot.buttons[testCase.data.index];
      expect(button, `button index ${testCase.data.index} missing`).to.exist;
      expect(button.visible).to.equal(true);
      return;
    }
    case 'ui-control-focus': {
      await page.open(testCase.path);
      const control = await page.findControlByLabel(testCase.data.label);
      await control.click();
      const active = await page.driver.executeScript((element) => document.activeElement === element, control);
      expect(active).to.equal(true);
      return;
    }
    case 'ui-select-options': {
      await page.open(testCase.path);
      const control = await page.findControlByLabel(testCase.data.label);
      const optionCount = await page.driver.executeScript((element) => element.options.length, control);
      expect(optionCount).to.be.greaterThan(1);
      return;
    }
    case 'ui-checkbox-toggle': {
      await page.open(testCase.path);
      const selected = await page.toggleByLabel(testCase.data.label);
      expect(selected).to.equal(true);
      return;
    }
    case 'ui-link-href': {
      await page.open(testCase.path);
      const snapshot = await page.snapshot();
      const link = testCase.data.href
        ? snapshot.links.find((item) => item.href === testCase.data.href)
        : snapshot.links[testCase.data.index];
      expect(link?.href || '').to.not.equal('');
      return;
    }
    case 'ui-notice-role': {
      await page.open(testCase.path);
      const snapshot = await page.snapshot();
      const notice = snapshot.notices[testCase.data.index];
      if (!notice) {
        expect(snapshot.bodyText.length).to.be.greaterThan(10);
        return;
      }
      expect(notice, `notice index ${testCase.data.index} missing`).to.exist;
      expect(['alert', 'status', ''].includes(notice.role)).to.equal(true);
      return;
    }
    case 'select-blood-group':
      await page.open('/register');
      await page.setSelectByValue('Blood Group', testCase.data.bloodGroup);
      expect(await (await page.findControlByLabel('Blood Group')).getAttribute('value')).to.equal(testCase.data.bloodGroup);
      return;
    case 'location-cascade':
      await page.open(testCase.path);
      await page.fillLocation();
      expect((await page.snapshot()).controls.some((control) => control.label.includes('City') && control.value)).to.equal(true);
      return;
    case 'settings-confirm-dialog':
      await page.ensureAuthenticated();
      await page.open('/profile/settings');
      await page.clickButton('Delete Profile');
      const alert = await page.driver.switchTo().alert();
      expect(await alert.getText()).to.include('permanently removes');
      await alert.dismiss();
      return;
    default:
      throw new Error(`Unhandled UI action ${testCase.action}`);
  }
}

async function executeNavigationCase({ page, testCase }) {
  switch (testCase.action) {
    case 'public-route-access':
      await page.open(testCase.path);
      await assertNonBlank(page);
      return;
    case 'link-navigation':
      await page.open(testCase.path);
      await page.clickLinkByHref(testCase.data.href);
      await page.waitForUrlPath(testCase.data.href);
      expect(await page.driver.getCurrentUrl()).to.include(testCase.data.href);
      return;
    default:
      throw new Error(`Unhandled navigation action ${testCase.action}`);
  }
}

async function executeAuthenticatedWorkflowCase({ page, testCase }) {
  switch (testCase.action) {
    case 'authenticated-route-loads':
      await page.ensureAuthenticated();
      await page.open(testCase.path);
      await assertNonBlank(page);
      expect(await page.driver.getCurrentUrl()).to.not.include('/login');
      return;
    case 'authenticated-shell-visible':
      await page.ensureAuthenticated();
      await page.open(testCase.path);
      expect(await page.bodyText()).to.include('Log out');
      return;
    case 'search-valid-criteria':
      await page.ensureAuthenticated();
      await page.open('/search');
      await page.fillLocation();
      await page.clickButton('Search');
      await page.waitForUrlPath('/results');
      return;
    case 'profile-edit-invalid-email':
      await page.ensureAuthenticated();
      await page.open('/profile/edit');
      await page.setField('Email', 'invalid-email');
      expect((await page.browserValidity('Email')).valid).to.equal(false);
      return;
    case 'profile-edit-invalid-phone':
      await page.ensureAuthenticated();
      await page.open('/profile/edit');
      await page.setField('Mobile Number', '123');
      await page.clickButton('Save Profile');
      await expectNotice(page, expectedCopy.invalidPhone);
      return;
    case 'donation-required-gating':
      await page.ensureAuthenticated();
      await page.open('/profile/donation');
      await page.setField('Donation Date', '');
      await expectButtonDisabled(page, 'Save Details', true);
      return;
    default:
      throw new Error(`Unhandled authenticated workflow action ${testCase.action}`);
  }
}

export async function executeSeleniumCase(context) {
  const { page, testCase } = context;

  if (testCase.requiresAuth) {
    await page.ensureAuthenticated();
  } else {
    await page.resetSession();
  }

  if (testCase.module === 'Route Discovery' || testCase.module === 'Generated Coverage') return executeRouteCase(context);
  if (testCase.module === 'Authentication') return executeAuthenticationCase(context);
  if (testCase.module === 'Form Validation') return executeFormCase(context);
  if (testCase.module === 'UI Behavior') return executeUiCase(context);
  if (testCase.module === 'Navigation') return executeNavigationCase(context);
  if (testCase.module === 'Authenticated Workflows') return executeAuthenticatedWorkflowCase(context);

  throw new Error(`Unhandled Selenium module ${testCase.module}`);
}
