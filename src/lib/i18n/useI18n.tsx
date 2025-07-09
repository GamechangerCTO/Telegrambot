/**
 * 🌐 Internationalization Hook and Context
 * Manages UI language state and provides translation functions
 */

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, type UILanguage, type Translations } from './translations';

interface I18nContextType {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: Translations;
  availableLanguages: Array<{
    code: UILanguage;
    name: string;
    nativeName: string;
  }>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: UILanguage;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ 
  children, 
  defaultLanguage = 'en' 
}) => {
  const [language, setLanguageState] = useState<UILanguage>(defaultLanguage);

  // Available languages for the UI
  const availableLanguages = [
    { code: 'en' as UILanguage, name: 'English', nativeName: 'English' },
    { code: 'am' as UILanguage, name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'sw' as UILanguage, name: 'Swahili', nativeName: 'Kiswahili' }
  ];

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('ui-language') as UILanguage;
      if (savedLanguage && translations[savedLanguage]) {
        setLanguageState(savedLanguage);
      }
    }
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (lang: UILanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui-language', lang);
    }
  };

  // Get translations for current language
  const t = translations[language];

  const value = {
    language,
    setLanguage,
    t,
    availableLanguages
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use i18n context
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Helper function to get nested translation keys
export const getNestedTranslation = (
  translations: Translations, 
  key: string
): string => {
  const keys = key.split('.');
  let result: any = translations;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof result === 'string' ? result : key;
};