import { FactCheckReport } from '../types/factCheck';

const HISTORY_STORAGE_KEY = 'factCheckHistory';
const MAX_HISTORY_ITEMS = 50;

export interface HistoryItem {
    id: string;
    timestamp: string;
    claimText: string;
    report: FactCheckReport;
}

/**
 * Retrieves the entire fact-check history from localStorage.
 * @returns An array of history items, sorted from newest to oldest.
 */
export const getHistory = (): HistoryItem[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_STORAGE_KEY);
        if (!historyJson) return [];
        const history = JSON.parse(historyJson) as HistoryItem[];
        // Sort descending by timestamp
        return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        return [];
    }
};

/**
 * Saves a new fact-check report to the history.
 * @param claimText - The original text that was analyzed.
 * @param report - The fact-check report object.
 */
export const saveReportToHistory = (claimText: string, report: FactCheckReport): void => {
    try {
        const history = getHistory();
        const newItem: HistoryItem = {
            id: `hist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            claimText,
            report,
        };

        const newHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
        console.error("Failed to save report to history", error);
    }
};

/**
 * Clears the entire fact-check history from localStorage.
 */
export const clearHistory = (): void => {
    try {
        localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to clear history", error);
    }
};