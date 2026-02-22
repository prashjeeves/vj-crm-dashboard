import { parseStageProbability, parseUserProbability } from '../parser';

describe('Deterministic Regex Extractors', () => {
    it('extracts probability successfully from standard Stage string', () => {
        expect(parseStageProbability("(30%) Proposal Sent")).toBe(0.3);
        expect(parseStageProbability("(100%) Won")).toBe(1.0);
        expect(parseStageProbability("(5%) Initial Contact")).toBe(0.05);
    });

    it('returns null when Stage string has no percentage', () => {
        expect(parseStageProbability("Just a generic stage")).toBeNull();
        expect(parseStageProbability("")).toBeNull();
        expect(parseStageProbability(null)).toBeNull();
    });

    it('extracts user defined probability effectively', () => {
        expect(parseUserProbability("20%")).toBe(0.2);
        expect(parseUserProbability(" 50% ")).toBe(0.5);
        expect(parseUserProbability("100")).toBe(1.0); // No percentage sign fallback -> 1.0 (if >= 1)
        expect(parseUserProbability("0.1")).toBe(0.1);
    });
});
