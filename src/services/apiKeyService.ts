/**
 * A simple service to manage and check for the existence of API keys stored in localStorage.
 * In a real-world application, these might be managed more securely.
 */

const VITE_GEMINI_API_KEY = 'VITE_GEMINI_API_KEY';
const VITE_NEWSDATA_API_KEY = 'VITE_NEWSDATA_API_KEY';
// Add other keys as needed, e.g., for Serper, Webz.io, etc.
// const VITE_SERPER_API_KEY = 'VITE_SERPER_API_KEY';

/**
 * Retrieves all API keys from localStorage.
 * @returns An object containing the current API keys.
 */
export const getApiKeys = (): Record<string, string> => {
    return {
        gemini: localStorage.getItem(VITE_GEMINI_API_KEY) || '',
        newsdata: localStorage.getItem(VITE_NEWSDATA_API_KEY) || '',
        // serper: localStorage.getItem(VITE_SERPER_API_KEY) || '',
    };
};

/**
 * Saves the provided API keys to localStorage.
 * @param keys - An object with keys like 'gemini', 'newsdata'.
 */
export const saveApiKeys = (keys: Record<string, string>): void => {
    if (keys.gemini !== undefined) {
        localStorage.setItem(VITE_GEMINI_API_KEY, keys.gemini);
    }
    if (keys.newsdata !== undefined) {
        localStorage.setItem(VITE_NEWSDATA_API_KEY, keys.newsdata);
    }
    // if (keys.serper !== undefined) {
    //     localStorage.setItem(VITE_SERPER_API_KEY, keys.serper);
    // }
    // Announce that keys have been updated
    window.dispatchEvent(new Event('apiKeysUpdated'));
};

/**
 * Checks if all essential API keys are provided.
 * @returns `true` if all required keys are present, `false` otherwise.
 */
export const areAllKeysProvided = (): boolean => {
    // For this application, Gemini is essential. Newsdata might be optional.
    const keys = getApiKeys();
    return !!keys.gemini;
};

/**
 * A hook-like function to get a specific API key.
 * This is not a real React hook but mimics the pattern.
 * @param serviceName - The name of the service ('gemini', 'newsdata').
 * @returns The API key for the requested service.
 */
export const getApiKey = (serviceName: 'gemini' | 'newsdata'): string | undefined => {
    const keys = getApiKeys();
    return keys[serviceName];
};