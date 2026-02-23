import { format, isValid } from 'date-fns';


/**
 * Extracts numeric percentage inside parentheses from Stage string.
 * e.g. "(30%) Proposal Sent" -> 0.30
 */
export function parseStageProbability(stage: string | null | undefined): number | null {
    if (!stage) return null;
    const match = stage.match(/\((\d+(?:\.\d+)?)%\)/);
    if (match && match[1]) {
        return parseFloat(match[1]) / 100;
    }
    return null;
}

/**
 * Extracts numeric percentage from User Defined Probability string.
 * e.g. "20%" -> 0.20
 */
export function parseUserProbability(prob: string | null | undefined): number | null {
    if (!prob || prob.trim() === '') return null;
    const match = prob.match(/(\d+(?:\.\d+)?)%/);
    if (match && match[1]) {
        return parseFloat(match[1]) / 100;
    }
    // Try extracting just a number as a fallback if no % is present
    const rawNum = parseFloat(prob);
    if (!isNaN(rawNum)) {
        // If someone entered "20" instead of "20%"
        return rawNum > 1 ? rawNum / 100 : rawNum;
    }
    return null;
}

/**
 * Parses Excel dates natively or converts string dates.
 */
export function parseExcelDate(dateInput: string | number | null | undefined): Date | null {
    if (dateInput === null || dateInput === undefined || dateInput === '') return null;
    if (typeof dateInput === 'number') {
        // Excel date epoch is Jan 1 1900. (Wait, JS epoch is Jan 1 1970).
        const excelEpoch = new Date(1899, 11, 30);
        return new Date(excelEpoch.getTime() + dateInput * 86400000);
    }
    const dateObj = new Date(dateInput);
    return isValid(dateObj) ? dateObj : null;
}

/**
 * Gets YYYY-MM formatted string for close month
 */
export function getCloseMonth(dateObj: Date | null): string {
    if (!dateObj || !isValid(dateObj)) return "Unknown";
    return format(dateObj, 'yyyy-MM');
}
