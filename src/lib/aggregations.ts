import { ParsedOpportunity } from "./types";
import { calculateWeightedValue } from "./calculator";

export interface DashboardFilters {
    mode: 'unweighted' | 'stage' | 'user' | 'blended';
    minProbability: number;
    region: string | null;
    customerClass: string | null;
    createdAfter: string | null;
    createdBefore: string | null;
    ageStatus: string | null;
}

export function filterOpportunities(opps: ParsedOpportunity[], filters: DashboardFilters) {
    return opps.filter(o => {
        if (!o.isOpen) return false;

        // Evaluate probability threshold
        let prob = 0;
        if (filters.mode === 'user') prob = o.userProbability ?? 0;
        else if (filters.mode === 'stage') prob = o.stageProbability ?? 0;
        else if (filters.mode === 'blended') prob = (0.5 * (o.stageProbability ?? 0)) + (0.5 * (o.userProbability ?? 0));
        else prob = 1.0; // unweighted always passes probability gate effectively, or maybe we don't filter it.

        // If it's pure unweighted mode, probability thresholds usually don't matter, but if they strictly set a threshold, we check against their max known prob, let's just check stage or user. Let's use Blended for unweighted threshold testing to be safe, or just stage. We will use stage as default.
        const thresholdProb = filters.mode === 'unweighted' ? (o.stageProbability ?? 0) : prob;

        if (thresholdProb < filters.minProbability) return false;

        if (filters.createdAfter) {
            if (new Date(o.createdOn).getTime() < new Date(filters.createdAfter).getTime()) return false;
        }

        if (filters.createdBefore) {
            const endDate = new Date(filters.createdBefore);
            endDate.setHours(23, 59, 59, 999);
            if (new Date(o.createdOn).getTime() > endDate.getTime()) return false;
        }

        if (filters.region && o.salesRegion !== filters.region) return false;
        if (filters.customerClass && o.customerClass !== filters.customerClass) return false;

        if (filters.ageStatus) {
            if (filters.ageStatus === "fresh" && o.ageDays > 90) return false;
            if (filters.ageStatus === "ageing" && (o.ageDays <= 90 || o.ageDays > 180)) return false;
            if (filters.ageStatus === "stale" && o.ageDays <= 180) return false;
            if (filters.ageStatus === "severe" && o.ageDays <= 365) return false;
        }

        return true;
    });
}

export function aggregatePipeline(opps: ParsedOpportunity[], filters: DashboardFilters) {
    let openValue = 0;
    let weightedValue = 0;

    const regionMap = new Map<string, { value: number; count: number }>();
    const classMap = new Map<string, number>();
    const countryMap = new Map<string, { value: number; count: number }>();

    for (const o of opps) {
        openValue += o.valueGbp;
        const wVal = calculateWeightedValue(o.valueGbp, o.stageProbability, o.userProbability, filters.mode);
        weightedValue += wVal;

        // Region Array
        const region = o.salesRegion || "Unknown";
        const currReg = regionMap.get(region) || { value: 0, count: 0 };
        regionMap.set(region, { value: currReg.value + wVal, count: currReg.count + 1 });

        // Class Array
        const cClass = o.customerClass || "Unknown";
        classMap.set(cClass, (classMap.get(cClass) || 0) + wVal);

        // Country Array
        const ctry = o.country || "Unknown";
        const currCtry = countryMap.get(ctry) || { value: 0, count: 0 };
        countryMap.set(ctry, { value: currCtry.value + wVal, count: currCtry.count + 1 });
    }

    // Sort maps for charts
    const byRegion = Array.from(regionMap.entries()).map(([name, data]) => ({ name, value: data.value, count: data.count })).sort((a, b) => b.value - a.value);
    const byClass = Array.from(classMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const byCountry = Array.from(countryMap.entries()).map(([name, data]) => ({ name, value: data.value, count: data.count })).sort((a, b) => b.value - a.value);

    return {
        openPipelineValueGbp: openValue,
        weightedPipelineValue: weightedValue,
        openOpportunityCount: opps.length,
        byRegion,
        byClass,
        byCountry
    };
}
