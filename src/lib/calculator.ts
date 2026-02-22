import { AgeBand } from "./types";

/**
 * Deterministically applies open pipeline boolean logic.
 * Excludes Won/Lost.
 */
export function isOpenPipeline(status: string): boolean {
    if (!status) return false;
    const normalized = status.trim().toLowerCase();
    return normalized === 'new' || normalized === 'open';
}

/**
 * Maps dynamic age to deterministic bands
 */
export function getAgeBand(ageDays: number): AgeBand {
    if (ageDays < 0) return '0-30'; // fallback for future dates
    if (ageDays <= 30) return '0-30';
    if (ageDays <= 60) return '31-60';
    if (ageDays <= 90) return '61-90';
    if (ageDays <= 180) return '91-180';
    if (ageDays <= 270) return '181-270';
    if (ageDays <= 365) return '271-365';
    return '365+';
}

/**
 * Currency normalisation module mapping native totals to GBP safely.
 */
export function normalizeCurrency(
    nativeTotal: number,
    currency: string,
    fxRates: Record<string, number> = { GBP: 1.0, USD: 0.8, EUR: 0.85 }
): { valueGbp: number; fxRateUsed: number; } {
    const normCurrency = (currency || 'GBP').toUpperCase().trim();
    const rate = fxRates[normCurrency];

    if (rate === undefined) {
        // If unknown currency, default to 1:1 and flag in data quality if possible
        return { valueGbp: nativeTotal, fxRateUsed: 1 };
    }

    // Deterministic safe multiplication
    const valueGbp = Number((nativeTotal * rate).toFixed(2));
    return { valueGbp, fxRateUsed: rate };
}

/**
 * Calculates weighted probability based on selected modes
 */
export function calculateWeightedValue(
    valueGbp: number,
    stageProb: number | null,
    userProb: number | null,
    mode: 'unweighted' | 'stage' | 'user' | 'blended'
): number {
    if (mode === 'unweighted') return valueGbp;

    if (mode === 'stage') {
        return valueGbp * (stageProb ?? 0);
    }

    if (mode === 'user') {
        return valueGbp * (userProb ?? 0);
    }

    if (mode === 'blended') {
        const s = stageProb ?? 0;
        const u = userProb ?? 0;
        // (0.5 * stage) + (0.5 * user)
        return valueGbp * (0.5 * s + 0.5 * u);
    }

    return valueGbp;
}
