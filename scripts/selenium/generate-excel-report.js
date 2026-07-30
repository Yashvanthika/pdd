import { generateExcelReportFromDisk } from '../../utilities/excelReportGenerator.js';

const reportPath = await generateExcelReportFromDisk();
console.log(`Excel report generated at ${reportPath}`);
