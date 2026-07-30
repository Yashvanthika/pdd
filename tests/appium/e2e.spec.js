import { expect } from 'chai';
import { appiumConfig, describeTargetDevice, hasAuthCredentials } from '../../config/appium.config.js';
import { createDriver } from '../../utilities/appium/driverFactory.js';
import { captureFailureArtifacts } from '../../utilities/appium/failureHandler.js';
import { clearLogcat, getDeviceInfo, resolveTargetDevices } from '../../utilities/appium/deviceManager.js';
import { generateExcelReport } from '../../utilities/appium/excelReportGenerator.js';
import { createPages, runMobileCase } from '../../utilities/appium/caseRunner.js';
import { reportStore } from '../../utilities/appium/reportStore.js';
import { generateMobileTestCases, selectMobileTestCases } from '../../utilities/appium/testCatalog.js';
import { logger } from '../../utilities/appium/logger.js';

const allCases = generateMobileTestCases();
const selectedCases = selectMobileTestCases(allCases);
const devices = resolveTargetDevices().map(getDeviceInfo);

reportStore.setCatalog(allCases, devices);

describe('BloodLink Appium E2E catalog', function catalogSuite() {
  it('contains at least 300 mobile test cases', function catalogCount() {
    expect(allCases.length).to.be.at.least(300);
  });

  it('targets the production BloodLink API base URL', function apiBaseUrl() {
    expect(appiumConfig.apiBaseUrl).to.equal('https://bloodlink-api.welcos.in');
  });
});

devices.forEach((device) => {
  describe(`BloodLink Android E2E on ${describeTargetDevice(device)}`, function deviceSuite() {
    this.timeout(appiumConfig.testTimeoutMs);
    this.retries(appiumConfig.retries);

    let driver;
    let pages;

    before(async function beforeDevice() {
      clearLogcat(device);
      driver = await createDriver(device);
      pages = createPages(driver);
      await pages.login.expectAnyText(['BloodLink', 'Search Donors'], 30000);
      logger.info(`Started BloodLink session for ${describeTargetDevice(device)}`);
    });

    after(async function afterDevice() {
      if (driver) {
        await driver.deleteSession();
      }
    });

    selectedCases.forEach((testCase) => {
      it(`${testCase.id} ${testCase.scenarioName}`, async function generatedMobileCase() {
        const execution = reportStore.begin(testCase, device);

        if (testCase.requiresAuth && !hasAuthCredentials() && !appiumConfig.fullReportMode) {
          reportStore.record(execution, 'SKIPPED', {
            actualResult: 'Skipped because APPIUM_USER_EMAIL and APPIUM_USER_PASSWORD are not configured.',
          });
          this.skip();
        }

        try {
          const actualResult = await runMobileCase(testCase, {
            device,
            driver,
            pages,
            reportStore,
          });
          reportStore.record(execution, 'PASSED', { actualResult });
        } catch (error) {
          const artifacts = await captureFailureArtifacts({ device, driver, error, testCase });
          reportStore.record(execution, 'FAILED', artifacts);
          throw error;
        }
      });
    });
  });
});

after(async function writeFinalReports() {
  const reportPath = await generateExcelReport(reportStore.snapshot());
  logger.info(`Excel report generated: ${reportPath}`);
});
