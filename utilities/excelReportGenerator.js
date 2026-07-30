import ExcelJS from 'exceljs';
import { seleniumConfig } from '../config/selenium.config.js';
import { ensureDir, readJson } from './fileSystem.js';

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
    fgColor: { argb: 'FF7A1F1F' },
    pattern: 'solid',
    type: 'pattern',
  };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
  worksheet.columns.forEach((column) => {
    column.width = Math.max(column.width || 12, 18);
  });
}

export async function generateExcelReport(snapshot) {
  ensureDir(seleniumConfig.artifacts.excelDir);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BloodLink Selenium Automation';
  workbook.created = new Date();

  const results = snapshot.results || [];
  const logs = snapshot.logs || [];
  const catalog = snapshot.catalog?.length ? snapshot.catalog : results.map((item) => ({
    action: item.action || '',
    browser: item.browser || '',
    module: item.module || '',
    path: item.path || '',
    requiresAuth: Boolean(item.requiresAuth),
    scenarioName: item.scenarioName || '',
    testId: item.testId || '',
  }));
  const passed = results.filter((item) => item.status === 'PASSED').length;
  const failed = results.filter((item) => item.status === 'FAILED').length;
  const skipped = results.filter((item) => item.status === 'SKIPPED').length;
  const total = results.length;
  const durationMs = results.reduce((sum, item) => sum + (item.durationMs || 0), 0);
  const passPercentage = total === 0 ? 0 : Math.round((passed / total) * 10000) / 100;

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Execution Date', key: 'executionDate', width: 26 },
    { header: 'Environment', key: 'environment', width: 18 },
    { header: 'Total Tests', key: 'totalTests', width: 14 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Skipped', key: 'skipped', width: 12 },
    { header: 'Pass Percentage', key: 'passPercentage', width: 18 },
    { header: 'Execution Duration', key: 'executionDuration', width: 22 },
  ];
  summary.addRow({
    environment: snapshot.environment || seleniumConfig.environment,
    executionDate: new Date().toISOString(),
    executionDuration: durationLabel(durationMs),
    failed,
    passPercentage,
    passed,
    skipped,
    totalTests: total,
  });
  styleWorksheet(summary);

  const testCaseCatalog = workbook.addWorksheet('Test Case Catalog');
  testCaseCatalog.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Module', key: 'module', width: 24 },
    { header: 'Scenario Name', key: 'scenarioName', width: 76 },
    { header: 'Route / Path', key: 'path', width: 38 },
    { header: 'Browser', key: 'browser', width: 14 },
    { header: 'Auth Required', key: 'authRequired', width: 16 },
    { header: 'Action', key: 'action', width: 24 },
  ];
  catalog.forEach((item) => {
    testCaseCatalog.addRow({
      action: item.action,
      authRequired: item.requiresAuth ? 'Yes' : 'No',
      browser: item.browser,
      module: item.module,
      path: item.path,
      scenarioName: item.scenarioName,
      testId: item.testId,
    });
  });
  styleWorksheet(testCaseCatalog);

  const testCases = workbook.addWorksheet('Test Cases');
  testCases.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Module', key: 'module', width: 24 },
    { header: 'Scenario Name', key: 'scenarioName', width: 70 },
    { header: 'Route / Path', key: 'path', width: 38 },
    { header: 'Browser', key: 'browser', width: 14 },
    { header: 'Auth Required', key: 'authRequired', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Start Time', key: 'startTime', width: 26 },
    { header: 'End Time', key: 'endTime', width: 26 },
    { header: 'Duration', key: 'duration', width: 16 },
  ];
  results.forEach((item) => {
    testCases.addRow({
      ...item,
      authRequired: item.requiresAuth ? 'Yes' : 'No',
      duration: durationLabel(item.durationMs),
    });
  });
  styleWorksheet(testCases);

  const failedTests = workbook.addWorksheet('Failed Tests');
  failedTests.columns = [
    { header: 'Test Name', key: 'testName', width: 70 },
    { header: 'Failure Reason', key: 'failureReason', width: 90 },
    { header: 'Screenshot Path', key: 'screenshotPath', width: 60 },
    { header: 'Browser', key: 'browser', width: 14 },
    { header: 'URL', key: 'url', width: 70 },
  ];
  results
    .filter((item) => item.status === 'FAILED')
    .forEach((item) => {
      failedTests.addRow({
        browser: item.browser,
        failureReason: item.failureReason,
        screenshotPath: item.screenshotPath,
        testName: item.scenarioName,
        url: item.url,
      });
    });
  styleWorksheet(failedTests);

  const executionLogs = workbook.addWorksheet('Execution Logs');
  executionLogs.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 26 },
    { header: 'Test Name', key: 'testName', width: 70 },
    { header: 'Step Description', key: 'stepDescription', width: 70 },
    { header: 'Result', key: 'result', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 90 },
  ];
  logs.forEach((entry) => executionLogs.addRow(entry));
  styleWorksheet(executionLogs);

  await workbook.xlsx.writeFile(seleniumConfig.artifacts.excelFile);
  return seleniumConfig.artifacts.excelFile;
}

export async function generateExcelReportFromDisk() {
  const snapshot = readJson(seleniumConfig.artifacts.resultsFile, {
    environment: seleniumConfig.environment,
    logs: [],
    results: [],
    startedAt: new Date().toISOString(),
  });
  return generateExcelReport(snapshot);
}
