import { generateMobileTestCases, selectMobileTestCases } from '../../utilities/appium/testCatalog.js';

const cases = generateMobileTestCases();
const selected = selectMobileTestCases(cases);

console.log(`BloodLink Appium catalog: ${cases.length} total cases`);
console.log(`Selected for this run: ${selected.length} cases`);
console.table(
  cases.slice(0, 25).map((testCase) => ({
    Action: testCase.action,
    Auth: testCase.requiresAuth ? 'Yes' : 'No',
    ID: testCase.id,
    Module: testCase.module,
    Priority: testCase.priority,
    Screen: testCase.screen,
  })),
);

if (cases.length < 300) {
  throw new Error(`Expected at least 300 Appium cases, got ${cases.length}`);
}
