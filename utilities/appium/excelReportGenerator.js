import ExcelJS from 'exceljs';
import { appiumConfig } from '../../config/appium.config.js';
import { ensureDir, readJson } from './fileSystem.js';
import { generateMobileTestCases } from './testCatalog.js';

function durationLabel(ms) {
  if (!Number.isFinite(ms)) return '0s';
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${seconds}s`;
}

function styleWorksheet(worksheet) {
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    fgColor: { argb: 'FF9F1239' },
    pattern: 'solid',
    type: 'pattern',
  };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
  worksheet.columns.forEach((column) => {
    column.width = Math.max(column.width || 12, 16);
  });
}

function buildResultMap(results) {
  return new Map(results.map((result) => [`${result.testId}:${result.device}`, result]));
}

function uniqueDevices(snapshot) {
  const devices = new Set([
    ...(snapshot.catalog || []).map((item) => item.device),
    ...(snapshot.results || []).map((item) => item.device),
  ].filter(Boolean));
  return [...devices];
}

export async function generateExcelReport(snapshot) {
  ensureDir(appiumConfig.artifacts.excelDir);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BloodLink Appium Automation';
  workbook.created = new Date();

  const results = snapshot.results || [];
  const logs = snapshot.logs || [];
  const catalog = snapshot.catalog?.length ? snapshot.catalog : results;
  const resultMap = buildResultMap(results);
  const passed = results.filter((item) => item.status === 'PASSED').length;
  const failed = results.filter((item) => item.status === 'FAILED').length;
  const skipped = results.filter((item) => item.status === 'SKIPPED').length;
  const totalExecuted = results.length;
  const totalCatalog = catalog.length;
  const durationMs = results.reduce((sum, item) => sum + (item.durationMs || 0), 0);
  const passPercentage = totalExecuted === 0 ? 0 : Math.round((passed / totalExecuted) * 10000) / 100;

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Execution Date', key: 'executionDate', width: 26 },
    { header: 'Environment', key: 'environment', width: 18 },
    { header: 'API Base URL', key: 'apiBaseUrl', width: 36 },
    { header: 'App Package', key: 'appPackage', width: 24 },
    { header: 'Devices', key: 'devices', width: 44 },
    { header: 'Catalog Tests', key: 'catalogTests', width: 16 },
    { header: 'Executed Tests', key: 'executedTests', width: 16 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Skipped', key: 'skipped', width: 12 },
    { header: 'Pass Percentage', key: 'passPercentage', width: 18 },
    { header: 'Execution Duration', key: 'executionDuration', width: 22 },
  ];
  summary.addRow({
    apiBaseUrl: snapshot.apiBaseUrl || appiumConfig.apiBaseUrl,
    appPackage: snapshot.appPackage || appiumConfig.app.packageName,
    catalogTests: totalCatalog,
    devices: uniqueDevices(snapshot).join(', '),
    environment: snapshot.environment || appiumConfig.environment,
    executedTests: totalExecuted,
    executionDate: new Date().toISOString(),
    executionDuration: durationLabel(durationMs),
    failed,
    passPercentage,
    passed,
    skipped,
  });
  styleWorksheet(summary);

  const testCases = workbook.addWorksheet('Test Cases');
  testCases.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Module', key: 'module', width: 24 },
    { header: 'Priority', key: 'priority', width: 12 },
    { header: 'Scenario Name', key: 'scenarioName', width: 74 },
    { header: 'Screen', key: 'screen', width: 20 },
    { header: 'Action', key: 'action', width: 26 },
    { header: 'Device', key: 'device', width: 28 },
    { header: 'Auth Required', key: 'authRequired', width: 16 },
    { header: 'Tags', key: 'tags', width: 28 },
    { header: 'Expected Result', key: 'expected', width: 70 },
    { header: 'Actual Result', key: 'actualResult', width: 70 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Start Time', key: 'startTime', width: 26 },
    { header: 'End Time', key: 'endTime', width: 26 },
    { header: 'Duration', key: 'duration', width: 16 },
    { header: 'Activity', key: 'activity', width: 36 },
    { header: 'Screenshot Path', key: 'screenshotPath', width: 60 },
    { header: 'Logcat Path', key: 'logcatPath', width: 60 },
  ];
  catalog.forEach((item) => {
    const result = resultMap.get(`${item.testId}:${item.device}`) || {};
    testCases.addRow({
      ...item,
      ...result,
      authRequired: item.requiresAuth || result.requiresAuth ? 'Yes' : 'No',
      duration: result.durationMs ? durationLabel(result.durationMs) : '',
      status: result.status || 'NOT RUN',
    });
  });
  styleWorksheet(testCases);

  const failedTests = workbook.addWorksheet('Failed Tests');
  failedTests.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Test Name', key: 'testName', width: 74 },
    { header: 'Device', key: 'device', width: 28 },
    { header: 'Failure Reason', key: 'failureReason', width: 90 },
    { header: 'Current Activity', key: 'activity', width: 36 },
    { header: 'Screenshot Path', key: 'screenshotPath', width: 60 },
    { header: 'Page Source Path', key: 'pageSourcePath', width: 60 },
    { header: 'Logcat Path', key: 'logcatPath', width: 60 },
    { header: 'Stack', key: 'stack', width: 90 },
  ];
  results
    .filter((item) => item.status === 'FAILED')
    .forEach((item) => {
      failedTests.addRow({
        activity: item.activity,
        device: item.device,
        failureReason: item.failureReason,
        logcatPath: item.logcatPath,
        pageSourcePath: item.pageSourcePath,
        screenshotPath: item.screenshotPath,
        stack: item.stack,
        testId: item.testId,
        testName: item.scenarioName,
      });
    });
  styleWorksheet(failedTests);

  const executionLogs = workbook.addWorksheet('Execution Logs');
  executionLogs.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 26 },
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Test Name', key: 'testName', width: 74 },
    { header: 'Device', key: 'device', width: 28 },
    { header: 'Step Description', key: 'stepDescription', width: 74 },
    { header: 'Result', key: 'result', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 90 },
  ];
  logs.forEach((entry) => executionLogs.addRow(entry));
  styleWorksheet(executionLogs);

  await workbook.xlsx.writeFile(appiumConfig.artifacts.excelFile);
  return appiumConfig.artifacts.excelFile;
}

export async function generateExcelReportFromDisk() {
  const fallbackDevice = process.env.APPIUM_UDID || 'Android Device';
  const fallbackCatalog = generateMobileTestCases().map((testCase) => ({
    action: testCase.action || '',
    device: fallbackDevice,
    expected: testCase.expected || '',
    module: testCase.module,
    priority: testCase.priority,
    requiresAuth: Boolean(testCase.requiresAuth),
    scenarioName: testCase.scenarioName,
    screen: testCase.screen,
    tags: (testCase.tags || []).join(', '),
    testId: testCase.id,
  }));

  const snapshot = readJson(appiumConfig.artifacts.resultsFile, {
    apiBaseUrl: appiumConfig.apiBaseUrl,
    appPackage: appiumConfig.app.packageName,
    catalog: fallbackCatalog,
    environment: appiumConfig.environment,
    logs: [],
    results: [],
    startedAt: new Date().toISOString(),
  });

  if (!snapshot.catalog?.length) {
    snapshot.catalog = fallbackCatalog;
  }

  return generateExcelReport(snapshot);
}
