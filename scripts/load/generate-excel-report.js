import { generateLoadExcelReportFromDisk } from '../../utilities/load/excelReportGenerator.js';

const reportPath = await generateLoadExcelReportFromDisk();
console.log(`Load Excel report generated at ${reportPath}`);
