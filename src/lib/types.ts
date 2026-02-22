export interface RawOpportunity {
    "Opportunity ID": string;
    "Created On": string | number;
    "Account Name": string;
    "Description"?: string;
    "Country / Country Name": string;
    "Country Name"?: string;
    "Country"?: string;
    "Total": number;
    "Status": string;
    "Stage": string;
    "Currency": string;
    "Estimated Close Date": string | number;
    "Owner": string;
    "User Defined Probability": string;
    "Actual Close Date"?: string | number;
    "Reason"?: string;
    "Source"?: string;
}

export interface RawCustomer {
    "Customer ID": string;
    "Customer Name": string;
    "Customer Class"?: string;
    "Sales Region"?: string;
    "Country"?: string;
    "City"?: string;
}

export type AgeBand = '0-30' | '31-60' | '61-90' | '91-180' | '181-270' | '271-365' | '365+';

export interface ParsedOpportunity {
    id: string;
    createdOn: Date;
    accountName: string;
    description: string;
    country: string;
    nativeTotal: number;
    nativeCurrency: string;
    status: string;
    stageOrig: string;
    estimatedCloseDate: Date;
    owner: string;
    userProbOrig: string | null;

    // Computed Deterministic Fields
    isOpen: boolean;
    stageProbability: number | null;
    userProbability: number | null;
    ageDays: number;
    ageBand: AgeBand;
    closeMonth: string; // YYYY-MM

    // Currency
    fxRateUsed: number;
    valueGbp: number;

    // Joining Outcomes
    matchedCustomer: boolean;
    customerClass: string | null;
    salesRegion: string | null;
    customerCity: string | null;

    // Diagnostics
    hasInvalidStageProb: boolean;
    hasInvalidUserProb: boolean;
    hasInvalidDate: boolean;
}

export interface DataQualityReport {
    totalOpportunities: number;
    openOpportunities: number;
    joinMatchRate: number; // percentage
    unmatchedAccounts: string[];
    invalidStageProbRows: string[]; // array of IDs
    invalidUserProbRows: string[]; // array of IDs
    invalidDateRows: string[]; // array of IDs
    currencyConversionIssues: string[]; // array of IDs
    duplicateOpportunityIds: string[]; // array of IDs
}

export interface SnapshotConfig {
    timestamp: string; // ISO
    openPipelineValueGbp: number;
    openOpportunityCount: number;
    createdLast7DaysCount: number;
    createdLast7DaysValue: number;
    wonLast7DaysCount: number;
    wonLast7DaysValue: number;
    lostLast7DaysCount: number;
    lostLast7DaysValue: number;
    createdLast30DaysCount: number;
    createdLast30DaysValue: number;
    wonLast30DaysCount: number;
    wonLast30DaysValue: number;
    lostLast30DaysCount: number;
    lostLast30DaysValue: number;
    byRegionCount: Record<string, number>;
    byRegionValue: Record<string, number>;
}
