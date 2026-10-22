import { UI_TEXT } from './data/ui-text.js';

/**
 * Language handling. English is the base language, French the alternative.
 *
 * Any text in js/data can be either a plain string (same in every language)
 * or an object { en: '...', fr: '...' }; tr() picks the current language,
 * falling back to English.
 */
export const LANGUAGES = ['en', 'fr'];
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'portfolio-lang';

let current = DEFAULT_LANGUAGE;
try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(saved)) current = saved;
} catch {
    // Storage unavailable: English for this visit.
}

const listeners = new Set();

export const getLanguage = () => current;

export function setLanguage(language) {
    if (!LANGUAGES.includes(language) || language === current) return;
    current = language;
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // The choice lasts for this visit only.
    }
    document.documentElement.lang = language;
    listeners.forEach((fn) => fn(language));
}

/** fn(language) is called after every language change. */
export const onLanguageChange = (fn) => listeners.add(fn);

/** Picks the current language from a { en, fr } value; plain strings pass through. */
export function tr(value) {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return value;
    return value[current] ?? value[DEFAULT_LANGUAGE] ?? Object.values(value)[0];
}

/** Interface text from js/data/ui-text.js. Extra arguments go to text functions. */
export function ui(key, ...args) {
    const entry = UI_TEXT[current][key] ?? UI_TEXT[DEFAULT_LANGUAGE][key];
    return typeof entry === 'function' ? entry(...args) : entry;
}

/** URL of a project page in the current language (pages read ?lang=). */
export function pageUrl(page) {
    return `${tr(page)}?lang=${current}`;
}

document.documentElement.lang = current;
