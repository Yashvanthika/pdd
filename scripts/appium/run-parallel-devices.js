import { spawn } from 'node:child_process';
import path from 'node:path';
import { appiumConfig } from '../../config/appium.config.js';
import { listConnectedDevices } from '../../utilities/appium/deviceManager.js';
import { ensureDir, readJson, safeFileName, writeJson } from '../../utilities/appium/fileSystem.js';
import { generateExcelReport } from '../../utilities/appium/excelReportGenerator.js';

const envDevices = appiumConfig.targetUdids.map((udid) => ({ deviceName: udid, model: 'Android Device', udid }));
const devices = envDevices.length > 0 ? envDevices : listConnectedDevices();

if (devices.length === 0) {
  throw new Error('No Android devices found. Connect a phone with USB debugging or start an emulator.');
}

function runForDevice(device) {
  const suffix = safeFileName(device.udid || device.deviceName);
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  return new Promise((resolve) => {
    const child = spawn(pnpm, ['run', 'appium:test'], {
      env: {
        ...process.env,
        APPIUM_PARALLEL_DEVICES: 'false',
        APPIUM_REPORT_SUFFIX: suffix,
        APPIUM_UDID: device.udid,
      },
      stdio: 'inherit',
    });

    child.on('exit', (code) => resolve({ code, device, suffix }));
  });
}

const results = await Promise.all(devices.map(runForDevice));
const failed = results.filter((result) => result.code !== 0);
const snapshots = results.map((result) => readJson(
  path.join(appiumConfig.artifacts.reportsDir, `appium-results-${result.suffix}.json`),
  null,
)).filter(Boolean);

const merged = {
  apiBaseUrl: appiumConfig.apiBaseUrl,
  appPackage: appiumConfig.app.packageName,
  catalog: snapshots.flatMap((snapshot) => snapshot.catalog || []),
  environment: appiumConfig.environment,
  generatedAt: new Date().toISOString(),
  logs: snapshots.flatMap((snapshot) => snapshot.logs || []),
  results: snapshots.flatMap((snapshot) => snapshot.results || []),
  startedAt: snapshots[0]?.startedAt || new Date().toISOString(),
};

ensureDir(appiumConfig.artifacts.reportsDir);
writeJson(appiumConfig.artifacts.resultsFile, merged);
await generateExcelReport(merged);

if (failed.length > 0) {
  throw new Error(`${failed.length} Appium device worker(s) failed.`);
}
