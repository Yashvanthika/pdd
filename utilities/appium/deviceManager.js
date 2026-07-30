import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appiumConfig } from '../../config/appium.config.js';
import { ensureDir, safeFileName, writeText } from './fileSystem.js';
import { logger } from './logger.js';

const portableToolchain = '/private/tmp/bloodlink-android-toolchain';

function firstExisting(paths) {
  return paths.find((item) => item && fs.existsSync(item));
}

export function resolveAndroidEnv() {
  const androidHome = firstExisting([
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(portableToolchain, 'android-sdk'),
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  ]);

  const javaHome = firstExisting([
    process.env.JAVA_HOME,
    path.join(portableToolchain, 'jdk', 'jdk-17.0.19+10', 'Contents', 'Home'),
  ]);

  const adbPath = process.env.ADB_PATH || firstExisting([
    androidHome ? path.join(androidHome, 'platform-tools', 'adb') : '',
    '/opt/homebrew/bin/adb',
    '/usr/local/bin/adb',
  ]) || 'adb';

  const pathParts = [
    javaHome ? path.join(javaHome, 'bin') : '',
    androidHome ? path.join(androidHome, 'platform-tools') : '',
    androidHome ? path.join(androidHome, 'cmdline-tools', 'latest', 'bin') : '',
    process.env.PATH || '',
  ].filter(Boolean);

  return {
    adbPath,
    env: {
      ...process.env,
      ANDROID_HOME: androidHome || process.env.ANDROID_HOME,
      ANDROID_SDK_ROOT: androidHome || process.env.ANDROID_SDK_ROOT,
      JAVA_HOME: javaHome || process.env.JAVA_HOME,
      PATH: pathParts.join(path.delimiter),
    },
  };
}

export function runAdb(args, options = {}) {
  const { adbPath, env } = resolveAndroidEnv();
  const commandArgs = options.udid ? ['-s', options.udid, ...args] : args;

  try {
    return execFileSync(adbPath, commandArgs, {
      encoding: 'utf8',
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeoutMs || 30000,
    }).trim();
  } catch (error) {
    const stderr = error.stderr?.toString?.() || '';
    const stdout = error.stdout?.toString?.() || '';
    const message = [stderr, stdout, error.message].filter(Boolean).join('\n').trim();

    if (options.allowFailure) {
      logger.warn(`adb ${commandArgs.join(' ')} failed: ${message}`);
      return '';
    }

    throw new Error(`adb ${commandArgs.join(' ')} failed: ${message}`);
  }
}

function parseDeviceDetails(details) {
  return Object.fromEntries(
    details
      .split(/\s+/)
      .map((part) => part.split(':'))
      .filter(([key, value]) => key && value),
  );
}

export function listConnectedDevices() {
  const output = runAdb(['devices', '-l'], { allowFailure: true });
  return output
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [udid, status, ...details] = line.split(/\s+/);
      const parsed = parseDeviceDetails(details.join(' '));
      return {
        deviceName: parsed.device || parsed.model || udid,
        model: parsed.model || parsed.device || 'Android',
        platformVersion: getDeviceProperty(udid, 'ro.build.version.release'),
        status,
        udid,
      };
    })
    .filter((device) => device.status === 'device');
}

export function resolveTargetDevices() {
  const connected = listConnectedDevices();

  if (appiumConfig.targetUdids.length > 0) {
    const filtered = appiumConfig.targetUdids.map((udid) => {
      const known = connected.find((device) => device.udid === udid);
      return known || { deviceName: udid, model: 'Android Device', platformVersion: '', status: 'device', udid };
    });
    return appiumConfig.parallelDevices ? filtered : filtered.slice(0, 1);
  }

  if (connected.length > 0) {
    return appiumConfig.parallelDevices ? connected : connected.slice(0, 1);
  }

  return [{ deviceName: 'Android Device', model: 'Android Device', platformVersion: '', status: 'unknown', udid: '' }];
}

export function getDeviceProperty(udid, property) {
  if (!udid) return '';
  return runAdb(['shell', 'getprop', property], { allowFailure: true, timeoutMs: 10000, udid });
}

export function getDeviceInfo(device) {
  if (!device?.udid) return device || {};

  return {
    ...device,
    apiLevel: getDeviceProperty(device.udid, 'ro.build.version.sdk'),
    manufacturer: getDeviceProperty(device.udid, 'ro.product.manufacturer'),
    model: getDeviceProperty(device.udid, 'ro.product.model') || device.model,
    platformVersion: getDeviceProperty(device.udid, 'ro.build.version.release') || device.platformVersion,
    screenSize: runAdb(['shell', 'wm', 'size'], { allowFailure: true, timeoutMs: 10000, udid: device.udid }),
  };
}

export function clearLogcat(device) {
  if (!device?.udid) return;
  runAdb(['logcat', '-c'], { allowFailure: true, timeoutMs: 10000, udid: device.udid });
}

export function captureLogcat(device, testCase, maxLines = 2000) {
  if (!device?.udid) return '';

  const fileName = `${safeFileName(testCase.id)}-${safeFileName(device.udid)}.log`;
  const outputPath = path.join(appiumConfig.artifacts.failuresDir, fileName);
  const output = runAdb(['logcat', '-d', '-t', String(maxLines)], {
    allowFailure: true,
    timeoutMs: 30000,
    udid: device.udid,
  });

  if (!output) return '';
  ensureDir(path.dirname(outputPath));
  writeText(outputPath, output);
  return outputPath;
}

export function getCurrentActivity(device) {
  if (!device?.udid) return '';

  const focusedApp = runAdb(['shell', 'dumpsys', 'window'], {
    allowFailure: true,
    timeoutMs: 30000,
    udid: device.udid,
  });

  const match = focusedApp.match(/mCurrentFocus=.*? ([^/\s]+\/[^\s}]+)/)
    || focusedApp.match(/mFocusedApp=.*? ([^/\s]+\/[^\s}]+)/);

  return match?.[1] || '';
}

export function installApk(device, apkPath) {
  if (!device?.udid || !apkPath || !fs.existsSync(apkPath)) return false;
  runAdb(['install', '-r', apkPath], { timeoutMs: 120000, udid: device.udid });
  return true;
}

export function clearAppData(device, packageName = appiumConfig.app.packageName) {
  if (!device?.udid) return;
  runAdb(['shell', 'pm', 'clear', packageName], { allowFailure: true, timeoutMs: 30000, udid: device.udid });
}
