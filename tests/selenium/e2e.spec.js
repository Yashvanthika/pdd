import { expect } from 'chai';
import { seleniumConfig } from '../../config/selenium.config.js';
import { BloodLinkPage } from '../../pages/bloodlink.page.js';
import { createDriver } from '../../utilities/browserFactory.js';
import { executeSeleniumCase } from '../../utilities/caseRunner.js';
import { captureFailure } from '../../utilities/failureHandler.js';
import { generateExcelReport } from '../../utilities/excelReportGenerator.js';
import { logger } from '../../utilities/logger.js';
import { reportStore } from '../../utilities/reportStore.js';
import { buildSeleniumTestCatalog } from '../../utilities/testCatalog.js';

const { cases: allCases, routes } = buildSeleniumTestCatalog();
const cases = selectCases(allCases);
reportStore.setCatalog(cases, seleniumConfig.browsers);

function selectCases(catalogCases) {
  const filter = seleniumConfig.caseFilter.trim().toLowerCase();
  const filtered = filter
    ? catalogCases.filter((testCase) => [
      testCase.action,
      testCase.id,
      testCase.module,
      testCase.path,
      testCase.scenarioName,
    ].some((value) => String(value).toLowerCase().includes(filter)))
    : catalogCases;

  const hasAuthCredentials = Boolean(seleniumConfig.auth.email && seleniumConfig.auth.password);
  const executableCases = hasAuthCredentials ? filtered : filtered.filter((testCase) => !testCase.requiresAuth);

  return seleniumConfig.maxCases > 0 ? executableCases.slice(0, seleniumConfig.maxCases) : executableCases;
}

describe('BloodLink Selenium catalog', function catalogSuite() {
  it(`generates at least ${seleniumConfig.minTestCases} project-aware Selenium test cases`, function catalogCount() {
    expect(allCases.length).to.be.at.least(seleniumConfig.minTestCases);
    expect(cases.length).to.be.at.least(seleniumConfig.minTestCases);
    expect(routes.length).to.be.greaterThan(0);
  });
});

for (const browser of seleniumConfig.browsers) {
  describe(`BloodLink Selenium E2E on ${browser}`, function browserSuite() {
    this.timeout(seleniumConfig.testTimeoutMs);
    this.retries(seleniumConfig.retries);

    let driver;
    let page;

    before(async function setupBrowser() {
      logger.info(`Starting Selenium browser: ${browser}`);
      driver = await createDriver(browser);
      page = new BloodLinkPage(driver);
    });

    after(async function teardownBrowser() {
      if (driver) await driver.quit();
      logger.info(`Stopped Selenium browser: ${browser}`);
    });

    cases.forEach((testCase) => {
      it(`${testCase.id} ${testCase.module} - ${testCase.scenarioName}`, async function runGeneratedCase() {
        const execution = reportStore.begin(testCase, browser);

        try {
          await executeSeleniumCase({ browser, driver, page, testCase });
          const url = await driver.getCurrentUrl().catch(() => '');
          reportStore.record(execution, 'PASSED', { url });
        } catch (error) {
          const failure = await captureFailure({ browser, driver, error, testCase });
          reportStore.record(execution, 'FAILED', {
            failureReason: error.message,
            screenshotPath: failure.screenshotPath,
            stack: error.stack,
            url: failure.currentUrl,
          });
          throw error;
        }
      });
    });
  });
}

after(async function writeExcelReport() {
  const reportPath = await generateExcelReport(reportStore.snapshot());
  logger.info(`Excel report generated: ${reportPath}`);
});
