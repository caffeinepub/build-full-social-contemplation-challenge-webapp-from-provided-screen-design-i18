import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type LanguageCode, type TranslationKey, getLanguageDirection, isValidLanguageCode } from './translations';

const STORAGE_KEY = 'app-language';

interface I18nContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  direction: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return the key if not found
    }
  }
  
  return typeof result === 'string' ? result : path;
}

function getStoredLanguage(): LanguageCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidLanguageCode(stored)) {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'en';
}

function setStoredLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (error) {
    console.error('Failed to store language preference:', error);
  }
}

/**
 * Updates the document direction and language attributes.
 */
function updateDocumentDirection(lang: LanguageCode): void {
  const direction = getLanguageDirection(lang);
  document.documentElement.dir = direction;
  document.documentElement.lang = lang;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getStoredLanguage());
  const direction = getLanguageDirection(language);

  // Set initial document direction on mount
  useEffect(() => {
    updateDocumentDirection(language);
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    setStoredLanguage(lang);
    updateDocumentDirection(lang);
  };

  const t = (key: string): string => {
    return getNestedValue(translations[language], key);
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
