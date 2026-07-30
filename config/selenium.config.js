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
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asNonNegativeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function asList(value, fallback) {
  const source = value || fallback;
  return String(source)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function safeSuffix(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const reportSuffix = safeSuffix(process.env.E2E_REPORT_SUFFIX);
const reportPostfix = reportSuffix ? `-${reportSuffix}` : '';
const requestedExcelReportName = process.env.E2E_REPORT_NAME
  ? (process.env.E2E_REPORT_NAME.endsWith('.xlsx') ? process.env.E2E_REPORT_NAME : `${process.env.E2E_REPORT_NAME}.xlsx`)
  : '';

export const seleniumConfig = {
  appUrl: (process.env.E2E_BASE_URL || 'http://127.0.0.1:3001').replace(/\/+$/, ''),
  artifacts: {
    excelDir: path.join(rootDir, 'excel'),
    excelFile: path.join(rootDir, 'excel', requestedExcelReportName || `E2E_Report${reportPostfix}.xlsx`),
    failuresDir: path.join(rootDir, 'reports', 'failures'),
    logsDir: path.join(rootDir, 'logs'),
    mochawesomeDir: path.join(rootDir, 'reports', 'mochawesome'),
    reportsDir: path.join(rootDir, 'reports'),
    resultsFile: path.join(rootDir, 'reports', `selenium-results${reportPostfix}.json`),
    screenshotsDir: path.join(rootDir, 'screenshots'),
  },
  auth: {
    email: process.env.E2E_USER_EMAIL || process.env.TEST_USER_EMAIL || '',
    password: process.env.E2E_USER_PASSWORD || process.env.TEST_USER_PASSWORD || '',
  },
  browsers: asList(process.env.E2E_BROWSERS || process.env.BROWSER, 'chrome'),
  caseFilter: process.env.E2E_CASE_FILTER || '',
  environment: process.env.TEST_ENV || process.env.NODE_ENV || 'local',
  headless: asBoolean(process.env.E2E_HEADLESS, Boolean(process.env.CI)),
  maxCases: asNonNegativeNumber(process.env.E2E_MAX_CASES, 0),
  minTestCases: asNumber(process.env.E2E_MIN_TEST_CASES, 320),
  retries: asNonNegativeNumber(process.env.E2E_RETRIES, 1),
  rootDir,
  testTimeoutMs: asNumber(process.env.E2E_TEST_TIMEOUT_MS, 60000),
  waitTimeoutMs: asNumber(process.env.E2E_WAIT_TIMEOUT_MS, 15000),
  webAppDir: path.join(rootDir, 'web', 'app'),
};

export function toAppUrl(routePath = '/') {
  const normalizedPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${seleniumConfig.appUrl}${normalizedPath}`;
}
