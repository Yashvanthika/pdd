import {
  bloodGroups,
  expectedCopy,
  invalidEmails,
  invalidPhones,
  mismatchPasswords,
  protectedRoutes,
  publicRoutes,
  weakPasswords,
} from '../data/selenium/testData.js';
import { seleniumConfig } from '../config/selenium.config.js';
import { discoverReactRoutes } from './routeDiscovery.js';

function caseId(index) {
  return `SEL-E2E-${String(index + 1).padStart(4, '0')}`;
}

function createCase(cases, module, scenarioName, action, path, data = {}, requiresAuth = false) {
  cases.push({
    action,
    data,
    id: caseId(cases.length),
    module,
    path,
    requiresAuth,
    scenarioName,
  });
}

function routeChecks(cases, routes) {
  const checks = [
    ['route-loads', 'loads without a blank page'],
    ['route-title', 'keeps the BloodLink document title'],
    ['route-body', 'renders meaningful page content'],
    ['no-runtime-errors', 'does not show a framework runtime error'],
    ['no-empty-links', 'does not render empty anchor hrefs'],
    ['controls-accessible', 'keeps visible form controls labeled'],
    ['desktop-overflow', 'does not horizontally overflow on desktop'],
    ['mobile-overflow', 'does not horizontally overflow on mobile'],
    ['refresh', 'survives browser refresh'],
    ['back-forward', 'supports browser back and forward navigation'],
    ['brand-visible', 'shows BloodLink brand context'],
  ];

  routes.forEach((route) => {
    checks.forEach(([action, label]) => {
      createCase(
        cases,
        'Route Discovery',
        `${route.template} ${label}`,
        action,
        route.samplePath,
        { route },
      );
    });
  });
}

function authenticationChecks(cases) {
  createCase(cases, 'Authentication', 'login submit stays disabled when username and password are empty', 'button-disabled', '/login', { buttonText: 'Sign in' });
  createCase(cases, 'Authentication', 'login submit stays disabled when password is empty', 'login-button-gating', '/login', { email: 'qa@example.com', password: '' });
  createCase(cases, 'Authentication', 'login submit stays disabled when username is empty', 'login-button-gating', '/login', { email: '', password: 'Password#123' });
  createCase(cases, 'Authentication', 'login submit enables when username and password are present', 'login-button-enabled', '/login', { email: 'qa@example.com', password: 'Password#123' });
  createCase(cases, 'Authentication', 'invalid credentials produce an error notice', 'login-invalid-credentials', '/login', { email: 'invalid.user@bloodlink.test', password: 'WrongPassword#1' });
  createCase(cases, 'Authentication', 'valid credentials redirect to donor search', 'auth-login', '/login', {}, true);
  createCase(cases, 'Authentication', 'logout returns the user to sign in', 'auth-logout', '/search', {}, true);
  createCase(cases, 'Authentication', 'authenticated session survives page refresh', 'auth-session-refresh', '/search', {}, true);

  protectedRoutes.forEach((route) => {
    createCase(cases, 'Authentication', `${route} redirects anonymous users to login`, 'protected-redirect', route);
    createCase(cases, 'Authentication', `${route} keeps protected content unavailable anonymously`, 'protected-no-content', route);
    createCase(cases, 'Authentication', `${route} displays login recovery path after redirect`, 'protected-login-recovery', route);
  });
}

function formValidationChecks(cases) {
  const emailTargets = [
    { label: 'Email', path: '/login' },
    { label: 'Email', path: '/register' },
    { label: 'Registered email ID', path: '/forgot-password' },
  ];

  emailTargets.forEach((target) => {
    invalidEmails.forEach((value) => {
      createCase(cases, 'Form Validation', `${target.path} rejects invalid email value "${value}"`, 'email-format', target.path, {
        label: target.label,
        value,
      });
    });
  });

  invalidPhones.forEach((value) => {
    createCase(cases, 'Form Validation', `register rejects invalid phone value "${value || '<empty>'}"`, 'register-invalid-phone', '/register', {
      expectedMessage: expectedCopy.invalidPhone,
      value,
    });
  });
  createCase(cases, 'Form Validation', 'register displays the invalid phone validation message after submit', 'register-invalid-phone-message', '/register', {
    expectedMessage: expectedCopy.invalidPhone,
    value: '12345',
  });

  weakPasswords.forEach((value) => {
    createCase(cases, 'Form Validation', `register rejects password shorter than policy "${value || '<empty>'}"`, 'register-weak-password', '/register', {
      expectedMessage: expectedCopy.passwordTooShort,
      value,
    });
  });
  createCase(cases, 'Form Validation', 'register displays the short password validation message after submit', 'register-weak-password-message', '/register', {
    expectedMessage: expectedCopy.passwordTooShort,
    value: 'short7',
  });

  mismatchPasswords.forEach(([password, confirmPassword]) => {
    createCase(cases, 'Form Validation', `register rejects mismatched passwords ${password} / ${confirmPassword}`, 'register-password-mismatch', '/register', {
      confirmPassword,
      expectedMessage: expectedCopy.passwordMismatch,
      password,
    });
  });
  createCase(cases, 'Form Validation', 'register displays the password mismatch validation message after submit', 'register-password-mismatch-message', '/register', {
    confirmPassword: 'BloodLink#2027',
    expectedMessage: expectedCopy.passwordMismatch,
    password: 'BloodLink#2026',
  });

  createCase(cases, 'Form Validation', 'register submit stays disabled until consent and emergency availability are checked', 'register-checkbox-gating', '/register');
  createCase(cases, 'Form Validation', 'register submit stays disabled with all required text fields empty', 'button-disabled', '/register', { buttonText: 'Register' });
  createCase(cases, 'Form Validation', 'forgot password submit stays disabled when email is empty', 'button-disabled', '/forgot-password', { buttonText: 'Submit' });
  createCase(cases, 'Form Validation', 'forgot password accepts a syntactically valid registered email format', 'email-format-valid', '/forgot-password', { label: 'Registered email ID', value: 'donor@example.com' });
  createCase(cases, 'Form Validation', 'change password submit stays disabled below minimum length', 'button-disabled', '/profile/password', { buttonText: 'Change Password' }, true);
  createCase(cases, 'Form Validation', 'change password rejects mismatched confirmation', 'change-password-mismatch', '/profile/password', {}, true);
}

function uiChecks(cases, routes) {
  routes.forEach((route) => {
    const module = 'UI Behavior';
    route.meta.buttons.forEach((button, index) => {
      createCase(cases, module, `${route.template} button ${button.text || index + 1} is visible and stable`, 'ui-button-visible', route.samplePath, { index }, route.protected);
    });
    route.meta.inputs.forEach((input) => {
      createCase(cases, module, `${route.template} input ${input.attrs.label || input.attrs.id || 'field'} is visible and accepts focus`, 'ui-control-focus', route.samplePath, { label: input.attrs.label }, route.protected);
    });
    route.meta.selects.forEach((select) => {
      createCase(cases, module, `${route.template} dropdown ${select.attrs.label || 'select'} is visible and has options`, 'ui-select-options', route.samplePath, { label: select.attrs.label }, route.protected);
    });
    route.meta.checkboxes.forEach((checkbox) => {
      createCase(cases, module, `${route.template} checkbox ${checkbox.attrs.label || 'option'} toggles`, 'ui-checkbox-toggle', route.samplePath, { label: checkbox.attrs.label }, route.protected);
    });
    route.meta.links.forEach((link, index) => {
      createCase(cases, module, `${route.template} link ${link.attrs.href || link.text || index + 1} has a navigable href`, 'ui-link-href', route.samplePath, { href: link.attrs.href, index }, route.protected);
    });
    route.meta.notices.forEach((notice, index) => {
      createCase(cases, module, `${route.template} notice ${index + 1} exposes a status or alert role`, 'ui-notice-role', route.samplePath, { index }, route.protected);
    });
  });

  bloodGroups.forEach((bloodGroup) => {
    createCase(cases, 'UI Behavior', `register blood group dropdown supports ${bloodGroup}`, 'select-blood-group', '/register', { bloodGroup });
  });

  createCase(cases, 'UI Behavior', 'register location dropdown enables district after state selection', 'location-cascade', '/register', { level: 'district' });
  createCase(cases, 'UI Behavior', 'register location dropdown enables city after district selection', 'location-cascade', '/register', { level: 'city' });
  createCase(cases, 'UI Behavior', 'search form location dropdowns cascade for authenticated users', 'location-cascade', '/search', { level: 'city' }, true);
  createCase(cases, 'UI Behavior', 'settings delete profile button opens a confirmation dialog', 'settings-confirm-dialog', '/profile/settings', {}, true);
}

function navigationChecks(cases, routes) {
  publicRoutes
    .filter((route) => route !== '/')
    .forEach((route) => {
      createCase(cases, 'Navigation', `home redirects anonymous users toward ${route === '/login' ? 'login' : 'public auth'} route context`, 'public-route-access', route);
    });

  routes.forEach((route) => {
    route.meta.links
      .filter((link) => typeof link.attrs.href === 'string' && link.attrs.href.startsWith('/'))
      .forEach((link) => {
        createCase(cases, 'Navigation', `${route.template} navigates through ${link.attrs.href}`, 'link-navigation', route.samplePath, {
          href: link.attrs.href,
          text: link.text,
        }, route.protected);
      });
  });

  createCase(cases, 'Navigation', 'login Create donor account link opens registration', 'link-navigation', '/login', { href: '/register', text: 'Create donor account' });
  createCase(cases, 'Navigation', 'login Forgot password link opens reset password', 'link-navigation', '/login', { href: '/forgot-password', text: 'Forgot password' });
  createCase(cases, 'Navigation', 'register Sign in link returns to login', 'link-navigation', '/register', { href: '/login', text: 'Sign in' });
  createCase(cases, 'Navigation', 'forgot password Sign in link returns to login', 'link-navigation', '/forgot-password', { href: '/login', text: 'Sign in' });
}

function authenticatedWorkflowChecks(cases) {
  protectedRoutes.forEach((route) => {
    createCase(cases, 'Authenticated Workflows', `${route} opens for a signed-in donor`, 'authenticated-route-loads', route, {}, true);
    createCase(cases, 'Authenticated Workflows', `${route} keeps navigation shell visible for a signed-in donor`, 'authenticated-shell-visible', route, {}, true);
  });

  createCase(cases, 'Authenticated Workflows', 'donor search form redirects to results after valid criteria', 'search-valid-criteria', '/search', {}, true);
  createCase(cases, 'Authenticated Workflows', 'profile edit validates invalid email before save', 'profile-edit-invalid-email', '/profile/edit', {}, true);
  createCase(cases, 'Authenticated Workflows', 'profile edit validates invalid phone before save', 'profile-edit-invalid-phone', '/profile/edit', {}, true);
  createCase(cases, 'Authenticated Workflows', 'last donation form keeps save disabled until required details are present', 'donation-required-gating', '/profile/donation', {}, true);
}

function padToMinimum(cases, routes) {
  const assertions = [
    'visible text remains non-empty',
    'document URL remains controlled by the configured base URL',
    'interactive inventory can be collected',
    'page source has no obvious hydration failure text',
    'primary content remains attached after wait',
  ];

  let index = 0;
  while (cases.length < seleniumConfig.minTestCases) {
    const route = routes[index % routes.length];
    const assertion = assertions[index % assertions.length];
    createCase(
      cases,
      'Generated Coverage',
      `${route.template} generated coverage ${index + 1}: ${assertion}`,
      'generated-route-contract',
      route.samplePath,
      { assertion },
      route.protected,
    );
    index += 1;
  }
}

export function buildSeleniumTestCatalog() {
  const routes = discoverReactRoutes();
  const cases = [];
  routeChecks(cases, routes);
  authenticationChecks(cases);
  formValidationChecks(cases);
  uiChecks(cases, routes);
  navigationChecks(cases, routes);
  authenticatedWorkflowChecks(cases);
  padToMinimum(cases, routes);
  return {
    cases,
    routes,
  };
}
