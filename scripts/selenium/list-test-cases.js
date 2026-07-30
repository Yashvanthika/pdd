import { seleniumConfig } from '../../config/selenium.config.js';
import { buildSeleniumTestCatalog } from '../../utilities/testCatalog.js';

const { cases, routes } = buildSeleniumTestCatalog();
const modules = cases.reduce((summary, testCase) => {
  summary[testCase.module] = (summary[testCase.module] || 0) + 1;
  return summary;
}, {});

console.log(`Discovered routes: ${routes.length}`);
console.log(`Generated Selenium test cases: ${cases.length}`);
Object.entries(modules).forEach(([module, count]) => {
  console.log(`- ${module}: ${count}`);
});

if (cases.length < seleniumConfig.minTestCases) {
  throw new Error(`Expected at least ${seleniumConfig.minTestCases} Selenium test cases, generated ${cases.length}.`);
}
