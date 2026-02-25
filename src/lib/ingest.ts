import { differenceInDays } from "date-fns";
import {
    getAgeBand,
    isOpenPipeline,
    normalizeCurrency
} from "./calculator";
import {
    getCloseMonth,
    parseExcelDate,
    parseStageProbability,
    parseUserProbability
} from "./parser";
import {
    DataQualityReport,
    ParsedOpportunity,
    RawCustomer,
    RawOpportunity
} from "./types";

export function processPipelineData(
    rawOpps: RawOpportunity[],
    rawCustomers: RawCustomer[],
    fxRates: Record<string, number>,
    aliasMap: Record<string, string> = {}
): { opportunities: ParsedOpportunity[], report: DataQualityReport } {

    // Build customer lookup map for fast join
    const customerMap = new Map<string, RawCustomer>();
    for (const c of rawCustomers) {
        if (c["Customer Name"]) {
            customerMap.set(c["Customer Name"].trim().toLowerCase(), c);
        }
    }

    const report: DataQualityReport = {
        totalOpportunities: rawOpps.length,
        openOpportunities: 0,
        joinMatchRate: 0,
        unmatchedAccounts: [],
        invalidStageProbRows: [],
        invalidUserProbRows: [],
        invalidDateRows: [],
        currencyConversionIssues: [],
        duplicateOpportunityIds: []
    };

    const opportunities: ParsedOpportunity[] = [];
    const idSet = new Set<string>();
    let matchCount = 0;

    // We need a stable reference for "Today" so WoW ageing doesn't infinitely shift on older snapshots.
    // For the active run, we use the server's today. For saved snapshots, we wouldn't re-run this.
    const today = new Date();

    for (const raw of rawOpps) {
        const id = raw["Opportunity ID"];
        if (idSet.has(id)) {
            report.duplicateOpportunityIds.push(id);
            continue;
        }
        idSet.add(id);

        // DATES
        const createdOn = parseExcelDate(raw["Created On"]);
        const estimatedCloseDate = parseExcelDate(raw["Estimated Close Date"]);

        const hasInvalidDate = !createdOn || !estimatedCloseDate;
        if (hasInvalidDate) {
            report.invalidDateRows.push(id);
        }

        // PROBABILITIES
        const stageProb = parseStageProbability(raw["Stage"]);
        const userProb = parseUserProbability(raw["User Defined Probability"]);

        const hasInvalidStageProb = raw["Stage"] && stageProb === null;
        if (hasInvalidStageProb) report.invalidStageProbRows.push(id);

        const hasInvalidUserProb = raw["User Defined Probability"] && raw["User Defined Probability"].trim() !== '' && userProb === null;
        if (hasInvalidUserProb) report.invalidUserProbRows.push(id);

        // CURRENCY
        const { valueGbp, fxRateUsed } = normalizeCurrency(raw["Total"], raw["Currency"], fxRates);
        if (fxRateUsed === 1 && raw["Currency"] && raw["Currency"].toUpperCase() !== "GBP") {
            report.currencyConversionIssues.push(id);
        }

        // STATUS - Open Pipeline Business Logic
        const isOpen = isOpenPipeline(raw["Status"]);
        if (isOpen) report.openOpportunities++;

        // AGEING
        let ageDays = 0;
        if (createdOn) {
            ageDays = differenceInDays(today, createdOn);
        }
        const ageBand = getAgeBand(ageDays);
        const closeMonth = getCloseMonth(estimatedCloseDate);

        // JOIN Logic
        const accountName = raw["Account Name"] || "";
        let lookupName = accountName.trim().toLowerCase();

        // Check fallback alias map
        if (aliasMap[lookupName]) {
            lookupName = aliasMap[lookupName].trim().toLowerCase();
        }

        const customerMatch = customerMap.get(lookupName);
        let matchedCustomer = false;
        let customerClass = null;
        let salesRegion = null;
        let customerCity = null;
        let customerCreatedDate: string | null = null;

        if (customerMatch) {
            matchedCustomer = true;
            customerClass = customerMatch["Customer Class"] || null;
            salesRegion = customerMatch["Sales Region"] || null;
            customerCity = customerMatch["City"] || null;
            matchCount++;

            const rawCustCD = customerMatch["Created On"];
            if (rawCustCD) {
                let parsedDate = null;
                if (typeof rawCustCD === 'object' && Object.prototype.toString.call(rawCustCD) === '[object Date]') {
                    parsedDate = (rawCustCD as unknown as Date).toISOString().split('T')[0];
                } else if (typeof rawCustCD === 'string') {
                    parsedDate = rawCustCD.split(' ')[0];
                } else if (typeof rawCustCD === 'number') {
                    const asDate = parseExcelDate(rawCustCD);
                    if (asDate) parsedDate = asDate.toISOString().split('T')[0];
                }

                // Exclude the mass migration date: 2023-08-24
                if (parsedDate && parsedDate !== '2023-08-24') {
                    customerCreatedDate = parsedDate;
                }
            }
        } else {
            if (!report.unmatchedAccounts.includes(accountName)) {
                report.unmatchedAccounts.push(accountName);
            }
        }

        // Country Name Aliasing
        let parsedCountry = (raw["Country Name"] || raw["Country"] || "").trim();
        const countryUpper = parsedCountry.toUpperCase();

        if (["UNITED KINGDOM", "UNITED KINGDOM OF GREAT BRITAIN AND NORTHERN IRELAND", "GREAT BRITAIN", "ENGLAND", "SCOTLAND", "WALES", "NORTHERN IRELAND"].includes(countryUpper)) {
            parsedCountry = "UK";
        } else if (["UNITED STATES", "UNITED STATES OF AMERICA", "US"].includes(countryUpper)) {
            parsedCountry = "USA";
        } else if (["UNITED ARAB EMIRATES"].includes(countryUpper)) {
            parsedCountry = "UAE";
        } else if (["SOUTH KOREA", "REPUBLIC OF KOREA", "KOREA, REPUBLIC OF", "KOREA"].includes(countryUpper)) {
            parsedCountry = "Korea";
        }

        // Construct final parsed object
        opportunities.push({
            id,
            createdOn: createdOn || new Date(0),
            accountName,
            description: raw["Description"] || "",
            country: parsedCountry,
            nativeTotal: raw["Total"],
            nativeCurrency: raw["Currency"],
            status: raw["Status"],
            stageOrig: raw["Stage"] || "",
            estimatedCloseDate: estimatedCloseDate || new Date(0),
            owner: raw["Owner"] || "",
            userProbOrig: raw["User Defined Probability"] || null,

            isOpen,
            stageProbability: stageProb,
            userProbability: userProb,
            ageDays,
            ageBand,
            closeMonth,

            fxRateUsed,
            valueGbp,

            matchedCustomer,
            customerClass,
            salesRegion,
            customerCity,
            customerCreatedDate,

            hasInvalidStageProb: !!hasInvalidStageProb,
            hasInvalidUserProb: !!hasInvalidUserProb,
            hasInvalidDate
        });
    }

    // Finalize report
    report.joinMatchRate = rawOpps.length > 0 ? (matchCount / rawOpps.length) * 100 : 0;

    return { opportunities, report };
}
