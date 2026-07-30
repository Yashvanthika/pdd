import { appiumConfig } from '../../config/appium.config.js';
import { ensureDir, writeJson } from './fileSystem.js';

class AppiumReportStore {
  constructor() {
    this.startedAt = new Date();
    this.catalog = [];
    this.results = [];
    this.logs = [];
    ensureDir(appiumConfig.artifacts.reportsDir);
  }

  setCatalog(testCases, devices) {
    this.catalog = devices.flatMap((device) => testCases.map((testCase) => ({
      action: testCase.action || '',
      device: device.udid || device.deviceName || 'Android Device',
      expected: testCase.expected || '',
      module: testCase.module,
      priority: testCase.priority,
      requiresAuth: Boolean(testCase.requiresAuth),
      scenarioName: testCase.scenarioName,
      screen: testCase.screen,
      tags: (testCase.tags || []).join(', '),
      testId: testCase.id,
    })));
    this.persist();
  }

  begin(testCase, device) {
    const startedAt = new Date();
    this.addLog(testCase, device, 'Test case started', 'INFO', `Action: ${testCase.action}`);
    return { device, startTime: startedAt, testCase };
  }

  addLog(testCase, device, stepDescription, result = 'INFO', remarks = '') {
    this.logs.push({
      device: device?.udid || device?.deviceName || 'Android Device',
      remarks,
      result,
      stepDescription,
      testId: testCase?.id || '',
      testName: testCase?.scenarioName || 'Framework',
      timestamp: new Date().toISOString(),
    });
  }

  record(execution, status, details = {}) {
    const endTime = new Date();
    const durationMs = endTime.getTime() - execution.startTime.getTime();
    this.results.push({
      action: execution.testCase.action,
      activity: details.activity || '',
      actualResult: details.actualResult || '',
      device: execution.device?.udid || execution.device?.deviceName || 'Android Device',
      durationMs,
      endTime: endTime.toISOString(),
      expected: execution.testCase.expected || '',
      failureReason: details.failureReason || '',
      logcatPath: details.logcatPath || '',
      module: execution.testCase.module,
      pageSourcePath: details.pageSourcePath || '',
      platformVersion: execution.device?.platformVersion || '',
      priority: execution.testCase.priority,
      requiresAuth: Boolean(execution.testCase.requiresAuth),
      scenarioName: execution.testCase.scenarioName,
      screen: execution.testCase.screen,
      screenshotPath: details.screenshotPath || '',
      stack: details.stack || '',
      startTime: execution.startTime.toISOString(),
      status,
      tags: (execution.testCase.tags || []).join(', '),
      testId: execution.testCase.id,
    });
    this.addLog(execution.testCase, execution.device, `Test case ${status.toLowerCase()}`, status, details.failureReason || details.actualResult || '');
    this.persist();
  }

  persist() {
    writeJson(appiumConfig.artifacts.resultsFile, this.snapshot());
  }

  snapshot() {
    return {
      apiBaseUrl: appiumConfig.apiBaseUrl,
      appPackage: appiumConfig.app.packageName,
      catalog: this.catalog,
      environment: appiumConfig.environment,
      generatedAt: new Date().toISOString(),
      logs: this.logs,
      results: this.results,
      startedAt: this.startedAt.toISOString(),
    };
  }
}

export const reportStore = new AppiumReportStore();
