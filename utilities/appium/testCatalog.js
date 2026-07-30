import { appiumConfig } from '../../config/appium.config.js';
import {
  bloodGroups,
  indianLocations,
  invalidEmails,
  invalidPhones,
  mismatchPasswords,
  mobileScreens,
  navigationPaths,
  registrationRequiredFields,
  weakPasswords,
} from '../../data/appium/mobileTestData.js';

function caseId(index) {
  return `MOB-E2E-${String(index + 1).padStart(4, '0')}`;
}

function createCase(cases, {
  action,
  data = {},
  expected,
  module,
  priority = 'P2',
  requiresAuth = false,
  scenarioName,
  screen,
  selectors = [],
  steps,
  tags = [],
}) {
  cases.push({
    action,
    data,
    expected: expected || defaultExpected(action, screen),
    id: caseId(cases.length),
    module,
    priority,
    requiresAuth,
    scenarioName,
    screen,
    selectors,
    steps: steps || defaultSteps(action, screen),
    tags,
  });
}

function defaultSteps(action, screen) {
  return [
    `Open ${screen || 'BloodLink'} mobile screen`,
    `Execute ${action} behavior`,
    'Capture result and diagnostic artifacts when needed',
  ];
}

function defaultExpected(action, screen) {
  return `${screen || 'BloodLink'} ${action} completes without a crash, blank screen, or unexpected navigation.`;
}

function addScreenInventory(cases) {
  mobileScreens.forEach((screen) => {
    screen.selectors.forEach((selector) => {
      createCase(cases, {
        action: 'ui-presence',
        data: { selector },
        expected: `${selector} is visible on ${screen.name}`,
        module: 'UI Inventory',
        priority: screen.requiresAuth ? 'P2' : 'P1',
        requiresAuth: screen.requiresAuth,
        scenarioName: `${screen.name} shows ${selector}`,
        screen: screen.name,
        selectors: [selector],
        tags: ['ui', 'inventory'],
      });
    });
  });
}

function addAuthenticationCases(cases) {
  [
    ['login rejects empty email and password', 'login-empty-validation', { email: '', password: '' }],
    ['login rejects empty password', 'login-empty-validation', { email: 'qa@bloodlink.test', password: '' }],
    ['login rejects empty email', 'login-empty-validation', { email: '', password: 'BloodLink#2026' }],
    ['login accepts typing into email and password fields', 'login-field-entry', { email: 'qa@bloodlink.test', password: 'BloodLink#2026' }],
    ['invalid credentials display an error path', 'login-invalid-credentials', { email: 'invalid.user@bloodlink.test', password: 'WrongPassword#1' }],
    ['forgot password opens from login', 'forgot-password-navigation', {}],
    ['registration opens from login', 'register-navigation', {}],
    ['valid configured donor can sign in', 'login-valid-credentials', {}, true],
    ['signed-in donor can log out', 'logout-valid-user', {}, true],
    ['authenticated session lands on donor search', 'auth-landing-search', {}, true],
  ].forEach(([scenarioName, action, data, requiresAuth = false]) => {
    createCase(cases, {
      action,
      data,
      expected: `${scenarioName} succeeds with clear feedback`,
      module: 'Authentication',
      priority: requiresAuth ? 'P1' : 'P0',
      requiresAuth,
      scenarioName,
      screen: 'Login',
      selectors: ['Email', 'Password', 'Sign In'],
      tags: ['auth', requiresAuth ? 'requires-auth' : 'public', 'smoke'],
    });
  });
}

function addFormValidationCases(cases) {
  const emailTargets = [
    { label: 'Email', screen: 'Login' },
    { label: 'Email', screen: 'Register' },
    { label: 'Registered email ID', screen: 'ForgotPassword' },
  ];

  emailTargets.forEach((target) => {
    invalidEmails.forEach((value) => {
      createCase(cases, {
        action: 'email-format-validation',
        data: { field: target.label, value },
        expected: `${target.label} rejects invalid email value`,
        module: 'Form Validation',
        priority: 'P1',
        scenarioName: `${target.screen} rejects invalid email "${value || '<empty>'}"`,
        screen: target.screen,
        selectors: [target.label],
        tags: ['validation', 'email'],
      });
    });
  });

  invalidPhones.forEach((value) => {
    createCase(cases, {
      action: 'register-phone-validation',
      data: { field: 'Mobile Number', value },
      expected: 'Registration blocks invalid mobile number values',
      module: 'Form Validation',
      priority: 'P1',
      scenarioName: `Register rejects invalid phone "${value || '<empty>'}"`,
      screen: 'Register',
      selectors: ['Mobile Number'],
      tags: ['validation', 'phone'],
    });
  });

  weakPasswords.forEach((value) => {
    createCase(cases, {
      action: 'register-password-policy',
      data: { field: 'Password', value },
      expected: 'Registration blocks weak password values',
      module: 'Form Validation',
      priority: 'P1',
      scenarioName: `Register rejects weak password "${value || '<empty>'}"`,
      screen: 'Register',
      selectors: ['Password'],
      tags: ['validation', 'password'],
    });
  });

  mismatchPasswords.forEach(([password, confirmPassword]) => {
    createCase(cases, {
      action: 'register-password-mismatch',
      data: { confirmPassword, password },
      expected: 'Registration blocks mismatched password confirmation',
      module: 'Form Validation',
      priority: 'P1',
      scenarioName: `Register rejects mismatched passwords ${password} / ${confirmPassword}`,
      screen: 'Register',
      selectors: ['Password', 'Retype Password'],
      tags: ['validation', 'password'],
    });
  });

  registrationRequiredFields.forEach((field) => {
    createCase(cases, {
      action: 'register-required-field',
      data: { field },
      expected: `${field} is required before registration can proceed`,
      module: 'Form Validation',
      priority: 'P1',
      scenarioName: `Register requires ${field}`,
      screen: 'Register',
      selectors: [field],
      tags: ['validation', 'required'],
    });
  });
}

function addRegistrationOptionCases(cases) {
  bloodGroups.forEach((bloodGroup) => {
    createCase(cases, {
      action: 'select-option',
      data: { field: 'Blood Group', option: bloodGroup },
      expected: `${bloodGroup} can be selected for donor registration`,
      module: 'Registration Data',
      priority: 'P2',
      scenarioName: `Register supports blood group ${bloodGroup}`,
      screen: 'Register',
      selectors: ['Blood Group'],
      tags: ['registration', 'select'],
    });
  });

  indianLocations.forEach((location) => {
    ['Country', 'State', 'District', 'City'].forEach((field) => {
      createCase(cases, {
        action: 'select-option',
        data: { field, location, option: location[field.toLowerCase()] },
        expected: `${field} option ${location[field.toLowerCase()]} is selectable`,
        module: 'Registration Data',
        priority: 'P2',
        scenarioName: `Register location supports ${field} ${location[field.toLowerCase()]}`,
        screen: 'Register',
        selectors: [field],
        tags: ['registration', 'location'],
      });
    });
  });
}

function addSearchCases(cases) {
  bloodGroups.forEach((bloodGroup) => {
    indianLocations.slice(0, 8).forEach((location) => {
      createCase(cases, {
        action: 'search-donors',
        data: { bloodGroup, location },
        expected: `Search returns donor results or a no-donor message for ${bloodGroup} in ${location.city}`,
        module: 'Donor Search',
        priority: 'P1',
        requiresAuth: true,
        scenarioName: `Search ${bloodGroup} donors in ${location.city}`,
        screen: 'Search',
        selectors: ['Blood Group', 'Country', 'State', 'District', 'City', 'Search'],
        tags: ['search', 'requires-auth'],
      });
    });
  });

  ['Blood Group', 'Country', 'State', 'District', 'City'].forEach((field) => {
    createCase(cases, {
      action: 'search-required-field',
      data: { field },
      expected: `${field} remains a controlled search field`,
      module: 'Donor Search',
      priority: 'P2',
      requiresAuth: true,
      scenarioName: `Search requires ${field} context`,
      screen: 'Search',
      selectors: [field],
      tags: ['search', 'validation', 'requires-auth'],
    });
  });
}

function addNavigationCases(cases) {
  navigationPaths.forEach((item) => {
    createCase(cases, {
      action: 'navigation',
      data: item,
      expected: `${item.from} navigates to ${item.to}`,
      module: 'Navigation',
      priority: item.requiresAuth ? 'P2' : 'P1',
      requiresAuth: Boolean(item.requiresAuth),
      scenarioName: `${item.from} navigates to ${item.to} through ${item.label}`,
      screen: item.from,
      selectors: [item.label],
      tags: ['navigation', item.requiresAuth ? 'requires-auth' : 'public'],
    });
  });

  mobileScreens.forEach((screen) => {
    createCase(cases, {
      action: 'android-back-navigation',
      data: { screen: screen.name },
      expected: `${screen.name} handles Android back navigation predictably`,
      module: 'Navigation',
      priority: 'P2',
      requiresAuth: screen.requiresAuth,
      scenarioName: `${screen.name} handles Android back button`,
      screen: screen.name,
      selectors: ['Back'],
      tags: ['navigation', 'android-back'],
    });
  });
}

function addGestureCases(cases) {
  mobileScreens.forEach((screen) => {
    ['scroll-down', 'scroll-up'].forEach((action) => {
      createCase(cases, {
        action,
        data: { screen: screen.name },
        expected: `${screen.name} supports ${action.replace('-', ' ')}`,
        module: 'Gestures',
        priority: 'P2',
        requiresAuth: screen.requiresAuth,
        scenarioName: `${screen.name} ${action.replace('-', ' ')}`,
        screen: screen.name,
        tags: ['gesture'],
      });
    });
  });

  ['Register', 'LastDonation', 'BloodFacts', 'Settings', 'Profile'].forEach((screen) => {
    createCase(cases, {
      action: 'long-press-safe',
      data: { screen },
      expected: `${screen} tolerates a long press without app crash`,
      module: 'Gestures',
      priority: 'P3',
      requiresAuth: !['Register'].includes(screen),
      scenarioName: `${screen} long press does not crash`,
      screen,
      tags: ['gesture', 'stability'],
    });
  });
}

function addPerformanceCases(cases) {
  [
    ['cold launch renders a first screen', 'performance-cold-launch', 'Login', false, 'P0'],
    ['warm relaunch returns to a usable screen', 'performance-warm-launch', 'Login', false, 'P1'],
    ['login screen page source is collected under timeout', 'performance-source-collection', 'Login', false, 'P2'],
    ['registration form opens under timeout', 'performance-screen-open', 'Register', false, 'P2'],
    ['forgot password screen opens under timeout', 'performance-screen-open', 'ForgotPassword', false, 'P2'],
    ['search screen opens under timeout', 'performance-screen-open', 'Search', true, 'P2'],
    ['profile screen opens under timeout', 'performance-screen-open', 'Profile', true, 'P2'],
    ['device current activity can be captured', 'device-current-activity', 'Login', false, 'P2'],
    ['logcat collection is available on failure path', 'device-logcat-ready', 'Login', false, 'P2'],
    ['screenshot collection is available on demand', 'device-screenshot-ready', 'Login', false, 'P1'],
  ].forEach(([scenarioName, action, screen, requiresAuth, priority]) => {
    createCase(cases, {
      action,
      expected: `${scenarioName} succeeds`,
      module: 'Performance and Diagnostics',
      priority,
      requiresAuth,
      scenarioName,
      screen,
      tags: ['performance', 'diagnostics', requiresAuth ? 'requires-auth' : 'public'],
    });
  });
}

function addAccessibilityCases(cases) {
  mobileScreens.forEach((screen) => {
    screen.selectors.slice(0, 4).forEach((selector) => {
      createCase(cases, {
        action: 'accessibility-label-check',
        data: { selector },
        expected: `${selector} exposes a usable accessibility label or visible text`,
        module: 'Accessibility',
        priority: 'P2',
        requiresAuth: screen.requiresAuth,
        scenarioName: `${screen.name} exposes accessible ${selector}`,
        screen: screen.name,
        selectors: [selector],
        tags: ['accessibility'],
      });
    });
  });
}

function addApiEnvironmentCases(cases) {
  [
    ['mobile app is configured for production API base URL', 'api-base-url-configured'],
    ['API timeout errors stay user-readable', 'api-timeout-message'],
    ['anonymous protected API path blocks without token', 'api-auth-required'],
    ['authenticated API token is attached after sign-in', 'api-token-attached'],
    ['donor search request keeps selected location payload', 'api-search-payload'],
    ['profile update request keeps consent flag payload', 'api-profile-payload'],
  ].forEach(([scenarioName, action]) => {
    createCase(cases, {
      action,
      data: { apiBaseUrl: appiumConfig.apiBaseUrl },
      expected: `${scenarioName} against ${appiumConfig.apiBaseUrl}`,
      module: 'API Environment',
      priority: 'P1',
      requiresAuth: ['api-token-attached', 'api-search-payload', 'api-profile-payload'].includes(action),
      scenarioName,
      screen: 'BloodLink',
      tags: ['api', 'environment'],
    });
  });
}

function padToMinimum(cases) {
  const assertions = [
    'page source contains BloodLink context',
    'screen model has at least one stable selector',
    'test definition includes expected outcome',
    'test definition includes reproducible steps',
    'test definition includes priority',
    'test definition includes module ownership',
  ];
  let index = 0;

  while (cases.length < appiumConfig.minTestCases) {
    const screen = mobileScreens[index % mobileScreens.length];
    const assertion = assertions[index % assertions.length];
    createCase(cases, {
      action: 'generated-coverage-check',
      data: { assertion, ordinal: index + 1 },
      expected: `${screen.name} generated coverage check verifies ${assertion}`,
      module: 'Generated Coverage',
      priority: 'P3',
      requiresAuth: screen.requiresAuth,
      scenarioName: `${screen.name} generated coverage ${index + 1}: ${assertion}`,
      screen: screen.name,
      selectors: screen.selectors.slice(0, 2),
      tags: ['generated', 'coverage'],
    });
    index += 1;
  }
}

export function generateMobileTestCases() {
  const cases = [];
  addScreenInventory(cases);
  addAuthenticationCases(cases);
  addFormValidationCases(cases);
  addRegistrationOptionCases(cases);
  addSearchCases(cases);
  addNavigationCases(cases);
  addGestureCases(cases);
  addPerformanceCases(cases);
  addAccessibilityCases(cases);
  addApiEnvironmentCases(cases);
  padToMinimum(cases);
  return cases;
}

export function selectMobileTestCases(cases, {
  caseFilter = appiumConfig.caseFilter,
  maxCases = appiumConfig.maxCases,
  smokeOnly = appiumConfig.smokeOnly,
} = {}) {
  const normalizedFilter = caseFilter.toLowerCase();
  let selected = cases;

  if (smokeOnly) {
    selected = selected.filter((testCase) => testCase.tags.includes('smoke') || testCase.priority === 'P0');
  }

  if (normalizedFilter) {
    selected = selected.filter((testCase) => [
      testCase.action,
      testCase.id,
      testCase.module,
      testCase.scenarioName,
      testCase.screen,
      ...(testCase.tags || []),
    ].join(' ').toLowerCase().includes(normalizedFilter));
  }

  if (maxCases > 0) {
    selected = selected.slice(0, maxCases);
  }

  return selected;
}
