import { normalizeCurrency, calculateWeightedValue, isOpenPipeline, getAgeBand } from '../calculator';

describe('Deterministic Currency Normalisation', () => {
    const mockFxRates = { GBP: 1.0, USD: 0.8, EUR: 0.85 };

    it('safely converts USD to GBP', () => {
        const { valueGbp, fxRateUsed } = normalizeCurrency(1000, "USD", mockFxRates);
        expect(fxRateUsed).toBe(0.8);
        expect(valueGbp).toBe(800);
    });

    it('safely handles native GBP without conversion', () => {
        const { valueGbp, fxRateUsed } = normalizeCurrency(1000, "GBP", mockFxRates);
        expect(fxRateUsed).toBe(1.0);
        expect(valueGbp).toBe(1000);
    });

    it('defaults to 1:1 if currency is completely unknown', () => {
        const { valueGbp, fxRateUsed } = normalizeCurrency(1000, "XYZ", mockFxRates);
        expect(fxRateUsed).toBe(1);
        expect(valueGbp).toBe(1000);
    });
});

describe('Weighted Probabilities Rules', () => {
    it('unweighted mode returns pure GBP value', () => {
        expect(calculateWeightedValue(1000, 0.5, 0.2, 'unweighted')).toBe(1000);
    });

    it('stage mode applies stage probability natively', () => {
        expect(calculateWeightedValue(1000, 0.3, 0.8, 'stage')).toBe(300); // 1000 * 0.3
    });

    it('user mode applies user defined probability', () => {
        expect(calculateWeightedValue(1000, 0.5, 0.2, 'user')).toBe(200); // 1000 * 0.2
    });

    it('blended mode evenly splits between stage and user probabilities', () => {
        // Stage 0.5, User 0.1 -> Blended is 0.5(0.5) + 0.5(0.1) = 0.25 + 0.05 = 0.3
        // 1000 * 0.3 = 300
        expect(calculateWeightedValue(1000, 0.5, 0.1, 'blended')).toBe(300);
    });
});

describe('Pipeline Status Rules', () => {
    it('excludes Won and Lost from Open Pipeline', () => {
        expect(isOpenPipeline("Won")).toBe(false);
        expect(isOpenPipeline("Lost")).toBe(false);
        expect(isOpenPipeline("New")).toBe(true);
        expect(isOpenPipeline("Open")).toBe(true);
        expect(isOpenPipeline(" new ")).toBe(true);
    });
});
