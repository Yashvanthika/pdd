import { Builder, logging } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';
import firefox from 'selenium-webdriver/firefox.js';
import { seleniumConfig } from '../config/selenium.config.js';

function loggingPreferences() {
  const preferences = new logging.Preferences();
  preferences.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  preferences.setLevel(logging.Type.DRIVER, logging.Level.INFO);
  return preferences;
}

function chromeOptions() {
  const options = new chrome.Options();
  options.addArguments('--window-size=1440,1000');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  options.setLoggingPrefs(loggingPreferences());
  if (seleniumConfig.headless) options.addArguments('--headless=new');
  return options;
}

function edgeOptions() {
  const options = new edge.Options();
  options.addArguments('--window-size=1440,1000');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-gpu');
  if (seleniumConfig.headless) options.addArguments('--headless=new');
  return options;
}

function firefoxOptions() {
  const options = new firefox.Options();
  options.windowSize({ width: 1440, height: 1000 });
  if (seleniumConfig.headless) options.addArguments('-headless');
  return options;
}

export async function createDriver(browserName) {
  const normalizedBrowser = browserName.toLowerCase();
  let builder = new Builder();

  if (normalizedBrowser === 'chrome') {
    builder = builder.forBrowser('chrome').setChromeOptions(chromeOptions());
  } else if (normalizedBrowser === 'firefox') {
    builder = builder.forBrowser('firefox').setFirefoxOptions(firefoxOptions());
  } else if (normalizedBrowser === 'edge' || normalizedBrowser === 'microsoftedge') {
    builder = builder.forBrowser('MicrosoftEdge').setEdgeOptions(edgeOptions());
  } else {
    throw new Error(`Unsupported browser "${browserName}". Use chrome, firefox, or edge.`);
  }

  const driver = await builder.build();
  await driver.manage().setTimeouts({
    implicit: 1000,
    pageLoad: seleniumConfig.testTimeoutMs,
    script: seleniumConfig.testTimeoutMs,
  });
  await driver.manage().window().setRect({ width: 1440, height: 1000 });
  return driver;
}
