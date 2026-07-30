import { performance } from 'node:perf_hooks';
import { loadConfig } from '../../config/load.config.js';
import { ensureDir, writeJson } from '../fileSystem.js';
import { generateLoadExcelReport } from './excelReportGenerator.js';
import { loadLogger } from './logger.js';
import { buildLoadTestCatalog } from './testCatalog.js';

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function summarize(results, startedAtMs, endedAtMs) {
  const durations = results.map((item) => item.durationMs).filter(Number.isFinite);
  const passed = results.filter((item) => item.status === 'PASSED').length;
  const failed = results.filter((item) => item.status === 'FAILED').length;
  const skipped = results.filter((item) => item.status === 'SKIPPED').length;
  const total = results.length;
  const durationMs = Math.max(0, endedAtMs - startedAtMs);
  const failureRatePct = total === 0 ? 0 : Math.round((failed / total) * 10000) / 100;

  return {
    avgMs: durations.length ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length) : 0,
    durationMs: Math.round(durationMs),
    failed,
    failureRatePct,
    maxMs: durations.length ? Math.max(...durations) : 0,
    minMs: durations.length ? Math.min(...durations) : 0,
    p50Ms: percentile(durations, 50),
    p95Ms: percentile(durations, 95),
    passed,
    requestsPerSecond: durationMs > 0 ? Math.round((total / (durationMs / 1000)) * 100) / 100 : 0,
    skipped,
    total,
  };
}

function selectCases(catalogCases) {
  const filter = loadConfig.caseFilter.trim().toLowerCase();
  const authTokenAvailable = Boolean(loadConfig.auth.token);
  const authFiltered = authTokenAvailable ? catalogCases : catalogCases.filter((testCase) => !testCase.requiresAuth);
  const filtered = filter
    ? authFiltered.filter((testCase) => [
      testCase.id,
      testCase.method,
      testCase.module,
      testCase.path,
      testCase.scenarioName,
      ...(testCase.tags || []),
    ].some((value) => String(value).toLowerCase().includes(filter)))
    : authFiltered;

  return loadConfig.maxCases > 0 ? filtered.slice(0, loadConfig.maxCases) : filtered;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return { json: null, text };

  try {
    return { json: JSON.parse(text), text };
  } catch {
    return { json: null, text };
  }
}

function validateResponse(testCase, status, json) {
  if (!testCase.expectedStatuses.includes(status)) {
    return {
      ok: false,
      reason: `Expected status ${testCase.expectedStatuses.join('/')} but received ${status}.`,
    };
  }

  if (status >= 400 && testCase.responseCheck !== 'health') {
    return { ok: true, reason: '' };
  }

  if (!testCase.responseCheck) return { ok: true, reason: '' };

  if (!json || typeof json !== 'object') {
    return { ok: false, reason: 'Response was not valid JSON.' };
  }

  const checks = {
    cities: () => Array.isArray(json.cities),
    districts: () => Array.isArray(json.districts),
    donors: () => Array.isArray(json.donors),
    error: () => typeof json.error === 'string',
    health: () => ['ok', 'degraded'].includes(json.status) && typeof json.service === 'string',
    live: () => json.status === 'ok' && typeof json.service === 'string',
    locations: () => json.country === 'INDIA' && Array.isArray(json.locations),
  };

  const check = checks[testCase.responseCheck];
  if (!check) return { ok: true, reason: '' };
  return check()
    ? { ok: true, reason: '' }
    : { ok: false, reason: `Response did not satisfy ${testCase.responseCheck} contract.` };
}

async function executeCase(testCase, round) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), loadConfig.requestTimeoutMs);
  const start = new Date();
  const startedAtMs = performance.now();
  const headers = {
    accept: 'application/json',
    'user-agent': 'BloodLink-load-test/1.0',
    ...testCase.headers,
  };

  if (testCase.body !== undefined) {
    headers['content-type'] = 'application/json';
  }

  if (testCase.requiresAuth && loadConfig.auth.token) {
    headers.authorization = `Bearer ${loadConfig.auth.token}`;
  }

  try {
    const response = await fetch(new URL(testCase.path, loadConfig.baseUrl), {
      body: testCase.body === undefined ? undefined : JSON.stringify(testCase.body),
      headers,
      method: testCase.method,
      signal: controller.signal,
    });
    const { json, text } = await parseJsonResponse(response);
    const durationMs = Math.round(performance.now() - startedAtMs);
    const validation = validateResponse(testCase, response.status, json);
    const end = new Date();

    return {
      durationMs,
      endTime: end.toISOString(),
      expectedStatuses: testCase.expectedStatuses.join(', '),
      failureReason: validation.reason,
      method: testCase.method,
      module: testCase.module,
      path: testCase.path,
      requiresAuth: testCase.requiresAuth,
      responseBytes: Buffer.byteLength(text || '', 'utf8'),
      responseStatus: response.status,
      round,
      scenarioName: testCase.scenarioName,
      startTime: start.toISOString(),
      status: validation.ok ? 'PASSED' : 'FAILED',
      tags: (testCase.tags || []).join(', '),
      testId: testCase.id,
    };
  } catch (error) {
    const end = new Date();
    return {
      durationMs: Math.round(performance.now() - startedAtMs),
      endTime: end.toISOString(),
      expectedStatuses: testCase.expectedStatuses.join(', '),
      failureReason: error?.name === 'AbortError'
        ? `Request exceeded ${loadConfig.requestTimeoutMs}ms timeout.`
        : (error?.message || 'Request failed.'),
      method: testCase.method,
      module: testCase.module,
      path: testCase.path,
      requiresAuth: testCase.requiresAuth,
      responseBytes: 0,
      responseStatus: 0,
      round,
      scenarioName: testCase.scenarioName,
      startTime: start.toISOString(),
      status: 'FAILED',
      tags: (testCase.tags || []).join(', '),
      testId: testCase.id,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runPool(workItems, concurrency, onResult) {
  let nextIndex = 0;

  async function worker(workerId) {
    while (nextIndex < workItems.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      const item = workItems[currentIndex];
      const result = await executeCase(item.testCase, item.round);
      onResult(result, workerId);
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), workItems.length);
  await Promise.all(Array.from({ length: workerCount }, (_unused, index) => worker(index + 1)));
}

function makeSnapshot({ allCases, selectedCases, results, startedAt, endedAt, logs }) {
  const startedAtMs = Date.parse(startedAt);
  const endedAtMs = Date.parse(endedAt);
  const summary = summarize(results, startedAtMs, endedAtMs);

  return {
    catalog: selectedCases.map((testCase) => ({
      expectedStatuses: testCase.expectedStatuses.join(', '),
      method: testCase.method,
      module: testCase.module,
      path: testCase.path,
      requiresAuth: testCase.requiresAuth,
      scenarioName: testCase.scenarioName,
      tags: (testCase.tags || []).join(', '),
      testId: testCase.id,
    })),
    config: {
      authTokenProvided: Boolean(loadConfig.auth.token),
      baseUrl: loadConfig.baseUrl,
      caseFilter: loadConfig.caseFilter,
      concurrency: loadConfig.concurrency,
      maxCases: loadConfig.maxCases,
      minTestCases: loadConfig.minTestCases,
      requestTimeoutMs: loadConfig.requestTimeoutMs,
      rounds: loadConfig.rounds,
      thresholds: loadConfig.thresholds,
    },
    environment: loadConfig.environment,
    generatedAt: new Date().toISOString(),
    logs,
    results,
    startedAt,
    endedAt,
    summary: {
      ...summary,
      allCatalogCases: allCases.length,
      executedUniqueCases: selectedCases.length,
    },
  };
}

function assertThresholds(summary) {
  const failures = [];

  if (summary.executedUniqueCases < loadConfig.minTestCases && !loadConfig.caseFilter) {
    failures.push(`Expected at least ${loadConfig.minTestCases} executed unique cases, selected ${summary.executedUniqueCases}.`);
  }

  if (summary.failureRatePct > loadConfig.thresholds.maxFailureRatePct) {
    failures.push(`Failure rate ${summary.failureRatePct}% exceeded ${loadConfig.thresholds.maxFailureRatePct}%.`);
  }

  if (loadConfig.thresholds.maxP95Ms > 0 && summary.p95Ms > loadConfig.thresholds.maxP95Ms) {
    failures.push(`p95 latency ${summary.p95Ms}ms exceeded ${loadConfig.thresholds.maxP95Ms}ms.`);
  }

  if (failures.length && loadConfig.failOnThreshold) {
    throw new Error(failures.join(' '));
  }
}

export async function runLoadTest() {
  const { cases: allCases } = buildLoadTestCatalog();
  if (allCases.length < loadConfig.minTestCases) {
    throw new Error(`Expected at least ${loadConfig.minTestCases} load test cases, generated ${allCases.length}.`);
  }

  const selectedCases = selectCases(allCases);
  const workItems = [];
  for (let round = 1; round <= loadConfig.rounds; round += 1) {
    selectedCases.forEach((testCase) => workItems.push({ round, testCase }));
  }

  ensureDir(loadConfig.artifacts.reportsDir);
  const results = [];
  const logs = [{
    remarks: `Base URL: ${loadConfig.baseUrl}`,
    result: 'INFO',
    stepDescription: `Starting ${workItems.length} load requests with concurrency ${loadConfig.concurrency}`,
    testName: 'Load runner',
    timestamp: new Date().toISOString(),
  }];

  const startedAt = new Date().toISOString();
  loadLogger.info(`Starting load test: ${workItems.length} requests, ${selectedCases.length} unique cases, concurrency ${loadConfig.concurrency}`);
  await runPool(workItems, loadConfig.concurrency, (result, workerId) => {
    results.push(result);
    if (result.status === 'FAILED') {
      loadLogger.warn(`Load case failed: ${result.testId}`, {
        failureReason: result.failureReason,
        path: result.path,
        responseStatus: result.responseStatus,
        workerId,
      });
    }
  });
  const endedAt = new Date().toISOString();

  logs.push({
    remarks: `Completed in ${Date.parse(endedAt) - Date.parse(startedAt)}ms`,
    result: 'INFO',
    stepDescription: 'Load test completed',
    testName: 'Load runner',
    timestamp: endedAt,
  });

  const snapshot = makeSnapshot({ allCases, endedAt, logs, results, selectedCases, startedAt });
  writeJson(loadConfig.artifacts.resultsFile, snapshot);
  const reportPath = await generateLoadExcelReport(snapshot);
  loadLogger.info(`Load Excel report generated: ${reportPath}`);
  assertThresholds(snapshot.summary);
  return { reportPath, snapshot };
}
