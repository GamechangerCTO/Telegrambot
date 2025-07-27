/**
 * 🌐 LANGUAGE UTILITIES - Language detection and conversion utilities
 */

export type Language = 'en' | 'am' | 'sw' | 'fr' | 'ar'; // ✅ All 5 supported languages

export interface LanguageInfo {
  code: Language;
  name: string;
  native_name: string;
}

/**
 * Supported languages configuration
 * Based on COMPLETE-REBUILD-PROMPT.md requirements for multi-language support
 */
export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native_name: 'English' },
  { code: 'am', name: 'Amharic', native_name: 'አማርኛ' },
  { code: 'sw', name: 'Swahili', native_name: 'Kiswahili' }
];

/**
 * Get display text for a language code
 * Replaces 8 duplicate implementations across dashboard components
 */
export function getLanguageDisplay(languageCode: string): string {
  const language = LANGUAGES.find(lang => lang.code === languageCode);
  return language ? `${language.name} (${language.native_name})` : languageCode;
}

/**
 * Get language info by code
 */
export function getLanguageInfo(code: Language): LanguageInfo | undefined {
  return LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get all available language codes
 */
export function getLanguageCodes(): Language[] {
  return LANGUAGES.map(lang => lang.code);
}

/**
 * Validate if a language code is supported
 */
export function isValidLanguage(code: string): code is Language {
  return LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get language display options for forms/selects
 */
export function getLanguageOptions() {
  return LANGUAGES.map(lang => ({
    value: lang.code,
    label: `${lang.name} (${lang.native_name})`
  }));
}

/**
 * Get native name for a language
 */
export function getLanguageNativeName(code: Language): string {
  const language = getLanguageInfo(code);
  return language?.native_name || code;
}

/**
 * Get English name for a language
 */
export function getLanguageEnglishName(code: Language): string {
  const language = getLanguageInfo(code);
  return language?.name || code;
}