import { runLoadTest } from '../../utilities/load/runner.js';

const { reportPath, snapshot } = await runLoadTest();
console.log(`Load test completed: ${snapshot.summary.total} requests, ${snapshot.summary.executedUniqueCases} unique test cases.`);
console.log(`Passed: ${snapshot.summary.passed}, Failed: ${snapshot.summary.failed}, P95: ${snapshot.summary.p95Ms}ms.`);
console.log(`Excel report generated at ${reportPath}`);
