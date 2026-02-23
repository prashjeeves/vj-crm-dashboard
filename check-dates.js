const xlsx = require('xlsx');

try {
    const oppsData = xlsx.readFile('./ExcelFiles/Opportunities 20260222.xlsx', { sheetRows: 5000 });
    const sheet = oppsData.Sheets['Data'] || oppsData.Sheets[oppsData.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { defval: null });

    let earliestCreated = new Date('2030-01-01');
    let latestCreated = new Date('1990-01-01');
    let earliestEst = new Date('2030-01-01');
    let latestEst = new Date('1990-01-01');

    let createdYears = {};

    function parseDate(val) {
        if (!val) return null;
        if (typeof val === 'number') {
            return new Date(1899, 11, 30, 0, 0, 0, 0).getTime() + (val * 86400000);
        }
        return new Date(val).getTime();
    }

    for (let row of data) {
        const cDateTs = parseDate(row['Created On']);
        if (cDateTs) {
            const d = new Date(cDateTs);
            if (d < earliestCreated) earliestCreated = d;
            if (d > latestCreated) latestCreated = d;
            const yr = d.getFullYear();
            if (!createdYears[yr]) createdYears[yr] = 0;
            createdYears[yr]++;
        }

        const estDateTs = parseDate(row['Estimated Close Date']);
        if (estDateTs) {
            const d = new Date(estDateTs);
            if (d < earliestEst) earliestEst = d;
            if (d > latestEst) latestEst = d;
        }
    }

    console.log("Creation Date Range:", earliestCreated.toISOString().split('T')[0], "to", latestCreated.toISOString().split('T')[0]);
    console.log("Estimated Close Date Range:", earliestEst.toISOString().split('T')[0], "to", latestEst.toISOString().split('T')[0]);
    console.log("Opportunities by Year Created:", createdYears);

} catch (err) {
    console.error("Failed:", err);
}
