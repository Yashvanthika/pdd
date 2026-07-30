module.exports = {
  color: true,
  exit: true,
  reporter: 'mochawesome',
  'reporter-option': [
    'html=true',
    'json=true',
    'overwrite=false',
    'quiet=true',
    'reportDir=reports/mochawesome',
    'reportFilename=selenium-e2e',
  ],
  spec: ['tests/selenium/**/*.spec.js'],
  timeout: Number(process.env.E2E_TEST_TIMEOUT_MS || 60000),
};
