import { generateExcelReportFromDisk } from '../../utilities/appium/excelReportGenerator.js';

const reportPath = await generateExcelReportFromDisk();
console.log(`Generated Appium Excel report: ${reportPath}`);
