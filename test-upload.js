const tsNode = require('ts-node');
tsNode.register({ transpileOnly: true });
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function testIngest() {
    try {
        const oppPath = path.join(__dirname, 'ExcelFiles', 'Opportunities 20260222.xlsx');
        const custPath = path.join(__dirname, 'ExcelFiles', 'Customers 20260222.xlsx');

        // Check if files exist
        if (!fs.existsSync(oppPath)) throw new Error('Opp file missing');
        if (!fs.existsSync(custPath)) throw new Error('Cust file missing');

        const oppBuffer = fs.readFileSync(oppPath);
        const custBuffer = fs.readFileSync(custPath);

        const oppWorkbook = XLSX.read(oppBuffer, { type: "buffer", cellDates: true });
        const custWorkbook = XLSX.read(custBuffer, { type: "buffer", cellDates: true });

        console.log("Opp sheets:", oppWorkbook.SheetNames);
        const oppSheetName = oppWorkbook.SheetNames[0];
        const oppSheet = oppWorkbook.Sheets[oppSheetName];
        if (oppSheet['!ref'] && oppSheet['!ref'].match(/^\d+:/)) {
            oppSheet['!ref'] = 'A' + oppSheet['!ref'];
        }
        console.log("Patched Opp ref:", oppSheet['!ref']);
        const rawOpps = XLSX.utils.sheet_to_json(oppSheet);

        console.log("Cust sheets:", custWorkbook.SheetNames);
        const custSheetName = custWorkbook.SheetNames[0];
        const custSheet = custWorkbook.Sheets[custSheetName];
        if (custSheet['!ref'] && custSheet['!ref'].match(/^\d+:/)) {
            custSheet['!ref'] = 'A' + custSheet['!ref'];
        }
        console.log("Patched Cust ref:", custSheet['!ref']);
        const rawCusts = XLSX.utils.sheet_to_json(custSheet);

        console.log(`Parsed ${rawOpps.length} raw opportunities and ${rawCusts.length} raw customers.`);

        const fxRates = { GBP: 1.0, USD: 0.8, EUR: 0.85 };

        // Import the TS ingest module
        const { processPipelineData } = require('./src/lib/ingest.ts');

        console.log("Starting processPipelineData...");
        const { opportunities, report } = processPipelineData(rawOpps, rawCusts, fxRates, {});

        console.log(`Successfully processed ${opportunities.length} opportunities.`);
        console.log(`Report match rate: ${report.joinMatchRate}%`);
    } catch (err) {
        console.error("Test Error:", err);
    }
}

testIngest();
