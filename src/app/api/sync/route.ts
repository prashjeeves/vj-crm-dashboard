import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import * as fs from "fs/promises";
import * as path from "path";
import { processPipelineData } from "@/lib/ingest";
import { saveSnapshot, getLatestSnapshots } from "@/lib/snapshotManager";
import { RawOpportunity, RawCustomer, SnapshotConfig } from "@/lib/types";

export async function POST() {
    try {
        const rootDir = process.cwd();
        const excelDir = path.join(rootDir, "ExcelFiles");

        // Find newest files from directory
        const files = await fs.readdir(excelDir);
        const oppFileName = files.find(f => f.toLowerCase().startsWith("opportunities") && f.endsWith(".xlsx"));
        const custFileName = files.find(f => f.toLowerCase().startsWith("customers") && f.endsWith(".xlsx"));

        if (!oppFileName || !custFileName) {
            return NextResponse.json({ error: "Could not find Opportunities or Customers .xlsx files in the local ExcelFiles folder." }, { status: 404 });
        }

        const oppBuffer = await fs.readFile(path.join(excelDir, oppFileName));
        const custBuffer = await fs.readFile(path.join(excelDir, custFileName));

        // Parse Excel Files
        const oppWorkbook = XLSX.read(oppBuffer, { type: "buffer", cellDates: true });
        const custWorkbook = XLSX.read(custBuffer, { type: "buffer", cellDates: true });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fixSheet = (sheet: any) => {
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
                } catch { }
            }
            if (found && minR <= maxR && minC <= maxC) {
                sheet['!ref'] = XLSX.utils.encode_range({ s: { c: minC, r: minR }, e: { c: maxC, r: maxR } });
            }
        };

        const oppSheet = oppWorkbook.Sheets[oppWorkbook.SheetNames[0]];
        const custSheet = custWorkbook.Sheets[custWorkbook.SheetNames[0]];

        fixSheet(oppSheet);
        fixSheet(custSheet);

        const rawOpps = XLSX.utils.sheet_to_json<RawOpportunity>(oppSheet);
        const rawCusts = XLSX.utils.sheet_to_json<RawCustomer>(custSheet);

        // Basic FX Rates configuration
        const fxRates = { GBP: 1.0, USD: 0.8, EUR: 0.85 };

        // Deterministic Pipeline Processing
        const { opportunities, report } = processPipelineData(rawOpps, rawCusts, fxRates, {});

        // Calculate metrics for snapshotting
        let openPipelineValueGbp = 0;
        let openOpportunityCount = 0;

        const byRegionCount: Record<string, number> = {};
        const byRegionValue: Record<string, number> = {};

        let createdLast7DaysCount = 0; let createdLast7DaysValue = 0;
        let wonLast7DaysCount = 0; let wonLast7DaysValue = 0;
        let lostLast7DaysCount = 0; let lostLast7DaysValue = 0;

        let createdLast30DaysCount = 0; let createdLast30DaysValue = 0;
        let wonLast30DaysCount = 0; let wonLast30DaysValue = 0;
        let lostLast30DaysCount = 0; let lostLast30DaysValue = 0;

        const today = new Date();
        const msIn7Days = 7 * 24 * 60 * 60 * 1000;
        const msIn30Days = 30 * 24 * 60 * 60 * 1000;

        for (const opp of opportunities) {
            if (opp.isOpen) {
                openPipelineValueGbp += opp.valueGbp;
                openOpportunityCount++;

                const region = opp.salesRegion || "Unknown";
                byRegionCount[region] = (byRegionCount[region] || 0) + 1;
                byRegionValue[region] = (byRegionValue[region] || 0) + opp.valueGbp;
            }

            const createdAgeMs = today.getTime() - opp.createdOn.getTime();
            if (createdAgeMs <= msIn7Days) { createdLast7DaysCount++; createdLast7DaysValue += opp.valueGbp; }
            if (createdAgeMs <= msIn30Days) { createdLast30DaysCount++; createdLast30DaysValue += opp.valueGbp; }

            if (opp.status.toLowerCase() === 'won' && opp.estimatedCloseDate) {
                const closedAgeMs = today.getTime() - opp.estimatedCloseDate.getTime();
                if (closedAgeMs <= msIn7Days) { wonLast7DaysCount++; wonLast7DaysValue += opp.valueGbp; }
                if (closedAgeMs <= msIn30Days) { wonLast30DaysCount++; wonLast30DaysValue += opp.valueGbp; }
            }

            if (opp.status.toLowerCase() === 'lost' && opp.estimatedCloseDate) {
                const closedAgeMs = today.getTime() - opp.estimatedCloseDate.getTime();
                if (closedAgeMs <= msIn7Days) { lostLast7DaysCount++; lostLast7DaysValue += opp.valueGbp; }
                if (closedAgeMs <= msIn30Days) { lostLast30DaysCount++; lostLast30DaysValue += opp.valueGbp; }
            }
        }

        // Save Snapshot
        const newSnapshot: SnapshotConfig = {
            timestamp: new Date().toISOString(),
            openPipelineValueGbp, openOpportunityCount,
            createdLast7DaysCount, createdLast7DaysValue,
            wonLast7DaysCount, wonLast7DaysValue,
            lostLast7DaysCount, lostLast7DaysValue,
            createdLast30DaysCount, createdLast30DaysValue,
            wonLast30DaysCount, wonLast30DaysValue,
            lostLast30DaysCount, lostLast30DaysValue,
            byRegionCount, byRegionValue
        };

        await saveSnapshot(newSnapshot);

        const latestSnapshots = await getLatestSnapshots(2);
        const previousSnapshot = latestSnapshots.length > 1 ? latestSnapshots[1] : null;

        return NextResponse.json({
            success: true,
            data: { opportunities, report, currentSnapshot: newSnapshot, previousSnapshot }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error("Local sync error:", error);
        return NextResponse.json({ error: error.message || "Failed to process files." }, { status: 500 });
    }
}
