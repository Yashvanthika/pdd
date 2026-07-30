import ExcelJS from 'exceljs';
import { loadConfig } from '../../config/load.config.js';
import { ensureDir, readJson } from '../fileSystem.js';
import { buildLoadTestCatalog } from './testCatalog.js';

function durationLabel(ms) {
  if (!Number.isFinite(ms)) return '0s';
  const seconds = Math.round(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remainder}s` : `${seconds}s`;
}

function percentile(values, percentileValue) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function styleWorksheet(worksheet) {
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    fgColor: { argb: 'FF7A1F1F' },
    pattern: 'solid',
    type: 'pattern',
  };
  worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
  worksheet.columns.forEach((column) => {
    column.width = Math.min(Math.max(column.width || 14, 14), 78);
  });
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    });
  });
}

function addStatusStyles(worksheet, statusColumnKey = 'status') {
  const statusColumn = worksheet.getColumn(statusColumnKey);
  statusColumn.eachCell((cell, rowNumber) => {
    if (rowNumber === 1) return;
    if (cell.value === 'PASSED') {
      cell.fill = { fgColor: { argb: 'FFE6F4EA' }, pattern: 'solid', type: 'pattern' };
      cell.font = { bold: true, color: { argb: 'FF137333' } };
    }
    if (cell.value === 'FAILED') {
      cell.fill = { fgColor: { argb: 'FFFCE8E6' }, pattern: 'solid', type: 'pattern' };
      cell.font = { bold: true, color: { argb: 'FFC5221F' } };
    }
    if (cell.value === 'SKIPPED') {
      cell.fill = { fgColor: { argb: 'FFFFF4E5' }, pattern: 'solid', type: 'pattern' };
      cell.font = { bold: true, color: { argb: 'FFB06000' } };
    }
  });
}

function endpointKey(result) {
  const routePath = String(result.path || '').split('?')[0];
  return `${result.method || 'GET'} ${routePath}`;
}

function buildEndpointMetrics(results) {
  const groups = new Map();
  results.forEach((result) => {
    const key = endpointKey(result);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(result);
  });

  return Array.from(groups.entries()).map(([endpoint, items]) => {
    const durations = items.map((item) => item.durationMs).filter(Number.isFinite);
    const passed = items.filter((item) => item.status === 'PASSED').length;
    const failed = items.filter((item) => item.status === 'FAILED').length;
    return {
      avgMs: durations.length ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length) : 0,
      endpoint,
      failed,
      maxMs: durations.length ? Math.max(...durations) : 0,
      minMs: durations.length ? Math.min(...durations) : 0,
      p95Ms: percentile(durations, 95),
      passed,
      requests: items.length,
      statusCodes: Array.from(new Set(items.map((item) => item.responseStatus))).sort((a, b) => a - b).join(', '),
    };
  }).sort((a, b) => b.requests - a.requests || a.endpoint.localeCompare(b.endpoint));
}

function catalogFromCurrentConfig() {
  const { cases } = buildLoadTestCatalog();
  return cases.map((testCase) => ({
    expectedStatuses: testCase.expectedStatuses.join(', '),
    method: testCase.method,
    module: testCase.module,
    path: testCase.path,
    requiresAuth: testCase.requiresAuth,
    scenarioName: testCase.scenarioName,
    tags: (testCase.tags || []).join(', '),
    testId: testCase.id,
  }));
}

export async function generateLoadExcelReport(snapshot) {
  ensureDir(loadConfig.artifacts.excelDir);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BloodLink Load Automation';
  workbook.created = new Date();

  const results = snapshot.results || [];
  const catalog = snapshot.catalog?.length ? snapshot.catalog : catalogFromCurrentConfig();
  const logs = snapshot.logs || [];
  const summaryValues = snapshot.summary || {};

  const summary = workbook.addWorksheet('Summary');
  summary.columns = [
    { header: 'Metric', key: 'metric', width: 34 },
    { header: 'Value', key: 'value', width: 42 },
  ];
  [
    ['Execution Date', new Date().toISOString()],
    ['Environment', snapshot.environment || loadConfig.environment],
    ['Base URL', snapshot.config?.baseUrl || loadConfig.baseUrl],
    ['Catalog Test Cases', summaryValues.allCatalogCases || catalog.length],
    ['Executed Unique Test Cases', summaryValues.executedUniqueCases || catalog.length],
    ['Total Requests', summaryValues.total || results.length],
    ['Concurrency', snapshot.config?.concurrency || loadConfig.concurrency],
    ['Rounds', snapshot.config?.rounds || loadConfig.rounds],
    ['Passed Requests', summaryValues.passed || 0],
    ['Failed Requests', summaryValues.failed || 0],
    ['Failure Rate', `${summaryValues.failureRatePct || 0}%`],
    ['Average Latency', `${summaryValues.avgMs || 0} ms`],
    ['P50 Latency', `${summaryValues.p50Ms || 0} ms`],
    ['P95 Latency', `${summaryValues.p95Ms || 0} ms`],
    ['Max Latency', `${summaryValues.maxMs || 0} ms`],
    ['Execution Duration', durationLabel(summaryValues.durationMs || 0)],
    ['Requests / Second', summaryValues.requestsPerSecond || 0],
  ].forEach(([metric, value]) => summary.addRow({ metric, value }));
  styleWorksheet(summary);

  const testCaseCatalog = workbook.addWorksheet('Test Case Catalog');
  testCaseCatalog.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Module', key: 'module', width: 28 },
    { header: 'Scenario Name', key: 'scenarioName', width: 78 },
    { header: 'Method', key: 'method', width: 12 },
    { header: 'Path', key: 'path', width: 78 },
    { header: 'Expected Statuses', key: 'expectedStatuses', width: 22 },
    { header: 'Auth Required', key: 'authRequired', width: 16 },
    { header: 'Tags', key: 'tags', width: 30 },
  ];
  catalog.forEach((item) => {
    testCaseCatalog.addRow({
      ...item,
      authRequired: item.requiresAuth ? 'Yes' : 'No',
    });
  });
  styleWorksheet(testCaseCatalog);

  const requestResults = workbook.addWorksheet('Request Results');
  requestResults.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Round', key: 'round', width: 10 },
    { header: 'Module', key: 'module', width: 28 },
    { header: 'Scenario Name', key: 'scenarioName', width: 72 },
    { header: 'Method', key: 'method', width: 12 },
    { header: 'Path', key: 'path', width: 78 },
    { header: 'Expected Statuses', key: 'expectedStatuses', width: 20 },
    { header: 'Actual Status', key: 'responseStatus', width: 14 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Duration Ms', key: 'durationMs', width: 14 },
    { header: 'Response Bytes', key: 'responseBytes', width: 16 },
    { header: 'Start Time', key: 'startTime', width: 26 },
    { header: 'End Time', key: 'endTime', width: 26 },
    { header: 'Failure Reason', key: 'failureReason', width: 80 },
  ];
  results.forEach((item) => requestResults.addRow(item));
  styleWorksheet(requestResults);
  addStatusStyles(requestResults);

  const failedRequests = workbook.addWorksheet('Failed Requests');
  failedRequests.columns = [
    { header: 'Test ID', key: 'testId', width: 16 },
    { header: 'Scenario Name', key: 'scenarioName', width: 72 },
    { header: 'Method', key: 'method', width: 12 },
    { header: 'Path', key: 'path', width: 78 },
    { header: 'Actual Status', key: 'responseStatus', width: 14 },
    { header: 'Duration Ms', key: 'durationMs', width: 14 },
    { header: 'Failure Reason', key: 'failureReason', width: 90 },
  ];
  results
    .filter((item) => item.status === 'FAILED')
    .forEach((item) => failedRequests.addRow(item));
  styleWorksheet(failedRequests);

  const endpointMetrics = workbook.addWorksheet('Endpoint Metrics');
  endpointMetrics.columns = [
    { header: 'Endpoint', key: 'endpoint', width: 78 },
    { header: 'Requests', key: 'requests', width: 12 },
    { header: 'Passed', key: 'passed', width: 12 },
    { header: 'Failed', key: 'failed', width: 12 },
    { header: 'Min Ms', key: 'minMs', width: 12 },
    { header: 'Avg Ms', key: 'avgMs', width: 12 },
    { header: 'P95 Ms', key: 'p95Ms', width: 12 },
    { header: 'Max Ms', key: 'maxMs', width: 12 },
    { header: 'Status Codes', key: 'statusCodes', width: 18 },
  ];
  buildEndpointMetrics(results).forEach((item) => endpointMetrics.addRow(item));
  styleWorksheet(endpointMetrics);

  const executionLogs = workbook.addWorksheet('Execution Logs');
  executionLogs.columns = [
    { header: 'Timestamp', key: 'timestamp', width: 26 },
    { header: 'Test Name', key: 'testName', width: 42 },
    { header: 'Step Description', key: 'stepDescription', width: 70 },
    { header: 'Result', key: 'result', width: 14 },
    { header: 'Remarks', key: 'remarks', width: 90 },
  ];
  logs.forEach((entry) => executionLogs.addRow(entry));
  styleWorksheet(executionLogs);

  await workbook.xlsx.writeFile(loadConfig.artifacts.excelFile);
  return loadConfig.artifacts.excelFile;
}

export async function generateLoadExcelReportFromDisk() {
  const snapshot = readJson(loadConfig.artifacts.resultsFile, {
    catalog: catalogFromCurrentConfig(),
    config: {
      baseUrl: loadConfig.baseUrl,
      concurrency: loadConfig.concurrency,
      rounds: loadConfig.rounds,
      thresholds: loadConfig.thresholds,
    },
    environment: loadConfig.environment,
    logs: [],
    results: [],
    startedAt: new Date().toISOString(),
    summary: {},
  });
  return generateLoadExcelReport(snapshot);
}
