const retries = Number(process.env.APPIUM_RETRIES || 1);
const timeout = Number(process.env.APPIUM_TEST_TIMEOUT_MS || 90000);

module.exports = {
  color: true,
  exit: true,
  reporter: 'mochawesome',
  'reporter-option': [
    'charts=true',
    'code=false',
    'html=true',
    'json=true',
    'overwrite=true',
    'quiet=true',
    'reportDir=reports/appium/mochawesome',
    `reportFilename=${process.env.APPIUM_REPORT_SUFFIX
      ? `mochawesome-${process.env.APPIUM_REPORT_SUFFIX}`
      : 'mochawesome'}`,
  ],
  retries,
  spec: ['tests/appium/**/*.spec.js'],
  timeout,
};
