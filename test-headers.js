const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const oppPath = path.join(__dirname, 'ExcelFiles', 'Opportunities 20260222.xlsx');
const custPath = path.join(__dirname, 'ExcelFiles', 'Customers 20260222.xlsx');

const oppWorkbook = XLSX.read(fs.readFileSync(oppPath), { type: "buffer" });
const custWorkbook = XLSX.read(fs.readFileSync(custPath), { type: "buffer" });

const fixSheet = (sheet) => {
    let minR = 10000000, minC = 10000000, maxR = 0, maxC = 0;
    let found = false;
    for (const key in sheet) {
        if (key[0] === '!') continue;
        const upKey = key.toUpperCase();
        if (upKey !== key) {
            sheet[upKey] = sheet[key];
            delete sheet[key];
        }

        try {
            const cell = XLSX.utils.decode_cell(upKey);
            if (cell.r < minR) minR = cell.r;
            if (cell.r > maxR) maxR = cell.r;
            if (cell.c < minC) minC = cell.c;
            if (cell.c > maxC) maxC = cell.c;
            found = true;
        } catch (e) { }
    }
    if (found && minR <= maxR && minC <= maxC) {
        sheet['!ref'] = XLSX.utils.encode_range({ s: { c: minC, r: minR }, e: { c: maxC, r: maxR } });
    }
};

fixSheet(oppWorkbook.Sheets[oppWorkbook.SheetNames[0]]);
fixSheet(custWorkbook.Sheets[custWorkbook.SheetNames[0]]);

const rawOpps = XLSX.utils.sheet_to_json(oppWorkbook.Sheets[oppWorkbook.SheetNames[0]]);
const rawCusts = XLSX.utils.sheet_to_json(custWorkbook.Sheets[custWorkbook.SheetNames[0]]);

console.log("Opp headers:");
console.log(Object.keys(rawOpps[0] || {}));
console.log("\nFirst Opp:");
console.log(rawOpps[0]);

console.log("\nCust headers:");
console.log(Object.keys(rawCusts[0] || {}));
