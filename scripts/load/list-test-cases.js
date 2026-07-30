import { loadConfig } from '../../config/load.config.js';
import { buildLoadTestCatalog } from '../../utilities/load/testCatalog.js';

const { cases, stats } = buildLoadTestCatalog();
const modules = cases.reduce((summary, testCase) => {
  summary[testCase.module] = (summary[testCase.module] || 0) + 1;
  return summary;
}, {});

console.log(`Generated Load test cases: ${cases.length}`);
console.log(`Authenticated optional cases: ${stats.authenticatedCases}`);
Object.entries(modules).forEach(([module, count]) => {
  console.log(`- ${module}: ${count}`);
});

if (cases.length < loadConfig.minTestCases) {
  throw new Error(`Expected at least ${loadConfig.minTestCases} load test cases, generated ${cases.length}.`);
}
