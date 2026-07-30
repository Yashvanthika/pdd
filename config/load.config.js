import path from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(configDir, '..');

function asBoolean(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function asNumber(value, fallback, { allowZero = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (allowZero && parsed === 0) return 0;
  return parsed > 0 ? parsed : fallback;
}

function safeSuffix(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const reportSuffix = safeSuffix(process.env.LOAD_TEST_REPORT_SUFFIX);
const reportPostfix = reportSuffix ? `-${reportSuffix}` : '';
const requestedExcelReportName = process.env.LOAD_TEST_REPORT_NAME
  ? (process.env.LOAD_TEST_REPORT_NAME.endsWith('.xlsx') ? process.env.LOAD_TEST_REPORT_NAME : `${process.env.LOAD_TEST_REPORT_NAME}.xlsx`)
  : '';

export const loadConfig = {
  artifacts: {
    excelDir: path.join(rootDir, 'excel'),
    excelFile: path.join(rootDir, 'excel', requestedExcelReportName || `Load_Test_Report${reportPostfix}.xlsx`),
    logsDir: path.join(rootDir, 'logs'),
    reportsDir: path.join(rootDir, 'reports'),
    resultsFile: path.join(rootDir, 'reports', `load-results${reportPostfix}.json`),
  },
  auth: {
    token: process.env.LOAD_TEST_AUTH_TOKEN || '',
  },
  baseUrl: (process.env.LOAD_TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/+$/, ''),
  caseFilter: process.env.LOAD_TEST_CASE_FILTER || '',
  concurrency: Math.floor(asNumber(process.env.LOAD_TEST_CONCURRENCY, 25)),
  environment: process.env.TEST_ENV || process.env.NODE_ENV || 'local',
  failOnThreshold: asBoolean(process.env.LOAD_TEST_FAIL_ON_THRESHOLD, true),
  maxCases: Math.floor(asNumber(process.env.LOAD_TEST_MAX_CASES, 360, { allowZero: true })),
  minTestCases: Math.floor(asNumber(process.env.LOAD_TEST_MIN_TEST_CASES, 320)),
  requestTimeoutMs: Math.floor(asNumber(process.env.LOAD_TEST_REQUEST_TIMEOUT_MS, 10000)),
  rootDir,
  rounds: Math.floor(asNumber(process.env.LOAD_TEST_ROUNDS, 1)),
  thresholds: {
    maxFailureRatePct: asNumber(process.env.LOAD_TEST_MAX_FAILURE_RATE_PCT, 0, { allowZero: true }),
    maxP95Ms: asNumber(process.env.LOAD_TEST_MAX_P95_MS, 0, { allowZero: true }),
  },
};
