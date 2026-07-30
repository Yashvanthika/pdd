import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(configDir, '..');

function asBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function asList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function optional(value) {
  return value === undefined || value === '' ? undefined : value;
}

function safeSuffix(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const reportSuffix = safeSuffix(process.env.APPIUM_REPORT_SUFFIX);
const reportPostfix = reportSuffix ? `-${reportSuffix}` : '';
const defaultApkPath = path.join(rootDir, 'BloodLink-arm64-release.apk');
const requestedExcelReportName = process.env.APPIUM_REPORT_NAME
  ? (process.env.APPIUM_REPORT_NAME.endsWith('.xlsx') ? process.env.APPIUM_REPORT_NAME : `${process.env.APPIUM_REPORT_NAME}.xlsx`)
  : '';

export const appiumConfig = {
  apiBaseUrl: (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://bloodlink-api.welcos.in').replace(/\/+$/, ''),
  app: {
    activity: process.env.APPIUM_APP_ACTIVITY || 'com.bloodlink.app.MainActivity',
    apkPath: process.env.APPIUM_APK_PATH || defaultApkPath,
    installFromApk: asBoolean(process.env.APPIUM_INSTALL_APP, fs.existsSync(process.env.APPIUM_APK_PATH || defaultApkPath)),
    packageName: process.env.APPIUM_APP_PACKAGE || 'com.bloodlink.app',
  },
  artifacts: {
    excelDir: path.join(rootDir, 'excel'),
    excelFile: path.join(rootDir, 'excel', requestedExcelReportName || `Mobile_E2E_Report${reportPostfix}.xlsx`),
    failuresDir: path.join(rootDir, 'reports', 'appium', 'failures'),
    logsDir: path.join(rootDir, 'logs'),
    mochawesomeDir: path.join(rootDir, 'reports', 'appium', 'mochawesome'),
    reportsDir: path.join(rootDir, 'reports', 'appium'),
    resultsFile: path.join(rootDir, 'reports', 'appium', `appium-results${reportPostfix}.json`),
    screenshotsDir: path.join(rootDir, 'screenshots', 'appium'),
  },
  auth: {
    email: process.env.APPIUM_USER_EMAIL || process.env.E2E_USER_EMAIL || process.env.TEST_USER_EMAIL || '',
    password: process.env.APPIUM_USER_PASSWORD || process.env.E2E_USER_PASSWORD || process.env.TEST_USER_PASSWORD || '',
  },
  caseFilter: process.env.APPIUM_CASE_FILTER || '',
  environment: process.env.TEST_ENV || process.env.NODE_ENV || 'local',
  fullReportMode: asBoolean(process.env.APPIUM_FULL_REPORT_MODE, false),
  maxCases: asNumber(process.env.APPIUM_MAX_CASES, 0),
  minTestCases: asNumber(process.env.APPIUM_MIN_TEST_CASES, 384),
  parallelDevices: asBoolean(process.env.APPIUM_PARALLEL_DEVICES, false),
  retries: asNumber(process.env.APPIUM_RETRIES, 1),
  rootDir,
  serverUrl: process.env.APPIUM_SERVER_URL || 'http://127.0.0.1:4723',
  smokeOnly: asBoolean(process.env.APPIUM_SMOKE_ONLY, false),
  targetUdids: asList(process.env.APPIUM_UDIDS || process.env.APPIUM_UDID),
  testTimeoutMs: asNumber(process.env.APPIUM_TEST_TIMEOUT_MS, 90000),
  waitTimeoutMs: asNumber(process.env.APPIUM_WAIT_TIMEOUT_MS, 15000),
};

export function hasAuthCredentials() {
  return Boolean(appiumConfig.auth.email && appiumConfig.auth.password);
}

export function createCapabilities(device = {}) {
  const caps = {
    platformName: 'Android',
    'appium:adbExecTimeout': 120000,
    'appium:appActivity': appiumConfig.app.activity,
    'appium:appPackage': appiumConfig.app.packageName,
    'appium:autoGrantPermissions': true,
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.APPIUM_DEVICE_NAME || device.model || device.deviceName || device.udid || 'Android Device',
    'appium:newCommandTimeout': 240,
    'appium:noReset': asBoolean(process.env.APPIUM_NO_RESET, false),
    'appium:platformVersion': optional(process.env.APPIUM_PLATFORM_VERSION || device.platformVersion),
    'appium:udid': optional(device.udid || process.env.APPIUM_UDID),
    'appium:uiautomator2ServerInstallTimeout': 120000,
  };

  if (appiumConfig.app.installFromApk && fs.existsSync(appiumConfig.app.apkPath)) {
    caps['appium:app'] = appiumConfig.app.apkPath;
  }

  return Object.fromEntries(Object.entries(caps).filter(([, value]) => value !== undefined));
}

export function describeTargetDevice(device = {}) {
  return [
    device.model || device.deviceName || 'Android Device',
    device.udid ? `udid=${device.udid}` : '',
    device.platformVersion ? `Android ${device.platformVersion}` : '',
  ].filter(Boolean).join(' ');
}
