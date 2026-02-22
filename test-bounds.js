const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const oppPath = path.join(__dirname, 'ExcelFiles', 'Opportunities 20260222.xlsx');
const oppBuffer = fs.readFileSync(oppPath);
const oppWorkbook = XLSX.read(oppBuffer, { type: "buffer", cellDates: true });
const oppSheetName = oppWorkbook.SheetNames[0];
const oppSheet = oppWorkbook.Sheets[oppSheetName];

let minR = 10000000, minC = 10000000, maxR = 0, maxC = 0;
for (const key in oppSheet) {
    if (key[0] === '!') continue;
    const upKey = key.toUpperCase();
    if (upKey !== key) {
        oppSheet[upKey] = oppSheet[key];
        delete oppSheet[key];
    }

    try {
        const cell = XLSX.utils.decode_cell(upKey);
        if (cell.r < minR) minR = cell.r;
        if (cell.r > maxR) maxR = cell.r;
        if (cell.c < minC) minC = cell.c;
        if (cell.c > maxC) maxC = cell.c;
    } catch (e) { }
}

const newRef = XLSX.utils.encode_range({ s: { c: minC, r: minR }, e: { c: maxC, r: maxR } });
console.log("Computed ref:", newRef);
oppSheet['!ref'] = newRef;

const rawOpps = XLSX.utils.sheet_to_json(oppSheet);
console.log(`Parsed ${rawOpps.length} opportunities from the computed width.`);
