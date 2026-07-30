import { seleniumConfig } from '../config/selenium.config.js';
import { ensureDir, writeJson } from './fileSystem.js';

class ReportStore {
  constructor() {
    this.startedAt = new Date();
    this.catalog = [];
    this.results = [];
    this.logs = [];
    this.outputPath = seleniumConfig.artifacts.resultsFile;
    ensureDir(seleniumConfig.artifacts.reportsDir);
  }

  setCatalog(testCases, browsers) {
    this.catalog = browsers.flatMap((browser) => testCases.map((testCase) => ({
      action: testCase.action || '',
      browser,
      module: testCase.module,
      path: testCase.path || '',
      requiresAuth: Boolean(testCase.requiresAuth),
      scenarioName: testCase.scenarioName,
      testId: testCase.id,
    })));
    this.persist();
  }

  begin(testCase, browser) {
    const startedAt = new Date();
    this.addLog(testCase, 'Test case started', 'PASS', `Browser: ${browser}`);
    return {
      browser,
      startTime: startedAt,
      testCase,
    };
  }

  addLog(testCase, stepDescription, result = 'INFO', remarks = '') {
    this.logs.push({
      remarks,
      result,
      stepDescription,
      testName: testCase?.scenarioName || 'Framework',
      timestamp: new Date().toISOString(),
    });
  }

  record(execution, status, details = {}) {
    const endTime = new Date();
    const durationMs = endTime.getTime() - execution.startTime.getTime();
    const nextResult = {
      browser: execution.browser,
      durationMs,
      endTime: endTime.toISOString(),
      failureReason: details.failureReason || '',
      module: execution.testCase.module,
      path: execution.testCase.path || '',
      requiresAuth: Boolean(execution.testCase.requiresAuth),
      scenarioName: execution.testCase.scenarioName,
      screenshotPath: details.screenshotPath || '',
      stack: details.stack || '',
      startTime: execution.startTime.toISOString(),
      status,
      testId: execution.testCase.id,
      url: details.url || '',
    };
    const existingIndex = this.results.findIndex((item) => item.testId === nextResult.testId && item.browser === nextResult.browser);
    if (existingIndex >= 0) {
      this.results[existingIndex] = nextResult;
    } else {
      this.results.push(nextResult);
    }
    this.addLog(execution.testCase, `Test case ${status.toLowerCase()}`, status, details.failureReason || '');
    this.persist();
  }

  persist() {
    writeJson(this.outputPath, {
      catalog: this.catalog,
      environment: seleniumConfig.environment,
      generatedAt: new Date().toISOString(),
      logs: this.logs,
      results: this.results,
      startedAt: this.startedAt.toISOString(),
    });
  }

  snapshot() {
    return {
      catalog: this.catalog,
      environment: seleniumConfig.environment,
      logs: this.logs,
      results: this.results,
      startedAt: this.startedAt.toISOString(),
    };
  }
}

export const reportStore = new ReportStore();
